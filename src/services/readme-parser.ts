import { UsageExample } from '../types/index.js';

export class ReadmeParser {
  parseUsageExamples(readmeContent: string, includeExamples: boolean = true): UsageExample[] {
    if (!includeExamples || !readmeContent) {
      return [];
    }

    // Simple code block extraction
    const codeBlocks = readmeContent.match(/```(\w+)?\n([\s\S]*?)```/g) || [];
    
    return codeBlocks.slice(0, 5).map((block, index) => {
      const languageMatch = block.match(/```(\w+)/);
      const codeMatch = block.replace(/```\w*\n?|\n?```/g, '').trim();
      
      return {
        title: `Example ${index + 1}`,
        code: codeMatch,
        language: languageMatch?.[1] || 'text'
      };
    });
  }

  cleanMarkdown(content: string): string {
    return content
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1') // Remove images, keep alt text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // Remove links, keep text
      .replace(/\n{3,}/g, '\n\n')              // Clean excessive whitespace
      .trim();
  }

  extractDescription(content: string): string {
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length > 20 && !trimmed.startsWith('#') && !trimmed.startsWith('![')) {
        return trimmed;
      }
    }
    
    return 'No description available';
  }
}

export const readmeParser = new ReadmeParser();