'use client';

import React, { useState, useEffect } from 'react';
import { EnhancedQuestion } from '@/src/services/openai/types';
import { ChevronRight, Check } from 'lucide-react';

/**
 * EnhancedQuestions Component
 * 
 * Displays questions from the assistant in a progressive, one-at-a-time interface.
 * Integrates with conversational flow for natural answer batching.
 * 
 * Two modes of operation:
 * 1. IMMEDIATE MODE (single question or useConversationalFlow=false):
 *    - Answers are sent immediately when submitted
 *    - No waiting or batching
 * 
 * 2. CONVERSATIONAL FLOW MODE (multiple questions + useConversationalFlow=true):
 *    - Answers are staged, not sent immediately
 *    - Parent component manages the 6-second pause timer
 *    - Multiple answers can be batched together
 *    - Typing in text inputs triggers "user typing" behavior
 */
interface EnhancedQuestionsProps {
  questions: EnhancedQuestion[];
  onQuestionSubmit: (userMessage: string) => void;  // Direct send (immediate mode)
  onAnswerStaged?: (question: string, answer: string) => void;  // Stage answer (conversational mode)
  useConversationalFlow?: boolean;  // Enable batching with pause timer
  onAllQuestionsAnswered?: () => void;  // Callback when all questions are answered
  onCurrentQuestionChange?: (question: EnhancedQuestion | null) => void;  // Track current question
  userAnswer?: string;  // Answer from main chat input
}

