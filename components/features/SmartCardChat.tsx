'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  AlertCircle, ShoppingCart, PlusCircle, ChevronRight, Heart,
  Calendar, Pill, Sparkles, Moon, Brain, Activity, FileText, Globe, BookOpen, Settings 
} from 'lucide-react';
import {
  ChatMessage,
  ActionableItem,
  EnhancedQuestion,
  PartialAssistantResponse
} from '@/src/services/openai/types';
import { parseAssistantResponse, parsePartialAssistantResponse } from '@/src/utils/chat/responseParser';
import { ActionItemList } from './chat/ActionItemCard';
import { AdditionalInfoCard } from './chat/AdditionalInfoCard';
import { RoutineCreationModal } from './RoutineCreationModal';
import { JourneyCreationModal } from './JourneyCreationModal';
import bridge from '@/src/lib/react-native-bridge';
import { WellnessJourney } from '@/src/services/openai/types/journey';
import { getJourneyByType } from '@/src/utils/journeyStorage';
import { ChatEditor } from '@/components/ui/ChatEditor';
import { createChatThread, addMessageToThread, getChatThread, deleteChatThread, isGeneratedThreadId } from '@/src/utils/chatStorage';
import { useKeyboardAwareChat } from '@/hooks/useKeyboardAwareChat';
import { ChatWelcome } from './ChatWelcome';
import { ThrivingTutorial } from './ThrivingTutorial';
import { PantryAddModal } from './PantryAddModal';
import Button, { CardButton } from '@/components/ui/Button';
import { savePantryItem } from '@/src/utils/pantryStorage';
import { PantryItem } from '@/src/types/pantry';
import { EnhancedQuestions } from './EnhancedQuestions';
import { ConversationalAnswerFlow } from './ConversationalAnswerFlow';
import { getBasicContext } from '@/src/utils/contextHelper';
import { generatePostActionMessage, PostActionMessage } from '@/src/utils/chat/postActionMessages';
import { ExpertConsultationCard } from './ExpertConsultationCard';

