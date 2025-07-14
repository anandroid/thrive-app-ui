'use client';

import React, { forwardRef } from 'react';
import { useTouchFeedback } from '@/hooks/useTouchFeedback';
import { cn } from '@/lib/utils';

interface TouchableProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
  haptic?: 'light' | 'medium' | 'heavy';
  variant?: 'default' | 'subtle' | 'icon' | 'card' | 'gradient';
  gradient?: {
    from: string;
    to: string;
    hoverFrom?: string;
    hoverTo?: string;
  };
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hoverShadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  scale?: number;
  ripple?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}

const shadowClasses = {
  none: '',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl'
};

const variantDefaults = {
  default: {
    shadow: 'md' as const,
    hoverShadow: 'lg' as const,
    scale: 0.98
  },
  subtle: {
    shadow: 'sm' as const,
    hoverShadow: 'md' as const,
    scale: 0.99
  },
  icon: {
    shadow: 'none' as const,
    hoverShadow: 'none' as const,
    scale: 0.85
  },
  card: {
    shadow: 'md' as const,
    hoverShadow: 'lg' as const,
    scale: 0.995
  },
  gradient: {
    shadow: 'lg' as const,
    hoverShadow: 'xl' as const,
    scale: 0.98
  }
};

export const Touchable = forwardRef<HTMLDivElement, TouchableProps>(({
  as: Component = 'div',
  haptic = 'medium',
  variant = 'default',
  gradient,
  shadow,
  hoverShadow,
  scale,
  ripple = false,
  disabled = false,
  className = '',
  children,
  onClick,
  ...props
}, ref) => {
  const { touchHandlers, triggerHaptic } = useTouchFeedback({ 
    hapticStyle: haptic,
    preventDoubleTap: true,
    scale: scale || variantDefaults[variant].scale
  });

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    
    // Trigger haptic on click for non-touch devices
    triggerHaptic();
    
    if (onClick) {
      onClick(e);
    }
  };

  // Get default values from variant
  const defaultShadow = shadow || variantDefaults[variant].shadow;
  const defaultHoverShadow = hoverShadow || variantDefaults[variant].hoverShadow;

  // Build gradient classes
  const gradientClasses = gradient ? 
    `bg-gradient-to-r from-${gradient.from} to-${gradient.to} ${
      gradient.hoverFrom ? `hover:from-${gradient.hoverFrom}` : ''
    } ${
      gradient.hoverTo ? `hover:to-${gradient.hoverTo}` : ''
    }` : '';

  // Build scale class
  const scaleValue = scale || variantDefaults[variant].scale;
  const scaleClass = `active:scale-[${scaleValue}]`;

  // Get touch variant class
  const touchVariantClass = {
    default: 'touch-feedback',
    subtle: 'touch-feedback-subtle',
    icon: 'touch-feedback-icon',
    card: 'touch-feedback-list',
    gradient: 'touch-feedback'
  }[variant];

  const combinedClasses = cn(
    // Base classes
    'transition-all cursor-pointer relative overflow-hidden',
    
    // Touch classes
    touchVariantClass,
    'touch-manipulation',
    
    // Shadow classes
    shadowClasses[defaultShadow],
    defaultHoverShadow !== defaultShadow && `hover:${shadowClasses[defaultHoverShadow]}`,
    
    // Scale class
    scaleClass,
    
    // Gradient classes
    gradientClasses,
    
    // Ripple effect
    ripple && 'touch-ripple',
    
    // Disabled state
    disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
    
    // Custom classes
    className
  );

  return (
    <Component
      ref={ref}
      className={combinedClasses}
      onClick={handleClick}
      {...touchHandlers}
      {...props}
    >
      {/* Gradient overlay for hover effects */}
      {variant === 'gradient' && (
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
      )}
      
      {children}
    </Component>
  );
});

Touchable.displayName = 'Touchable';

// Pre-configured TouchableButton
export const TouchableButton = forwardRef<HTMLButtonElement, TouchableProps & React.ButtonHTMLAttributes<HTMLButtonElement>>(
  (props, ref) => {
    return <Touchable as="button" ref={ref as React.Ref<HTMLDivElement>} {...props} />;
  }
);

TouchableButton.displayName = 'TouchableButton';

// Pre-configured TouchableLink for Next.js Link compatibility
export const TouchableLink = forwardRef<HTMLAnchorElement, TouchableProps & { href: string }>(
  (props, ref) => {
    return <Touchable as="a" ref={ref as React.Ref<HTMLDivElement>} {...props} />;
  }
);

TouchableLink.displayName = 'TouchableLink';

// Pre-configured gradient button
export const GradientButton = forwardRef<HTMLButtonElement, Omit<TouchableProps, 'variant'> & React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => {
    return (
      <TouchableButton
        ref={ref}
        variant="gradient"
        className={cn(
          'px-6 py-3 rounded-2xl text-white font-medium',
          className
        )}
        {...props}
      />
    );
  }
);

GradientButton.displayName = 'GradientButton';