'use client';

import { useEffect, useRef } from 'react';

export function useKeyboardAwareChat() {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when needed
  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end'
      });
    }
  };

  // Optional: Auto-scroll when visualViewport changes
  useEffect(() => {
    if (typeof window !== 'undefined' && 'visualViewport' in window) {
      const handleResize = () => {
        // Debug logging for Android WebView issues
        console.log('=== Viewport Resize Event ===');
        console.log('Viewport height:', window.visualViewport!.height);
        console.log('Window height:', window.innerHeight);
        console.log('Document height:', document.documentElement.clientHeight);
        console.log('Keyboard visible:', window.innerHeight > window.visualViewport!.height);
        
        // Simple debounced scroll on viewport change
        setTimeout(() => scrollToBottom(false), 60);
      };

      window.visualViewport!.addEventListener('resize', handleResize);
      
      // Also log initial state
      console.log('=== Initial Viewport State ===');
      console.log('Initial viewport height:', window.visualViewport!.height);
      console.log('Initial window height:', window.innerHeight);
      
      return () => window.visualViewport!.removeEventListener('resize', handleResize);
    }
  }, []);

  return {
    messagesEndRef,
    scrollToBottom
  };
}