# Multi-Assistant Architecture Documentation

## Overview

The Thrive AI platform now supports a team-based assistant architecture where specialized assistants handle different aspects of wellness support. This improves response quality, reduces context confusion, and provides more focused expertise.

## Architecture Design

### Assistant Team Members

1. **Chat Specialist** (`THRIVE_CHAT_ASSISTANT_ID`)
   - General wellness conversations
   - Initial health assessments
   - Holistic remedy suggestions
   - Triage to other specialists

2. **Routine Specialist** (`THRIVE_ROUTINE_ASSISTANT_ID`)
   - Creates personalized wellness routines (thrivings)
   - Adjusts existing routines
   - Schedule optimization
   - Habit formation strategies

3. **Pantry Specialist** (`THRIVE_PANTRY_ASSISTANT_ID`)
   - Supplement recommendations
   - Medication tracking
   - Pantry organization
   - Interaction awareness

### Shared Components

#### Common Instructions (`/src/services/openai/assistant/team/commonInstructions.ts`)
- Team identity and values
- Communication standards
- Response format requirements
- Safety protocols
- Data consistency rules

#### Shared Functions (`/src/services/openai/assistant/team/sharedFunctions.ts`)
- `get_pantry_items` - Access user's pantry
- `get_thriving_progress` - Check routine progress
- `search_health_history` - Query health records

### Assistant Selection Logic

The system automatically routes messages to the appropriate assistant based on:

1. **Message Content Analysis**
   - Keywords and intent patterns
   - Health concern type
   - Requested action

2. **Conversation Context**
   - Current flow (routine creation, pantry management)
   - Previous assistant interaction
   - User's current needs

3. **Smart Handoffs**
   - Seamless transitions between specialists
   - Context preservation
   - Clear handoff messages

## Implementation Guide

### 1. Create the Assistant Team

Run the setup script to create all three assistants:

```bash
node scripts/create-assistant-team-simple.js
```

This will:
- Create/update three specialized assistants
- Add their IDs to `.env.local`

### 2. Environment Configuration

```env
# Multi-assistant IDs
THRIVE_CHAT_ASSISTANT_ID=asst_xxx
THRIVE_ROUTINE_ASSISTANT_ID=asst_yyy
THRIVE_PANTRY_ASSISTANT_ID=asst_zzz
```

### 3. API Usage

The system provides one unified API endpoint:

#### Multi-Assistant Endpoint
```
POST /api/assistant/stream
```

The endpoint automatically:
- Selects the appropriate assistant based on intent
- Handles handoffs between specialists
- Maintains conversation context
- Provides seamless experience

### 4. Client Integration

The client code uses the unified endpoint:

```typescript
// In SmartCardChat or similar component
const response = await fetch('/api/assistant/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: userMessage,
    threadId: currentThreadId,
    basicContext: {
      pantryCount: pantryItems.length,
      activeRoutineCount: routines.filter(r => r.isActive).length,
      routineTypes: routines.map(r => r.type).join(', ')
    }
  })
});
```

## Testing Guide

### Test Scenarios

1. **Chat Specialist Tests**
   ```
   "I have trouble sleeping"
   "What natural remedies help with headaches?"
   "I'm feeling stressed lately"
   ```

2. **Routine Specialist Tests**
   ```
   "Create a sleep routine for me"
   "I want to build a morning wellness routine"
   "Adjust my meditation routine"
   ```

3. **Pantry Specialist Tests**
   ```
   "What supplements help with sleep?"
   "Can I take magnesium with my blood pressure medication?"
   "Help me organize my supplements"
   ```

4. **Handoff Tests**
   ```
   User: "I have trouble sleeping"
   Chat: [Provides remedies]
   User: "Can you create a routine for this?"
   System: [Hands off to Routine Specialist]
   ```

### Monitoring Assistant Selection

The API logs which assistant is selected:
```
API Route: Using multi-assistant mode
Selected assistant: routine for message: "Create a sleep routine"
```

## Benefits

1. **Improved Response Quality**
   - Specialized knowledge per domain
   - Reduced context confusion
   - More focused instructions

2. **Better Performance**
   - Smaller, focused system prompts
   - Faster response times
   - More accurate function calling

3. **Scalability**
   - Easy to add new specialists
   - Independent assistant updates
   - A/B testing capabilities

4. **User Experience**
   - Seamless specialist transitions
   - Consistent team personality
   - Expert-level responses


## Troubleshooting

### Common Issues

1. **Assistant Not Found**
   - Check all assistant IDs in `.env.local`
   - Verify `THRIVE_ENABLE_MULTI_ASSISTANT=true`
   - Ensure assistants were created successfully

2. **Wrong Assistant Selected**
   - Review intent patterns in `assistantManager.ts`
   - Check conversation context
   - Add more specific keywords

3. **Handoff Issues**
   - Verify thread state management
   - Check handoff messages
   - Review assistant instructions

### Debug Mode

Enable detailed logging:
```typescript
// In multiAssistantService.ts
console.log('Selected assistant:', selectedRole);
console.log('Thread state:', threadState);
console.log('Is handoff:', isHandoff);
```

## Future Enhancements

1. **Additional Specialists**
   - Exercise Coach
   - Nutrition Expert
   - Mental Health Counselor

2. **Advanced Features**
   - Multi-assistant collaboration
   - Specialist conferences
   - Learning from interactions

3. **Analytics**
   - Assistant performance metrics
   - User satisfaction by specialist
   - Handoff success rates