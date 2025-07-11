#!/bin/bash

# Create test-screenshots directory
mkdir -p test-screenshots

# Function to take a screenshot with a descriptive name
take_screenshot() {
    local name=$1
    local filename="test-screenshots/${name}.png"
    echo "Taking screenshot: $name"
    screencapture -w "$filename"
    echo "Screenshot saved to: $filename"
    sleep 2
}

echo "=== Thrive App Assistant Function Testing ==="
echo ""
echo "This script will help capture screenshots of the app."
echo "Click on the browser window when prompted."
echo ""
echo "Press Enter to start..."
read

# Initial page
echo "1. Click on the browser window showing localhost:3001"
take_screenshot "01-initial-chat"

echo "2. Type 'I have chronic lower back pain' and press Enter"
echo "   Wait for the response and pain slider to appear"
echo "   Then click on the browser window"
take_screenshot "02-pain-response"

echo "3. Refresh the page, then type 'I want to sleep better' and press Enter"
echo "   Wait for supplement recommendations"
echo "   Then click on the browser window"  
take_screenshot "03-sleep-supplements"

echo "4. Click on any supplement recommendation button"
echo "   Then click on the browser window"
take_screenshot "04-supplement-action"

echo "5. Navigate to /pantry to see pantry items"
echo "   Then click on the browser window"
take_screenshot "05-pantry-items"

echo "6. Navigate to /thrivings to see routines"
echo "   Then click on the browser window"
take_screenshot "06-routines"

echo "7. Navigate to /journals to see pain tracking"
echo "   Then click on the browser window"
take_screenshot "07-journals"

echo ""
echo "=== Testing Complete ==="
echo "Screenshots saved in test-screenshots/"
ls -la test-screenshots/