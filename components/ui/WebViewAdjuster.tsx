'use client';

import { useEffect } from 'react';
import bridge from '@/src/lib/react-native-bridge';

/**
 * Component that adjusts the viewport for WebView environments
 * Handles keyboard appearance by monitoring viewport changes
 */
export function WebViewAdjuster({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!bridge.isInReactNative()) return;

    let resizeTimeout: NodeJS.Timeout;
    let lastHeight = window.innerHeight;
    
    const adjustForKeyboard = () => {
      const currentHeight = window.innerHeight;
      const heightDiff = lastHeight - currentHeight;
      
      // Detect significant height change (keyboard appearing/disappearing)
      if (Math.abs(heightDiff) > 100) {
        // Find all elements that use viewport height
        const viewportElements = document.querySelectorAll('[class*="h-screen"], [class*="h-\\[100vh\\]"], [class*="h-\\[100dvh\\]"]');
        
        viewportElements.forEach((element) => {
          if (element instanceof HTMLElement) {
            if (heightDiff > 100) {
              // Keyboard appeared - set fixed height
              element.style.height = `${currentHeight}px`;
              element.setAttribute('data-keyboard-adjusted', 'true');
            } else {
              // Keyboard disappeared - restore viewport height
              element.style.height = '';
              element.removeAttribute('data-keyboard-adjusted');
            }
          }
        });
        
        // Also adjust any chat containers
        const chatContainer = document.querySelector('.chat-container');
        if (chatContainer instanceof HTMLElement) {
          if (heightDiff > 100) {
            chatContainer.style.height = `${currentHeight}px`;
            chatContainer.setAttribute('data-keyboard-visible', 'true');
          } else {
            chatContainer.style.height = '';
            chatContainer.setAttribute('data-keyboard-visible', 'false');
          }
        }
        
        lastHeight = currentHeight;
      }
    };

    // Monitor viewport changes
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(adjustForKeyboard, 100);
    };

    // Also monitor focus changes as a backup
    const handleFocus = (e: FocusEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        setTimeout(adjustForKeyboard, 400); // Wait for keyboard animation
      }
    };

    const handleBlur = () => {
      setTimeout(adjustForKeyboard, 400);
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);

    // Initial adjustment
    adjustForKeyboard();

    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
    };
  }, []);

  return <>{children}</>;
}