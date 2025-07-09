'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AlertCircle, Calendar, Pill, Heart, Sparkles, ChevronRight, Moon, Brain, Activity, FileText, Globe, BookOpen, Leaf } from 'lucide-react';
import {
  ChatMessage,
  ActionableItem,
  ActionItem,
  AssistantResponse,
  ASSISTANT_RESPONSE_KEYS,
  WellnessRoutine,
  PartialAssistantResponse
} from '@/src/services/openai/types';
import { RoutineCreationModal } from './RoutineCreationModal';
import { JourneyCreationModal } from './JourneyCreationModal';
import { stripHtml } from '@/src/utils/html';
import { WellnessJourney } from '@/src/services/openai/types/journey';
import { getJourneyByType } from '@/src/utils/journeyStorage';
import { ChatEditor } from '@/components/ui/ChatEditor';
import { createChatThread, addMessageToThread, getChatThread, deleteChatThread } from '@/src/utils/chatStorage';
import { useKeyboardAwareChat } from '@/hooks/useKeyboardAwareChat';
import { ChatWelcome } from './ChatWelcome';
import { ThrivingTutorial } from './ThrivingTutorial';

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
  const abortControllerRef = useRef<AbortController | null>(null);
  const [chatThreadId, setChatThreadId] = useState<string | null>(null);
  const hasScrolledToStreamRef = useRef<Set<number>>(new Set());
  const { messagesEndRef, chatContainerRef, scrollToBottom } = useKeyboardAwareChat();
  const [showThrivingTutorial, setShowThrivingTutorial] = useState(false);
  const [tutorialActionableText, setTutorialActionableText] = useState<string>('');
  const hasShownTutorialInSession = useRef(false);
  const tutorialTargetButtonRef = useRef<HTMLButtonElement | null>(null);

  // Load existing messages if threadId is provided
  useEffect(() => {
    if (initialThreadId && initialThreadId !== 'new') {
      const thread = getChatThread(initialThreadId);
      if (thread) {
        setChatThreadId(thread.id);
        // Convert stored messages to the format expected by the component
        const loadedMessages: ChatMessage[] = thread.messages.map(msg => {
          const message: ChatMessage = {
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp)
          };
          
          // If it's an assistant message, try to parse the content
          if (msg.role === 'assistant') {
            try {
              const parsed = JSON.parse(msg.content);
              // Check if it has the structure of an assistant response
              if (parsed && typeof parsed === 'object' && 
                  ('greeting' in parsed || 'actionItems' in parsed || 'actionableItems' in parsed)) {
                message.parsedContent = parsed;
              }
            } catch {
              // Not JSON or parsing failed, leave as plain text
            }
          }
          
          return message;
        });
        setMessages(loadedMessages);
      }
    }
  }, [initialThreadId]);

  // scrollToBottom is now provided by useKeyboardAwareChat hook

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
      const messageIndex = messages.length - 1;
      
      if (lastMessage.role === 'user' || messages.length === 1) {
        scrollToBottom();
        // Clear scroll tracking for this position when user sends new message
        hasScrolledToStreamRef.current.delete(messageIndex);
      } else if (lastMessage.role === 'assistant' && lastMessage.isStreaming) {
        // For streaming messages, only scroll when first content appears and we haven't scrolled yet
        const hasContent = lastMessage.parsedContent && Object.keys(lastMessage.parsedContent).length > 0;
        const hasNotScrolledYet = !hasScrolledToStreamRef.current.has(messageIndex);
        
        if (hasContent && hasNotScrolledYet) {
          hasScrolledToStreamRef.current.add(messageIndex);
          setTimeout(() => {
            const messageElements = document.querySelectorAll('[data-message-index]');
            const lastMessageElement = messageElements[messageIndex];
            
            if (lastMessageElement && !isElementInViewport(lastMessageElement)) {
              scrollToMessage(messageIndex);
            }
          }, 100);
        }
      }
      // Don't scroll for completed assistant messages or after first content appears
    }
  }, [messages, scrollToBottom]);

  // Show thriving tutorial automatically on mobile or after delay
  useEffect(() => {
    if (messages.length > 0 && !showThrivingTutorial && !hasShownTutorialInSession.current) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && lastMessage.parsedContent?.actionableItems) {
        const thrivingItem = lastMessage.parsedContent.actionableItems.find(
          item => item.type === 'create_routine' || item.type === 'routine' || item.type === 'start_journey'
        );
        const tutorialCount = parseInt(localStorage.getItem('thrivingTutorialCount') || '0');
        const hasCreatedThriving = localStorage.getItem('hasCreatedThriving') === 'true';
        if (thrivingItem && tutorialCount < 2 && !hasCreatedThriving) {
          // Show tutorial after a delay
          const timer = setTimeout(() => {
            // Get the title from the thriving item
            const itemTitle = thrivingItem.title || thrivingItem.journeyTitle || thrivingItem.description || '';
            setTutorialActionableText(itemTitle);
            setShowThrivingTutorial(true);
            hasShownTutorialInSession.current = true;
          }, 2000);
          return () => clearTimeout(timer);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]); // Intentionally exclude showThrivingTutorial to prevent re-runs

  useEffect(() => {
    if (selectedPrompt) {
      setInput(selectedPrompt);
      onPromptUsed?.();
    }
  }, [selectedPrompt, onPromptUsed]); // Remove input from dependencies to avoid infinite loop

  const handleSendMessage = async (messageOverride?: string) => {
    const messageToSend = messageOverride || input;
    if (!messageToSend.trim() || isLoading) return;

    // Mark that user has sent a message
    localStorage.setItem('hasEverSentMessage', 'true');

    const trimmedInput = messageToSend.trim().toLowerCase();
    
    // Check if user sent the default thriving creation text AND we're in thriving mode
    if (trimmedInput === 'create a wellness thriving for me' && chatIntent === 'create_thriving') {
      const userMessage: ChatMessage = {
        role: 'user',
        content: messageToSend,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
      setInput('');
      
      // Save user message to chat history
      const currentThreadId = chatThreadId || threadId || createChatThread().id;
      if (!chatThreadId && !threadId) {
        setChatThreadId(currentThreadId);
      }
      addMessageToThread(currentThreadId, { role: 'user', content: userMessage.content });
      
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
      content: messageToSend,
      timestamp: new Date()
    };

    // Store the health concern for routine creation
    setHealthConcern(messageToSend);

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Save user message to chat history
    const currentThreadId = chatThreadId || threadId || createChatThread().id;
    if (!chatThreadId && !threadId) {
      setChatThreadId(currentThreadId);
    }
    addMessageToThread(currentThreadId, { role: 'user', content: userMessage.content });

    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
      parsedContent: {} as PartialAssistantResponse
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
                
                // If we had a temporary local thread, we should update to use the API thread ID
                if (chatThreadId && chatThreadId !== data.threadId) {
                  // Update the thread ID in localStorage to match the API thread ID
                  const localThread = getChatThread(chatThreadId);
                  if (localThread) {
                    // Transfer messages to the new thread ID
                    localThread.messages.forEach(msg => {
                      addMessageToThread(data.threadId, msg);
                    });
                    // Delete the old temporary thread
                    deleteChatThread(chatThreadId);
                  } else {
                    // If no local thread exists, create one with the API thread ID
                    // This handles the case where we're using the API thread ID from the start
                    const existingMessages = messages.filter(m => m.content);
                    existingMessages.forEach(msg => {
                      if (msg.role === 'user' || msg.role === 'assistant') {
                        addMessageToThread(data.threadId, { role: msg.role, content: msg.content });
                      }
                    });
                  }
                }
              }

              if (data.type === 'delta' && data.content) {
                fullContent += data.content;
                setMessages(prev => {
                  const updated = [...prev];
                  const lastMessage = updated[updated.length - 1];
                  if (lastMessage.role === 'assistant') {
                    lastMessage.content = fullContent;
                    // Try to parse partial content for progressive rendering
                    const partialParsed = parsePartialAssistantResponse(fullContent);
                    if (partialParsed) {
                      lastMessage.parsedContent = partialParsed;
                    }
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
                const currentThreadId = newThreadId || chatThreadId || threadId;
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

  // Parse partial JSON for progressive rendering
  const parsePartialAssistantResponse = (content: string): PartialAssistantResponse | undefined => {
    try {
      // Try to parse complete JSON first
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object') {
        return parsed as PartialAssistantResponse;
      }
    } catch {
      // If complete parse fails, try to extract completed fields
      const partial: PartialAssistantResponse = {};
      
      // Extract greeting if complete
      const greetingMatch = content.match(/"greeting"\s*:\s*"([^"]*)"(?:\s*,|\s*})/);
      if (greetingMatch && greetingMatch[1]) {
        partial.greeting = greetingMatch[1];
      }
      
      // Extract attentionRequired if complete
      const attentionMatch = content.match(/"attentionRequired"\s*:\s*"([^"]*)"/);
      if (attentionMatch) {
        partial.attentionRequired = attentionMatch[1] as 'emergency' | null;
      }
      
      // Extract emergencyReasoning if complete
      const emergencyMatch = content.match(/"emergencyReasoning"\s*:\s*"([^"]*)"/);
      if (emergencyMatch) {
        partial.emergencyReasoning = emergencyMatch[1];
      }
      
      // Extract complete action items or individual completed items
      const actionItemsMatch = content.match(/"actionItems"\s*:\s*\[([\s\S]*?)(?:\]|$)/);
      if (actionItemsMatch) {
        try {
          // First try to parse complete array
          if (content.includes('"actionItems"') && content.includes(']', content.indexOf('"actionItems"'))) {
            const completeMatch = content.match(/"actionItems"\s*:\s*\[([\s\S]*?)\]/);
            if (completeMatch) {
              const items = JSON.parse('[' + completeMatch[1] + ']');
              if (Array.isArray(items) && items.length > 0) {
                partial.actionItems = items;
              }
            }
          } else {
            // Try to extract individual completed items
            const partialItems: ActionItem[] = [];
            const itemMatches = actionItemsMatch[1].matchAll(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
            for (const match of itemMatches) {
              try {
                const item = JSON.parse(match[0]);
                if (item.title && item.content) {
                  partialItems.push(item);
                }
              } catch {}
            }
            if (partialItems.length > 0) {
              partial.actionItems = partialItems;
            }
          }
        } catch {}
      }
      
      // Extract complete actionable items or individual completed items
      const actionableMatch = content.match(/"actionableItems"\s*:\s*\[([\s\S]*?)(?:\]|$)/);
      if (actionableMatch) {
        try {
          // First try to parse complete array
          if (content.includes('"actionableItems"') && content.includes(']', content.indexOf('"actionableItems"'))) {
            const completeMatch = content.match(/"actionableItems"\s*:\s*\[([\s\S]*?)\]/);
            if (completeMatch) {
              const items = JSON.parse('[' + completeMatch[1] + ']');
              if (Array.isArray(items) && items.length > 0) {
                partial.actionableItems = items;
              }
            }
          } else {
            // Try to extract individual completed items
            const partialItems: ActionableItem[] = [];
            const itemMatches = actionableMatch[1].matchAll(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
            for (const match of itemMatches) {
              try {
                const item = JSON.parse(match[0]);
                if (item.title && item.type) {
                  partialItems.push(item);
                }
              } catch {}
            }
            if (partialItems.length > 0) {
              partial.actionableItems = partialItems;
            }
          }
        } catch {}
      }
      
      // Extract additionalInformation if complete
      const infoMatch = content.match(/"additionalInformation"\s*:\s*"([^"]*)"/);
      if (infoMatch) {
        partial.additionalInformation = infoMatch[1];
      }
      
      // Extract complete questions array
      const questionsMatch = content.match(/"questions"\s*:\s*\[([\s\S]*?)\]/);
      if (questionsMatch) {
        try {
          const questionsContent = '[' + questionsMatch[1] + ']';
          const questions = JSON.parse(questionsContent);
          if (Array.isArray(questions) && questions.length > 0) {
            partial.questions = questions;
          }
        } catch {}
      }
      
      return Object.keys(partial).length > 0 ? partial : undefined;
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
      // Convert pharmacy link to Amazon search
      // Extract the supplement name from the title or description
      const supplementName = action.title.replace(/^(Buy|Get|Purchase)\s+/i, '');
      const searchQuery = encodeURIComponent(supplementName + ' supplement');
      const amazonSearchUrl = `https://www.amazon.com/s?k=${searchQuery}`;
      window.open(amazonSearchUrl, '_blank');
    } else if (action.amazon_link) {
      window.open(action.amazon_link, '_blank');
    }
  };

  const handleQuestionClick = (question: string) => {
    setInput(question);
    // Pass the question directly to avoid state update delay
    handleSendMessage(question);
  };

  const renderMessage = (message: ChatMessage, messageIndex: number) => {
    if (message.role === 'user') {
      return (
        <div className="flex justify-end mb-6" data-message-index={messageIndex}>
          <div className="max-w-[90%] md:max-w-[85%]">
            <div className="rounded-3xl px-6 py-4 bg-gradient-to-br from-sage-light/20 to-sage/15 shadow-xl shadow-sage/25 border border-sage/20">
              <p className="text-[15px] leading-[1.6] font-normal text-primary-text">{message.content}</p>
              <p className="text-[13px] text-gray-500 mt-2">
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

    // Check if we have any content to render progressively
    const hasPartialContent = message.isStreaming && parsed && Object.keys(parsed).length > 0;
    
    return (
      <div className="flex justify-start mb-6" data-message-index={messageIndex}>
        <div className="max-w-[98%] md:max-w-[95%] lg:max-w-[85%]">
          {(hasPartialContent || !message.isStreaming) ? (
            <div className="relative rounded-3xl bg-white shadow-2xl shadow-gray-300/80 overflow-hidden border-2 border-gray-200/70">
              {/* Gradient accent line */}
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose via-dusty-rose to-burgundy" />
              <div className="p-5 pt-6 space-y-5">
                {/* Sender Label */}
                <div className="mb-3">
                  <span className="text-sm font-semibold text-burgundy">Wellness Companion</span>
                </div>
                {/* Emergency Alert */}
                {parsed?.attentionRequired === 'emergency' && (
                  <div className="rounded-2xl bg-gradient-to-r from-rose/15 to-burgundy/15 border border-rose/30 p-4 shadow-xl shadow-rose/20">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose/30 to-burgundy/20 flex items-center justify-center shadow-lg shadow-rose/30">
                        <AlertCircle className="w-5 h-5 text-burgundy" />
                      </div>
                      <div>
                        <h4 className="font-bold text-primary-text mb-1 text-lg">Immediate Attention Required</h4>
                        <p className="text-[15px] text-secondary-text leading-relaxed">{parsed.emergencyReasoning}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Greeting */}
                {parsed?.greeting && (
                  <p className="text-[16px] text-primary-text leading-[1.7]">
                    {parsed.greeting}
                  </p>
                )}

                {/* Action Items */}
                {parsed?.actionItems && parsed.actionItems.length > 0 && (
                  <div className="space-y-4">
                    {parsed.actionItems.map((item, idx) => (
                      <div key={idx} className="flex space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sage-light/40 to-sage/30 flex items-center justify-center flex-shrink-0 shadow-lg shadow-sage/25">
                          <Leaf className="w-5 h-5 text-sage-dark" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-[18px] text-primary-text mb-2">
                            {item.title}
                          </h4>
                          <div 
                            className="text-[15px] text-primary-text leading-[1.7] [&_strong]:font-bold [&_strong]:text-primary-text [&_em]:font-semibold [&_em]:text-primary-text [&_em]:not-italic"
                            dangerouslySetInnerHTML={{ __html: item.content || item.description || '' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Additional Information */}
                {parsed?.additionalInformation && (
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#FFE0CC]/40 to-[#FFCBB8]/30 p-6 border border-[#E08B5D]/20">
                    <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br from-[#E08B5D]/20 to-[#D4696F]/10 blur-2xl" />
                    <div className="relative flex items-start space-x-3">
                      <div className="w-1 h-full bg-gradient-to-b from-[#E08B5D]/50 to-[#D4696F]/30 rounded-full flex-shrink-0" />
                      <div 
                        className="text-[14px] text-[#5A4A42] leading-[1.6] italic font-medium"
                        dangerouslySetInnerHTML={{ __html: parsed.additionalInformation }}
                      />
                    </div>
                  </div>
                )}

                {/* Actionable Items - Compact Design with Original Colors */}
                {parsed?.actionableItems && parsed.actionableItems.length > 0 && (
                  <div className="space-y-2 pt-2">
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
                      
                      // Original color sequence: sage green -> pink/bronze -> slate blue -> repeat
                      const colorIndex = idx % 3;
                      
                      if (colorIndex === 0) {
                        // Light sage green
                        gradientClass = "from-sage-light/30 to-sage/20";
                        iconColorClass = "text-sage-dark";
                        backgroundClass = "from-sage-light/10 to-sage/5";
                        shadowClass = "shadow-sage/15";
                        borderColorHover = "hover:border-sage/30";
                      } else if (colorIndex === 1) {
                        // Light pink/bronze
                        gradientClass = "from-rose/20 to-dusty-rose/15";
                        iconColorClass = "text-rose";
                        backgroundClass = "from-rose/5 to-dusty-rose/5";
                        shadowClass = "shadow-rose/10";
                        borderColorHover = "hover:border-rose/25";
                      } else {
                        // Light slate blue
                        gradientClass = "from-slate-300/30 to-slate-400/20";
                        iconColorClass = "text-slate-700";
                        backgroundClass = "from-slate-50 to-slate-100/50";
                        shadowClass = "shadow-slate-300/20";
                        borderColorHover = "hover:border-slate-400/30";
                      }
                      
                      // Check if this is a thriving button and if it matches the tutorial
                      const isThrivingButton = item.type === 'create_routine' || item.type === 'routine' || item.type === 'start_journey';
                      const shouldAttachRef = isThrivingButton && 
                        (item.title === tutorialActionableText || 
                         item.journeyTitle === tutorialActionableText || 
                         item.description === tutorialActionableText);

                      return (
                        <button
                          key={idx}
                          ref={shouldAttachRef ? tutorialTargetButtonRef : undefined}
                          onClick={() => handleActionClick(item)}
                          className={`w-full p-3 rounded-xl bg-gradient-to-r ${backgroundClass} border border-gray-200/50 shadow-sm ${shadowClass} hover:shadow-md ${borderColorHover} transition-all duration-200 text-left group touch-feedback touch-manipulation`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradientClass} flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm group-hover:scale-105 transition-transform`}>
                              <Icon className={`w-4 h-4 ${iconColorClass}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-gray-900 text-[14px]">{item.title}</h4>
                                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-2" />
                              </div>
                              {item.description && (
                                <p className="text-[12px] text-gray-600 mt-0.5 leading-relaxed">{item.description}</p>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Fallback for plain text - only show if not streaming or no parsed content */}
                {!parsed && message.content && !message.isStreaming && (
                  <p className="text-[16px] text-primary-text leading-[1.7] font-normal">{message.content}</p>
                )}
                
                {/* Typing indicator - show at the bottom of content if still streaming */}
                {message.isStreaming && (
                  <div className="mt-4" data-testid="typing-indicator">
                    <div className="flex space-x-1">
                      <span className="w-3 h-3 bg-gradient-to-r from-sage to-sage-dark rounded-full animate-wave" style={{ animationDelay: '0s' }} />
                      <span className="w-3 h-3 bg-gradient-to-r from-sage to-sage-dark rounded-full animate-wave" style={{ animationDelay: '0.15s' }} />
                      <span className="w-3 h-3 bg-gradient-to-r from-sage to-sage-dark rounded-full animate-wave" style={{ animationDelay: '0.3s' }} />
                    </div>
                  </div>
                )}

                {/* Questions Section - Inside the card */}
                {message.parsedContent?.questions && 
                 message.parsedContent.questions.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <p className="text-[14px] text-secondary-text-thin mb-3">Let&apos;s talk more?</p>
                    <div className="space-y-3">
                      {message.parsedContent.questions.map((question, qIdx) => {
                        const cleanQuestion = stripHtml(question);
                        return (
                          <button
                            key={qIdx}
                            onClick={() => handleQuestionClick(cleanQuestion)}
                            className="relative w-full flex items-center space-x-4 p-4 rounded-2xl bg-gradient-to-r from-white to-gray-50/30 hover:from-white hover:to-sage-light/10 hover:shadow-xl hover:shadow-sage/20 transition-all duration-300 text-left group border-2 border-gray-200 hover:border-sage/40 cursor-pointer touch-feedback-subtle touch-manipulation"
                          >
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sage-light/30 to-sage/20 flex items-center justify-center flex-shrink-0 group-hover:from-sage/40 group-hover:to-sage-dark/30 transition-all shadow-md shadow-sage/20 group-hover:shadow-lg">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sage-dark group-hover:text-sage-dark transition-colors">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                              </svg>
                            </div>
                            <p className="text-[14px] text-secondary-text-thin leading-[1.5] group-hover:text-primary-text transition-colors flex-1">
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
          ) : (
            /* Show only typing indicator if streaming with no content yet */
            <div className="rounded-3xl bg-white shadow-2xl shadow-gray-300/80 p-6" data-testid="typing-indicator-only">
              <div className="flex space-x-1">
                <span className="w-3 h-3 bg-gradient-to-r from-sage to-sage-dark rounded-full animate-wave" style={{ animationDelay: '0s' }} />
                <span className="w-3 h-3 bg-gradient-to-r from-sage to-sage-dark rounded-full animate-wave" style={{ animationDelay: '0.15s' }} />
                <span className="w-3 h-3 bg-gradient-to-r from-sage to-sage-dark rounded-full animate-wave" style={{ animationDelay: '0.3s' }} />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="chat-container" ref={chatContainerRef}>
      {/* Header - stays at top */}
      <div className="chat-header safe-top">
        {renderHeader?.()}
      </div>

      {/* Messages - scrollable middle section that shrinks */}
      <div className="chat-messages smooth-scroll">
        <div className="chat-messages-content">
          {/* Welcome Screen OR Prompt Templates OR Messages */}
          {messages.length === 0 ? (
            <>
              {/* Show prompt templates if provided, otherwise show welcome */}
              {renderPromptTemplates ? (
                <div className="min-h-full">
                  {renderPromptTemplates(messages)}
                </div>
              ) : (
                <ChatWelcome visible={true} />
              )}
            </>
          ) : (
            /* Messages */
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
      </div>

      {/* Input - stays at bottom */}
      <div className="chat-input-area safe-bottom">
        <ChatEditor
          value={input}
          onChange={setInput}
          onSubmit={handleSendMessage}
          isLoading={isLoading}
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
            // Mark that user has created a thriving
            localStorage.setItem('hasCreatedThriving', 'true');
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
            // Mark that user has created a thriving
            localStorage.setItem('hasCreatedThriving', 'true');
          }}
        />
      )}

      {showThrivingTutorial && (
        <ThrivingTutorial
          actionableItemText={tutorialActionableText}
          onClose={() => {
            setShowThrivingTutorial(false);
            const currentCount = parseInt(localStorage.getItem('thrivingTutorialCount') || '0');
            localStorage.setItem('thrivingTutorialCount', String(currentCount + 1));
          }}
          onArrowClick={() => {
            // Scroll to the button and click it after 2 seconds
            if (tutorialTargetButtonRef.current) {
              // Scroll the button into view
              tutorialTargetButtonRef.current.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
              });
              
              // Add a visual indication that the button will be clicked
              tutorialTargetButtonRef.current.classList.add('animate-pulse');
              
              // Click the button after 2 seconds
              setTimeout(() => {
                if (tutorialTargetButtonRef.current) {
                  tutorialTargetButtonRef.current.classList.remove('animate-pulse');
                  tutorialTargetButtonRef.current.click();
                }
              }, 2000);
            }
          }}
        />
      )}
    </div>
  );
};