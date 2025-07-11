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

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      
      const recognition = new SpeechRecognition();
      recognition.continuous = continuous;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
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
        if (text.trim()) {
          onTranscript(text.trim());
        }
      };
      
      recognitionRef.current = recognition;
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [continuous, onTranscript, onStartListening, onStopListening]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
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