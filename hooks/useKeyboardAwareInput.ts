import { useCallback } from 'react';
import { useWebViewKeyboard } from './useWebViewKeyboard';
import { useScrollToInput } from './useKeyboardHeight';

/**
 * Hook to handle keyboard-aware input focus across all environments
 * Works in both regular browsers and WebView
 */
export function useKeyboardAwareInput() {
  const webViewKeyboard = useWebViewKeyboard();
  const regularScrollToInput = useScrollToInput();
  
  const handleInputFocus = useCallback((element: HTMLElement | null) => {
    if (!element) return;
    
    // Use WebView keyboard handling if available
    if (webViewKeyboard.isInWebView) {
      webViewKeyboard.scrollToInput(element);
    } else {
      // Fall back to regular keyboard handling
      regularScrollToInput(element);
    }
  }, [webViewKeyboard, regularScrollToInput]);
  
  const handleFocus = useCallback((event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    handleInputFocus(event.target);
  }, [handleInputFocus]);
  
  return {
    handleInputFocus,
    handleFocus,
    isInWebView: webViewKeyboard.isInWebView,
    keyboardHeight: webViewKeyboard.keyboardHeight,
    isKeyboardVisible: webViewKeyboard.isKeyboardVisible
  };
}