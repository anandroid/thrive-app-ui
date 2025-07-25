'use client';

import React, { ReactNode } from 'react';
import { AppLayout } from './AppLayout';
import { BottomNav } from '@/components/home/BottomNav';

interface BottomNavLayoutProps {
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
  customHeader?: ReactNode;
  className?: string;
  contentClassName?: string;
}

/**
 * BottomNavLayout - Layout for main pages that need bottom navigation
 * Extends AppLayout and automatically includes BottomNav
 * 
 * Use this for main pages: Home, Discover, Shop, Settings
 * Use AppLayout directly for inner pages that don't need bottom nav
 */
export function BottomNavLayout({
  children,
  header,
  customHeader,
  className = '',
  contentClassName = ''
}: BottomNavLayoutProps) {
  return (
    <AppLayout
      header={header}
      customHeader={customHeader}
      className={className}
      contentClassName={contentClassName}
      showBottomNav={false} // We'll add it as stickyBottom instead
      stickyBottom={<BottomNav />}
    >
      {children}
    </AppLayout>
  );
}