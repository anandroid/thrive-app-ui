'use client';

import React, { forwardRef } from 'react';
import { useTouchFeedback } from '@/hooks/useTouchFeedback';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'gradient' | 'soft' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  haptic?: 'light' | 'medium' | 'heavy';
  ripple?: boolean;
  gradient?: {
    from: string;
    to: string;
    hoverFrom?: string;
    hoverTo?: string;
    activeFrom?: string;
    activeTo?: string;
    direction?: 'to-r' | 'to-br' | 'to-b' | 'to-bl' | 'to-l' | 'to-tl' | 'to-t' | 'to-tr';
  };
  shadow?: 'sm' | 'md' | 'lg' | 'xl' | 'none';
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  rounded?: 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  glowColor?: string;
  scale?: number;
  nativePress?: boolean;
  cardGlow?: boolean;
  hoverScale?: number;
  gradientOverlay?: boolean;
  springAnimation?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  haptic = 'medium',
  ripple = false,
  gradient,
  shadow = 'md',
  nativePress = false,
  cardGlow = false,
  hoverScale,
  gradientOverlay = false,
  springAnimation = false,
  loading = false,
  icon,
  iconPosition = 'left',
  rounded = '2xl',
  glowColor,
  scale = 0.98,
  className = '',
  disabled,
  children,
  onClick,
  ...props
}, ref) => {
  const { touchHandlers, triggerHaptic } = useTouchFeedback({ 
    hapticStyle: haptic,
    preventDoubleTap: true,
    scale 
  });

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    
    // Trigger haptic feedback
    triggerHaptic();
    
    if (onClick) {
      onClick(e);
    }
  };

  // Size classes with viewport units for mobile-first design
  const sizeClasses = {
    sm: 'min-h-[40px] px-[4vw] max-px-4 py-[2vw] max-py-2 text-[min(3.5vw,0.875rem)]',
    md: 'min-h-[44px] px-[5vw] max-px-6 py-[3vw] max-py-3 text-[min(4vw,1rem)]',
    lg: 'min-h-[52px] px-[6vw] max-px-8 py-[3.5vw] max-py-4 text-[min(4.5vw,1.125rem)]'
  };

  // Shadow classes
  const shadowClasses = {
    none: '',
    sm: 'shadow-sm hover:shadow-md',
    md: 'shadow-md hover:shadow-lg',
    lg: 'shadow-lg hover:shadow-xl',
    xl: 'shadow-xl hover:shadow-2xl'
  };

  // Rounded classes
  const roundedClasses = {
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    '3xl': 'rounded-3xl',
    full: 'rounded-full'
  };

  // Base variant styles
  const variantStyles = {
    primary: 'bg-primary-text text-white hover:opacity-90',
    secondary: 'bg-white text-primary-text border border-gray-200 hover:bg-gray-50',
    ghost: 'bg-transparent text-primary-text hover:bg-gray-100',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    soft: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    outline: 'bg-transparent border-2 border-primary-text text-primary-text hover:bg-primary-text hover:text-white',
    gradient: gradient 
      ? `bg-gradient-${gradient.direction || 'to-r'} from-${gradient.from} to-${gradient.to} text-white ${
          gradient.hoverFrom ? `hover:from-${gradient.hoverFrom}` : ''
        } ${gradient.hoverTo ? `hover:to-${gradient.hoverTo}` : ''}`
      : 'bg-gradient-to-r from-rose to-burgundy text-white hover:from-burgundy hover:to-burgundy'
  };

  // Build all classes
  const buttonClasses = cn(
    // Base classes
    'relative inline-flex items-center justify-center font-medium',
    'cursor-pointer group',
    'touch-manipulation',
    
    // Animation type
    springAnimation 
      ? 'touch-feedback-spring' 
      : nativePress 
      ? 'native-press'
      : 'touch-feedback',
    
    // Transition timing
    springAnimation
      ? 'transition-transform duration-[400ms]'
      : 'transition-all duration-200',
    
    // Active scale (not for spring animation as it has its own)
    !springAnimation && !nativePress && `active:scale-[${scale}]`,
    
    // Size
    sizeClasses[size],
    
    // Width
    fullWidth && 'w-full',
    
    // Variant
    variantStyles[variant],
    
    // Shadow
    shadowClasses[shadow],
    
    // Rounded
    roundedClasses[rounded],
    
    // Glow effect
    (glowColor || cardGlow) && 'card-soft-glow',
    
    // Ripple
    ripple && 'touch-ripple',
    
    // Native press effect
    nativePress && 'native-press',
    
    // Hover scale
    hoverScale && `hover:scale-[${hoverScale}]`,
    
    // States
    (disabled || loading) && 'opacity-50 cursor-not-allowed pointer-events-none',
    
    // Custom classes
    className
  );

  return (
    <button
      ref={ref}
      className={buttonClasses}
      onClick={handleClick}
      disabled={disabled || loading}
      {...touchHandlers}
      {...props}
    >
      {/* Gradient overlay for hover effect */}
      {(variant === 'gradient' || gradientOverlay) && (
        <>
          {/* Primary gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-inherit" />
          {/* Active state gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/0 via-black/5 to-black/0 opacity-0 group-active:opacity-100 transition-opacity duration-75 pointer-events-none rounded-inherit" />
        </>
      )}

      {/* Loading spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Button content */}
      <span className={cn(
        'relative z-10 flex items-center justify-center gap-2',
        loading && 'opacity-0'
      )}>
        {icon && iconPosition === 'left' && icon}
        {children}
        {icon && iconPosition === 'right' && icon}
      </span>
    </button>
  );
});

