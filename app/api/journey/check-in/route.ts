import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { JOURNEY_CHECK_IN_PROMPT } from '@/src/services/openai/prompts/journey';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { 
      journeyType,
      journeyTitle,
      previousMood,
      daysSinceLastEntry,
      recentSymptoms,
      currentContext
    } = await request.json();

    if (!journeyType || !journeyTitle) {
      return NextResponse.json(
        { error: 'Journey type and title are required' },
        { status: 400 }
      );
    }

    // Determine time of day
    const hour = new Date().getHours();
    let timeOfDay = 'morning';
    if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17 && hour < 21) timeOfDay = 'evening';
    else if (hour >= 21 || hour < 6) timeOfDay = 'night';

    // Build the prompt
    const prompt = JOURNEY_CHECK_IN_PROMPT
      .replace('{{journeyType}}', journeyType)
      .replace('{{journeyTitle}}', journeyTitle)
      .replace('{{timeOfDay}}', timeOfDay)
      .replace('{{previousMood}}', previousMood || 'not recorded')
      .replace('{{daysSinceLastEntry}}', daysSinceLastEntry?.toString() || '0')
      .replace('{{#if recentSymptoms}}Recent Symptoms: {{recentSymptoms}}{{/if}}', 
        recentSymptoms ? `Recent Symptoms: ${recentSymptoms.join(', ')}` : '')
      .replace('{{#if currentContext}}Context: {{currentContext}}{{/if}}', 
        currentContext ? `Context: ${currentContext}` : '');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a compassionate wellness companion conducting a supportive check-in.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      response_format: { type: 'json_object' }
    });

    const checkInData = JSON.parse(completion.choices[0].message.content || '{}');

    return NextResponse.json(checkInData);
  } catch (error) {
    console.error('Error generating check-in:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate check-in',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}