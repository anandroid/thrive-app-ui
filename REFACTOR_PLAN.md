# Keyboard Fix: Refactoring Plan

## Overview
Instead of fighting with complex CSS transforms and fixed positioning, we'll adopt a standard mobile app architecture:
- Fixed header at top
- Scrollable content area
- Natural keyboard behavior (content scrolls, header stays)

## Architecture Changes

### 1. New AppLayout Component
All pages will use this standard layout:

```tsx
<AppLayout 
  header={{ 
    title: "Page Title", 
    showBackButton: true 
  }}
>
  <YourContent />
</AppLayout>
```

### 2. Chat Page Refactor
Before (complex fixed layout):
```tsx
<SmartCardChat ... /> // Has its own fixed container
```

After (uses AppLayout):
```tsx
<AppLayout 
  header={{
    title: <CompanionHeader />,
    showBackButton: true,
    backHref: "/"
  }}
  className="chat-layout"
>
  <SmartCardChatContent 
    messages={messages}
    onSendMessage={handleSendMessage}
    // ... other props
  />
</AppLayout>
```

### 3. CSS Changes

#### Remove
- All `body.keyboard-visible` transform rules
- Complex keyboard height calculations
- Fixed positioning workarounds

#### Keep
- CSS variables for keyboard height (for debugging)
- Safe area padding

## Benefits

1. **Natural Keyboard Behavior**
   - When keyboard appears, scrollable area shrinks
   - Input automatically scrolls into view
   - No manual calculations needed

2. **Consistent UX**
   - All pages have the same header behavior
   - Predictable navigation
   - Easier to maintain

3. **Better Performance**
   - No CSS transforms
   - Native scroll behavior
   - Smooth animations

## Implementation Steps

### Phase 1: Core Components
1. ✅ Create AppLayout component
2. ✅ Create app-layout.css
3. ✅ Create SmartCardChatContent (chat without container)

### Phase 2: Refactor Pages
1. [ ] Refactor chat page to use AppLayout
2. [ ] Update thrivings page
3. [ ] Update pantry page
4. [ ] Update other pages

### Phase 3: Cleanup
1. [ ] Remove keyboard transform CSS
2. [ ] Remove KeyboardAwareLayout wrapper
3. [ ] Simplify native app (just send keyboard height for debugging)

## Testing Plan

1. **Test on Physical Device**
   - Focus input field
   - Verify header stays at top
   - Verify input is visible above keyboard
   - Test scrolling with keyboard open

2. **Test Different Keyboards**
   - Gboard
   - SwiftKey
   - Samsung Keyboard
   - iOS default keyboard

3. **Test Edge Cases**
   - Landscape orientation
   - Split-screen mode
   - External keyboard

## Migration Guide

For each page:

1. Import AppLayout:
```tsx
import { AppLayout } from '@/components/layout/AppLayout';
```

2. Wrap content:
```tsx
export default function MyPage() {
  return (
    <AppLayout header={{ title: "My Page" }}>
      {/* Your existing content */}
    </AppLayout>
  );
}
```

3. Remove any custom fixed positioning or keyboard handling

## Result

- Clean, maintainable code
- Natural mobile UX
- No more keyboard issues
- Consistent across all pages