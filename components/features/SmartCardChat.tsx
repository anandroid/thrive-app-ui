'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, AlertCircle, Calendar, Pill, Heart, Sparkles, ChevronRight, Moon, Brain, Activity, FileText, Globe, BookOpen, Leaf } from 'lucide-react';
import {
  ChatMessage,
  ActionableItem,
  AssistantResponse,
  ASSISTANT_RESPONSE_KEYS,
  WellnessRoutine
} from '@/src/services/openai/types';
import { RoutineCreationModal } from './RoutineCreationModal';
import { stripHtml } from '@/src/utils/html';

interface SmartCardChatProps {
  threadId?: string;
  onThreadCreated?: (threadId: string) => void;
  onRoutineCreated?: (routine: WellnessRoutine) => void;
  selectedPrompt?: string | null;
  onPromptUsed?: () => void;
  renderHeader?: () => React.ReactNode;
  renderPromptTemplates?: (messages: ChatMessage[]) => React.ReactNode;
}

export const SmartCardChat: React.FC<SmartCardChatProps> = ({
  threadId: initialThreadId,
  onThreadCreated,
  onRoutineCreated,
  selectedPrompt,
  onPromptUsed,
  renderHeader,
  renderPromptTemplates
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState(initialThreadId);
  const [showRoutineModal, setShowRoutineModal] = useState(false);
  const [routineData, setRoutineData] = useState<ActionableItem | null>(null);
  const [healthConcern, setHealthConcern] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (selectedPrompt && selectedPrompt !== input) {
      setInput(selectedPrompt);
      onPromptUsed?.();
    }
  }, [selectedPrompt, input, onPromptUsed]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    // Store the health concern for routine creation
    setHealthConcern(input);

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      abortControllerRef.current = new AbortController();
      const response = await fetch('/api/assistant/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          threadId
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) throw new Error('Failed to send message');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No response body');

      let newThreadId = threadId;
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') {
              // Handle completion signal
              continue;
            }
            
            try {
              const data = JSON.parse(dataStr);
              
              if (data.type === 'thread_created' && data.threadId && !newThreadId) {
                newThreadId = data.threadId;
                setThreadId(data.threadId);
                onThreadCreated?.(data.threadId);
              }

              if (data.type === 'delta' && data.content) {
                fullContent += data.content;
                setMessages(prev => {
                  const updated = [...prev];
                  const lastMessage = updated[updated.length - 1];
                  if (lastMessage.role === 'assistant') {
                    lastMessage.content = fullContent;
                  }
                  return updated;
                });
              }

              if (data.type === 'completed') {
                const parsedResponse = parseAssistantResponse(fullContent);
                setMessages(prev => {
                  const updated = [...prev];
                  const lastMessage = updated[updated.length - 1];
                  if (lastMessage.role === 'assistant') {
                    lastMessage.content = fullContent;
                    lastMessage.parsedContent = parsedResponse;
                    lastMessage.isStreaming = false;
                  }
                  return updated;
                });
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Error sending message:', error);
        setMessages(prev => {
          const updated = [...prev];
          const lastMessage = updated[updated.length - 1];
          if (lastMessage.role === 'assistant') {
            lastMessage.content = 'I apologize, but I encountered an error. Please try again.';
            lastMessage.isStreaming = false;
          }
          return updated;
        });
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Attempt to parse assistant JSON only if it actually contains structured fields
  const parseAssistantResponse = (content: string): AssistantResponse | undefined => {
    try {
      const parsed = JSON.parse(content);
      // We consider it structured only if it includes at least one expected assistant-response key
      if (parsed && typeof parsed === 'object' && ASSISTANT_RESPONSE_KEYS.some(key => key in parsed)) {
        return parsed as AssistantResponse;
      }
      return undefined;
    } catch {
      return undefined;
    }
  };

  const handleActionClick = (action: ActionableItem) => {
    if (action.type === 'create_routine' || action.type === 'routine') {
      setRoutineData(action);
      setShowRoutineModal(true);
    } else if (action.link) {
      window.open(action.link, '_blank');
    } else if (action.pharmacy_link) {
      window.open(action.pharmacy_link, '_blank');
    } else if (action.amazon_link) {
      window.open(action.amazon_link, '_blank');
    }
  };

  const handleQuestionClick = (question: string) => {
    setInput(question);
    handleSendMessage();
  };

  const renderMessage = (message: ChatMessage) => {
    if (message.role === 'user') {
      return (
        <div className="flex justify-end mb-8">
          <div className="max-w-[85%]">
            <div className="rounded-3xl px-6 py-4 bg-gradient-to-r from-rose via-dusty-rose to-burgundy text-white shadow-md">
              <p className="text-[17px] leading-[1.6] font-light">{message.content}</p>
              <p className="text-[13px] text-white/70 mt-2">
                {message.timestamp.toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit',
                  hour12: true 
                })}
              </p>
            </div>
          </div>
        </div>
      );
    }

    const parsed = message.parsedContent;

    return (
      <div className="flex justify-start mb-8">
        <div className="max-w-[85%] space-y-4">
          {message.isStreaming ? (
            <div className="text-[17px] text-primary-text leading-[1.7] font-light">
              <p>{message.content || 'Thinking...'}</p>
            </div>
          ) : (
            <>
              {/* Emergency Alert */}
              {parsed?.attentionRequired === 'emergency' && (
                <div className="rounded-2xl bg-rose/10 border border-rose/20 p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-burgundy flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-primary-text mb-1">Immediate Attention Required</h4>
                      <p className="text-sm text-secondary-text">{parsed.emergencyReasoning}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Greeting */}
              {parsed?.greeting && (
                <p className="text-[17px] text-primary-text leading-[1.8] font-light">
                  {parsed.greeting}
                </p>
              )}

              {/* Action Items */}
              {parsed?.actionItems && parsed.actionItems.length > 0 && (
                <div className="space-y-6">
                  {parsed.actionItems.map((item, idx) => (
                    <div key={idx} className="flex space-x-4">
                      <div className="w-12 h-12 rounded-2xl bg-sage/20 flex items-center justify-center flex-shrink-0">
                        <Leaf className="w-6 h-6 text-sage-dark" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-primary-text mb-2 text-[19px] text-sage-dark">
                          {item.title}
                        </h4>
                        <div 
                          className="text-[16px] text-secondary-text leading-[1.8] font-light"
                          dangerouslySetInnerHTML={{ __html: item.content || item.description || '' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Additional Information */}
              {parsed?.additionalInformation && (
                <div className="mt-4 pl-16">
                  <div 
                    className="text-[15px] text-light-text leading-[1.7] italic"
                    dangerouslySetInnerHTML={{ __html: parsed.additionalInformation }}
                  />
                </div>
              )}

              {/* Actionable Items */}
              {parsed?.actionableItems && parsed.actionableItems.length > 0 && (
                <div className="space-y-3 pt-4">
                  {parsed.actionableItems.map((item, idx) => {
                    let Icon = Heart;
                    let iconBgClass = "bg-sage/20";
                    let iconColorClass = "text-sage-dark";
                    
                    // Icon selection logic
                    if (item.icon) {
                      const iconMap = {
                        'calendar': Calendar,
                        'pill': Pill,
                        'heart': Heart,
                        'sparkles': Sparkles,
                        'moon': Moon,
                        'brain': Brain,
                        'activity': Activity,
                        'file-text': FileText,
                        'globe': Globe,
                        'book-open': BookOpen
                      } as const;
                      Icon = iconMap[item.icon as keyof typeof iconMap] || Heart;
                    } else {
                      if (item.type === 'appointment') {
                        Icon = Calendar;
                        iconBgClass = "bg-sage/20";
                        iconColorClass = "text-sage-dark";
                      } else if (item.type === 'medicine') {
                        Icon = Pill;
                        iconBgClass = "bg-rose/20";
                        iconColorClass = "text-rose";
                      } else if (item.type === 'routine' || item.type === 'create_routine') {
                        Icon = Sparkles;
                        iconBgClass = "bg-dusty-rose/20";
                        iconColorClass = "text-burgundy";
                      }
                    }
                    
                    return (
                      <button
                        key={idx}
                        onClick={() => handleActionClick(item)}
                        className="w-full flex items-center space-x-4 p-4 rounded-2xl bg-white border border-gray-100 hover:border-sage/30 hover:shadow-md transition-all duration-300 text-left group"
                      >
                        <div className={`w-12 h-12 rounded-2xl ${iconBgClass} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                          <Icon className={`w-6 h-6 ${iconColorClass}`} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-primary-text text-[17px]">{item.title}</h4>
                          <p className="text-[14px] text-light-text mt-0.5">{item.description || item.details}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-sage transition-colors" />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Fallback for plain text */}
              {!parsed && message.content && (
                <p className="text-[17px] text-primary-text leading-[1.8] font-light">{message.content}</p>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      {renderHeader?.()}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Prompt Templates (only show when no messages) */}
        {messages.length === 0 && renderPromptTemplates && (
          <div className="h-full flex flex-col">
            {renderPromptTemplates(messages)}
          </div>
        )}
        
        {/* Messages */}
        {messages.length > 0 && (
          <div className="px-4 py-4">
            {messages.map((message, idx) => (
              <React.Fragment key={idx}>
                {renderMessage(message)}
                {/* Render questions after assistant message */}
                {message.role === 'assistant' && 
                 message.parsedContent?.questions && 
                 message.parsedContent.questions.length > 0 && 
                 !message.isStreaming && (
                  <div className="space-y-3 mt-6 mb-6">
                    <p className="text-[14px] text-light-text text-center">Still curious? Ask me anything about your wellness journey 💫</p>
                    {message.parsedContent.questions.map((question, qIdx) => {
                      const cleanQuestion = stripHtml(question);
                      return (
                        <button
                          key={qIdx}
                          onClick={() => handleQuestionClick(cleanQuestion)}
                          className="w-full flex items-center space-x-3 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all duration-300 text-left group"
                        >
                          <div className="w-10 h-10 rounded-full bg-light-text/20 flex items-center justify-center flex-shrink-0">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-light-text">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                          </div>
                          <p className="text-[16px] text-secondary-text leading-[1.6] font-light">
                            {cleanQuestion}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </React.Fragment>
            ))}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}
      </div>

      {/* Input Area - Fixed at Bottom */}
      <div className="border-t border-gray-100 bg-white safe-area-bottom flex-shrink-0">
        <div className="p-4">
          <div className="flex items-center space-x-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask about your wellness journey..."
              className="flex-1 h-12 rounded-full px-5 bg-gray-50 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-rose/20 transition-all text-base"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className="w-12 h-12 rounded-full bg-gradient-to-r from-rose to-burgundy text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed native-transition ios-active shadow-md"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {showRoutineModal && routineData && (
        <RoutineCreationModal
          isOpen={showRoutineModal}
          onClose={() => {
            setShowRoutineModal(false);
            setRoutineData(null);
          }}
          routineData={routineData}
          healthConcern={healthConcern}
          onRoutineCreated={(routine) => {
            onRoutineCreated?.(routine);
            setShowRoutineModal(false);
            setRoutineData(null);
          }}
        />
      )}
    </div>
  );
};