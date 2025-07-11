'use client';

import React, { useEffect, useState, useRef } from 'react';

/**
 * ConversationalAnswerFlow Component
 * 
 * This component implements a "voice-style" conversational flow that mimics natural conversation pauses.
 * When users answer multiple questions, instead of sending each answer immediately, we collect them
 * and wait for a natural pause (10 seconds) before sending all answers together.
 * 
 * Key behaviors:
 * 1. Shows calm "thinking" indicator when answers are staged
 * 2. Auto-sends after 10-second pause (mimics natural conversation)
 * 3. Immediately sends if user starts typing (interruption behavior)
 * 4. Only active when multiple questions exist (single questions send immediately)
 * 
 * This creates a more natural conversation flow where multiple quick answers are batched together.
 */

interface StagedAnswer {
  question: string;
  answer: string;
  timestamp: number;
}

interface ConversationalAnswerFlowProps {
  stagedAnswers: StagedAnswer[];  // Answers waiting to be sent
  onSendAnswers: (answers: StagedAnswer[], additionalMessage?: string) => void;
  isUserTyping: boolean;  // Triggers immediate send when true
}

export const ConversationalAnswerFlow: React.FC<ConversationalAnswerFlowProps> = ({
  stagedAnswers,
  onSendAnswers,
  isUserTyping
}) => {
  const [showThinking, setShowThinking] = useState(false);
  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Duration to wait before auto-sending staged answers
  // This mimics a natural conversational pause
  const PAUSE_DURATION = 10000; // 10 seconds pause before sending

  useEffect(() => {
    // IMMEDIATE SEND TRIGGER: User typing interrupts the waiting period
    // This mimics natural conversation where starting to speak interrupts the pause
    if (isUserTyping && stagedAnswers.length > 0) {
      clearTimers();
      // Send the staged answers immediately when user starts typing
      // The parent component will handle combining with typed message
      onSendAnswers(stagedAnswers);
      return;
    }

    // PAUSE TIMER LOGIC: Wait for natural conversation pause
    if (stagedAnswers.length > 0) {
      setShowThinking(true);
      
      // Clear any existing timer to reset the pause duration
      clearTimers();
      
      // Main pause timer - sends after 10 seconds of "silence"
      pauseTimerRef.current = setTimeout(() => {
        // Auto-send all staged answers after the pause duration
        onSendAnswers(stagedAnswers);
        setShowThinking(false);
        clearTimers();
      }, PAUSE_DURATION);
    } else {
      // No staged answers, hide thinking indicator
      setShowThinking(false);
      clearTimers();
    }
    
    return () => clearTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stagedAnswers.length, isUserTyping]);

  const clearTimers = () => {
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }
  };

  if (!showThinking || stagedAnswers.length === 0) {
    return null;
  }

  return (
    <div className="px-4 py-2 animate-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" 
                 style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" 
                 style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" 
                 style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-xs text-gray-600">
            Thinking... ({stagedAnswers.length} answer{stagedAnswers.length > 1 ? 's' : ''})
          </span>
        </div>
      </div>
    </div>
  );
};