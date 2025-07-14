'use client';

import React from 'react';
import { ChatMessage } from '@/src/services/openai/types';
import { ChatEditor } from '@/components/ui/ChatEditor';
import { useKeyboardAwareChat } from '@/hooks/useKeyboardAwareChat';

interface SmartCardChatContentProps {
  messages: ChatMessage[];
  input: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  renderMessage: (message: ChatMessage, index: number) => React.ReactNode;
  renderWelcome?: () => React.ReactNode;
  currentQuestion?: { prompt?: string; length?: number };
  selectedPrompt?: string | null;
}

/**
 * SmartCardChatContent - Chat UI without the container
 * 
 * This component provides just the chat messages and input,
 * designed to work inside AppLayout's scrollable content area.
 */
export function SmartCardChatContent({
  messages,
  input,
  isLoading,
  onInputChange,
  onSendMessage,
  renderMessage,
  renderWelcome,
  currentQuestion,
  selectedPrompt
}: SmartCardChatContentProps) {
  const { messagesEndRef, scrollToBottom } = useKeyboardAwareChat();

  return (
    <div className="chat-content-wrapper">
      {/* Messages Area */}
      <div className="chat-messages-area">
        {messages.length === 0 ? (
          renderWelcome ? renderWelcome() : (
            <div className="chat-welcome-placeholder">
              Start a conversation...
            </div>
          )
        ) : (
          <>
            {messages.map((message, idx) => (
              <React.Fragment key={idx}>
                {renderMessage(message, idx)}
              </React.Fragment>
            ))}
            <div ref={messagesEndRef} className="h-4" />
          </>
        )}
      </div>

      {/* Input Area - Fixed at bottom of scrollable area */}
      <div className="chat-input-container">
        <ChatEditor
          value={input}
          onChange={onInputChange}
          onSubmit={onSendMessage}
          isLoading={isLoading}
          autoFocus={!!selectedPrompt}
          placeholder={
            currentQuestion 
              ? `Answer: ${currentQuestion.prompt?.substring(0, 50)}${(currentQuestion.prompt?.length || 0) > 50 ? '...' : ''}`
              : messages.some(m => m.role === 'assistant') 
              ? "Ask follow-ups or explore other aspects of this topic..."
              : "Ask about your wellness journey..."
          }
          onFocus={() => {
            // Natural scroll behavior will handle keyboard
            setTimeout(() => {
              scrollToBottom();
            }, 300);
          }}
        />
      </div>
    </div>
  );
}