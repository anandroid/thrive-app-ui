'use client';

import React, { useState, useEffect } from 'react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { ChevronRight, Shield, Sparkles, Heart, Leaf } from 'lucide-react';

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
      <div className="layout-wrapper welcome-layout">
        {/* Background Layer - Animated gradient mesh */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {/* Base gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-soft-blush/30 via-white to-soft-lavender/20" />
          
          {/* Animated gradient orbs */}
          <div className="absolute inset-0">
            {/* Large orb - top left */}
            <div 
              className={`absolute -top-[20vh] -left-[20vw] w-[60vw] h-[60vw] max-w-[400px] max-h-[400px] rounded-full bg-gradient-to-br from-rose/20 via-dusty-rose/15 to-transparent blur-3xl transition-all duration-[3000ms] ${
                isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
              }`}
              style={{ 
                animation: isLoaded ? 'float 20s ease-in-out infinite' : 'none',
                animationDelay: '0s'
              }}
            />
            
            {/* Medium orb - bottom right */}
            <div 
              className={`absolute -bottom-[15vh] -right-[15vw] w-[50vw] h-[50vw] max-w-[350px] max-h-[350px] rounded-full bg-gradient-to-tl from-sage-light/20 via-sage/10 to-transparent blur-3xl transition-all duration-[3000ms] ${
                isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
              }`}
              style={{ 
                animation: isLoaded ? 'float 25s ease-in-out infinite reverse' : 'none',
                animationDelay: '2s'
              }}
            />
            
            {/* Small orb - center */}
            <div 
              className={`absolute top-[40%] left-[60%] w-[30vw] h-[30vw] max-w-[200px] max-h-[200px] rounded-full bg-gradient-to-br from-soft-lavender/15 via-dusty-rose/10 to-transparent blur-2xl transition-all duration-[3000ms] ${
                isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
              }`}
              style={{ 
                animation: isLoaded ? 'float 15s ease-in-out infinite' : 'none',
                animationDelay: '4s'
              }}
            />
          </div>
          
          {/* Subtle texture overlay */}
          <div className="absolute inset-0 opacity-[0.02]" 
               style={{ 
                 backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
               }}
          />
        </div>

        {/* Content */}
        <div className="layout-content relative z-10">
          <div className="w-full h-full px-[6vw] py-[3vh] flex flex-col items-center justify-center">
            {/* Logo and illustration container */}
            <div className={`relative w-full max-w-[75vw] sm:max-w-[50vw] md:max-w-[35vw] h-[28vh] sm:h-[32vh] md:h-[35vh] mb-[3vh] transition-all duration-1000 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 text-rose/30 animate-pulse">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="absolute -bottom-2 -left-3 text-sage/30 animate-pulse" style={{ animationDelay: '1s' }}>
                <Leaf className="w-5 h-5" />
              </div>
              <div className="absolute top-1/2 -right-6 text-dusty-rose/30 animate-pulse" style={{ animationDelay: '2s' }}>
                <Heart className="w-4 h-4" />
              </div>
              
              {/* Beautiful placeholder - shows while loading */}
              <div className={`absolute inset-0 transition-all duration-700 ${
                imageLoaded ? 'opacity-0 scale-110' : 'opacity-100 scale-100'
              }`}>
                <div className="w-full h-full flex items-center justify-center">
                  {/* Animated placeholder with brand colors */}
                  <div className="relative w-[60%] h-[60%]">
                    <div className="absolute inset-0 bg-gradient-to-br from-rose/20 to-dusty-rose/15 rounded-full blur-2xl animate-pulse" />
                    <div className="absolute inset-0 bg-gradient-to-tl from-sage-light/15 to-sage/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-[50%] h-[50%] bg-gradient-to-br from-soft-blush/30 to-soft-lavender/30 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Main illustration with smooth transition */}
              <div className={`absolute inset-0 transition-all duration-700 ${
                imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}>
                <OptimizedImage
                  src="/illustrations/welcome.png"
                  alt="Welcome to Thrive"
                  fill
                  className="object-contain drop-shadow-lg"
                  priority
                  sizes="(max-width: 768px) 75vw, 35vw"
                  onLoad={() => {
                    // Small delay to ensure smooth transition
                    setTimeout(() => setImageLoaded(true), 100);
                  }}
                />
              </div>
            </div>

            {/* Text Content with staggered animations */}
            <div className="text-center space-y-[2vh] max-w-[90vw] sm:max-w-[80vw] md:max-w-[60vw]">
              <h1 className={`text-[min(7vw,2.5rem)] sm:text-[min(5.5vw,3rem)] md:text-[min(4vw,3.5rem)] font-bold transition-all duration-1000 delay-300 ${
                isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}>
                <span className="bg-gradient-to-r from-burgundy via-rose to-dusty-rose bg-clip-text text-transparent animate-gradient-shift">
                  Welcome to Thrive
                </span>
              </h1>
              
              <p className={`text-[min(4.5vw,1.25rem)] sm:text-[min(3.5vw,1.375rem)] md:text-[min(2.5vw,1.25rem)] font-medium text-secondary-text transition-all duration-1000 delay-500 ${
                isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}>
                Your natural wellness companion
              </p>
              
              <p className={`text-[min(3.8vw,1rem)] sm:text-[min(2.8vw,1.125rem)] md:text-[min(2vw,1.125rem)] text-secondary-text-thin leading-relaxed transition-all duration-1000 delay-700 ${
                isLoaded ? 'opacity-100' : 'opacity-0'
              }`}>
                Blend timeless natural remedies with modern wellness tracking. Create personalized wellness routines, journal your healing journey, and seamlessly integrate any medications you take - all guided by holistic practices, completely private.
              </p>
              
              {/* Feature pills */}
              <div className={`flex flex-wrap justify-center gap-2 pt-[1vh] transition-all duration-1000 delay-900 ${
                isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}>
                <span className="px-3 py-1 text-[min(3vw,0.75rem)] bg-rose/10 text-rose rounded-full border border-rose/20">
                  100% Private
                </span>
                <span className="px-3 py-1 text-[min(3vw,0.75rem)] bg-sage/10 text-sage-dark rounded-full border border-sage/20">
                  Natural First
                </span>
                <span className="px-3 py-1 text-[min(3vw,0.75rem)] bg-dusty-rose/10 text-burgundy rounded-full border border-dusty-rose/20">
                  Personalized
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className={`layout-footer transition-all duration-1000 delay-1000 ${
          isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className="space-y-3">
            {/* Terms Notice */}
            <div className="text-center">
              <p className="text-[min(3.5vw,0.875rem)] text-gray-600">
                By continuing, you accept our{' '}
                <button
                  onClick={() => setShowTermsModal(true)}
                  className="text-burgundy font-medium underline decoration-burgundy/30 hover:decoration-burgundy/60 transition-all"
                >
                  Terms & Conditions
                </button>
              </p>
            </div>
            
            {/* Get Started Button with enhanced styling */}
            <button
              onClick={handleGetStarted}
              className="relative w-full py-[2vh] min-h-[50px] rounded-2xl bg-gradient-to-r from-sage-light to-sage text-white font-semibold text-[min(4vw,1.125rem)] shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 group overflow-hidden active:scale-[0.98] touch-manipulation"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {/* Button background animation */}
              <div className="absolute inset-0 bg-gradient-to-r from-sage to-sage-dark opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Button content */}
              <span className="relative">Get Started</span>
              <ChevronRight className="relative w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
            
            {/* Safe area spacer */}
            <div className="h-2" aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Terms Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-primary-text">Terms & Conditions</h2>
              <button
                onClick={() => setShowTermsModal(false)}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors touch-feedback touch-manipulation cursor-pointer"
              >
                <span className="text-xl">&times;</span>
              </button>
            </div>

            <div className="space-y-6 text-secondary-text">
              <div>
                <h3 className="font-semibold text-primary-text mb-2 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-sage" />
                  Medical Disclaimer
                </h3>
                <p className="text-sm leading-relaxed">
                  Thrive is a wellness companion app designed to support your health journey. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare professionals before making any changes to your health routine, medications, or lifestyle.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-primary-text mb-2">Your Privacy Matters</h3>
                <p className="text-sm leading-relaxed">
                  We respect your privacy completely. All your personal data, journals, routines, and health information are stored locally on your device. We do not collect, store, or have access to any of your personal information.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-primary-text mb-2">Personalized Recommendations</h3>
                <p className="text-sm leading-relaxed">
                  Our recommendation engine may analyze your inputs to suggest wellness routines, natural remedies, and health practices tailored to your needs. These suggestions are generated based on patterns and best practices, but should always be discussed with healthcare providers before implementation.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-primary-text mb-2">Data Storage</h3>
                <p className="text-sm leading-relaxed">
                  All data is stored locally on your device using secure browser storage. You have complete control over your data and can export or delete it at any time through the app settings.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-primary-text mb-2">Use at Your Own Risk</h3>
                <p className="text-sm leading-relaxed">
                  By using Thrive, you acknowledge that you are responsible for your own health decisions. The app provides tools and suggestions to support your wellness journey, but ultimate decisions about your health should be made in consultation with qualified professionals.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowTermsModal(false)}
              className="w-full mt-6 py-3 rounded-2xl bg-gradient-to-r from-sage-light to-sage text-white font-medium shadow-lg hover:shadow-xl transition-all active:scale-[0.98] touch-manipulation"
            >
              I Understand
            </button>
          </div>
        </div>
      )}
    </>
  );
};