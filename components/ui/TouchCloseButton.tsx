'use client';

import React from 'react';
import { X } from 'lucide-react';
import { useTouchFeedback } from '@/hooks/useTouchFeedback';

interface TouchCloseButtonProps {
  onClose: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'dark' | 'light';
}

export function TouchCloseButton({ 
  onClose, 
  className = '', 
  size = 'md',
  variant = 'default'
}: TouchCloseButtonProps) {
  
  const { touchHandlers, triggerHaptic } = useTouchFeedback({ 
    hapticStyle: 'medium',
    preventDoubleTap: true,
    scale: 0.93
  });
  
  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Trigger haptic feedback
    triggerHaptic();
    
    onClose();
  };

  const sizeClasses = {
    sm: 'min-w-[40px] min-h-[40px] w-10 h-10',
    md: 'min-w-[44px] min-h-[44px] w-11 h-11', 
    lg: 'min-w-[48px] min-h-[48px] w-12 h-12'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const variantClasses = {
    default: 'bg-white/80 hover:bg-white border border-gray-200/50 text-gray-600 hover:text-gray-800',
    dark: 'bg-gray-800/80 hover:bg-gray-800 border border-gray-700/50 text-gray-300 hover:text-white',
    light: 'bg-white/90 hover:bg-white border border-white/20 text-gray-500 hover:text-gray-700'
  };

  return (
    <button
      onClick={handleClose}
      {...touchHandlers}
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        rounded-full 
        flex items-center justify-center 
        shadow-lg hover:shadow-xl 
        backdrop-blur-sm
        transition-all duration-200 ease-out
        touch-feedback-spring
        hover:scale-105
        touch-manipulation
        focus:outline-none focus:ring-2 focus:ring-rose/20
        transform-gpu
        ${className}
      `}
      style={{
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation'
      }}
      aria-label="Close modal"
      type="button"
    >
      <X className={`${iconSizes[size]} transition-transform duration-200 group-active:scale-90`} />
    </button>
  );
}