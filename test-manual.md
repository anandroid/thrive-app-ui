# Manual Testing Guide for Assistant Functions

## Test Environment
- URL: http://localhost:3001
- Date: 2025-07-11

## Test Scenarios

### 1. Pain Journey Creation Test
**Input:** "I have chronic lower back pain"

**Expected Results:**
- Assistant should respond with empathy
- Pain intensity slider should appear (0-10 scale)
- Journey creation button should be shown
- Context should be properly captured

### 2. Sleep Improvement Test  
**Input:** "I want to sleep better"

**Expected Results:**
- Assistant should recommend supplements BEFORE routines
- Both "I already have it" and "Where to find it" buttons should appear
- Clicking "I already have it" should open pantry modal with pre-filled data
- After supplements, routine suggestions should follow

### 3. Context Sharing Test
**Steps:**
1. Add items to pantry
2. Create a routine
3. Ask assistant about wellness status

**Expected Results:**
- Assistant should know about pantry items
- Assistant should know about active routines
- Context should be properly passed between assistants

### 4. Function Coordination Test
**Check these function calls:**
- `get_pantry_items` - Should return items from IndexedDB
- `get_thriving_progress` - Should return active routines
- `search_health_history` - Should search journal entries
- `get_supplement_recommendations` - Should suggest relevant supplements

## Manual Test Results

### Test 1: Pain Journey Creation
- [ ] Pain slider appears
- [ ] Intensity value is captured
- [ ] Journey is created successfully
- [ ] Journal entry shows in /journals

### Test 2: Sleep Supplements
- [ ] Supplements recommended first
- [ ] Both button options present
- [ ] "I already have it" opens pantry modal
- [ ] Context message shows in modal
- [ ] Routine suggestions follow supplements

### Test 3: Context Awareness
- [ ] Assistant knows pantry count
- [ ] Assistant knows routine types
- [ ] Context properly shared between assistants

### Test 4: Function Execution
- [ ] Functions execute client-side
- [ ] Results properly formatted
- [ ] Tool outputs submitted correctly
- [ ] Stream continues after function calls