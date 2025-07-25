import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RoutineCreationModal } from '../RoutineCreationModal';
import { ActionableItem, WellnessRoutine } from '@/src/services/openai/types';

// Mock fetch
global.fetch = jest.fn();

describe('RoutineCreationModal', () => {
  const mockOnClose = jest.fn();
  const mockOnRoutineCreated = jest.fn();

  const mockRoutineData: ActionableItem = {
    type: 'create_routine',
    title: 'Create Weight Loss Routine',
    description: 'Start your journey',
    routineType: 'weight_loss',
    frequency: 'daily',
    modalTitle: 'Create Your Weight Loss Journey',
    modalDescription: 'Let\'s create a personalized routine for you'
  };

  const mockApiResponse: WellnessRoutine = {
    id: '1751860385484',
    name: 'Sustainable Weight Loss Journey 🥗',
    description: 'This routine will guide you through daily activities',
    type: 'weight_loss',
    duration: 20,
    frequency: 'daily',
    reminderTimes: ['07:10'],
    healthConcern: 'Help me lose weight sustainably',
    steps: [],
    expectedOutcomes: [],
    safetyNotes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  test('should render modal when open', () => {
    render(
      <RoutineCreationModal
        isOpen={true}
        onClose={mockOnClose}
        routineData={mockRoutineData}
        healthConcern="Help me lose weight"
        onRoutineCreated={mockOnRoutineCreated}
      />
    );

    expect(screen.getByText('Create Your Weight Loss Journey')).toBeInTheDocument();
    expect(screen.getByText('Your Current Focus 🎯')).toBeInTheDocument();
  });

  test('should not render when closed', () => {
    const { container } = render(
      <RoutineCreationModal
        isOpen={false}
        onClose={mockOnClose}
        routineData={mockRoutineData}
        healthConcern="Help me lose weight"
        onRoutineCreated={mockOnRoutineCreated}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  test('should select duration', () => {
    render(
      <RoutineCreationModal
        isOpen={true}
        onClose={mockOnClose}
        routineData={mockRoutineData}
        healthConcern="Help me lose weight"
        onRoutineCreated={mockOnRoutineCreated}
      />
    );

    const sevenDaysButton = screen.getByText('7').closest('button');
    fireEvent.click(sevenDaysButton!);

    expect(sevenDaysButton).toHaveClass('border-rose-500');
  });

  test('should navigate through steps', () => {
    render(
      <RoutineCreationModal
        isOpen={true}
        onClose={mockOnClose}
        routineData={mockRoutineData}
        healthConcern="Help me lose weight"
        onRoutineCreated={mockOnRoutineCreated}
      />
    );

    // Go to step 2
    const continueButton = screen.getByText('Continue');
    fireEvent.click(continueButton);

    expect(screen.getByText('Your Sleep Schedule 😴')).toBeInTheDocument();

    // Go back to step 1
    const backButton = screen.getByText('← Back');
    fireEvent.click(backButton);

    expect(screen.getByText('Duration')).toBeInTheDocument();
  });

  test('should create routine successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse
    });

    render(
      <RoutineCreationModal
        isOpen={true}
        onClose={mockOnClose}
        routineData={mockRoutineData}
        healthConcern="Help me lose weight"
        onRoutineCreated={mockOnRoutineCreated}
      />
    );

    // Select duration
    const sevenDaysButton = screen.getByText('7').closest('button');
    fireEvent.click(sevenDaysButton!);

    // Go to step 2
    fireEvent.click(screen.getByText('Continue'));

    // Go to step 3
    fireEvent.click(screen.getByText('Continue'));

    // Create routine
    const createButton = screen.getByText('Create Routine');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/routine/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routineType: 'weight_loss',
          healthConcern: 'Help me lose weight',
          customInstructions: undefined,
          frequency: 'daily',
          duration: '7_days',
          userPreferences: {
            sleepSchedule: {
              bedtime: '22:00',
              wakeTime: '07:00'
            },
            availableTime: 20
          }
        })
      });
    });

    await waitFor(() => {
      expect(mockOnRoutineCreated).toHaveBeenCalledWith(mockApiResponse);
    });
  });

  test('should handle API error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(
      <RoutineCreationModal
        isOpen={true}
        onClose={mockOnClose}
        routineData={mockRoutineData}
        healthConcern="Help me lose weight"
        onRoutineCreated={mockOnRoutineCreated}
      />
    );

    // Navigate to final step
    fireEvent.click(screen.getByText('7').closest('button')!);
    fireEvent.click(screen.getByText('Continue'));
    fireEvent.click(screen.getByText('Continue'));

    // Try to create routine
    const createButton = screen.getByText('Create Routine');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error creating routine:', expect.any(Error));
    });

    expect(mockOnRoutineCreated).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  test('should close modal when close button clicked', () => {
    render(
      <RoutineCreationModal
        isOpen={true}
        onClose={mockOnClose}
        routineData={mockRoutineData}
        healthConcern="Help me lose weight"
        onRoutineCreated={mockOnRoutineCreated}
      />
    );

    const closeButton = screen.getByLabelText('Close modal');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('should handle custom instructions', () => {
    render(
      <RoutineCreationModal
        isOpen={true}
        onClose={mockOnClose}
        routineData={mockRoutineData}
        healthConcern="Help me lose weight"
        onRoutineCreated={mockOnRoutineCreated}
      />
    );

    // Navigate to step 3
    fireEvent.click(screen.getByText('7').closest('button')!);
    fireEvent.click(screen.getByText('Continue'));
    fireEvent.click(screen.getByText('Continue'));

    // Add custom instructions
    const textarea = screen.getByPlaceholderText(/Add any specific preferences or limitations/);
    fireEvent.change(textarea, { target: { value: 'I prefer evening workouts' } });

    expect(textarea).toHaveValue('I prefer evening workouts');
  });
});