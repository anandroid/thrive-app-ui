#!/bin/bash

# Run recommendation assistant tests
echo "Running Recommendation Assistant Navigation Tests..."
echo "=================================================="

# Check if OpenAI API key is set
if [ -z "$OPENAI_API_KEY" ] && [ -z "$THRIVE_OPENAI_API_KEY" ]; then
    echo "Error: OpenAI API key not found!"
    echo "Please set OPENAI_API_KEY or THRIVE_OPENAI_API_KEY environment variable"
    exit 1
fi

# Run the tests
node test-recommendation-assistant.js

# Capture exit code
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✅ All tests passed successfully!"
else
    echo ""
    echo "❌ Some tests failed. Please review the results above."
fi

exit $EXIT_CODE