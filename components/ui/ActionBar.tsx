'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface ActionBarProps {
  title?: string | ReactNode;
  showBackButton?: boolean;
  backHref?: string;
  onBackClick?: () => void;
  rightElement?: ReactNode;
  className?: string;
  variant?: 'default' | 'transparent' | 'blur';
}

export function ActionBar({
  title,
  showBackButton = true,
  backHref = '/',
  onBackClick,
  rightElement,
  className = '',
  variant = 'default'
}: ActionBarProps) {
  const variantClasses = {
    default: 'bg-white border-b border-gray-200',
    transparent: 'bg-transparent',
    blur: 'bg-white/90 backdrop-blur-xl'
  };

  const handleBackClick = (e: React.MouseEvent) => {
    if (onBackClick) {
      e.preventDefault();
      onBackClick();
    }
  };

  return (
    <div className={`action-bar ${variantClasses[variant]} ${className}`}>
      <div className="flex items-center justify-between action-bar-content">
        {/* Left: Back Button */}
        <div className="action-bar-left">
          {showBackButton ? (
            <Link 
              href={backHref}
              onClick={handleBackClick}
              className="action-bar-button touch-feedback touch-manipulation"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
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