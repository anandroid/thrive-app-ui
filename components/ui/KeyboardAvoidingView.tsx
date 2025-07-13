'use client';

import React, { useEffect, useRef } from 'react';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';
import { useWebViewKeyboard } from '@/hooks/useWebViewKeyboard';

interface KeyboardAvoidingViewProps {
  children: React.ReactNode;
  className?: string;
  behavior?: 'padding' | 'height' | 'position';
  keyboardVerticalOffset?: number;
  useWebViewDetection?: boolean;
}

export function KeyboardAvoidingView({
  children,
  className = '',
  behavior = 'padding',
  keyboardVerticalOffset = 0,
  useWebViewDetection = true
}: KeyboardAvoidingViewProps) {
  const regularKeyboardHeight = useKeyboardHeight();
  const webViewKeyboard = useWebViewKeyboard();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Use WebView keyboard height if available, otherwise fall back to regular detection
  const keyboardHeight = (useWebViewDetection && webViewKeyboard.isInWebView) 
    ? webViewKeyboard.keyboardHeight 
    : regularKeyboardHeight;

  const getStyle = (): React.CSSProperties => {
    if (!keyboardHeight) return {};

    const offset = keyboardHeight - keyboardVerticalOffset;

    switch (behavior) {
      case 'padding':
        return { paddingBottom: offset };
      case 'height':
        return { height: `calc(100% - ${offset}px)` };
      case 'position':
        return { transform: `translateY(-${offset}px)` };
      default:
        return {};
    }
  };

  useEffect(() => {
    if (keyboardHeight > 0 && containerRef.current) {
      // Ensure active input is visible
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement && activeElement.tagName.match(/input|textarea/i)) {
        setTimeout(() => {
          activeElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }, 100);
      }
    }
  }, [keyboardHeight]);

  // Mark container as keyboard-aware for WebView
  useEffect(() => {
    if (useWebViewDetection && webViewKeyboard.isInWebView && containerRef.current) {
      webViewKeyboard.makeKeyboardAware(containerRef.current);
    }
  }, [useWebViewDetection, webViewKeyboard]);

  return (
    <div
      ref={containerRef}
      className={`transition-all duration-300 ${className}`}
      style={getStyle()}
      data-keyboard-container={useWebViewDetection && webViewKeyboard.isInWebView ? "true" : undefined}
    >
      {children}
    </div>
  );
}