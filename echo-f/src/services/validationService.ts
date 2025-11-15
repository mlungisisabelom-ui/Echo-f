import fs from 'fs-extra';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  securityIssues: string[];
}

class ValidationService {
  async validateCode(files: { filename: string; content: string; language: string }[], stack: string): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      securityIssues: []
    };

    try {
      // Create temporary directory for validation
      const tempDir = path.join(process.cwd(), 'temp-validation', Date.now().toString());
      await fs.ensureDir(tempDir);

      // Write files to temp directory
      for (const file of files) {
        const filePath = path.join(tempDir, file.filename);
        await fs.ensureDir(path.dirname(filePath));
        await fs.writeFile(filePath, file.content);
      }

      // Run validation based on stack
      await this.runStackSpecificValidation(tempDir, stack, result);

      // Run security scan
      await this.runSecurityScan(tempDir, result);

      // Cleanup
      await fs.remove(tempDir);

    } catch (error) {
      result.isValid = false;
      result.errors.push(`Validation failed: ${error.message}`);
    }

    return result;
  }

  private async runStackSpecificValidation(tempDir: string, stack: string, result: ValidationResult): Promise<void> {
    switch (stack) {
      case 'react':
      case 'vue':
      case 'angular':
      case 'node':
      case 'react-native':
      case 'electron':
        await this.validateJavaScript(tempDir, result);
        break;
      case 'python':
        await this.validatePython(tempDir, result);
        break;
      case 'html-css-js':
        await this.validateHTML(tempDir, result);
        break;
      case 'node-react-fullstack':
        await this.validateFullStack(tempDir, result);
        break;
      default:
        result.warnings.push(`No specific validation available for stack: ${stack}`);
    }
  }

  private async validateJavaScript(tempDir: string, result: ValidationResult): Promise<void> {
    try {
      // Check for package.json
      const packageJsonPath = path.join(tempDir, 'package.json');
      if (!await fs.pathExists(packageJsonPath)) {
        result.errors.push('Missing package.json file');
        return;
      }

      const packageJson = await fs.readJson(packageJsonPath);

      // Validate package.json structure
      if (!packageJson.name || !packageJson.version) {
        result.errors.push('Invalid package.json: missing name or version');
      }

      // Check for syntax errors in JS files
      const jsFiles = await this.findFiles(tempDir, ['.js', '.jsx', '.ts', '.tsx']);
      for (const file of jsFiles) {
        await this.checkJavaScriptSyntax(file, result);
      }

    } catch (error) {
      result.errors.push(`JavaScript validation failed: ${error.message}`);
    }
  }

  private async validatePython(tempDir: string, result: ValidationResult): Promise<void> {
    try {
      const pyFiles = await this.findFiles(tempDir, ['.py']);
      for (const file of pyFiles) {
        await this.checkPythonSyntax(file, result);
      }

      // Check for requirements.txt
      const requirementsPath = path.join(tempDir, 'requirements.txt');
      if (!await fs.pathExists(requirementsPath)) {
        result.warnings.push('Missing requirements.txt file');
      }
    } catch (error) {
      result.errors.push(`Python validation failed: ${error.message}`);
    }
  }

  private async validateHTML(tempDir: string, result: ValidationResult): Promise<void> {
    try {
      const htmlFiles = await this.findFiles(tempDir, ['.html']);
      for (const file of htmlFiles) {
        await this.checkHTMLStructure(file, result);
      }
    } catch (error) {
      result.errors.push(`HTML validation failed: ${error.message}`);
    }
  }

  private async validateFullStack(tempDir: string, result: ValidationResult): Promise<void> {
    // Check for both frontend and backend directories
    const frontendDir = path.join(tempDir, 'frontend');
    const backendDir = path.join(tempDir, 'backend');

    if (!await fs.pathExists(frontendDir)) {
      result.errors.push('Missing frontend directory for full-stack project');
    }

    if (!await fs.pathExists(backendDir)) {
      result.errors.push('Missing backend directory for full-stack project');
    }

    // Validate both parts
    if (await fs.pathExists(frontendDir)) {
      await this.validateJavaScript(frontendDir, result);
    }

    if (await fs.pathExists(backendDir)) {
      await this.validateJavaScript(backendDir, result);
    }
  }

  private async checkJavaScriptSyntax(filePath: string, result: ValidationResult): Promise<void> {
    try {
      // Use Node.js to check syntax
      await execAsync(`node --check "${filePath}"`);
    } catch (error: any) {
      result.errors.push(`Syntax error in ${path.basename(filePath)}: ${error.stderr || error.message}`);
    }
  }

  private async checkPythonSyntax(filePath: string, result: ValidationResult): Promise<void> {
    try {
      await execAsync(`python -m py_compile "${filePath}"`);
    } catch (error: any) {
      result.errors.push(`Syntax error in ${path.basename(filePath)}: ${error.stderr || error.message}`);
    }
  }

  private async checkHTMLStructure(filePath: string, result: ValidationResult): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');

      // Basic HTML validation
      if (!content.includes('<html>') && !content.includes('<!DOCTYPE html>')) {
        result.warnings.push(`${path.basename(filePath)}: Missing DOCTYPE or html tag`);
      }

      if (!content.includes('<head>')) {
        result.warnings.push(`${path.basename(filePath)}: Missing head tag`);
      }

      if (!content.includes('<body>')) {
        result.warnings.push(`${path.basename(filePath)}: Missing body tag`);
      }
    } catch (error: any) {
      result.errors.push(`HTML validation failed for ${path.basename(filePath)}: ${error.message}`);
    }
  }

  private async runSecurityScan(tempDir: string, result: ValidationResult): Promise<void> {
    try {
      // Check for common security issues
      const allFiles = await this.findFiles(tempDir, ['.js', '.ts', '.jsx', '.tsx', '.py', '.html']);

      for (const file of allFiles) {
        const content = await fs.readFile(file, 'utf-8');

        // Check for dangerous patterns
        if (content.includes('eval(')) {
          result.securityIssues.push(`${path.basename(file)}: Use of eval() detected - security risk`);
        }

        if (content.includes('innerHTML')) {
          result.warnings.push(`${path.basename(file)}: Use of innerHTML detected - consider using textContent or createElement`);
        }

        if (content.includes('document.write')) {
          result.securityIssues.push(`${path.basename(file)}: Use of document.write detected - security risk`);
        }

        // Check for hardcoded secrets
        const secretPatterns = [
          /password\s*[:=]\s*['"][^'"]*['"]/i,
          /api[_-]?key\s*[:=]\s*['"][^'"]*['"]/i,
          /secret\s*[:=]\s*['"][^'"]*['"]/i
        ];

        for (const pattern of secretPatterns) {
          if (pattern.test(content)) {
            result.securityIssues.push(`${path.basename(file)}: Potential hardcoded secret detected`);
          }
        }
      }
    } catch (error: any) {
      result.warnings.push(`Security scan failed: ${error.message}`);
    }
  }

  private async findFiles(dir: string, extensions: string[]): Promise<string[]> {
    const files: string[] = [];

    async function scan(currentDir: string) {
      const items = await fs.readdir(currentDir);

      for (const item of items) {
        const itemPath = path.join(currentDir, item);
        const stat = await fs.stat(itemPath);

        if (stat.isDirectory()) {
          await scan(itemPath);
        } else if (extensions.some(ext => item.endsWith(ext))) {
          files.push(itemPath);
        }
      }
    }

    await scan(dir);
    return files;
  }
}

export default new ValidationService();
