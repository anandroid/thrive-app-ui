'use client';

import React, { ReactNode } from 'react';
import { ActionBar } from '@/components/ui/ActionBar';

interface AppLayoutProps {
  children: ReactNode;
  header?: {
    title?: string | ReactNode;
    showBackButton?: boolean;
    backHref?: string;
    onBackClick?: () => void;
    rightElement?: ReactNode;
    variant?: 'default' | 'transparent' | 'blur';
  };
  customHeader?: ReactNode; // For completely custom header content
  className?: string;
  contentClassName?: string;
}

/**
 * AppLayout - Universal layout for all pages
 * 
 * Features:
 * - Fixed header that stays at top
 * - Scrollable content area that adjusts to keyboard
 * - Consistent spacing and safe areas
 * 
 * Usage:
 * ```tsx
 * <AppLayout header={{ title: "My Page", showBackButton: true }}>
 *   <YourContent />
 * </AppLayout>
 * ```
 */
export function AppLayout({
  children,
  header,
  customHeader,
  className = '',
  contentClassName = ''
}: AppLayoutProps) {
  return (
    <div className={`app-layout ${className}`}>
      {/* Fixed Header */}
      {(header || customHeader) && (
        <div className="app-header">
          {customHeader ? (
            customHeader
          ) : (
            <ActionBar
              title={header!.title}
              showBackButton={header!.showBackButton}
              backHref={header!.backHref}
              onBackClick={header!.onBackClick}
              rightElement={header!.rightElement}
              variant={header!.variant || 'default'}
            />
          )}
        </div>
      )}
      
      {/* Scrollable Content */}
      <div className={`app-content ${contentClassName}`}>
        {children}
      </div>
    </div>
  );
}