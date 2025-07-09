'use client';

import React, { ReactNode } from 'react';
import { ActionBar } from '@/components/ui/ActionBar';

interface PageLayoutProps {
  children: ReactNode;
  header?: {
    title?: string;
    showBackButton?: boolean;
    backHref?: string;
    rightElement?: ReactNode;
    centerElement?: ReactNode;
  };
  actionBar?: ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

export function PageLayout({
  children,
  header,
  actionBar,
  className = '',
  headerClassName = '',
  contentClassName = ''
}: PageLayoutProps) {
  return (
    <div className={`page-layout ${className}`}>
      {/* Header */}
      {header && (
        <ActionBar
          title={header.centerElement || header.title}
          showBackButton={header.showBackButton}
          backHref={header.backHref}
          rightElement={header.rightElement}
          variant="blur"
          className={headerClassName}
        />
      )}
      
      {/* Main Content - Scrollable */}
      <div className={`page-content ${contentClassName}`}>
        {children}
      </div>
      
      {/* Fixed Action Bar */}
      {actionBar && (
        <div className="action-bar-container flex-shrink-0">
          <div className="px-4 pb-safe">
            {actionBar}
          </div>
        </div>
      )}
    </div>
  );
}