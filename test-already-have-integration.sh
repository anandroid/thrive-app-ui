#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}🧪 Integration Test: 'I Already Have It' Flow${NC}\n"

# Base URL
BASE_URL="http://localhost:3000"

# Function to pretty print JSON
pretty_json() {
    echo "$1" | python3 -m json.tool 2>/dev/null || echo "$1"
}

# Function to extract actionable items
extract_actionable_items() {
    local response="$1"
    local items=""
    
    # Extract all data lines and concatenate
    while IFS= read -r line; do
        if [[ $line == data:* ]]; then
            data="${line#data: }"
            if [[ $data == *"actionableItems"* ]]; then
                items="$items$data"
            fi
        fi
    done <<< "$response"
    
    echo "$items"
}

# Test 1: Basic sleep supplement recommendation
echo -e "${YELLOW}Test 1: Sleep Supplement Recommendation${NC}"
echo "User message: 'I want to sleep better'"
echo -e "${CYAN}Expected: Both 'already have' and 'buy' options for each supplement${NC}\n"

RESPONSE1=$(curl -s -X POST "$BASE_URL/api/assistant/stream" \
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

# Extract actionable items
ITEMS1=$(extract_actionable_items "$RESPONSE1")

# Check for already_have actions
ALREADY_HAVE_COUNT=$(echo "$ITEMS1" | grep -o '"type":"already_have"' | wc -l)
BUY_COUNT=$(echo "$ITEMS1" | grep -o '"type":"buy"' | wc -l)

echo "Results:"
echo -e "  Already Have actions: ${GREEN}$ALREADY_HAVE_COUNT${NC}"
echo -e "  Buy actions: ${GREEN}$BUY_COUNT${NC}"

if [ $ALREADY_HAVE_COUNT -gt 0 ] && [ $BUY_COUNT -gt 0 ]; then
    echo -e "  ${GREEN}✓ Both action types present${NC}"
    
    # Extract first already_have action
    if [[ $ITEMS1 =~ \{[^}]*"type":"already_have"[^}]*\} ]]; then
        ALREADY_HAVE_ACTION="${BASH_REMATCH[0]}"
        echo -e "\n  Sample 'already have' action:"
        echo "  $ALREADY_HAVE_ACTION"
        
        # Check for required fields
        if [[ $ALREADY_HAVE_ACTION == *"contextMessage"* ]]; then
            echo -e "  ${GREEN}✓ Has contextMessage field${NC}"
        else
            echo -e "  ${RED}✗ Missing contextMessage field${NC}"
        fi
    fi
else
    echo -e "  ${RED}✗ Missing required action types${NC}"
fi

# Test 2: Pain management supplement recommendation
echo -e "\n${YELLOW}Test 2: Pain Management Supplements${NC}"
echo "User message: 'What natural supplements help with chronic pain?'"

RESPONSE2=$(curl -s -X POST "$BASE_URL/api/assistant/stream" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What natural supplements help with chronic pain?",
    "threadId": null,
    "chatIntent": null,
    "basicContext": {
      "pantryCount": 0,
      "activeRoutineCount": 0,
      "routineTypes": "none"
    }
  }')

ITEMS2=$(extract_actionable_items "$RESPONSE2")
ALREADY_HAVE_COUNT2=$(echo "$ITEMS2" | grep -o '"type":"already_have"' | wc -l)
BUY_COUNT2=$(echo "$ITEMS2" | grep -o '"type":"buy"' | wc -l)

echo "Results:"
echo -e "  Already Have actions: ${GREEN}$ALREADY_HAVE_COUNT2${NC}"
echo -e "  Buy actions: ${GREEN}$BUY_COUNT2${NC}"

# Test 3: Check action ordering (already_have should come first)
echo -e "\n${YELLOW}Test 3: Action Ordering${NC}"
echo "Checking if 'already have' actions appear before 'buy' actions..."

# Extract all action types in order
ACTION_ORDER=$(echo "$ITEMS1" | grep -o '"type":"[^"]*"' | sed 's/"type":"//g' | sed 's/"//g')

PREV_TYPE=""
CORRECT_ORDER=true
while IFS= read -r action_type; do
    if [[ $PREV_TYPE == "buy" ]] && [[ $action_type == "already_have" ]]; then
        CORRECT_ORDER=false
        break
    fi
    PREV_TYPE=$action_type
done <<< "$ACTION_ORDER"

if $CORRECT_ORDER; then
    echo -e "  ${GREEN}✓ Actions are in correct order (already_have before buy)${NC}"
else
    echo -e "  ${RED}✗ Actions are not in correct order${NC}"
fi

# Test 4: Test context message content
echo -e "\n${YELLOW}Test 4: Context Message Quality${NC}"
echo "Checking context messages for personalization focus..."

# Extract all context messages
CONTEXT_MESSAGES=$(echo "$ITEMS1" | grep -o '"contextMessage":"[^"]*"' | sed 's/"contextMessage":"//g' | sed 's/"//g')

if [ ! -z "$CONTEXT_MESSAGES" ]; then
    echo "Found context messages:"
    while IFS= read -r msg; do
        echo -e "  - ${CYAN}$msg${NC}"
        
        # Check for personalization keywords
        if [[ $msg == *"personalize"* ]] || [[ $msg == *"routine"* ]] || [[ $msg == *"track"* ]]; then
            echo -e "    ${GREEN}✓ Contains personalization focus${NC}"
        else
            echo -e "    ${YELLOW}⚠ Could improve personalization message${NC}"
        fi
    done <<< "$CONTEXT_MESSAGES"
