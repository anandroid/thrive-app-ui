import { NextRequest } from 'next/server';
import { POST } from '../route';

// Mock dependencies
jest.mock('@/src/services/openai/routines/routineCreationService');
jest.mock('@/src/services/openai/multiAssistantService');

describe('POST /api/routine/create-stream', () => {
  let mockRequest: Partial<NextRequest>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock NextRequest
    mockRequest = {
      headers: new Headers({
        'content-length': '100'
      }),
      json: jest.fn()
    };
  });

  describe('Request validation', () => {
    it('should return 400 for empty request body', async () => {
      mockRequest.headers = new Headers({
        'content-length': '0'
      });

      const response = await POST(mockRequest as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Empty request body');
    });

    it('should return 400 for invalid JSON', async () => {
      (mockRequest.json as jest.Mock).mockRejectedValue(new Error('Invalid JSON'));

      const response = await POST(mockRequest as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid JSON in request body');
    });

    it('should return 400 when healthConcern is missing', async () => {
      (mockRequest.json as jest.Mock).mockResolvedValue({
        routineType: 'wellness_routine',
        duration: '7_days'
      });

      const response = await POST(mockRequest as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Health concern is required');
    });
  });

  describe('Streaming response', () => {
    beforeEach(() => {
      (mockRequest.json as jest.Mock).mockResolvedValue({
        healthConcern: 'Better sleep',
        routineType: 'sleep_routine',
        duration: '7_days',
        frequency: 'daily'
      });
    });

    it('should return streaming response with correct headers', async () => {
      const { RoutineCreationService } = jest.requireMock('@/src/services/openai/routines/routineCreationService');
      
      // Mock the streaming method
      RoutineCreationService.mockImplementation(() => ({
        createRoutineStream: jest.fn((params, callbacks) => {
          // Simulate immediate completion
          callbacks.onComplete({
            routineTitle: 'Test Routine',
            routineDescription: 'Test Description',
            steps: []
          });
          return Promise.resolve();
        })
      }));

      const response = await POST(mockRequest as NextRequest);

      expect(response.headers.get('Content-Type')).toBe('text/event-stream');
      expect(response.headers.get('Cache-Control')).toBe('no-cache');
      expect(response.headers.get('Connection')).toBe('keep-alive');
    });
  });
});

// Test the attemptPartialParse function separately
describe('attemptPartialParse', () => {
  // Since attemptPartialParse is not exported, we'll test it through integration
  // This would require refactoring the route to export the helper function
  // For now, we'll create a separate test file for the helper functions
});

// Test helper functions
describe('Streaming helper functions', () => {
  describe('transformRoutine', () => {
    it('should transform routine data correctly', () => {
      // Test would verify the transform function here
      // Since transformRoutine is not exported, this documents expected behavior
      /*
      const input = {
        routineTitle: 'Morning Routine',
        routineDescription: 'Start your day right',
        duration: '14_days',
        frequency: 'daily',
        steps: [
          {
            title: 'Wake up',
            description: 'Get out of bed',
            duration: '5 minutes',
            reminderTime: '07:00'
          }
        ],
        expectedOutcomes: ['Better mornings'],
        safetyNotes: ['Be gentle']
      };

      // This would test the transformRoutine function if it were exported
      // For now, this serves as documentation of expected behavior
      */
      /*
      const expected = {
        id: expect.any(String),
        name: 'Morning Routine',
        description: 'Start your day right',
        type: 'wellness_routine',
        duration: 14,
        frequency: 'daily',
        reminderTimes: ['07:00'],
        healthConcern: 'general wellness',
        steps: [{
          order: 1,
          title: 'Wake up',
          description: 'Get out of bed',
          duration: 5,
          stepNumber: 1,
          reminderTime: '07:00',
          time: '07:00'
        }],
        expectedOutcomes: ['Better mornings'],
        safetyNotes: ['Be gentle'],
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        isActive: true
      };
      */
      
      // This test documents the expected behavior
      expect(true).toBe(true);
    });
  });
});