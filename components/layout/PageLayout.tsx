'use client';

import React, { ReactNode } from 'react';
import { ActionBar } from '@/components/ui/ActionBar';

/**
 * PageLayout Component
 * 
 * Standard layout wrapper for all pages in the app.
 * Provides consistent header, content area, and optional action bar.
 * 
 * IMPORTANT: Data Loading Best Practice
 * =====================================
 * To prevent flash of empty state when navigating between pages:
 * 
 * 1. Initialize state with data from localStorage/storage:
 *    ```tsx
 *    const [items, setItems] = useState<Item[]>(() => {
 *      if (typeof window !== 'undefined') {
 *        return getItemsFromStorage();
 *      }
 *      return [];
 *    });
 *    ```
 * 
 * 2. Or use the custom hook:
 *    ```tsx
 *    import { useLocalStorageState } from '@/src/hooks/useLocalStorageState';
 *    
 *    const [items, setItems, reloadItems] = useLocalStorageState(
 *      'items_key',
 *      [],
 *      getItemsFromStorage
 *    );
 *    ```
 * 
 * This ensures data is available immediately on render, preventing UI flicker.
 */
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
    <div className={`page-layout bg-gray-50 ${className}`}>
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