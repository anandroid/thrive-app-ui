import { renderHook, act } from '@testing-library/react-hooks';
import { useStreamingRoutineParser } from '../streamingParser';

// Mock fetch
global.fetch = jest.fn();

describe('useStreamingRoutineParser hook', () => {
  let onUpdateMock: jest.Mock;
  let onCompleteMock: jest.Mock;
  let onErrorMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    onUpdateMock = jest.fn();
    onCompleteMock = jest.fn();
    onErrorMock = jest.fn();
    (global.fetch as jest.Mock).mockClear();
  });

  it('should return startStreaming function and parser', () => {
    const { result } = renderHook(() => 
      useStreamingRoutineParser(onUpdateMock, onCompleteMock, onErrorMock)
    );

    expect(result.current).toHaveProperty('startStreaming');
    expect(result.current).toHaveProperty('parser');
    expect(typeof result.current.startStreaming).toBe('function');
  });

  describe('startStreaming', () => {
    it('should make POST request to streaming endpoint', async () => {
      const mockResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: jest.fn().mockResolvedValue({ done: true, value: undefined })
          })
        }
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => 
        useStreamingRoutineParser(onUpdateMock, onCompleteMock, onErrorMock)
      );

      const routineData = {
        healthConcern: 'Better sleep',
        routineType: 'sleep_routine',
        duration: '7_days'
      };

      await act(async () => {
        await result.current.startStreaming(routineData);
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/routine/create-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(routineData)
      });
    });

    it('should handle streaming data chunks', async () => {
      const chunks = [
        { type: 'start', id: '123' },
        { type: 'routine_info', data: { title: 'Test Routine' } }
      ];

      const encoder = new TextEncoder();
      const mockReader = {
        read: jest.fn()
          .mockResolvedValueOnce({
            done: false,
            value: encoder.encode(chunks.map(c => JSON.stringify(c)).join('\n'))
          })
          .mockResolvedValueOnce({
            done: true,
            value: undefined
          })
      };

      const mockResponse = {
        ok: true,
        body: {
          getReader: () => mockReader
        }
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => 
        useStreamingRoutineParser(onUpdateMock, onCompleteMock, onErrorMock)
      );

      await act(async () => {
        await result.current.startStreaming({ healthConcern: 'test' });
      });

      expect(onUpdateMock).toHaveBeenCalledTimes(2);
      expect(onUpdateMock).toHaveBeenNthCalledWith(1, { id: '123' });
      expect(onUpdateMock).toHaveBeenNthCalledWith(2, { id: '123', title: 'Test Routine' });
    });

    it('should handle split chunks across reads', async () => {
      const encoder = new TextEncoder();
      
      // Simulate a chunk being split across two reads
      const chunk1 = '{"type": "start", "id": "123"}\n{"type": "routine_info", "data": {"ti';
      const chunk2 = 'tle": "Test Routine"}}';

      const mockReader = {
        read: jest.fn()
          .mockResolvedValueOnce({
            done: false,
            value: encoder.encode(chunk1)
          })
          .mockResolvedValueOnce({
            done: false,
            value: encoder.encode(chunk2)
          })
          .mockResolvedValueOnce({
            done: true,
            value: undefined
          })
      };

      const mockResponse = {
        ok: true,
        body: {
          getReader: () => mockReader
        }
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => 
        useStreamingRoutineParser(onUpdateMock, onCompleteMock, onErrorMock)
      );

      await act(async () => {
        await result.current.startStreaming({ healthConcern: 'test' });
      });

      // Should process both chunks correctly
      expect(onUpdateMock).toHaveBeenCalledWith({ id: '123' });
      expect(onUpdateMock).toHaveBeenCalledWith({ id: '123', title: 'Test Routine' });
    });

    it('should handle fetch errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => 
        useStreamingRoutineParser(onUpdateMock, onCompleteMock, onErrorMock)
      );

      await act(async () => {
        await result.current.startStreaming({ healthConcern: 'test' });
      });

      expect(onErrorMock).toHaveBeenCalledWith('Network error');
    });

    it('should handle non-ok responses', async () => {
      const mockResponse = {
        ok: false,
        status: 500
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => 
        useStreamingRoutineParser(onUpdateMock, onCompleteMock, onErrorMock)
      );

      await act(async () => {
        await result.current.startStreaming({ healthConcern: 'test' });
      });

      expect(onErrorMock).toHaveBeenCalledWith('Failed to start routine creation');
    });

    it('should handle missing response body', async () => {
      const mockResponse = {
        ok: true,
        body: null
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => 
        useStreamingRoutineParser(onUpdateMock, onCompleteMock, onErrorMock)
      );

      await act(async () => {
        await result.current.startStreaming({ healthConcern: 'test' });
      });

      expect(onErrorMock).toHaveBeenCalledWith('No response body');
    });

    it('should process remaining buffer content after stream ends', async () => {
      const encoder = new TextEncoder();
      
      // Simulate incomplete line that needs to be processed at the end
      const incompleteChunk = '{"type": "start", "id": "123"}\n{"type": "routine_info", "data": {"title": "Test"}}';
      // Note: No trailing newline, so last line stays in buffer

      const mockReader = {
        read: jest.fn()
          .mockResolvedValueOnce({
            done: false,
            value: encoder.encode(incompleteChunk)
          })
          .mockResolvedValueOnce({
            done: true,
            value: undefined
          })
      };

      const mockResponse = {
        ok: true,
        body: {
          getReader: () => mockReader
        }
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => 
        useStreamingRoutineParser(onUpdateMock, onCompleteMock, onErrorMock)
      );

      await act(async () => {
        await result.current.startStreaming({ healthConcern: 'test' });
      });

      // Both chunks should be processed
      expect(onUpdateMock).toHaveBeenCalledTimes(2);
      expect(onUpdateMock).toHaveBeenCalledWith({ id: '123' });
      expect(onUpdateMock).toHaveBeenCalledWith({ id: '123', title: 'Test' });
    });
  });

  describe('parser access', () => {
    it('should provide access to parser methods', () => {
      const { result } = renderHook(() => 
        useStreamingRoutineParser(onUpdateMock, onCompleteMock, onErrorMock)
      );

      // Add some data using the parser
      act(() => {
        result.current.parser.parseChunk('{"type": "start", "id": "123"}');
      });

      expect(result.current.parser.getPartialData()).toEqual({ id: '123' });

      // Reset parser
      act(() => {
        result.current.parser.reset();
      });

      expect(result.current.parser.getPartialData()).toEqual({});
    });
  });
});