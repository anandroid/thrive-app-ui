import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const maxDuration = 30; // 30 seconds max for voice transcription

// Check for API key
if (!process.env.THRIVE_OPENAI_API_KEY) {
  console.error('THRIVE_OPENAI_API_KEY is not set in environment variables');
}

const openai = new OpenAI({
  apiKey: process.env.THRIVE_OPENAI_API_KEY!,
});

export async function POST(request: NextRequest) {
  // Check API key at runtime
  if (!process.env.THRIVE_OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OpenAI API key not configured (THRIVE_OPENAI_API_KEY)' },
      { status: 500 }
    );
  }

  try {
    // Get the audio blob from the request
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Convert File to Buffer for OpenAI
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    
    // Create a File object that OpenAI expects
    const file = new File([buffer], 'audio.webm', { type: audioFile.type });

    console.log('Transcribing audio:', {
      size: audioFile.size,
      type: audioFile.type,
      name: audioFile.name
    });

    // Use Whisper to transcribe
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'en', // Optional: specify language for better accuracy
      response_format: 'json',
    });

    console.log('Transcription successful:', transcription.text);

    return NextResponse.json({
      text: transcription.text,
      success: true
    });

  } catch (error) {
    console.error('Transcription error:', error);
    
    // Handle specific OpenAI errors
    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { 
          error: 'Transcription failed', 
          details: error.message,
          code: error.code 
        },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}