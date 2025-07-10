# Testing Client-Side Function Execution

## Setup
1. Make sure the dev server is running: `npm run dev`
2. Open http://localhost:3001/test-functions
3. Click "Setup Test Data" to populate localStorage with sample data

## Test Cases

### 1. Test Direct Function Execution (Manual Test Page)
- Go to http://localhost:3001/test-functions
- Click each button to test individual functions
- Verify results show the test data from localStorage

### 2. Test Assistant Integration
- Go to http://localhost:3001
- Start a new chat
- Try these prompts that should trigger function calls:

**Pantry Questions:**
- "What supplements do I have?"
- "Do I have any vitamins?"
- "What's in my pantry?"

**Routine Questions:**
- "What are my active routines?"
- "Show me my wellness routines"
- "What routines am I following?"

**Health History:**
- "Search my health history for sleep"
- "Have I mentioned headaches recently?"

**Recommendations:**
- "What supplements would you recommend for sleep?"
- "Suggest some supplements I don't already have"

## Expected Behavior

1. When you ask about pantry/routines/history:
   - The assistant should trigger a function call
   - Your browser executes the function locally
   - Results are sent back to the assistant
   - Assistant responds with your actual data

2. Check browser console for:
   - "Stream event: thread.run.requires_action" - indicates function call needed
   - "Executing function: get_pantry_items" (or similar)
   - Function results being sent back

## Troubleshooting

If you see "Stream error":
1. Check browser console for detailed error
2. Ensure test data is in localStorage (use test page)
3. Verify assistant was updated with functions: `npm run update-assistant`

If functions aren't being called:
1. The assistant might not recognize the intent
2. Try more direct questions like "List all my supplements"
3. Check if the assistant has the function definitions