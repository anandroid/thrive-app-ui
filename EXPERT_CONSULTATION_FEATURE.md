# Expert Consultation Feature Implementation

## Overview
This document outlines the implementation of the Expert Consultation feature for the Thrive app, which allows users to book appointments with wellness experts through Shopify booking, conduct video consultations, and receive post-consultation summaries.

## Feature Flag Configuration

### 1. Feature Flag Setup
```typescript
// src/config/features.ts
export const FEATURE_FLAGS = {
  EXPERT_CONSULTATION: process.env.NEXT_PUBLIC_ENABLE_EXPERT_CONSULTATION === 'true',
  EXPERT_CONSULTATION_SHOPIFY_URL: process.env.NEXT_PUBLIC_SHOPIFY_BOOKING_URL || '',
  EXPERT_CONSULTATION_API_ENDPOINT: process.env.NEXT_PUBLIC_CONSULTATION_API_URL || ''
};
```

### 2. Environment Variables
```bash
# .env.local
NEXT_PUBLIC_ENABLE_EXPERT_CONSULTATION=true
NEXT_PUBLIC_SHOPIFY_BOOKING_URL=https://your-store.myshopify.com/pages/book-consultation
NEXT_PUBLIC_CONSULTATION_API_URL=https://api.thrive-app.com/consultation
```

## Chat Assistant Integration

### 1. Conditional Assistant Instructions
```typescript
// src/services/openai/assistant/team/instructionBuilder.ts
export const buildExpertConsultationInstructions = (enableExpertConsultation: boolean) => {
  if (!enableExpertConsultation) return '';
  
  return `
## Expert Consultation Feature

When users express any of the following, offer expert consultation:
- Frustration with lack of progress ("nothing is working", "I've tried everything")
- Complex health conditions (chronic pain, multiple medications, serious symptoms)
- Direct request for professional help
- Multiple failed routine attempts or adjustments
- Concerns that require medical attention

### Actionable Item Format:
{
  "type": "expert_consultation",
  "title": "Connect with a Wellness Expert",
  "description": "Get personalized guidance from a certified wellness professional",
  "content": "Based on your concerns about [specific issue], a wellness expert can provide personalized strategies and professional guidance.",
  "metadata": {
    "highlight": "✨ First consultation is FREE",
    "benefits": [
      "45-minute personalized session",
      "Certified wellness professionals",
      "Custom wellness plan",
      "Follow-up support"
    ],
    "userConcerns": ["list of extracted concerns from conversation"],
    "relatedRoutines": ["list of routine IDs if any"]
  }
}

IMPORTANT: Only show this option when genuinely helpful, not as a default response.
`;
};
```

### 2. Update Assistant Creation
```typescript
// src/services/openai/assistant/team/chatAssistant.ts
import { FEATURE_FLAGS } from '@/src/config/features';

export const createChatAssistant = async () => {
  const expertInstructions = buildExpertConsultationInstructions(
    FEATURE_FLAGS.EXPERT_CONSULTATION
  );
  
  const instructions = `
    ${baseInstructions}
    ${expertInstructions}
  `;
  
  // Create assistant with conditional instructions
};
```

## Frontend Components

