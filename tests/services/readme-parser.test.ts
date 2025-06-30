import { describe, it, expect, beforeEach } from 'vitest';
import { ReadmeParser } from '../../src/services/readme-parser.js';

describe('ReadmeParser', () => {
  let parser: ReadmeParser;

  beforeEach(() => {
    parser = new ReadmeParser();
  });

  describe('parseUsageExamples', () => {
    it('should return empty array when includeExamples is false', () => {
      const readme = '# Usage\n```js\nconsole.log("hello");\n```';
      const result = parser.parseUsageExamples(readme, false);
      expect(result).toEqual([]);
    });

    it('should return empty array for empty content', () => {
      const result = parser.parseUsageExamples('', true);
      expect(result).toEqual([]);
    });

    it('should extract basic code blocks', () => {
      const readme = `
# Usage

\`\`\`javascript
const lib = require('my-lib');
console.log(lib.hello());
\`\`\`
      `;

      const result = parser.parseUsageExamples(readme, true);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        title: 'Example 1',
        code: `const lib = require('my-lib');\nconsole.log(lib.hello());`,
        language: 'javascript',
      });
    });

    it('should limit to 5 examples', () => {
      const codeBlocks = Array(10).fill(0).map((_, i) => `\`\`\`js\ncode${i}\n\`\`\``).join('\n\n');
      const readme = `# Usage\n\n${codeBlocks}`;
      
      const result = parser.parseUsageExamples(readme, true);
      expect(result).toHaveLength(5);
    });
  });

  describe('cleanMarkdown', () => {
    it('should remove images and links', () => {
      const markdown = '![Badge](url) [Link](url) Text';
      const result = parser.cleanMarkdown(markdown);
      expect(result).toBe('Badge Link Text');
    });

    it('should clean excessive whitespace', () => {
      const markdown = 'Text\n\n\n\nMore text';
      const result = parser.cleanMarkdown(markdown);
      expect(result).toBe('Text\n\nMore text');
    });
  });

  describe('extractDescription', () => {
    it('should extract first meaningful line', () => {
      const markdown = '# Title\n\nThis is a description.\n\nMore content.';
      const result = parser.extractDescription(markdown);
      expect(result).toBe('This is a description.');
    });

    it('should skip headers and images', () => {
      const markdown = '# Title\n![Image](url)\n\nActual description here.';
      const result = parser.extractDescription(markdown);
      expect(result).toBe('Actual description here.');
    });

    it('should return default for no description', () => {
      const markdown = '# Title\n## Subtitle\n![Image](url)';
      const result = parser.extractDescription(markdown);
      expect(result).toBe('No description available');
    });
  });
});