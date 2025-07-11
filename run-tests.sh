#!/bin/bash

# Start dev server in background
echo "Starting dev server..."
npm run dev &
DEV_PID=$!

# Wait for server to be ready
echo "Waiting for server to start..."
sleep 10

# Check if server is running
curl -s http://localhost:3001 > /dev/null
if [ $? -ne 0 ]; then
  echo "Server failed to start on port 3001, trying 3000..."
  # Update the test script to use port 3000
  sed -i '' 's/localhost:3001/localhost:3000/g' tests/puppeteer-assistant-tests.js
  
  # Check port 3000
  curl -s http://localhost:3000 > /dev/null
  if [ $? -ne 0 ]; then
    echo "Server not running on either port. Exiting."
    kill $DEV_PID 2>/dev/null
    exit 1
  fi
fi

# Run tests
echo "Running Puppeteer tests..."
npm run test:assistant

# Kill the dev server
echo "Stopping dev server..."
kill $DEV_PID 2>/dev/null

echo "Tests complete!"