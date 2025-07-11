'use client';

import { useState, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';

const mDebug = (message: string, type: 'log' | 'error' = 'log') => {
  if (typeof window !== 'undefined' && window.mobileDebug) {
    window.mobileDebug[type](message);
  } else {
    console[type](`[MicTest] ${message}`);
  }
};

export function MicrophoneTest() {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isDebugMode, setIsDebugMode] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const debugParam = urlParams.get('isDebug');
    setIsDebugMode(debugParam === 'true');
  }, []);

  if (!isDebugMode) {
    return null;
  }

  const startRecording = async () => {
    try {
      mDebug('Starting MediaRecorder test...');
      
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: true,
          sampleRate: 16000
        } 
      });
      
      mDebug(`Got audio stream with ${stream.getAudioTracks().length} tracks`);
      
      // Create MediaRecorder
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (event) => {
        mDebug(`Data available: ${event.data.size} bytes`);
      };
      
      recorder.onstart = () => {
        mDebug('MediaRecorder started');
        setIsRecording(true);
      };
      
      recorder.onstop = () => {
        mDebug('MediaRecorder stopped');
        setIsRecording(false);
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.onerror = (event) => {
        mDebug(`MediaRecorder error: ${event}`, 'error');
      };
      
      // Start recording
      recorder.start(100); // Collect data every 100ms
      setMediaRecorder(recorder);
      
      // Auto-stop after 10 seconds
      setTimeout(() => {
        if (recorder.state === 'recording') {
          mDebug('Auto-stopping after 10 seconds');
          recorder.stop();
        }
      }, 10000);
      
    } catch (error) {
      mDebug(`Error starting recording: ${error}`, 'error');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mDebug('Stopping MediaRecorder...');
      mediaRecorder.stop();
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`p-4 rounded-full shadow-lg ${
          isRecording ? 'bg-red-500 animate-pulse' : 'bg-blue-500'
        } text-white`}
      >
        {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
      </button>
      <div className="text-xs text-center mt-2 bg-black text-white px-2 py-1 rounded">
        MediaRecorder Test
      </div>
    </div>
  );
}