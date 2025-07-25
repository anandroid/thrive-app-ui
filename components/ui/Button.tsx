'use client';

import React, { forwardRef } from 'react';
import { useTouchFeedback } from '@/hooks/useTouchFeedback';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'gradient' | 'soft' | 'outline' | 'sage';
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
    sm: 'min-h-[40px] px-[min(4vw,1rem)] py-[min(2vw,0.5rem)] text-[min(3.5vw,0.875rem)]',
    md: 'min-h-[44px] px-[min(5vw,1.5rem)] py-[min(3vw,0.75rem)] text-[min(4vw,1rem)]',
    lg: 'min-h-[52px] px-[min(6vw,2rem)] py-[min(3.5vw,1rem)] text-[min(4.5vw,1.125rem)]'
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


  // Build gradient styles for inline styling
  const gradientStyle: React.CSSProperties = {};
  
  if (variant === 'gradient' && gradient) {
    const direction = gradient.direction || 'to-r';
    const directionMap: Record<string, string> = {
      'to-r': 'to right',
      'to-br': 'to bottom right',
      'to-b': 'to bottom',
      'to-bl': 'to bottom left',
      'to-l': 'to left',
      'to-tl': 'to top left',
      'to-t': 'to top',
      'to-tr': 'to top right'
    };
    
    // Map color names to actual colors
    const colorMap: Record<string, string> = {
      'rose': '#f43f5e',
      'rose-500': '#f43f5e',
      'burgundy': '#8b2c5f',
      'burgundy-700': '#8b2c5f',
      'rose/40': 'rgba(244, 63, 94, 0.4)',
      'burgundy/30': 'rgba(139, 44, 95, 0.3)',
      'primary': '#a855f7',
      'secondary': '#f472b6',
      'purple-500': '#a855f7',
      'pink-500': '#ec4899',
      'purple-400': '#c084fc',
      'pink-400': '#f9a8d4',
      'blue-400': '#60a5fa',
      'blue-500': '#3b82f6',
      'indigo-500': '#6366f1',
      'green-400': '#4ade80',
      'emerald-500': '#10b981',
      'slate-600': '#475569',
      'slate-700': '#334155',
      'blue-600': '#2563eb',
      'blue-700': '#1d4ed8'
    };
    
    const fromColor = colorMap[gradient.from] || gradient.from;
    const toColor = colorMap[gradient.to] || gradient.to;
    
    gradientStyle.background = `linear-gradient(${directionMap[direction] || direction}, ${fromColor}, ${toColor})`;
  } else if (variant === 'gradient') {
    // Default gradient
    gradientStyle.background = 'linear-gradient(to right, #f43f5e, #8b2c5f)';
  }

  // Build inline styles for variants
  const variantInlineStyles: React.CSSProperties = {};
  
  // Apply default variant styles only if no custom className overrides them
  if (!className?.includes('bg-') && !className?.includes('text-')) {
    switch (variant) {
      case 'primary':
        variantInlineStyles.backgroundColor = '#111827'; // gray-900
        variantInlineStyles.color = '#ffffff';
        break;
      case 'secondary':
        variantInlineStyles.backgroundColor = '#ffffff';
        variantInlineStyles.color = '#111827';
        variantInlineStyles.border = '1px solid #e5e7eb';
        break;
      case 'ghost':
        variantInlineStyles.backgroundColor = 'transparent';
        variantInlineStyles.color = '#111827';
        break;
      case 'danger':
        variantInlineStyles.backgroundColor = '#ef4444';
        variantInlineStyles.color = '#ffffff';
        break;
      case 'soft':
        variantInlineStyles.backgroundColor = '#f3f4f6';
        variantInlineStyles.color = '#1f2937';
        break;
      case 'outline':
        variantInlineStyles.backgroundColor = 'transparent';
        variantInlineStyles.border = '2px solid #111827';
        variantInlineStyles.color = '#111827';
        break;
      case 'sage':
        variantInlineStyles.backgroundColor = '#8fad8f';
        variantInlineStyles.color = '#ffffff';
        break;
      case 'gradient':
        variantInlineStyles.color = '#ffffff';
        break;
    }
  }

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
    
    // Custom classes (applied last to override defaults)
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
      style={{...props.style, ...variantInlineStyles, ...gradientStyle}}
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
        from: 'sage-400',
        to: 'sage-600',
        hoverFrom: 'sage-600',
        hoverTo: 'sage-600'
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
        from: 'rose-500',
        to: 'burgundy-700',
        hoverFrom: 'burgundy-700',
        hoverTo: 'burgundy-700'
      }}
      {...props} 
    />
  )
);

// Icon button variant - Enhanced with premium defaults
export const IconButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'size'>>(
  ({ className, springAnimation = true, cardGlow = true, gradientOverlay = true, scale = 0.93, shadow = 'md', ...props }, ref) => (
    <Button 
      ref={ref} 
      size="sm"
      className={cn(
        'w-11 h-11 p-0 min-h-0',
        className
      )}
      scale={scale}
      springAnimation={springAnimation}
      cardGlow={cardGlow}
      gradientOverlay={gradientOverlay}
      shadow={shadow}
      {...props} 
    />
  )
);

// Menu button (like settings button) - Enhanced with premium defaults
export const MenuButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant' | 'shadow' | 'rounded'>>(
  ({ springAnimation = true, gradientOverlay = true, scale = 0.93, ...props }, ref) => (
    <Button 
      ref={ref} 
      variant="ghost"
      shadow="lg"
      rounded="2xl"
      className="bg-white/60 hover:bg-white/90"
      cardGlow
      hoverScale={1.02}
      springAnimation={springAnimation}
      gradientOverlay={gradientOverlay}
      scale={scale}
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
        'p-[min(5vw,1.25rem)]',
        'justify-start', // Ensure left alignment by default
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
        from: 'sage-400',
        to: 'sage-600',
        hoverFrom: 'sage-600',
        hoverTo: 'sage-600',
        activeFrom: 'sage-300/40',
        activeTo: 'sage-400/30'
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
  ({ className, ...props }, ref) => (
    <Button 
      ref={ref} 
      variant="soft"
      shadow="none"
      cardGlow
      gradientOverlay
      springAnimation
      className={cn(
        'bg-gradient-to-r from-[rgba(218,160,169,0.15)] to-[rgba(251,113,133,0.15)]',
        'hover:from-[rgba(218,160,169,0.25)] hover:to-[rgba(251,113,133,0.25)]',
        'active:from-[rgba(218,160,169,0.30)] active:to-[rgba(251,113,133,0.30)]',
        'border border-[rgba(218,160,169,0.20)]',
        'hover:border-[rgba(218,160,169,0.30)]',
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