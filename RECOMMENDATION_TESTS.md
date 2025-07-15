# Recommendation Assistant Navigation Tests

## Overview
This test suite verifies that the recommendation assistant generates correct navigation patterns for different types of recommendations, especially ensuring chat recommendations use the actual threadId.

## Test Scenarios

### 1. Chat Follow-up Recommendation
- **Context**: User has a recent chat about weight loss
- **Expected**: `/chat/thread_abc123xyz` (actual threadId)
- **NOT Expected**: `/thrivings?id=&showAdjustment=true`
- **Widget Type**: action
- **Action Text**: "View Conversation" or "Continue Chat"

### 2. Multiple Chat Threads
- **Context**: User has 3 chat threads, most recent about sleep
- **Expected**: `/chat/thread_latest_456` (most recent threadId)
- **NOT Expected**: Older thread IDs
- **Widget Type**: action
- **Action Text**: "View Conversation" or "Continue Chat"

### 3. Thriving Routine Reminder
- **Context**: User has upcoming routine step in 30 minutes
- **Expected**: `/thrivings?id=thriving_sleep_123`
- **NOT Expected**: `/chat/` navigation
- **Widget Type**: action
- **Action Text**: "Start Routine" or "Begin"

### 4. Pantry Restock Recommendation
- **Context**: Low on Magnesium (added 35 days ago)
- **Expected**: `/pantry?action=add&name=Magnesium`
- **NOT Expected**: `/chat/` navigation
- **Widget Type**: purchase
- **Action Text**: "Order Now" or "Restock"

### 5. Journal Entry Suggestion
- **Context**: User hasn't journaled in 2 days
- **Expected**: `/thrivings/` (journal navigation)
- **NOT Expected**: `/chat/` navigation
- **Widget Type**: action
- **Action Text**: "Log", "Track", or "Journal"

### 6. Empty Context - New User
- **Context**: No data (new user)
- **Expected**: `/chat/new`
- **NOT Expected**: `/thrivings`
- **Widget Type**: action
- **Action Text**: "Get Started" or "Begin"

### 7. Health Connect Suggestion
- **Context**: User wants automatic sleep tracking
- **Expected**: `/settings/health`
- **NOT Expected**: `/chat/` navigation
- **Widget Type**: action
- **Action Text**: "Connect" or "Enable"

### 8. Routine Adjustment Needed
- **Context**: Journal indicates routine is too long
- **Expected**: `/thrivings?` (with adjustment params)
- **NOT Expected**: `/chat/new`
- **Widget Type**: action
- **Action Text**: "Adjust" or "Modify"

## Running the Tests

1. Ensure you have Node.js installed
2. Set your OpenAI API key:
   ```bash
   export OPENAI_API_KEY=your_api_key_here
   # or
   export THRIVE_OPENAI_API_KEY=your_api_key_here
   ```
3. Run the tests:
   ```bash
   node test-recommendation-assistant.js
   # or
   ./run-recommendation-tests.sh
   ```

## Expected Output
The test will:
1. Send each scenario to the recommendation assistant
2. Parse the generated widget code
3. Verify the navigation path matches expectations
4. Check widget type and action text
5. Display a summary of passed/failed tests

## Success Criteria
- All navigation patterns must match expected values
- Chat recommendations MUST use actual threadId from context
- Widget types must be appropriate for the recommendation
- Action text should be contextually relevant