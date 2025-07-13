'use client';

import React, { ReactNode, useEffect } from 'react';
import { useKeyboardAwareLayout } from '@/hooks/useKeyboardAwareLayout';

interface KeyboardAwareLayoutProps {
  children: ReactNode;
}

/**
 * KeyboardAwareLayout Component
 * 
 * Wraps the app to handle keyboard visibility in WebView.
 * When keyboard appears, it shifts main content up while keeping
 * the action bar fixed at the top.
 */
export function KeyboardAwareLayout({ children }: KeyboardAwareLayoutProps) {
  const { keyboardStyle } = useKeyboardAwareLayout();

  // Add keyboard-aware attributes to help CSS targeting
  useEffect(() => {
    // Mark action bars as fixed (should not move)
    document.querySelectorAll('.action-bar').forEach(el => {
      el.setAttribute('data-keyboard-fixed', 'true');
    });

    // Mark main content as shiftable
    document.querySelectorAll('.page-content, main').forEach(el => {
      el.setAttribute('data-keyboard-shift', 'true');
    });
  }, []);

  return (
    <div className="keyboard-aware-wrapper" style={keyboardStyle}>
      {children}
    </div>
  );
}