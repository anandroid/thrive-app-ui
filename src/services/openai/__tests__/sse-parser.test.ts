import { parseSSEMessage, SSEParser } from '../sse-parser';

describe('SSE Parser', () => {
  describe('parseSSEMessage', () => {
    it('should parse thread_created message', () => {
      const message = 'data: {"type":"thread_created","threadId":"thread_123"}';
      const result = parseSSEMessage(message);
      
      expect(result).toEqual({
        type: 'thread_created',
        threadId: 'thread_123'
      });
    });

    it('should parse delta message', () => {
      const message = 'data: {"type":"delta","content":"Hello"}';
      const result = parseSSEMessage(message);
      
      expect(result).toEqual({
        type: 'delta',
        content: 'Hello'
      });
    });

    it('should parse completed message with full response', () => {
      const fullResponse = {
        greeting: "It's great that you're taking steps toward a healthier routine! 🌟",
        attentionRequired: null,
        emergencyReasoning: null,
        actionItems: [],
        additionalInformation: "",
        actionableItems: [],
        questions: []
      };
      
      const message = `data: {"type":"completed","content":${JSON.stringify(JSON.stringify(fullResponse))},"threadId":"thread_123"}`;
      const result = parseSSEMessage(message);
      
      expect(result).toEqual({
        type: 'completed',
        content: JSON.stringify(fullResponse),
        threadId: 'thread_123'
      });
    });

    it('should handle [DONE] message', () => {
      const message = 'data: [DONE]';
      const result = parseSSEMessage(message);
      
      expect(result).toEqual({
        type: 'done'
      });
    });

    it('should return null for invalid messages', () => {
      expect(parseSSEMessage('')).toBeNull();
      expect(parseSSEMessage('invalid')).toBeNull();
      expect(parseSSEMessage('data: invalid json')).toBeNull();
    });
  });

  describe('SSEParser', () => {
    it('should accumulate content from delta messages', () => {
      const parser = new SSEParser();
      
      parser.processMessage('data: {"type":"delta","content":"{\\n"}');
      parser.processMessage('data: {"type":"delta","content":" \\"greeting\\""}');
      parser.processMessage('data: {"type":"delta","content":": \\"Hello\\""}');
      parser.processMessage('data: {"type":"delta","content":"\\n}"}');
      
      expect(parser.getAccumulatedContent()).toBe('{\n "greeting": "Hello"\n}');
    });

    it('should handle completed message', () => {
      const parser = new SSEParser();
      const onComplete = jest.fn();
      
      parser.onComplete = onComplete;
      
      const content = '{"greeting": "Hello"}';
      parser.processMessage(`data: {"type":"completed","content":"${content}","threadId":"thread_123"}`);
      
      expect(onComplete).toHaveBeenCalledWith(content, 'thread_123');
    });

    it('should handle thread creation', () => {
      const parser = new SSEParser();
      const onThreadCreated = jest.fn();
      
      parser.onThreadCreated = onThreadCreated;
      
      parser.processMessage('data: {"type":"thread_created","threadId":"thread_123"}');
      
      expect(onThreadCreated).toHaveBeenCalledWith('thread_123');
    });

    it('should stop processing after [DONE]', () => {
      const parser = new SSEParser();
      
      parser.processMessage('data: {"type":"delta","content":"Hello"}');
      parser.processMessage('data: [DONE]');
      parser.processMessage('data: {"type":"delta","content":" World"}');
      
      expect(parser.getAccumulatedContent()).toBe('Hello');
      expect(parser.isDone()).toBe(true);
    });

    it('should parse full example response correctly', () => {
      const parser = new SSEParser();
      const messages = [
        'data: {"type":"thread_created","threadId":"thread_oGPRYzqGmetzrv7c4de9w9od"}',
        'data: {"type":"delta","content":"{\\n"}',
        'data: {"type":"delta","content":" \\"greeting\\":"}',
        'data: {"type":"delta","content":" \\"It\'s great that you\'re taking steps toward a healthier routine! 🌟\\",\\n"}',
        'data: {"type":"completed","content":"{\n  \\"greeting\\": \\"It\'s great that you\'re taking steps toward a healthier routine! 🌟\\",\n  \\"attentionRequired\\": null,\n  \\"emergencyReasoning\\": null,\n  \\"actionItems\\": [],\n  \\"additionalInformation\\": \\"\\",\n  \\"actionableItems\\": [],\n  \\"questions\\": [\\"<p><em>How can I ensure I never miss a dose? ⏰</em></p>\\", \\"<p><em>What should I do if I forget to take a dose? 💬</em></p>\\"]\n}","threadId":"thread_oGPRYzqGmetzrv7c4de9w9od"}',
        'data: [DONE]'
      ];

      let threadId = '';
      let finalContent = '';
      
      parser.onThreadCreated = (id) => { threadId = id; };
      parser.onComplete = (content) => { finalContent = content; };
      
      messages.forEach(msg => parser.processMessage(msg));
      
      expect(threadId).toBe('thread_oGPRYzqGmetzrv7c4de9w9od');
      expect(parser.isDone()).toBe(true);
      
      const parsed = JSON.parse(finalContent);
      expect(parsed.greeting).toBe("It's great that you're taking steps toward a healthier routine! 🌟");
      expect(parsed.questions).toHaveLength(2);
    });
  });
});