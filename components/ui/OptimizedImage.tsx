'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  fill?: boolean;
  sizes?: string;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className = '',
  fill = false,
  sizes,
  quality = 75,
  placeholder,
  blurDataURL,
  onLoad
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // For SVG files with large embedded data, implement lazy loading
  const isSvg = src.endsWith('.svg');
  const [shouldLoad, setShouldLoad] = useState(priority);

  useEffect(() => {
    if (!priority && typeof window !== 'undefined') {
      // Use Intersection Observer for lazy loading
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setShouldLoad(true);
              observer.disconnect();
            }
          });
        },
        {
          rootMargin: '50px' // Start loading 50px before entering viewport
        }
      );

      const element = document.querySelector(`[data-image-src="${src}"]`);
      if (element) {
        observer.observe(element);
      }

      return () => observer.disconnect();
    }
  }, [src, priority]);

  if (!shouldLoad) {
    // Placeholder while waiting to load
    return (
      <div 
        data-image-src={src}
        className={`bg-gray-100 animate-pulse ${className}`}
        style={fill ? undefined : { width, height }}
      />
    );
  }

  if (error) {
    // Fallback for failed loads
    return (
      <div 
        className={`bg-gray-100 flex items-center justify-center text-gray-400 ${className}`}
        style={fill ? undefined : { width, height }}
      >
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  return (
    <div className={`relative ${fill ? 'w-full h-full' : ''}`}>
      {isLoading && (
        <div 
          className={`absolute inset-0 bg-gray-100 animate-pulse ${className}`}
        />
      )}
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        sizes={sizes}
        quality={quality}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        className={className}
        onLoadingComplete={() => {
          setIsLoading(false);
          onLoad?.();
        }}
        onError={() => setError(true)}
        unoptimized={isSvg} // Don't try to optimize SVGs through Next.js
      />
    </div>
  );
}