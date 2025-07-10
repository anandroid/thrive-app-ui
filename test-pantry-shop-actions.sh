#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🧪 Testing Pantry & Shop Actionable Items${NC}\n"

# Base URL
BASE_URL="http://localhost:3000"

# Test 1: Ask about supplements I should take
echo -e "${YELLOW}Test 1: Asking about supplements for sleep issues${NC}"
echo "Prompt: 'I have trouble sleeping. What supplements might help?'"

RESPONSE1=$(curl -s -X POST "$BASE_URL/api/assistant/stream" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have trouble sleeping. What supplements might help?",
    "threadId": null,
    "chatIntent": null,
    "basicContext": {
      "pantryCount": 0,
      "activeRoutineCount": 0,
      "routineTypes": "none"
    }
  }')

echo -e "\n${GREEN}Expected actionable items:${NC}"
echo "- Buy Magnesium Glycinate (type: 'buy')"
echo "- Buy Melatonin (type: 'buy')"
echo "- Add to Pantry options for each supplement (type: 'add_to_pantry')"

# Test 2: I already have some supplements
echo -e "\n${YELLOW}Test 2: User mentions having supplements${NC}"
echo "Prompt: 'I have magnesium but not sure when to take it'"

RESPONSE2=$(curl -s -X POST "$BASE_URL/api/assistant/stream" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have magnesium but not sure when to take it",
    "threadId": null,
    "chatIntent": null,
    "basicContext": {
      "pantryCount": 0,
      "activeRoutineCount": 0,
      "routineTypes": "none"
    }
  }')

echo -e "\n${GREEN}Expected actionable items:${NC}"
echo "- Add Magnesium to Pantry (type: 'add_to_pantry')"
echo "- Create Sleep Routine (type: 'thriving')"

# Test 3: Asking about specific supplements for pain
echo -e "\n${YELLOW}Test 3: Asking about supplements for chronic pain${NC}"
echo "Prompt: 'What natural supplements help with chronic pain and inflammation?'"

RESPONSE3=$(curl -s -X POST "$BASE_URL/api/assistant/stream" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What natural supplements help with chronic pain and inflammation?",
    "threadId": null,
    "chatIntent": null,
    "basicContext": {
      "pantryCount": 2,
      "activeRoutineCount": 0,
      "routineTypes": "none"
    }
  }')

echo -e "\n${GREEN}Expected actionable items:${NC}"
echo "- Buy Turmeric/Curcumin (type: 'buy')"
echo "- Buy Omega-3 Fish Oil (type: 'buy')"
echo "- Buy Boswellia (type: 'buy')"
echo "- Add to Pantry options for each"

# Test 4: User wants to track medications
echo -e "\n${YELLOW}Test 4: User wants to track medications${NC}"
echo "Prompt: 'I take ibuprofen and tylenol for my back pain'"

RESPONSE4=$(curl -s -X POST "$BASE_URL/api/assistant/stream" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I take ibuprofen and tylenol for my back pain",
    "threadId": null,
    "chatIntent": null,
    "basicContext": {
      "pantryCount": 1,
      "activeRoutineCount": 0,
      "routineTypes": "none"
    }
  }')

echo -e "\n${GREEN}Expected actionable items:${NC}"
echo "- Add Ibuprofen to Pantry (type: 'add_to_pantry')"
echo "- Add Tylenol to Pantry (type: 'add_to_pantry')"
echo "- Create Pain Management Routine (type: 'thriving')"

# Function to extract and count action types
extract_actions() {
  local response="$1"
  local action_type="$2"
  
  # Count occurrences of the action type
  count=$(echo "$response" | grep -o "\"type\":\"$action_type\"" | wc -l)
  echo "$count"
}

# Analyze responses
echo -e "\n${BLUE}📊 Analysis of Responses:${NC}"

for i in 1 2 3 4; do
  eval response=\$RESPONSE$i
  echo -e "\nTest $i Results:"
  
  buy_count=$(extract_actions "$response" "buy")
  pantry_count=$(extract_actions "$response" "add_to_pantry")
  routine_count=$(extract_actions "$response" "thriving")
  
  echo "  - Buy actions: $buy_count"
  echo "  - Add to pantry actions: $pantry_count"
  echo "  - Create routine actions: $routine_count"
  
  # Show sample of actual items if found
  if [ $buy_count -gt 0 ] || [ $pantry_count -gt 0 ]; then
    echo -e "  ${GREEN}✓ Found shopping/pantry actions${NC}"
    
    # Extract first buy action
    buy_item=$(echo "$response" | grep -o '"type":"buy"[^}]*' | head -1)
    if [ ! -z "$buy_item" ]; then
      echo "  Sample buy action: $buy_item"
    fi
    
    # Extract first pantry action
    pantry_item=$(echo "$response" | grep -o '"type":"add_to_pantry"[^}]*' | head -1)
    if [ ! -z "$pantry_item" ]; then
      echo "  Sample pantry action: $pantry_item"
    fi
  fi
done

echo -e "\n${GREEN}✅ Test complete!${NC}"
echo -e "\nTo see full responses, check the individual RESPONSE variables."