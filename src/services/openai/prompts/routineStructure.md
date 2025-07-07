# Routine Structure Guidelines

## Overview
Wellness routines consist of two main types of actions:
1. **Daily Reminders (steps)** - Regular activities performed daily
2. **Additional Recommendations (additionalSteps)** - One-time, weekly, or as-needed actions

## Daily Reminders (Routine Steps)
These are the core daily activities that form the habit:
- Should be performed every day at specific times
- Include `reminderTime` for when to send notifications
- Each step should have a clear duration in minutes
- Can include `tips` array for pro tips (hidden by default in UI)
- Video URLs should link to helpful demonstrations

### Example Step Structure:
```json
{
  "order": 1,
  "title": "Morning Breathing Exercise",
  "description": "Start your day with 5 minutes of deep breathing",
  "duration": 5,
  "reminderTime": "07:00",
  "videoUrl": "https://youtube.com/watch?v=...",
  "tips": [
    "Breathe in through your nose for 4 counts",
    "Hold for 4 counts",
    "Exhale through mouth for 6 counts"
  ]
}
```

## Additional Recommendations
These are supplementary actions that support the routine but aren't daily:

### Frequency Types:
- **one_time**: Setup or purchase actions (e.g., buy air purifier, install app)
- **weekly**: Maintenance tasks (e.g., clean equipment, review progress)
- **monthly**: Periodic checks or replacements
- **as_needed**: Situational actions

### Example Additional Step:
```json
{
  "id": "rec_1",
  "title": "Install HEPA Air Filter",
  "description": "Purchase and install a HEPA air filter in your bedroom to reduce allergens",
  "frequency": "one_time",
  "tips": [
    "Look for filters rated MERV 13 or higher",
    "Place near your bed but not directly blowing on you",
    "Consider room size when choosing filter capacity"
  ]
}
```

## Complete Routine Example - Allergy Management:

### Daily Reminders:
1. Morning nasal rinse (5 min, 07:00)
2. Take antihistamine medication (2 min, 08:00)
3. Evening shower to remove pollen (10 min, 21:00)
4. Apply nasal barrier gel before bed (2 min, 22:00)

### Additional Recommendations:
- **One-time**: Install HEPA air filter
- **One-time**: Purchase hypoallergenic bedding
- **Weekly**: Wash bedding in hot water
- **Monthly**: Replace air filter
- **As-needed**: Use rescue inhaler during flare-ups

## Important Notes:
1. Keep daily reminders focused on habit formation
2. Additional recommendations handle setup, maintenance, and contingencies
3. Each routine step should be achievable in the stated duration
4. Pro tips provide extra guidance without cluttering the main UI
5. Reminder times should align with the user's schedule
6. Video URLs should be actual helpful resources when available