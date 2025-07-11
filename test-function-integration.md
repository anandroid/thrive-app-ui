# Function Integration Test Plan

## Overview
Testing the multi-assistant function call integration to ensure proper error handling and graceful degradation when functions fail.

## Current Architecture

### Function Call Flow:
1. **Assistant requests function** → Sent via streaming response with type: 'function_call'
2. **Client executes function** → `executeClientSideFunctions` in clientFunctionHandler.ts
3. **Client submits results** → POST to /api/assistant/submit-tool-outputs
4. **Assistant processes results** → Continues conversation based on function output

### Error Handling Points:

#### 1. Function Execution (clientFunctionHandler.ts)
```typescript
// Each function is wrapped in try-catch
try {
  result = await handleGetPantryItems(args);
} catch (error) {
  results.push({
    tool_call_id: call.id,
    output: JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Function execution failed' 
    })
  });
}
```

#### 2. Assistant Instructions (commonInstructions.ts)
```
### Error Handling
- Graceful degradation for missing data
- Clear error messages
- Alternative suggestions
- Never leave user without options
```

## Test Scenarios

### 1. Test Pantry Function Failure
**Setup**: Clear localStorage or corrupt pantry data
**Expected**: Assistant should gracefully handle empty/corrupted data

### 2. Test Network Failure
**Setup**: Disable network during function submission
**Expected**: User sees clear error message, can retry

### 3. Test Invalid Function Arguments
**Setup**: Manually trigger function with bad arguments
**Expected**: Function returns error, assistant provides alternative

### 4. Test Multiple Function Calls
**Setup**: Trigger scenario requiring multiple functions
**Expected**: All execute sequentially, errors don't break the chain

## Testing Steps

### Manual Test 1: Pantry Function Error
1. Open Developer Console
2. Run: `localStorage.removeItem('thriveApp_pantryItems')`
3. Send message: "What supplements do I have in my pantry?"
4. **Expected**: Assistant acknowledges empty pantry, suggests adding items

### Manual Test 2: Corrupted Data
1. Run: `localStorage.setItem('thriveApp_pantryItems', 'invalid json')`
2. Send message: "Show me my supplements"
3. **Expected**: Assistant handles gracefully, suggests starting fresh

### Manual Test 3: Function Timeout
1. Add delay to clientFunctionHandler:
```javascript
// In handleGetPantryItems
await new Promise(resolve => setTimeout(resolve, 30000)); // 30s delay
```
2. Send message requesting pantry items
3. **Expected**: Timeout handled, user can continue conversation

### Manual Test 4: Assistant Handoff with Functions
1. Start with chat assistant: "I need help with sleep"
2. Trigger routine creation (handoff to routine assistant)
3. Ensure function calls work across assistant boundaries
4. **Expected**: Functions work seamlessly across assistants

## Code Modifications for Testing

### Add Debug Logging
In `clientFunctionHandler.ts`, add:
```typescript
console.log(`[FUNCTION] Executing ${functionName} with args:`, args);
console.log(`[FUNCTION] Result:`, result);
```

### Add Failure Simulation
Create test mode in clientFunctionHandler:
```typescript
// Add at top of file
const TEST_MODE = localStorage.getItem('test_function_failures') === 'true';

// In each handler
if (TEST_MODE && Math.random() < 0.5) {
  throw new Error('Simulated function failure for testing');
}
```

## Verification Checklist

- [ ] Functions execute successfully in normal conditions
- [ ] Error responses are properly formatted JSON
- [ ] Assistant acknowledges function errors gracefully
- [ ] Assistant provides alternatives when functions fail
- [ ] No conversation-breaking errors occur
- [ ] Function results are used appropriately in responses
- [ ] Multiple function calls work in sequence
- [ ] Functions work across assistant handoffs

## Expected Assistant Behaviors

### When Pantry Function Fails:
- "I'm having trouble accessing your pantry items right now."
- "Let me help you add items to track."
- Provides general supplement recommendations

### When Health History Search Fails:
- "I couldn't search your health history at the moment."
- "Could you tell me more about your recent symptoms?"
- Continues conversation without the data

### When All Functions Fail:
- Continues providing helpful advice
- Uses general knowledge
- Suggests manual tracking options
- Never shows technical errors to user

## Monitoring

Watch for these console messages:
- `[FUNCTION] Executing...` - Function started
- `[FUNCTION] Result:` - Function completed
- `Error in function...` - Function failed
- `Submit tool outputs received` - Server processing
- `Submit stream completed` - Full cycle done