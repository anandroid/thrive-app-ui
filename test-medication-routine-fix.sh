#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🧪 Testing Medication Routine Creation Fix${NC}\n"

# Base URL
BASE_URL="http://localhost:3000"

# Test: Create medication routine
echo -e "${YELLOW}Test: Creating medication management routine${NC}"
echo "User message: 'Create a routine for my medications'"

RESPONSE=$(curl -s -X POST "$BASE_URL/api/assistant/stream" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Create a routine for my medications",
    "threadId": null,
    "chatIntent": "create_thriving",
    "basicContext": {
      "pantryCount": 0,
      "activeRoutineCount": 0,
      "routineTypes": "none"
    }
  }')

# Extract thriving action
THRIVING_ACTION=""
while IFS= read -r line; do
  if [[ $line == data:* ]]; then
    DATA="${line#data: }"
    if [[ $DATA == *'"type":"thriving"'* ]]; then
      # Extract the full actionableItem
      THRIVING_ACTION="$DATA"
    fi
  fi
done <<< "$RESPONSE"

echo -e "\n${BLUE}Checking for required fields:${NC}"

# Check for required fields
REQUIRED_FIELDS=("type" "title" "description" "thrivingType" "duration" "frequency" "modalTitle" "modalDescription")
ALL_PRESENT=true

for field in "${REQUIRED_FIELDS[@]}"; do
  if [[ $THRIVING_ACTION == *"\"$field\""* ]]; then
    echo -e "  ${GREEN}✓ $field present${NC}"
  else
    echo -e "  ${RED}✗ $field missing${NC}"
    ALL_PRESENT=false
  fi
done

if $ALL_PRESENT; then
  echo -e "\n${GREEN}✅ All required fields present!${NC}"
  echo -e "\nThe button should now work when clicked."
else
  echo -e "\n${RED}❌ Some required fields are missing${NC}"
  echo -e "The assistant needs to include all required fields for the thriving action."
fi

echo -e "\n${CYAN}Debug: Full thriving action:${NC}"
echo "$THRIVING_ACTION" | python3 -m json.tool 2>/dev/null || echo "$THRIVING_ACTION"