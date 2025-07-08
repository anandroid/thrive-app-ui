'use client';

import React, { useEffect, useRef } from 'react';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';

interface KeyboardAvoidingViewProps {
  children: React.ReactNode;
  className?: string;
  behavior?: 'padding' | 'height' | 'position';
  keyboardVerticalOffset?: number;
}

export function KeyboardAvoidingView({
  children,
  className = '',
  behavior = 'padding',
  keyboardVerticalOffset = 0
}: KeyboardAvoidingViewProps) {
  const keyboardHeight = useKeyboardHeight();
  const containerRef = useRef<HTMLDivElement>(null);

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

  return (
    <div
      ref={containerRef}
      className={`transition-all duration-300 ${className}`}
      style={getStyle()}
    >
      {children}
    </div>
  );
}