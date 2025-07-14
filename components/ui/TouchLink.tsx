'use client';

import React from 'react';
import Link from 'next/link';
import { useTouchFeedback } from '@/hooks/useTouchFeedback';
import { cn } from '@/lib/utils';

interface TouchLinkProps extends Omit<React.ComponentProps<typeof Link>, 'className'> {
  className?: string;
  haptic?: 'light' | 'medium' | 'heavy';
  variant?: 'default' | 'subtle' | 'icon' | 'button' | 'card';
  shadow?: boolean | 'sm' | 'md' | 'lg' | 'xl';
  scale?: number;
  gradient?: boolean;
  cardGlow?: boolean;
  hoverScale?: number;
  nativePress?: boolean;
  children: React.ReactNode;
}

export function TouchLink({
  className = '',
  haptic = 'light',
  variant = 'default',
  shadow = false,
  scale,
  gradient = false,
  cardGlow = false,
  hoverScale,
  nativePress = false,
  children,
  onClick,
  ...props
}: TouchLinkProps) {
  const { touchHandlers, triggerHaptic } = useTouchFeedback({ 
    hapticStyle: haptic,
    preventDoubleTap: true,
    scale: scale || (variant === 'icon' ? 0.85 : 0.98)
  });

  const variantClasses = {
    default: 'touch-feedback',
    subtle: 'touch-feedback-subtle',
    icon: 'touch-feedback-icon',
    button: 'touch-feedback native-press',
    card: 'touch-feedback card-soft-glow'
  };

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Trigger haptic on click for non-touch devices
    triggerHaptic();
    
    // Call original onClick if provided
    if (onClick) {
      onClick(e);
    }
  };

  const combinedClasses = cn(
    // Base classes
    'transition-all cursor-pointer',
    'native-transition',
    
    // Variant classes
    variantClasses[variant],
    'touch-manipulation',
    
    // Shadow
    shadow && (typeof shadow === 'boolean' 
      ? 'shadow-md hover:shadow-lg'
      : shadow === 'sm' ? 'shadow-sm hover:shadow-md'
      : shadow === 'lg' ? 'shadow-lg hover:shadow-xl'
      : shadow === 'xl' ? 'shadow-xl hover:shadow-2xl'
      : 'shadow-md hover:shadow-lg'
    ),
    
    // Gradient overlay capability
    gradient && 'relative overflow-hidden',
    
    // Custom scale
    scale && `active:scale-[${scale}]`,
    
    // Card glow effect
    (cardGlow || variant === 'button' || variant === 'card') && 'card-soft-glow',
    
    // Native press
    nativePress && 'native-press',
    
    // Hover scale
    hoverScale && `hover:scale-[${hoverScale}]`,
    
    // Custom classes
    className
  );

  return (
    <Link
      className={combinedClasses}
      onClick={handleClick}
      {...touchHandlers}
      {...props}
    >
      {gradient && (
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
      )}
      {children}
    </Link>
  );
}