# Journey System Implementation

## Overview
The journey system allows users to track their health conditions over time with AI-led conversations. It supports four journey types:
- Pain tracking
- Mental health tracking 
- Chronic condition management
- General wellness tracking

## Features Implemented

### 1. Journey Creation
- **API Endpoint**: `/api/journey/create`
- Creates personalized journeys based on user's health concerns
- AI generates journey title, description, goals, triggers, and coping strategies
- Journeys are stored in localStorage for persistence

### 2. Journey Check-ins
- **API Endpoint**: `/api/journey/check-in`
- AI-led conversations that adapt based on time of day and previous entries
- Mood tracking with 5 mood options (great, good, okay, not great, struggling)
- Pain level tracking (1-10 scale) for pain journeys
- Notes and symptom tracking
- All entries stored locally with timestamps

### 3. Journey Chat Interface
- **Component**: `JourneyChat.tsx`
- Beautiful, mobile-optimized UI for daily check-ins
- Shows recent entries and mood history
- Contextual follow-up questions from AI
- Smooth animations and transitions

### 4. Journey Management
- **Page**: `/journeys`
- View all active journeys
- See entry count and last check-in date
- Visual mood history for recent entries
- Click to open journey for new check-in

### 5. Journey Discovery
- Journeys appear on home page when created
- Assistant can suggest journey creation via actionable items
- Smart detection prevents duplicate journey suggestions
- Seamless navigation from chat to journey creation

## Storage Structure

Journeys are stored in localStorage under the key `wellness-journeys`:

```typescript
{
  id: string;
  type: 'pain' | 'mental_health' | 'chronic_condition' | 'wellness_general';
  title: string;
  description: string;
  condition?: string;
  createdAt: Date;
  updatedAt: Date;
  entries: JourneyEntry[];
  isActive: boolean;
  goals?: string[];
  triggers?: string[];
  copingStrategies?: string[];
}
```

## Assistant Integration

The wellness assistant can suggest journeys through actionable items:

```json
{
  "type": "start_journey",
  "title": "Track Your Pain Journey",
  "description": "Start a personalized journey to monitor pain levels and identify patterns",
  "journey_type": "pain_journey",
  "icon": "edit"
}
```

For existing journeys:

```json
{
  "type": "continue_journey",
  "title": "Continue Your Mental Health Journey",
  "description": "Add today's check-in to track your progress",
  "journey_type": "mental_health_journey",
  "icon": "edit"
}
```

## User Flow

1. User mentions a trackable condition in chat
2. Assistant suggests starting a journey via actionable item
3. User clicks to open journey creation modal
4. User sets goals and creates journey
5. Journey saved and user navigated to journeys page
6. User completes first check-in with mood selection
7. Subsequent visits show journey on home page
8. Daily check-ins track progress over time

## Technical Implementation

- **Journey Types**: Defined in `src/services/openai/types/journey.ts`
- **Storage Utils**: `src/utils/journeyStorage.ts`
- **API Routes**: `app/api/journey/create` and `app/api/journey/check-in`
- **Components**: `JourneyChat.tsx`, `JourneyCreationModal.tsx`
- **Integration**: `SmartCardChat.tsx` handles journey actionable items
- **Navigation**: Chat page passes journey creation/navigation to journeys page