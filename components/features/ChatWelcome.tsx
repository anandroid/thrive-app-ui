'use client';

import React, { useState, useEffect } from 'react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

interface ChatWelcomeProps {
  visible: boolean;
}

export const ChatWelcome: React.FC<ChatWelcomeProps> = ({ visible }) => {
  const [hasEverSentMessage, setHasEverSentMessage] = useState(false);

  useEffect(() => {
    // Check if user has ever sent a message
    const hasSent = localStorage.getItem('hasEverSentMessage') === 'true';
    setHasEverSentMessage(hasSent);
  }, []);

  // Shows minimal version for returning users
  const showMinimal = hasEverSentMessage;

  if (!visible) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center animate-fade-in">
      {/* Companion Illustration */}
      <div className="relative w-48 h-48 mb-6">
        <OptimizedImage
          src="/illustrations/companion.png"
          alt="Your wellness companion"
          fill
          className="object-contain"
          sizes="192px"
          priority
        />
      </div>
      
      {/* Welcome Text */}
      <div className="max-w-md mx-auto space-y-4">
        {!showMinimal ? (
          <>
            <h2 className="text-2xl font-bold text-primary-text">
              Welcome to Your Wellness Journey
            </h2>
            <p className="text-secondary-text-thin leading-relaxed">
              I&apos;m here to help you create personalized wellness routines and track your healing story. 
              Share what&apos;s on your mind, and let&apos;s work together towards better health.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-primary-text">
              How can I help you today?
            </h2>
            <p className="text-secondary-text-thin text-sm">
              Let&apos;s continue your wellness journey together.
            </p>
          </>
        )}
      </div>
    </div>
  );
};