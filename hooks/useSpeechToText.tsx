'use client';

import { useState, useRef, useEffect } from 'react';

// Import type from MobileDebugConsole
import type { MobileDebug } from '@/components/ui/MobileDebugConsole';

// Mobile debug logger
const mDebug = (message: string, type: 'log' | 'error' = 'log') => {
  if (typeof window !== 'undefined' && window.mobileDebug) {
    window.mobileDebug[type](message);
  } else {
    console[type](`[Speech] ${message}`);
  }
};

/**
 * useSpeechToText Hook
 * 
 * Provides speech-to-text functionality using Web Speech API.
 * Integrates with the conversational flow system by treating voice input
 * exactly like keyboard typing.
 * 
 * Key behaviors:
 * - Appends transcribed text to existing input (doesn't replace)
 * - Triggers "user is typing" state in parent components
 * - Works with answer batching - voice input interrupts the pause timer
 * - Browser support: Chrome, Edge, Safari (with webkit prefix)
 * 
 * This ensures consistent behavior whether users type or speak their responses.
 */

interface UseSpeechToTextProps {
  onTranscript: (text: string) => void;  // Called with transcribed text
  onStartListening?: () => void;
  onStopListening?: () => void;
  continuous?: boolean;  // Keep listening until manually stopped
}

export const useSpeechToText = ({
  onTranscript,
  onStartListening,
  onStopListening,
  continuous = false
}: UseSpeechToTextProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTranscriptRef = useRef<string>('');

  // Check if mobile device
  const isMobile = typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    // Check if speech recognition is supported
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      
      try {
        const recognition = new SpeechRecognition();
      
      // On mobile, continuous mode often doesn't work well
      recognition.continuous = isMobile ? false : continuous;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
      
      // Mobile browsers need these for better performance
      if (isMobile) {
        // Don't set grammars on mobile - it causes errors
        // recognition.grammars = undefined; // This causes TypeError
        // @ts-ignore - these properties might not be in types but exist
        // recognition.serviceURI = undefined;
      }
      
      // Add all event listeners for debugging
      recognition.onaudiostart = () => {
        mDebug(`onaudiostart - mic capturing at ${new Date().toISOString().substring(11, 23)}`);
      };
      
      recognition.onaudioend = () => {
        mDebug(`onaudioend - mic stopped at ${new Date().toISOString().substring(11, 23)}`);
      };
      
      recognition.onsoundstart = () => {
        mDebug(`onsoundstart - sound detected at ${new Date().toISOString().substring(11, 23)}`);
      };
      
      recognition.onsoundend = () => {
        mDebug(`onsoundend - sound stopped at ${new Date().toISOString().substring(11, 23)}`);
      };
      
      recognition.onspeechstart = () => {
        mDebug(`onspeechstart - speech detected at ${new Date().toISOString().substring(11, 23)}`);
      };
      
      recognition.onspeechend = () => {
        mDebug(`onspeechend - speech stopped at ${new Date().toISOString().substring(11, 23)}`);
      };
      
      recognition.onstart = () => {
        mDebug(`onstart event at ${new Date().toISOString().substring(11, 23)}`);
        setIsListening(true);
        onStartListening?.();
        lastTranscriptRef.current = '';
        
        // Start timeout on mobile
        if (isMobile) {
          timeoutRef.current = setTimeout(() => {
            if (recognitionRef.current) {
              mDebug('Initial timeout - stopping recognition');
              recognitionRef.current.stop();
            }
          }, 5000); // 5 seconds initial timeout
        }
      };
      
      recognition.onend = () => {
        mDebug(`onend event at ${new Date().toISOString().substring(11, 23)}`);
        setIsListening(false);
        onStopListening?.();
        
        // Clear timeout on end
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };
      
      recognition.onerror = (event: any) => {
        mDebug(`onerror at ${new Date().toISOString().substring(11, 23)} - ${event.error}: ${event.message}`, 'error');
        setIsListening(false);
        onStopListening?.();
        
        // Clear any timeouts
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        // Common mobile errors
        if (event.error === 'not-allowed') {
          alert('Microphone access was denied. Please check your browser settings.');
        } else if (event.error === 'no-speech') {
          // This is common on mobile - the recognition times out quickly
          mDebug('No speech detected - this is normal');
        } else if (event.error === 'network') {
          alert('Speech recognition requires an internet connection.');
        } else if (event.error === 'aborted') {
          mDebug('Recognition aborted');
        } else {
          // Log any other errors
          mDebug(`Unknown error: ${JSON.stringify(event)}`, 'error');
        }
      };
      
      recognition.onresult = (event: any) => {
        mDebug(`Result event with ${event.results.length} results`);
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        mDebug(`Final: '${finalTranscript}' Interim: '${interimTranscript}'`);
        
        // Send the transcript (final or interim)
        const text = finalTranscript || interimTranscript;
        if (text.trim() && text !== lastTranscriptRef.current) {
          lastTranscriptRef.current = text;
          onTranscript(text.trim());
          
          // On mobile, reset timeout when we get new speech
          if (isMobile && timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            // Stop after 3 seconds of silence on mobile
            timeoutRef.current = setTimeout(() => {
              if (recognitionRef.current) {
                mDebug('Stopping due to silence timeout');
                recognitionRef.current.stop();
              }
            }, 3000);
          }
        }
      };
      
        recognitionRef.current = recognition;
      } catch (error) {
        mDebug(`Failed to initialize recognition: ${error}`, 'error');
        setIsSupported(false);
      }
    }
    
    setIsInitialized(true);
    
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors on cleanup
        }
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [continuous, onTranscript, onStartListening, onStopListening, isMobile]);

  const startListening = async () => {
    mDebug(`startListening called at ${new Date().toISOString().substring(11, 23)}`);
    if (recognitionRef.current && !isListening) {
      try {
        // On mobile, we need to request permissions first
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          try {
            mDebug('Requesting microphone permission...');
            await navigator.mediaDevices.getUserMedia({ audio: true });
            mDebug(`Microphone permission granted at ${new Date().toISOString().substring(11, 23)}`);
          } catch (permError) {
            mDebug(`Microphone permission denied: ${permError}`, 'error');
            alert('Please allow microphone access to use voice input.');
            return;
          }
        }
        
        mDebug(`Calling recognition.start() at ${new Date().toISOString().substring(11, 23)}`);
        recognitionRef.current.start();
      } catch (error) {
        mDebug(`Error starting speech recognition: ${error}`, 'error');
        // If the error is because recognition is already started, stop and restart
        if (error instanceof Error && error.message.includes('already started')) {
          try {
            recognitionRef.current.stop();
            setTimeout(() => {
              recognitionRef.current.start();
            }, 100);
          } catch (restartError) {
            mDebug(`Error restarting speech recognition: ${restartError}`, 'error');
          }
        }
      }
    } else {
      mDebug(`Cannot start - recognitionRef: ${!!recognitionRef.current}, isListening: ${isListening}`);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return {
    isListening,
    isSupported: isInitialized && isSupported,
    startListening,
    stopListening,
    toggleListening
  };
};