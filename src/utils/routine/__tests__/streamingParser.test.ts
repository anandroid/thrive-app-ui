import { StreamingRoutineParser, PartialRoutineData } from '../streamingParser';
import { Thriving } from '@/src/types/thriving';

describe('StreamingRoutineParser', () => {
  let parser: StreamingRoutineParser;
  let onUpdateMock: jest.Mock;
  let onCompleteMock: jest.Mock;
  let onErrorMock: jest.Mock;
  let partialData: PartialRoutineData | null;

  beforeEach(() => {
    partialData = null;
    onUpdateMock = jest.fn((data) => {
      partialData = data;
    });
    onCompleteMock = jest.fn();
    onErrorMock = jest.fn();
    parser = new StreamingRoutineParser(onUpdateMock, onCompleteMock, onErrorMock);
  });

  describe('parseChunk', () => {
    it('should handle start event', () => {
      const chunk = JSON.stringify({
        type: 'start',
        id: '12345',
        timestamp: '2024-01-01T00:00:00Z'
      });

      parser.parseChunk(chunk);

      expect(onUpdateMock).toHaveBeenCalledWith({
        id: '12345'
      });
      expect(partialData).toEqual({ id: '12345' });
    });

    it('should handle routine_info event', () => {
      const chunk = JSON.stringify({
        type: 'routine_info',
        data: {
          title: 'Morning Wellness Routine',
          description: 'A gentle routine to start your day'
        }
      });

      parser.parseChunk(chunk);

      expect(onUpdateMock).toHaveBeenCalledWith({
        title: 'Morning Wellness Routine',
        description: 'A gentle routine to start your day'
      });
    });

    it('should accumulate routine_info across multiple events', () => {
      // First send title
      parser.parseChunk(JSON.stringify({
        type: 'routine_info',
        data: { title: 'Sleep Better Routine' }
      }));

      expect(partialData).toEqual({
        title: 'Sleep Better Routine'
      });

      // Then send description
      parser.parseChunk(JSON.stringify({
        type: 'routine_info',
        data: { description: 'Improve your sleep quality' }
      }));

      expect(partialData).toEqual({
        title: 'Sleep Better Routine',
        description: 'Improve your sleep quality'
      });
    });

    it('should handle step events with correct indexing', () => {
      const step1 = {
        title: 'Deep Breathing',
        description: 'Take 5 deep breaths',
        duration: 5
      };

      const step2 = {
        title: 'Stretching',
        description: 'Gentle stretches',
        duration: 10
      };

      // Add first step
      parser.parseChunk(JSON.stringify({
        type: 'step',
        stepIndex: 0,
        data: step1
      }));

      expect(partialData?.steps).toEqual([step1]);

      // Add second step
      parser.parseChunk(JSON.stringify({
        type: 'step',
        stepIndex: 1,
        data: step2
      }));

      expect(partialData?.steps).toEqual([step1, step2]);
    });

    it('should handle steps without explicit index', () => {
      const step = {
        title: 'Meditation',
        description: 'Meditate for 10 minutes'
      };

      parser.parseChunk(JSON.stringify({
        type: 'step',
        data: step
      }));

      expect(partialData?.steps).toEqual([step]);
    });

    it('should handle recommendations event', () => {
      const recommendations = [
        { type: 'supplement', name: 'Magnesium', dosage: '200mg' },
        { type: 'lifestyle', suggestion: 'Reduce caffeine' }
      ];

      parser.parseChunk(JSON.stringify({
        type: 'recommendations',
        data: recommendations
      }));

      expect(partialData?.additionalRecommendations).toEqual(recommendations);
    });

    it('should handle outcomes event', () => {
      const outcomes = [
        'Better sleep quality',
        'Reduced stress levels',
        'Improved morning energy'
      ];

      parser.parseChunk(JSON.stringify({
        type: 'outcomes',
        data: outcomes
      }));

      expect(partialData?.expectedOutcomes).toEqual(outcomes);
    });

    it('should handle tips event', () => {
      const tips = [
        'Practice at the same time daily',
        'Find a quiet space',
        'Be patient with yourself'
      ];

      parser.parseChunk(JSON.stringify({
        type: 'tips',
        data: tips
      }));

      expect(partialData?.proTips).toEqual(tips);
    });

    it('should handle safety event', () => {
      const safetyNotes = [
        'Consult doctor if pregnant',
        'Stop if you feel dizzy'
      ];

      parser.parseChunk(JSON.stringify({
        type: 'safety',
        data: safetyNotes
      }));

      expect(partialData?.safetyNotes).toEqual(safetyNotes);
    });

    it('should handle complete event with full routine', () => {
      const completeRoutine: Thriving = {
        id: '12345',
        name: 'Complete Routine',
        description: 'A complete wellness routine',
        type: 'wellness_routine',
        duration: 7,
        frequency: 'daily',
        reminderTimes: ['08:00', '20:00'],
        healthConcern: 'stress',
        steps: [{
          order: 1,
          title: 'Morning meditation',
          description: 'Start with meditation',
          duration: 10,
          time: '08:00'
        }],
        expectedOutcomes: ['Better focus'],
        safetyNotes: ['Be mindful'],
        createdAt: new Date('2025-07-15T19:51:28.662Z'),
        updatedAt: new Date('2025-07-15T19:51:28.662Z'),
        isActive: true,
        origin: {
          createdFrom: 'chat',
          threadId: 'thread_123'
        }
      };

      parser.parseChunk(JSON.stringify({
        type: 'complete',
        routine: completeRoutine
      }));

      expect(partialData?.isComplete).toBe(true);
      expect(onCompleteMock).toHaveBeenCalledWith(expect.objectContaining({
        id: '12345',
        name: 'Complete Routine',
        description: 'A complete wellness routine',
        type: 'wellness_routine',
        duration: 7,
        frequency: 'daily',
        isActive: true
      }));
    });

    it('should handle error event', () => {
      const errorMessage = 'Failed to generate routine';

      parser.parseChunk(JSON.stringify({
        type: 'error',
        error: errorMessage
      }));

      expect(onErrorMock).toHaveBeenCalledWith(errorMessage);
    });

    it('should handle streaming event (progress indicator)', () => {
      parser.parseChunk(JSON.stringify({
        type: 'streaming',
        chunk: 'some chunk data'
      }));

      // Streaming events don't update partial data or trigger callbacks
      expect(onUpdateMock).not.toHaveBeenCalled();
      expect(onCompleteMock).not.toHaveBeenCalled();
      expect(onErrorMock).not.toHaveBeenCalled();
    });

    it('should handle multiple chunks in a single string', () => {
      const multipleChunks = [
        JSON.stringify({ type: 'start', id: '123' }),
        JSON.stringify({ type: 'routine_info', data: { title: 'Test' } }),
        JSON.stringify({ type: 'routine_info', data: { description: 'Description' } })
      ].join('\n');

      parser.parseChunk(multipleChunks);

      expect(onUpdateMock).toHaveBeenCalledTimes(3);
      expect(partialData).toEqual({
        id: '123',
        title: 'Test',
        description: 'Description'
      });
    });

    it('should ignore empty lines', () => {
      const chunksWithEmptyLines = [
        JSON.stringify({ type: 'start', id: '123' }),
        '',
        '   ',
        JSON.stringify({ type: 'routine_info', data: { title: 'Test' } }),
        '\n'
      ].join('\n');

      parser.parseChunk(chunksWithEmptyLines);

      expect(onUpdateMock).toHaveBeenCalledTimes(2);
    });

    it('should handle malformed JSON gracefully', () => {
      const invalidChunk = 'invalid json {not valid}';
      
      // Should not throw
      expect(() => parser.parseChunk(invalidChunk)).not.toThrow();
      
      // Should not call any callbacks
      expect(onUpdateMock).not.toHaveBeenCalled();
      expect(onErrorMock).not.toHaveBeenCalled();
    });

    it('should handle partial JSON chunks', () => {
      // This simulates receiving incomplete JSON that might happen during streaming
      const partialChunk = '{"type": "routine_info", "data": {"title": "Incomplete';
      
      expect(() => parser.parseChunk(partialChunk)).not.toThrow();
      expect(onUpdateMock).not.toHaveBeenCalled();
    });
  });

  describe('getPartialData', () => {
    it('should return current partial data', () => {
      parser.parseChunk(JSON.stringify({
        type: 'routine_info',
        data: { title: 'Test Routine' }
      }));

      const data = parser.getPartialData();
      expect(data).toEqual({ title: 'Test Routine' });
    });

    it('should return empty object initially', () => {
      const data = parser.getPartialData();
      expect(data).toEqual({});
    });
  });

  describe('reset', () => {
    it('should clear all partial data', () => {
      // Add some data
      parser.parseChunk(JSON.stringify({
        type: 'routine_info',
        data: { 
          title: 'Test Routine',
          description: 'Test description'
        }
      }));

      expect(parser.getPartialData()).toEqual({
        title: 'Test Routine',
        description: 'Test description'
      });

      // Reset
      parser.reset();

      expect(parser.getPartialData()).toEqual({});
    });
  });

  describe('Integration test - full streaming flow', () => {
    it('should handle a complete streaming sequence', () => {
      const chunks = [
        { type: 'start', id: '12345' },
        { type: 'routine_info', data: { title: 'Evening Wind Down' } },
        { type: 'routine_info', data: { description: 'Relax before sleep' } },
        { type: 'step', stepIndex: 0, data: { title: 'Turn off screens', duration: 30 } },
        { type: 'step', stepIndex: 1, data: { title: 'Dim lights', duration: 5 } },
        { type: 'step', stepIndex: 2, data: { title: 'Read a book', duration: 20 } },
        { type: 'outcomes', data: ['Better sleep', 'Reduced anxiety'] },
        { type: 'tips', data: ['Be consistent', 'Start small'] },
        { type: 'safety', data: ['Suitable for all ages'] },
        { type: 'complete', routine: { id: '12345', name: 'Evening Wind Down' } }
      ];

      chunks.forEach(chunk => {
        parser.parseChunk(JSON.stringify(chunk));
      });

      expect(onUpdateMock).toHaveBeenCalledTimes(chunks.length);
      expect(onCompleteMock).toHaveBeenCalledTimes(1);
      
      const finalData = parser.getPartialData();
      expect(finalData).toMatchObject({
        id: '12345',
        title: 'Evening Wind Down',
        description: 'Relax before sleep',
        steps: expect.arrayContaining([
          expect.objectContaining({ title: 'Turn off screens' }),
          expect.objectContaining({ title: 'Dim lights' }),
          expect.objectContaining({ title: 'Read a book' })
        ]),
        expectedOutcomes: ['Better sleep', 'Reduced anxiety'],
        proTips: ['Be consistent', 'Start small'],
        safetyNotes: ['Suitable for all ages'],
        isComplete: true
      });
    });
  });
});