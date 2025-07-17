/**
 * Integration tests for the complete streaming routine creation flow
 */

import { StreamingRoutineParser } from '../streamingParser';

describe('Streaming Routine Creation - Integration Tests', () => {
  describe('Real-world streaming scenarios', () => {
    it('should handle ChatGPT-style incremental streaming', async () => {
      const updates: unknown[] = [];
      const parser = new StreamingRoutineParser(
        (data) => updates.push({ ...data }),
        jest.fn(),
        jest.fn()
      );

      // Simulate chunks coming in as they would from OpenAI streaming
      const streamingSequence = [
        '{"type": "start", "id": "routine_1234"}',
        '{"type": "streaming", "chunk": "{"}',
        '{"type": "streaming", "chunk": "\\"routineTitle\\""}',
        '{"type": "streaming", "chunk": ": \\"Evening"}',
        '{"type": "streaming", "chunk": " Wind Down"}',
        '{"type": "streaming", "chunk": " Routine\\","}',
        '{"type": "routine_info", "data": {"title": "Evening Wind Down Routine"}}',
        '{"type": "streaming", "chunk": "\\"routineDescription\\""}',
        '{"type": "streaming", "chunk": ": \\"A calming"}',
        '{"type": "streaming", "chunk": " routine to"}',
        '{"type": "streaming", "chunk": " prepare for"}',
        '{"type": "streaming", "chunk": " restful sleep\\","}',
        '{"type": "routine_info", "data": {"description": "A calming routine to prepare for restful sleep"}}',
        '{"type": "streaming", "chunk": "\\"steps\\": ["}',
        '{"type": "step", "stepIndex": 0, "data": {"title": "Digital Sunset", "description": "Turn off all screens", "duration": 30}}',
        '{"type": "step", "stepIndex": 1, "data": {"title": "Gentle Stretching", "description": "5 minutes of light stretches", "duration": 5}}',
        '{"type": "complete", "routine": {"id": "routine_1234", "name": "Evening Wind Down Routine"}}'
      ];

      // Process all chunks
      streamingSequence.forEach(chunk => {
        parser.parseChunk(chunk);
      });

      // Verify progressive updates
      expect(updates[0]).toEqual({ id: 'routine_1234' });
      expect(updates[1]).toMatchObject({ 
        id: 'routine_1234', 
        title: 'Evening Wind Down Routine' 
      });
      expect(updates[2]).toMatchObject({ 
        id: 'routine_1234', 
        title: 'Evening Wind Down Routine',
        description: 'A calming routine to prepare for restful sleep'
      });
      
      // Check final state
      const finalData = parser.getPartialData();
      expect(finalData.steps).toHaveLength(2);
      expect(finalData.isComplete).toBe(true);
    });

    it('should handle network delays and buffering', async () => {
      const parser = new StreamingRoutineParser(
        jest.fn(),
        jest.fn(),
        jest.fn()
      );

      // Simulate chunks arriving in batches with delays
      const batch1 = [
        '{"type": "start", "id": "123"}',
        '{"type": "routine_info", "data": {"title": "Morning Routine"}}'
      ].join('\n');

      const batch2 = [
        '{"type": "routine_info", "data": {"description": "Start your day right"}}',
        '{"type": "step", "stepIndex": 0, "data": {"title": "Hydrate", "duration": 2}}'
      ].join('\n');

      const batch3 = [
        '{"type": "outcomes", "data": ["Increased energy", "Better focus"]}',
        '{"type": "complete", "routine": {"id": "123"}}'
      ].join('\n');

      // Process batches
      parser.parseChunk(batch1);
      const data1 = parser.getPartialData();
      expect(data1).toMatchObject({
        id: '123',
        title: 'Morning Routine'
      });

      parser.parseChunk(batch2);
      const data2 = parser.getPartialData();
      expect(data2).toMatchObject({
        description: 'Start your day right',
        steps: [{ title: 'Hydrate', duration: 2 }]
      });

      parser.parseChunk(batch3);
      const data3 = parser.getPartialData();
      expect(data3).toMatchObject({
        expectedOutcomes: ['Increased energy', 'Better focus'],
        isComplete: true
      });
    });

    it('should handle error recovery during streaming', () => {
      const onError = jest.fn();
      const parser = new StreamingRoutineParser(
        jest.fn(),
        jest.fn(),
        onError
      );

      // Start normally
      parser.parseChunk('{"type": "start", "id": "123"}');
      parser.parseChunk('{"type": "routine_info", "data": {"title": "Test"}}');
      
      // Error occurs
      parser.parseChunk('{"type": "error", "error": "API rate limit exceeded"}');
      expect(onError).toHaveBeenCalledWith('API rate limit exceeded');
      
      // Parser should still have partial data
      const data = parser.getPartialData();
      expect(data).toMatchObject({
        id: '123',
        title: 'Test'
      });
    });

    it('should handle out-of-order step updates', () => {
      const updates: unknown[] = [];
      const parser = new StreamingRoutineParser(
        (data) => updates.push({ ...data }),
        jest.fn(),
        jest.fn()
      );

      // Steps arrive out of order
      parser.parseChunk('{"type": "step", "stepIndex": 2, "data": {"title": "Step 3"}}');
      parser.parseChunk('{"type": "step", "stepIndex": 0, "data": {"title": "Step 1"}}');
      parser.parseChunk('{"type": "step", "stepIndex": 1, "data": {"title": "Step 2"}}');

      const finalData = parser.getPartialData();
      expect(finalData.steps).toEqual([
        { title: 'Step 1' },
        { title: 'Step 2' },
        { title: 'Step 3' }
      ]);
    });

    it('should handle very large routines efficiently', () => {
      const parser = new StreamingRoutineParser(
        jest.fn(),
        jest.fn(),
        jest.fn()
      );

      // Create a large routine with many steps
      parser.parseChunk('{"type": "start", "id": "large_routine"}');
      
      // Add 50 steps
      for (let i = 0; i < 50; i++) {
        parser.parseChunk(JSON.stringify({
          type: 'step',
          stepIndex: i,
          data: {
            title: `Step ${i + 1}`,
            description: `Description for step ${i + 1}`,
            duration: 5 + (i % 10)
          }
        }));
      }

      const data = parser.getPartialData();
      expect(data.steps).toHaveLength(50);
      expect(data.steps![0].title).toBe('Step 1');
      expect(data.steps![49].title).toBe('Step 50');
    });

    it('should handle unicode and special characters', () => {
      const parser = new StreamingRoutineParser(
        jest.fn(),
        jest.fn(),
        jest.fn()
      );

      const chunks = [
        '{"type": "routine_info", "data": {"title": "योग दिनचर्या 🧘‍♀️"}}',
        '{"type": "routine_info", "data": {"description": "Daily yoga with प्राणायाम"}}',
        '{"type": "step", "stepIndex": 0, "data": {"title": "सूर्य नमस्कार", "description": "Sun salutation 🌅"}}',
        '{"type": "tips", "data": ["Stay hydrated 💧", "Practice mindfully 🙏"]}'
      ];

      chunks.forEach(chunk => parser.parseChunk(chunk));

      const data = parser.getPartialData();
      expect(data.title).toBe('योग दिनचर्या 🧘‍♀️');
      expect(data.description).toBe('Daily yoga with प्राणायाम');
      expect(data.steps![0].title).toBe('सूर्य नमस्कार');
      expect(data.proTips).toContain('Stay hydrated 💧');
    });
  });

  describe('Edge cases and error scenarios', () => {
    it('should handle empty streaming session', () => {
      const onComplete = jest.fn();
      const parser = new StreamingRoutineParser(
        jest.fn(),
        onComplete,
        jest.fn()
      );

      // Only start and complete, no actual content
      parser.parseChunk('{"type": "start", "id": "empty"}');
      parser.parseChunk('{"type": "complete", "routine": {"id": "empty", "name": "Empty Routine"}}');

      expect(onComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'empty',
          name: 'Empty Routine'
        })
      );
    });

    it('should handle malformed chunks mixed with valid ones', () => {
      const updates: unknown[] = [];
      const parser = new StreamingRoutineParser(
        (data) => updates.push(data),
        jest.fn(),
        jest.fn()
      );

      const chunks = [
        '{"type": "start", "id": "123"}',
        'CORRUPTED_DATA{{{',
        '{"type": "routine_info", "data": {"title": "Resilient Routine"}}',
        '{"type": "step", INVALID JSON',
        '{"type": "step", "stepIndex": 0, "data": {"title": "Valid Step"}}',
        '',
        '{"type": "complete", "routine": {"id": "123"}}'
      ];

      chunks.forEach(chunk => parser.parseChunk(chunk));

      // Should have processed valid chunks only
      expect(updates.length).toBe(4); // start, routine_info, step, complete
      const finalData = parser.getPartialData();
      expect(finalData.title).toBe('Resilient Routine');
      expect(finalData.steps).toHaveLength(1);
    });

    it('should handle connection reset mid-stream', () => {
      const parser = new StreamingRoutineParser(
        jest.fn(),
        jest.fn(),
        jest.fn()
      );

      // Start streaming
      parser.parseChunk('{"type": "start", "id": "123"}');
      parser.parseChunk('{"type": "routine_info", "data": {"title": "Interrupted Routine"}}');
      
      // Connection reset - parser is reset
      parser.reset();
      
      // New streaming session
      parser.parseChunk('{"type": "start", "id": "456"}');
      parser.parseChunk('{"type": "routine_info", "data": {"title": "New Routine"}}');

      const data = parser.getPartialData();
      expect(data.id).toBe('456');
      expect(data.title).toBe('New Routine');
    });
  });
});