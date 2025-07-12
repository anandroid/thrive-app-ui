'use client';

import { useState, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useSpeechToText } from '@/hooks/useSpeechToText';

export function ChromeMicTest() {
  const [transcript, setTranscript] = useState('');
  const [isRestarting, setIsRestarting] = useState(false);
  const [isDebugMode, setIsDebugMode] = useState(false);
  
  const {
    isListening,
    isSupported,
    startListening,
    stopListening
  } = useSpeechToText({
    onTranscript: (text) => {
      setTranscript(prev => prev + ' ' + text);
    },
    onRestarting: () => {
      setIsRestarting(true);
      setTimeout(() => setIsRestarting(false), 500);
    },
    continuous: false // Disabled for Chrome mobile
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const debugParam = urlParams.get('isDebug');
    setIsDebugMode(debugParam === 'true');
  }, []);

  if (!isDebugMode) {
    return null;
  }

  if (!isSupported) {
    return (
      <div className="fixed bottom-20 right-4 z-50 p-4 bg-red-50 rounded-lg">
        <p className="text-red-800">Speech recognition not supported</p>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-4 space-y-4 max-w-sm">
      <div className="text-xs font-semibold text-gray-700 mb-2">Chrome Mobile Speech Test</div>
      <div className="flex items-center gap-4">
        <button
          onClick={isListening ? stopListening : startListening}
          className={`p-4 rounded-full ${
            isListening ? 'bg-red-500 animate-pulse' : 'bg-blue-500'
          } text-white relative`}
        >
          {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          {isRestarting && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping" />
          )}
        </button>
        <div>
          <p className="text-sm font-medium">
            {isListening ? 'Listening...' : 'Tap to speak'}
          </p>
          {isRestarting && (
            <p className="text-xs text-yellow-600">Restarting mic...</p>
          )}
        </div>
      </div>
      
      {transcript && (
        <div className="p-3 bg-gray-100 rounded-lg">
          <p className="text-sm">{transcript}</p>
          <button
            onClick={() => setTranscript('')}
            className="mt-2 text-xs text-blue-600 hover:underline"
          >
            Clear
          </button>
        </div>
      )}
      
      <div className="text-xs text-gray-500">
        <p>Chrome Mobile Fix Applied:</p>
        <ul className="ml-4 mt-1">
          <li>• Continuous mode disabled</li>
          <li>• Auto-restart on timeout</li>
          <li>• Visual restart indicator</li>
        </ul>
      </div>
    </div>
  );
}