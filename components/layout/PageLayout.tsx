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
    <div className={`fixed inset-0 flex flex-col bg-gray-50 ${className}`}>
      {/* Status Bar Area */}
      <div className="safe-area-top flex-shrink-0" />
      
      {/* Header */}
      {header && (
        <div className={`app-header backdrop-blur-xl bg-white/90 border-b border-gray-200 flex-shrink-0 ${headerClassName}`}>
          <div className="flex items-center justify-between px-4 h-14">
            {/* Left Element */}
            {header.showBackButton ? (
              <Link 
                href={header.backHref || '/'}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-white/80 hover:bg-white native-transition shadow-md touch-feedback touch-manipulation"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </Link>
            ) : (
              <div className="w-10" />
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
            <div className="w-10 flex items-center justify-end">
              {header.rightElement || null}
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content - Scrollable */}
      <div className={`flex-1 overflow-y-auto ${contentClassName}`}>
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