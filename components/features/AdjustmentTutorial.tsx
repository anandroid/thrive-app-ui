'use client';

import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { X, ArrowDown, Edit2, Plus, Minus, Clock } from 'lucide-react';

interface AdjustmentTutorialProps {
  onClose: () => void;
  onArrowClick?: () => void;
}

export const AdjustmentTutorial: React.FC<AdjustmentTutorialProps> = ({ onClose, onArrowClick }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Delay to ensure smooth transition
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  if (!mounted) return null;

  const modalContent = (
    <>
      {/* Dark overlay - prevents interaction with background */}
      <div 
        className={`fixed inset-0 z-[9998] bg-black/60 transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
        style={{ 
          touchAction: 'none',
          overscrollBehavior: 'none'
        }}
      />
      
      {/* Modal positioned in center of current viewport */}
      <div 
        className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] bg-white rounded-3xl shadow-2xl p-[min(6vw,1.5rem)] w-[90vw] max-w-sm transition-all duration-300 ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-[min(4vw,1rem)] right-[min(4vw,1rem)] w-[min(10vw,2.5rem)] h-[min(10vw,2.5rem)] rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-all duration-200 touch-feedback touch-manipulation cursor-pointer active:scale-95 active:bg-gray-300"
        >
          <X className="w-[min(5vw,1.25rem)] h-[min(5vw,1.25rem)] text-gray-600" />
        </button>
        
        {/* Title */}
        <h3 className="text-[min(5vw,1.125rem)] font-semibold text-primary-text mb-[min(4vw,1rem)]">
          Customize Your Routine! ✨
        </h3>
        
        {/* Feature icons */}
        <div className="grid grid-cols-2 gap-[min(4vw,1rem)] mb-[min(4vw,1rem)]">
          <div className="text-center">
            <div className="w-[min(12vw,3rem)] h-[min(12vw,3rem)] mx-auto mb-[min(2vw,0.5rem)] rounded-xl bg-gradient-to-br from-sage-light/30 to-sage/20 flex items-center justify-center">
              <Plus className="w-[min(6vw,1.5rem)] h-[min(6vw,1.5rem)] text-sage-dark" />
            </div>
            <p className="text-xs text-gray-700">Add Steps</p>
          </div>
          <div className="text-center">
            <div className="w-[min(12vw,3rem)] h-[min(12vw,3rem)] mx-auto mb-[min(2vw,0.5rem)] rounded-xl bg-gradient-to-br from-rose/20 to-dusty-rose/15 flex items-center justify-center">
              <Minus className="w-[min(6vw,1.5rem)] h-[min(6vw,1.5rem)] text-rose" />
            </div>
            <p className="text-xs text-gray-700">Remove Steps</p>
          </div>
          <div className="text-center">
            <div className="w-[min(12vw,3rem)] h-[min(12vw,3rem)] mx-auto mb-[min(2vw,0.5rem)] rounded-xl bg-gradient-to-br from-slate-300/30 to-slate-400/20 flex items-center justify-center">
              <Clock className="w-[min(6vw,1.5rem)] h-[min(6vw,1.5rem)] text-slate-700" />
            </div>
            <p className="text-xs text-gray-700">Change Times</p>
          </div>
          <div className="text-center">
            <div className="w-[min(12vw,3rem)] h-[min(12vw,3rem)] mx-auto mb-[min(2vw,0.5rem)] rounded-xl bg-gradient-to-br from-lavender/25 to-dusty-rose/20 flex items-center justify-center">
              <Edit2 className="w-[min(6vw,1.5rem)] h-[min(6vw,1.5rem)] text-purple-600" />
            </div>
            <p className="text-xs text-gray-700">Edit Details</p>
          </div>
        </div>
        
        {/* Description */}
        <p className="text-[min(3.5vw,0.875rem)] text-secondary-text-thin leading-relaxed mb-[min(4vw,1rem)]">
          Your routine can evolve with you! Simply click <strong>&quot;Adjust Routine&quot;</strong> and tell me what you&apos;d like to change in natural language. I&apos;ll update your routine accordingly.
        </p>
        
        {/* Clickable arrow section */}
        <div className="mt-[min(4vw,1rem)] mb-[min(2vw,0.5rem)]">
          <p className="text-[min(3.5vw,0.875rem)] text-center text-gray-600 mb-[min(3vw,0.75rem)]">
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
            className="w-full p-[min(4vw,1rem)] rounded-2xl bg-gradient-to-r from-sage-light/20 to-sage/10 border border-sage-light/30 hover:from-sage-light/30 hover:to-sage/20 transition-all group cursor-pointer touch-feedback touch-manipulation active:scale-[0.98] active:from-sage-light/40 active:to-sage/30"
          >
            <div className="flex flex-col items-center space-y-[min(2vw,0.5rem)]">
              <div className="relative">
                {/* Animated arrow pointing down */}
                <div className="absolute inset-0 w-[min(10vw,2.5rem)] h-[min(10vw,2.5rem)] bg-gradient-to-br from-sage-light to-sage rounded-full shadow-lg group-hover:shadow-xl transition-shadow animate-pulse" />
                <ArrowDown className="relative w-[min(10vw,2.5rem)] h-[min(10vw,2.5rem)] text-white p-[min(2vw,0.5rem)] animate-bounce z-10" />
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
          <p className="text-[min(3vw,0.75rem)] text-secondary-text-thin/60 text-center mt-[min(4vw,1rem)]">
            (Last time we&apos;ll show this tip)
          </p>
        )}
      </div>
    </>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};