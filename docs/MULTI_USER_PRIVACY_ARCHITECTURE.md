# Multi-User Privacy Architecture

## Overview

This app is designed with a **privacy-first, local-storage approach** that allows multiple users to use the app while keeping all their data completely private and local to their device.

## How It Works

### 1. Data Storage
- **All user data stays on the user's device** in localStorage
- No user data is stored on servers
- Each user's browser has their own isolated data
- Data includes: pantry items, wellness routines, journal entries

### 2. OpenAI Assistant Context

The OpenAI Assistant needs to know about the user's data to provide personalized recommendations, but we achieve this WITHOUT uploading user data:

```
User Device                 Server                    OpenAI
    |                          |                         |
    |-- Query ----------------->|                         |
    |                          |-- Ask Assistant ------->|
    |                          |<-- Function Call Request-|
    |<-- Function Call ---------|                         |
    |                          |                         |
    |-- Execute Locally        |                         |
    |   (Access localStorage)  |                         |
    |                          |                         |
    |-- Function Results ----->|                         |
    |                          |-- Submit Results ------>|
    |                          |<-- Final Response ------|
    |<-- Assistant Response ---|                         |
```

### 3. Function Execution Flow

1. **User sends a message** to the assistant
2. **Assistant determines** it needs user data (e.g., "What supplements do I have?")
3. **Server sends function call** to the client
4. **Client executes function** locally with access to localStorage:
   ```javascript
   // This runs in the browser, not on server
   const items = getPantryItems(); // Reads from localStorage
   ```
5. **Client sends results** back to server
6. **Server forwards to OpenAI** to continue the conversation
7. **Assistant responds** with personalized advice

### 4. Multi-User Support

This architecture naturally supports multiple users:

- **User A on Device A**: Has their own localStorage with their data
- **User B on Device B**: Has completely separate localStorage
- **Same user on different devices**: Each device has its own data (no sync)

### 5. Privacy Benefits

1. **No data leaves the device** except function results
2. **No user database** on servers
3. **No authentication needed** (each device is independent)
4. **GDPR/HIPAA friendly** - no health data stored on servers
5. **No data breaches possible** - there's no central data to breach

### 6. Function Security

The client-side function handler only exposes specific, safe operations:
- `get_pantry_items` - Read-only access to pantry
- `get_thriving_progress` - Read-only access to routines
- `search_health_history` - Read-only search in journals
- `get_supplement_recommendations` - Generates recommendations

No functions can:
- Modify data
- Access other users' data
- Execute arbitrary code
- Access sensitive browser APIs

### 7. Limitations

1. **No cross-device sync** - Data stays on each device
2. **No data backup** - Users must export/import manually
3. **Browser storage limits** - ~5-10MB per domain
4. **Clearing browser data** will delete all user data

### 8. Future Enhancements

To add optional cloud sync while maintaining privacy:

1. **End-to-end encryption** - Encrypt data before leaving device
2. **Zero-knowledge architecture** - Server never sees decrypted data
3. **Optional opt-in** - Users choose whether to enable sync
4. **Local-first** - App works fully offline, sync is just for backup

## Implementation Details

### Client-Side Function Handler
```typescript
// src/services/openai/functions/clientFunctionHandler.ts
export async function executeClientSideFunctions(
  functionCalls: FunctionCall[]
): Promise<FunctionResult[]> {
  // Executes functions with access to localStorage
  // Returns results to send back to OpenAI
}
```

### Streaming Service Changes
```typescript
// Instead of executing server-side:
// ❌ const result = await handleFunctionCall(functionName, args);

// We send to client:
// ✅ controller.enqueue(encode({ type: 'function_call', toolCalls }));
```

### Chat Component Integration
```typescript
// SmartCardChat.tsx
if (data.type === 'function_call') {
  // Import and execute client-side
  const { executeClientSideFunctions } = await import('...');
  const toolOutputs = await executeClientSideFunctions(data.toolCalls);
  
  // Send results back
  await fetch('/api/assistant/submit-tool-outputs', {
    body: JSON.stringify({ toolOutputs })
  });
}
```

## Summary

This architecture provides a unique balance of:
- **Privacy**: All data stays local
- **Functionality**: AI assistant can still access user data
- **Multi-user**: Each user's data is isolated
- **Simplicity**: No auth, no user management, no databases

Perfect for health and wellness apps where privacy is paramount!