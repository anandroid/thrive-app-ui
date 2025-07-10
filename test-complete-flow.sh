#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🧪 Testing Complete Assistant Flow with Multiple Function Calls${NC}\n"

# Base URL
BASE_URL="http://localhost:3000"

# Step 1: Send initial message
echo -e "${YELLOW}Step 1: Sending initial message about sleep issues...${NC}"

# Start the initial conversation
THREAD_ID=""
FINAL_RESPONSE=""

# Function to handle streaming response
handle_stream() {
  local RESPONSE="$1"
  local STEP="$2"
  
  local RUN_ID=""
  local TOOL_CALLS=()
  local FUNCTION_NAMES=()
  local NEEDS_MORE_FUNCTIONS=false
  
  while IFS= read -r line; do
    if [[ $line == data:* ]]; then
      DATA="${line#data: }"
      
      # Extract thread ID
      if [[ $DATA == *"thread_created"* ]] && [[ -z "$THREAD_ID" ]]; then
        THREAD_ID=$(echo "$DATA" | grep -o '"threadId":"[^"]*"' | cut -d'"' -f4)
        echo -e "  ${GREEN}✓ Thread created: $THREAD_ID${NC}"
      fi
      
      # Extract function call details
      if [[ $DATA == *"function_call"* ]]; then
        RUN_ID=$(echo "$DATA" | grep -o '"runId":"[^"]*"' | cut -d'"' -f4)
        
        # Extract all tool calls
        local TOOL_CALL_JSON=$(echo "$DATA" | grep -o '"toolCalls":\[[^]]*\]' | sed 's/"toolCalls"://')
        
        # Parse each tool call
        while read -r tool_call; do
          local CALL_ID=$(echo "$tool_call" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
          local FUNC_NAME=$(echo "$tool_call" | grep -o '"name":"[^"]*"' | cut -d'"' -f4)
          
          if [[ -n "$CALL_ID" ]] && [[ -n "$FUNC_NAME" ]]; then
            TOOL_CALLS+=("$CALL_ID")
            FUNCTION_NAMES+=("$FUNC_NAME")
            echo -e "  ${GREEN}✓ Function requested: $FUNC_NAME (ID: $CALL_ID)${NC}"
          fi
        done < <(echo "$TOOL_CALL_JSON" | grep -o '{[^}]*}')
        
        NEEDS_MORE_FUNCTIONS=true
      fi
      
      # Capture final content
      if [[ $DATA == *"\"type\":\"delta\""* ]]; then
        local CONTENT=$(echo "$DATA" | sed -n 's/.*"content":"\(.*\)".*/\1/p' | sed 's/\\"/"/g')
        if [[ -n "$CONTENT" ]]; then
          FINAL_RESPONSE="$CONTENT"
        fi
      fi
    fi
  done <<< "$RESPONSE"
  
  # Handle function calls if needed
  if [[ "$NEEDS_MORE_FUNCTIONS" == true ]] && [[ ${#TOOL_CALLS[@]} -gt 0 ]]; then
    echo -e "\n${YELLOW}Step $((STEP+1)): Submitting outputs for ${#TOOL_CALLS[@]} function(s)...${NC}"
    
    # Build tool outputs JSON
    local TOOL_OUTPUTS="["
    for i in "${!TOOL_CALLS[@]}"; do
      local CALL_ID="${TOOL_CALLS[$i]}"
      local FUNC_NAME="${FUNCTION_NAMES[$i]}"
      
      # Generate appropriate output based on function
      local OUTPUT=""
      case "$FUNC_NAME" in
        "get_pantry_items")
          OUTPUT='{"items":[{"id":"1","name":"Vitamin D3","notes":"1000 IU daily","tags":["vitamins"]}]}'
          ;;
        "get_supplement_recommendations")
          OUTPUT='{"recommendations":[{"name":"Magnesium Glycinate","dosage":"200-400mg","timing":"30 minutes before bed","benefits":"Promotes muscle relaxation and better sleep quality","category":"minerals"},{"name":"L-Theanine","dosage":"100-200mg","timing":"1 hour before bed","benefits":"Reduces anxiety and promotes calm without drowsiness","category":"amino acids"},{"name":"Melatonin","dosage":"0.5-3mg","timing":"30 minutes before bed","benefits":"Regulates sleep-wake cycle","category":"hormones"}]}'
          ;;
        "get_thriving_progress")
          OUTPUT='{"routines":[],"activeCount":0}'
          ;;
        *)
          OUTPUT='{}'
          ;;
      esac
      
      if [[ $i -gt 0 ]]; then
        TOOL_OUTPUTS+=","
      fi
      
      TOOL_OUTPUTS+="{\"tool_call_id\":\"$CALL_ID\",\"output\":\"$(echo $OUTPUT | sed 's/"/\\"/g')\"}"
      echo -e "  → Submitting output for $FUNC_NAME"
    done
    TOOL_OUTPUTS+="]"
    
    # Submit the outputs
    local SUBMIT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/assistant/submit-tool-outputs" \
      -H "Content-Type: application/json" \
      -d "{
        \"threadId\": \"$THREAD_ID\",
        \"runId\": \"$RUN_ID\",
        \"toolOutputs\": $TOOL_OUTPUTS
      }")
    
    # Recursively handle the response
    handle_stream "$SUBMIT_RESPONSE" $((STEP+1))
  fi
}

