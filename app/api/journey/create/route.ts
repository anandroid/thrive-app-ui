import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { JOURNEY_CREATION_PROMPT } from '@/src/services/openai/prompts/journey';

export async function POST(request: NextRequest) {
  const openai = new OpenAI({
    apiKey: process.env.THRIVE_OPENAI_API_KEY!,
  });
  try {
    const { 
      journeyType, 
      healthConcern,
      specificCondition,
      goals
    } = await request.json();

    if (!journeyType || !healthConcern) {
      return NextResponse.json(
        { error: 'Journey type and health concern are required' },
        { status: 400 }
      );
    }

    // Build the prompt
    const prompt = JOURNEY_CREATION_PROMPT
      .replace('{{journeyType}}', journeyType)
      .replace('{{healthConcern}}', healthConcern)
      .replace('{{#if specificCondition}}Condition: {{specificCondition}}{{/if}}', 
        specificCondition ? `Condition: ${specificCondition}` : '')
      .replace('{{#if goals}}Goals: {{goals}}{{/if}}', 
        goals ? `Goals: ${goals.join(', ')}` : '');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a compassionate wellness companion helping users create personalized health tracking journeys.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    const journeyData = JSON.parse(completion.choices[0].message.content || '{}');

    // Create the journey object
    const journey = {
      id: Date.now().toString(),
      type: journeyType,
      title: journeyData.title,
      description: journeyData.description,
      condition: specificCondition,
      createdAt: new Date(),
      updatedAt: new Date(),
      entries: [],
      isActive: true,
      goals: journeyData.goals || [],
      triggers: journeyData.triggers || [],
      copingStrategies: journeyData.copingStrategies || [],
      initialPrompts: journeyData.initialPrompts
    };

    return NextResponse.json(journey);
  } catch (error) {
    console.error('Error creating journey:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create journey',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}