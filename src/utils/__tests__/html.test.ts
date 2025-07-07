import { stripHtml, extractTextFromHtmlArray } from '../html';

describe('HTML utilities', () => {
  describe('stripHtml', () => {
    it('should strip simple HTML tags', () => {
      expect(stripHtml('<p>Hello World</p>')).toBe('Hello World');
    });

    it('should strip nested HTML tags', () => {
      expect(stripHtml('<p><em>Hello</em> <strong>World</strong></p>')).toBe('Hello World');
    });

    it('should handle HTML entities', () => {
      expect(stripHtml('<p>Hello &amp; World</p>')).toBe('Hello & World');
    });

    it('should handle emojis', () => {
      expect(stripHtml('<p><em>How can I ensure I never miss a dose? ⏰</em></p>')).toBe('How can I ensure I never miss a dose? ⏰');
    });

    it('should handle empty strings', () => {
      expect(stripHtml('')).toBe('');
    });

    it('should handle plain text', () => {
      expect(stripHtml('Just plain text')).toBe('Just plain text');
    });
  });

  describe('extractTextFromHtmlArray', () => {
    it('should extract text from array of HTML strings', () => {
      const htmlArray = [
        '<p><em>How can I ensure I never miss a dose? ⏰</em></p>',
        '<p><em>What should I do if I forget to take a dose? 💬</em></p>'
      ];
      
      const result = extractTextFromHtmlArray(htmlArray);
      
      expect(result).toEqual([
        'How can I ensure I never miss a dose? ⏰',
        'What should I do if I forget to take a dose? 💬'
      ]);
    });

    it('should handle empty array', () => {
      expect(extractTextFromHtmlArray([])).toEqual([]);
    });

    it('should handle mixed content', () => {
      const htmlArray = [
        'Plain text',
        '<p>HTML text</p>',
        '<div><span>Nested</span> content</div>'
      ];
      
      const result = extractTextFromHtmlArray(htmlArray);
      
      expect(result).toEqual([
        'Plain text',
        'HTML text',
        'Nested content'
      ]);
    });
  });
});