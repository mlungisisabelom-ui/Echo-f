import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface GeneratedFile {
  filename: string;
  content: string;
  language: string;
}

interface GenerationResult {
  files: GeneratedFile[];
  documentation?: string;
  installationScript?: string;
}

class LLMService {
  private openai: OpenAI | null = null;
  private gemini: GoogleGenerativeAI | null = null;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }

    if (process.env.GEMINI_API_KEY) {
      this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
  }

  async generateCode(prompt: string, stack: string, output: string): Promise<GenerationResult> {
    const systemPrompt = this.getSystemPrompt(stack, output);

    try {
      if (this.openai) {
        return await this.generateWithOpenAI(prompt, systemPrompt, stack);
      } else if (this.gemini) {
        return await this.generateWithGemini(prompt, systemPrompt, stack);
      } else {
        throw new Error('No AI provider configured');
      }
    } catch (error) {
      console.error('AI generation error: - llmService.ts:44', error);
      throw new Error('Failed to generate code');
    }
  }

  private getSystemPrompt(stack: string, output: string): string {
    const basePrompt = `You are an expert software developer. Generate clean, production-ready code that follows best practices and security standards.

IMPORTANT: Return ONLY valid, runnable code. Do not include any explanatory text, comments about the code, or markdown formatting unless it's part of the actual code.

For ${stack} projects, ensure:
- Modern coding standards and best practices
- Proper error handling
- Security considerations
- Clean, readable code structure
- Appropriate dependencies and imports`;

    if (output === 'preview') {
      return `${basePrompt}

Generate a simple, functional example that demonstrates the core features. Keep it minimal but complete.`;
    }

    return basePrompt;
  }

  private async generateWithOpenAI(prompt: string, systemPrompt: string, stack: string): Promise<GenerationResult> {
    if (!this.openai) throw new Error('OpenAI not configured');

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      max_tokens: 4000,
      temperature: 0.3
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('No content generated');

    return this.parseGeneratedContent(content, stack);
  }

  private async generateWithGemini(prompt: string, systemPrompt: string, stack: string): Promise<GenerationResult> {
    if (!this.gemini) throw new Error('Gemini not configured');

    const model = this.gemini.getGenerativeModel({ model: 'gemini-pro' });

    const result = await model.generateContent([
      systemPrompt,
      prompt
    ]);

    const content = result.response.text();
    if (!content) throw new Error('No content generated');

    return this.parseGeneratedContent(content, stack);
  }

  private parseGeneratedContent(content: string, stack: string): GenerationResult {
    // This is a simplified parser - in production, you'd want more robust parsing
    const files: GeneratedFile[] = [];

    // For now, assume single file generation
    // In production, you'd parse multi-file outputs
    const language = this.getLanguageFromStack(stack);

    files.push({
      filename: this.getDefaultFilename(stack),
      content: content.trim(),
      language
    });

    return {
      files,
      documentation: this.generateDocumentation(content, stack),
      installationScript: this.generateInstallationScript(stack)
    };
  }

  private getLanguageFromStack(stack: string): string {
    const stackMap: { [key: string]: string } = {
      'react': 'javascript',
      'vue': 'javascript',
      'angular': 'typescript',
      'node': 'javascript',
      'python': 'python',
      'html-css-js': 'html',
      'react-native': 'javascript',
      'electron': 'javascript',
      'node-react-fullstack': 'javascript'
    };

    return stackMap[stack] || 'javascript';
  }

  private getDefaultFilename(stack: string): string {
    const filenameMap: { [key: string]: string } = {
      'react': 'App.jsx',
      'vue': 'App.vue',
      'angular': 'app.component.ts',
      'node': 'server.js',
      'python': 'app.py',
      'html-css-js': 'index.html',
      'react-native': 'App.js',
      'electron': 'main.js',
      'node-react-fullstack': 'package.json'
    };

    return filenameMap[stack] || 'app.js';
  }

  private generateDocumentation(content: string, stack: string): string {
    return `# Generated by EchoF AI - Powered by Mlungisi

## Project Overview
This project was generated using EchoF's AI-powered code generation platform.

## Technology Stack
- **Framework**: ${stack}

## Getting Started
1. Install dependencies
2. Run the development server
3. Open your browser to view the application

## Features
- Modern development practices
- Clean code structure
- Production-ready setup

## Generated Files
- Main application file
- Configuration files
- Dependencies and scripts

For more information, visit [EchoF Platform](https://echo-f.com)`;
  }

  private generateInstallationScript(stack: string): string {
    const scripts: { [key: string]: string } = {
      'react': `#!/bin/bash
npm install
npm start`,
      'vue': `#!/bin/bash
npm install
npm run serve`,
      'angular': `#!/bin/bash
npm install
ng serve`,
      'node': `#!/bin/bash
npm install
node server.js`,
      'python': `#!/bin/bash
pip install -r requirements.txt
python app.py`,
      'html-css-js': `#!/bin/bash
# No installation needed - open index.html in browser`,
      'react-native': `#!/bin/bash
npm install
npx react-native run-android`,
      'electron': `#!/bin/bash
npm install
npm start`,
      'node-react-fullstack': `#!/bin/bash
cd backend && npm install
cd ../frontend && npm install
cd ..
npm run dev`
    };

    return scripts[stack] || '# Installation script not available for this stack';
  }
}

export default new LLMService();
