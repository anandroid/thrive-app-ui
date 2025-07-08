'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface PrefetchLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  prefetch?: boolean;
  onClick?: () => void;
}

export function PrefetchLink({ 
  href, 
  children, 
  className = '', 
  prefetch = true,
  onClick 
}: PrefetchLinkProps) {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const router = useRouter();
  const prefetchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (!prefetch || !linkRef.current) return;

    const link = linkRef.current;
    
    // Prefetch on hover after a short delay
    const handleMouseEnter = () => {
      prefetchTimeoutRef.current = setTimeout(() => {
        router.prefetch(href);
      }, 100); // Small delay to avoid prefetching on accidental hovers
    };

    const handleMouseLeave = () => {
      if (prefetchTimeoutRef.current) {
        clearTimeout(prefetchTimeoutRef.current);
      }
    };

    // Also prefetch on touchstart for mobile
    const handleTouchStart = () => {
      router.prefetch(href);
    };

    link.addEventListener('mouseenter', handleMouseEnter);
    link.addEventListener('mouseleave', handleMouseLeave);
    link.addEventListener('touchstart', handleTouchStart);

    return () => {
      link.removeEventListener('mouseenter', handleMouseEnter);
      link.removeEventListener('mouseleave', handleMouseLeave);
      link.removeEventListener('touchstart', handleTouchStart);
      if (prefetchTimeoutRef.current) {
        clearTimeout(prefetchTimeoutRef.current);
      }
    };
  }, [href, prefetch, router]);

  // Prefetch high-priority routes on mount
  useEffect(() => {
    const highPriorityRoutes = ['/thrivings', '/journeys', '/pantry'];
    if (highPriorityRoutes.includes(href)) {
      router.prefetch(href);
    }
  }, [href, router]);

  return (
    <Link 
      ref={linkRef}
      href={href} 
      className={className}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}