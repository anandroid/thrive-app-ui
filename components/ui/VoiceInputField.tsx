'use client';

import React, { useRef, useEffect } from 'react';

interface VoiceInputFieldProps {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  isActive: boolean;
}

/**
 * VoiceInputField Component
 * 
 * A specialized input field that leverages the native mobile keyboard's
 * voice input functionality. When focused, users can use the keyboard's
 * built-in microphone button which works reliably on Chrome mobile.
 */
export function VoiceInputField({ 
  value, 
  onChange, 
  onFocus,
  onBlur,
  isActive 
}: VoiceInputFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isActive && inputRef.current) {
      // Focus the input to bring up keyboard with voice option
      inputRef.current.focus();
      // Select all text for easy replacement
      inputRef.current.select();
    }
  }, [isActive]);

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={onFocus}
      onBlur={onBlur}
      placeholder="Use keyboard mic button..."
      className="sr-only" // Screen reader only - visually hidden
      // These attributes encourage voice input on mobile keyboards
      autoComplete="off"
      autoCorrect="on"
      autoCapitalize="sentences"
      spellCheck="true"
      enterKeyHint="done"
      inputMode="text"
    />
  );
}