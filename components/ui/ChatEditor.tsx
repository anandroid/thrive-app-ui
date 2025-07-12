'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { useWhisperTranscription } from '@/hooks/useWhisperTranscription';
import { EnhancedVoiceInput } from './EnhancedVoiceInput';

// Inline keyframe style for spinner
const spinnerStyle = `
  @keyframes chatSpinner {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

interface ChatEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (messageOverride?: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  autoFocus?: boolean;
  onFocus?: () => void;
}

export function ChatEditor({
  value,
  onChange,
  onSubmit,
  placeholder = "Ask about your wellness journey...",
  isLoading = false,
  disabled = false,
  className = "",
  autoFocus = false,
  onFocus
}: ChatEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [useNativeVoice, setUseNativeVoice] = useState(false);
  const [useWhisper, setUseWhisper] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
  
  // Check if on mobile (any mobile browser)
  const isMobile = typeof window !== 'undefined' && 
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  // Load voice input preference
  useEffect(() => {
    if (!isMobile) {
      const savedMethod = localStorage.getItem('voiceInputMethod');
      setUseWhisper(savedMethod === 'whisper');
    }
  }, [isMobile]);
  
  // Whisper transcription (more reliable, works on all browsers)
  const { 
    isRecording: isWhisperRecording, 
    isTranscribing,
    toggleRecording: toggleWhisperRecording,
    isSupported: isWhisperSupported 
  } = useWhisperTranscription({
    onTranscript: (text) => {
      const newValue = value ? `${value} ${text}` : text;
      onChange(newValue);
      setTranscriptionError(null);
      // Auto-submit if ends with punctuation
      if (text.trim().match(/[.!?]$/)) {
        setTimeout(() => {
          if (newValue.trim() && !isLoading && !disabled) {
            onSubmit();
          }
        }, 100);
      }
    },
    onError: (error) => {
      setTranscriptionError(error);
      // Fall back to Web Speech API if Whisper fails
      setUseWhisper(false);
    },
    onStopRecording: () => {
      textareaRef.current?.focus();
    }
  });

  // Web Speech API (fallback)
  const { isListening, isSupported: isSpeechSupported, toggleListening } = useSpeechToText({
    onTranscript: (text) => {
      // Append transcript to existing value (doesn't replace)
      const newValue = value ? `${value} ${text}` : text;
      onChange(newValue);  // This triggers parent's onChange handler
      
      // VOICE = TYPING for conversational flow
      // The onChange call above will trigger isUserTyping=true in parent
      // This causes any staged answers to be sent immediately
      if (text.trim()) {
        // Parent component detects this as typing activity
      }
    },
    onStopListening: () => {
      // Focus back on textarea when done for better UX
      textareaRef.current?.focus();
    }
  });

  // Auto-resize textarea based on content and focus state
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      
      if (isFocused || value.trim()) {
        // When focused or has content, allow natural height up to 2 lines
        const scrollHeight = textareaRef.current.scrollHeight;
        textareaRef.current.style.height = `${Math.min(scrollHeight, 64)}px`;
      } else {
        // When not focused and empty, stay single line
        textareaRef.current.style.height = '32px';
      }
    }
  }, [value, isFocused]);

  // Simple focus tracking for styling
  useEffect(() => {
    if (isFocused) {
      document.body.classList.add('keyboard-visible');
    } else {
      document.body.classList.remove('keyboard-visible');
    }
  }, [isFocused]);

  // Auto-focus when requested
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      // Small delay to ensure component is mounted and visible
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [autoFocus]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter, but allow Shift+Enter for new lines
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isLoading && !disabled) {
        onSubmit();
      }
    }
  };

  // Voice input is supported if we have any method available
  const isVoiceSupported = isWhisperSupported || isSpeechSupported || isMobile;
  const isActivelyListening = isWhisperRecording || isListening || useNativeVoice;

  // Custom toggle with Whisper priority
  const handleMicToggle = () => {
    if (isMobile) {
      // On mobile, show enhanced UI for keyboard voice
      setUseNativeVoice(!useNativeVoice);
    } else if (useWhisper || !isSpeechSupported) {
      // Use Whisper if selected or Speech API not available
      toggleWhisperRecording();
    } else {
      // Desktop with Speech API available
      toggleListening();
    }
  };

  // Long press to switch between Whisper and Speech API on desktop
  const handleMicLongPress = () => {
    if (!isMobile) {
      const newMethod = !useWhisper;
      setUseWhisper(newMethod);
      localStorage.setItem('voiceInputMethod', newMethod ? 'whisper' : 'browser');
      // Stop any active recording
      if (isListening) toggleListening();
      if (isWhisperRecording) toggleWhisperRecording();
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: spinnerStyle }} />
      <div ref={containerRef} className={`chat-input-wrapper ${className} relative`}>
        {/* Enhanced voice input for mobile devices */}
        <EnhancedVoiceInput
          value={value}
          onChange={onChange}
          isActive={useNativeVoice}
          onClose={() => {
            setUseNativeVoice(false);
            // Refocus main textarea
            setTimeout(() => textareaRef.current?.focus(), 100);
          }}
        />
        
        <div className="px-4 py-3">
          <div className="flex items-start gap-2 bg-gray-50 rounded-2xl p-3 transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-rose/20">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                setIsFocused(true);
                onFocus?.();
              }}
              onBlur={() => setIsFocused(false)}
              placeholder={
                isActivelyListening ? "Listening..." : 
                isTranscribing ? "Transcribing..." : 
                placeholder
              }
              disabled={isLoading || disabled || isActivelyListening || isTranscribing}
              rows={1}
              className="flex-1 resize-none bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none text-base leading-relaxed min-h-[32px] max-h-[64px] transition-all pt-0"
              style={{ overflow: 'hidden' }}
            />
            {/* Microphone button */}
            {isVoiceSupported && (
              <button
                onClick={handleMicToggle}
                onContextMenu={(e) => {
                  e.preventDefault();
                  handleMicLongPress();
                }}
                disabled={isLoading || disabled || isTranscribing}
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all touch-feedback touch-manipulation ${
                  isActivelyListening
                    ? 'bg-red-500 text-white animate-pulse shadow-lg' 
                    : isTranscribing
                    ? 'bg-orange-500 text-white animate-pulse shadow-lg'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={
                  isMobile ? "Use keyboard voice input" : 
                  isTranscribing ? "Transcribing..." :
                  useWhisper ? "Voice input (Whisper) - Right-click to switch" :
                  "Voice input (Browser) - Right-click to switch"
                }
              >
                {isActivelyListening || isTranscribing ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>
            )}
            {/* Send button */}
            <button
              onClick={() => onSubmit()}
              disabled={!value.trim() || isLoading || disabled}
              className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-rose to-burgundy text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed native-transition ios-active shadow-md hover:shadow-lg transition-shadow touch-feedback touch-manipulation"
            >
              {isLoading ? (
                <div 
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  style={{
                    animation: 'chatSpinner 1s linear infinite',
                    transformOrigin: 'center'
                  }}
                />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
        
        {/* Error message */}
        {transcriptionError && (
          <div className="px-4 pb-2">
            <p className="text-sm text-red-600">{transcriptionError}</p>
          </div>
        )}
      </div>
    </>
  );
}