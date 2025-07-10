#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🧪 Testing Medication Management Routine Recommendation${NC}\n"

# Base URL
BASE_URL="http://localhost:3000"

# Send message about medication management
echo -e "${YELLOW}Sending message about medication management...${NC}"

RESPONSE=$(curl -s -X POST "$BASE_URL/api/assistant/stream" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Help me manage my medications. I need to take blood pressure medicine twice a day and vitamins in the morning.",
    "threadId": null,
    "chatIntent": null
  }')

# Parse the response
THREAD_ID=""
RUN_ID=""
FINAL_RESPONSE=""
FUNCTION_CALLS=0

while IFS= read -r line; do
  if [[ $line == data:* ]]; then
    DATA="${line#data: }"
    
    # Extract thread ID
    if [[ $DATA == *"thread_created"* ]]; then
      THREAD_ID=$(echo "$DATA" | grep -o '"threadId":"[^"]*"' | cut -d'"' -f4)
      echo -e "  ${GREEN}✓ Thread created: $THREAD_ID${NC}"
    fi
    
    # Handle function calls
    if [[ $DATA == *"function_call"* ]]; then
      RUN_ID=$(echo "$DATA" | grep -o '"runId":"[^"]*"' | cut -d'"' -f4)
      
      # Extract all tool calls from the JSON
      TOOL_CALLS_JSON=$(echo "$DATA" | grep -o '"toolCalls":\[[^]]*\]' | sed 's/"toolCalls"://')
      
      # Parse tool calls and build outputs
      TOOL_OUTPUTS="["
      FIRST=true
      
      while read -r tool_call; do
        CALL_ID=$(echo "$tool_call" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
        FUNC_NAME=$(echo "$tool_call" | grep -o '"name":"[^"]*"' | cut -d'"' -f4)
        
        if [[ -n "$CALL_ID" ]] && [[ -n "$FUNC_NAME" ]]; then
          ((FUNCTION_CALLS++))
          echo -e "  ${GREEN}✓ Function #$FUNCTION_CALLS requested: $FUNC_NAME${NC}"
          
          # Prepare response based on function
          case "$FUNC_NAME" in
            "get_thriving_progress")
              OUTPUT='{"routines":[],"journals":[],"activeCount":0}'
              ;;
            "get_pantry_items")
              OUTPUT='{"items":[]}'
              ;;
            *)
              OUTPUT='{}'
              ;;
          esac
          
          if [[ "$FIRST" != true ]]; then
            TOOL_OUTPUTS+=","
          fi
          FIRST=false
          
          TOOL_OUTPUTS+="{\"tool_call_id\":\"$CALL_ID\",\"output\":\"$(echo $OUTPUT | sed 's/"/\\"/g')\"}"
        fi
      done < <(echo "$TOOL_CALLS_JSON" | grep -o '{[^}]*}')
      
      TOOL_OUTPUTS+="]"
      
      # Submit all tool outputs at once
      echo -e "  → Submitting outputs for all functions..."
      
      SUBMIT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/assistant/submit-tool-outputs" \
        -H "Content-Type: application/json" \
        -d "{
          \"threadId\": \"$THREAD_ID\",
          \"runId\": \"$RUN_ID\",
          \"toolOutputs\": $TOOL_OUTPUTS
        }")
      
      # Capture the response after tool submission
      while IFS= read -r submit_line; do
        if [[ $submit_line == data:* ]]; then
          SUBMIT_DATA="${submit_line#data: }"
          
          # Check for more function calls
          if [[ $SUBMIT_DATA == *"function_call"* ]]; then
            # Update for next iteration
            RUN_ID=$(echo "$SUBMIT_DATA" | grep -o '"runId":"[^"]*"' | cut -d'"' -f4)
            TOOL_CALL_ID=$(echo "$SUBMIT_DATA" | grep -o '"id":"call_[^"]*"' | head -1 | cut -d'"' -f4)
            FUNCTION_NAME=$(echo "$SUBMIT_DATA" | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)
            ((FUNCTION_CALLS++))
            echo -e "  ${GREEN}✓ Function #$FUNCTION_CALLS requested: $FUNCTION_NAME${NC}"
          fi
          
          # Capture delta content
          if [[ $SUBMIT_DATA == *"\"type\":\"delta\""* ]]; then
            CONTENT=$(echo "$SUBMIT_DATA" | sed -n 's/.*"content":"\(.*\)".*/\1/p' | sed 's/\\"/"/g')
            if [[ -n "$CONTENT" ]]; then
              FINAL_RESPONSE="$CONTENT"
            fi
          fi
        fi
      done <<< "$SUBMIT_RESPONSE"
    fi
  fi
done <<< "$RESPONSE"

# Parse and analyze the final response
echo -e "\n${YELLOW}Analyzing assistant response...${NC}"

if [[ -n "$FINAL_RESPONSE" ]]; then
  # Clean up escaped JSON
  CLEANED_RESPONSE=$(echo "$FINAL_RESPONSE" | sed 's/\\\\"/\\"/g' | sed 's/\\\\n/\\n/g')
  
  python3 -c "
import json
import sys

try:
    data = json.loads('''$CLEANED_RESPONSE''')
    print('  ✅ Valid JSON response received!')
    
    # Display greeting
    if data.get('greeting'):
        print(f'\\n  💬 Assistant says: \"{data[\"greeting\"]}\"')
    
    # Check for routine/thriving recommendations
    routine_actions = [
        item for item in data.get('actionableItems', []) 
        if item.get('type') in ['routine', 'create_routine', 'thriving']
    ]
    
    print(f'\\n  🌟 Routine/Thriving recommendations: {len(routine_actions)}')
    
    if routine_actions:
        print('\\n  📋 Recommended routines:')
        for i, action in enumerate(routine_actions, 1):
            print(f'\\n    {i}. {action.get(\"title\", \"N/A\")}')
            print(f'       Type: {action.get(\"type\")}')
            if action.get('thrivingType'):
                print(f'       Thriving Type: {action.get(\"thrivingType\")}')
            if action.get('duration'):
                print(f'       Duration: {action.get(\"duration\")}')
            if action.get('frequency'):
                print(f'       Frequency: {action.get(\"frequency\")}')
            if action.get('modalTitle'):
                print(f'       Modal Title: {action.get(\"modalTitle\")}')
            if action.get('description'):
                print(f'       Description: {action.get(\"description\")}')
    else:
        print('\\n  ⚠️  No routine recommendations found!')
        print('\\n  All actionable items:')
        for item in data.get('actionableItems', []):
            print(f'    - Type: {item.get(\"type\")}, Title: {item.get(\"title\")}')
    
    # Show action items
    if data.get('actionItems'):
        print(f'\\n  💊 Medication advice ({len(data[\"actionItems\"])} items):')
        for item in data['actionItems'][:3]:
            print(f'     - {item.get(\"title\", \"N/A\")}')
    
    # Show questions
    if data.get('questions'):
        print(f'\\n  ❓ Follow-up questions:')
        for q in data['questions'][:3]:
            print(f'     - {q}')
        
except Exception as e:
    print(f'  ❌ Error parsing JSON: {e}')
    print(f'\\n  Raw response preview:')
    preview = '''$FINAL_RESPONSE'''[:500]
    print(f'  {preview}...')
"
else
  echo -e "${RED}  ❌ No response content received${NC}"
fi

echo -e "\n${GREEN}✅ Medication routine test complete!${NC}"