'use client';

import React, { useState, useEffect } from 'react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { ChevronRight, Shield, Sparkles, Heart, Leaf, Check } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface GetStartedProps {
  onComplete: () => void;
}

export const GetStarted: React.FC<GetStartedProps> = ({ onComplete }) => {
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    // Trigger animations after component mounts
    setIsLoaded(true);
  }, []);

  const handleGetStarted = () => {
    localStorage.setItem('hasSeenGetStarted', 'true');
    localStorage.setItem('hasAcceptedTerms', 'true');
    onComplete();
  };

  return (
    <>
      <div className="fixed inset-0 w-full h-[100vh] h-[100dvh] overflow-hidden bg-gradient-to-br from-white via-soft-blush/20 to-sage-light/10">
        {/* Modern gradient background with subtle animation */}
        <div className="absolute inset-0 z-0">
          {/* Animated gradient orbs */}
          <div className="absolute top-[10%] left-[10%] w-[min(40vw,200px)] h-[min(40vw,200px)] bg-gradient-to-br from-rose/20 to-burgundy/15 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-[20%] right-[10%] w-[min(50vw,300px)] h-[min(50vw,300px)] bg-gradient-to-br from-sage-light/20 to-sage/15 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
          <div className="absolute top-[50%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 w-[min(60vw,400px)] h-[min(60vw,400px)] bg-gradient-to-br from-soft-lavender/15 to-dusty-rose/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
          
          {/* Subtle grid pattern */}
          <div className="absolute inset-0" 
               style={{ 
                 backgroundImage: `radial-gradient(circle at 1px 1px, rgba(145, 67, 114, 0.03) 1px, transparent 1px)`,
                 backgroundSize: '40px 40px'
               }}
          />
        </div>

        {/* Main Content Area */}
        <div className="relative z-10 w-full h-full flex flex-col">
          {/* Content Container with safe scrolling */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="min-h-full flex flex-col items-center justify-center px-[min(6vw,2rem)] py-[min(8vh,4rem)]">
            {/* Logo and illustration container */}
            <div className={`relative w-[min(80vw,320px)] h-[min(30vh,240px)] mb-[min(5vh,2.5rem)] transition-all duration-1000 transform ${
              isLoaded ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
            }`}>
              {/* Enhanced decorative elements */}
              <div className="absolute -top-[min(3vw,1.5rem)] -right-[min(3vw,1.5rem)] text-rose animate-bounce" style={{ animationDuration: '3s' }}>
                <div className="relative">
                  <Sparkles className="w-[min(7vw,2rem)] h-[min(7vw,2rem)]" />
                  <div className="absolute inset-0 blur-xl bg-rose/30" />
                </div>
              </div>
              <div className="absolute -bottom-[min(2vw,1rem)] -left-[min(2vw,1rem)] text-sage animate-bounce" style={{ animationDelay: '1s', animationDuration: '3s' }}>
                <div className="relative">
                  <Leaf className="w-[min(6vw,1.5rem)] h-[min(6vw,1.5rem)]" />
                  <div className="absolute inset-0 blur-xl bg-sage/30" />
                </div>
              </div>
              <div className="absolute top-1/2 -right-[min(4vw,2rem)] text-dusty-rose animate-bounce" style={{ animationDelay: '2s', animationDuration: '3s' }}>
                <div className="relative">
                  <Heart className="w-[min(5vw,1.25rem)] h-[min(5vw,1.25rem)]" />
                  <div className="absolute inset-0 blur-xl bg-dusty-rose/30" />
                </div>
              </div>
              
              {/* Enhanced loading placeholder */}
              <div className={`absolute inset-0 transition-all duration-700 ${
                imageLoaded ? 'opacity-0 scale-110' : 'opacity-100 scale-100'
              }`}>
                <div className="w-full h-full flex items-center justify-center">
                  <div className="relative w-[70%] h-[70%]">
                    <div className="absolute inset-0 bg-gradient-to-br from-rose/30 to-burgundy/25 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute inset-0 bg-gradient-to-tl from-sage-light/25 to-sage/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
                    <div className="absolute inset-0 bg-gradient-to-r from-soft-lavender/20 to-dusty-rose/15 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
                  </div>
                </div>
              </div>
              
              {/* Main illustration */}
              <div className={`absolute inset-0 transition-all duration-700 ${
                imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}>
                <OptimizedImage
                  src="/illustrations/welcome.png"
                  alt="Welcome to Thrive"
                  fill
                  className="object-contain drop-shadow-xl"
                  priority
                  sizes="(max-width: 768px) 70vw, 300px"
                  onLoad={() => setTimeout(() => setImageLoaded(true), 100)}
                />
              </div>
            </div>

            {/* Enhanced Text Content */}
            <div className="text-center space-y-[min(3vh,1.5rem)] max-w-[min(90vw,600px)]">
              <h1 className={`text-[min(10vw,3rem)] font-extrabold leading-tight transition-all duration-1000 delay-300 ${
                isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}>
                <span className="bg-gradient-to-br from-burgundy via-rose to-sage bg-clip-text text-transparent animate-gradient">
                  Welcome to Thrive
                </span>
              </h1>
              
              <p className={`text-[min(6vw,1.5rem)] font-semibold text-gray-800 transition-all duration-1000 delay-500 ${
                isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}>
                Your natural wellness companion
              </p>
              
              <p className={`text-[min(4.5vw,1.125rem)] text-gray-600 leading-relaxed px-[min(3vw,1.5rem)] transition-all duration-1000 delay-700 ${
                isLoaded ? 'opacity-100' : 'opacity-0'
              }`}>
                Blend timeless natural remedies with modern wellness tracking. Create personalized routines and track your healing journey - all guided by holistic practices, completely private.
              </p>
              
              {/* Enhanced Feature pills with icons */}
              <div className={`flex flex-wrap justify-center gap-[min(3vw,1rem)] pt-[min(3vh,1.5rem)] transition-all duration-1000 delay-900 ${
                isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}>
                <div className="group px-[min(4vw,1rem)] py-[min(2vw,0.5rem)] bg-gradient-to-r from-rose/10 to-burgundy/10 text-rose-600 font-semibold rounded-full border border-rose/20 hover:border-rose/40 transition-all hover:scale-105 cursor-default flex items-center gap-[min(1.5vw,0.375rem)]">
                  <Shield className="w-[min(4vw,1rem)] h-[min(4vw,1rem)]" />
                  <span className="text-[min(3.5vw,0.875rem)]">100% Private</span>
                </div>
                <div className="group px-[min(4vw,1rem)] py-[min(2vw,0.5rem)] bg-gradient-to-r from-sage/10 to-sage-dark/10 text-sage-dark font-semibold rounded-full border border-sage/20 hover:border-sage/40 transition-all hover:scale-105 cursor-default flex items-center gap-[min(1.5vw,0.375rem)]">
                  <Leaf className="w-[min(4vw,1rem)] h-[min(4vw,1rem)]" />
                  <span className="text-[min(3.5vw,0.875rem)]">Natural First</span>
                </div>
                <div className="group px-[min(4vw,1rem)] py-[min(2vw,0.5rem)] bg-gradient-to-r from-dusty-rose/10 to-rose/10 text-burgundy font-semibold rounded-full border border-dusty-rose/20 hover:border-dusty-rose/40 transition-all hover:scale-105 cursor-default flex items-center gap-[min(1.5vw,0.375rem)]">
                  <Heart className="w-[min(4vw,1rem)] h-[min(4vw,1rem)]" />
                  <span className="text-[min(3.5vw,0.875rem)]">Personalized</span>
                </div>
              </div>
            </div>
            </div>
          </div>

          {/* Enhanced Bottom Section with safe spacing for Safari */}
          <div className={`px-[min(6vw,2rem)] pb-[max(20vh,120px)] transition-all duration-1000 delay-1000 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <div className="space-y-[min(4vh,1.5rem)]">
              {/* Terms Notice */}
              <div className="text-center">
                <p className="text-[min(3.5vw,0.875rem)] text-gray-600">
                  By continuing, you accept our{' '}
                  <button
                    onClick={() => setShowTermsModal(true)}
                    className="text-burgundy font-semibold underline decoration-burgundy/30 hover:decoration-burgundy/60 transition-all active:scale-95 touch-manipulation"
                  >
                    Terms & Conditions
                  </button>
                </p>
              </div>
              
              {/* Premium Get Started Button with all effects */}
              <Button
                onClick={handleGetStarted}
                variant="gradient"
                size="lg"
                fullWidth
                springAnimation
                gradientOverlay
                cardGlow
                haptic="medium"
                shadow="xl"
                gradient={{
                  from: 'sage-light',
                  to: 'sage',
                  hoverFrom: 'sage',
                  hoverTo: 'sage-dark',
                  activeFrom: 'sage-light/40',
                  activeTo: 'sage/30',
                  direction: 'to-r'
                }}
                rounded="3xl"
                className="relative min-h-[min(14vw,3.5rem)] text-[min(5vw,1.25rem)] font-bold"
                icon={<ChevronRight className="w-[min(6vw,1.5rem)] h-[min(6vw,1.5rem)]" />}
                iconPosition="right"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Terms Modal with Modal component */}
      <Modal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        title="Terms & Conditions"
        size="lg"
        className="max-w-[min(90vw,600px)]"
      >
        <div className="space-y-[min(4vw,1.5rem)] text-secondary-text">

            <div className="space-y-[min(4vw,1.5rem)] text-secondary-text">
              <div>
                <h3 className="font-semibold text-primary-text mb-[min(2vw,0.5rem)] flex items-center text-[min(4vw,1rem)]">
                  <Shield className="w-[min(5vw,1.25rem)] h-[min(5vw,1.25rem)] mr-[min(2vw,0.5rem)] text-sage" />
                  Medical Disclaimer
                </h3>
                <p className="text-[min(3.5vw,0.875rem)] leading-relaxed">
                  Thrive is a wellness companion app designed to support your health journey. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare professionals before making any changes to your health routine, medications, or lifestyle.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-primary-text mb-[min(2vw,0.5rem)] text-[min(4vw,1rem)]">Your Privacy Matters</h3>
                <p className="text-[min(3.5vw,0.875rem)] leading-relaxed">
                  We respect your privacy completely. All your personal data, journals, routines, and health information are stored locally on your device. We do not collect, store, or have access to any of your personal information.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-primary-text mb-[min(2vw,0.5rem)] text-[min(4vw,1rem)]">Personalized Recommendations</h3>
                <p className="text-[min(3.5vw,0.875rem)] leading-relaxed">
                  Our recommendation engine may analyze your inputs to suggest wellness routines, natural remedies, and health practices tailored to your needs. These suggestions are generated based on patterns and best practices, but should always be discussed with healthcare providers before implementation.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-primary-text mb-[min(2vw,0.5rem)] text-[min(4vw,1rem)]">Data Storage</h3>
                <p className="text-[min(3.5vw,0.875rem)] leading-relaxed">
                  All data is stored locally on your device using secure browser storage. You have complete control over your data and can export or delete it at any time through the app settings.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-primary-text mb-[min(2vw,0.5rem)] text-[min(4vw,1rem)]">Use at Your Own Risk</h3>
                <p className="text-[min(3.5vw,0.875rem)] leading-relaxed">
                  By using Thrive, you acknowledge that you are responsible for your own health decisions. The app provides tools and suggestions to support your wellness journey, but ultimate decisions about your health should be made in consultation with qualified professionals.
                </p>
              </div>
            </div>
          
          <Button
            onClick={() => setShowTermsModal(false)}
            variant="gradient"
            fullWidth
            springAnimation
            gradientOverlay
            cardGlow
            haptic="medium"
            gradient={{
              from: 'sage-light',
              to: 'sage',
              activeFrom: 'sage-light/40',
              activeTo: 'sage/30'
            }}
            className="mt-[min(6vw,2rem)]"
            icon={<Check className="w-[min(5vw,1.25rem)] h-[min(5vw,1.25rem)]" />}
          >
            I Understand
          </Button>
        </div>
      </Modal>
    </>
  );
};