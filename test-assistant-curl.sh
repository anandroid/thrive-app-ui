#!/bin/bash

echo "🧪 Testing Assistant with Basic Context"
echo "======================================="
echo ""
echo "Test 1: Empty Context (should NOT call functions)"
echo "-------------------------------------------------"

# Test with empty context
curl -N -X POST http://localhost:3000/api/assistant/stream \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I want to sleep better",
    "threadId": null,
    "basicContext": {
      "pantryCount": 0,
      "activeRoutineCount": 0,
      "routineTypes": "none",
      "pantryItems": [],
      "activeRoutines": []
    }
  }' 2>/dev/null | while read -r line; do
    if [[ $line == data:* ]]; then
      echo "$line"
      # Check for function calls
      if [[ $line == *"function_call"* ]]; then
        echo "⚠️  FUNCTION CALL DETECTED!"
      fi
    fi
  done

echo ""
echo ""
echo "Test 2: With Pantry Data (may call functions for details)"
echo "---------------------------------------------------------"

# Test with data in context
curl -N -X POST http://localhost:3000/api/assistant/stream \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Should I take magnesium with my current supplements?",
    "threadId": null,
    "basicContext": {
      "pantryCount": 3,
      "activeRoutineCount": 1,
      "routineTypes": "sleep_wellness",
      "pantryItems": [
        "Vitamin D 2000IU - for immunity",
        "Melatonin 5mg - for sleep",
        "Omega-3 1000mg - for heart health"
      ],
      "activeRoutines": [{
        "name": "Evening Wind Down",
        "type": "sleep_wellness",
        "reminderTimes": ["9:00 PM"],
        "steps": [
          "Take melatonin (9:00 PM)",
          "10-minute meditation (9:15 PM)",
          "Read a book (9:30 PM)"
        ]
      }]
    }
  }' 2>/dev/null | while read -r line; do
    if [[ $line == data:* ]]; then
      echo "$line"
      if [[ $line == *"function_call"* ]]; then
        echo "🔍 FUNCTION CALL MADE"
      fi
    fi
  done