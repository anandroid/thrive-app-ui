import { useEffect, useRef, useState } from 'react';

interface UseKeyboardAwareChatOptions {
  onKeyboardShow?: () => void;
  onKeyboardHide?: () => void;
}

export function useKeyboardAwareChat(options: UseKeyboardAwareChatOptions = {}) {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);
  const previousScrollTop = useRef(0);
  const visualViewportSupported = typeof window !== 'undefined' && 'visualViewport' in window;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let rafId: number;
    let lastHeight = window.innerHeight;

    const handleViewportChange = () => {
      if (rafId) cancelAnimationFrame(rafId);

      rafId = requestAnimationFrame(() => {
        if (!window.visualViewport) return;

        const viewport = window.visualViewport;
        const hasKeyboard = window.innerHeight - viewport.height > 50;
        const keyboardHeight = hasKeyboard ? window.innerHeight - viewport.height : 0;

        setKeyboardHeight(keyboardHeight);
        setIsKeyboardVisible(hasKeyboard);

        if (hasKeyboard) {
          // Store current scroll position
          previousScrollTop.current = window.scrollY;
          
          // Scroll the anchor into view to push content above keyboard
          if (scrollAnchorRef.current) {
            // Use a small delay to ensure DOM updates have completed
            setTimeout(() => {
              scrollAnchorRef.current?.scrollIntoView({ 
                behavior: 'instant',
                block: 'end' 
              });
            }, 0);
          }

          options.onKeyboardShow?.();
        } else {
          // Restore scroll position when keyboard hides
          window.scrollTo(0, previousScrollTop.current);
          options.onKeyboardHide?.();
        }
      });
    };

    // iOS Safari specific handling
    if (visualViewportSupported && window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      window.visualViewport.addEventListener('scroll', handleViewportChange);
    } else {
      // Fallback for older browsers
      const handleResize = () => {
        const currentHeight = window.innerHeight;
        if (Math.abs(currentHeight - lastHeight) > 50) {
          const hasKeyboard = currentHeight < lastHeight;
          setIsKeyboardVisible(hasKeyboard);
          setKeyboardHeight(hasKeyboard ? lastHeight - currentHeight : 0);
          
          if (hasKeyboard) {
            options.onKeyboardShow?.();
          } else {
            options.onKeyboardHide?.();
          }
          
          lastHeight = currentHeight;
        }
      };

      window.addEventListener('resize', handleResize);
      
      // Also listen for focus/blur on inputs
      const handleFocus = () => {
        setTimeout(handleResize, 300);
      };
      
      const handleBlur = () => {
        setTimeout(handleResize, 300);
      };

      document.addEventListener('focusin', handleFocus);
      document.addEventListener('focusout', handleBlur);

      return () => {
        window.removeEventListener('resize', handleResize);
        document.removeEventListener('focusin', handleFocus);
        document.removeEventListener('focusout', handleBlur);
      };
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (visualViewportSupported && window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
        window.visualViewport.removeEventListener('scroll', handleViewportChange);
      }
    };
  }, [options]);

  return {
    keyboardHeight,
    isKeyboardVisible,
    scrollAnchorRef
  };
}