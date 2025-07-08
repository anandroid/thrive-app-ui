'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';

interface OnboardingSlide {
  title: string;
  subtitle: string;
  description: string;
  image: string;
  imageAlt: string;
}

const slides: OnboardingSlide[] = [
  {
    title: "Your Wellness Companion",
    subtitle: "Someone who truly listens",
    description: "Share your wellness journey with a caring AI companion. Get personalized support for routines, journaling, and natural remedies - all while keeping your data private on your device.",
    image: "/illustrations/companion.png",
    imageAlt: "Wellness companion illustration"
  },
  {
    title: "Track Your Healing Story",
    subtitle: "Your journey, not your failures",
    description: "Track your wellness patterns through personal journals. See your progress, celebrate small wins, and gain insights - all without judgment.",
    image: "/illustrations/journey_story_illustration.png",
    imageAlt: "Journey tracking illustration"
  },
  {
    title: "Gentle Daily Thrivings",
    subtitle: "Life is hard enough",
    description: "Gentle reminders without pressure. No tracking missed days. Do what you can, when you can. Combine wellness routines with reflective journaling.",
    image: "/illustrations/routine.png",
    imageAlt: "Thrivings illustration"
  },
  {
    title: "Natural Wellness Wisdom",
    subtitle: "Your body knows best",
    description: "Discover herbs, supplements, and holistic practices. We share wisdom, not sales pitches - helping you explore natural options.",
    image: "/illustrations/recommend_supplements.png",
    imageAlt: "Natural wellness recommendations illustration"
  },
  {
    title: "Your Privacy, Protected",
    subtitle: "Your story stays yours",
    description: "Your wellness data stays on your device. We never track, sell, or share your information. Your journey remains completely private.",
    image: "/illustrations/privacy.png",
    imageAlt: "Privacy illustration"
  }
];

interface OnboardingProps {
  onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;


  // Preload images and PWA assets
  useEffect(() => {
    // Preload all illustration images
    slides.forEach((slide) => {
      const img = new window.Image();
      img.src = slide.image;
    });

    // Preload critical app routes
    const routes = ['/chat', '/thrivings', '/journeys', '/settings'];
    routes.forEach(route => {
      fetch(route, { method: 'HEAD' }).catch(() => {});
    });

    // Request persistent storage for PWA
    if ('storage' in navigator && 'persist' in navigator.storage) {
      navigator.storage.persist();
    }

    // Cache critical assets
    if ('caches' in window) {
      caches.open('thrive-app-v1').then(cache => {
        const assets = [
          '/',
          '/manifest.json',
          '/icon-192x192.png',
          '/icon-512x512.png',
        ];
        cache.addAll(assets).catch(() => {});
      });
    }
  }, []);

  const handleNext = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setTimeout(() => setIsTransitioning(false), 300);
    
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
      // Scroll to top when changing slides
      if (containerRef.current) {
        containerRef.current.scrollTop = 0;
      }
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (isTransitioning || currentSlide === 0) return;
    
    setIsTransitioning(true);
    setTimeout(() => setIsTransitioning(false), 300);
    
    setCurrentSlide(currentSlide - 1);
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  };

  // Touch handlers for swipe gestures
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrevious();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const slide = slides[currentSlide];
  const isLastSlide = currentSlide === slides.length - 1;

  return (
    <div 
      className="fixed inset-0 z-50 bg-white"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Background Layer */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-soft-blush/80 via-white to-soft-lavender/30" />
        <div className="absolute top-20 -right-20 w-96 h-96 rounded-full bg-gradient-to-br from-rose/20 to-dusty-rose/20 blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-gradient-to-tr from-sage-light/40 to-sage/30 blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>
      
      {/* Main Content Container */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 flex justify-between items-center p-4">
        <div className="flex space-x-2">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? 'w-8 bg-gradient-to-r from-sage to-sage-dark' 
                  : index < currentSlide
                  ? 'w-4 bg-sage-light'
                  : 'w-4 bg-gray-200'
              }`}
            />
          ))}
        </div>
        {!isLastSlide && (
          <button
            onClick={handleSkip}
            className="px-4 py-2 rounded-full text-sm text-gray-500 hover:text-gray-700 hover:bg-white/50 transition-all touch-feedback touch-manipulation"
          >
            Skip
          </button>
        )}
      </div>

      {/* Scrollable Content */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          height: '100%'
        }}
      >
        <div className="max-w-md mx-auto w-full px-6 py-4">
          {/* Image with themed background */}
          <div className="relative w-full h-48 sm:h-56 md:h-64 mb-4 group">
            <div className={`absolute inset-0 rounded-3xl shadow-2xl transition-all duration-500 ${
              currentSlide === 0 ? 'bg-gradient-to-br from-sage-light/40 to-sage/30 shadow-sage/30' :
              currentSlide === 1 ? 'bg-gradient-to-br from-lavender/40 to-purple-500/30 shadow-purple/30' :
              currentSlide === 2 ? 'bg-gradient-to-br from-blue-200/40 to-blue-400/30 shadow-blue/30' :
              currentSlide === 3 ? 'bg-gradient-to-br from-amber-200/40 to-orange-300/30 shadow-orange/30' :
              'bg-gradient-to-br from-slate-300/40 to-gray-400/30 shadow-gray/30'
            }`} />
            <div className="absolute inset-0 rounded-3xl backdrop-blur-sm" />
            <Image
              src={slide.image}
              alt={slide.imageAlt}
              fill
              className="object-contain p-4 relative z-10"
              priority
            />
          </div>

          {/* Text Content */}
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary-text">
              {slide.title}
            </h2>
            <p className="text-base sm:text-lg font-medium text-secondary-text">
              {slide.subtitle}
            </p>
            <p className="text-sm sm:text-base text-secondary-text-thin leading-relaxed">
              {slide.description}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Navigation - Fixed */}
      <div className="flex-shrink-0 p-4 sm:p-6 bg-white/95 backdrop-blur-lg safe-area-bottom border-t border-gray-100">
        <button
          onClick={handleNext}
          className="w-full py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-rose to-burgundy text-white font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center active:scale-[0.98] touch-manipulation"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          {isLastSlide ? 'Get Started' : 'Continue'}
          <ChevronRight className="w-5 h-5 ml-2" />
        </button>
        
      </div>
      </div>
    </div>
  );
};