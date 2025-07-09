'use client';

import { useEffect, useRef } from 'react';

export function useKeyboardAwareChat() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when keyboard appears or new messages
  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end'
      });
    }
  };

  // Optional: Use visualViewport API for enhanced experience
  useEffect(() => {
    if (typeof window !== 'undefined' && 'visualViewport' in window) {
      const handleViewportChange = () => {
        // When keyboard appears, the viewport height decreases
        if (chatContainerRef.current) {
          const isKeyboardVisible = window.visualViewport!.height < window.innerHeight * 0.75;
          chatContainerRef.current.setAttribute('data-keyboard-visible', isKeyboardVisible.toString());
          
          // Scroll to bottom when keyboard appears
          if (isKeyboardVisible) {
            setTimeout(() => scrollToBottom(false), 100);
          }
        }
      };

      window.visualViewport!.addEventListener('resize', handleViewportChange);
      
      return () => {
        window.visualViewport!.removeEventListener('resize', handleViewportChange);
      };
    }
  }, []);

  return {
    messagesEndRef,
    chatContainerRef,
    scrollToBottom
  };
}