interface SmartCardChatProps {
  threadId?: string;
  chatIntent?: string | null;
  onThreadCreated?: (threadId: string) => void;
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
  const streamingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { messagesEndRef, scrollToBottom } = useKeyboardAwareChat();
  const [showThrivingTutorial, setShowThrivingTutorial] = useState(false);
  const [tutorialActionableText, setTutorialActionableText] = useState<string>('');
  const hasShownTutorialInSession = useRef(false);
  const tutorialTargetButtonRef = useRef<HTMLButtonElement | null>(null);
  const handledIncompleteConversations = useRef<Set<string>>(new Set());
  const [showPantryModal, setShowPantryModal] = useState(false);
  const [pantryItemToAdd, setPantryItemToAdd] = useState<ActionableItem | null>(null);
  // Conversational Flow State
  // These manage the "voice-style" answer batching system
  const [lastAssistantQuestions, setLastAssistantQuestions] = useState<EnhancedQuestion[]>([]);
  const [stagedAnswers, setStagedAnswers] = useState<Array<{ question: string; answer: string; timestamp: number }>>([]);  // Answers waiting to be sent
  const [isUserTyping, setIsUserTyping] = useState(false);  // Triggers immediate send of staged answers
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);  // Detects when user stops typing
  const [currentQuestion, setCurrentQuestion] = useState<EnhancedQuestion | null>(null);  // Track current question for unified input
  const [submittedAnswer, setSubmittedAnswer] = useState<string>('');  // Answer submitted through main chat input

  // WebView detection logging (temporary for debugging)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('User Agent:', navigator.userAgent);
      console.log('Is WebView:', /wv|WebView/.test(navigator.userAgent));
      console.log('Is Android:', /android/i.test(navigator.userAgent));
      console.log('Window height:', window.innerHeight);
      console.log('Screen height:', window.screen.height);
    }
  }, []);

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
        
        // Check if the last message is from the user AND there's no recent assistant response
        // This prevents false positives when user has answered questions but conversation is complete
        const hasIncompleteConversation = loadedMessages.length > 0 && 
          loadedMessages[loadedMessages.length - 1].role === 'user' &&
          (() => {
            // Look for the last assistant message
            const lastAssistantMessageIndex = loadedMessages.map(m => m.role).lastIndexOf('assistant');
            if (lastAssistantMessageIndex === -1) {
              // No assistant message at all - definitely incomplete
              return true;
            }
            
            // Check if the last assistant message was a meaningful response
            const lastAssistantMessage = loadedMessages[lastAssistantMessageIndex];
            try {
              const parsed = JSON.parse(lastAssistantMessage.content);
              // If assistant message has substantive content (greeting, actions, or questions), 
              // then the conversation is likely complete
              if (parsed.greeting || 
                  (parsed.actionItems && parsed.actionItems.length > 0) || 
                  (parsed.actionableItems && parsed.actionableItems.length > 0) ||
                  (parsed.questions && parsed.questions.length > 0)) {
                return false; // Conversation is complete
              }
            } catch {
              // If not JSON or has plain text content, consider it complete
              if (lastAssistantMessage.content.trim().length > 10) {
                return false;
              }
            }
            
            // If we get here, the last assistant message was likely empty or incomplete
            return true;
          })();
        
        // Auto-scroll to the latest message after loading from history
        // Add a delay to ensure messages are rendered in the DOM
        if (loadedMessages.length > 0) {
          // Use requestAnimationFrame to ensure DOM is updated
          requestAnimationFrame(() => {
            setTimeout(() => {
              const messagesContainer = document.querySelector('.chat-messages-container');
              if (messagesContainer) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
              }
              // Force a second scroll after a longer delay in case of slow renders
              setTimeout(() => {
                if (messagesContainer) {
                  messagesContainer.scrollTop = messagesContainer.scrollHeight;
                }
              }, 300);
            }, 50);
          });
        }
        
        // If conversation is incomplete, re-send the last user message
        if (hasIncompleteConversation) {
          const lastUserMessage = loadedMessages[loadedMessages.length - 1];
          const handlingKey = `${initialThreadId}_${lastUserMessage.content}_${lastUserMessage.timestamp}`;
          
          // Triple protection: sessionStorage, useRef, and recent handling check
          const hasAlreadyHandled = sessionStorage.getItem(`incomplete_${handlingKey}`) || 
                                   handledIncompleteConversations.current.has(handlingKey);
          
          // Additional check: Don't resend if we just loaded this conversation (might be false positive)
          const justLoadedKey = `loaded_${initialThreadId}`;
          const wasJustLoaded = sessionStorage.getItem(justLoadedKey);
          if (!wasJustLoaded) {
            sessionStorage.setItem(justLoadedKey, 'true');
            // Clean up after 5 seconds
            setTimeout(() => {
              sessionStorage.removeItem(justLoadedKey);
            }, 5000);
          }
          
          if (!hasAlreadyHandled && !wasJustLoaded) {
            sessionStorage.setItem(`incomplete_${handlingKey}`, 'true');
            handledIncompleteConversations.current.add(handlingKey);
            
            console.log('Detected truly incomplete conversation, re-sending:', lastUserMessage.content);
            
            // Add a delay to ensure UI is ready
            setTimeout(() => {
              // Show a loading state immediately
              const loadingMessage: ChatMessage = {
                role: 'assistant',
                content: '',
                timestamp: new Date(),
                isStreaming: true,
                parsedContent: {} as PartialAssistantResponse
              };
              setMessages(prev => [...prev, loadingMessage]);
              
              // Re-send the message to get a response, but don't add it to history again
              handleSendMessage(lastUserMessage.content, lastUserMessage.content, true);
            }, 500);
          } else {
            console.log('Skipping resend - conversation was already handled or just loaded');
          }
        }
      }
    }
  }, [initialThreadId]); // eslint-disable-line react-hooks/exhaustive-deps
  // Intentionally omitting handleSendMessage to prevent infinite loops
  // This useEffect should only run when initialThreadId changes (i.e., loading a different thread)

  // Check for post-action message from routine creation
  useEffect(() => {
    const postActionData = sessionStorage.getItem('routineCreatedPostAction');
    if (postActionData && threadId) {
      try {
        const postAction = JSON.parse(postActionData);
        const postActionMsg = generatePostActionMessage(postAction);
        
        // Add a small delay to ensure the chat is fully loaded
        setTimeout(() => {
          handleSendMessage(postActionMsg);
        }, 500);
        
        // Clear the post-action data
        sessionStorage.removeItem('routineCreatedPostAction');
      } catch (error) {
        console.error('Error handling post-action message:', error);
        sessionStorage.removeItem('routineCreatedPostAction');
      }
    }
  }, [threadId]); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const messageIndex = messages.length - 1;
      
      // Always scroll for user messages
      if (lastMessage.role === 'user') {
        // Add small delay to ensure message is rendered
        setTimeout(() => {
          scrollToBottom();
        }, 50);
        // Clear scroll tracking for this position when user sends new message
        hasScrolledToStreamRef.current.delete(messageIndex);
      } else if (lastMessage.role === 'assistant' && lastMessage.isStreaming) {
        // For AI messages, scroll when:
        // 1. Typing indicator first appears (no content yet)
        // 2. First content appears
        const hasContent = lastMessage.parsedContent && Object.keys(lastMessage.parsedContent).length > 0;
        const hasNotScrolledYet = !hasScrolledToStreamRef.current.has(messageIndex);
        
        // Scroll immediately when typing indicator appears
        if (!hasContent && hasNotScrolledYet) {
          hasScrolledToStreamRef.current.add(messageIndex);
          setTimeout(() => {
            scrollToBottom();
          }, 100);
        }
        // Also scroll when first content appears
        else if (hasContent && hasNotScrolledYet) {
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
      // Initial load
      else if (messages.length === 1) {
        scrollToBottom();
      }
    }
  }, [messages, scrollToBottom]);

  // Show thriving tutorial automatically on mobile or after delay
  useEffect(() => {
    if (messages.length > 0 && !showThrivingTutorial && !hasShownTutorialInSession.current) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && lastMessage.parsedContent?.actionableItems) {
        const thrivingItem = lastMessage.parsedContent.actionableItems.find(
          item => item.type === 'create_routine' || item.type === 'routine' || item.type === 'thriving' || item.type === 'start_journey'
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

  /**
   * Handles staging answers for conversational flow
   * Called when user answers a question in multi-question scenarios
   * Answers are collected here and sent after a pause or when user types
   */
  const handleAnswerStaged = (question: string, answer: string) => {
    setStagedAnswers(prev => [...prev, {
      question,
      answer,
      timestamp: Date.now()
    }]);
  };

  /**
   * Sends all staged answers after the conversational pause
   * Called by ConversationalAnswerFlow component when:
   * 1. 6-second pause timer expires (natural conversation pause)
   * 2. User starts typing (interruption)
   * 
   * @param answers - Array of staged Q&A pairs
   * @param additionalMessage - User's typed message (if they interrupted by typing)
   */
  const handleSendStagedAnswers = useCallback(async (answers: Array<{ question: string; answer: string; timestamp: number }>, additionalMessage?: string) => {
    if (answers.length === 0) return;
    
    // Clear staged answers
    setStagedAnswers([]);
    
    // Format answers for display (clean, no context)
    const displayMessage = answers.map(a => a.answer).join(', ');
    
    // Format answers for API (with context)
    const apiMessage = answers.map(a => 
      `${a.answer} (answering: "${a.question}")`
    ).join(' ');
    
    // SENDING STRATEGY:
    // If user typed something, we send Q&A first, then their message
    // This maintains conversation context and flow
    if (additionalMessage) {
      // Send Q&A answers first (appears as separate bubble in UI)
      await handleSendMessage(displayMessage, apiMessage);
      // Then send user's typed message (another bubble)
      await handleSendMessage(additionalMessage);
    } else {
      // Just send the batched Q&A answers
      await handleSendMessage(displayMessage, apiMessage);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSendMessage = useCallback(async (messageOverride?: string, apiMessageOverride?: string, skipAddToHistory?: boolean) => {
    const messageToSend = messageOverride || input;
    if (!messageToSend.trim() || isLoading) return;
    
    // INTERRUPTION HANDLING:
    // If user types while answers are staged, send everything
    // This creates a natural flow: Q&A answers first, then user's new message
    if (stagedAnswers.length > 0 && !messageOverride) {
      await handleSendStagedAnswers(stagedAnswers, messageToSend);
      setInput('');
      return;
    }
    
    // Check if we're answering a question
    if (currentQuestion && !messageOverride) {
      // This is an answer to the current question, not a regular message
      setSubmittedAnswer(messageToSend);
      setInput('');
      
      // For text input questions or custom answers to multiple choice, handle immediately
      handleAnswerStaged(currentQuestion.prompt, messageToSend);
      
      // Move to next question or complete
      const currentQuestionIndex = lastAssistantQuestions.findIndex(q => q.id === currentQuestion.id);
      if (currentQuestionIndex < lastAssistantQuestions.length - 1) {
        // There are more questions
        setCurrentQuestion(lastAssistantQuestions[currentQuestionIndex + 1]);
      } else {
        // This was the last question
        setCurrentQuestion(null);
        // Trigger immediate send of staged answers (including the one we just added)
        setTimeout(() => {
          if (stagedAnswers.length > 0 || messageToSend) {
            setIsUserTyping(true);
            setTimeout(() => setIsUserTyping(false), 100);
          }
        }, 100); // Small delay to ensure state update
      }
      
      // Reset submitted answer after a short delay
      setTimeout(() => setSubmittedAnswer(''), 100);
      return;
    }
    
    // Use separate display and API messages if provided
    const displayMessage = messageToSend;
    const apiMessage = apiMessageOverride || messageToSend;

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
      content: displayMessage, // Show clean message in UI
      timestamp: new Date()
    };

    // Store the health concern for routine creation
    setHealthConcern(messageToSend);

    // Only add the user message if it's not already in history (for incomplete conversation resends)
    if (!skipAddToHistory) {
      setMessages(prev => [...prev, userMessage]);
    }
    setInput('');
    setIsLoading(true);

    // Save user message to chat history (only if not skipping)
    const currentThreadId = chatThreadId || threadId || createChatThread().id;
    if (!chatThreadId && !threadId) {
      setChatThreadId(currentThreadId);
    }
    if (!skipAddToHistory) {
      addMessageToThread(currentThreadId, { role: 'user', content: userMessage.content });
    }

    // Only add assistant message if we haven't already added one (for incomplete conversations)
    if (!skipAddToHistory) {
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
        parsedContent: {} as PartialAssistantResponse
      };
      setMessages(prev => [...prev, assistantMessage]);
    }
    
    // Immediately scroll to show the typing indicator
    setTimeout(() => {
      scrollToBottom();
    }, 100);
    
    // Safety timeout to clear ONLY the typing indicator visual after 60 seconds
    // This does NOT interrupt the actual streaming - just removes the dots
    if (streamingTimeoutRef.current) {
      clearTimeout(streamingTimeoutRef.current);
    }
    streamingTimeoutRef.current = setTimeout(() => {
      console.warn('Typing indicator timeout reached (60s) - clearing visual indicator only');
      setMessages(prev => {
        const updated = [...prev];
        const lastMessage = updated[updated.length - 1];
        if (lastMessage.role === 'assistant' && lastMessage.isStreaming) {
          lastMessage.isStreaming = false;
          console.log('Cleared typing indicator after 60s timeout - streaming continues in background');
        }
        return updated;
      });
    }, 60000); // 60 second timeout for typing indicator only

    try {
      abortControllerRef.current = new AbortController();
      
      // Extract enhanced basic context from localStorage for hybrid approach
      const basicContext = getBasicContext();
      
      // Don't send generated thread IDs to OpenAI - let it create a real one
      const currentThreadId = chatThreadId || threadId;
      const threadIdToSend = currentThreadId && !isGeneratedThreadId(currentThreadId) ? currentThreadId : undefined;
      
      const response = await fetch('/api/assistant/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: apiMessage, // Send full message with context to API
          threadId: threadIdToSend, // Only send real OpenAI thread IDs
          basicContext
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
                
                // Always ensure all messages up to this point are saved to the new thread
                // This includes the user's first message that triggered the thread creation
                const existingMessages = messages.filter(m => m.content);
                
                // If we had a temporary local thread, transfer its messages first
                if (chatThreadId && chatThreadId !== data.threadId) {
                  const localThread = getChatThread(chatThreadId);
                  if (localThread) {
                    // Transfer messages from temp thread
                    localThread.messages.forEach(msg => {
                      addMessageToThread(data.threadId, msg);
                    });
                    // Delete the old temporary thread
                    deleteChatThread(chatThreadId);
                  }
                }
                
                // Then add any messages that are in the current state but might not be in the thread yet
                // This ensures the first message is always saved
                existingMessages.forEach(msg => {
                  if (msg.role === 'user' || msg.role === 'assistant') {
                    // Check if this message already exists in the thread to avoid duplicates
                    const thread = getChatThread(data.threadId);
                    const messageExists = thread?.messages.some(m => 
                      m.role === msg.role && 
                      m.content === msg.content && 
                      Math.abs(new Date(m.timestamp).getTime() - msg.timestamp.getTime()) < 1000
                    );
                    
                    if (!messageExists) {
                      addMessageToThread(data.threadId, { 
                        role: msg.role, 
                        content: msg.content
                      });
                    }
                  }
                });
              }

              if ((data.type === 'delta' || data.type === 'content') && data.content) {
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

              // Handle function calls
              if (data.type === 'function_call') {
                console.log('Received function call request:', data);
                
                // Import the client-side function handler
                // Dynamic import to avoid server-side execution
                const clientModule = await import('@/src/services/openai/functions/clientFunctionHandler');
                const { executeClientSideFunctions } = clientModule;
                
                // Execute functions locally with access to localStorage
                console.log('Executing functions locally...');
                const toolOutputs = await executeClientSideFunctions(data.toolCalls);
                console.log('Function execution results:', toolOutputs);
                
                // Submit the results back to the API
                console.log('Submitting results back to API...');
                console.log('Submit payload:', {
                  threadId: data.threadId,
                  runId: data.runId,
                  toolOutputs
                });
                
                // Ensure we only submit with real OpenAI thread IDs
                if (!isGeneratedThreadId(data.threadId)) {
                  const submitResponse = await fetch('/api/assistant/submit-tool-outputs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      threadId: data.threadId,
                      runId: data.runId,
                      toolOutputs
                    })
                  });

                  console.log('Submit response status:', submitResponse.status);
                  if (!submitResponse.ok) {
                    const errorText = await submitResponse.text();
                    console.error('Submit tool outputs HTTP error:', submitResponse.status, errorText);
                    console.debug('Failed tool outputs:', toolOutputs);
                    console.debug('Continuing without tool results - AI will work with available data');
                    
                    // Don't throw - let AI continue without the tool results
                    // Just skip processing the submit response
                    continue;
                  }

                  // Continue processing the new stream
                  const submitReader = submitResponse.body?.getReader();
                  if (submitReader) {
                    console.log('Processing submit response stream...');
                    let submitBuffer = '';
                    
                    // Reset fullContent when starting to process tool output response
                    fullContent = '';
                    
                    while (true) {
                      const { done: submitDone, value: submitValue } = await submitReader.read();
                      if (submitDone) {
                        console.log('Submit stream ended');
                        break;
                      }

                      submitBuffer += decoder.decode(submitValue, { stream: true });
                      const submitLines = submitBuffer.split('\n');
                      submitBuffer = submitLines.pop() || ''; // Keep incomplete line in buffer

                      for (const submitLine of submitLines) {
                        if (submitLine.trim() === '') continue;
                        
                        if (submitLine.startsWith('data: ')) {
                          const submitDataStr = submitLine.slice(6);
                          try {
                            const submitData = JSON.parse(submitDataStr);
                            console.log('Submit stream event:', submitData.type);
                            
                            if (submitData.type === 'delta' && submitData.content) {
                              // Update the outer fullContent variable
                              fullContent += submitData.content;
                              setMessages(prev => {
                                const updated = [...prev];
                                const lastMessage = updated[updated.length - 1];
                                if (lastMessage.role === 'assistant') {
                                  lastMessage.content = fullContent;
                                  const partialParsed = parsePartialAssistantResponse(fullContent);
                                  if (partialParsed) {
                                    lastMessage.parsedContent = partialParsed;
                                  }
                                }
                                return updated;
                              });
                            }
                            
                            if (submitData.type === 'completed') {
                              console.log('Submit stream completed, final content length:', fullContent.length);
                              
                              // Clear the typing indicator timeout
                              if (streamingTimeoutRef.current) {
                                clearTimeout(streamingTimeoutRef.current);
                                streamingTimeoutRef.current = null;
                              }
                              
                              // Mark the message as complete
                              setMessages(prev => {
                                const updated = [...prev];
                                const lastMessage = updated[updated.length - 1];
                                if (lastMessage.role === 'assistant') {
                                  lastMessage.isStreaming = false;
                                  const finalParsed = parseAssistantResponse(fullContent);
                                  if (finalParsed) {
                                    lastMessage.parsedContent = finalParsed;
                                  }
                                }
                                return updated;
                              });
                            }
                            
                            if (submitData.type === 'error') {
                              console.error('Submit tool outputs error (continuing without results):', submitData.error);
                              console.debug('Tool outputs that failed:', toolOutputs);
                              console.debug('Thread ID:', data.threadId);
                              console.debug('Run ID:', data.runId);
                              
                              // Don't show error to user - let AI continue without tool results
                              // The AI can still provide a meaningful response
                              console.log('Continuing without tool results - AI will handle gracefully');
                              
                              // Keep the streaming state to show AI is still working
                              setMessages(prev => {
                                const updated = [...prev];
                                const lastMessage = updated[updated.length - 1];
                                if (lastMessage.role === 'assistant') {
                                  // Keep streaming, AI will continue
                                  lastMessage.isStreaming = true;
                                }
                                return updated;
                              });
                              
                              // Don't break - let the stream continue
                              // The AI assistant should handle the missing data gracefully
                            }
                          } catch (e) {
                            console.error('Error parsing submit response:', e);
                          }
                        }
                      }
                    }
                    
                    // Process any remaining buffer
                    if (submitBuffer.trim()) {
                      console.log('Remaining submit buffer:', submitBuffer);
                    }
                  }
                } else {
                  console.log('Skipping submit-tool-outputs for generated thread ID:', data.threadId);
                }
              }

              if (data.type === 'completed' || data.type === 'done') {
                // Clear the streaming timeout
                if (streamingTimeoutRef.current) {
                  clearTimeout(streamingTimeoutRef.current);
                  streamingTimeoutRef.current = null;
                }
                
                // Use data.fullContent if available (from done event), otherwise use accumulated fullContent
                const finalContent = data.fullContent || fullContent;
                const parsedResponse = parseAssistantResponse(finalContent);
                
                // Store questions if available
                if (parsedResponse?.questions && parsedResponse.questions.length > 0) {
                  setLastAssistantQuestions(parsedResponse.questions);
                }
                
                setMessages(prev => {
                  const updated = [...prev];
                  const lastMessage = updated[updated.length - 1];
                  if (lastMessage.role === 'assistant') {
                    lastMessage.content = finalContent;
                    lastMessage.parsedContent = parsedResponse;
                    lastMessage.isStreaming = false;
                  }
                  return updated;
                });
                
                // Save assistant message to chat history
                const currentThreadId = newThreadId || chatThreadId || threadId;
                if (currentThreadId) {
                  addMessageToThread(currentThreadId, { role: 'assistant', content: fullContent });
                  
                  // Clean up the incomplete conversation handling flag since we got a response
                  const thread = getChatThread(currentThreadId);
                  if (thread && thread.messages.length > 0) {
                    const userMessages = thread.messages.filter(m => m.role === 'user');
                    if (userMessages.length > 0) {
                      const lastUserMessage = userMessages[userMessages.length - 1];
                      const handlingKey = `incomplete_${currentThreadId}_${lastUserMessage.content}`;
                      sessionStorage.removeItem(handlingKey);
                    }
                  }
                }
              }

              if (data.type === 'error') {
                // Clear the typing indicator timeout on error
                if (streamingTimeoutRef.current) {
                  clearTimeout(streamingTimeoutRef.current);
                  streamingTimeoutRef.current = null;
                }
                
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
        
        // Clear the typing indicator timeout on error
        if (streamingTimeoutRef.current) {
          clearTimeout(streamingTimeoutRef.current);
          streamingTimeoutRef.current = null;
        }
        
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
  }, [input, isLoading, messages, threadId, scrollToBottom, chatIntent, chatThreadId, currentQuestion, handleSendStagedAnswers, lastAssistantQuestions, onThreadCreated, stagedAnswers]);

  // Parsers are imported from utils/chat/responseParser

  const handleActionClick = (action: ActionableItem) => {
    if (action.type === 'create_routine' || action.type === 'routine' || action.type === 'thriving') {
      // Ensure the action has required fields
      const enhancedAction = {
        ...action,
        description: action.description || 'Create a personalized wellness routine',
        modalTitle: action.modalTitle || action.title || 'Create Your Wellness Routine',
        modalDescription: action.modalDescription || 'Let\'s build a routine that works for you'
      };
      setRoutineData(enhancedAction);
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
    } else if (action.type === 'buy') {
      // Handle buy action for supplements
      const searchQuery = action.searchQuery || encodeURIComponent(action.productName || action.title);
      const amazonSearchUrl = `https://www.amazon.com/s?k=${searchQuery}`;
      bridge.openExternalUrl(amazonSearchUrl);
      
      // Send post-action message to chat
      const postAction: PostActionMessage = {
        type: 'buy_clicked',
        context: {
          productName: action.productName || action.title,
          dosage: action.dosage,
          timing: action.timing
        }
      };
      const postActionMsg = generatePostActionMessage(postAction);
      handleSendMessage(postActionMsg);
    } else if (action.type === 'add_to_pantry') {
      // Handle add to pantry action
      setPantryItemToAdd(action);
      setShowPantryModal(true);
    } else if (action.type === 'already_have') {
      // Handle "I already have it" action - opens pantry modal with context
      setPantryItemToAdd({
        ...action,
        contextMessage: action.contextMessage || "Great! Tracking this helps me personalize your wellness routines"
      });
      setShowPantryModal(true);
    } else if (action.type === 'expert_consultation') {
      // Handle expert consultation action
      // This will be rendered as ExpertConsultationCard, no modal needed
      console.log('Expert consultation action clicked', action);
    } else if (action.type === 'adjust_routine') {
      // Navigate to thrivings page with adjustment instructions
      if (action.routineId) {
        const adjustmentData = {
          routineId: action.routineId,
          adjustmentInstructions: action.adjustmentInstructions || action.description || ''
        };
        sessionStorage.setItem('adjustmentRequest', JSON.stringify(adjustmentData));
        
        // Navigate to thrivings page
        window.location.href = `/thrivings?id=${action.routineId}&showAdjustment=true`;
      } else {
        // If no specific routine ID, find the first active routine of the type
        const { activeRoutines } = getBasicContext();
        if (activeRoutines && activeRoutines.length > 0) {
          const relevantRoutine = activeRoutines.find(r => 
            action.routineType ? r.type === action.routineType : true
          );
          
          if (relevantRoutine) {
            const adjustmentData = {
              routineId: relevantRoutine.id,
              adjustmentInstructions: action.adjustmentInstructions || action.description || ''
            };
            sessionStorage.setItem('adjustmentRequest', JSON.stringify(adjustmentData));
            window.location.href = `/thrivings?id=${relevantRoutine.id}&showAdjustment=true`;
          }
        }
      }
    } else if (action.link) {
      bridge.openExternalUrl(action.link);
    } else if (action.pharmacy_link) {
      // Convert pharmacy link to Amazon search
      // Extract the supplement name from the title or description
      const supplementName = action.title.replace(/^(Buy|Get|Purchase)\s+/i, '');
      const searchQuery = encodeURIComponent(supplementName + ' supplement');
      const amazonSearchUrl = `https://www.amazon.com/s?k=${searchQuery}`;
      bridge.openExternalUrl(amazonSearchUrl);
    } else if (action.amazon_link) {
      bridge.openExternalUrl(action.amazon_link);
    }
  };


  const renderMessage = (message: ChatMessage, messageIndex: number) => {
    if (message.role === 'user') {
      return (
        <div className="flex justify-end mb-6" data-message-index={messageIndex}>
          <div className="max-w-[90%] md:max-w-[85%]">
            <div className="rounded-3xl px-6 py-4 bg-gradient-to-br from-sage-300/20 to-sage-400/15 shadow-xl shadow-sage-400/25 border border-sage-400/20">
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
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-500 via-dusty-rose-600 to-burgundy-700" />
              <div className="p-5 pt-6 space-y-5">
                {/* Sender Label */}
                <div className="mb-3">
                  <span className="text-sm font-semibold text-burgundy-700">Wellness Companion</span>
                </div>
                {/* Emergency Alert */}
                {parsed?.attentionRequired === 'emergency' && (
                  <div className="rounded-2xl bg-gradient-to-r from-rose-500/15 to-burgundy-700/15 border border-rose-500/30 p-4 shadow-xl shadow-rose-500/20">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/30 to-burgundy-700/20 flex items-center justify-center shadow-lg shadow-rose-500/30">
                        <AlertCircle className="w-5 h-5 text-burgundy-700" />
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
                  <ActionItemList items={parsed.actionItems} />
                )}

                {/* Additional Information */}
                {parsed?.additionalInformation && (
                  <AdditionalInfoCard content={parsed.additionalInformation} />
                )}

                {/* Actionable Items - Compact Design with Original Colors */}
                {parsed?.actionableItems && parsed.actionableItems.length > 0 && (
                  <div className="space-y-2 pt-2">
                    {(() => {
                      // Only group supplement options after streaming is complete
                      const shouldGroup = !message.isStreaming;
                      
                      if (!shouldGroup) {
                        // During streaming, show items as they come
                        return parsed.actionableItems.map((item, idx) => {
                          // Render each item individually during streaming
                          const Icon = item.type === 'already_have' ? PlusCircle : 
                                       item.type === 'buy' ? ShoppingCart : Heart;
                          return (
                            <CardButton
                              key={idx}
                              onClick={() => handleActionClick(item)}
                              className="w-full p-3 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-200/50 text-left"
                              springAnimation
                              gradientOverlay
                              scale={0.98}
                            >
                              <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
                                  <Icon className="w-4 h-4 text-gray-600" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900 text-[14px]">{item.title}</h4>
                                  {item.description && (
                                    <p className="text-[12px] text-gray-600 mt-0.5">{item.description}</p>
                                  )}
                                </div>
                              </div>
                            </CardButton>
                          );
                        });
                      }
                      
                      // After streaming is complete, group supplement options
                      const groupedItems: (ActionableItem | ActionableItem[])[] = [];
                      const processedIndices = new Set<number>();
                      
                      parsed.actionableItems.forEach((item, idx) => {
                        if (processedIndices.has(idx)) return;
                        
                        if (item.type === 'already_have' && item.productName) {
                          // Find corresponding buy option
                          const buyIndex = parsed.actionableItems!.findIndex((buyItem, buyIdx) => 
                            buyIdx > idx && 
                            buyItem.type === 'buy' && 
                            buyItem.productName === item.productName
                          );
                          
                          if (buyIndex !== -1) {
                            groupedItems.push([item, parsed.actionableItems![buyIndex]]);
                            processedIndices.add(idx);
                            processedIndices.add(buyIndex);
                          } else {
                            groupedItems.push(item);
                            processedIndices.add(idx);
                          }
                        } else if (!processedIndices.has(idx)) {
                          groupedItems.push(item);
                          processedIndices.add(idx);
                        }
                      });
                      
                      return groupedItems.map((itemOrGroup, groupIdx) => {
                        if (Array.isArray(itemOrGroup)) {
                          // Render supplement options with product name as title
                          const productName = itemOrGroup[0].productName || 'Supplement';
                          const alreadyHaveItem = itemOrGroup.find(item => item.type === 'already_have');
                          const buyItem = itemOrGroup.find(item => item.type === 'buy');
                          
                          return (
                            <div key={`group-${groupIdx}`} className="rounded-xl bg-gradient-to-r from-gray-50/50 to-white border border-gray-200/70 p-4 shadow-sm hover:shadow-md transition-all">
                              <h4 className="font-semibold text-gray-900 text-[15px] mb-3">{productName}</h4>
                              <div className="flex gap-2">
                                {alreadyHaveItem && (
                                  <Button
                                    onClick={() => handleActionClick(alreadyHaveItem)}
                                    variant="gradient"
                                    gradient={{
                                      from: 'sage-light/20',
                                      to: 'sage/10',
                                      hoverFrom: 'sage-light/30',
                                      hoverTo: 'sage/20',
                                      activeFrom: 'sage-light/40',
                                      activeTo: 'sage/30'
                                    }}
                                    className="flex-1 border border-sage-400/20 hover:border-sage-400/40"
                                    springAnimation
                                    gradientOverlay
                                    cardGlow
                                    haptic="medium"
                                  >
                                    <div className="flex items-center justify-center space-x-2">
                                      <PlusCircle className="w-4 h-4 text-sage-600" />
                                      <span className="text-[13px] font-medium text-sage-600">I already have it</span>
                                    </div>
                                  </Button>
                                )}
                                {buyItem && (
                                  <Button
                                    onClick={() => handleActionClick(buyItem)}
                                    variant="gradient"
                                    gradient={{
                                      from: 'rose/10',
                                      to: 'dusty-rose/10',
                                      hoverFrom: 'rose/20',
                                      hoverTo: 'dusty-rose/20',
                                      activeFrom: 'rose/30',
                                      activeTo: 'dusty-rose/30'
                                    }}
                                    className="flex-1 border border-rose/20 hover:border-rose/40"
                                    springAnimation
                                    gradientOverlay
                                    cardGlow
                                    haptic="medium"
                                  >
                                    <div className="flex items-center justify-center space-x-2">
                                      <ShoppingCart className="w-4 h-4 text-rose-500" />
                                      <span className="text-[13px] font-medium text-rose-500">Buy</span>
                                    </div>
                                  </Button>
                                )}
                              </div>
                              {(alreadyHaveItem?.dosage || buyItem?.dosage) && (
                                <p className="text-[11px] text-gray-500 mt-2 text-center">
                                  {alreadyHaveItem?.dosage || buyItem?.dosage} • {alreadyHaveItem?.timing || buyItem?.timing || 'As directed'}
                                </p>
                              )}
                            </div>
                          );
                        } else {
                          // Check if this is a supplement_choice type
                          const item = itemOrGroup;
                          if (item.type === 'supplement_choice') {
                            return (
                              <div key={groupIdx} className="rounded-xl bg-gradient-to-r from-white to-gray-50/30 border border-gray-200/70 p-4 shadow-sm hover:shadow-md transition-all">
                                <div className="mb-3">
                                  <h4 className="font-semibold text-gray-900 text-[16px]">{item.title}</h4>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => {
                                      // Handle "I already have it" action
                                      const alreadyHaveAction: ActionableItem = {
                                        type: 'already_have',
                                        title: 'I already have',
                                        description: 'Track in pantry',
                                        productName: item.productName,
                                        suggestedNotes: item.suggestedNotes || `${item.dosage}, ${item.timing}`,
                                        contextMessage: 'Great! Tracking this helps me personalize your wellness routines'
                                      };
                                      handleActionClick(alreadyHaveAction);
                                    }}
                                    variant="gradient"
                                    gradient={{
                                      from: 'sage-light/20',
                                      to: 'sage/10',
                                      hoverFrom: 'sage-light/30',
                                      hoverTo: 'sage/20',
                                      activeFrom: 'sage-light/40',
                                      activeTo: 'sage/30'
                                    }}
                                    className="flex-1 border border-sage-400/20 hover:border-sage-400/40"
                                    springAnimation
                                    gradientOverlay
                                    cardGlow
                                    haptic="medium"
                                  >
                                    <div className="flex items-center justify-center space-x-2">
                                      <PlusCircle className="w-4 h-4 text-sage-600" />
                                      <span className="text-[13px] font-medium text-sage-600">I already have it</span>
                                    </div>
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      // Handle "Buy" action
                                      const searchQuery = item.searchQuery || encodeURIComponent(item.productName || item.title);
                                      const amazonSearchUrl = `https://www.amazon.com/s?k=${searchQuery}`;
                                      bridge.openExternalUrl(amazonSearchUrl);
                                    }}
                                    variant="gradient"
                                    gradient={{
                                      from: 'rose/10',
                                      to: 'dusty-rose/10',
                                      hoverFrom: 'rose/20',
                                      hoverTo: 'dusty-rose/20',
                                      activeFrom: 'rose/30',
                                      activeTo: 'dusty-rose/30'
                                    }}
                                    className="flex-1 border border-rose/20 hover:border-rose/40"
                                    springAnimation
                                    gradientOverlay
                                    cardGlow
                                    haptic="medium"
                                  >
                                    <div className="flex items-center justify-center space-x-2">
                                      <ShoppingCart className="w-4 h-4 text-rose-500" />
                                      <span className="text-[13px] font-medium text-rose-500">Buy</span>
                                    </div>
                                  </Button>
                                </div>
                                {item.dosage && item.timing && (
                                  <p className="text-[11px] text-gray-500 mt-2 text-center">
                                    {item.dosage} • {item.timing}
                                  </p>
                                )}
                              </div>
                            );
                          }
                          // Render single item (non-supplement actions)
                          const singleItem = itemOrGroup;
                          const idx = groupIdx;
                          
                          // Special handling for expert consultation
                          if (singleItem.type === 'expert_consultation') {
                            return (
                              <ExpertConsultationCard
                                key={idx}
                                title={singleItem.title}
                                description={singleItem.description || ''}
                                content={singleItem.content}
                                metadata={singleItem.metadata}
                                threadId={threadId || ''}
                                messageId={`msg_${Date.now()}`}
                              />
                            );
                          }
                          
                          let Icon = Heart;
                          let gradientClass = "";
                          let iconColorClass = "";
                          let backgroundClass = "";
                          let shadowClass = "";
                          let borderColorHover = "";
                          
                          // Icon selection logic
                      if (singleItem.icon) {
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
                          'book-open': BookOpen,
                          'shopping-cart': ShoppingCart,
                          'plus-circle': PlusCircle,
                          'settings': Settings,
                          'edit': Settings
                        } as const;
                        Icon = iconMap[singleItem.icon as keyof typeof iconMap] || Heart;
                      } else {
                        // Default icons based on type
                        if (singleItem.type === 'appointment') Icon = Calendar;
                        else if (singleItem.type === 'medicine' || singleItem.type === 'supplement') Icon = Pill;
                        else if (singleItem.type === 'routine' || singleItem.type === 'create_routine' || singleItem.type === 'thriving') Icon = Sparkles;
                        else if (singleItem.type === 'adjust_routine') Icon = Settings;
                        else if (singleItem.type === 'information') Icon = FileText;
                        else if (singleItem.type === 'buy') Icon = ShoppingCart;
                        else if (singleItem.type === 'add_to_pantry' || singleItem.type === 'already_have') Icon = PlusCircle;
                      }
                      
                      // Original color sequence: sage green -> pink/bronze -> slate blue -> repeat
                      const colorIndex = idx % 3;
                      
                      if (colorIndex === 0) {
                        // Light sage green
                        gradientClass = "from-sage-300/30 to-sage-400/20";
                        iconColorClass = "text-sage-600";
                        backgroundClass = "from-sage-300/10 to-sage-400/5";
                        shadowClass = "shadow-sage-400/15";
                        borderColorHover = "hover:border-sage-400/30";
                      } else if (colorIndex === 1) {
                        // Light pink/bronze
                        gradientClass = "from-rose-500/20 to-dusty-rose-600/15";
                        iconColorClass = "text-rose-500";
                        backgroundClass = "from-rose-500/5 to-dusty-rose-600/5";
                        shadowClass = "shadow-rose-500/10";
                        borderColorHover = "hover:border-rose-500/25";
                      } else {
                        // Light slate blue
                        gradientClass = "from-slate-300/30 to-slate-400/20";
                        iconColorClass = "text-slate-700";
                        backgroundClass = "from-slate-50 to-slate-100/50";
                        shadowClass = "shadow-slate-300/20";
                        borderColorHover = "hover:border-slate-400/30";
                      }
                      
                      // Check if this is a thriving button and if it matches the tutorial
                      const isThrivingButton = singleItem.type === 'create_routine' || singleItem.type === 'routine' || singleItem.type === 'thriving' || singleItem.type === 'start_journey';
                      const shouldAttachRef = isThrivingButton && 
                        (singleItem.title === tutorialActionableText || 
                         singleItem.journeyTitle === tutorialActionableText || 
                         singleItem.description === tutorialActionableText);

                      return (
                        <CardButton
                          key={idx}
                          ref={shouldAttachRef ? tutorialTargetButtonRef : undefined}
                          onClick={() => handleActionClick(singleItem)}
                          className={`w-full p-3 rounded-xl bg-gradient-to-r ${backgroundClass} border border-gray-200/50 ${shadowClass} ${borderColorHover} text-left`}
                          springAnimation
                          gradientOverlay
                          scale={0.98}
                          haptic="medium"
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradientClass} flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm group-hover:scale-105 transition-transform`}>
                              <Icon className={`w-4 h-4 ${iconColorClass}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-gray-900 text-[14px]">{singleItem.title}</h4>
                                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-2" />
                              </div>
                              {singleItem.description && (
                                <p className="text-[12px] text-gray-600 mt-0.5 leading-relaxed">{singleItem.description}</p>
                              )}
                            </div>
                          </div>
                        </CardButton>
                      );
                        }
                      });
                    })()}
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
                      <span className="w-3 h-3 bg-gradient-to-r from-sage-400 to-sage-600 rounded-full animate-wave" style={{ animationDelay: '0s' }} />
                      <span className="w-3 h-3 bg-gradient-to-r from-sage-400 to-sage-600 rounded-full animate-wave" style={{ animationDelay: '0.15s' }} />
                      <span className="w-3 h-3 bg-gradient-to-r from-sage-400 to-sage-600 rounded-full animate-wave" style={{ animationDelay: '0.3s' }} />
                    </div>
                  </div>
                )}

                {/* Questions Section - Inside the card */}
                {message.parsedContent?.questions && message.parsedContent.questions.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <p className="text-[14px] text-secondary-text-thin mb-3">Let&apos;s talk more?</p>
                    {/* Debug: Check question format */}
                    {typeof message.parsedContent.questions[0] === 'string' ? (
                      <div className="p-3 bg-red-50 text-red-800 rounded-lg mb-3">
                        <p className="font-semibold">Warning: Questions are in old format. The assistant needs to return enhanced questions.</p>
                        <div className="mt-2 space-y-2">
                          {(message.parsedContent.questions as unknown as string[]).map((q, idx) => (
                            <div key={idx} className="p-2 bg-white rounded">
                              {q}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <EnhancedQuestions 
                          questions={message.parsedContent.questions as EnhancedQuestion[]}
                          onQuestionSubmit={handleSendMessage}
                          onAnswerStaged={handleAnswerStaged}
                          // BATCHING DECISION: Only use conversational flow for multiple questions
                          // Single questions = immediate send (no waiting)
                          // Multiple questions = batch with 6-second pause
                          useConversationalFlow={message.parsedContent.questions.length > 1}
                          onAllQuestionsAnswered={() => {
                            // Clear the last assistant questions when all are answered
                            setLastAssistantQuestions([]);
                            setCurrentQuestion(null);
                          }}
                          onCurrentQuestionChange={setCurrentQuestion}
                          userAnswer={submittedAnswer || undefined}
                          onLastQuestionAnswered={() => {
                            // Immediately send staged answers when last question is answered
                            // Set isUserTyping to true to trigger immediate send in ConversationalAnswerFlow
                            if (stagedAnswers.length > 0) {
                              setIsUserTyping(true);
                              // Reset after a short delay
                              setTimeout(() => setIsUserTyping(false), 100);
                            }
                          }}
                        />
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Show only typing indicator if streaming with no content yet */
            <div 
              className="rounded-3xl bg-white shadow-2xl shadow-gray-300/80 p-6" 
              data-testid="typing-indicator-only"
              data-message-index={messageIndex}
            >
              <div className="flex items-center space-x-3">
                <div className="flex space-x-1">
                  <span className="w-3 h-3 bg-gradient-to-r from-sage-400 to-sage-600 rounded-full animate-wave" style={{ animationDelay: '0s' }} />
                  <span className="w-3 h-3 bg-gradient-to-r from-sage-400 to-sage-600 rounded-full animate-wave" style={{ animationDelay: '0.15s' }} />
                  <span className="w-3 h-3 bg-gradient-to-r from-sage-400 to-sage-600 rounded-full animate-wave" style={{ animationDelay: '0.3s' }} />
                </div>
                <span className="text-sm text-gray-500">Companion is typing...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="chat-container">
      {/* Header - only render if provided */}
      {renderHeader && (
        <div className="chat-header safe-top">
          {renderHeader()}
        </div>
      )}

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

      {/* Conversational Answer Flow - Voice-style conversation batching */}
      {/* Shows "thinking" indicator with countdown when answers are staged */}
      {/* Auto-sends after 6 seconds OR immediately if user starts typing */}
      <ConversationalAnswerFlow
        stagedAnswers={stagedAnswers}
        onSendAnswers={handleSendStagedAnswers}
        isUserTyping={isUserTyping}  // Triggers immediate send when true
      />

      {/* Input - stays at bottom */}
      <div className="chat-input-area">
        <ChatEditor
          value={input}
          onChange={(value) => {
            setInput(value);
            
            // TYPING DETECTION for conversational flow
            // This triggers immediate send of staged answers when user starts typing
            
            // Clear any existing typing timeout
            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current);
            }
            
            // If user is typing (value is not empty)
            if (value.trim()) {
              setIsUserTyping(true);  // This will trigger ConversationalAnswerFlow to send staged answers
              
              // Set a timeout to detect when user stops typing
              // This prevents the typing state from staying true forever
              typingTimeoutRef.current = setTimeout(() => {
                setIsUserTyping(false);
              }, 500); // Consider user stopped typing after 500ms of inactivity
            } else {
              // Input is empty
              setIsUserTyping(false);
            }
          }}
          onSubmit={handleSendMessage}
          isLoading={isLoading}
          autoFocus={!!selectedPrompt}
          placeholder={
            currentQuestion 
              ? `Answer: ${currentQuestion.prompt.substring(0, 50)}${currentQuestion.prompt.length > 50 ? '...' : ''}`
              : messages.some(m => m.role === 'assistant') 
              ? "Ask follow-ups or explore other aspects of this topic..."
              : "Ask about your wellness journey..."
          }
          onFocus={() => {
            // Let the browser handle keyboard naturally
            setTimeout(() => {
              scrollToBottom();
            }, 300);
          }}
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
          threadId={threadId}
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

      {showPantryModal && (
        <PantryAddModal
          isOpen={showPantryModal}
          onClose={() => {
            setShowPantryModal(false);
            setPantryItemToAdd(null);
          }}
          initialData={pantryItemToAdd ? {
            name: pantryItemToAdd.productName || pantryItemToAdd.title || '',
            notes: pantryItemToAdd.suggestedNotes || '',
            tags: pantryItemToAdd.category ? [pantryItemToAdd.category] : []
          } : undefined}
          contextMessage={pantryItemToAdd?.contextMessage}
          onAddItem={async (item: PantryItem) => {
            savePantryItem(item);
            setShowPantryModal(false);
            
            // Send post-action message to chat
            const postAction: PostActionMessage = {
              type: 'pantry_added',
              context: {
                productName: item.name,
                dosage: pantryItemToAdd?.dosage,
                timing: pantryItemToAdd?.timing
              }
            };
            const postActionMsg = generatePostActionMessage(postAction);
            handleSendMessage(postActionMsg);
            
            setPantryItemToAdd(null);
            
            // Show immediate success message
            const immediateMessage: ChatMessage = {
              role: 'assistant',
              content: `Great! I've added ${item.name} to your pantry.`,
              timestamp: new Date(),
              isStreaming: true
            };
            setMessages(prev => [...prev, immediateMessage]);
            
            // Save to chat history
            const currentThreadId = chatThreadId || threadId;
            if (currentThreadId) {
              addMessageToThread(currentThreadId, { role: 'assistant', content: immediateMessage.content });
            }
            
            // Request routine recommendation from assistant
            try {
              const routinePrompt = `The user just added ${item.name} to their pantry. Suggest creating a routine that includes this supplement. Keep the response brief and actionable.`;
              
              const response = await fetch('/api/assistant/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  message: routinePrompt,
                  threadId: currentThreadId,
                  basicContext: getBasicContext() // Get current context dynamically
                })
              });
              
              if (response.ok) {
                // Update the streaming message with the assistant's response
                const reader = response.body?.getReader();
                const decoder = new TextDecoder();
                let fullContent = immediateMessage.content + '\n\n';
                
                if (reader) {
                  let buffer = '';
                  while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';
                    
                    for (const line of lines) {
                      if (line.trim() === '') continue;
                      if (line.startsWith('data: ')) {
                        const dataStr = line.slice(6);
                        if (dataStr === '[DONE]') continue;
                        
                        try {
                          const data = JSON.parse(dataStr);
                          if (data.type === 'delta' && data.content) {
                            fullContent += data.content;
                            setMessages(prev => {
                              const updated = [...prev];
                              const lastMessage = updated[updated.length - 1];
                              if (lastMessage.role === 'assistant') {
                                lastMessage.content = fullContent;
                                const partialParsed = parsePartialAssistantResponse(fullContent.substring(immediateMessage.content.length + 2));
                                if (partialParsed) {
                                  lastMessage.parsedContent = {
                                    ...partialParsed,
                                    questions: partialParsed.questions || lastAssistantQuestions
                                  };
                                }
                              }
                              return updated;
                            });
                          } else if (data.type === 'completed') {
                            // Clear the typing indicator timeout
                            if (streamingTimeoutRef.current) {
                              clearTimeout(streamingTimeoutRef.current);
                              streamingTimeoutRef.current = null;
                            }
                            
                            const assistantContent = fullContent.substring(immediateMessage.content.length + 2);
                            const parsedResponse = parseAssistantResponse(assistantContent);
                            
                            setMessages(prev => {
                              const updated = [...prev];
                              const lastMessage = updated[updated.length - 1];
                              if (lastMessage.role === 'assistant') {
                                lastMessage.content = fullContent;
                                lastMessage.isStreaming = false;
                                if (parsedResponse) {
                                  // Include previous questions if new response doesn't have any
                                  lastMessage.parsedContent = {
                                    ...parsedResponse,
                                    questions: parsedResponse.questions || lastAssistantQuestions
                                  };
                                }
                              }
                              return updated;
                            });
                          }
                        } catch (e) {
                          console.error('Error parsing stream data:', e);
                        }
                      }
                    }
                  }
                }
              }
            } catch (error) {
              console.error('Error getting routine recommendation:', error);
              // Fallback to showing just the questions
              setMessages(prev => {
                const updated = [...prev];
                const lastMessage = updated[updated.length - 1];
                if (lastMessage.role === 'assistant' && lastAssistantQuestions.length > 0) {
                  lastMessage.isStreaming = false;
                  lastMessage.parsedContent = {
                    greeting: lastMessage.content,
                    questions: lastAssistantQuestions
                  };
                }
                return updated;
              });
            }
          }}
        />
      )}

    </div>
  );
};