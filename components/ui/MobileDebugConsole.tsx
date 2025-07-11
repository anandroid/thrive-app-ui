'use client';

import { useState, useEffect, useRef } from 'react';
import { X, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';

interface DebugLog {
  timestamp: string;
  type: 'log' | 'error' | 'warn' | 'info';
  message: string;
}

type DebugListener = (log: DebugLog) => void;

export interface MobileDebug {
  logs: DebugLog[];
  listeners: DebugListener[];
  log: (message: string) => void;
  error: (message: string) => void;
}

declare global {
  interface Window {
    mobileDebug: MobileDebug;
  }
}

// Global debug logger
if (typeof window !== 'undefined') {
  window.mobileDebug = {
    logs: [] as DebugLog[],
    listeners: [] as DebugListener[],
    log: (message: string) => {
      const log: DebugLog = {
        timestamp: new Date().toISOString().substring(11, 23),
        type: 'log',
        message
      };
      window.mobileDebug.logs.push(log);
      window.mobileDebug.listeners.forEach((fn) => fn(log));
      console.log('[MobileDebug]', message);
    },
    error: (message: string) => {
      const log: DebugLog = {
        timestamp: new Date().toISOString().substring(11, 23),
        type: 'error',
        message
      };
      window.mobileDebug.logs.push(log);
      window.mobileDebug.listeners.forEach((fn) => fn(log));
      console.error('[MobileDebug]', message);
    }
  };
}

export function MobileDebugConsole() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [isDebugMode, setIsDebugMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check for debug mode in URL
    const urlParams = new URLSearchParams(window.location.search);
    const debugParam = urlParams.get('isDebug');
    setIsDebugMode(debugParam === 'true');

    // Load existing logs
    setLogs(window.mobileDebug?.logs || []);

    // Listen for new logs
    const listener: DebugListener = (log: DebugLog) => {
      setLogs(prev => [...prev, log].slice(-100)); // Keep last 100 logs
    };

    window.mobileDebug?.listeners.push(listener);

    return () => {
      const idx = window.mobileDebug?.listeners.indexOf(listener);
      if (idx !== undefined && idx > -1) {
        window.mobileDebug?.listeners.splice(idx, 1);
      }
    };
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollRef.current && !isMinimized) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isMinimized]);

  // Only show if debug mode is enabled
  if (!isDebugMode) {
    return null;
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-50 bg-black text-white p-3 rounded-full shadow-lg text-xs font-mono"
      >
        DEBUG
      </button>
    );
  }

  return (
    <div className={`fixed bottom-0 inset-x-0 z-50 bg-black text-green-400 font-mono text-xs transition-all ${
      isMinimized ? 'h-12' : 'h-64'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-green-800">
        <span className="text-green-500">Debug Console</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setLogs([]);
              if (window.mobileDebug) {
                window.mobileDebug.logs = [];
              }
            }}
            className="p-1"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1"
          >
            {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Logs */}
      {!isMinimized && (
        <div 
          ref={scrollRef}
          className="overflow-y-auto p-2 space-y-1"
          style={{ height: 'calc(100% - 3rem)' }}
        >
          {logs.length === 0 ? (
            <div className="text-gray-500">No logs yet...</div>
          ) : (
            logs.map((log, idx) => (
              <div 
                key={idx}
                className={`${
                  log.type === 'error' ? 'text-red-400' : 
                  log.type === 'warn' ? 'text-yellow-400' : 
                  log.type === 'info' ? 'text-blue-400' : 
                  'text-green-400'
                }`}
              >
                <span className="text-gray-500">{log.timestamp}</span>{' '}
                <span>{log.message}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}