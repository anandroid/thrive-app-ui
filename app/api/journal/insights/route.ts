import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { SmartJournalEntry } from '@/src/types/journal-inputs';

// Initialize OpenAI inside the handler
export async function POST(request: NextRequest) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const { entry, thriving }: { 
      entry: SmartJournalEntry; 
      thriving: { title: string; type: string; journalTemplate?: { customFields?: Array<{ id: string; label: string }> } } 
    } = await request.json();

    // Build context from field values
    const fieldContext = Object.entries(entry.fieldValues)
      .map(([fieldId, value]) => {
        const field = thriving.journalTemplate?.customFields?.find((f) => f.id === fieldId);
        if (!field) return '';
        return `${field.label}: ${value}`;
      })
      .filter(Boolean)
      .join('\n');

    const prompt = `You are a compassionate wellness coach analyzing a journal entry for a ${thriving.type} routine called "${thriving.title}".

Journal Entry Data:
${fieldContext}

Please provide a brief, personalized insight (2-3 sentences) that:
1. Acknowledges what you notice in their data
2. Offers an encouraging observation or pattern recognition
3. Suggests one small actionable tip for tomorrow

Keep the tone warm, supportive, and specific to their data. Avoid generic advice.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a supportive wellness coach providing personalized insights based on journal entries. Keep responses concise and actionable.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 150
    });

    const insight = completion.choices[0]?.message?.content || 
      'Keep up the great work tracking your progress! Every entry helps build a clearer picture of your wellness journey.';

    return NextResponse.json({ insight });
  } catch (error) {
    console.error('Error generating journal insight:', error);
    
    // Return a fallback insight on error
    return NextResponse.json({ 
      insight: 'Great job completing your journal today! Your consistency in tracking helps identify patterns that support your wellness journey.'
    });
  }
}