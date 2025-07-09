'use client';

import React, { useState } from 'react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { ChevronRight, Shield } from 'lucide-react';

interface GetStartedProps {
  onComplete: () => void;
}

export const GetStarted: React.FC<GetStartedProps> = ({ onComplete }) => {
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleGetStarted = () => {
    localStorage.setItem('hasSeenGetStarted', 'true');
    localStorage.setItem('hasAcceptedTerms', 'true');
    onComplete();
  };

  return (
    <>
      {/* Loading overlay */}
      {!imageLoaded && (
        <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose"></div>
        </div>
      )}
      
      <div className={`layout-wrapper welcome-layout transition-opacity duration-300 ${!imageLoaded ? 'opacity-0' : 'opacity-100'}`}>
        {/* Background Layer */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-soft-blush/80 via-white to-soft-lavender/30" />
          <div className="absolute top-20 -right-20 w-96 h-96 rounded-full bg-gradient-to-br from-rose/20 to-dusty-rose/20 blur-3xl animate-pulse-slow" />
        </div>

        {/* Scrollable Content */}
        <div className="layout-content relative z-10">
          <div className="max-w-md mx-auto w-full px-6 py-4 sm:py-6 md:py-8 flex flex-col items-center justify-center gap-4">
            {/* Welcome Illustration */}
            <div className="relative w-full h-48 sm:h-56 md:h-64 mb-4 sm:mb-6 md:mb-8 group">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-rose/20 to-burgundy/20 shadow-2xl shadow-rose/30" />
              <div className="absolute inset-0 rounded-3xl backdrop-blur-sm" />
              <OptimizedImage
                src="/illustrations/welcome.png"
                alt="Welcome to Thrive"
                fill
                className="object-contain p-4 sm:p-5 md:p-6 relative z-10"
                priority
                sizes="(max-width: 768px) 80vw, 400px"
                onLoad={() => setImageLoaded(true)}
              />
            </div>

            {/* Text Content */}
            <div className="text-center space-y-3 sm:space-y-4">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-burgundy to-rose bg-clip-text text-transparent">
                Welcome to Thrive
              </h1>
              <p className="text-base sm:text-lg font-medium text-secondary-text">
                Your personal wellness companion
              </p>
              <p className="text-sm sm:text-base text-secondary-text-thin leading-relaxed max-w-sm mx-auto px-2">
                Track your healing journey, create gentle daily routines, and discover natural wellness wisdom - all while keeping your data completely private.
              </p>
            </div>

          </div>
        </div>

        {/* Bottom Section - Fixed with Terms and Button */}
        <div className="layout-footer">
          {/* Terms Notice - Always visible */}
          <div className="text-center mb-3">
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
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors touch-feedback"
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