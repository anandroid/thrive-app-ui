'use client';

import React, { useEffect, useState } from 'react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { X, ArrowDown } from 'lucide-react';

interface ThrivingTutorialProps {
  onClose: () => void;
  actionableItemText?: string;
  onArrowClick?: () => void;
}

export const ThrivingTutorial: React.FC<ThrivingTutorialProps> = ({ onClose, actionableItemText, onArrowClick }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Delay to ensure smooth transition
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div 
      className={`fixed inset-0 z-50 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60" />
      
      {/* Tutorial content */}
      <div 
        className={`absolute left-1/2 -translate-x-1/2 bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-[90%] transition-all duration-300 ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        style={{
          top: '15%',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>
        
        {/* Title */}
        <h3 className="text-lg font-semibold text-primary-text mb-4">
          Meet Your Thrivings! 🌱
        </h3>
        
        {/* Illustrations */}
        <div className="flex justify-center space-x-4 mb-4">
          <div className="text-center">
            <div className="relative w-20 h-20 mb-2">
              <OptimizedImage
                src="/illustrations/routine.png"
                alt="Wellness Routines"
                fill
                className="object-contain"
                sizes="80px"
              />
            </div>
            <p className="text-xs font-medium text-gray-700">Routines</p>
          </div>
          <div className="text-center">
            <div className="relative w-20 h-20 mb-2">
              <OptimizedImage
                src="/illustrations/journey_story_illustration.png"
                alt="Wellness Journeys"
                fill
                className="object-contain"
                sizes="80px"
              />
            </div>
            <p className="text-xs font-medium text-gray-700">Journals</p>
          </div>
        </div>
        
        {/* Description */}
        <p className="text-sm text-secondary-text-thin leading-relaxed mb-4">
          <strong>Thrivings</strong> are your personalized wellness plans. Create daily <strong>routines</strong> with gentle reminders, or write <strong>journal</strong> to track your healing story over time.
        </p>
        
        {/* Show routine/journey name with clickable arrow */}
        {actionableItemText && (
          <div className="mt-4 mb-2">
            <p className="text-sm text-center text-gray-600 mb-3">
              Tap the suggestion below to get started!
            </p>
            
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(() => {
                  onClose();
                  onArrowClick?.();
                }, 300);
              }}
              className="w-full p-4 rounded-2xl bg-gradient-to-r from-sage-light/20 to-sage/10 border border-sage-light/30 hover:from-sage-light/30 hover:to-sage/20 transition-all group cursor-pointer"
            >
              <div className="flex flex-col items-center space-y-2">
                <div className="relative">
                  {/* Animated arrow pointing down */}
                  <div className="absolute inset-0 w-10 h-10 bg-gradient-to-br from-sage-light to-sage rounded-full shadow-lg group-hover:shadow-xl transition-shadow animate-pulse" />
                  <ArrowDown className="relative w-10 h-10 text-white p-2 animate-bounce z-10" />
                </div>
                <p className="text-base font-medium text-sage-dark">
                  {actionableItemText}
                </p>
                <p className="text-xs text-secondary-text-thin">
                  Click here to try it!
                </p>
              </div>
            </button>
          </div>
        )}
        
        {/* Show tip count if this is the second showing */}
        {parseInt(localStorage.getItem('thrivingTutorialCount') || '0') === 1 && (
          <p className="text-xs text-secondary-text-thin/60 text-center mt-4">
            (Last time we&apos;ll show this tip)
          </p>
        )}
      </div>
    </div>
  );
};