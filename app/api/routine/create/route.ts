import { NextRequest, NextResponse } from 'next/server';
import { RoutineCreationService } from '@/src/services/openai/routines/routineCreationService';
import { getMultiAssistantService } from '@/src/services/openai/multiAssistantService';

export async function POST(request: NextRequest) {
  try {
    const { 
      routineType, 
      healthConcern, 
      customInstructions, 
      frequency, 
      duration,
      userPreferences,
      threadId 
    } = await request.json();

    if (!healthConcern) {
      return NextResponse.json(
        { error: 'Health concern is required' },
        { status: 400 }
      );
    }

    // Extract context from thread if provided
    let conversationContext = '';
    if (threadId) {
      try {
        const multiAssistantService = getMultiAssistantService();
        const messages = await multiAssistantService.getThreadMessagesWithWindow(threadId);
        
        // Create a summary of the conversation for context
        conversationContext = messages.map(msg => 
          `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
        ).join('\n');
      } catch (error) {
        console.error('Error fetching thread context:', error);
        // Continue without context if fetching fails
      }
    }

    // Initialize service
    const routineService = new RoutineCreationService(
      process.env.THRIVE_OPENAI_API_KEY!
    );

    // Create the routine with context
    const routine = await routineService.createRoutine({
      routineType: routineType || 'wellness_routine',
      duration: duration || '7_days',
      frequency: frequency || 'daily',
      healthConcern,
      customInstructions: customInstructions || '',
      sleepTime: userPreferences?.sleepSchedule?.bedtime || '22:00',
      wakeTime: userPreferences?.sleepSchedule?.wakeTime || '07:00',
      conversationContext
    });

    // Transform the response to match WellnessRoutine type
    const transformedRoutine = {
      ...routine,
      id: routine.id || Date.now().toString(),
      name: routine.routineTitle || routine.name || 'Wellness Routine',
      description: routine.routineDescription || routine.description || '',
      type: routine.routineType || routineType || 'wellness_routine',
      duration: typeof routine.duration === 'string' ? 
        parseInt(routine.duration.replace('_days', '')) : 
        routine.duration || 7,
      frequency: routine.frequency || 'daily',
      reminderTimes: routine.steps?.map((s: { reminderTime?: string }) => s.reminderTime).filter(Boolean) || [],
      healthConcern: routine.healthConcern || healthConcern,
      steps: (routine.steps || []).map((step: { 
        title: string;
        description: string;
        duration: string | number;
        stepNumber?: number;
        bestTime?: string;
        tips?: string[];
        videoSearchQuery?: string;
        will_video_tutorial_help?: boolean;
        reminderText?: string;
        reminderTime?: string;
      }, index: number) => ({
        order: index + 1,
        title: step.title,
        description: step.description,
        duration: typeof step.duration === 'string' ? 
          parseInt(step.duration.replace(' minutes', '')) : 
          step.duration || 5,
        stepNumber: step.stepNumber || index + 1,
        bestTime: step.bestTime,
        tips: step.tips || [],
        videoSearchQuery: step.videoSearchQuery,
        will_video_tutorial_help: step.will_video_tutorial_help,
        reminderText: step.reminderText,
        reminderTime: step.reminderTime
      })),
      expectedOutcomes: routine.expectedOutcomes || [],
      safetyNotes: routine.safetyNotes || [],
      createdAt: new Date(routine.createdAt || Date.now()),
      updatedAt: new Date(routine.updatedAt || Date.now()),
      isActive: true,
      routineType: routine.routineType,
      routineTitle: routine.routineTitle,
      routineDescription: routine.routineDescription,
      totalSteps: routine.totalSteps || routine.steps?.length || 0,
      reminderFrequency: routine.reminderFrequency || 'daily',
      additionalSteps: routine.additionalSteps
    };

    return NextResponse.json(transformedRoutine);
  } catch (error) {
    console.error('Error creating routine:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create routine',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}