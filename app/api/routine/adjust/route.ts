import { NextRequest, NextResponse } from 'next/server';
import { RoutineAdjustmentService } from '@/src/services/openai/routines/routineAdjustmentService';

export async function POST(request: NextRequest) {
  try {
    const { currentRoutine, userFeedback, routineId, adjustmentInstructions } = await request.json();

    // Support both old format (currentRoutine + userFeedback) and new format (routineId + adjustmentInstructions)
    const feedback = userFeedback || adjustmentInstructions;
    
    if ((!currentRoutine && !routineId) || !feedback) {
      return NextResponse.json(
        { error: 'Routine information and adjustment instructions are required' },
        { status: 400 }
      );
    }

    // Initialize service
    const adjustmentService = new RoutineAdjustmentService(
      process.env.THRIVE_OPENAI_API_KEY!
    );

    // Adjust the routine
    const adjustedRoutine = await adjustmentService.adjustRoutine({
      routine: currentRoutine,
      adjustmentRequest: feedback
    });

    // If routineId was provided, include it in the response
    const response = routineId ? { ...adjustedRoutine, id: routineId } : adjustedRoutine;

    return NextResponse.json(response);
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