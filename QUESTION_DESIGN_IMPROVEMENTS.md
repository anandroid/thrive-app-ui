# Question Design Improvements

## Current Issues
1. **Cramped Layout** - Questions feel too close together
2. **No Visual Hierarchy** - Hard to focus on what to answer
3. **All Questions Visible** - Overwhelming to see everything at once
4. **Basic Button Styling** - Buttons look flat and similar
5. **No Progress Indication** - User doesn't know how many questions remain

## Proposed Improvements

### 1. **Progressive Disclosure**
Show one question at a time with smooth transitions:
- Reduces cognitive load
- Creates focused attention
- Feels more conversational
- Natural flow like a real conversation

### 2. **Enhanced Visual Design**

#### Button Improvements:
```css
/* Time selection buttons */
.time-button {
  padding: 16px;
  border: 2px solid #e5e5e5;
  hover: border-sage, background-sage-light/10;
  transition: all 200ms;
  /* Add arrow icon that moves on hover */
}

/* Yes button - Positive action */
.yes-button {
  background: gradient(sage-light to sage);
  color: white;
  hover: scale(1.05), shadow-lg;
}

/* No button - Neutral */
.no-button {
  background: gradient(gray-200 to gray-300);
  color: gray-700;
}

/* Not sure - Soft */
.not-sure-button {
  background: dusty-rose/20;
  width: full; /* Spans both columns */
}
```

### 3. **Progress Indicator**
```
[●●●○○] 3 of 5 questions
```
- Visual progress dots
- Current question highlighted
- Shows completion status

### 4. **Improved Spacing**
- 24px between questions
- 20px padding inside cards
- Clear visual separation
- Breathing room for touch targets

### 5. **Custom Time Input**
Better UX for "Custom time":
- Inline time picker appears
- Cancel/Submit buttons
- No page navigation
- Smooth transition

### 6. **Animation & Transitions**
```css
/* Smooth question transitions */
.question-enter {
  animation: slide-in-from-right 300ms ease-out;
}

.answer-complete {
  animation: fade-out-scale 200ms ease-in;
}
```

### 7. **Answered Questions Summary**
Show completed questions collapsed at bottom:
```
✓ What time do you go to bed? 10:00 PM
✓ Tried sleep supplements? No
```

### 8. **Skip Option**
"Skip remaining questions" link for users who want to continue

## Implementation Benefits

1. **Less Overwhelming** - One question at a time
2. **Clear Actions** - Distinct button styles
3. **Better Mobile UX** - Larger touch targets, better spacing
4. **Progress Awareness** - Users know where they are
5. **Smooth Flow** - Animations make it feel polished
6. **Flexibility** - Can skip if needed

## Mobile-First Considerations

- Minimum 44px touch targets
- Full-width buttons on mobile
- Generous padding (16px minimum)
- Clear visual feedback on tap
- Smooth scrolling between questions
- Keyboard-friendly time input

## Alternative Designs to Consider

### Option 1: Chat Bubble Style
Make questions look like chat messages:
```
🤖 What time do you usually go to bed?
   [9:00 PM] [10:00 PM] [11:00 PM]
```

### Option 2: Wizard Style
Full-screen questions with next/back:
```
Step 2 of 5
[=====================     ]

What time do you usually go to bed?

( ) 9:00 PM
( ) 10:00 PM  
( ) 11:00 PM
( ) After midnight
( ) Custom time

[Back] [Next]
```

### Option 3: Inline Expansion
Questions expand in place when focused:
```
▶ What time do you usually go to bed?
  [Click to answer]

▼ What time do you usually go to bed?
  ○ 9:00 PM
  ○ 10:00 PM
  ● 11:00 PM
  ○ After midnight
  
✓ Have you tried sleep supplements?
  Answer: No
```

## Recommended Approach

Use the **Progressive Disclosure** design (Option 1 in the code) because:
- Matches chat interface paradigm
- Reduces cognitive load
- Mobile-friendly
- Smooth user experience
- Easy to implement with existing structure