#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🧪 Testing Hybrid Approach with Basic Context${NC}\n"

# Base URL
BASE_URL="http://localhost:3002"

# Test 1: Empty pantry - should skip get_pantry_items
echo -e "${YELLOW}Test 1: Empty pantry scenario (should skip get_pantry_items)${NC}"

RESPONSE=$(curl -s -X POST "$BASE_URL/api/assistant/stream" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What supplements do I have for sleep?",
    "threadId": null,
    "chatIntent": null,
    "basicContext": {
      "pantryCount": 0,
      "activeRoutineCount": 0,
      "routineTypes": "none"
    }
  }')

# Count function calls
FUNCTION_CALLS=0
HAS_BUY_ACTIONS=false

while IFS= read -r line; do
  if [[ $line == data:* ]]; then
    DATA="${line#data: }"
    
    if [[ $DATA == *"function_call"* ]]; then
      ((FUNCTION_CALLS++))
      echo -e "  ${YELLOW}⚡ Function call #$FUNCTION_CALLS detected${NC}"
      
      # Extract function names
      if [[ $DATA == *"get_pantry_items"* ]]; then
        echo -e "  ${RED}❌ Called get_pantry_items (should have been skipped!)${NC}"
      fi
    fi
    
    if [[ $DATA == *'"type":"buy"'* ]]; then
      HAS_BUY_ACTIONS=true
    fi
  fi
done <<< "$RESPONSE"

echo -e "  📊 Total function calls: $FUNCTION_CALLS"
if [[ $HAS_BUY_ACTIONS == true ]]; then
  echo -e "  ${GREEN}✓ Buy actions recommended${NC}"
else
  echo -e "  ${RED}❌ No buy actions found${NC}"
fi

echo -e "\n${YELLOW}Test 2: No routines scenario (should skip get_thriving_progress)${NC}"

RESPONSE2=$(curl -s -X POST "$BASE_URL/api/assistant/stream" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Help me manage my medications",
    "threadId": null,
    "chatIntent": null,
    "basicContext": {
      "pantryCount": 5,
      "activeRoutineCount": 0,
      "routineTypes": "none"
    }
  }')

FUNCTION_CALLS2=0
HAS_ROUTINE_RECOMMENDATION=false

while IFS= read -r line; do
  if [[ $line == data:* ]]; then
    DATA="${line#data: }"
    
    if [[ $DATA == *"function_call"* ]]; then
      ((FUNCTION_CALLS2++))
      echo -e "  ${YELLOW}⚡ Function call #$FUNCTION_CALLS2 detected${NC}"
      
      if [[ $DATA == *"get_thriving_progress"* ]]; then
        echo -e "  ${RED}❌ Called get_thriving_progress (should have been skipped!)${NC}"
      fi
    fi
    
    if [[ $DATA == *'"type":"thriving"'* ]] || [[ $DATA == *'"type":"create_routine"'* ]]; then
      HAS_ROUTINE_RECOMMENDATION=true
    fi
  fi
done <<< "$RESPONSE2"

echo -e "  📊 Total function calls: $FUNCTION_CALLS2"
if [[ $HAS_ROUTINE_RECOMMENDATION == true ]]; then
  echo -e "  ${GREEN}✓ Routine creation recommended${NC}"
else
  echo -e "  ${RED}❌ No routine recommendation found${NC}"
fi

echo -e "\n${YELLOW}Test 3: With items and routines (may call functions for details)${NC}"

RESPONSE3=$(curl -s -X POST "$BASE_URL/api/assistant/stream" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What supplements am I taking for sleep?",
    "threadId": null,
    "chatIntent": null,
    "basicContext": {
      "pantryCount": 3,
      "activeRoutineCount": 2,
      "routineTypes": "sleep_wellness, stress_management"
    }
  }')

FUNCTION_CALLS3=0

while IFS= read -r line; do
  if [[ $line == data:* ]]; then
    DATA="${line#data: }"
    
    if [[ $DATA == *"function_call"* ]]; then
      ((FUNCTION_CALLS3++))
      echo -e "  ${YELLOW}⚡ Function call #$FUNCTION_CALLS3 detected${NC}"
    fi
  fi
done <<< "$RESPONSE3"

echo -e "  📊 Total function calls: $FUNCTION_CALLS3"
echo -e "  ℹ️  Functions may be called to get specific details"

echo -e "\n${GREEN}✅ Hybrid approach test complete!${NC}"
echo -e "\nSummary:"
echo -e "- Test 1: ${FUNCTION_CALLS} function calls (should be minimal)"
echo -e "- Test 2: ${FUNCTION_CALLS2} function calls (should be minimal)"
echo -e "- Test 3: ${FUNCTION_CALLS3} function calls (may need details)"