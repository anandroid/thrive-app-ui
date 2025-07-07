# OpenAI Services - Healing AI

This folder contains the extracted business logic for all OpenAI API integrations used in the Healing AI application.

## Overview

The OpenAI services are organized into the following modules:

- **Chat Services**: Handles streaming conversations with the OpenAI Assistant
- **Routine Services**: Creates and adjusts personalized wellness routines
- **Assistant Services**: Manages OpenAI Assistant configuration
- **Types**: Shared TypeScript interfaces
- **Utils**: Common utilities and error handling

## Services

### 1. StreamingChatService

Handles real-time streaming chat interactions with the OpenAI Assistant API.

```typescript
import { StreamingChatService } from '@/services/openai';

const chatService = new StreamingChatService(
  process.env.OPENAI_API_KEY!,
  process.env.OPENAI_ASSISTANT_ID!
);

// Create a new thread
const thread = await chatService.createThread();

// Send a message
await chatService.sendMessage(thread.id, "I have a headache");

// Create streaming response
const stream = chatService.createStreamingResponse(thread.id);
const headers = chatService.getStreamHeaders();

// Return as Response
return new Response(stream, { headers });
```

**Features:**
- Thread management (create new or use existing)
- Real-time streaming using Server-Sent Events (SSE)
- Automatic error handling and stream completion
- Thread ID persistence for conversation continuity

### 2. RoutineCreationService

Creates AI-generated wellness routines based on user's health concerns.

```typescript
import { RoutineCreationService } from '@/services/openai';

const routineService = new RoutineCreationService(process.env.OPENAI_API_KEY!);

const routine = await routineService.createRoutine({
  routineType: 'ai_determined', // or specific type
  duration: '7_days',
  frequency: 'ai_determined', // or specific frequency
  healthConcern: 'chronic back pain',
  customInstructions: 'I prefer yoga over medication',
  sleepTime: '23:00',
  wakeTime: '07:00'
});
```

**Features:**
- AI-determined routine types based on health concerns
- AI-determined frequency based on routine type and duration
- Personalized scheduling based on sleep patterns
- Structured JSON output with steps, outcomes, and safety notes
- Video tutorial search queries for each step

**Routine Types:**
- `sleep_routine`: For sleep issues and insomnia
- `stress_management`: For stress and anxiety
- `pain_relief`: For pain management
- `meditation`: For mindfulness and calm
- `exercise`: For fitness and weight management
- `wellness_routine`: General wellness (default)

**Frequencies:**
- `hourly`: For acute pain or medication reminders
- `twice_daily`: For moderate conditions
- `daily`: For general wellness
- `ai_determined`: Let AI decide based on condition

### 3. RoutineAdjustmentService

Modifies existing routines based on user feedback.

```typescript
import { RoutineAdjustmentService } from '@/services/openai';

const adjustService = new RoutineAdjustmentService(process.env.OPENAI_API_KEY!);

const adjustedRoutine = await adjustService.adjustRoutine({
  routine: existingRoutine,
  adjustmentRequest: "I wake up at 5am now, please adjust morning activities"
});
```

**Features:**
- Preserves routine structure while updating content
- Updates reminder times to match new schedules
- Maintains adjustment history
- Adds new steps based on user requirements

### 4. AssistantConfigService

Manages OpenAI Assistant configuration and settings.

```typescript
import { AssistantConfigService } from '@/services/openai';

const configService = new AssistantConfigService(process.env.OPENAI_API_KEY!);

// Create a new assistant
const assistant = await configService.createAssistant({
  name: "Healing AI",
  model: "gpt-4o-mini"
});

// Update existing assistant
await configService.updateAssistant(assistantId);

// Get assistant details
const details = await configService.getAssistant(assistantId);
```

**Features:**
- Create, update, retrieve, and delete assistants
- Predefined instructions for Healing AI behavior
- JSON response format enforcement
- Emergency detection and handling

### 5. Helper Classes

#### RoutineOptimizer
Determines optimal routine types and frequencies based on health concerns.

```typescript
const optimizer = new RoutineOptimizer();
const routineType = optimizer.determineOptimalRoutineType("I can't sleep");
// Returns: 'sleep_routine'

const frequency = optimizer.determineOptimalFrequency('pain_relief', '7_days');
// Returns: 'hourly'
```

#### RoutinePromptBuilder
Builds structured prompts for routine creation.

```typescript
const promptBuilder = new RoutinePromptBuilder();
const prompt = promptBuilder.buildRoutineCreationPrompt(params);
const systemPrompt = promptBuilder.getSystemPrompt();
```

