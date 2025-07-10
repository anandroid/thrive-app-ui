'use client';

import React, { useEffect, useState } from 'react';
import { X, ArrowDown, Edit2, Plus, Minus, Clock } from 'lucide-react';

interface AdjustmentTutorialProps {
  onClose: () => void;
  onArrowClick?: () => void;
}

export const AdjustmentTutorial: React.FC<AdjustmentTutorialProps> = ({ onClose, onArrowClick }) => {
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
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors touch-feedback touch-manipulation cursor-pointer"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>
        
        {/* Title */}
        <h3 className="text-lg font-semibold text-primary-text mb-4">
          Customize Your Routine! ✨
        </h3>
        
        {/* Feature icons */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br from-sage-light/30 to-sage/20 flex items-center justify-center">
              <Plus className="w-6 h-6 text-sage-dark" />
            </div>
            <p className="text-xs text-gray-700">Add Steps</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br from-rose/20 to-dusty-rose/15 flex items-center justify-center">
              <Minus className="w-6 h-6 text-rose" />
            </div>
            <p className="text-xs text-gray-700">Remove Steps</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br from-slate-300/30 to-slate-400/20 flex items-center justify-center">
              <Clock className="w-6 h-6 text-slate-700" />
            </div>
            <p className="text-xs text-gray-700">Change Times</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br from-lavender/25 to-dusty-rose/20 flex items-center justify-center">
              <Edit2 className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-xs text-gray-700">Edit Details</p>
          </div>
        </div>
        
        {/* Description */}
        <p className="text-sm text-secondary-text-thin leading-relaxed mb-4">
          Your routine can evolve with you! Simply click <strong>&quot;Adjust Routine&quot;</strong> and tell me what you&apos;d like to change in natural language. I&apos;ll update your routine accordingly.
        </p>
        
        {/* Clickable arrow section */}
        <div className="mt-4 mb-2">
          <p className="text-sm text-center text-gray-600 mb-3">
            Try it now!
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
                Adjust Routine
              </p>
              <p className="text-xs text-secondary-text-thin">
                Click to see how it works!
              </p>
            </div>
          </button>
        </div>
        
        {/* Show tip count if this is the second showing */}
        {parseInt(localStorage.getItem('adjustmentTutorialCount') || '0') === 1 && (
          <p className="text-xs text-secondary-text-thin/60 text-center mt-4">
            (Last time we&apos;ll show this tip)
          </p>
        )}
      </div>
    </div>
  );
};