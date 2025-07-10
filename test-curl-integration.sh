#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Testing Assistant Integration with CURL${NC}\n"

# Base URL
BASE_URL="http://localhost:3000"

# Step 1: Send initial message asking about sleep supplements
echo -e "${YELLOW}Step 1: Sending initial message about sleep issues...${NC}"

RESPONSE=$(curl -s -X POST "$BASE_URL/api/assistant/stream" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have trouble sleeping. What supplements do I have that can help? If not, what should I buy?",
    "threadId": null,
    "chatIntent": null
  }')

# Parse the streaming response to extract threadId, runId, and tool calls
THREAD_ID=""
RUN_ID=""
TOOL_CALL_ID=""
FUNCTION_NAME=""

while IFS= read -r line; do
  if [[ $line == data:* ]]; then
    DATA="${line#data: }"
    
    # Extract thread ID
    if [[ $DATA == *"thread_created"* ]]; then
      THREAD_ID=$(echo "$DATA" | grep -o '"threadId":"[^"]*"' | cut -d'"' -f4)
      echo -e "  ${GREEN}✓ Thread created: $THREAD_ID${NC}"
    fi
    
    # Extract function call details
    if [[ $DATA == *"function_call"* ]]; then
      RUN_ID=$(echo "$DATA" | grep -o '"runId":"[^"]*"' | cut -d'"' -f4)
      # Extract first tool call
      TOOL_CALL_ID=$(echo "$DATA" | grep -o '"id":"call_[^"]*"' | head -1 | cut -d'"' -f4)
      FUNCTION_NAME=$(echo "$DATA" | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)
      echo -e "  ${GREEN}✓ Function requested: $FUNCTION_NAME${NC}"
      echo -e "  ${GREEN}✓ Run ID: $RUN_ID${NC}"
      echo -e "  ${GREEN}✓ Tool Call ID: $TOOL_CALL_ID${NC}"
    fi
  fi
done <<< "$RESPONSE"

if [[ -z "$THREAD_ID" || -z "$RUN_ID" || -z "$TOOL_CALL_ID" ]]; then
  echo -e "${RED}❌ Failed to extract required IDs from response${NC}"
  echo "Response preview:"
  echo "$RESPONSE" | head -20
  exit 1
fi

# Step 2: Submit tool outputs based on function name
echo -e "\n${YELLOW}Step 2: Submitting tool outputs for $FUNCTION_NAME...${NC}"

# Prepare tool output based on function
if [[ "$FUNCTION_NAME" == "get_pantry_items" ]]; then
  TOOL_OUTPUT='{"items":[{"id":"1","name":"Vitamin D3","notes":"1000 IU daily","tags":["vitamins"]}]}'
elif [[ "$FUNCTION_NAME" == "get_supplement_recommendations" ]]; then
  TOOL_OUTPUT='{"recommendations":[{"name":"Magnesium Glycinate","dosage":"200-400mg","timing":"30 minutes before bed","benefits":"Promotes muscle relaxation and better sleep quality","category":"minerals"},{"name":"L-Theanine","dosage":"100-200mg","timing":"1 hour before bed","benefits":"Reduces anxiety and promotes calm without drowsiness","category":"amino acids"}]}'
else
  TOOL_OUTPUT='{}'
fi

# Submit tool outputs
echo -e "  Submitting output for $FUNCTION_NAME..."

SUBMIT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/assistant/submit-tool-outputs" \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d "{
    \"threadId\": \"$THREAD_ID\",
    \"runId\": \"$RUN_ID\",
    \"toolOutputs\": [{
      \"tool_call_id\": \"$TOOL_CALL_ID\",
      \"output\": \"$(echo $TOOL_OUTPUT | sed 's/"/\\"/g')\"
    }]
  }")

# Parse the response
FINAL_CONTENT=""
HAS_MORE_FUNCTIONS=false
NEW_RUN_ID=""
NEW_TOOL_CALL_ID=""

while IFS= read -r line; do
  if [[ $line == data:* ]]; then
    DATA="${line#data: }"
    
    # Check for delta content
    if [[ $DATA == *"\"type\":\"delta\""* ]]; then
      CONTENT=$(echo "$DATA" | grep -o '"content":"[^"]*"' | cut -d'"' -f4 | sed 's/\\"/"/g')
      FINAL_CONTENT="$CONTENT"
    fi
    
    # Check for another function call
    if [[ $DATA == *"\"type\":\"function_call\""* ]]; then
      HAS_MORE_FUNCTIONS=true
      NEW_RUN_ID=$(echo "$DATA" | grep -o '"runId":"[^"]*"' | cut -d'"' -f4)
      NEW_TOOL_CALL_ID=$(echo "$DATA" | grep -o '"id":"call_[^"]*"' | head -1 | cut -d'"' -f4)
      NEW_FUNCTION_NAME=$(echo "$DATA" | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)
      echo -e "  ${YELLOW}⚡ Assistant needs another function: $NEW_FUNCTION_NAME${NC}"
    fi
    
    # Check for completion
    if [[ $DATA == *"\"type\":\"completed\""* ]]; then
      echo -e "  ${GREEN}✓ Response completed${NC}"
    fi
  fi
done <<< "$SUBMIT_RESPONSE"

# Step 3: Parse and display the final JSON response
echo -e "\n${YELLOW}Step 3: Analyzing assistant response...${NC}"

if [[ -n "$FINAL_CONTENT" ]]; then
  # Try to parse as JSON using python
  python3 -c "
import json
import sys

try:
    data = json.loads('''$FINAL_CONTENT''')
    print('  ✅ Valid JSON response received!')
    
    # Check for buy actions
    buy_actions = [item for item in data.get('actionableItems', []) if item.get('type') == 'buy']
    print(f'\\n  🛒 Buy recommendations: {len(buy_actions)}')
    
    for i, action in enumerate(buy_actions, 1):
        print(f'\\n    {i}. {action.get(\"title\", \"N/A\")}')
        print(f'       Product: {action.get(\"productName\", \"N/A\")}')
        print(f'       Search: {action.get(\"searchQuery\", \"N/A\")}')
        print(f'       Dosage: {action.get(\"dosage\", \"N/A\")}')
        print(f'       Timing: {action.get(\"timing\", \"N/A\")}')
        print(f'       Price: {action.get(\"price_range\", \"N/A\")}')
    
    # Check for add to pantry actions
    add_actions = [item for item in data.get('actionableItems', []) if item.get('type') == 'add_to_pantry']
    print(f'\\n  📦 Add to pantry suggestions: {len(add_actions)}')
    
    # Check for routine suggestions
    routine_actions = [item for item in data.get('actionableItems', []) if item.get('type') in ['routine', 'create_routine', 'thriving']]
    print(f'\\n  🌟 Routine suggestions: {len(routine_actions)}')
    
    if data.get('greeting'):
        print(f'\\n  💬 Assistant says: \"{data[\"greeting\"]}\"')
        
except json.JSONDecodeError as e:
    print(f'  ❌ Invalid JSON: {e}')
    print(f'  Response preview: {'''$FINAL_CONTENT'''[:200]}...')
    sys.exit(1)
" || {
    echo -e "${RED}  Failed to parse JSON response${NC}"
}
else
  echo -e "${RED}  ❌ No response content received${NC}"
  echo "Full response:"
  echo "$SUBMIT_RESPONSE" | head -20
fi

echo -e "\n${GREEN}✅ Integration test complete!${NC}"