export const EnhancedQuestions: React.FC<EnhancedQuestionsProps> = ({
  questions,
  onQuestionSubmit,
  onAnswerStaged,
  useConversationalFlow = false,
  onAllQuestionsAnswered,
  onCurrentQuestionChange,
  userAnswer
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<Record<string, string>>({});
  const [isAnimating, setIsAnimating] = useState(false);
  const [showAnswered, setShowAnswered] = useState(false);

  const currentQuestion = questions[currentIndex];
  
  // Notify parent of current question
  useEffect(() => {
    onCurrentQuestionChange?.(currentQuestion || null);
  }, [currentQuestion, onCurrentQuestionChange]);
  
  // Handle answer from main chat input
  useEffect(() => {
    if (userAnswer && currentQuestion) {
      // Process the answer based on question type
      if (currentQuestion.type === 'quick_reply') {
        // For quick reply, check if answer matches an option
        const matchedOption = currentQuestion.quickOptions?.find(
          opt => opt.toLowerCase() === userAnswer.toLowerCase()
        );
        if (matchedOption) {
          handleQuickReply(currentQuestion, matchedOption);
        }
      } else {
        // For other types, accept any text answer
        handleTextAnswer(currentQuestion, userAnswer);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userAnswer]);
  
  const moveToNext = () => {
    setIsAnimating(true);
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        // Move past the last question to show thank you
        setCurrentIndex(prev => prev + 1);
        // Notify parent after a delay so thank you message is visible
        setTimeout(() => {
          onAllQuestionsAnswered?.();
        }, 3000); // Show thank you for 3 seconds
      }
      setIsAnimating(false);
    }, 300);
  };

  const handleQuickReply = (question: EnhancedQuestion, option: string) => {
    // Store answer locally for UI display
    setAnsweredQuestions(prev => ({ ...prev, [question.id]: option }));
    
    // BATCHING DECISION: Stage vs Send immediately
    if (useConversationalFlow && onAnswerStaged) {
      // CONVERSATIONAL MODE: Stage the answer
      // - Answer is collected but not sent yet
      // - Will be batched with other answers
      // - Sent after 6-second pause or when user types
      onAnswerStaged(question.prompt, option);
    } else {
      // IMMEDIATE MODE: Send right away
      // - Used for single questions
      // - No waiting or batching
      // Just send the answer without context in UI
      onQuestionSubmit(option);
    }
    
    // Move to next question
    moveToNext();
  };

  const handleTimeSelect = (question: EnhancedQuestion, time: string) => {
    // Store answer
    setAnsweredQuestions(prev => ({ ...prev, [question.id]: time }));
    
    if (useConversationalFlow && onAnswerStaged) {
      // Stage the answer for conversational flow
      onAnswerStaged(question.prompt, time);
    } else {
      // Send message immediately without context in UI
      onQuestionSubmit(time);
    }
    
    // Move to next
    moveToNext();
  };
  

  const handleTextAnswer = (question: EnhancedQuestion, answer: string) => {
    // Store answer
    setAnsweredQuestions(prev => ({ ...prev, [question.id]: answer }));
    
    if (useConversationalFlow && onAnswerStaged) {
      // Stage the answer for conversational flow
      onAnswerStaged(question.prompt, answer);
    } else {
      // Send just the answer without context in UI
      onQuestionSubmit(answer);
    }
    
    moveToNext();
  };
  

  const renderQuestionContent = (question: EnhancedQuestion) => {
    switch (question.type) {
      case 'quick_reply':
        // Special handling for time selection questions - Modern design
        if (question.quickOptions?.some(opt => opt.includes('PM') || opt.includes('AM'))) {
          return (
            <div className="space-y-2">
              {question.quickOptions.filter(opt => opt !== 'Custom time').map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleTimeSelect(question, option)}
                  className="w-full py-3 px-4 text-left rounded-xl
                           bg-white border border-gray-200 text-gray-700
                           hover:border-gray-900 hover:text-gray-900 hover:bg-gray-50
                           transition-all duration-200 touch-feedback text-sm font-medium
                           active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-gray-900/20
                           flex items-center justify-between group"
                >
                  <span>{option}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-900 
                                         transform group-hover:translate-x-0.5 transition-transform" />
                </button>
              ))}
              <div className="text-center py-1">
                <p className="text-xs text-gray-500 italic">
                  Or type a custom time in the chat below
                </p>
              </div>
            </div>
          );
        }
        
        // Yes/No/Not sure questions - Clean modern design
        if (question.quickOptions?.includes('Yes') && question.quickOptions?.includes('No')) {
          return (
            <div className="space-y-2">
              <div className="flex flex-col space-y-2">
                {question.quickOptions.filter(opt => opt !== 'Not sure').map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickReply(question, option)}
                    className={`py-2.5 px-3 rounded-lg font-medium text-xs text-center
                             transition-all duration-200 touch-feedback
                             active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-gray-900/20
                             ${option === 'Yes' || option.toLowerCase().includes('yes')
                               ? 'bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-700'
                               : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-900 hover:text-gray-900'
                             }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {question.quickOptions.includes('Not sure') && (
                <button
                  onClick={() => handleQuickReply(question, 'Not sure')}
                  className="w-full py-2.5 px-3 rounded-lg font-medium text-xs
                           bg-gray-100 text-gray-600
                           hover:bg-gray-200 hover:text-gray-700
                           transition-all duration-200 touch-feedback
                           active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                >
                  Not sure
                </button>
              )}
            </div>
          );
        }
        
        // Other quick reply options - Modern design
        return (
          <div className="grid grid-cols-2 gap-2">
            {question.quickOptions?.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickReply(question, option)}
                className="py-2.5 px-3 rounded-lg font-medium text-xs text-center
                         bg-white border border-gray-200 text-gray-700
                         hover:border-gray-900 hover:text-gray-900
                         transition-all duration-200 touch-feedback
                         active:scale-[0.98]
                         focus:outline-none focus:ring-2 focus:ring-gray-900/20"
              >
                {option}
              </button>
            ))}
          </div>
        );

      case 'time_input':
        return (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 italic">
              Type a time in the chat below (e.g., &quot;8:00 PM&quot;, &quot;20:00&quot;)
            </p>
          </div>
        );

      case 'multi_select':
        return (
          <div className="space-y-2">
            <div className="space-y-1">
              {question.options?.map((option, idx) => (
                <div key={idx} className="flex items-center space-x-2 text-xs text-gray-600">
                  <span className="w-1 h-1 bg-gray-400 rounded-full" />
                  <span>{option}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 italic mt-2">
              Type your choices in the chat below (e.g., &quot;Coffee and Green tea&quot;)
            </p>
          </div>
        );

      case 'text_input':
        return (
          <div className="space-y-2">
            {question.placeholder && (
              <p className="text-xs text-gray-500">
                {question.placeholder}
              </p>
            )}
            <p className="text-xs text-gray-500 italic">
              Type your response in the chat below
            </p>
          </div>
        );

      default:
        return null;
    }
  };


  // Show thank you message after all questions are answered
  if (!currentQuestion && currentIndex >= questions.length && questions.length > 0) {
    return (
      <div className="space-y-3">
        {/* Thank you message in same layout as questions */}
        <div className="animate-in slide-in-from-bottom duration-300">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-4 
                        border border-gray-200/50 backdrop-blur-sm">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              Thanks for answering! 🎉
            </h3>
            <p className="text-xs text-gray-600">
              I&apos;m processing your responses to provide personalized recommendations.
            </p>
          </div>
        </div>

        {/* Previously answered questions - Always show after completion */}
        <div className="border-t border-gray-100 pt-3">
          <button
            onClick={() => setShowAnswered(!showAnswered)}
            className="w-full flex items-center justify-between text-xs text-gray-500 
                     hover:text-gray-700 transition-colors py-1"
          >
            <span className="font-medium">Your answers ({questions.length})</span>
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showAnswered ? 'rotate-90' : ''}`} />
          </button>
          
          {showAnswered && (
            <div className="mt-2 space-y-1 animate-in slide-in-from-top duration-300">
              {questions.map((q) => (
                <div key={q.id} className="flex items-start space-x-2 p-2 rounded-lg bg-gray-50 border border-gray-100">
                  <Check className="w-3.5 h-3.5 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600">{q.prompt}</p>
                    <p className="text-xs font-medium text-gray-900 truncate">
                      {answeredQuestions[q.id]}
                    </p>
                  </div>
                </div>
              ))}
              {/* Thank you as last item in the list */}
              <div className="flex items-start space-x-2 p-2 rounded-lg bg-green-50 border border-green-100">
                <Check className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-green-800">All questions completed!</p>
                  <p className="text-xs text-green-600">
                    Thanks for your responses
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Progress indicator - minimal and modern */}
      {questions.length > 1 && (
        <div className="flex items-center justify-center space-x-1 animate-in fade-in duration-500">
          {questions.map((_, idx) => (
            <div
              key={idx}
              className={`transition-all duration-300 ${
                idx < currentIndex 
                  ? 'h-0.5 w-0.5 rounded-full bg-gray-400' 
                  : idx === currentIndex 
                  ? 'h-0.5 w-4 rounded-full bg-gray-900' 
                  : 'h-0.5 w-0.5 rounded-full bg-gray-200'
              }`}
            />
          ))}
        </div>
      )}

      {/* Current Question - Modern card design */}
      {currentQuestion && (
        <div className={`animate-in slide-in-from-bottom duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
          <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-4 
                        border border-gray-200/50 backdrop-blur-sm">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              {currentQuestion.prompt}
            </h3>
            {renderQuestionContent(currentQuestion)}
          </div>
        </div>
      )}

      {/* Skip remaining questions - Subtle link style */}
      {currentIndex < questions.length - 1 && (
        <button
          onClick={() => setCurrentIndex(questions.length)}
          className="w-full text-center text-xs text-gray-400 hover:text-gray-600 
                   py-1 transition-colors"
        >
          Skip questions →
        </button>
      )}

      {/* Previously answered questions - Clean collapsible */}
      {currentIndex > 0 && (
        <div className="border-t border-gray-100 pt-3">
          <button
            onClick={() => setShowAnswered(!showAnswered)}
            className="w-full flex items-center justify-between text-xs text-gray-500 
                     hover:text-gray-700 transition-colors py-1"
          >
            <span className="font-medium">Previous answers ({currentIndex})</span>
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showAnswered ? 'rotate-90' : ''}`} />
          </button>
          
          {showAnswered && (
            <div className="mt-2 space-y-1 animate-in slide-in-from-top duration-300">
              {questions.slice(0, currentIndex).map((q) => (
                <div key={q.id} className="flex items-start space-x-2 p-2 rounded-lg bg-gray-50 border border-gray-100">
                  <Check className="w-3.5 h-3.5 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600">{q.prompt}</p>
                    <p className="text-xs font-medium text-gray-900 truncate">
                      {answeredQuestions[q.id]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};