### 1. Expert Consultation Card Component
```typescript
// src/components/features/ExpertConsultationCard.tsx
import { FEATURE_FLAGS } from '@/src/config/features';

interface ExpertConsultationCardProps {
  title: string;
  description: string;
  metadata?: {
    highlight?: string;
    benefits?: string[];
    userConcerns?: string[];
    relatedRoutines?: string[];
  };
  threadId: string;
  messageId?: string;
}

export const ExpertConsultationCard: React.FC<ExpertConsultationCardProps> = ({
  title,
  description,
  metadata,
  threadId,
  messageId
}) => {
  if (!FEATURE_FLAGS.EXPERT_CONSULTATION) return null;

  const handleBookConsultation = () => {
    // Store context for post-consultation summary
    const consultationContext = {
      threadId,
      messageId,
      userConcerns: metadata?.userConcerns || [],
      relatedRoutines: metadata?.relatedRoutines || [],
      timestamp: new Date().toISOString()
    };
    
    sessionStorage.setItem('consultationContext', JSON.stringify(consultationContext));
    
    // Redirect to Shopify booking with context parameters
    const bookingUrl = new URL(FEATURE_FLAGS.EXPERT_CONSULTATION_SHOPIFY_URL);
    bookingUrl.searchParams.set('ref', 'thrive-app');
    bookingUrl.searchParams.set('context', threadId);
    bookingUrl.searchParams.set('concerns', metadata?.userConcerns?.join(',') || '');
    
    window.open(bookingUrl.toString(), '_blank');
  };

  return (
    <div className="w-full p-[5vw] max-p-6 rounded-[4vw] max-rounded-2xl bg-gradient-to-br from-sage-light/20 to-sage/10 border border-sage-light/30 shadow-lg">
      <div className="flex items-start space-x-[4vw] max-space-x-4">
        <div className="w-[12vw] h-[12vw] max-w-14 max-h-14 rounded-[3vw] max-rounded-xl bg-gradient-to-br from-sage to-sage-dark flex items-center justify-center flex-shrink-0">
          <UserCheck className="w-[6vw] h-[6vw] max-w-7 max-h-7 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-[min(4.5vw,1.125rem)] font-semibold text-gray-900 mb-[1vw]">
            {title}
          </h3>
          {metadata?.highlight && (
            <p className="text-[min(3.5vw,0.875rem)] font-medium text-sage-dark mb-[2vw]">
              {metadata.highlight}
            </p>
          )}
          <p className="text-[min(3.5vw,0.875rem)] text-gray-700 mb-[3vw]">
            {description}
          </p>
          {metadata?.benefits && (
            <ul className="space-y-[1vw] mb-[3vw]">
              {metadata.benefits.map((benefit, idx) => (
                <li key={idx} className="flex items-center space-x-[2vw] text-[min(3vw,0.75rem)] text-gray-600">
                  <CheckCircle className="w-[3vw] h-[3vw] max-w-4 max-h-4 text-sage flex-shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          )}
          <button
            onClick={handleBookConsultation}
            className="w-full py-[3vw] max-py-3 px-[5vw] max-px-6 bg-gradient-to-r from-sage to-sage-dark text-white rounded-[3vw] max-rounded-xl font-medium text-[min(4vw,1rem)] hover:from-sage-dark hover:to-sage-dark transition-all shadow-md hover:shadow-lg active:scale-[0.98] touch-feedback"
          >
            Book Free Consultation
          </button>
        </div>
      </div>
    </div>
  );
};
```

### 2. Expert Help in Thrivings
```typescript
// src/components/features/ThrivingExpertHelp.tsx
interface ThrivingExpertHelpProps {
  thriving: Thriving;
}

export const ThrivingExpertHelp: React.FC<ThrivingExpertHelpProps> = ({ thriving }) => {
  if (!FEATURE_FLAGS.EXPERT_CONSULTATION) return null;

  const handleGetExpertHelp = () => {
    const message = `I need help with my "${thriving.title}" routine. I've been following it for ${getDaysSince(thriving.createdAt)} days, but I'm still struggling.`;
    
    // Store thriving context
    const consultationContext = {
      thrivingId: thriving.id,
      thrivingTitle: thriving.title,
      daysSinceCreated: getDaysSince(thriving.createdAt),
      originThreadId: thriving.origin?.threadId,
      requestType: 'thriving_help'
    };
    
    sessionStorage.setItem('consultationContext', JSON.stringify(consultationContext));
    
    // If thriving has origin thread, navigate there
    if (thriving.origin?.threadId) {
      router.push(`/chat/${thriving.origin.threadId}?expertHelp=true&message=${encodeURIComponent(message)}`);
    } else {
      // Create new chat with expert help context
      router.push(`/chat/new?expertHelp=true&thrivingId=${thriving.id}&message=${encodeURIComponent(message)}`);
    }
  };

  return (
    <div className="mt-[6vw] p-[4vw] max-p-4 rounded-[3vw] max-rounded-xl bg-gray-50 border border-gray-200">
      <h4 className="text-[min(4vw,1rem)] font-semibold text-gray-800 mb-[2vw]">
        Need personalized guidance?
      </h4>
      <p className="text-[min(3.5vw,0.875rem)] text-gray-600 mb-[3vw]">
        Get expert help to optimize your routine and achieve better results.
      </p>
      <button
        onClick={handleGetExpertHelp}
        className="text-[min(3.5vw,0.875rem)] font-medium text-sage-dark hover:text-sage transition-colors"
      >
        Connect with an Expert →
      </button>
    </div>
  );
};
```

## API Endpoints

