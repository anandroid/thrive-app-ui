'use client';

import React, { useState } from 'react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { ChevronRight, Shield } from 'lucide-react';

interface GetStartedProps {
  onComplete: () => void;
}

export const GetStarted: React.FC<GetStartedProps> = ({ onComplete }) => {
  const [showTermsModal, setShowTermsModal] = useState(false);

  const handleGetStarted = () => {
    localStorage.setItem('hasSeenGetStarted', 'true');
    localStorage.setItem('hasAcceptedTerms', 'true');
    onComplete();
  };

  return (
    <>
      <div className="layout-wrapper welcome-layout">
        {/* Background Layer - Always visible */}
        <div className="absolute inset-0 z-0">
          {/* Soft gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-soft-blush/50 via-white/80 to-soft-lavender/20" />
          
          {/* Animated floating elements - subtle and minimal */}
          <div className="absolute top-[15%] left-[10%] w-[15vw] h-[15vw] max-w-24 max-h-24 rounded-full bg-gradient-to-br from-rose/10 to-dusty-rose/5 blur-2xl animate-pulse-slow" />
          <div className="absolute top-[60%] right-[15%] w-[12vw] h-[12vw] max-w-20 max-h-20 rounded-full bg-gradient-to-br from-sage-light/10 to-sage/5 blur-2xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-[30%] left-[20%] w-[10vw] h-[10vw] max-w-16 max-h-16 rounded-full bg-gradient-to-br from-soft-lavender/10 to-dusty-rose/5 blur-2xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
          
          {/* Subtle gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-transparent" />
        </div>

        {/* Scrollable Content */}
        <div className="layout-content relative z-10">
          <div className="w-full h-full px-[5vw] py-[2vh] sm:py-[3vh] md:py-[4vh] flex flex-col items-center justify-center">
            {/* Welcome Illustration - Viewport based sizing */}
            <div className="relative w-full max-w-[80vw] sm:max-w-[60vw] md:max-w-[40vw] h-[30vh] sm:h-[35vh] md:h-[40vh] mb-[2vh] sm:mb-[3vh] md:mb-[4vh]">
              <OptimizedImage
                src="/illustrations/welcome.png"
                alt="Welcome to Thrive"
                fill
                className="object-contain"
                priority
                sizes="(max-width: 768px) 80vw, 40vw"
              />
            </div>

            {/* Text Content - Viewport based spacing */}
            <div className="text-center space-y-[1.5vh] sm:space-y-[2vh]">
              <h1 className="text-[min(6vw,2rem)] sm:text-[min(5vw,2.5rem)] md:text-[min(3.5vw,3rem)] font-bold bg-gradient-to-r from-burgundy to-rose bg-clip-text text-transparent">
                Welcome to Thrive
              </h1>
              <p className="text-[min(4vw,1.125rem)] sm:text-[min(3vw,1.25rem)] md:text-[min(2vw,1.125rem)] font-medium text-secondary-text">
                Your natural wellness companion
              </p>
              <p className="text-[min(3.5vw,0.875rem)] sm:text-[min(2.5vw,1rem)] md:text-[min(1.5vw,1rem)] text-secondary-text-thin/80 leading-relaxed max-w-[85vw] sm:max-w-[70vw] md:max-w-[50vw] mx-auto">
                Blend timeless natural remedies with modern wellness tracking. Create personalized wellness routines, journal your healing journey, and seamlessly integrate any medications you take - all guided by holistic practices, completely private.
              </p>
            </div>

          </div>
        </div>

        {/* Bottom Section - Fixed with Terms and Button */}
        <div className="layout-footer">
          <div className="space-y-3">
            {/* Terms Notice - Always visible */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                By continuing, you accept our{' '}
                <button
                  onClick={() => setShowTermsModal(true)}
                  className="text-burgundy font-medium underline hover:no-underline transition-all"
                >
                  Terms & Conditions
                </button>
              </p>
            </div>
            
            {/* Get Started Button */}
            <button
              onClick={handleGetStarted}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-sage-light/70 to-sage/70 text-white font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center active:scale-[0.98] touch-manipulation"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              Get Started
              <ChevronRight className="w-5 h-5 ml-2" />
            </button>
            
            {/* Extra spacer for browsers with bottom UI - invisible but takes space */}
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
              className="w-full mt-6 py-3 rounded-2xl bg-gradient-to-r from-sage-light/70 to-sage/70 text-white font-medium shadow-lg hover:shadow-xl transition-all active:scale-[0.98] touch-manipulation"
            >
              I Understand
            </button>
          </div>
        </div>
      )}
    </>
  );
};