# Keyboard Handling Guide for WebView

This guide explains how to use the universal keyboard handling solution that works across all screens in both regular browsers and React Native WebView.

## The Problem
WebView environments have unique challenges with keyboard handling:
- `visualViewport` API is unreliable
- `windowSoftInputMode` doesn't work consistently
- Standard CSS solutions fail in WebView
- Focus events don't trigger keyboard reliably

## The Solution
We've implemented a comprehensive keyboard handling system that:
1. Detects WebView environment automatically
2. Uses multiple detection methods (polling + events)
3. Provides consistent API across all screens
4. Falls back gracefully in regular browsers

## How to Use

### Option 1: KeyboardAvoidingView Component (Recommended)

For screens with inputs, wrap your content in `KeyboardAvoidingView`:

```tsx
import { KeyboardAvoidingView } from '@/components/ui/KeyboardAvoidingView';

export function MyScreen() {
  return (
    <KeyboardAvoidingView behavior="padding">
      <div className="flex flex-col h-screen">
        <header>...</header>
        <main className="flex-1 overflow-auto">
          {/* Your content */}
        </main>
        <footer>
          <input type="text" />
        </footer>
      </div>
    </KeyboardAvoidingView>
  );
}
```

### Option 2: KeyboardAwareLayout (For Entire Pages)

Wrap your entire page layout:

```tsx
import { KeyboardAwareLayout } from '@/components/layout/KeyboardAwareLayout';

export default function MyPage() {
  return (
    <KeyboardAwareLayout>
      {/* Your page content */}
    </KeyboardAwareLayout>
  );
}
```

### Option 3: useKeyboardAwareInput Hook (For Individual Inputs)

For fine-grained control over individual inputs:

```tsx
import { useKeyboardAwareInput } from '@/hooks/useKeyboardAwareInput';

export function MyForm() {
  const { handleFocus } = useKeyboardAwareInput();
  
  return (
    <form>
      <input 
        type="text" 
        onFocus={handleFocus}
        placeholder="Enter text..."
      />
      <textarea 
        onFocus={handleFocus}
        placeholder="Enter message..."
      />
    </form>
  );
}
```

### Option 4: Direct Hook Usage (Advanced)

For custom implementations:

```tsx
import { useWebViewKeyboard } from '@/hooks/useWebViewKeyboard';

export function CustomComponent() {
  const { 
    keyboardHeight, 
    isKeyboardVisible, 
    scrollToInput,
    makeKeyboardAware 
  } = useWebViewKeyboard();
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (containerRef.current) {
      makeKeyboardAware(containerRef.current);
    }
  }, [makeKeyboardAware]);
  
  return (
    <div ref={containerRef} data-keyboard-container="true">
      {/* Your content */}
    </div>
  );
}
```

## CSS Classes

The system automatically applies these attributes when keyboard is visible:
- `data-keyboard-visible="true"` - Applied to keyboard-aware containers
- `data-keyboard-container="true"` - Marks containers for keyboard handling

You can style based on these:

```css
.my-container[data-keyboard-visible="true"] {
  /* Styles when keyboard is visible */
}
```

## How It Works

1. **Detection**: The system uses multiple methods to detect keyboard:
   - Polling window.innerHeight changes (100ms intervals)
   - Native keyboard events from React Native
   - VisualViewport API (when available)
   - Resize and orientation events

2. **Communication**: React Native app sends keyboard height to WebView:
   ```javascript
   {
     type: 'keyboard_height_changed',
     payload: { height: 300, visible: true }
   }
   ```

3. **Adjustment**: Containers automatically adjust height and scroll position

## Best Practices

1. **Use Flexbox Layouts**: Structure your screens with flexbox for better keyboard handling:
   ```tsx
   <div className="flex flex-col h-screen">
     <header className="flex-shrink-0">...</header>
     <main className="flex-1 overflow-auto">...</main>
     <footer className="flex-shrink-0">
       <input />
     </footer>
   </div>
   ```

2. **Avoid Fixed Positioning**: Use relative/absolute positioning within flex containers

3. **Test on Real Devices**: Always test on actual iOS and Android devices

4. **Use the Highest Level Solution**: Prefer KeyboardAvoidingView over individual hooks

## Troubleshooting

1. **Input still covered**: Ensure parent containers use flexbox and have proper overflow settings
2. **Jumpy animations**: Check that transition CSS is applied to containers
3. **Not working in WebView**: Verify React Native app includes keyboard event handling
4. **Works in browser but not WebView**: The system auto-detects WebView - check bridge initialization

## Files Involved

- `/hooks/useWebViewKeyboard.ts` - Core WebView keyboard detection
- `/hooks/useKeyboardHeight.ts` - Regular browser keyboard detection  
- `/hooks/useKeyboardAwareInput.ts` - Unified input handling hook
- `/components/ui/KeyboardAvoidingView.tsx` - Main component
- `/components/layout/KeyboardAwareLayout.tsx` - Layout wrapper
- `/app/webview-keyboard-complete.css` - WebView-specific styles
- `ThriveAppNative/App.tsx` - React Native keyboard event handling