### 1. Consultation Summary Webhook
```typescript
// app/api/consultation/summary/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { FEATURE_FLAGS } from '@/src/config/features';

export async function POST(request: NextRequest) {
  if (!FEATURE_FLAGS.EXPERT_CONSULTATION) {
    return NextResponse.json({ error: 'Feature disabled' }, { status: 403 });
  }

  try {
    const { 
      consultationId,
      threadId,
      expertName,
      duration,
      summary,
      recommendations,
      nextSteps,
      followUpDate
    } = await request.json();

    // Validate webhook authenticity (implement HMAC verification)
    const isValid = await verifyWebhookSignature(request);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Create a formatted message for the chat thread
    const consultationMessage = {
      role: 'assistant',
      content: JSON.stringify({
        type: 'consultation_summary',
        greeting: `Your consultation with ${expertName} has been completed!`,
        sections: [
          {
            title: 'Consultation Summary',
            content: summary
          },
          {
            title: 'Personalized Recommendations',
            items: recommendations
          },
          {
            title: 'Next Steps',
            items: nextSteps
          }
        ],
        followUp: followUpDate ? {
          date: followUpDate,
          message: 'Your follow-up consultation is scheduled.'
        } : null
      })
    };

    // Add message to the original thread
    await addMessageToThread(threadId, consultationMessage);

    // Store consultation record
    await storeConsultationRecord({
      consultationId,
      threadId,
      userId: getUserIdFromThread(threadId),
      summary,
      recommendations,
      nextSteps,
      completedAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Consultation summary error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

### 2. Consultation Context Storage
```typescript
// src/utils/consultationStorage.ts
interface ConsultationRecord {
  consultationId: string;
  threadId: string;
  thrivingId?: string;
  userConcerns: string[];
  expertName: string;
  scheduledAt: string;
  completedAt?: string;
  summary?: string;
  recommendations?: string[];
  nextSteps?: string[];
  followUpDate?: string;
}

export const storeConsultationContext = (context: Partial<ConsultationRecord>) => {
  const records = getConsultationRecords();
  records.push({
    ...context,
    consultationId: generateConsultationId(),
    scheduledAt: new Date().toISOString()
  });
  localStorage.setItem('thrive_consultations', JSON.stringify(records));
};

export const getConsultationRecords = (): ConsultationRecord[] => {
  const stored = localStorage.getItem('thrive_consultations');
  return stored ? JSON.parse(stored) : [];
};
```

## Shopify Integration Requirements

### 1. Booking Page Requirements
The Shopify booking page should:
- Accept URL parameters: `ref`, `context`, `concerns`
- Generate unique booking IDs
- Send booking confirmation webhook to Thrive app
- Include video meeting link in confirmation

### 2. Post-Consultation Webhook
Shopify should send a webhook after consultation with:
```json
{
  "consultationId": "cons_123456",
  "bookingId": "book_789012",
  "threadId": "thread_abc123",
  "expertName": "Dr. Sarah Johnson",
  "duration": 45,
  "summary": "Discussed sleep issues and medication timing...",
  "recommendations": [
    "Adjust evening routine to include meditation",
    "Consider magnesium supplementation",
    "Track sleep patterns for 2 weeks"
  ],
  "nextSteps": [
    "Download sleep tracking app",
    "Schedule follow-up in 2 weeks",
    "Start recommended supplement routine"
  ],
  "followUpDate": "2024-02-01T10:00:00Z",
  "videoRecordingUrl": "https://..."
}
```

## Enhanced Thriving Model

### 1. Update Thriving Type
```typescript
// src/types/thriving.ts
interface ThrivingOrigin {
  threadId?: string;
  messageId?: string;
  context?: string;
  createdFrom: 'chat' | 'manual' | 'template' | 'expert_recommendation';
  consultationId?: string; // Link to expert consultation if created from one
}

interface Thriving {
  // existing fields...
  origin?: ThrivingOrigin;
  expertNotes?: {
    consultationId: string;
    recommendations: string[];
    lastReviewedAt: string;
  };
}
```

### 2. Update Routine Creation
```typescript
// When creating routine from chat
const handleRoutineCreation = async (routineData, { threadId, messageId }) => {
  const response = await fetch('/api/routine/create', {
    method: 'POST',
    body: JSON.stringify({
      ...routineData,
      origin: {
        threadId,
        messageId,
        context: extractConversationContext(),
        createdFrom: 'chat'
      }
    })
  });
};
```

## Testing Checklist

- [ ] Feature flag enables/disables all expert consultation features
- [ ] Assistant only shows expert option when feature flag is enabled
- [ ] Booking URL opens with correct parameters
- [ ] Context is preserved through booking flow
- [ ] Consultation summary webhook is received and processed
- [ ] Summary appears in correct chat thread
- [ ] Expert help from thrivings navigates correctly
- [ ] Mobile viewport units work correctly on all components
- [ ] Touch targets meet 44px minimum requirement

## Deployment Steps

1. Set environment variables in production
2. Enable feature flag for beta testing
3. Configure Shopify webhook endpoints
4. Test end-to-end flow with test bookings
5. Monitor consultation completion rates
6. Gradually roll out to all users

## Security Considerations

1. Verify webhook signatures from Shopify
2. Sanitize all consultation summaries before display
3. Encrypt sensitive consultation data
4. Implement rate limiting on consultation endpoints
5. Ensure HIPAA compliance for health data