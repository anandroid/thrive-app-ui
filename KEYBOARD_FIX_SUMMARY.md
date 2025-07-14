# Keyboard Fix Summary

## Problem
The chat editor input was appearing underneath the keyboard in the React Native WebView on Android physical devices.

## Root Cause
The chat container uses `position: fixed` which doesn't work well with CSS transforms. The WebView was also skipping auto-scroll behavior due to the fixed positioning.

## Solution Implemented

### 1. Changed CSS Approach
- Instead of using `transform: translateY()` or `padding-bottom`, we now adjust the `bottom` position of the fixed container
- Added a 20px buffer to ensure the input is fully visible above the keyboard

### 2. CSS Changes Made

#### `/styles/keyboard-layout.css`
```css
body.keyboard-visible .chat-container {
  /* Move container up by keyboard height + buffer */
  bottom: calc(var(--keyboard-height) + 20px) !important;
  transition: bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

body.keyboard-visible .chat-input-area {
  /* Extra padding for safe area and visibility */
  padding-bottom: calc(16px + env(safe-area-inset-bottom, 0));
  background: white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}
```

#### `/app/chat-simple.css`
- Removed fixed `height: 100vh` to allow proper resizing
- Container now uses flexbox to fill available space

### 3. Signal Flow (Verified Working)
1. **Native App** sends keyboard height via postMessage
2. **useKeyboardAwareLayout** hook receives message and:
   - Sets CSS variable `--keyboard-height`
   - Adds `keyboard-visible` class to body
3. **CSS** applies bottom adjustment to chat container

### 4. Debug Tools Added
- `KeyboardDebugPanel` component for real-time debugging
- Test pages: `test-keyboard-signal.html`, `test-chat-keyboard.html`, `test-keyboard-native.html`
- Puppeteer test: `test-keyboard-puppeteer.js`

## Testing Instructions

### In Development
1. Open the chat page in the app
2. Look for the debug panel at the bottom showing:
   - Current keyboard height
   - Body class status
   - Container bottom position
3. Focus the input field to trigger keyboard
4. Verify the entire chat container moves up
5. Confirm input is visible above keyboard

### Debug Panel Controls
- **Msg 300px**: Simulates keyboard message
- **Direct 300px**: Directly sets CSS (bypasses message system)
- **Check Styles**: Logs computed styles to console

### Manual Testing
1. Test on physical Android device
2. Test with different keyboard heights
3. Test with different keyboard apps (Gboard, SwiftKey, etc.)
4. Verify smooth animation
5. Check that header stays at top
6. Ensure messages area is scrollable

## Known Issues & Considerations
- Different keyboards report different heights
- Some keyboards include suggestion bars in height
- Safe area insets vary by device
- The 20px buffer may need adjustment for some devices

## Rollback Instructions
If issues persist:
1. Remove `+ 20px` from the calc() in keyboard-layout.css
2. Try different buffer values (10px, 30px, etc.)
3. Check if keyboard height includes safe area on specific device

## Future Improvements
- Dynamic buffer calculation based on device
- Viewport height detection for better accuracy
- Keyboard type detection (numeric vs full)
- Platform-specific adjustments