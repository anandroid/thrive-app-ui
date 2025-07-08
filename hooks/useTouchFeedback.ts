import { useCallback, useEffect } from 'react';

interface TouchFeedbackOptions {
  hapticStyle?: 'light' | 'medium' | 'heavy';
  preventDoubleTap?: boolean;
  scale?: number;
}

export function useTouchFeedback(options: TouchFeedbackOptions = {}) {
  const { 
    hapticStyle = 'light', 
    preventDoubleTap = true,
    scale = 0.97 
  } = options;

  // Trigger haptic feedback if available
  const triggerHaptic = useCallback(() => {
    if ('vibrate' in navigator) {
      // Different vibration patterns for different styles
      const patterns = {
        light: 10,
        medium: 20,
        heavy: 30
      };
      
      try {
        navigator.vibrate(patterns[hapticStyle]);
      } catch (e) {
        // Silently fail if vibration is not supported
      }
    }

    // iOS-specific haptic feedback
    if ('Haptics' in window && (window as any).Haptics) {
      try {
        const haptics = (window as any).Haptics;
        switch (hapticStyle) {
          case 'light':
            haptics.impact({ style: 'light' });
            break;
          case 'medium':
            haptics.impact({ style: 'medium' });
            break;
          case 'heavy':
            haptics.impact({ style: 'heavy' });
            break;
        }
      } catch (e) {
        // Silently fail
      }
    }
  }, [hapticStyle]);

  // Prevent double tap zoom on iOS
  useEffect(() => {
    if (!preventDoubleTap) return;

    const preventDoubleTapZoom = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'BUTTON' || 
          target.tagName === 'A' || 
          target.closest('button') || 
          target.closest('a')) {
        e.preventDefault();
      }
    };

    let lastTouchEnd = 0;
    const handleTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        preventDoubleTapZoom(e);
      }
      lastTouchEnd = now;
    };

    document.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    return () => {
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [preventDoubleTap]);

  const touchHandlers = {
    onTouchStart: triggerHaptic,
    style: {
      WebkitTapHighlightColor: 'transparent',
      touchAction: 'manipulation'
    }
  };

  return { touchHandlers, triggerHaptic };
}

// Utility function to add touch classes
export function getTouchClasses(
  baseClasses: string,
  options: {
    feedback?: boolean;
    ripple?: boolean;
    nativePress?: boolean;
  } = {}
) {
  const { feedback = true, ripple = false, nativePress = false } = options;
  
  const classes = [baseClasses];
  
  if (feedback) classes.push('touch-feedback');
  if (ripple) classes.push('touch-ripple');
  if (nativePress) classes.push('native-press');
  
  classes.push('touch-manipulation');
  
  return classes.join(' ');
}