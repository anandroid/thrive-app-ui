import { useEffect, useState, useCallback, useRef } from 'react';
import bridge from '@/src/lib/react-native-bridge';

/**
 * Enhanced keyboard detection for WebView environments
 * Handles keyboard height detection and viewport adjustments specifically for React Native WebView
 */
export function useWebViewKeyboard() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const isInWebView = bridge.isInReactNative();
  
  // Store initial viewport height
  const initialHeight = useRef(window.innerHeight);
  const lastKnownHeight = useRef(window.innerHeight);
  const focusedElement = useRef<HTMLElement | null>(null);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  // More reliable keyboard detection
  const detectKeyboard = useCallback(() => {
    const currentHeight = window.innerHeight;
    const threshold = 50; // Minimum height change to consider as keyboard
    
    // Calculate keyboard height based on initial viewport
    const heightDiff = initialHeight.current - currentHeight;
    
    if (heightDiff > threshold) {
      // Keyboard is showing
      setKeyboardHeight(heightDiff);
      setIsKeyboardVisible(true);
      setViewportHeight(currentHeight);
      
      // Update all keyboard-aware containers
      document.querySelectorAll('[data-keyboard-container]').forEach(container => {
        const element = container as HTMLElement;
        element.style.height = `${currentHeight}px`;
        element.setAttribute('data-keyboard-visible', 'true');
      });
      
      // Special handling for chat containers
      const chatContainer = document.querySelector('.chat-container') as HTMLElement;
      if (chatContainer) {
        chatContainer.style.height = `${currentHeight}px`;
        chatContainer.setAttribute('data-keyboard-visible', 'true');
        
        // Ensure input area stays at bottom
        const inputArea = chatContainer.querySelector('.chat-input-area') as HTMLElement;
        if (inputArea) {
          inputArea.style.position = 'absolute';
          inputArea.style.bottom = '0';
          inputArea.style.left = '0';
          inputArea.style.right = '0';
          inputArea.style.transform = 'translateY(0)';
        }
      }
    } else if (currentHeight >= initialHeight.current - threshold) {
      // Keyboard is hidden
      setKeyboardHeight(0);
      setIsKeyboardVisible(false);
      setViewportHeight(initialHeight.current);
      
      // Reset container heights
      document.querySelectorAll('[data-keyboard-container]').forEach(container => {
        const element = container as HTMLElement;
        element.style.height = '';
        element.setAttribute('data-keyboard-visible', 'false');
      });
      
      // Reset chat container
      const chatContainer = document.querySelector('.chat-container') as HTMLElement;
      if (chatContainer) {
        chatContainer.style.height = '';
        chatContainer.setAttribute('data-keyboard-visible', 'false');
        
        const inputArea = chatContainer.querySelector('.chat-input-area') as HTMLElement;
        if (inputArea) {
          inputArea.style.position = '';
          inputArea.style.bottom = '';
          inputArea.style.transform = '';
        }
      }
    }
    
    lastKnownHeight.current = currentHeight;
  }, []);

  // Enhanced scroll handling for focused elements
  const scrollToInput = useCallback((element: HTMLElement | null, forceScroll = false) => {
    if (!element || (!isKeyboardVisible && !forceScroll)) return;

    // Store focused element
    focusedElement.current = element;

    // Use requestAnimationFrame for smoother scrolling
    requestAnimationFrame(() => {
      const chatMessages = document.querySelector('.chat-messages');
      const chatContainer = document.querySelector('.chat-container');
      
      if (chatMessages && chatContainer) {
        // Calculate available space
        const containerRect = chatContainer.getBoundingClientRect();
        const inputRect = element.getBoundingClientRect();
        const keyboardTop = window.innerHeight - keyboardHeight;
        
        // If input would be covered by keyboard
        if (inputRect.bottom > keyboardTop) {
          // Scroll messages to make room
          const scrollAmount = inputRect.bottom - keyboardTop + 20; // 20px padding
          chatMessages.scrollTop += scrollAmount;
        }
        
        // Ensure we're scrolled to bottom for chat
        setTimeout(() => {
          chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 100);
      } else {
        // Fallback to standard scroll
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
      }
    });
  }, [isKeyboardVisible, keyboardHeight]);

  // Handle focus events
  const handleFocus = useCallback((e: FocusEvent) => {
    const target = e.target as HTMLElement;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      focusedElement.current = target;
      
      // Immediately check for keyboard
      setTimeout(() => {
        detectKeyboard();
        scrollToInput(target, true);
      }, 100);
      
      // Check again after typical keyboard animation
      setTimeout(() => {
        detectKeyboard();
        scrollToInput(target, true);
      }, 300);
    }
  }, [detectKeyboard, scrollToInput]);

  // Handle blur events
  const handleBlur = useCallback(() => {
    focusedElement.current = null;
    
    // Check for keyboard dismissal
    setTimeout(() => {
      detectKeyboard();
    }, 300);
  }, [detectKeyboard]);

  // WebView-specific setup
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Store initial height
    initialHeight.current = window.innerHeight;
    lastKnownHeight.current = window.innerHeight;

    if (isInWebView) {
      // For WebView, use polling as primary method
      pollingInterval.current = setInterval(detectKeyboard, 100);
      
      // Also listen for resize events
      const handleResize = () => {
        detectKeyboard();
      };
      
      window.addEventListener('resize', handleResize);
      
      // Listen for orientation changes
      const handleOrientation = () => {
        setTimeout(() => {
          initialHeight.current = window.innerHeight;
          detectKeyboard();
        }, 500);
      };
      
      window.addEventListener('orientationchange', handleOrientation);
      
      // Listen for keyboard events from React Native
      const handleNativeKeyboardMessage = (event: MessageEvent) => {
        try {
          const data = event.data;
          if (data && typeof data === 'object' && data.type === 'keyboard_height_changed') {
            const { height, visible } = data.payload;
            setKeyboardHeight(height || 0);
            setIsKeyboardVisible(visible || false);
            setViewportHeight(window.innerHeight - (height || 0));
            
            // Update containers immediately
            detectKeyboard();
          }
        } catch (error) {
          console.error('[useWebViewKeyboard] Error handling native message:', error);
        }
      };
      
      window.addEventListener('message', handleNativeKeyboardMessage);
      
      return () => {
        if (pollingInterval.current) {
          clearInterval(pollingInterval.current);
        }
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleOrientation);
        window.removeEventListener('message', handleNativeKeyboardMessage);
      };
    } else {
      // For regular browsers, use visualViewport if available
      if (window.visualViewport) {
        const handleViewportChange = () => {
          const vv = window.visualViewport;
          if (vv) {
            const keyboardH = window.innerHeight - vv.height;
            setKeyboardHeight(keyboardH);
            setIsKeyboardVisible(keyboardH > 50);
            setViewportHeight(vv.height);
          }
        };
        
        window.visualViewport.addEventListener('resize', handleViewportChange);
        window.visualViewport.addEventListener('scroll', handleViewportChange);
        
        return () => {
          if (window.visualViewport) {
            window.visualViewport.removeEventListener('resize', handleViewportChange);
            window.visualViewport.removeEventListener('scroll', handleViewportChange);
          }
        };
      }
    }
  }, [isInWebView, detectKeyboard]);

  // Focus/blur event listeners
  useEffect(() => {
    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);
    
    // For iOS, also listen to these events
    document.addEventListener('focus', handleFocus as any, true);
    document.addEventListener('blur', handleBlur as any, true);
    
    return () => {
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
      document.removeEventListener('focus', handleFocus as any, true);
      document.removeEventListener('blur', handleBlur as any, true);
    };
  }, [handleFocus, handleBlur]);

  return {
    keyboardHeight,
    isKeyboardVisible,
    viewportHeight,
    scrollToInput,
    isInWebView,
    // Utility function to mark containers as keyboard-aware
    makeKeyboardAware: (element: HTMLElement | null) => {
      if (element) {
        element.setAttribute('data-keyboard-container', 'true');
        if (isKeyboardVisible) {
          element.style.height = `${viewportHeight}px`;
          element.setAttribute('data-keyboard-visible', 'true');
        }
      }
    }
  };
}