## Types

### Core Interfaces

```typescript
interface AssistantResponse {
  greeting: string;
  attentionRequired: string | null;
  emergencyReasoning: string | null;
  actionItems: ActionItem[];
  additionalInformation: string;
  actionableItems: ActionableItem[];
  questions: string[];
}

interface Routine {
  id: string;
  createdAt: string;
  routineType: string;
  duration: string;
  frequency: string;
  healthConcern: string;
  routineTitle: string;
  routineDescription: string;
  totalSteps: number;
  reminderFrequency: string;
  steps: RoutineStep[];
  additionalSteps: AdditionalStep[];
  expectedOutcomes: string[];
  safetyNotes: string[];
  progressTracking: string;
}
```

## Utilities

### Error Handling

```typescript
import { OpenAIError, handleOpenAIError } from '@/services/openai';

try {
  // OpenAI API call
} catch (error) {
  handleOpenAIError(error);
}
```

### Validation

```typescript
import { validateApiKey, validateAssistantId } from '@/services/openai';

const apiKey = validateApiKey(process.env.OPENAI_API_KEY);
const assistantId = validateAssistantId(process.env.OPENAI_ASSISTANT_ID);
```

### SSE Utilities

```typescript
import { createSSEMessage, parseSSEMessage } from '@/services/openai';

// Create SSE message
const message = createSSEMessage({ type: 'delta', content: 'Hello' });

// Parse SSE message
const parsed = parseSSEMessage('data: {"type":"delta","content":"Hello"}\n\n');
```

## Environment Variables

Required environment variables:

```env
OPENAI_API_KEY=sk-proj-...
OPENAI_ASSISTANT_ID=asst_JpIzQR8eZ58ED8aKMkryZv3y
```

## Usage in API Routes

### Example: Streaming Chat Route

```typescript
// app/api/assistant/stream/route.ts
import { NextRequest } from 'next/server';
import { StreamingChatService, validateApiKey, validateAssistantId } from '@/services/openai';

export async function POST(req: NextRequest) {
  try {
    const apiKey = validateApiKey(process.env.OPENAI_API_KEY);
    const assistantId = validateAssistantId(process.env.OPENAI_ASSISTANT_ID);
    
    const chatService = new StreamingChatService(apiKey, assistantId);
    const { threadId, message } = await req.json();

    let thread;
    if (!threadId) {
      thread = await chatService.createThread();
    } else {
      thread = { id: threadId };
    }

    await chatService.sendMessage(thread.id, message);
    const stream = chatService.createStreamingResponse(thread.id);

    return new Response(stream, {
      headers: chatService.getStreamHeaders(),
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to create stream' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
```

### Example: Routine Creation Route

```typescript
// app/api/routine/create/route.ts
import { NextRequest } from 'next/server';
import { RoutineCreationService, validateApiKey } from '@/services/openai';

export async function POST(req: NextRequest) {
  try {
    const apiKey = validateApiKey(process.env.OPENAI_API_KEY);
    const routineService = new RoutineCreationService(apiKey);
    
    const params = await req.json();
    const routine = await routineService.createRoutine(params);

    return new Response(JSON.stringify({ success: true, routine }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to create routine' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
```

## Testing

When testing these services, you can mock the OpenAI client:

```typescript
// Mock OpenAI responses
jest.mock('openai', () => ({
  default: jest.fn().mockImplementation(() => ({
    beta: {
      threads: {
        create: jest.fn().mockResolvedValue({ id: 'thread_123' }),
        messages: {
          create: jest.fn().mockResolvedValue({})
        },
        runs: {
          stream: jest.fn().mockReturnValue(mockStream)
        }
      },
      assistants: {
        create: jest.fn(),
        update: jest.fn(),
        retrieve: jest.fn()
      }
    },
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: { content: JSON.stringify(mockRoutine) }
          }]
        })
      }
    }
  }))
}));
```

## Best Practices

1. **Always validate API keys and assistant IDs** before using services
2. **Handle errors gracefully** using the provided error utilities
3. **Use TypeScript interfaces** for type safety
4. **Keep API keys secure** - never commit them to version control
5. **Monitor API usage** to avoid rate limits
6. **Cache responses** where appropriate to reduce API calls
7. **Test with mock data** during development

## Future Enhancements

- Add response caching layer
- Implement retry logic with exponential backoff
- Add telemetry and monitoring
- Support for multiple assistants
- Batch processing for routines
- Export/import routine templates