# Thrive App Deeplinks and Navigation Patterns

This document lists all available deeplinks, URL patterns, and navigation routes in the Thrive app.

## Chat Navigation

### New Chat
- `/chat/new` - Start a new chat
- `/chat/new?intent=create_thriving` - New chat with thriving creation intent
- `/chat/new?intent=create_thriving&topic={topic}` - Create thriving with specific topic
- `/chat/new?intent=create_thriving&topic={topic}&type={type}` - Create thriving with topic and type (routine/journey)
- `/chat/new?prompt={encodedPrompt}` - New chat with initial message
- `/chat/new?expertHelp=true&thrivingId={thrivingId}` - Expert help for specific thriving
- `/chat/new?expertHelp=true&thrivingId={thrivingId}&message={encodedMessage}` - Expert help with message

### Existing Chat
- `/chat/{threadId}` - Continue existing chat conversation
- `/chat/{threadId}?expertHelp=true&message={encodedMessage}` - Continue chat with expert help

### Chat History
- `/chat-history` - View all chat conversations

## Thrivings (Routines & Journeys)

### View Thrivings
- `/thrivings` - View all thrivings
- `/thrivings?id={thrivingId}` - View specific thriving
- `/thrivings?id={thrivingId}&step={stepIndex}` - Open specific step in a thriving
- `/thrivings?id={thrivingId}&showAdjustment=true` - Adjust routine with AI
- `/thrivings?id={thrivingId}&view=progress` - View progress for thriving
- `/thrivings#health-insights` - Navigate to health insights section

### Thriving Journal
- `/thrivings/{thrivingId}/journal` - Create journal entry for thriving
- `/thrivings/{thrivingId}/journal?mood={mood}&content={content}` - Pre-filled journal entry
- `/thrivings/{thrivingId}/journal?topic={topic}` - Journal with specific topic (e.g., morning_intentions, pain_tracking, check_in)

## Pantry Management

- `/pantry` - View pantry items
- `/pantry?action=add` - Open add item modal
- `/pantry?action=add&name={name}&dosage={dosage}` - Pre-filled add item modal
- `/pantry?highlight={itemName}` - Highlight specific item (e.g., magnesium)
- `/pantry?action=add&name={name}&reorder=true` - Reorder/restock item

## Settings

- `/settings` - Main settings page
- `/settings/health` - Connect Apple Health/Google Fit
- `/settings/about` - About page
- `/settings/notifications` - Notification settings

## Journeys

- `/journeys` - View all journeys

## Window Modal Commands

These commands open modals programmatically:

### Create Thriving
- `window.openModal('createThriving', { type: 'routine', topic: 'sleep' })` - Create routine
- `window.openModal('createThriving', { type: 'journey', topic: 'weight-loss' })` - Create journey
- `window.openModal('createThriving', { type: 'routine', enhance: {id} })` - Enhance existing routine

### Pantry
- `window.openModal('pantryAdd', { name: 'Vitamin D', dosage: '2000 IU' })` - Add item with pre-filled data
- `window.openModal('pantryAdd', { suggestions: lowItems })` - Add with suggestions

### Health & Journal
- `window.openModal('healthConnect')` - Health connection modal
- `window.openModal('journalQuick', { thrivingId, topic })` - Quick journal entry
- `window.openModal('journalQuick', { topic: 'weight', metric: true })` - Metric tracking

### Settings
- `window.openModal('notificationSettings')` - Notification settings modal

## Tracking Actions

- `window.trackAction('completed_step', { thrivingId, stepId })` - Track step completion

## External URLs

The app uses `bridge.openExternalUrl()` to open external links:

### Amazon Search
- Auto-generated Amazon search for supplements when user clicks "buy" or "Where to find it"
- Format: `https://www.amazon.com/s?k={searchQuery}`

### Expert Consultation
- Shopify booking URL with context parameters:
  - `?ref=thrive-app`
  - `?context={threadId}`
  - `?concerns={userConcerns}`

## URL Parameter Handling

### Chat Page (`/chat/[threadId]`)
- `intent` - Chat intent (e.g., 'create_thriving')
- `expertHelp` - Boolean for expert help mode
- `message` - Pre-filled message

### Thrivings Page (`/thrivings`)
- `id` - Thriving ID to view
- `step` - Step index to highlight/scroll to
- `showAdjustment` - Show adjustment modal
- `view` - View mode (e.g., 'progress')

### Pantry Page (`/pantry`)
- `action` - Action to perform ('add')
- `highlight` - Item name to highlight
- `name` - Pre-filled item name
- `dosage` - Pre-filled dosage
- `reorder` - Boolean for reorder flow

### Journal Pages
- `mood` - Pre-selected mood
- `content` - Pre-filled content
- `topic` - Journal topic/prompt
- `metric` - Boolean for metric tracking

## Navigation Methods

### 1. Router Navigation
```tsx
router.push('/path?param=value')
```

### 2. Window Location
```tsx
window.location.href = '/path?param=value'
```

### 3. TouchLink Component
```tsx
<TouchLink href="/path?param=value">Link</TouchLink>
```

### 4. Bridge External URL
```tsx
bridge.openExternalUrl('https://external.com')
```

## Dynamic Routes

- `/chat/[threadId]` - Dynamic chat thread
- `/thrivings/[thrivingId]/journal` - Dynamic journal for thriving

## Session Storage Integration

Some navigation flows use sessionStorage for data passing:
- `initialMessage` - Initial chat message
- `adjustmentRequest` - Routine adjustment data

## Time-Based Recommendations

The recommendation assistant provides time-specific deeplinks:

### Morning (6am-12pm)
- Start morning reflection journal
- Take morning supplements
- Track weight

### Evening (6pm-10pm)
- Take evening supplements
- Log pain levels
- Start wind-down routine

### Low Supplies
- Reorder supplements running low
- Restock essentials

### No Recent Activity
- Check-in prompts
- Quick wellness assessment

## Implementation Examples

### Navigate to specific thriving step
```tsx
router.push(`/thrivings?id=${thrivingId}&step=${stepIndex}`)
```

### Open pantry with pre-filled supplement
```tsx
router.push(`/pantry?action=add&name=${encodeURIComponent('Vitamin D')}&dosage=${encodeURIComponent('2000 IU')}`)
```

### Start chat with topic
```tsx
router.push(`/chat/new?intent=create_thriving&topic=${encodeURIComponent('sleep improvement')}`)
```

### Adjust routine
```tsx
window.location.href = `/thrivings?id=${routineId}&showAdjustment=true`
```