'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface LoadingButtonProps {
  isLoading: boolean;
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  loadingMessages?: string[];
  messageInterval?: number;
  className?: string;
  loadingClassName?: string;
  showSpinner?: boolean;
  spinnerClassName?: string;
}

const defaultMessages = [
  'Processing...',
  'Crafting your plan...',
  'Adding wellness wisdom...',
  'Personalizing experience...',
  'Almost there...',
  'Finalizing details...',
];

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading,
  onClick,
  disabled,
  children,
  loadingMessages = defaultMessages,
  messageInterval = 2000,
  className = '',
  loadingClassName = '',
  showSpinner = true,
  spinnerClassName = '',
}) => {
  const [currentMessage, setCurrentMessage] = useState(loadingMessages[0]);

  useEffect(() => {
    if (!isLoading) {
      setCurrentMessage(loadingMessages[0]);
      return;
    }

    // Set initial message
    setCurrentMessage(loadingMessages[0]);

    // Start cycling through messages after 2 seconds
    const timer = setTimeout(() => {
      let index = 0;
      const interval = setInterval(() => {
        index = (index + 1) % loadingMessages.length;
        setCurrentMessage(loadingMessages[index]);
      }, messageInterval);

      return () => clearInterval(interval);
    }, 2000);

    return () => clearTimeout(timer);
  }, [isLoading, loadingMessages, messageInterval]);

  // Calculate text size class based on message length
  const getTextSizeClass = (text: string) => {
    const length = text.length;
    if (length > 25) return 'text-xs';
    if (length > 20) return 'text-sm';
    return 'text-sm';
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        'relative overflow-hidden transition-all',
        className,
        isLoading && loadingClassName
      )}
    >
      {isLoading ? (
        <div className="flex items-center justify-center px-2">
          {showSpinner && (
            <div
              className={cn(
                'w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0',
                spinnerClassName
              )}
            />
          )}
          <span 
            className={cn(
              'ml-2 leading-tight break-words text-center',
              getTextSizeClass(currentMessage)
            )}
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              maxWidth: '180px',
            }}
          >
            {currentMessage}
          </span>
        </div>
      ) : (
        children
      )}
    </button>
  );
};

// Compact version for smaller buttons
export const CompactLoadingButton: React.FC<LoadingButtonProps> = (props) => {
  return (
    <LoadingButton
      {...props}
      className={cn(
        'min-h-[44px] px-4 py-2 flex items-center justify-center',
        props.className
      )}
    />
  );
};