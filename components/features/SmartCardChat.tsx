'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, AlertCircle, Calendar, Pill, Heart, Sparkles, ChevronRight, Moon, Brain, Activity, FileText, Globe, BookOpen } from 'lucide-react';
import { ChatMessage, ActionableItem, AssistantResponse, WellnessRoutine } from '@/src/services/openai/types';
import { RoutineCreationModal } from './RoutineCreationModal';

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

  const parseAssistantResponse = (content: string): AssistantResponse | undefined => {
    try {
      return JSON.parse(content);
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
        <div className="flex justify-end mb-4">
          <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-gradient-to-r from-rose to-burgundy text-white shadow-md shadow-rose/20">
            <p className="text-[15px] leading-relaxed">{message.content}</p>
          </div>
        </div>
      );
    }

    const parsed = message.parsedContent;

    return (
      <div className="flex justify-start mb-4">
        <div className="max-w-[80%] space-y-3">
          {parsed?.attentionRequired === 'emergency' && (
            <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-4 mb-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Immediate Attention Required</h4>
                  <p className="text-sm text-gray-600">{parsed.emergencyReasoning}</p>
                </div>
              </div>
            </div>
          )}

          {message.isStreaming ? (
            <div className="rounded-2xl bg-white border border-gray-100 px-4 py-3 shadow-sm">
              <p className="text-[15px] text-gray-700 leading-relaxed">{message.content || 'Thinking...'}</p>
            </div>
          ) : (
            <>
              {parsed?.greeting && (
                <div className="rounded-2xl bg-gray-50 px-4 py-3">
                  <p className="text-[15px] text-gray-700 leading-relaxed">{parsed.greeting}</p>
                </div>
              )}

              {parsed?.actionItems && parsed.actionItems.length > 0 && (
                <div className="space-y-2">
                  {parsed.actionItems.map((item, idx) => (
                    <div key={idx} className="rounded-2xl bg-gradient-to-br from-rose/5 to-burgundy/5 p-4 border border-rose/10">
                      <h4 className="font-semibold text-gray-900 mb-2 text-[16px]">
                        {item.title}
                      </h4>
                      <div 
                        className="text-[14px] text-gray-600 leading-relaxed prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: item.content || item.description || '' }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {parsed?.actionableItems && parsed.actionableItems.length > 0 && (
                <div className="space-y-3">
                  {parsed.actionableItems.map((item, idx) => {
                    let Icon = Heart;
                    if (item.type === 'appointment') Icon = Calendar;
                    else if (item.type === 'medicine') Icon = Pill;
                    else if (item.type === 'prescription') Icon = FileText;
                    else if (item.type === 'resource') Icon = BookOpen;
                    else if (item.type === 'link') Icon = Globe;
                    else if (item.type === 'routine' || item.type === 'create_routine') {
                      // Choose icon based on routine type
                      if (item.routineType === 'sleep_routine') Icon = Moon;
                      else if (item.routineType === 'stress_management') Icon = Brain;
                      else if (item.routineType === 'exercise') Icon = Activity;
                      else Icon = Sparkles;
                    }
                    
                    return (
                      <button
                        key={idx}
                        onClick={() => handleActionClick(item)}
                        className="w-full rounded-xl border border-gray-200 p-4 bg-white hover:shadow-md transition-all text-left group overflow-hidden relative"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-rose/5 to-burgundy/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose to-burgundy flex items-center justify-center shadow-sm">
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-primary-text">{item.title}</h4>
                              <p className="text-xs text-primary-text/60">{item.description || item.details}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-rose group-hover:translate-x-1 transition-transform" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {!parsed && message.content && (
                <div className="rounded-2xl bg-gray-50 px-4 py-3">
                  <p className="text-[15px] text-gray-700 leading-relaxed">{message.content}</p>
                </div>
              )}

              {parsed?.questions && parsed.questions.length > 0 && (
                <div className="mt-3">
                  {/* Divider with centered label */}
                  <div className="flex items-center mb-2">
                    <div className="flex-grow h-px bg-gradient-to-r from-transparent via-rose/40 to-transparent" />
                    <span className="mx-3 text-xs text-gray-500 whitespace-nowrap">Lets talk more?</span>
                    <div className="flex-grow h-px bg-gradient-to-r from-transparent via-rose/40 to-transparent" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {parsed.questions.map((question, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuestionClick(question)}
                        className="rounded-full px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
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
              <div key={idx}>{renderMessage(message)}</div>
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