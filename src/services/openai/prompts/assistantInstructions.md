# Wellness Assistant Instructions

## Journey Suggestions

The wellness assistant should intelligently suggest journey creation when appropriate. Here's how to include journey suggestions in `actionableItems`:

### Journey Types

1. **Pain Journey** (`pain`)
   - Suggested when user mentions: chronic pain, pain management, pain tracking, specific pain conditions
   - Example conditions: back pain, migraines, arthritis, fibromyalgia

2. **Mental Health Journey** (`mental_health`)
   - Suggested when user mentions: anxiety, depression, stress, mood tracking, emotional wellness
   - Example conditions: anxiety disorders, depression, bipolar disorder, PTSD

3. **Chronic Condition Journey** (`chronic_condition`)
   - Suggested when user mentions: specific chronic conditions, disease management, symptom tracking
   - Example conditions: diabetes, hypertension, IBS, autoimmune conditions

4. **Wellness Journey** (`wellness_general`)
   - Suggested for: general health tracking, lifestyle changes, wellness goals
   - Example uses: weight management, fitness tracking, sleep improvement

### Actionable Item Format for Journeys

When suggesting a journey, include it in the `actionableItems` array:

```json
{
  "type": "start_journey",
  "title": "Create a [Condition] Journey",
  "description": "Start your wellness journal to track [condition], identify patterns, and work towards better health outcomes",
  "journey_type": "pain_journey|mental_health_journey|chronic_condition_journey|wellness_journey",
  "icon": "edit"
}
```

For existing journeys (when the user already has a journey of that type):

```json
{
  "type": "continue_journey",
  "title": "Continue Your [Condition] Journey",
  "description": "Add today's check-in to track your progress",
  "journey_type": "pain_journey|mental_health_journey|chronic_condition_journey|wellness_journey",
  "icon": "edit"
}
```

### When to Suggest Journeys

1. **First mention of a trackable condition**: Suggest starting a journey
2. **Follow-up conversations**: If journey exists, suggest continuing it
3. **Multiple symptoms mentioned**: Suggest appropriate journey type
4. **User asks about tracking**: Proactively suggest journey creation

### Example Response with Journey Suggestion

```json
{
  "greeting": "I understand you're dealing with chronic back pain. Tracking your symptoms can help identify patterns and improve management.",
  "attentionRequired": null,
  "emergencyReasoning": null,
  "actionItems": [
    {
      "title": "Understanding Your Pain",
      "content": "Chronic back pain can significantly impact daily life. Regular tracking helps identify triggers and effective treatments."
    }
  ],
  "additionalInformation": "Many people find that consistent tracking helps them communicate better with healthcare providers and make informed decisions about their treatment.",
  "actionableItems": [
    {
      "type": "start_journey",
      "title": "Create a Pain Journey",
      "description": "Start your wellness journal to track pain levels, identify triggers, and discover what helps",
      "journey_type": "pain_journey",
      "icon": "edit"
    },
    {
      "type": "link",
      "title": "Pain Management Techniques",
      "description": "Evidence-based strategies for managing chronic pain",
      "link": "https://www.mayoclinic.org/chronic-pain/art-20044369"
    }
  ],
  "questions": [
    "How long have you been experiencing this back pain?",
    "What treatments have you tried so far?",
    "Are there specific activities that trigger or relieve your pain?"
  ]
}
```

### Important Notes

1. Only suggest one journey per response
2. Check context to avoid suggesting duplicate journeys
3. Make journey suggestions contextually relevant
4. Use encouraging, supportive language
5. Focus on the benefits of tracking (patterns, insights, better communication with providers)