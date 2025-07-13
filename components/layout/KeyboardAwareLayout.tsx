'use client';

import React from 'react';
import { KeyboardAvoidingView } from '@/components/ui/KeyboardAvoidingView';

interface KeyboardAwareLayoutProps {
  children: React.ReactNode;
  className?: string;
  behavior?: 'padding' | 'height' | 'position';
  enabled?: boolean;
}

/**
 * A layout wrapper that provides keyboard avoidance for all screens
 * Automatically detects WebView environment and applies appropriate keyboard handling
 */
export function KeyboardAwareLayout({
  children,
  className = '',
  behavior = 'padding',
  enabled = true
}: KeyboardAwareLayoutProps) {
  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <KeyboardAvoidingView
      className={`flex flex-col min-h-screen ${className}`}
      behavior={behavior}
      useWebViewDetection={true}
    >
      {children}
    </KeyboardAvoidingView>
  );
}