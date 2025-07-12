'use client';

import React from 'react';
import Image from 'next/image';

interface ChatWelcomeProps {
  visible: boolean;
}

export const ChatWelcome: React.FC<ChatWelcomeProps> = ({ visible }) => {
  // Read localStorage synchronously to avoid re-render
  const hasEverSentMessage = typeof window !== 'undefined' 
    ? localStorage.getItem('hasEverSentMessage') === 'true'
    : false;

  // Shows minimal version for returning users
  const showMinimal = hasEverSentMessage;

  if (!visible) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 mb-4 text-center animate-fade-in">
      {/* Companion Illustration - Viewport-based dimensions to prevent layout shift */}
      <div className="relative mb-6 w-[25vw] h-[25vw] max-w-24 max-h-24">
        <Image
          src="/illustrations/companion.png"
          alt="Your wellness companion"
          fill
          className="object-contain"
          sizes="(max-width: 768px) 25vw, 96px"
          priority
          placeholder="empty"
        />
      </div>
      
      {/* Welcome Text */}
      <div className="max-w-md mx-auto space-y-4">
        {!showMinimal ? (
          <>
            <p className="text-secondary-text-thin leading-relaxed">
              I create personalized wellness routines, holistic recommendations, and help track your healing journey. 
              How do you want to thrive today?
            </p>
          </>
        ) : (
          <>
            <p className="text-secondary-text-thin text-sm">
              Share more details for better solutions.
            </p>
          </>
        )}
      </div>
    </div>
  );
};