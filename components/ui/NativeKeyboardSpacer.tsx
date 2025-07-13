'use client';

import React from 'react';
import { useNativeKeyboard } from '@/hooks/useNativeKeyboard';

interface NativeKeyboardSpacerProps {
  pageType: 'home' | 'chat' | 'other';
  minHeight?: number;
  maxHeight?: number;
}

export function NativeKeyboardSpacer({ 
  pageType, 
  minHeight = 0, 
  maxHeight = 300 
}: NativeKeyboardSpacerProps) {
  const { isNativeApp, keyboardHeight } = useNativeKeyboard();

  if (!isNativeApp || keyboardHeight === 0) return null;

  // Different spacing logic for different pages
  let spacerHeight = 0;
  
  if (pageType === 'chat') {
    // For chat: minimal spacing to prevent input going too high
    spacerHeight = Math.min(20, keyboardHeight * 0.1);
  } else if (pageType === 'home') {
    // For home: no spacer needed, scrolling will handle it
    spacerHeight = 0;
  } else {
    // Default: proportional spacing
    spacerHeight = keyboardHeight * 0.3;
  }

  // Apply min/max constraints
  spacerHeight = Math.max(minHeight, Math.min(maxHeight, spacerHeight));

  return (
    <div 
      className="webview-keyboard-spacer transition-all duration-300 ease-out"
      style={{ height: `${spacerHeight}px` }}
      aria-hidden="true"
    />
  );
}