Button.displayName = 'Button';

// Pre-configured button variants for common use cases
export const PrimaryButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button ref={ref} variant="primary" {...props} />
);

export const SecondaryButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button ref={ref} variant="secondary" {...props} />
);

export const GhostButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button ref={ref} variant="ghost" {...props} />
);

export const DangerButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button ref={ref} variant="danger" {...props} />
);

export const GradientButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button ref={ref} variant="gradient" {...props} />
);

// Special gradient buttons for specific use cases
export const SageGradientButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant' | 'gradient'>>(
  (props, ref) => (
    <Button 
      ref={ref} 
      variant="gradient"
      gradient={{
        from: 'sage',
        to: 'sage-dark',
        hoverFrom: 'sage-dark',
        hoverTo: 'sage-dark'
      }}
      {...props} 
    />
  )
);

export const RoseGradientButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant' | 'gradient'>>(
  (props, ref) => (
    <Button 
      ref={ref} 
      variant="gradient"
      gradient={{
        from: 'rose',
        to: 'burgundy',
        hoverFrom: 'burgundy',
        hoverTo: 'burgundy'
      }}
      {...props} 
    />
  )
);

// Icon button variant
export const IconButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'size'>>(
  ({ className, ...props }, ref) => (
    <Button 
      ref={ref} 
      size="sm"
      className={cn(
        'w-11 h-11 p-0 min-h-0',
        className
      )}
      scale={0.85}
      {...props} 
    />
  )
);

// Menu button (like settings button)
export const MenuButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant' | 'shadow' | 'rounded'>>(
  (props, ref) => (
    <Button 
      ref={ref} 
      variant="ghost"
      shadow="lg"
      rounded="2xl"
      className="bg-white/60 hover:bg-white/90"
      cardGlow
      hoverScale={1.02}
      {...props} 
    />
  )
);

// Card button (like prompt templates)
export const CardButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => (
    <Button 
      ref={ref} 
      variant="ghost"
      shadow="md"
      rounded="3xl"
      fullWidth
      cardGlow
      hoverScale={1.01}
      gradientOverlay
      springAnimation
      scale={0.97}
      className={cn(
        'bg-white/90 backdrop-blur-sm hover:bg-white',
        'p-5 text-left',
        className
      )}
      {...props} 
    />
  )
);

// Native app button
export const NativeButton = forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => (
    <Button 
      ref={ref} 
      nativePress
      cardGlow
      {...props} 
    />
  )
);

// Floating action button
export const FAB = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'size' | 'rounded' | 'shadow'>>(
  ({ className, ...props }, ref) => (
    <Button 
      ref={ref} 
      size="lg"
      rounded="full"
      shadow="xl"
      cardGlow
      scale={0.95}
      className={cn(
        'w-14 h-14 p-0',
        className
      )}
      {...props} 
    />
  )
);

// Expert consultation button style
export const ConsultationButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant' | 'shadow' | 'fullWidth'>>(
  (props, ref) => (
    <Button 
      ref={ref} 
      variant="gradient"
      gradient={{
        from: 'sage',
        to: 'sage-dark',
        hoverFrom: 'sage-dark',
        hoverTo: 'sage-dark',
        activeFrom: 'sage-light/40',
        activeTo: 'sage/30'
      }}
      shadow="md"
      fullWidth
      scale={0.98}
      springAnimation
      {...props} 
    />
  )
);

// Soft button (like journal button)
export const SoftButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, gradient, ...props }, ref) => (
    <Button 
      ref={ref} 
      variant="gradient"
      gradient={gradient || {
        from: 'dusty-rose/15',
        to: 'rose/15',
        hoverFrom: 'dusty-rose/25',
        hoverTo: 'rose/25',
        activeFrom: 'dusty-rose/30',
        activeTo: 'rose/30'
      }}
      shadow="none"
      cardGlow
      gradientOverlay
      springAnimation
      className={cn(
        'border border-dusty-rose/20',
        'hover:border-dusty-rose/30',
        'hover:shadow-md',
        className
      )}
      {...props} 
    />
  )
);

// Premium button with all effects
export const PremiumButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => (
    <Button 
      ref={ref} 
      springAnimation
      cardGlow
      gradientOverlay
      scale={0.93}
      className={cn(
        'touch-feedback-blue button-press-premium',
        className
      )}
      {...props} 
    />
  )
);

PrimaryButton.displayName = 'PrimaryButton';
SecondaryButton.displayName = 'SecondaryButton';
GhostButton.displayName = 'GhostButton';
DangerButton.displayName = 'DangerButton';
GradientButton.displayName = 'GradientButton';
SageGradientButton.displayName = 'SageGradientButton';
RoseGradientButton.displayName = 'RoseGradientButton';
IconButton.displayName = 'IconButton';
MenuButton.displayName = 'MenuButton';
CardButton.displayName = 'CardButton';
NativeButton.displayName = 'NativeButton';
FAB.displayName = 'FAB';
ConsultationButton.displayName = 'ConsultationButton';
SoftButton.displayName = 'SoftButton';
PremiumButton.displayName = 'PremiumButton';

export default Button;