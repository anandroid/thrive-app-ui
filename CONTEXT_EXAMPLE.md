# Context Window Example

## How the Improved Context Works

The sliding window now includes **both user and assistant messages** with clear attribution. Here's what the assistant sees:

### Example Context Sent to OpenAI:

```
CONVERSATION CONTEXT:
User has discussed: sleep, melatonin, magnesium, stress
You have already recommended: Melatonin 3-5mg, Magnesium Glycinate 200-400mg, Sleep Hygiene Routine

Recent exchanges:
USER SAID: "I have trouble sleeping at night"
YOU (as chat specialist) RESPONDED: "{"greeting": "I understand sleep issues can be challenging", "actionableItems": [{"type": "supplement_choice", "title": "Melatonin 3-5mg"}]..."
USER SAID: "What time should I take melatonin?"
YOU (as pantry specialist) RESPONDED: "{"additionalInformation": "Take melatonin 30-60 minutes before your desired bedtime. Start with a low dose of 3mg..."
USER SAID: "What about magnesium?"
YOU (as pantry specialist) RESPONDED: "{"actionableItems": [{"type": "supplement_choice", "title": "Magnesium Glycinate 200-400mg"}], "additionalInformation": "Magnesium is excellent for sleep..."

Based on this context, continue helping the user with their current query.
```

## Key Benefits:

1. **Clear Attribution**:
   - `USER SAID:` - Shows what the user asked
   - `YOU (as [specialist]) RESPONDED:` - Shows what the assistant previously recommended
   
2. **Tracks Recommendations**:
   - Automatically extracts supplement names and recommendations
   - Prevents duplicate suggestions
   - Shows which specialist made each recommendation

3. **Topic Awareness**:
   - Extracts health keywords from conversation
   - Maintains awareness of discussed topics
   - Helps maintain conversation continuity

4. **Specialist Handoffs**:
   - Shows which specialist (chat/routine/pantry) responded
   - Maintains context across specialist transitions
   - Ensures smooth handoffs

## Technical Implementation:

The context is built from the last 10 messages stored in the `ContextCache`:
- User messages are stored in full
- Assistant messages include the specialist role
- JSON responses are parsed to extract key recommendations
- Context summary is added to each assistant's instructions

This ensures the assistant:
- ✅ Knows what it already recommended
- ✅ Avoids repeating itself
- ✅ Maintains conversation continuity
- ✅ Provides contextually relevant responses