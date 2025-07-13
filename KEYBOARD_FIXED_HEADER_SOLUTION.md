# Fixed Header Keyboard Solution

## Overview
This solution keeps the action bar fixed at the top while shifting only the main content when the keyboard appears.

## Implementation Details

### Native App (ThriveAppNative)
- **No container shifting** - The WebView container stays in place
- **Keyboard height messaging** - Sends keyboard height to web app via postMessage
- **Clean implementation** - No margin/padding adjustments in native code

### Web App (thrive-app)
1. **useKeyboardAwareLayout hook** - Listens for keyboard height messages
2. **CSS-based shifting** - Uses transform: translateY() for smooth animation
3. **Fixed header** - Action bar has position: fixed and doesn't transform
4. **Main content shifts** - Only .page-content and similar containers move up
5. **Chat container handling** - Uses bottom position adjustment instead of transform for fixed containers

### Key Files
- `/hooks/useKeyboardAwareLayout.ts` - Keyboard detection hook
- `/styles/keyboard-layout.css` - CSS for keyboard handling
- `/components/layout/KeyboardAwareLayout.tsx` - Wrapper component
- `app/layout.tsx` - Wraps entire app with KeyboardAwareLayout

## How It Works

1. **Keyboard Appears**:
   - Native app detects keyboard height
   - Sends message: `{ type: 'keyboard_height_changed', payload: { height: 300, visible: true }}`
   - Web app receives message and:
     - Sets CSS variable `--keyboard-height: 300px`
     - Adds class `keyboard-visible` to body
     - CSS transforms main content up by 300px
     - Action bar stays fixed at top

2. **Keyboard Hides**:
   - Native app detects keyboard hidden
   - Sends height: 0
   - Web app removes transforms and class

## Testing

### Browser Testing
1. Open `/test-keyboard` page
2. Click "Simulate Keyboard" button
3. Verify action bar stays at top
4. Check DevTools for CSS classes

### Device Testing
1. Build and run on Android device
2. Focus any input field
3. Keyboard appears and:
   - Action bar remains at top
   - Content shifts up smoothly
   - Input is visible above keyboard

## Chat Container Solution

For the chat page which uses `position: fixed`, we use a different approach:

1. **Adjust bottom position** instead of transform
2. **Container moves up** by keyboard height
3. **Flex layout** ensures input stays at bottom
4. **Messages area** shrinks automatically

```css
body.keyboard-visible .chat-container {
  bottom: var(--keyboard-height) !important;
  transition: bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

## Benefits
- ✅ Consistent UI - Header always visible
- ✅ Smooth animations - CSS transforms
- ✅ No layout jumps - Pure visual shift
- ✅ Works everywhere - All screens and modals
- ✅ Clean separation - Native handles detection, web handles UI
- ✅ Chat input visible - Always above keyboard