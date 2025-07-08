'use client';

import { useNavigationOptimization } from '@/hooks/useNavigationOptimization';

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  // Initialize navigation optimizations
  useNavigationOptimization();
  
  return <>{children}</>;
}