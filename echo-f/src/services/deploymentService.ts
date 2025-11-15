import Docker from 'dockerode';
import fs from 'fs-extra';
import path from 'path';
import archiver from 'archiver';
import { createWriteStream } from 'fs';

interface DeploymentOptions {
  stack: string;
  output: 'preview' | 'deploy' | 'download';
  files: { filename: string; content: string; language: string }[];
}

interface DeploymentResult {
  deploymentUrl?: string;
  downloadUrl?: string;
  previewUrl?: string;
  gitCommitHash?: string;
}

class DeploymentService {
  private docker: Docker;

  constructor() {
    this.docker = new Docker();
  }

  async deploy(options: DeploymentOptions): Promise<DeploymentResult> {
    const { stack, output, files } = options;

    switch (output) {
      case 'preview':
        return await this.createPreview(files, stack);
      case 'deploy':
        return await this.deployToProduction(files, stack);
      case 'download':
        return await this.createDownload(files, stack);
      default:
        throw new Error(`Unsupported output type: ${output}`);
    }
  }

  private async createPreview(files: any[], stack: string): Promise<DeploymentResult> {
    // Simulate rapid deployment for preview
    const previewId = `preview-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // In production, this would create a temporary container
    // For now, simulate with a delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      previewUrl: `https://preview.echo-f.com/${previewId}`,
      gitCommitHash: this.generateCommitHash()
    };
  }

  private async deployToProduction(files: any[], stack: string): Promise<DeploymentResult> {
    const deploymentId = `deploy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Create deployment directory
      const deployDir = path.join(process.cwd(), 'deployments', deploymentId);
      await fs.ensureDir(deployDir);

      // Write files
      for (const file of files) {
        const filePath = path.join(deployDir, file.filename);
        await fs.ensureDir(path.dirname(filePath));
        await fs.writeFile(filePath, file.content);
      }

      // Create Dockerfile based on stack
      const dockerfile = this.generateDockerfile(stack);
      await fs.writeFile(path.join(deployDir, 'Dockerfile'), dockerfile);

      // Build and run container
      const imageTag = `echo-f-${deploymentId}`;
      await this.buildDockerImage(deployDir, imageTag);
      const container = await this.runDockerContainer(imageTag, deploymentId);

      return {
        deploymentUrl: `https://${deploymentId}.echo-f.com`,
        gitCommitHash: this.generateCommitHash()
      };

    } catch (error) {
      console.error('Deployment failed: - deploymentService.ts:86', error);
      throw new Error('Deployment failed');
    }
  }

  private async createDownload(files: any[], stack: string): Promise<DeploymentResult> {
    const downloadId = `download-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const zipPath = path.join(process.cwd(), 'downloads', `${downloadId}.zip`);

    try {
      await fs.ensureDir(path.dirname(zipPath));

      // Create zip archive
      const output = createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      return new Promise((resolve, reject) => {
        output.on('close', () => {
          resolve({
            downloadUrl: `https://downloads.echo-f.com/${downloadId}.zip`,
            gitCommitHash: this.generateCommitHash()
          });
        });

        archive.on('error', reject);
        archive.pipe(output);

        // Add files to archive
        for (const file of files) {
          archive.append(file.content, { name: file.filename });
        }

        // Add README
        const readme = this.generateReadme(stack);
        archive.append(readme, { name: 'README.md' });

        // Add installation script
        const installScript = this.generateInstallScript(stack);
        archive.append(installScript, { name: 'install.sh' });

        archive.finalize();
      });

    } catch (error) {
      console.error('Download creation failed: - deploymentService.ts:130', error);
      throw new Error('Download creation failed');
    }
  }

  private generateDockerfile(stack: string): string {
    const dockerfiles: { [key: string]: string } = {
      'react': `FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]`,

      'vue': `FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 8080
CMD ["npm", "run", "serve"]`,

      'node': `FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]`,

      'python': `FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["python", "app.py"]`,

      'html-css-js': `FROM nginx:alpine
COPY . /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]`,

      'node-react-fullstack': `FROM node:18-alpine
WORKDIR /app

# Copy backend
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci --only=production

# Copy frontend
WORKDIR /app
COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm ci --only=production && npm run build

# Copy all files
WORKDIR /app
COPY . .

# Expose ports
EXPOSE 3000 3001

# Start both services
CMD ["npm", "run", "dev"]`
    };

    return dockerfiles[stack] || dockerfiles['node'];
  }

  private async buildDockerImage(context: string, tag: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.docker.buildImage({
        context,
        src: ['.'],
      }, { t: tag }, (err, stream) => {
        if (err) return reject(err);

        this.docker.modem.followProgress(stream, (err, output) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });
  }

  private async runDockerContainer(imageTag: string, containerName: string): Promise<any> {
    const container = await this.docker.createContainer({
      Image: imageTag,
      name: containerName,
      ExposedPorts: {
        '3000/tcp': {},
        '80/tcp': {},
        '8000/tcp': {}
      },
      HostConfig: {
        PortBindings: {
          '3000/tcp': [{ HostPort: '0' }],
          '80/tcp': [{ HostPort: '0' }],
          '8000/tcp': [{ HostPort: '0' }]
        }
      }
    });

    await container.start();
    return container;
  }

  private generateCommitHash(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private generateReadme(stack: string): string {
    return `# Generated by EchoF AI - Powered by Mlungisi

## Project Overview
This project was generated using EchoF's AI-powered code generation platform.

## Technology Stack
- **Framework**: ${stack}

## Getting Started
1. Extract the downloaded files
2. Run the installation script: \`./install.sh\`
3. Follow the on-screen instructions

## Features
- Modern development practices
- Clean code structure
- Production-ready setup

## Support
For support, visit [EchoF Platform](https://echo-f.com)

---
*Generated on: ${new Date().toISOString()}*`;
  }

  private generateInstallScript(stack: string): string {
    const scripts: { [key: string]: string } = {
      'react': `#!/bin/bash
echo "Installing React application..."
npm install
echo "Installation complete! Run 'npm start' to start the development server."`,

      'vue': `#!/bin/bash
echo "Installing Vue.js application..."
npm install
echo "Installation complete! Run 'npm run serve' to start the development server."`,

      'node': `#!/bin/bash
echo "Installing Node.js application..."
npm install
echo "Installation complete! Run 'node server.js' to start the server."`,

      'python': `#!/bin/bash
echo "Installing Python application..."
pip install -r requirements.txt
echo "Installation complete! Run 'python app.py' to start the application."`,

      'html-css-js': `#!/bin/bash
echo "HTML/CSS/JS project ready!"
echo "Open index.html in your web browser to view the application."`,

      'node-react-fullstack': `#!/bin/bash
echo "Installing full-stack application..."
cd backend && npm install
cd ../frontend && npm install
cd ..
echo "Installation complete! Run 'npm run dev' to start both frontend and backend."`
    };

    return scripts[stack] || '# Installation script not available for this stack';
  }
}

export default new DeploymentService();
