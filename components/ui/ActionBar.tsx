'use client';

import React, { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { IconButton } from './Button';
import { useRouter } from 'next/navigation';

interface ActionBarProps {
  title?: string | ReactNode;
  showBackButton?: boolean;
  backHref?: string;
  onBackClick?: () => void;
  leftElement?: ReactNode;
  rightElement?: ReactNode;
  className?: string;
  variant?: 'default' | 'transparent' | 'blur';
  layout?: 'centered' | 'left-aligned' | 'space-between';
}

export function ActionBar({
  title,
  showBackButton = true,
  backHref = '/',
  onBackClick,
  leftElement,
  rightElement,
  className = '',
  variant = 'default',
  layout = 'centered'
}: ActionBarProps) {
  const router = useRouter();
  const variantClasses = {
    default: 'bg-white border-b border-gray-200',
    transparent: 'bg-transparent',
    blur: 'bg-white/90 backdrop-blur-xl'
  };

  const handleBackClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onBackClick) {
      onBackClick();
    } else if (backHref) {
      router.push(backHref);
    }
  };

  // Render different layouts
  if (layout === 'left-aligned') {
    return (
      <div className={`action-bar left-aligned ${variantClasses[variant]} ${className}`}>
        <div className="action-bar-content">
          {/* Left side - back button and title */}
          <div className="action-bar-left">
            {showBackButton && (
              <IconButton
                onClick={handleBackClick}
                variant="ghost"
                springAnimation
                gradientOverlay
                cardGlow
                haptic="medium"
                className="hover:bg-gray-100 text-gray-700 mr-3"
              >
                <ArrowLeft className="w-5 h-5" />
              </IconButton>
            )}
            {typeof title === 'string' ? (
              <h1 className="action-bar-title text-left">{title}</h1>
            ) : (
              title
            )}
          </div>

          {/* Right: Custom Element */}
          <div className="action-bar-right">
            {rightElement}
          </div>
        </div>
      </div>
    );
  }

  if (layout === 'space-between') {
    return (
      <div className={`action-bar space-between ${variantClasses[variant]} ${className}`}>
        <div className="flex items-center justify-between action-bar-content">
          {/* Left: Custom element or back button */}
          <div className="flex items-center">
            {leftElement || (showBackButton && (
              <IconButton
                onClick={handleBackClick}
                variant="ghost"
                springAnimation
                gradientOverlay
                cardGlow
                haptic="medium"
                className="hover:bg-gray-100 text-gray-700"
              >
                <ArrowLeft className="w-5 h-5" />
              </IconButton>
            ))}
          </div>

          {/* Center: Title */}
          <div className="flex-1 flex justify-center">
            {typeof title === 'string' ? (
              <h1 className="action-bar-title">{title}</h1>
            ) : (
              title
            )}
          </div>

          {/* Right: Custom Element */}
          <div className="flex items-center">
            {rightElement}
          </div>
        </div>
      </div>
    );
  }

  // Default centered layout
  return (
    <div className={`action-bar centered ${variantClasses[variant]} ${className}`}>
      <div className="flex items-center justify-between action-bar-content">
        {/* Left: Back Button */}
        <div className="action-bar-left">
          {showBackButton ? (
            <IconButton
              onClick={handleBackClick}
              variant="ghost"
              springAnimation
              gradientOverlay
              cardGlow
              haptic="medium"
              className="hover:bg-gray-100 text-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </IconButton>
          ) : (
            <div className="w-11" />
          )}
        </div>

        {/* Center: Title */}
        <div className="action-bar-center">
          {typeof title === 'string' ? (
            <h1 className="action-bar-title">{title}</h1>
          ) : (
            title
          )}
        </div>

        {/* Right: Custom Element */}
        <div className="action-bar-right">
          {rightElement || <div className="w-11" />}
        </div>
      </div>
    </div>
  );
}