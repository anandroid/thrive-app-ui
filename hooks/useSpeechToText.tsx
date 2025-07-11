'use client';

import { useState, useRef, useEffect } from 'react';

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
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTranscriptRef = useRef<string>('');

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      
      const recognition = new SpeechRecognition();
      
      // Mobile-specific configuration
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      // On mobile, continuous mode often doesn't work well
      recognition.continuous = isMobile ? false : continuous;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
      
      // Mobile browsers need these for better performance
      if (isMobile) {
        recognition.grammars = undefined;
        // @ts-ignore - these properties might not be in types but exist
        recognition.serviceURI = undefined;
      }
      
      recognition.onstart = () => {
        console.log('Speech recognition started');
        setIsListening(true);
        onStartListening?.();
      };
      
      recognition.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
        onStopListening?.();
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        onStopListening?.();
        
        // Common mobile errors
        if (event.error === 'not-allowed') {
          alert('Microphone access was denied. Please check your browser settings.');
        } else if (event.error === 'no-speech') {
          // This is common on mobile - the recognition times out quickly
          console.log('No speech detected');
        } else if (event.error === 'network') {
          alert('Speech recognition requires an internet connection.');
        }
      };
      
      recognition.onresult = (event: any) => {
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
              if (recognitionRef.current && isListening) {
                console.log('Stopping due to silence timeout');
                recognitionRef.current.stop();
              }
            }, 3000);
          }
        }
      };
      
      recognitionRef.current = recognition;
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [continuous, onTranscript, onStartListening, onStopListening]);

  const startListening = async () => {
    if (recognitionRef.current && !isListening) {
      try {
        // On mobile, we need to request permissions first
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log('Microphone permission granted');
          } catch (permError) {
            console.error('Microphone permission denied:', permError);
            alert('Please allow microphone access to use voice input.');
            return;
          }
        }
        
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        // If the error is because recognition is already started, stop and restart
        if (error instanceof Error && error.message.includes('already started')) {
          try {
            recognitionRef.current.stop();
            setTimeout(() => {
              recognitionRef.current.start();
            }, 100);
          } catch (restartError) {
            console.error('Error restarting speech recognition:', restartError);
          }
        }
      }
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
    isSupported,
    startListening,
    stopListening,
    toggleListening
  };
};