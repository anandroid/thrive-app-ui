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

    // Focus the element first
    element.focus();

    // For iOS devices with visual viewport API
    if ('visualViewport' in window && window.visualViewport) {
      setTimeout(() => {
        const viewport = window.visualViewport;
        if (!viewport) return;

        // Get element position
        const rect = element.getBoundingClientRect();
        const elementBottom = rect.bottom;
        const viewportHeight = viewport.height;
        
        // Check if element is below the visible viewport (covered by keyboard)
        if (elementBottom > viewportHeight - 50) {
          // Find the scrollable parent (chat messages container)
          let scrollParent = element.parentElement;
          while (scrollParent && scrollParent.scrollHeight <= scrollParent.clientHeight) {
            scrollParent = scrollParent.parentElement;
          }
          
          if (scrollParent) {
            // Calculate how much to scroll
            const scrollAmount = elementBottom - viewportHeight + 100; // 100px padding
            scrollParent.scrollTop += scrollAmount;
          }
        }
      }, 300); // Delay to allow keyboard to fully appear
    } else {
      // Fallback for Android and other devices
      setTimeout(() => {
        // Use a more compatible approach
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        // If element is in the lower half of the screen, it might be covered by keyboard
        if (rect.bottom > windowHeight * 0.5) {
          // Find scrollable parent
          let scrollParent = element.parentElement;
          while (scrollParent && scrollParent.scrollHeight <= scrollParent.clientHeight) {
            scrollParent = scrollParent.parentElement;
          }
          
          if (scrollParent) {
            // Scroll to bring input into view with some padding
            const targetScroll = scrollParent.scrollTop + (rect.bottom - windowHeight * 0.4);
            scrollParent.scrollTo({
              top: targetScroll,
              behavior: 'smooth'
            });
          }
        }
      }, 300);
    }
  };

  return scrollToInput;
}