'use client';

import React, { useEffect, useRef } from 'react';
import { useKeyboardAwareChat } from '@/hooks/useKeyboardAwareChat';

interface ChatLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function ChatLayout({ children, className = '' }: ChatLayoutProps) {
  const { keyboardHeight, isKeyboardVisible, scrollAnchorRef } = useKeyboardAwareChat();
  const layoutRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Prevent overscroll on the entire page
    document.body.style.overscrollBehavior = 'none';
    
    return () => {
      document.body.style.overscrollBehavior = '';
    };
  }, []);

  return (
    <div 
      ref={layoutRef}
      className={`fixed inset-0 flex flex-col ${className}`}
      style={{
        height: '100vh',
        maxHeight: '-webkit-fill-available', // iOS Safari fix
      }}
    >
      {children}
      
      {/* Invisible anchor div for keyboard positioning */}
      <div 
        ref={scrollAnchorRef}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '1px',
          height: '1px',
          pointerEvents: 'none',
          opacity: 0,
        }}
        aria-hidden="true"
      />
      
      {/* Keyboard spacer - only on iOS Safari */}
      {isKeyboardVisible && (
        <div 
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: `${keyboardHeight}px`,
            backgroundColor: 'white',
            pointerEvents: 'none',
            zIndex: 999,
          }}
        />
      )}
    </div>
  );
}