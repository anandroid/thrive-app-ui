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
    leftElement?: ReactNode;
    rightElement?: ReactNode;
    variant?: 'default' | 'transparent' | 'blur';
    layout?: 'centered' | 'left-aligned' | 'space-between';
  };
  customHeader?: ReactNode; // For completely custom header content
  stickyBottom?: ReactNode; // For sticky bottom elements (input, buttons, etc)
  className?: string;
  contentClassName?: string;
}

/**
 * AppLayout - Universal layout for all pages
 * 
 * Features:
 * - Sticky header that scrolls then sticks at top
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
  stickyBottom,
  className = '',
  contentClassName = ''
}: AppLayoutProps) {
  return (
    <div className={`app-layout ${className}`}>
      {/* Sticky Header */}
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
              leftElement={header!.leftElement}
              rightElement={header!.rightElement}
              variant={header!.variant || 'default'}
              layout={header!.layout}
            />
          )}
        </div>
      )}
      
      {/* Scrollable Content */}
      <div className={`app-content ${contentClassName}`}>
        {children}
        {stickyBottom && (
          <div className="app-sticky-bottom">
            {stickyBottom}
          </div>
        )}
      </div>
    </div>
  );
}