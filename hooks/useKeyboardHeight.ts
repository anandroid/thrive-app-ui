import { useEffect, useState } from 'react';

export function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // For iOS devices with visual viewport API
    if ('visualViewport' in window && window.visualViewport) {
      const handleViewportChange = () => {
        const viewport = window.visualViewport;
        if (!viewport) return;

        const hasKeyboard = window.innerHeight - viewport.height > 50;
        setKeyboardHeight(hasKeyboard ? window.innerHeight - viewport.height : 0);
      };

      window.visualViewport.addEventListener('resize', handleViewportChange);
      window.visualViewport.addEventListener('scroll', handleViewportChange);

      return () => {
        window.visualViewport?.removeEventListener('resize', handleViewportChange);
        window.visualViewport?.removeEventListener('scroll', handleViewportChange);
      };
    } else {
      // Fallback for Android and other devices
      const handleResize = () => {
        // On mobile, window resize usually means keyboard appearing/disappearing
        const viewportHeight = window.innerHeight;
        const documentHeight = document.documentElement.clientHeight;
        
        if (viewportHeight < documentHeight * 0.75) {
          // Keyboard is likely visible
          setKeyboardHeight(documentHeight - viewportHeight);
        } else {
          setKeyboardHeight(0);
        }
      };

      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);

  return keyboardHeight;
}

export function useScrollToInput() {
  const scrollToInput = (element: HTMLElement | null) => {
    if (!element) return;

    // Don't use scrollIntoView as it scrolls the entire page including header
    // Instead, just ensure the input has focus which will trigger
    // the browser's built-in behavior to show the input above keyboard
    setTimeout(() => {
      element.focus();
    }, 100);
  };

  return scrollToInput;
}