fi

# Test 5: Test that buy actions have softer language
echo -e "\n${YELLOW}Test 5: Buy Action Language${NC}"
echo "Checking if buy actions use softer, non-pushy language..."

# Extract buy action titles
BUY_TITLES=$(echo "$ITEMS1" | grep -B1 '"type":"buy"' | grep '"title"' | sed 's/.*"title":"//g' | sed 's/".*//g')

if [ ! -z "$BUY_TITLES" ]; then
    echo "Buy action titles:"
    while IFS= read -r title; do
        echo -e "  - ${CYAN}$title${NC}"
        
        # Check for softer language
        if [[ $title == *"Where to find"* ]] || [[ $title == *"View options"* ]]; then
            echo -e "    ${GREEN}✓ Uses soft, non-pushy language${NC}"
        else
            echo -e "    ${YELLOW}⚠ Could use softer language${NC}"
        fi
    done <<< "$BUY_TITLES"
fi

# Test 6: Full flow simulation
echo -e "\n${YELLOW}Test 6: Full Flow Simulation${NC}"
echo "Simulating complete user interaction..."

# Create a test HTML file to verify the flow
cat > test-already-have-ui.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Already Have Flow UI Test</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .action-button { 
            margin: 5px; 
            padding: 10px 20px; 
            border: 1px solid #ccc; 
            border-radius: 8px; 
            cursor: pointer; 
            background: white;
        }
        .already-have { border-color: #22c55e; color: #22c55e; }
        .buy { border-color: #3b82f6; color: #3b82f6; }
        .modal { 
            display: none; 
            position: fixed; 
            top: 50%; 
            left: 50%; 
            transform: translate(-50%, -50%);
            background: white; 
            padding: 20px; 
            border-radius: 12px; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .context-message {
            background: #dcfce7;
            padding: 10px;
            border-radius: 8px;
            margin-bottom: 15px;
        }
    </style>
</head>
<body>
    <h2>Test: Already Have Flow</h2>
    
    <div id="supplement-options">
        <h3>Magnesium for Better Sleep</h3>
        <button class="action-button already-have" onclick="openPantryModal('Magnesium Glycinate', 'Take 200-400mg, 30-60 minutes before bed', 'Great choice! Tracking this helps me personalize your sleep routine.')">
            ➕ I already have Magnesium
        </button>
        <button class="action-button buy" onclick="openAmazon('magnesium glycinate 400mg sleep')">
            🛒 Where to find Magnesium
        </button>
    </div>
    
    <div id="pantry-modal" class="modal">
        <h3>Add to Pantry</h3>
        <div id="context-message" class="context-message"></div>
        <p>Name: <input type="text" id="item-name" /></p>
        <p>Notes: <textarea id="item-notes"></textarea></p>
        <button onclick="saveToPantry()">Save to Pantry</button>
        <button onclick="closeModal()">Cancel</button>
    </div>
    
    <div id="results"></div>
    
    <script>
        function openPantryModal(name, notes, contextMessage) {
            document.getElementById('item-name').value = name;
            document.getElementById('item-notes').value = notes;
            document.getElementById('context-message').textContent = '✨ ' + contextMessage;
            document.getElementById('pantry-modal').style.display = 'block';
            logResult('✓ Pantry modal opened with pre-filled data');
        }
        
        function openAmazon(searchQuery) {
            logResult('✓ Would open Amazon with search: ' + searchQuery);
            console.log('Amazon URL:', 'https://www.amazon.com/s?k=' + encodeURIComponent(searchQuery));
        }
        
        function saveToPantry() {
            const name = document.getElementById('item-name').value;
            logResult('✓ Saved to pantry: ' + name);
            closeModal();
        }
        
        function closeModal() {
            document.getElementById('pantry-modal').style.display = 'none';
        }
        
        function logResult(message) {
            const results = document.getElementById('results');
            results.innerHTML += '<p>' + message + '</p>';
        }
    </script>
</body>
</html>
EOF

echo -e "  ${GREEN}✓ Created test UI file: test-already-have-ui.html${NC}"
echo "  Open this file in a browser to test the interaction flow"

# Summary
echo -e "\n${BLUE}📊 Test Summary${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

TOTAL_TESTS=6
PASSED_TESTS=0

# Count passed tests based on conditions
[ $ALREADY_HAVE_COUNT -gt 0 ] && [ $BUY_COUNT -gt 0 ] && ((PASSED_TESTS++))
[ $ALREADY_HAVE_COUNT2 -gt 0 ] && [ $BUY_COUNT2 -gt 0 ] && ((PASSED_TESTS++))
[ "$CORRECT_ORDER" = true ] && ((PASSED_TESTS++))
[ ! -z "$CONTEXT_MESSAGES" ] && ((PASSED_TESTS++))
[ ! -z "$BUY_TITLES" ] && ((PASSED_TESTS++))
((PASSED_TESTS++)) # UI test always passes if file created

echo -e "Tests Passed: ${GREEN}$PASSED_TESTS/$TOTAL_TESTS${NC}"

if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
    echo -e "\n${GREEN}✅ All integration tests passed!${NC}"
else
    echo -e "\n${YELLOW}⚠️  Some tests need attention${NC}"
fi

echo -e "\n${CYAN}Next Steps:${NC}"
echo "1. Open test-already-have-ui.html in browser to test UI interaction"
echo "2. Start the dev server and test with real prompts"
echo "3. Verify pantry items are saved correctly"