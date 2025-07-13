'use client';

import { useEffect, useState } from 'react';
import bridge from '@/src/lib/react-native-bridge';

export function useNativeKeyboard() {
  const [isNativeApp, setIsNativeApp] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    // Check if we're in a native WebView
    const isInNative = bridge.isInReactNative();
    setIsNativeApp(isInNative);
  }, []);

  useEffect(() => {
    if (!isNativeApp) return;

    // Listen for keyboard height changes from native
    const handleKeyboardHeight = (payload: any) => {
      if (payload && typeof payload.height === 'number') {
        setKeyboardHeight(payload.height);
      }
    };

    bridge.onMessage('keyboard_height_changed', handleKeyboardHeight);
    
    // Also listen via window message for compatibility
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'keyboard_height_changed') {
          setKeyboardHeight(data.payload.height);
        }
      } catch (e) {
        // Ignore parse errors
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isNativeApp]);

  return {
    isNativeApp,
    isInWebView: isNativeApp, // Alias for compatibility
    keyboardHeight,
    adjustForKeyboard: () => {}, // No-op since native handles everything
  };
}