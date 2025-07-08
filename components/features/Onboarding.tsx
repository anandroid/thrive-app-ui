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
    description: "Share your symptoms, concerns, and wellness goals with a caring companion who keeps your secrets safe. Get personalized support for creating healing thrivings (routine and journaling), and discovering natural remedies - all while your conversations stay completely private on your device.",
    image: "/illustrations/companion.png",
    imageAlt: "Wellness companion illustration"
  },
  {
    title: "Track Your Healing Story",
    subtitle: "Your journey, not your failures",
    description: "Create personal wellness journals to understand your patterns. Daily check-ins help you see progress and celebrate small wins. No judgment, just insights into what helps you thrive.",
    image: "/illustrations/journey_story_illustration.png",
    imageAlt: "Journey tracking illustration"
  },
  {
    title: "Gentle Daily Thrivings",
    subtitle: "Life is hard enough",
    description: "Receive gentle reminders without the pressure. We don't track completion or show missed days. This is your safe space for healing - do what you can, when you can. Combine your wellness routines with reflective journaling.",
    image: "/illustrations/routine.png",
    imageAlt: "Thrivings illustration"
  },
  {
    title: "Natural Wellness Wisdom",
    subtitle: "Your body knows best",
    description: "Discover herbs, supplements, and holistic practices that support your healing. We share wisdom, not sales pitches - helping you explore natural options that honor your body's intelligence.",
    image: "/illustrations/recommend_supplements.png",
    imageAlt: "Natural wellness recommendations illustration"
  },
  {
    title: "Your Privacy, Protected",
    subtitle: "Your story stays yours",
    description: "All your personal wellness data is stored locally on your device. We never track, sell, or share your information. Your healing journey remains completely private and personal.",
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
      className="fixed inset-0 z-50 flex flex-col relative"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Background Gradient - matching app theme */}
      <div className="absolute inset-0 bg-gradient-to-br from-soft-blush/80 via-white to-soft-lavender/30" />
      
      {/* Decorative Elements with subtle animation */}
      <div className="absolute top-20 -right-20 w-96 h-96 rounded-full bg-gradient-to-br from-rose/20 to-dusty-rose/20 blur-3xl animate-pulse-slow" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-gradient-to-tr from-sage-light/40 to-sage/30 blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4">
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
        className="flex-1 overflow-y-auto overflow-x-hidden px-6 pt-8 pb-32"
      >
        <div className="max-w-md mx-auto w-full space-y-8 min-h-full flex flex-col justify-center">
          {/* Image with themed background */}
          <div className="relative w-full h-64 mb-8 group">
            <div className={`absolute inset-0 rounded-3xl shadow-2xl transition-all duration-500 ${
              currentSlide === 0 ? 'bg-gradient-to-br from-dusty-rose/20 to-sage-light/15 shadow-rose/20' :
              currentSlide === 1 ? 'bg-gradient-to-br from-sage-light/30 to-sage/20 shadow-sage/20' :
              currentSlide === 2 ? 'bg-gradient-to-br from-rose/20 to-dusty-rose/15 shadow-rose/20' :
              currentSlide === 3 ? 'bg-gradient-to-br from-lavender/30 to-soft-lavender/20 shadow-lavender/20' :
              'bg-gradient-to-br from-burgundy/20 to-dark-burgundy/15 shadow-burgundy/20'
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
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-primary-text">
              {slide.title}
            </h2>
            <p className={`text-lg font-medium ${
              currentSlide === 0 ? 'text-rose' :
              currentSlide === 1 ? 'text-sage-dark' :
              currentSlide === 2 ? 'text-rose' :
              currentSlide === 3 ? 'text-purple-600' :
              'text-burgundy'
            }`}>
              {slide.subtitle}
            </p>
            <p className="text-secondary-text-thin leading-relaxed">
              {slide.description}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Navigation - Fixed */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-white/95 backdrop-blur-lg">
        <button
          onClick={handleNext}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose to-burgundy text-white font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center active:scale-[0.98] touch-manipulation"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          {isLastSlide ? 'Get Started' : 'Continue'}
          <ChevronRight className="w-5 h-5 ml-2" />
        </button>
        
        {/* Swipe Indicator */}
        <div className="mt-4 text-center text-xs text-gray-400 animate-pulse">
          {currentSlide < slides.length - 1 && 'Swipe left to continue'}
        </div>
      </div>
      </div>
    </div>
  );
};