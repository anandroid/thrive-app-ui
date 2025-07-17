import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { RECOMMENDATION_ASSISTANT_CONFIG } from '@/src/services/openai/assistant/team/recommendationAssistant';
import type { Thriving } from '@/src/types/thriving';
import type { PantryItem } from '@/src/types/pantry';
import type { ChatHistoryItem } from '@/src/types/chat';
import type { WellnessJourney } from '@/src/services/openai/types/journey';

// Initialize OpenAI client inside the handler
const createOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY || process.env.THRIVE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not found in environment variables');
  }
  return new OpenAI({ apiKey });
};

/**
 * Process context data received from the client
 */
function processClientContext(userData: {
  thrivings?: Thriving[];
  pantryItems?: PantryItem[];
  chatHistory?: ChatHistoryItem[];
  journeys?: WellnessJourney[];
}) {
  // Get data from client or use empty arrays
  const thrivings = userData.thrivings || [];
  const pantryItems = userData.pantryItems || [];
  const chatHistory = userData.chatHistory || [];
  const journeys = userData.journeys || [];

  // Get recent journal entries
  const recentJournalEntries = [];
  for (const journey of journeys.slice(0, 3)) { // Last 3 journeys
    if (journey.id) {
      // Filter entries from last 7 days
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 7);
      
      const entries = (journey.entries || [])
        .filter((entry) => new Date(entry.timestamp) >= cutoffDate)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5); // Last 5 entries
      recentJournalEntries.push(...entries.map(e => ({
        journeyType: journey.type,
        journeyTitle: journey.title,
        ...e
      })));
    }
  }

  // Calculate routine adherence
  const activeThrivings = thrivings.filter(t => t.isActive);
  const upcomingSteps = activeThrivings.flatMap(t => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    return t.steps
      .filter(step => step.time)
      .map(step => {
        const [hours, minutes] = step.time!.split(':').map(Number);
        const stepTime = hours * 60 + minutes;
        return {
          thrivingId: t.id,
          thrivingName: t.title,
          step: step.title,
          time: step.time,
          isOverdue: stepTime < currentTime,
          minutesUntil: stepTime - currentTime
        };
      })
      .filter(s => s.minutesUntil > -60 && s.minutesUntil < 120); // Within 2 hours
  });

  // Analyze pantry for low supplies
  const lowSupplies = pantryItems.filter(item => {
    // Simple heuristic: if added > 30 days ago, might be low
    const daysSinceAdded = Math.floor(
      (Date.now() - new Date(item.dateAdded).getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSinceAdded > 30;
  });

  // Get latest chat context
  const recentChats = chatHistory.slice(0, 3).map(chat => ({
    threadId: chat.threadId,
    title: chat.title,
    lastMessage: chat.lastMessage,
    messageCount: chat.messageCount,
    daysSince: Math.floor(
      (Date.now() - new Date(chat.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
    )
  }));

  return {
    summary: {
      totalThrivings: thrivings.length,
      activeThrivings: activeThrivings.length,
      pantryItemCount: pantryItems.length,
      journeyCount: journeys.length,
      recentChatCount: recentChats.length
    },
    upcomingSteps,
    lowSupplies: lowSupplies.slice(0, 3), // Top 3
    recentJournalEntries: recentJournalEntries.slice(0, 5), // Last 5 entries
    recentChats,
    currentTime: new Date().toISOString(),
    timeOfDay: new Date().getHours() < 12 ? 'morning' : 
               new Date().getHours() < 17 ? 'afternoon' : 'evening'
  };
}

export async function POST(request: NextRequest) {
  try {
    const { context: requestContext, userData } = await request.json();
    
    // Process user data from client
    const fullContext = processClientContext(userData || {});
    
    // Create OpenAI client
    const openai = createOpenAIClient();
    
    // Create a simple completion request instead of using assistants
    // This avoids the complexity of assistant API for dynamic code generation
    const systemPrompt = RECOMMENDATION_ASSISTANT_CONFIG.instructions;
    
    const userPrompt = `
Given this user context, generate a personalized widget recommendation:

${JSON.stringify(fullContext, null, 2)}

Additional context from request:
${JSON.stringify(requestContext, null, 2)}

Generate a React component that provides a timely, actionable recommendation.
Focus on what's most relevant RIGHT NOW based on the time of day and user's data.

Remember to follow the response format with componentCode, widgetType, priority, etc.
`;

    const completion = await openai.chat.completions.create({
      model: RECOMMENDATION_ASSISTANT_CONFIG.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: RECOMMENDATION_ASSISTANT_CONFIG.temperature,
      response_format: { type: 'json_object' }
    });

    const response = completion.choices[0].message.content;
    
    if (!response) {
      throw new Error('No response from AI');
    }

    const widgetData = JSON.parse(response);
    
    // Validate the response has required fields
    if (!widgetData.componentCode || !widgetData.widgetType) {
      throw new Error('Invalid widget data structure');
    }

    return NextResponse.json(widgetData);

  } catch (error) {
    console.error('Error generating recommendation:', error);
    
    // Return a fallback widget on error
    const fallbackWidget = {
      componentCode: `
const RecommendationWidget = () => {
  return (
    <div className="recommendation-widget" onClick={() => window.navigateTo('/chat/new')}>
      <div className="widget-header">
        <div className="widget-icon gradient-sage">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <span className="widget-tag">Wellness Tip</span>
      </div>
      <div className="widget-content">
        <h3 className="widget-title">Start your wellness journey</h3>
        <p className="widget-description">
          Chat with me about your health goals
        </p>
      </div>
      <div className="widget-action">
        <span>Get Started</span>
        <ChevronRight className="w-4 h-4" />
      </div>
    </div>
  );
};`,
      widgetType: 'action',
      priority: 'medium',
      reasoning: 'Default recommendation when personalized data is unavailable',
      dataUsed: [],
      timing: {
        showFor: 'always',
        bestTime: 'anytime'
      }
    };

    return NextResponse.json(fallbackWidget);
  }
}