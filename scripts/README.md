# Thrive Assistant Scripts

This directory contains scripts for managing the Thrive AI assistant team.

## Main Scripts

### `create-assistant-team.js`
The primary script for creating and updating all three specialized assistants (Chat, Routine, and Pantry specialists).

**Features:**
- Dynamically loads instructions from TypeScript source files
- Eliminates duplication between script and source code
- Updates existing assistants or creates new ones
- Automatically updates `.env.local` with assistant IDs

**Usage:**
```bash
npm run update-assistants
```

### `update-assistant-functions.js`
Updates function tools for existing assistants without changing their instructions.

**Usage:**
```bash
npm run update-assistant
```

## How It Works

1. **Dynamic Loading**: The `create-assistant-team.js` script reads the TypeScript files from `src/services/openai/assistant/team/` to get the latest instructions and configurations.

2. **No Duplication**: All assistant instructions are maintained in their respective TypeScript files:
   - `commonInstructions.ts` - Shared instructions for all assistants
   - `chatAssistant.ts` - Chat specialist specific instructions
   - `routineAssistant.ts` - Routine specialist specific instructions  
   - `pantryAssistant.ts` - Pantry specialist specific instructions

3. **Automatic Syncing**: When you update any TypeScript file and run `npm run update-assistants`, the changes are automatically applied to the OpenAI assistants.

## Important Notes

- Always update instructions in the TypeScript files, not in the scripts
- The script uses the `gpt-4.1-nano-2025-04-14` model by default
- Function definitions are still maintained in the script file
- Environment variables must use the `THRIVE_` prefix

## Environment Variables

Required in `.env.local`:
```
THRIVE_OPENAI_API_KEY=your-api-key
THRIVE_CHAT_ASSISTANT_ID=asst_xxx
THRIVE_ROUTINE_ASSISTANT_ID=asst_xxx
THRIVE_PANTRY_ASSISTANT_ID=asst_xxx
```