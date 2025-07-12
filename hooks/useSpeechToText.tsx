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
  onRestarting?: () => void;  // Called when Chrome mobile is restarting
}

export const useSpeechToText = ({
  onTranscript,
  onStartListening,
  onStopListening,
  continuous = false,
  onRestarting
}: UseSpeechToTextProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTranscriptRef = useRef<string>('');
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Check if mobile device
  const isMobile = typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  // Check if Chrome on mobile
  const isChromeMobile = isMobile && /Chrome/i.test(navigator.userAgent) && !/Edge/i.test(navigator.userAgent);
  // Check if iOS Safari
  const isIOSSafari = typeof window !== 'undefined' && 
    /iPhone|iPad|iPod/i.test(navigator.userAgent) && 
    /Safari/i.test(navigator.userAgent) && 
    !/Chrome|CriOS|FxiOS/i.test(navigator.userAgent);

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
      
      // On mobile, use specific settings
      // IMPORTANT: continuous mode is problematic on mobile browsers
      recognition.continuous = isMobile ? false : continuous;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
      
      // Mobile specific settings
      if (isChromeMobile) {
        // Don't use continuous mode - it's broken on Chrome mobile
        // We'll use manual restart instead
        mDebug('Chrome mobile: Using discontinuous mode with manual restart');
      } else if (isIOSSafari) {
        // iOS Safari has its own issues
        mDebug('iOS Safari: Speech recognition is unreliable, keyboard dictation recommended');
        recognition.interimResults = false; // Interim results cause duplicate text on iOS
      }
      
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
        
        // Store start time for duration calculation
        if (recognitionRef.current) {
          (recognitionRef.current as any).startTime = Date.now();
        }
        
        setIsListening(true);
        onStartListening?.();
        lastTranscriptRef.current = '';
        
        // Don't use timeout for Chrome mobile - let it fail naturally
        if (isMobile && !isChromeMobile) {
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
        
        // Calculate duration
        if (recognitionRef.current && (recognitionRef.current as any).startTime) {
          const duration = Date.now() - (recognitionRef.current as any).startTime;
          mDebug(`Recognition ended after ${duration}ms`);
          
          // If it ended too quickly on Chrome mobile, restart recognition
          if (isChromeMobile && duration < 500 && !lastTranscriptRef.current) {
            mDebug('Chrome mobile early termination detected - restarting recognition');
            
            // Auto-restart recognition for Chrome mobile
            // This is the recommended workaround for the continuous mode bug
            if (recognitionRef.current) {
              onRestarting?.(); // Notify UI that we're restarting
              setTimeout(() => {
                try {
                  mDebug('Restarting speech recognition...');
                  if (isListening) {
                    recognitionRef.current.start();
                  }
                } catch (e) {
                  mDebug(`Failed to restart recognition: ${e}`, 'error');
                  setIsListening(false);
                  onStopListening?.();
                }
              }, 100);
              return; // Don't complete the onend handler yet
            }
          }
        }
        
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
        
        // Calculate time between start and error
        if (recognitionRef.current && (recognitionRef.current as any).startTime) {
          const duration = Date.now() - (recognitionRef.current as any).startTime;
          mDebug(`Error occurred ${duration}ms after start`, 'error');
        }
        
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
          
          // Auto-restart on Chrome mobile if we're still supposed to be listening
          if (isChromeMobile && isListening) {
            mDebug('Chrome mobile: Auto-restarting after no-speech error');
            onRestarting?.(); // Notify UI
            setTimeout(() => {
              if (recognitionRef.current && isListening) {
                try {
                  recognitionRef.current.start();
                } catch (e) {
                  mDebug(`Failed to restart after no-speech: ${e}`, 'error');
                  setIsListening(false);
                  onStopListening?.();
                }
              }
            }, 100);
          }
        } else if (event.error === 'network') {
          mDebug('Network error - checking connection...', 'error');
          alert('Speech recognition requires an internet connection.');
        } else if (event.error === 'aborted') {
          mDebug('Recognition aborted - possibly by browser');
          
          // Try to restart on Chrome mobile if aborted
          if (isChromeMobile && isListening) {
            mDebug('Chrome mobile: Auto-restarting after abort');
            onRestarting?.(); // Notify UI
            setTimeout(() => {
              if (recognitionRef.current && isListening) {
                try {
                  recognitionRef.current.start();
                } catch (e) {
                  mDebug(`Failed to restart after abort: ${e}`, 'error');
                  setIsListening(false);
                  onStopListening?.();
                }
              }
            }, 200);
          }
        } else if (event.error === 'audio-capture') {
          mDebug('Audio capture failed - mic may be in use by another app', 'error');
        } else if (event.error === 'language-not-supported') {
          mDebug('Language not supported', 'error');
        } else {
          // Log any other errors
          mDebug(`Unknown error type: "${event.error}"`, 'error');
          mDebug(`Full error object: ${JSON.stringify({
            error: event.error,
            message: event.message,
            type: event.type
          })}`, 'error');
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
      // Clean up audio resources
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [continuous, onTranscript, onStartListening, onStopListening, isMobile]);

  const startListening = async () => {
    mDebug(`startListening called at ${new Date().toISOString().substring(11, 23)}`);
    
    // Debug browser and platform info
    mDebug(`Browser: ${navigator.userAgent.substring(0, 50)}...`);
    mDebug(`Platform: ${navigator.platform}, Mobile: ${isMobile}`);
    
    if (recognitionRef.current && !isListening) {
      try {
        // Check if we're in a secure context (HTTPS)
        if (window.isSecureContext !== undefined) {
          mDebug(`Secure context: ${window.isSecureContext}`);
        }
        
        // For Chrome mobile, prepare special handling
        if (isChromeMobile) {
          mDebug('Chrome mobile detected - implementing workarounds');
          try {
            // Create AudioContext to potentially help
            if (!audioContextRef.current) {
              const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
              audioContextRef.current = new AudioCtx();
              if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
              }
            }
            
            // Try to wake up the speech recognition service
            mDebug('Attempting to wake up speech service...');
            // Sometimes a dummy recognition helps
            try {
              const dummyRecognition = new ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)();
              dummyRecognition.continuous = false;
              dummyRecognition.start();
              setTimeout(() => {
                try { dummyRecognition.stop(); } catch (e) {}
              }, 100);
            } catch (e) {
              mDebug('Dummy recognition failed (expected)');
            }
          } catch (audioError) {
            mDebug(`Failed to create AudioContext: ${audioError}`, 'error');
          }
        }
        
        // On mobile, we need to request permissions first
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          try {
            mDebug('Requesting microphone permission...');
            const stream = await navigator.mediaDevices.getUserMedia({ 
              audio: {
                echoCancellation: false, // Try disabling echo cancellation
                noiseSuppression: false, // Try disabling noise suppression
                autoGainControl: true,
                sampleRate: 16000 // Lower sample rate for speech
              } 
            });
            mDebug(`Microphone permission granted at ${new Date().toISOString().substring(11, 23)}`);
            
            // Check if we got audio tracks
            const audioTracks = stream.getAudioTracks();
            mDebug(`Audio tracks: ${audioTracks.length}, Track enabled: ${audioTracks[0]?.enabled}`);
            
            // For Chrome mobile, we'll use the stream differently
            if (isChromeMobile) {
              mDebug('Chrome mobile: Stream obtained, closing it as continuous mode is broken');
              // Close the stream immediately as we don't need it for speech recognition
              stream.getTracks().forEach(track => track.stop());
              // Don't keep the stream - Chrome mobile speech recognition works better without it
            } else if (isMobile && audioContextRef.current) {
              // For non-Chrome mobile, try the audio pipeline approach
              try {
                const source = audioContextRef.current.createMediaStreamSource(stream);
                const gainNode = audioContextRef.current.createGain();
                gainNode.gain.value = 0;
                source.connect(gainNode);
                gainNode.connect(audioContextRef.current.destination);
                streamRef.current = stream;
                mDebug('Audio pipeline created to keep mic active');
              } catch (pipelineError) {
                mDebug(`Failed to create audio pipeline: ${pipelineError}`, 'error');
                stream.getTracks().forEach(track => track.stop());
              }
            } else {
              // Desktop - just stop the stream
              stream.getTracks().forEach(track => track.stop());
            }
          } catch (permError) {
            mDebug(`Microphone permission error: ${permError}`, 'error');
            mDebug(`Error name: ${(permError as any).name}, Code: ${(permError as any).code}`, 'error');
            alert('Please allow microphone access to use voice input.');
            return;
          }
        }
        
        // Log recognition settings
        mDebug(`Recognition settings - continuous: ${recognitionRef.current.continuous}, interimResults: ${recognitionRef.current.interimResults}`);
        
        // Try a small delay on mobile before starting recognition
        if (isMobile) {
          mDebug('Waiting 100ms before starting recognition on mobile...');
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        mDebug(`Calling recognition.start() at ${new Date().toISOString().substring(11, 23)}`);
        recognitionRef.current.start();
      } catch (error) {
        mDebug(`Error starting speech recognition: ${error}`, 'error');
        mDebug(`Error details: ${JSON.stringify(error)}`, 'error');
        
        // If the error is because recognition is already started, stop and restart
        if (error instanceof Error && error.message.includes('already started')) {
          try {
            mDebug('Recognition already started, attempting restart...');
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
    mDebug('stopListening called');
    
    // For Chrome mobile, we need to ensure we're not in a restart loop
    if (isChromeMobile) {
      setIsListening(false); // Set this first to prevent auto-restart
    }
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        mDebug(`Error stopping recognition: ${e}`, 'error');
      }
    }
    
    // Clean up audio resources
    if (streamRef.current) {
      mDebug('Stopping audio stream...');
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (audioContextRef.current) {
      mDebug('Closing audio context...');
      audioContextRef.current.close().catch(e => {
        mDebug(`Error closing audio context: ${e}`, 'error');
      });
      audioContextRef.current = null;
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