'use client';

import React from 'react';
import { useGlobalTouchFeedback } from '@/hooks/useGlobalTouchFeedback';

export function TouchFeedbackProvider({ children }: { children: React.ReactNode }) {
  useGlobalTouchFeedback();
  
  return <>{children}</>;
}