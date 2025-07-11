#!/bin/bash

echo "🧪 Testing Assistant Function Calls Directly"
echo "=========================================="

# Test 1: Simple pantry query
echo -e "\n1️⃣ Test: Pantry Query"
echo "Sending: 'What supplements do I have?'"

RESPONSE=$(curl -X POST http://localhost:3001/api/assistant/stream \
  -H "Content-Type: application/json" \
  -d '{"message": "What supplements do I have in my pantry?", "threadId": null}' \
  -N -s 2>/dev/null)

# Check for function call
if echo "$RESPONSE" | grep -q "function_call"; then
  echo "✅ Function call detected!"
  echo "$RESPONSE" | grep "function_call" | head -1
else
  echo "❌ No function call detected"
fi

# Check for specific function
if echo "$RESPONSE" | grep -q "get_pantry_items"; then
  echo "✅ get_pantry_items function called!"
else
  echo "⚠️  get_pantry_items not called"
fi

# Test 2: Sleep supplements query
echo -e "\n2️⃣ Test: Sleep Supplements Query"
echo "Sending: 'I have trouble sleeping. What supplements can help?'"

RESPONSE2=$(curl -X POST http://localhost:3001/api/assistant/stream \
  -H "Content-Type: application/json" \
  -d '{"message": "I have trouble sleeping. What supplements do I have that can help?", "threadId": null}' \
  -N -s 2>/dev/null | head -50)

if echo "$RESPONSE2" | grep -q "function_call"; then
  echo "✅ Function calls detected!"
  echo "$RESPONSE2" | grep "toolCalls" | head -1
fi

# Show sample of response
echo -e "\n📄 Sample Response:"
echo "$RESPONSE2" | grep -E "(type|content|function)" | head -10