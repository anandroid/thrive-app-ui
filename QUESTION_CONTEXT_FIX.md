# Question Context Fix

## Problem
When users respond to questions, the API only receives their response without the context of what question they're answering. This causes confusion and disconnected conversations.

## Solution
Updated the `EnhancedQuestions` component to include question context with ALL types of user responses.

### Universal Format
All responses now follow the pattern: `[user response] (answering: "[question]")`

### 1. **Quick Reply Questions**
```javascript
// Before: Just sends the option
message = option;

// After: Includes question context
message = `${option} (answering: "${question.prompt}")`;
```

Examples:
- "No (answering: "Have you tried any sleep supplements before?")"
- "Morning (answering: "What time of day do you prefer to exercise?")"
- "Not sure (answering: "Do you have any allergies?")"

### 2. **Text Input Questions**
```javascript
// Before: Just sends typed text
message = values.text;

// After: Includes question context
message = `${values.text} (answering: "${question.prompt}")`;
```

Example:
- "Yes, that would be helpful yes please (answering: "Would you like assistance in creating a list of your current medications?")"

### 3. **Time Input Questions**
```javascript
// Before: Sends time with userVoice
message = question.userVoice + ' ' + values.time;

// After: Includes question context
message = `${values.time} (answering: "${question.prompt}")`;
```

Example:
- "10:30 PM (answering: "What time do you usually go to bed?")"

### 4. **Multi-Select Questions**
```javascript
// Before: Sends selections with userVoice
message = question.userVoice + ' ' + selected.join(', ');

// After: Includes question context
message = `${selected.join(', ')} (answering: "${question.prompt}")`;
```

Example:
- "Stress, Poor diet, Lack of exercise (answering: "What factors might be affecting your sleep?")"

## Benefits

1. **Better Context Awareness**: The assistant knows exactly what question the user is responding to
2. **Improved Acknowledgments**: The assistant can provide more relevant acknowledgments
3. **Clearer Conversation Flow**: No ambiguity about what "Yes" or "No" refers to
4. **Works with Sliding Window**: Even if older messages fall out of the window, the context is preserved

## How It Looks in Practice

### Before:
```
Assistant: "Would you like assistance in creating a list of your current medications?"
User: "Yes, that would be helpful yes please"
Assistant: "Great! Let's get started..." [Generic response]
```

### After:
```
Assistant: "Would you like assistance in creating a list of your current medications?"
User: "Yes, that would be helpful yes please (answering: "Would you like assistance in creating a list of your current medications?")"
Assistant: "I'll help you create a medication list. Let's start with..." [Context-aware response]
```

## Technical Implementation

- Updated `/components/features/EnhancedQuestions.tsx`
- Modified `handleQuickReply()` for yes/no questions
- Modified `handleFormSubmit()` for text input questions
- Context is appended in parentheses to maintain readability
- Works seamlessly with the acknowledgment system

## Note
The context is added programmatically and won't be visible in the chat UI - users will only see their original message. The context is only included in the API request to help the assistant understand what's being responded to.