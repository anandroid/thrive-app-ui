# Testing Guide for Assistant Coordination

## Overview
This guide covers testing the assistant function calls and coordination enhancements. We have both automated (Puppeteer) and manual testing options.

## Setup Requirements

### For All Tests
- Dev server running: `npm run dev` (usually on port 3000 or 3001)
- Test data cleared for fresh start

### For Puppeteer Tests
- Puppeteer installed (already in devDependencies)
- No additional setup needed

## Automated Tests (Puppeteer)

### Running Puppeteer Tests
```bash
# Option 1: If dev server is already running
npm run test:assistant

# Option 2: Use the all-in-one script
./run-tests.sh
```

### What Puppeteer Tests
1. **Function Calls UI** - Tests all function buttons on /test-functions
2. **Supplement-First Protocol** - Verifies supplements appear before routines
3. **Pain Intensity Slider** - Checks for slider in pain journey creation
4. **Context Sharing** - Tests context passed to routine creation

### Screenshots
- Saved to `/tests/screenshots/`
- Named with date and test step
- Excluded from git via .gitignore

## Manual Browser Tests

### Quick Start
1. Open browser console at http://localhost:3000
2. Copy and paste `/tests/manual-browser-tests.js` content
3. Run: `assistantTests.showAll()`

### Individual Test Commands
```javascript
// Show all test instructions
assistantTests.showAll()

// Individual test instructions
assistantTests.test1() // Function calls
assistantTests.test2() // Supplement-first
assistantTests.test3() // Pain slider
assistantTests.test4() // Context sharing
assistantTests.test5() // No generic routines

// Helper functions
checkSupplementOrder(container) // After getting sleep response
checkPainSlider() // When journey modal is open
assistantTests.checkActionables() // List all buttons/actions
```

## Test Scenarios

### 1. Function Calls Test
**Page**: `/test-functions`
**Steps**:
1. Click "Setup Test Data"
2. Test each function button
3. Verify JSON responses appear

**Expected**: All functions return data without errors

### 2. Supplement-First Protocol
**Page**: `/` (chat)
**Test Message**: "I have trouble sleeping at night"
**Expected Order**:
1. Supplement recommendations (Magnesium, Melatonin)
2. Routine creation suggestion

**Validation**: Supplements must appear BEFORE routine in actionableItems

### 3. Pain Intensity Slider
**Page**: `/` (chat)
**Test Message**: "I want to track my chronic back pain"
**Steps**:
1. Click journey creation button
2. Check modal for slider

**Expected**: 
- Slider with 0-10 range
- Gradient from green to red
- "Current Pain Intensity" label

### 4. Context Sharing
**Page**: `/` (chat)
**Test Messages**:
1. "I take magnesium glycinate 400mg and have shoulder pain from desk work"
2. "Create a routine for my shoulder pain"

**Expected**: Routine creation should include:
- Magnesium supplement details
- Shoulder-specific exercises
- Desk work considerations

### 5. No Generic Routines
**Page**: `/` (chat)
**Test Message**: "I have fibromyalgia and need a gentle morning routine"
**Expected**:
- Fibromyalgia-specific language
- No generic placeholders
- Condition-appropriate suggestions

## Verification Tips

### Check Network Tab
1. Open DevTools > Network
2. Filter by "Fetch/XHR"
3. Look for:
   - `/api/assistant/stream` - Initial messages
   - `/api/assistant/submit-tool-outputs` - Function results
   - `/api/routine/create` - Context in request body

### Check Console Logs
- Function execution logs
- Context extraction logs
- Error messages

### Visual Checks
1. **Order**: Supplements before routines
2. **Specificity**: No generic content
3. **UI Elements**: Pain slider present
4. **Context**: Routine references chat details

## Troubleshooting

### Server Not Running
```bash
# Check if running
curl http://localhost:3000

# Start server
npm run dev
```

### Port Issues
- Default: 3000
- Alternative: 3001
- Update test files if using different port

### Puppeteer Errors
- "Connection refused": Server not running
- "Timeout": Increase wait times in test
- "Element not found": Check selectors

### Function Call Failures
1. Check localStorage has test data
2. Verify function names match
3. Check console for error details

## Success Criteria

✅ **All tests pass when**:
1. Functions return expected data
2. Supplements appear before routines
3. Pain slider shows for pain journeys
4. Context includes chat details
5. No generic routine content

## Reporting Issues

When reporting test failures, include:
1. Test name and step
2. Expected vs actual behavior
3. Screenshots (if using Puppeteer)
4. Console errors
5. Network request/response details