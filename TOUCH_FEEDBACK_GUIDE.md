# Touch Feedback Guide for Thrive App

## Overview
All interactive elements in the Thrive app must have proper touch feedback for a native mobile experience. This includes visual feedback, animations, and haptic feedback where supported.

## Quick Start

### For New Components
1. **Buttons**: Add `touch-feedback touch-manipulation` classes
2. **Icon Buttons**: Add `touch-feedback-icon touch-manipulation` classes
3. **List Items**: Add `touch-feedback-list touch-manipulation` classes
4. **Cards/Subtle Elements**: Add `touch-feedback-subtle touch-manipulation` classes

### Example Usage

```jsx
// Standard Button
<button className="... touch-feedback touch-manipulation">
  Click Me
</button>

// Icon Button (small buttons with icons)
<button className="w-10 h-10 ... touch-feedback-icon touch-manipulation">
  <Icon />
</button>

// Clickable Card
<div onClick={handleClick} className="... touch-feedback-subtle touch-manipulation">
  Card Content
</div>

// List Item
<div className="... touch-feedback-list touch-manipulation">
  List Item
</div>
```

## Touch Feedback Classes

### `touch-feedback`
- **Use for**: Primary buttons, action buttons
- **Effect**: Scale to 0.97, opacity to 90%
- **Duration**: 150ms

### `touch-feedback-subtle`
- **Use for**: Cards, secondary actions, smaller elements
- **Effect**: Scale to 0.98, opacity to 80%
- **Duration**: 100ms

### `touch-feedback-icon`
- **Use for**: Icon-only buttons, small circular buttons
- **Effect**: Scale to 0.92, opacity to 70%
- **Duration**: 100ms

### `touch-feedback-list`
- **Use for**: List items, menu items, settings rows
- **Effect**: Background color change, scale to 0.99
- **Duration**: 150ms

### `touch-manipulation`
- **Always include** with any touch feedback class
- **Purpose**: Optimizes touch handling, prevents double-tap zoom

## Using TouchButton Component

For buttons with haptic feedback:

```jsx
import { TouchButton } from '@/components/ui/TouchButton';

<TouchButton 
  variant="primary" 
  haptic="light"
  onClick={handleClick}
>
  Button Text
</TouchButton>
```

## Haptic Feedback Hook

For custom components needing haptic feedback:

```jsx
import { useTouchFeedback } from '@/hooks/useTouchFeedback';

function MyComponent() {
  const { touchHandlers, triggerHaptic } = useTouchFeedback({ 
    hapticStyle: 'light' 
  });

  return (
    <div {...touchHandlers} onClick={triggerHaptic}>
      Content
    </div>
  );
}
```

## Global Touch Feedback

The app includes a `TouchFeedbackProvider` that automatically adds touch feedback to:
- All `<button>` elements
- Links with `href` starting with `/`
- Elements with `onClick` handlers
- Elements with `cursor-pointer` class

## Best Practices

1. **Always include both classes**: `touch-feedback-* touch-manipulation`
2. **Choose appropriate feedback level**: Don't use strong feedback for subtle elements
3. **Test on real devices**: Touch feedback feels different on actual devices
4. **Consider context**: Disabled elements should not have touch feedback
5. **Be consistent**: Similar elements should have similar feedback

## Mobile-First Requirements

- Minimum touch target: 44x44px
- Touch feedback must be immediate (no delay)
- Animations should be smooth (60fps)
- Haptic feedback should be subtle (light or medium)

## Testing Checklist

- [ ] Element scales down when pressed
- [ ] Animation is smooth and quick
- [ ] Haptic feedback triggers (on supported devices)
- [ ] No double-tap zoom issues
- [ ] Touch target is at least 44x44px
- [ ] Feedback works on both iOS and Android