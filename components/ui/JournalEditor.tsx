'use client';

import React, { useRef, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useSpeechToText } from '@/hooks/useSpeechToText';

interface JournalEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
}

export function JournalEditor({
  value,
  onChange,
  placeholder = "Write your thoughts...",
  className = "",
  rows = 4
}: JournalEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Speech to text integration
  const { isListening, isSupported, toggleListening } = useSpeechToText({
    onTranscript: (text) => {
      // Append transcript to existing value
      const newValue = value ? `${value} ${text}` : text;
      onChange(newValue);
    },
    onStopListening: () => {
      // Focus back on textarea when done
      textareaRef.current?.focus();
    }
  });

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <div className={`relative ${className}`}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={isListening ? "Listening..." : placeholder}
        disabled={isListening}
        rows={rows}
        className={`w-full p-3 rounded-xl border border-gray-200 focus:border-rose focus:ring-2 focus:ring-rose/20 resize-none transition-all ${
          isListening ? 'bg-gray-50' : ''
        }`}
        style={{ minHeight: `${rows * 1.5}rem` }}
      />
      
      {/* Microphone button */}
      {isSupported && (
        <button
          onClick={toggleListening}
          className={`absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-all touch-feedback touch-manipulation ${
            isListening 
              ? 'bg-red-500 text-white animate-pulse shadow-lg' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {isListening ? (
            <MicOff className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </button>
      )}
    </div>
  );
}