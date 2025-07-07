import { NextRequest, NextResponse } from 'next/server';
import { RoutineAdjustmentService } from '@/src/services/openai/routines/routineAdjustmentService';

export async function POST(request: NextRequest) {
  try {
    const { currentRoutine, userFeedback } = await request.json();

    if (!currentRoutine || !userFeedback) {
      return NextResponse.json(
        { error: 'Current routine and user feedback are required' },
        { status: 400 }
      );
    }

    // Initialize service
    const adjustmentService = new RoutineAdjustmentService(
      process.env.OPENAI_API_KEY!
    );

    // Adjust the routine
    const adjustedRoutine = await adjustmentService.adjustRoutine({
      routine: currentRoutine,
      adjustmentRequest: userFeedback
    });

    return NextResponse.json(adjustedRoutine);
  } catch (error) {
    console.error('Error adjusting routine:', error);
    return NextResponse.json(
      { 
        error: 'Failed to adjust routine',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}