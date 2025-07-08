import { useEffect } from 'react';
import { useTouchFeedback } from './useTouchFeedback';

export function useGlobalTouchFeedback() {
  const { triggerHaptic } = useTouchFeedback({ hapticStyle: 'light' });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Function to add touch feedback classes to elements
    const addTouchFeedback = () => {
      // Button elements
      const buttons = document.querySelectorAll('button:not(.touch-feedback):not(.touch-feedback-icon):not(.touch-feedback-subtle)');
      buttons.forEach(button => {
        button.classList.add('touch-feedback', 'touch-manipulation');
        
        // Add haptic feedback on touch
        button.addEventListener('touchstart', triggerHaptic, { passive: true });
      });

      // Links with specific patterns
      const actionLinks = document.querySelectorAll('a[href^="/"], a.action-link');
      actionLinks.forEach(link => {
        if (!link.classList.contains('touch-feedback')) {
          link.classList.add('touch-feedback-subtle', 'touch-manipulation');
          link.addEventListener('touchstart', triggerHaptic, { passive: true });
        }
      });

      // Icon buttons (smaller buttons with just icons)
      const iconButtons = document.querySelectorAll('button.icon-button, button[class*="w-8"], button[class*="w-10"], button[class*="w-11"]');
      iconButtons.forEach(button => {
        button.classList.remove('touch-feedback');
        button.classList.add('touch-feedback-icon', 'touch-manipulation');
      });

      // Clickable divs (cards, list items, etc)
      const clickableDivs = document.querySelectorAll('div[onClick], div[class*="cursor-pointer"]');
      clickableDivs.forEach(div => {
        if (!div.classList.contains('touch-feedback') && !div.classList.contains('touch-feedback-list')) {
          div.classList.add('touch-feedback-subtle', 'touch-manipulation');
          div.addEventListener('touchstart', triggerHaptic, { passive: true });
        }
      });

      // Chat bubbles and action items
      const chatElements = document.querySelectorAll('.chat-bubble, .action-item, .suggestion-item');
      chatElements.forEach(element => {
        if (!element.classList.contains('touch-feedback')) {
          element.classList.add('touch-feedback-subtle', 'touch-manipulation');
          element.addEventListener('touchstart', triggerHaptic, { passive: true });
        }
      });

      // Settings menu items
      const menuItems = document.querySelectorAll('[role="menuitem"], .menu-item, .settings-item');
      menuItems.forEach(item => {
        if (!item.classList.contains('touch-feedback-list')) {
          item.classList.add('touch-feedback-list', 'touch-manipulation');
          item.addEventListener('touchstart', triggerHaptic, { passive: true });
        }
      });
    };

    // Initial application
    addTouchFeedback();

    // Create observer to handle dynamically added elements
    const observer = new MutationObserver((mutations) => {
      // Debounce to avoid excessive calls
      const timeoutId = setTimeout(addTouchFeedback, 100);
      return () => clearTimeout(timeoutId);
    });

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Cleanup
    return () => {
      observer.disconnect();
    };
  }, [triggerHaptic]);
}

// Global initializer for non-React contexts
export function initGlobalTouchFeedback() {
  if (typeof window === 'undefined') return;

  // Add global styles
  const style = document.createElement('style');
  style.textContent = `
    /* Ensure all interactive elements have proper cursor */
    button, a, [role="button"], [role="link"], [onclick], .clickable {
      cursor: pointer;
    }
    
    /* Prevent text selection on buttons */
    button, [role="button"] {
      -webkit-user-select: none;
      user-select: none;
    }
    
    /* Ensure proper touch handling on iOS */
    * {
      -webkit-tap-highlight-color: transparent;
    }
  `;
  document.head.appendChild(style);
}