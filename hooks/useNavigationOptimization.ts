import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useNavigationOptimization() {
  const router = useRouter();

  useEffect(() => {
    // Prefetch common routes when the app is idle
    if ('requestIdleCallback' in window) {
      const idleCallbackId = window.requestIdleCallback(() => {
        // Prefetch common routes
        const routesToPrefetch = [
          '/thrivings',
          '/journeys', 
          '/pantry',
          '/settings',
          '/chat-history',
          '/chat/new'
        ];

        routesToPrefetch.forEach(route => {
          router.prefetch(route);
        });
      }, { timeout: 2000 }); // Wait max 2 seconds

      return () => {
        if ('cancelIdleCallback' in window) {
          window.cancelIdleCallback(idleCallbackId);
        }
      };
    } else {
      // Fallback for browsers without requestIdleCallback
      const timeoutId = setTimeout(() => {
        const routesToPrefetch = [
          '/thrivings',
          '/journeys',
          '/pantry',
          '/settings',
          '/chat-history',
          '/chat/new'
        ];

        routesToPrefetch.forEach(route => {
          router.prefetch(route);
        });
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [router]);

  // Preload critical assets
  useEffect(() => {
    // Preload OpenAI SDK if not already loaded
    const preloadOpenAI = () => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'script';
      link.href = '/_next/static/chunks/openai.js'; // Adjust path as needed
      document.head.appendChild(link);
    };

    // Preload critical fonts
    const preloadFonts = () => {
      const fonts = [
        '/fonts/geist-sans.woff2',
        '/fonts/geist-mono.woff2'
      ];

      fonts.forEach(fontPath => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'font';
        link.type = 'font/woff2';
        link.href = fontPath;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      });
    };

    preloadFonts();
    
    // Delay OpenAI preload slightly
    const timeoutId = setTimeout(preloadOpenAI, 1000);

    return () => clearTimeout(timeoutId);
  }, []);

  // Enable instant page transitions
  useEffect(() => {
    // Add instant.page-like behavior for even faster navigation
    const prefetchedUrls = new Set<string>();

    const prefetchUrl = (url: string) => {
      if (prefetchedUrls.has(url)) return;
      
      prefetchedUrls.add(url);
      
      // Create a hidden link element to trigger browser prefetch
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
    };

    const handleLinkHover = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.href && link.href.startsWith(window.location.origin)) {
        const url = new URL(link.href);
        prefetchUrl(url.pathname);
      }
    };

    // Listen for hover events on links
    document.addEventListener('mouseover', handleLinkHover as EventListener);
    
    // For mobile, prefetch on touchstart
    document.addEventListener('touchstart', handleLinkHover as EventListener);

    return () => {
      document.removeEventListener('mouseover', handleLinkHover as EventListener);
      document.removeEventListener('touchstart', handleLinkHover as EventListener);
    };
  }, []);
}