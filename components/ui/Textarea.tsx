'use client';

import React, { forwardRef } from 'react';
import { useKeyboardAwareInput } from '@/hooks/useKeyboardAwareInput';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, onFocus, rows = 3, ...props }, ref) => {
    const { handleFocus } = useKeyboardAwareInput();
    
    const handleTextareaFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      // Call our keyboard handling
      handleFocus(e);
      // Call any existing onFocus handler
      onFocus?.(e);
    };
    
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontSize: 'min(3.5vw, 0.875rem)', marginBottom: 'min(1vw, 0.5rem)' }}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          rows={rows}
          onFocus={handleTextareaFocus}
          className={cn(
            "w-full px-4 py-3",
            "rounded-xl border border-gray-200",
            "text-base placeholder-gray-400",
            "focus:outline-none focus:ring-2 focus:ring-rose/30 focus:border-transparent",
            "transition-all duration-200 resize-none",
            "touch-manipulation", // Prevent zoom on iOS
            error && "border-red-500 focus:ring-red-500/30",
            className
          )}
          style={{
            paddingLeft: 'min(4vw, 1rem)',
            paddingRight: 'min(4vw, 1rem)',
            paddingTop: 'min(3vw, 0.75rem)',
            paddingBottom: 'min(3vw, 0.75rem)',
            borderRadius: 'min(3vw, 0.75rem)',
            fontSize: 'min(4vw, 1rem)'
          }}
          {...props}
        />
        {error && (
          <p className="mt-2 text-xs text-red-600" style={{ marginTop: 'min(1vw, 0.5rem)', fontSize: 'min(3vw, 0.75rem)' }}>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-2 text-xs text-gray-500" style={{ marginTop: 'min(1vw, 0.5rem)', fontSize: 'min(3vw, 0.75rem)' }}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';