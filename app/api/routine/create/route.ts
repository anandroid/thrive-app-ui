import { NextRequest, NextResponse } from 'next/server';
import { RoutineCreationService } from '@/src/services/openai/routines/routineCreationService';

export async function POST(request: NextRequest) {
  try {
    const { 
      routineType, 
      healthConcern, 
      customInstructions, 
      frequency, 
      duration,
      userPreferences 
    } = await request.json();

    if (!healthConcern) {
      return NextResponse.json(
        { error: 'Health concern is required' },
        { status: 400 }
      );
    }

    // Initialize service
    const routineService = new RoutineCreationService(
      process.env.OPENAI_API_KEY!
    );

    // Create the routine
    const routine = await routineService.createRoutine({
      routineType: routineType || 'wellness_routine',
      duration: duration || '7_days',
      frequency: frequency || 'daily',
      healthConcern,
      customInstructions: customInstructions || '',
      sleepTime: userPreferences?.sleepSchedule?.bedtime || '22:00',
      wakeTime: userPreferences?.sleepSchedule?.wakeTime || '07:00'
    });

    return NextResponse.json(routine);
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