#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🧪 Testing Supplement Options - Already Have + Buy${NC}\n"

# Base URL
BASE_URL="http://localhost:3001"

# Test: Ask about sleeping better
echo -e "${YELLOW}Test: User asks about sleeping better${NC}"
echo "User message: 'I want to sleep better'"

RESPONSE=$(curl -s -X POST "$BASE_URL/api/assistant/stream" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I want to sleep better",
    "threadId": null,
    "chatIntent": null,
    "basicContext": {
      "pantryCount": 0,
      "activeRoutineCount": 0,
      "routineTypes": "none"
    }
  }')

# Extract actionableItems
echo -e "\n${BLUE}Checking actionableItems for supplement recommendations:${NC}"

SUPPLEMENT_COUNT=0
ALREADY_HAVE_COUNT=0
BUY_COUNT=0

while IFS= read -r line; do
  if [[ $line == data:* ]]; then
    DATA="${line#data: }"
    
    # Look for buy actions
    if [[ $DATA == *'"type":"buy"'* ]]; then
      ((BUY_COUNT++))
      echo -e "${GREEN}✓ Found 'buy' action${NC}"
      # Extract title
      if [[ $DATA =~ \"title\":\"([^\"]+)\" ]]; then
        echo "  Title: ${BASH_REMATCH[1]}"
      fi
    fi
    
    # Look for already_have actions
    if [[ $DATA == *'"type":"already_have"'* ]]; then
      ((ALREADY_HAVE_COUNT++))
      echo -e "${GREEN}✓ Found 'already_have' action${NC}"
      # Extract title
      if [[ $DATA =~ \"title\":\"([^\"]+)\" ]]; then
        echo "  Title: ${BASH_REMATCH[1]}"
      fi
    fi
  fi
done <<< "$RESPONSE"

echo -e "\n${BLUE}Summary:${NC}"
echo -e "Buy options found: $BUY_COUNT"
echo -e "Already have options found: $ALREADY_HAVE_COUNT"

if [[ $BUY_COUNT -gt 0 && $ALREADY_HAVE_COUNT -eq $BUY_COUNT ]]; then
  echo -e "\n${GREEN}✅ Success! Each supplement has both 'already have' and 'buy' options${NC}"
else
  echo -e "\n${RED}❌ Issue detected: Buy count ($BUY_COUNT) doesn't match Already Have count ($ALREADY_HAVE_COUNT)${NC}"
  echo -e "The client-side fix should automatically generate missing 'already have' options."
fi

echo -e "\n${YELLOW}Full response for debugging:${NC}"
echo "$RESPONSE" | grep -E "(type|title|productName)" | head -20