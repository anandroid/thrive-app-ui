# Manual Testing Guide: "I Already Have It" Flow

## Prerequisites
1. Start the development server: `npm run dev`
2. Open browser to http://localhost:3000
3. Navigate to Chat

## Test Scenarios

### Test 1: Basic Supplement Recommendation
1. **Send message**: "I want to sleep better"
2. **Expected response**:
   - Assistant provides information about sleep supplements
   - For each supplement (e.g., Magnesium), you should see TWO buttons:
     - `➕ I already have Magnesium` (first)
     - `🛒 Where to find Magnesium` (second)

3. **Test "I already have it" flow**:
   - Click `I already have Magnesium`
   - **Expected**: Pantry modal opens with:
     - Pre-filled name: "Magnesium Glycinate"
     - Pre-filled notes: "Take 200-400mg, 30-60 minutes before bed"
     - Context message at top: "Great choice! Tracking this helps me personalize your sleep routine"
   - Click "Add to Pantry"
   - **Expected**: Modal closes, success message appears in chat

4. **Test "Where to find it" flow**:
   - Click `Where to find Magnesium`
   - **Expected**: New tab opens with Amazon search for "magnesium glycinate 400mg sleep"

### Test 2: Multiple Supplements
1. **Send message**: "What natural supplements help with chronic pain?"
2. **Expected response**:
   - Multiple supplements recommended (Turmeric, Omega-3, etc.)
   - Each supplement has both buttons in order:
     - `I already have [Supplement]`
     - `Where to find [Supplement]`

### Test 3: Context Message Variations
1. Test different health concerns and verify context messages are relevant:
   - Sleep: "...helps me personalize your sleep routine"
   - Pain: "...helps track your pain management supplements"
   - Anxiety: "...helps create your stress relief plan"

### Test 4: Pantry Integration
1. After adding a supplement via "I already have it"
2. Go to Pantry page (/pantry)
3. **Verify**: The supplement appears with correct information

### Test 5: Existing Pantry Items
1. Add some supplements to pantry first
2. Ask about those supplements again
3. **Expected**: Assistant should recognize you have them and provide usage tips instead

## Visual Checklist

### Button Appearance
- [ ] "I already have" button appears BEFORE "Where to find" button
- [ ] Icons are correct: ➕ for already have, 🛒 for buy
- [ ] Buttons use appropriate colors (green tint for already have, blue for buy)

### Modal Appearance
- [ ] Context message has sage green background
- [ ] Sparkles icon appears next to context message
- [ ] Pre-filled data is accurate
- [ ] Modal is mobile-friendly (test on mobile viewport)

### Language Check
- [ ] "Where to find" instead of "Buy" (softer language)
- [ ] Description says "View options if you need to get this"
- [ ] Context messages focus on personalization benefits

## Expected JSON Structure

When inspecting network requests, the assistant should return:

```json
{
  "actionableItems": [
    {
      "type": "already_have",
      "title": "I already have Magnesium",
      "description": "Add to your pantry for personalized tracking",
      "productName": "Magnesium Glycinate",
      "suggestedNotes": "Take 200-400mg, 30-60 minutes before bed",
      "contextMessage": "Great choice! Tracking this helps me personalize your sleep routine",
      "icon": "plus-circle"
    },
    {
      "type": "buy",
      "title": "Where to find Magnesium",
      "description": "View options if you need to get this",
      "productName": "Magnesium Glycinate 400mg",
      "searchQuery": "magnesium glycinate 400mg sleep",
      "dosage": "200-400mg",
      "timing": "30-60 minutes before bed",
      "icon": "shopping-cart"
    }
  ]
}
```

## Common Issues to Check

1. **Missing buttons**: If only one type appears, check assistant instructions
2. **Wrong order**: already_have should always come before buy
3. **No context message**: Verify contextMessage field is passed to modal
4. **Pre-fill not working**: Check initialData prop in PantryAddModal

## Success Criteria

- [ ] Both button types appear for each supplement
- [ ] Correct ordering (already have first)
- [ ] Context message displays in modal
- [ ] Pre-filled data is accurate
- [ ] Soft, non-pushy language throughout
- [ ] Items save correctly to pantry
- [ ] Success message appears after saving