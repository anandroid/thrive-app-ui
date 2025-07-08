import { useEffect, useRef, useState } from 'react';

export function useChatKeyboardFix() {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastScrollPositionRef = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let rafId: number;
    const visualViewportSupported = 'visualViewport' in window;

    // iOS Safari specific handling using visualViewport
    if (visualViewportSupported && window.visualViewport) {
      const handleViewportChange = () => {
        if (rafId) cancelAnimationFrame(rafId);

        rafId = requestAnimationFrame(() => {
          const viewport = window.visualViewport!;
          const hasKeyboard = window.innerHeight - viewport.height > 50;
          
          setIsKeyboardVisible(hasKeyboard);
          setKeyboardHeight(hasKeyboard ? window.innerHeight - viewport.height : 0);

          // For iOS Safari, we need to handle the scroll position
          if (hasKeyboard) {
            // Store current scroll position
            lastScrollPositionRef.current = window.pageYOffset;
            
            // Ensure the input is visible by scrolling the viewport
            const activeElement = document.activeElement as HTMLElement;
            if (activeElement && activeElement.tagName.match(/input|textarea/i)) {
              // Clear any pending scroll
              if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
              }

              // Delay to ensure keyboard is fully shown
              scrollTimeoutRef.current = setTimeout(() => {
                const rect = activeElement.getBoundingClientRect();
                const viewportHeight = viewport.height;
                
                // If element is below the viewport (covered by keyboard)
                if (rect.bottom > viewportHeight - 50) {
                  // Calculate scroll needed to show the input
                  const scrollBy = rect.bottom - viewportHeight + 100;
                  window.scrollBy({
                    top: scrollBy,
                    behavior: 'smooth'
                  });
                }
              }, 100);
            }
          }
        });
      };

      window.visualViewport.addEventListener('resize', handleViewportChange);
      window.visualViewport.addEventListener('scroll', handleViewportChange);

      return () => {
        if (rafId) cancelAnimationFrame(rafId);
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        window.visualViewport?.removeEventListener('resize', handleViewportChange);
        window.visualViewport?.removeEventListener('scroll', handleViewportChange);
      };
    } else {
      // Fallback for browsers without visualViewport
      let lastHeight = window.innerHeight;

      const handleResize = () => {
        const currentHeight = window.innerHeight;
        const heightDiff = lastHeight - currentHeight;
        
        if (Math.abs(heightDiff) > 50) {
          const hasKeyboard = currentHeight < lastHeight;
          setIsKeyboardVisible(hasKeyboard);
          setKeyboardHeight(hasKeyboard ? heightDiff : 0);
          lastHeight = currentHeight;
        }
      };

      // Also listen for focus events as additional triggers
      const handleFocus = (e: FocusEvent) => {
        const target = e.target as HTMLElement;
        if (target.tagName.match(/input|textarea/i)) {
          setTimeout(handleResize, 300);
        }
      };

      const handleBlur = () => {
        setTimeout(handleResize, 300);
      };

      window.addEventListener('resize', handleResize);
      document.addEventListener('focusin', handleFocus);
      document.addEventListener('focusout', handleBlur);

      return () => {
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        window.removeEventListener('resize', handleResize);
        document.removeEventListener('focusin', handleFocus);
        document.removeEventListener('focusout', handleBlur);
      };
    }
  }, []);

  return {
    isKeyboardVisible,
    keyboardHeight,
    // Helper to add to container style
    containerStyle: {
      paddingBottom: isKeyboardVisible ? `${keyboardHeight}px` : '0'
    }
  };
}