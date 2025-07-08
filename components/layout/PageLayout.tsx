'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

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
        <div className={`layout-header backdrop-blur-xl bg-white/90 border-b border-gray-200 ${headerClassName}`}>
          <div className="flex items-center justify-between header-padding h-full">
            {/* Left Element */}
            {header.showBackButton ? (
              <Link 
                href={header.backHref || '/'}
                className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl flex items-center justify-center bg-white/60 hover:bg-white/90 native-transition shadow-lg hover:shadow-xl touch-feedback touch-manipulation"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </Link>
            ) : (
              <div className="w-11" />
            )}
            
            {/* Center Element */}
            <div className="flex-1 flex items-center justify-center">
              {header.centerElement ? (
                header.centerElement
              ) : header.title ? (
                <h1 className="text-xl font-bold text-gray-800">{header.title}</h1>
              ) : null}
            </div>
            
            {/* Right Element */}
            <div className="w-11 flex items-center justify-end">
              {header.rightElement || null}
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content - Scrollable */}
      <div className={`layout-content ${contentClassName}`}>
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