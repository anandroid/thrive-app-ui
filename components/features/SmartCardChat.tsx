'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AlertCircle, Calendar, Pill, Heart, Sparkles, ChevronRight, Moon, Brain, Activity, FileText, Globe, BookOpen, Leaf } from 'lucide-react';
import {
  ChatMessage,
  ActionableItem,
  AssistantResponse,
  ASSISTANT_RESPONSE_KEYS,
  WellnessRoutine
} from '@/src/services/openai/types';
import { RoutineCreationModal } from './RoutineCreationModal';
import { JourneyCreationModal } from './JourneyCreationModal';
import { stripHtml } from '@/src/utils/html';
import { WellnessJourney } from '@/src/services/openai/types/journey';
import { getJourneyByType } from '@/src/utils/journeyStorage';
import { ChatEditor } from '@/components/ui/ChatEditor';
import { createChatThread, addMessageToThread, getChatThread } from '@/src/utils/chatStorage';

interface SmartCardChatProps {
  threadId?: string;
  chatIntent?: string | null;
  onThreadCreated?: (threadId: string) => void;
  onRoutineCreated?: (routine: WellnessRoutine) => void;
  onJourneyCreated?: (journey: WellnessJourney) => void;
  onNavigateToJourney?: (journey: WellnessJourney) => void;
  selectedPrompt?: string | null;
  onPromptUsed?: () => void;
  renderHeader?: () => React.ReactNode;
  renderPromptTemplates?: (messages: ChatMessage[]) => React.ReactNode;
}