# Send initial message and handle response
INITIAL_RESPONSE=$(curl -s -X POST "$BASE_URL/api/assistant/stream" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have trouble sleeping. What supplements do I have that can help? If not, what should I buy?",
    "threadId": null,
    "chatIntent": null
  }')

handle_stream "$INITIAL_RESPONSE" 1

# Parse and display the final JSON response
echo -e "\n${YELLOW}Final Step: Analyzing assistant response...${NC}"

if [[ -n "$FINAL_RESPONSE" ]]; then
  # Clean up escaped JSON
  CLEANED_RESPONSE=$(echo "$FINAL_RESPONSE" | sed 's/\\\\"/\\"/g' | sed 's/\\\\n/\\n/g')
  
  python3 -c "
import json
import sys

try:
    # Try to parse the cleaned response
    data = json.loads('''$CLEANED_RESPONSE''')
    print('  ✅ Valid JSON response received!')
    
    # Display greeting
    if data.get('greeting'):
        print(f'\\n  💬 Assistant says: \"{data[\"greeting\"]}\"')
    
    # Check for buy actions
    buy_actions = [item for item in data.get('actionableItems', []) if item.get('type') == 'buy']
    print(f'\\n  🛒 Buy recommendations: {len(buy_actions)}')
    
    for i, action in enumerate(buy_actions, 1):
        print(f'\\n    {i}. {action.get(\"title\", \"N/A\")}')
        print(f'       Product: {action.get(\"productName\", \"N/A\")}')
        if action.get('searchQuery'):
            print(f'       Search: {action.get(\"searchQuery\")}')
        if action.get('dosage'):
            print(f'       Dosage: {action.get(\"dosage\")}')
        if action.get('timing'):
            print(f'       Timing: {action.get(\"timing\")}')
        if action.get('price_range'):
            print(f'       Price: {action.get(\"price_range\")}')
        if action.get('reason'):
            print(f'       Why: {action.get(\"reason\")}')
    
    # Check for add to pantry actions
    add_actions = [item for item in data.get('actionableItems', []) if item.get('type') == 'add_to_pantry']
    if add_actions:
        print(f'\\n  📦 Add to pantry suggestions: {len(add_actions)}')
    
    # Check for routine suggestions
    routine_actions = [item for item in data.get('actionableItems', []) if item.get('type') in ['routine', 'create_routine', 'thriving']]
    if routine_actions:
        print(f'\\n  🌟 Routine suggestions: {len(routine_actions)}')
        for action in routine_actions:
            print(f'     - {action.get(\"title\", \"N/A\")}')
    
    # Display action items
    if data.get('actionItems'):
        print(f'\\n  💊 Supplement advice ({len(data[\"actionItems\"])} items):')
        for item in data['actionItems'][:3]:  # Show first 3
            print(f'     - {item.get(\"title\", \"N/A\")}')
        
except Exception as e:
    print(f'  ❌ Error parsing JSON: {e}')
    # Try to show raw response
    print(f'\\n  Raw response preview:')
    preview = '''$FINAL_RESPONSE'''[:500] if len('''$FINAL_RESPONSE''') > 500 else '''$FINAL_RESPONSE'''
    print(f'  {preview}...')
"
else
  echo -e "${RED}  ❌ No response content received${NC}"
fi

echo -e "\n${GREEN}✅ Complete flow test finished!${NC}"