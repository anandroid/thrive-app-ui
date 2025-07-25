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
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
      onClick={handleClose}
    >
      {/* Dark overlay */}
      <div className="fixed inset-0 bg-black/60" />
      
      {/* Tutorial content - centered in viewport */}
      <div 
        className={`fixed bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-[90%] transition-all duration-300 ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        style={{
          position: 'fixed',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          maxHeight: '90vh',
          overflowY: 'auto',
          zIndex: 51
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-all duration-200 touch-feedback touch-manipulation cursor-pointer active:scale-95 active:bg-gray-300"
        >
          <X className="w-5 h-5 text-gray-600" />
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
              className="w-full p-4 rounded-2xl bg-gradient-to-r from-cosmic-200/20 to-bloom-200/20 border-2 border-cosmic-300 hover:from-cosmic-200/30 hover:to-bloom-200/30 transition-all group cursor-pointer touch-feedback touch-manipulation active:scale-[0.98] active:from-cosmic-200/40 active:to-bloom-200/40"
            >
              <div className="flex flex-col items-center space-y-2">
                <div className="relative">
                  {/* Animated arrow pointing down */}
                  <div className="absolute inset-0 w-10 h-10 bg-gradient-to-br from-cosmic-500 to-bloom-500 rounded-full shadow-lg group-hover:shadow-xl transition-shadow animate-pulse" />
                  <ArrowDown className="relative w-10 h-10 text-white p-2 animate-bounce z-10" />
                </div>
                <p className="text-base font-medium text-cosmic-700">
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