export const SmartCardChat: React.FC<SmartCardChatProps> = ({
  threadId: initialThreadId,
  chatIntent,
  onThreadCreated,
  onRoutineCreated,
  onJourneyCreated,
  onNavigateToJourney,
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
  const [showJourneyModal, setShowJourneyModal] = useState(false);
  const [journeyData, setJourneyData] = useState<ActionableItem | null>(null);
  const [healthConcern, setHealthConcern] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [chatThreadId, setChatThreadId] = useState<string | null>(null);

  // Load existing messages if threadId is provided
  useEffect(() => {
    if (initialThreadId && initialThreadId !== 'new') {
      const thread = getChatThread(initialThreadId);
      if (thread) {
        setChatThreadId(thread.id);
        // Convert stored messages to the format expected by the component
        const loadedMessages: ChatMessage[] = thread.messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(loadedMessages);
      }
    }
  }, [initialThreadId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToMessage = (messageIndex: number) => {
    const messageElements = document.querySelectorAll('[data-message-index]');
    if (messageElements[messageIndex]) {
      messageElements[messageIndex].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const isElementInViewport = (element: Element) => {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    // Check if at least the top part of the message is visible
    return rect.top >= 0 && rect.top <= windowHeight - 100;
  };

  useEffect(() => {
    // Only scroll for new user messages or initial load
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'user' || messages.length === 1) {
        scrollToBottom();
      } else if (lastMessage.role === 'assistant' && !lastMessage.isStreaming) {
        // For completed assistant messages, check if already in viewport
        setTimeout(() => {
          const messageElements = document.querySelectorAll('[data-message-index]');
          const lastMessageElement = messageElements[messages.length - 1];
          
          if (lastMessageElement && !isElementInViewport(lastMessageElement)) {
            scrollToMessage(messages.length - 1);
          }
          // If message is already in viewport, don't scroll
        }, 100);
      }
    }
  }, [messages]);

  useEffect(() => {
    if (selectedPrompt) {
      setInput(selectedPrompt);
      onPromptUsed?.();
    }
  }, [selectedPrompt, onPromptUsed]); // Remove input from dependencies to avoid infinite loop

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const trimmedInput = input.trim().toLowerCase();
    
    // Check if user sent the default thriving creation text AND we're in thriving mode
    if (trimmedInput === 'create a wellness thriving for me' && chatIntent === 'create_thriving') {
      const userMessage: ChatMessage = {
        role: 'user',
        content: input,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
      setInput('');
      
      // Save user message to chat history
      if (!chatThreadId && !threadId) {
        const newThread = createChatThread();
        setChatThreadId(newThread.id);
        addMessageToThread(newThread.id, { role: 'user', content: userMessage.content });
      } else {
        const currentThreadId = chatThreadId || threadId;
        if (currentThreadId) {
          addMessageToThread(currentThreadId, { role: 'user', content: userMessage.content });
        }
      }
      
      // Add a slight delay for better UX
      setTimeout(() => {
        const promptMessage: ChatMessage = {
          role: 'assistant',
          content: "I'd love to help you create a personalized wellness thriving! To craft the perfect plan for you, could you tell me:\n\n• What area of wellness would you like to focus on? (e.g., better sleep, stress management, pain relief, mental wellness, nutrition, exercise)\n• What specific challenges are you facing?\n• What's your daily schedule like?\n\nThe more details you share, the better I can tailor your thriving to fit your unique needs! 🌱",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, promptMessage]);
        
        // Save assistant message to chat history
        const currentThreadId = chatThreadId || threadId;
        if (currentThreadId) {
          addMessageToThread(currentThreadId, { role: 'assistant', content: promptMessage.content });
        }
      }, 500);
      
      return; // Don't make the API call yet
    }

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

    // Save user message to chat history
    if (!chatThreadId && !threadId) {
      // Create new thread if needed
      const newThread = createChatThread();
      setChatThreadId(newThread.id);
      addMessageToThread(newThread.id, { role: 'user', content: userMessage.content });
    } else {
      // Add to existing thread
      const currentThreadId = chatThreadId || threadId;
      if (currentThreadId) {
        addMessageToThread(currentThreadId, { role: 'user', content: userMessage.content });
      }
    }

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
          threadId: chatThreadId || threadId,
          chatIntent
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
                setChatThreadId(data.threadId);
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
                
                // Save assistant message to chat history
                const currentThreadId = chatThreadId || newThreadId || threadId;
                if (currentThreadId) {
                  addMessageToThread(currentThreadId, { role: 'assistant', content: fullContent });
                }
              }

              if (data.type === 'error') {
                setMessages(prev => {
                  const updated = [...prev];
                  const lastMessage = updated[updated.length - 1];
                  if (lastMessage.role === 'assistant') {
                    lastMessage.content = data.error || 'I apologize, but I encountered an error processing your request. Please try again or rephrase your question.';
                    lastMessage.isStreaming = false;
                  }
                  return updated;
                });
                break; // Exit the loop on error
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
    } else if (action.type === 'start_journey') {
      // Check if journey already exists
      const existingJourney = action.journey_type ? getJourneyByType(action.journey_type) : null;
      if (existingJourney) {
        // Navigate to existing journey
        onNavigateToJourney?.(existingJourney);
      } else {
        // Create new journey
        setJourneyData(action);
        setShowJourneyModal(true);
      }
    } else if (action.type === 'continue_journey') {
      // Navigate to existing journey
      const existingJourney = action.journey_type ? getJourneyByType(action.journey_type) : null;
      if (existingJourney) {
        onNavigateToJourney?.(existingJourney);
      }
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

  const renderMessage = (message: ChatMessage, messageIndex: number) => {
    if (message.role === 'user') {
      return (
        <div className="flex justify-end mb-6" data-message-index={messageIndex}>
          <div className="max-w-[90%] md:max-w-[85%]">
            <div className="rounded-3xl px-6 py-4 bg-gradient-to-br from-sage-light/20 to-sage/15 shadow-xl shadow-sage/25 border border-sage/20">
              <p className="text-[17px] leading-[1.6] font-normal text-primary-text">{message.content}</p>
              <p className="text-[13px] text-secondary-text-thin mt-2">
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
      <div className="flex justify-start mb-6" data-message-index={messageIndex}>
        <div className="max-w-[95%] md:max-w-[90%]">
          {message.isStreaming ? (
            <div className="rounded-3xl bg-white shadow-2xl shadow-gray-300/80 p-6">
              <div className="flex space-x-1">
                <span className="w-3 h-3 bg-gradient-to-r from-sage to-sage-dark rounded-full animate-wave" style={{ animationDelay: '0s' }} />
                <span className="w-3 h-3 bg-gradient-to-r from-sage to-sage-dark rounded-full animate-wave" style={{ animationDelay: '0.15s' }} />
                <span className="w-3 h-3 bg-gradient-to-r from-sage to-sage-dark rounded-full animate-wave" style={{ animationDelay: '0.3s' }} />
              </div>
            </div>
          ) : (
            <div className="relative rounded-3xl bg-white shadow-2xl shadow-gray-300/80 overflow-hidden border-2 border-gray-200/70">
              {/* Gradient accent line */}
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose via-dusty-rose to-burgundy" />
              <div className="p-7 pt-8 space-y-6">
                {/* Sender Label */}
                <div className="mb-3">
                  <span className="text-sm font-semibold text-burgundy">Wellness Companion</span>
                </div>
                {/* Emergency Alert */}
                {parsed?.attentionRequired === 'emergency' && (
                  <div className="rounded-2xl bg-gradient-to-r from-rose/15 to-burgundy/15 border border-rose/30 p-5 shadow-xl shadow-rose/20">
                    <div className="flex items-start space-x-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose/30 to-burgundy/20 flex items-center justify-center shadow-lg shadow-rose/30">
                        <AlertCircle className="w-6 h-6 text-burgundy" />
                      </div>
                      <div>
                        <h4 className="font-bold text-primary-text mb-1 text-xl">Immediate Attention Required</h4>
                        <p className="text-[16px] text-secondary-text-thin leading-relaxed">{parsed.emergencyReasoning}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Greeting */}
                {parsed?.greeting && (
                  <p className="text-[19px] text-primary-text leading-[1.8] font-normal">
                    {parsed.greeting}
                  </p>
                )}

                {/* Action Items */}
                {parsed?.actionItems && parsed.actionItems.length > 0 && (
                  <div className="space-y-5">
                    {parsed.actionItems.map((item, idx) => (
                      <div key={idx} className="flex space-x-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sage-light/40 to-sage/30 flex items-center justify-center flex-shrink-0 shadow-lg shadow-sage/25">
                          <Leaf className="w-6 h-6 text-sage-dark" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-[22px] text-primary-text mb-3">
                            {item.title}
                          </h4>
                          <div 
                            className="text-[17px] text-secondary-text-thin leading-[1.8] font-normal [&_strong]:font-bold [&_strong]:text-primary-text [&_em]:font-semibold [&_em]:text-primary-text [&_em]:not-italic"
                            dangerouslySetInnerHTML={{ __html: item.content || item.description || '' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Additional Information */}
                {parsed?.additionalInformation && (
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50/50 to-amber-50/30 p-6 border border-amber-100/30">
                    <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br from-amber-100/20 to-amber-200/10 blur-2xl" />
                    <div className="relative flex items-start space-x-3">
                      <div className="w-1 h-full bg-gradient-to-b from-amber-300/50 to-amber-200/20 rounded-full flex-shrink-0" />
                      <div 
                        className="text-[15px] text-gray-700 leading-[1.7] italic font-light"
                        dangerouslySetInnerHTML={{ __html: parsed.additionalInformation }}
                      />
                    </div>
                  </div>
                )}

                {/* Actionable Items */}
                {parsed?.actionableItems && parsed.actionableItems.length > 0 && (
                  <div className="space-y-3 pt-2 -mx-2">
                    {parsed.actionableItems.map((item, idx) => {
                      let Icon = Heart;
                      let gradientClass = "";
                      let iconColorClass = "";
                      let backgroundClass = "";
                      let shadowClass = "";
                      let borderColorHover = "";
                      
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
                        // Default icons based on type
                        if (item.type === 'appointment') Icon = Calendar;
                        else if (item.type === 'medicine' || item.type === 'supplement') Icon = Pill;
                        else if (item.type === 'routine' || item.type === 'create_routine') Icon = Sparkles;
                        else if (item.type === 'information') Icon = FileText;
                      }
                      
                      // Color sequence: sage green -> pink/bronze -> slate blue -> repeat
                      const colorIndex = idx % 3;
                      
                      if (colorIndex === 0) {
                        // Light sage green
                        gradientClass = "from-sage-light/30 to-sage/20";
                        iconColorClass = "text-sage-dark";
                        backgroundClass = "from-sage-light/10 to-sage/5";
                        shadowClass = "shadow-sage/20";
                        borderColorHover = "hover:border-sage/40";
                      } else if (colorIndex === 1) {
                        // Light pink/bronze
                        gradientClass = "from-rose/20 to-dusty-rose/15";
                        iconColorClass = "text-rose";
                        backgroundClass = "from-rose/5 to-dusty-rose/5";
                        shadowClass = "shadow-rose/15";
                        borderColorHover = "hover:border-rose/30";
                      } else {
                        // Light slate blue
                        gradientClass = "from-slate-300/30 to-slate-400/20";
                        iconColorClass = "text-slate-700";
                        backgroundClass = "from-slate-50 to-slate-100/50";
                        shadowClass = "shadow-slate-300/30";
                        borderColorHover = "hover:border-slate-400/40";
                      }
                      
                      return (
                        <button
                          key={idx}
                          onClick={() => handleActionClick(item)}
                          className={`w-full mx-2 flex items-center space-x-4 p-5 rounded-2xl bg-gradient-to-r ${backgroundClass} border border-gray-200 shadow-xl ${shadowClass} hover:shadow-2xl ${borderColorHover} transition-all duration-300 text-left group`}
                        >
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradientClass} flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform`}>
                            <Icon className={`w-6 h-6 ${iconColorClass}`} />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-primary-text text-[20px] mb-2">{item.title}</h4>
                            <p className="text-[16px] text-secondary-text-thin leading-relaxed font-light">{item.description || item.details}</p>
                          </div>
                          <ChevronRight className="w-6 h-6 text-gray-300 group-hover:text-sage-dark group-hover:translate-x-2 transition-all" />
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Fallback for plain text */}
                {!parsed && message.content && (
                  <p className="text-[19px] text-primary-text leading-[1.8] font-normal">{message.content}</p>
                )}

                {/* Questions Section - Inside the card */}
                {message.parsedContent?.questions && 
                 message.parsedContent.questions.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <p className="text-[16px] text-secondary-text mb-4 font-normal">Let&apos;s talk more?</p>
                    <div className="space-y-3">
                      {message.parsedContent.questions.map((question, qIdx) => {
                        const cleanQuestion = stripHtml(question);
                        return (
                          <button
                            key={qIdx}
                            onClick={() => handleQuestionClick(cleanQuestion)}
                            className="relative w-full flex items-center space-x-4 p-4 rounded-2xl bg-gradient-to-r from-white to-gray-50/30 hover:from-white hover:to-sage-light/10 hover:shadow-xl hover:shadow-sage/20 transition-all duration-300 text-left group border-2 border-gray-200 hover:border-sage/40 cursor-pointer"
                          >
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sage-light/30 to-sage/20 flex items-center justify-center flex-shrink-0 group-hover:from-sage/40 group-hover:to-sage-dark/30 transition-all shadow-md shadow-sage/20 group-hover:shadow-lg">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sage-dark group-hover:text-sage-dark transition-colors">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                              </svg>
                            </div>
                            <p className="text-[16px] text-secondary-text-thin leading-[1.6] font-normal group-hover:text-primary-text transition-colors flex-1">
                              {cleanQuestion}
                            </p>
                            
                            {/* Clickable indicator dot - bottom right */}
                            <div className="absolute bottom-3 right-3 w-2 h-2 rounded-full bg-slate-400 group-hover:bg-slate-600 transition-colors" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      {renderHeader?.()}

      {/* Messages Area - Scrollable with proper flex */}
      <div className="flex-1 overflow-y-auto min-h-0 pb-safe">
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
                {renderMessage(message, idx)}
              </React.Fragment>
            ))}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}
      </div>

      {/* Input Area - Fixed at Bottom with safe area */}
      <div className="flex-shrink-0">
        <ChatEditor
          value={input}
          onChange={setInput}
          onSubmit={handleSendMessage}
          isLoading={isLoading}
          className="flex-shrink-0"
          autoFocus={!!selectedPrompt}
        />
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

      {showJourneyModal && journeyData && (
        <JourneyCreationModal
          isOpen={showJourneyModal}
          onClose={() => {
            setShowJourneyModal(false);
            setJourneyData(null);
          }}
          journeyData={journeyData}
          healthConcern={healthConcern}
          onJourneyCreated={(journey) => {
            onJourneyCreated?.(journey);
            setShowJourneyModal(false);
            setJourneyData(null);
          }}
        />
      )}
    </div>
  );
};