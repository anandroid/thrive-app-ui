'use client';

import React from 'react';
import { useTouchFeedback, getTouchClasses } from '@/hooks/useTouchFeedback';

interface TouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  haptic?: 'light' | 'medium' | 'heavy';
  ripple?: boolean;
  children: React.ReactNode;
}

export function TouchButton({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  haptic = 'light',
  ripple = false,
  className = '',
  children,
  ...props
}: TouchButtonProps) {
  const { touchHandlers } = useTouchFeedback({ hapticStyle: haptic });

  const baseClasses = `
    inline-flex items-center justify-center font-medium rounded-2xl
    transition-all duration-200 
    ${fullWidth ? 'w-full' : ''}
  `;

  const sizeClasses = {
    sm: 'min-h-[40px] px-4 text-sm',
    md: 'min-h-[44px] px-6 text-base',
    lg: 'min-h-[52px] px-8 text-lg'
  };

  const variantClasses = {
    primary: 'bg-gradient-to-r from-rose to-burgundy text-white shadow-lg hover:shadow-xl',
    secondary: 'bg-white text-burgundy border border-burgundy/20 shadow-md hover:shadow-lg',
    ghost: 'bg-transparent text-burgundy hover:bg-burgundy/10',
    danger: 'bg-red-500 text-white hover:bg-red-600 shadow-lg hover:shadow-xl'
  };

  const combinedClasses = getTouchClasses(
    `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`,
    { feedback: true, ripple, nativePress: variant === 'primary' }
  );

  return (
    <button
      className={combinedClasses}
      {...touchHandlers}
      {...props}
    >
      {children}
    </button>
  );
}