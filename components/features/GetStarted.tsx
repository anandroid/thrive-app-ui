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
      <div className="fixed inset-0 w-full h-[100vh] h-[100dvh] overflow-hidden bg-white">
        {/* Simple, elegant background */}
        <div className="absolute inset-0 z-0">
          {/* Clean gradient background */}
          <div className="absolute inset-0 bg-gradient-to-b from-soft-blush/20 via-white to-soft-lavender/10" />
          
          {/* Subtle top accent */}
          <div className="absolute top-0 left-0 right-0 h-[40vh] bg-gradient-to-b from-rose/5 to-transparent" />
          
          {/* Bottom accent */}
          <div className="absolute bottom-0 left-0 right-0 h-[30vh] bg-gradient-to-t from-sage-light/5 to-transparent" />
          
          {/* Very subtle pattern overlay for texture */}
          <div className="absolute inset-0 opacity-[0.02]" 
               style={{ 
                 backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='0.03'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
               }}
          />
        </div>

        {/* Main Content Area */}
        <div className="relative z-10 w-full h-full flex flex-col">
          {/* Top Spacer */}
          <div className="h-[8vh]" />
          
          {/* Content Container */}
          <div className="flex-1 px-[min(6vw,2rem)] flex flex-col items-center justify-start">
            {/* Logo and illustration container */}
            <div className={`relative w-[min(70vw,300px)] h-[min(25vh,200px)] mb-[min(4vh,2rem)] transition-all duration-1000 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              {/* Decorative elements with viewport units */}
              <div className="absolute -top-[min(2vw,1rem)] -right-[min(2vw,1rem)] text-rose/40 animate-pulse">
                <Sparkles className="w-[min(6vw,1.5rem)] h-[min(6vw,1.5rem)]" />
              </div>
              <div className="absolute -bottom-[min(1vw,0.5rem)] -left-[min(1.5vw,0.75rem)] text-sage/40 animate-pulse" style={{ animationDelay: '1s' }}>
                <Leaf className="w-[min(5vw,1.25rem)] h-[min(5vw,1.25rem)]" />
              </div>
              <div className="absolute top-1/2 -right-[min(3vw,1.5rem)] text-dusty-rose/40 animate-pulse" style={{ animationDelay: '2s' }}>
                <Heart className="w-[min(4vw,1rem)] h-[min(4vw,1rem)]" />
              </div>
              
              {/* Loading placeholder */}
              <div className={`absolute inset-0 transition-all duration-700 ${
                imageLoaded ? 'opacity-0 scale-110' : 'opacity-100 scale-100'
              }`}>
                <div className="w-full h-full flex items-center justify-center">
                  <div className="relative w-[60%] h-[60%]">
                    <div className="absolute inset-0 bg-gradient-to-br from-rose/25 to-dusty-rose/20 rounded-full blur-2xl animate-pulse" />
                    <div className="absolute inset-0 bg-gradient-to-tl from-sage-light/20 to-sage/15 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }} />
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

            {/* Text Content */}
            <div className="text-center space-y-[min(2.5vh,1rem)] max-w-[min(85vw,500px)]">
              <h1 className={`text-[min(8vw,2.25rem)] font-bold transition-all duration-1000 delay-300 ${
                isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}>
                <span className="bg-gradient-to-r from-burgundy via-rose to-dusty-rose bg-clip-text text-transparent">
                  Welcome to Thrive
                </span>
              </h1>
              
              <p className={`text-[min(5vw,1.25rem)] font-medium text-gray-800 transition-all duration-1000 delay-500 ${
                isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}>
                Your natural wellness companion
              </p>
              
              <p className={`text-[min(4vw,1rem)] text-gray-600 leading-relaxed px-[min(2vw,1rem)] transition-all duration-1000 delay-700 ${
                isLoaded ? 'opacity-100' : 'opacity-0'
              }`}>
                Blend timeless natural remedies with modern wellness tracking. Create personalized routines and track your healing journey - all guided by holistic practices, completely private.
              </p>
              
              {/* Feature pills */}
              <div className={`flex flex-wrap justify-center gap-[min(2vw,0.5rem)] pt-[min(2vh,1rem)] transition-all duration-1000 delay-900 ${
                isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}>
                <span className="px-[min(3vw,0.75rem)] py-[min(1.5vw,0.375rem)] text-[min(3.5vw,0.875rem)] bg-rose/10 text-rose-600 font-medium rounded-full border border-rose/20">
                  100% Private
                </span>
                <span className="px-[min(3vw,0.75rem)] py-[min(1.5vw,0.375rem)] text-[min(3.5vw,0.875rem)] bg-sage/10 text-sage-dark font-medium rounded-full border border-sage/20">
                  Natural First
                </span>
                <span className="px-[min(3vw,0.75rem)] py-[min(1.5vw,0.375rem)] text-[min(3.5vw,0.875rem)] bg-dusty-rose/10 text-burgundy font-medium rounded-full border border-dusty-rose/20">
                  Personalized
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Section with proper spacing */}
          <div className={`px-[min(6vw,2rem)] pb-[max(15vh,100px)] transition-all duration-1000 delay-1000 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <div className="space-y-[min(3vh,1rem)]">
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
              
              {/* Get Started Button */}
              <button
                onClick={handleGetStarted}
                className="relative w-full py-[min(4vw,1rem)] min-h-[min(12vw,3rem)] rounded-[min(4vw,1rem)] bg-gradient-to-r from-sage-light to-sage text-white font-semibold text-[min(4.5vw,1.125rem)] shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-[min(2vw,0.5rem)] group overflow-hidden active:scale-[0.98] touch-manipulation"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {/* Button gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-sage to-sage-dark opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Button shine effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                </div>
                
                {/* Button content */}
                <span className="relative font-semibold">Get Started</span>
                <ChevronRight className="relative w-[min(5vw,1.25rem)] h-[min(5vw,1.25rem)] group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Terms Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-[min(4vw,1rem)] bg-black/50 animate-fade-in">
          <div className="bg-white rounded-[min(6vw,1.5rem)] p-[min(6vw,1.5rem)] w-[min(90vw,400px)] max-h-[80vh] overflow-y-auto shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between mb-[min(4vw,1.5rem)]">
              <h2 className="text-[min(6vw,1.5rem)] font-bold text-primary-text">Terms & Conditions</h2>
              <button
                onClick={() => setShowTermsModal(false)}
                className="w-[min(10vw,2.5rem)] h-[min(10vw,2.5rem)] rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors touch-feedback touch-manipulation cursor-pointer"
              >
                <span className="text-[min(5vw,1.25rem)]">&times;</span>
              </button>
            </div>

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

            <button
              onClick={() => setShowTermsModal(false)}
              className="w-full mt-[min(4vw,1.5rem)] py-[min(3vw,0.75rem)] rounded-[min(4vw,1rem)] bg-gradient-to-r from-sage-light to-sage text-white font-medium text-[min(4vw,1rem)] shadow-lg hover:shadow-xl transition-all active:scale-[0.98] touch-manipulation"
            >
              I Understand
            </button>
          </div>
        </div>
      )}
    </>
  );
};