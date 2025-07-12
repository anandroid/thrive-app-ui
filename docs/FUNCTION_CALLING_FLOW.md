# OpenAI Assistant Function Calling Flow

## Overview
When using OpenAI's Assistants API with function calling, there's a specific flow that differs from regular chat completions. The assistant doesn't directly return the final JSON response when it needs to call a function.

## The Function Call Round-Trip

### 1. Initial Request
User sends a message to the assistant via `/api/assistant/stream`:
```json
{
  "message": "I want to sleep better",
  "threadId": "thread_abc123",
  "basicContext": {
    "pantryItems": [],
    "activeRoutines": []
  }
}
```

### 2. Assistant Decides to Call a Function
Instead of returning the final response, the assistant enters `requires_action` state and emits:
```json
{
  "status": "requires_action",
  "required_action": {
    "type": "submit_tool_outputs",
    "submit_tool_outputs": {
      "tool_calls": [
        {
          "id": "call_xyz789",
          "type": "function",
          "function": {
            "name": "get_pantry_items",
            "arguments": "{\"category\":\"all\"}"
          }
        }
      ]
    }
  }
}
```

### 3. Client Executes Functions
The client receives the function call request and:
1. Executes the requested function(s) locally
2. Sends results back via `/api/assistant/submit-tool-outputs`:
```json
{
  "threadId": "thread_abc123",
  "runId": "run_def456",
  "toolOutputs": [
    {
      "tool_call_id": "call_xyz789",
      "output": "{\"total\":0,\"items\":[]}"
    }
  ]
}
```

### 4. Assistant Processes Results and Responds
Only NOW does the assistant generate the final user-facing JSON response:
```json
{
  "greeting": "I understand you want to improve your sleep quality. Let me help you explore natural solutions 🌙",
  "attentionRequired": null,
  "emergencyReasoning": null,
  "actionItems": [],
  "additionalInformation": "<p><em>Quality sleep is the foundation of good health.</em></p>",
  "actionableItems": [
    {
      "type": "supplement_choice",
      "title": "Consider Magnesium for Better Sleep 🌙",
      "description": "Magnesium glycinate promotes relaxation and improves sleep quality",
      "productName": "Magnesium Glycinate",
      "dosage": "200-400mg",
      "timing": "30 minutes before bed"
    }
  ],
  "questions": [
    {
      "id": "sleep_issue",
      "type": "quick_reply",
      "prompt": "What's your main sleep challenge?",
      "userVoice": "I have trouble",
      "quickOptions": ["Falling asleep", "Staying asleep", "Waking too early", "All of the above"]
    }
  ]
}
```

## Key Implementation Details

### 1. Stream Endpoint (`/api/assistant/stream`)
- Creates a run which may enter `requires_action` state
- If functions are needed, emits a `function_call` event
- Client must handle this and call submit-tool-outputs

### 2. Submit Tool Outputs Endpoint (`/api/assistant/submit-tool-outputs`)
- Receives function execution results
- Submits them to OpenAI
- Waits for the run to complete
- Streams the final assistant response back

### 3. Client-Side Handling (`SmartCardChat.tsx`)
```typescript
// Handle function call requests
if (data.type === 'function_call') {
  const results = await executeFunctions(data.toolCalls);
  // Submit results back
  const response = await fetch('/api/assistant/submit-tool-outputs', {
    method: 'POST',
    body: JSON.stringify({
      threadId: data.threadId,
      runId: data.runId,
      toolOutputs: results
    })
  });
  // Process the final response stream
}
```

## Important Notes

1. **Two-Phase Response**: The assistant's instructions about "always return JSON" apply to the FINAL response after function results are processed, not the initial function call stub.

2. **Response Format**: The `response_format: { type: 'json_object' }` configuration ensures the final user-facing response is JSON, but doesn't affect the function calling mechanism.

3. **Context Optimization**: The basicContext helps the assistant decide whether to call functions or respond directly, reducing unnecessary round trips.

## Common Issues

1. **"Routine not found" errors**: Usually caused by calling non-existent functions (e.g., `get_user_preferences` instead of `get_thriving_progress`)

2. **Plain text responses**: Can occur if the assistant doesn't honor the JSON format after processing function results. The `response_format` configuration helps enforce this.

3. **Unnecessary function calls**: Happens when the assistant doesn't properly use basicContext to determine if it already has the needed information.