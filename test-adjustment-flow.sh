#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🧪 Testing Routine Adjustment Flow${NC}\n"

# Base URL
BASE_URL="http://localhost:3000"

# Test 1: Ask about sleep when having an active sleep routine
echo -e "${YELLOW}Test 1: User with existing sleep routine asking for improvements${NC}"

# Simulate having an active sleep routine
RESPONSE=$(curl -s -X POST "$BASE_URL/api/assistant/stream" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I still have trouble falling asleep even with my current routine",
    "threadId": null,
    "chatIntent": null,
    "basicContext": {
      "pantryCount": 3,
      "activeRoutineCount": 1,
      "routineTypes": "sleep_wellness"
    }
  }')

# Extract adjust_routine actions
ADJUST_ACTIONS=0
HAS_ROUTINE_ID=false

while IFS= read -r line; do
  if [[ $line == data:* ]]; then
    DATA="${line#data: }"
    
    if [[ $DATA == *'"type":"adjust_routine"'* ]]; then
      ((ADJUST_ACTIONS++))
      echo -e "  ${GREEN}✓ Found adjust_routine action${NC}"
      
      # Check for routineId
      if [[ $DATA == *'"routineId"'* ]]; then
        HAS_ROUTINE_ID=true
        echo -e "  ${GREEN}✓ Has routineId field${NC}"
      fi
      
      # Extract adjustment instructions
      if [[ $DATA == *'"adjustmentInstructions"'* ]]; then
        echo -e "  ${GREEN}✓ Has adjustment instructions${NC}"
      fi
    fi
  fi
done <<< "$RESPONSE"

echo -e "\n  📊 Results:"
echo -e "  - Adjust routine actions found: $ADJUST_ACTIONS"
echo -e "  - Has routine ID: $HAS_ROUTINE_ID"

# Test 2: No existing routine
echo -e "\n${YELLOW}Test 2: User with no routines (should suggest creating, not adjusting)${NC}"

RESPONSE2=$(curl -s -X POST "$BASE_URL/api/assistant/stream" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have trouble sleeping",
    "threadId": null,
    "chatIntent": null,
    "basicContext": {
      "pantryCount": 0,
      "activeRoutineCount": 0,
      "routineTypes": "none"
    }
  }')

CREATE_ACTIONS=0
ADJUST_ACTIONS2=0

while IFS= read -r line; do
  if [[ $line == data:* ]]; then
    DATA="${line#data: }"
    
    if [[ $DATA == *'"type":"thriving"'* ]] || [[ $DATA == *'"type":"create_routine"'* ]]; then
      ((CREATE_ACTIONS++))
    fi
    
    if [[ $DATA == *'"type":"adjust_routine"'* ]]; then
      ((ADJUST_ACTIONS2++))
    fi
  fi
done <<< "$RESPONSE2"

echo -e "\n  📊 Results:"
echo -e "  - Create routine actions: $CREATE_ACTIONS"
echo -e "  - Adjust routine actions: $ADJUST_ACTIONS2 (should be 0)"

if [[ $CREATE_ACTIONS -gt 0 ]] && [[ $ADJUST_ACTIONS2 -eq 0 ]]; then
  echo -e "  ${GREEN}✓ Correctly suggests creating, not adjusting${NC}"
else
  echo -e "  ${RED}❌ Should suggest creating, not adjusting${NC}"
fi

echo -e "\n${GREEN}✅ Adjustment flow test complete!${NC}"