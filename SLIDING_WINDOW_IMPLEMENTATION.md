# Sliding Window Context Implementation

## Overview
Implemented a sliding window context management system that maintains the last 10 messages in each conversation thread. This allows the assistants to have context awareness while keeping costs low.

## Key Changes

### 1. Updated Assistant Models
- Changed all three assistants (Chat, Routine, Pantry) to use `gpt-4.1-nano-2025-04-14`
- Updated via `scripts/create-assistant-team-simple.js`

### 2. Context Management Components

#### ContextCache (`src/services/openai/context/contextCache.ts`)
- Singleton class that maintains conversation history locally
- Stores up to 10 messages per thread
- Provides context summaries for assistant instructions
- Automatically removes oldest messages when limit is reached

#### SlidingWindowManager (`src/services/openai/context/slidingWindowManager.ts`)
- Manages the sliding window of messages
- Configurable window size (default: 10 messages)
- Generates context summaries from recent messages
- Extracts health-related keywords and concerns

### 3. Integration with MultiAssistantService

The `multiAssistantService.ts` now:
- Stores all messages (user and assistant) in the context cache
- Uses cached context instead of fetching from API
- Adds context summaries to assistant instructions
- Falls back to API if cache is empty (e.g., on server restart)

## How It Works

1. **Message Storage**: When a user sends a message, it's added to both the OpenAI thread and the local context cache.

2. **Context Window**: The system maintains the last 10 messages (5 user + 5 assistant exchanges).

3. **Context Summary**: Before each assistant response, a summary of recent topics is generated and added to the assistant's instructions.

4. **Automatic Cleanup**: When a thread is deleted, its context cache is also cleared.

## Benefits

- **Cost Effective**: Only processes last 10 messages instead of entire conversation history
- **Fast Response**: Uses local cache instead of API calls for context
- **Context Aware**: Assistants maintain awareness of recent conversation topics
- **Seamless Handoffs**: Context is preserved when switching between specialists

## Testing

Access the test page at `/test-context` to:
- Send multiple messages to test the sliding window
- Verify that assistants remember recent context
- Check that very old messages are forgotten after 10 new ones

## Example Context Summary
```
Recent topics: sleep, stress, melatonin, magnesium. Concerns: trouble sleeping, supplement dosage
```

This summary is automatically generated and included in each assistant's instructions.