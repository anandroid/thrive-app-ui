'use client';

import { useEffect, useRef } from 'react';

export function useKeyboardAwareChat() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

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
        // Simple debounced scroll on viewport change
        setTimeout(() => scrollToBottom(false), 60);
      };

      window.visualViewport!.addEventListener('resize', handleResize);
      return () => window.visualViewport!.removeEventListener('resize', handleResize);
    }
  }, []);

  return {
    messagesEndRef,
    chatContainerRef,
    scrollToBottom
  };
}