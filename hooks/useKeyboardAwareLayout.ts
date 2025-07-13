'use client';

import { useEffect, useState } from 'react';

export function useKeyboardAwareLayout() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    const handleMessage = (event: MessageEvent) => {
      try {
        // Handle messages from React Native WebView
        if (typeof event.data === 'string') {
          const data = JSON.parse(event.data);
          if (data.type === 'keyboard_height_changed') {
            const { height, visible } = data.payload;
            setKeyboardHeight(height || 0);
            setIsKeyboardVisible(visible || false);
            
            // Update CSS variables for animation
            document.documentElement.style.setProperty('--keyboard-height', `${height || 0}px`);
            
            // Add/remove class for keyboard visibility
            if (visible && height > 0) {
              document.body.classList.add('keyboard-visible');
            } else {
              document.body.classList.remove('keyboard-visible');
            }
          }
        }
      } catch (e) {
        // Ignore parse errors from other messages
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return {
    keyboardHeight,
    isKeyboardVisible,
    keyboardStyle: {
      '--keyboard-height': `${keyboardHeight}px`
    } as React.CSSProperties
  };
}