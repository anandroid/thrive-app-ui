import { useEffect, useState, useCallback } from 'react';
import bridge from '@/src/lib/react-native-bridge';

/**
 * Hook that listens for keyboard height changes from React Native
 * This provides accurate keyboard height information when running in WebView
 */
export function useNativeKeyboard() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const isInWebView = bridge.isInReactNative();

  useEffect(() => {
    if (!isInWebView) return;

    // Listen for keyboard height messages from React Native
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        if (data.type === 'keyboard_height_changed') {
          const { height, visible } = data.payload;
          setKeyboardHeight(height || 0);
          setIsKeyboardVisible(visible || false);
          
          // Update chat container height to account for keyboard
          const chatContainer = document.querySelector('.chat-container') as HTMLElement;
          if (chatContainer) {
            if (visible && height > 0) {
              // When keyboard is visible, reduce container height
              const windowHeight = window.innerHeight;
              const newHeight = windowHeight - height;
              chatContainer.style.height = `${newHeight}px`;
              chatContainer.setAttribute('data-keyboard-visible', 'true');
              
              // Also update the messages area to ensure proper scrolling
              const messagesArea = chatContainer.querySelector('.chat-messages') as HTMLElement;
              if (messagesArea) {
                // Force a reflow to ensure proper height calculation
                messagesArea.style.paddingBottom = '1rem';
              }
            } else {
              // When keyboard is hidden, restore full height
              chatContainer.style.height = '';
              chatContainer.setAttribute('data-keyboard-visible', 'false');
            }
          }
          
          // Ensure input stays visible
          if (visible) {
            setTimeout(() => {
              const activeElement = document.activeElement;
              if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
                activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                
                // Also scroll messages to bottom
                const messagesContainer = document.querySelector('.chat-messages');
                if (messagesContainer) {
                  messagesContainer.scrollTop = messagesContainer.scrollHeight;
                }
              }
            }, 100);
          }
        }
      } catch (error) {
        // Ignore non-JSON messages
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Also set up bridge message handler
    bridge.onMessage('keyboard_height_changed', (payload) => {
      const { height, visible } = payload as { height: number; visible: boolean };
      setKeyboardHeight(height || 0);
      setIsKeyboardVisible(visible || false);
    });

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [isInWebView]);

  const adjustForKeyboard = useCallback((element: HTMLElement | null) => {
    if (!element || !isKeyboardVisible || keyboardHeight === 0) return;
    
    // Ensure the element stays visible above keyboard
    setTimeout(() => {
      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const elementBottom = rect.bottom;
      
      // If element would be covered by keyboard
      if (elementBottom > windowHeight - keyboardHeight) {
        const scrollAmount = elementBottom - (windowHeight - keyboardHeight) + 20; // 20px padding
        
        // Find scrollable parent
        let scrollParent = element.parentElement;
        while (scrollParent && scrollParent.scrollHeight <= scrollParent.clientHeight) {
          scrollParent = scrollParent.parentElement;
        }
        
        if (scrollParent) {
          scrollParent.scrollBy({ top: scrollAmount, behavior: 'smooth' });
        }
      }
    }, 300);
  }, [isKeyboardVisible, keyboardHeight]);

  return {
    keyboardHeight,
    isKeyboardVisible,
    adjustForKeyboard,
    isInWebView
  };
}