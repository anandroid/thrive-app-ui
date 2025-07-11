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
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 mb-4 text-center animate-fade-in">
      {/* Companion Illustration - Viewport-based dimensions */}
      <div className="relative mb-6 w-[25vw] h-[25vw] max-w-24 max-h-24">
        <OptimizedImage
          src="/illustrations/companion.png"
          alt="Your wellness companion"
          fill
          className="object-contain"
          sizes="(max-width: 768px) 25vw, 96px"
          priority
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