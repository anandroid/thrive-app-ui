'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Mic } from 'lucide-react';

interface EnhancedVoiceInputProps {
  value: string;
  onChange: (value: string) => void;
  isActive: boolean;
  onClose: () => void;
}

/**
 * EnhancedVoiceInput Component
 * 
 * Provides the best possible UX for voice input on mobile:
 * 1. Shows a visual guide pointing to keyboard mic
 * 2. Auto-focuses input to bring up keyboard
 * 3. Provides clear instructions
 */
export function EnhancedVoiceInput({ 
  value, 
  onChange, 
  isActive,
  onClose
}: EnhancedVoiceInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (isActive && inputRef.current) {
      // Focus to bring up keyboard
      inputRef.current.focus();
      inputRef.current.select();
      
      // Show visual guide after keyboard appears
      setTimeout(() => setShowGuide(true), 300);
    } else {
      setShowGuide(false);
    }
  }, [isActive]);

  if (!isActive) return null;

  return (
    <>
      {/* Semi-transparent overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Visual guide overlay */}
      {showGuide && (
        <div className="fixed inset-x-0 bottom-0 z-50 pointer-events-none">
          {/* Arrow pointing to keyboard mic area */}
          <div className="absolute bottom-[280px] right-[20px] animate-bounce">
            <div className="bg-yellow-400 text-black px-3 py-2 rounded-lg shadow-lg text-sm font-semibold">
              Tap here! 👇
            </div>
            <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-yellow-400 mx-auto" />
          </div>
          
          {/* Instructions */}
          <div className="absolute inset-x-4 bottom-[350px]">
            <div className="bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-rose/20 to-burgundy/20 rounded-full flex items-center justify-center">
                <Mic className="w-6 h-6 text-burgundy" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Use Your Keyboard&apos;s Voice Input</p>
                <p className="text-sm text-gray-600 mt-0.5">
                  Tap the microphone button on your keyboard below
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Hidden input that triggers keyboard */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => {
          // Delay closing to allow keyboard mic tap
          setTimeout(onClose, 200);
        }}
        placeholder="Voice input will appear here..."
        className="fixed bottom-[100px] left-4 right-4 px-4 py-3 bg-white rounded-lg border-2 border-rose/30 text-base z-50 focus:outline-none focus:border-rose/50"
        // Encourage voice-friendly keyboard
        autoComplete="off"
        autoCorrect="on"
        autoCapitalize="sentences"
        spellCheck="true"
        enterKeyHint="done"
      />
    </>
  );
}