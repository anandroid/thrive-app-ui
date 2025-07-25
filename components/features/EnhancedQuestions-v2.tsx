'use client';

import React, { useState } from 'react';
import { EnhancedQuestion } from '@/src/services/openai/types';
import { ChevronRight, Clock, Send, Check } from 'lucide-react';

interface EnhancedQuestionsV2Props {
  questions: EnhancedQuestion[];
  onQuestionSubmit: (userMessage: string) => void;
}

export const EnhancedQuestionsV2: React.FC<EnhancedQuestionsV2Props> = ({
  questions,
  onQuestionSubmit
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [customTime, setCustomTime] = useState('');
  const [showCustomTime, setShowCustomTime] = useState(false);
  
  const currentQuestion = questions[currentIndex];
  
  const handleQuickReply = (question: EnhancedQuestion, option: string) => {
    const message = `${option} (answering: "${question.prompt}")`;
    
    // Store answer
    setAnswers(prev => ({ ...prev, [question.id]: option }));
    
    // Submit and move to next
    onQuestionSubmit(message);
    
    // Move to next question after a delay
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
      }
    }, 300);
  };
  
  const handleTimeSelect = (time: string) => {
    if (time === 'Custom time') {
      setShowCustomTime(true);
      return;
    }
    
    const message = `${time} (answering: "${currentQuestion.prompt}")`;
    onQuestionSubmit(message);
    
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
      }
    }, 300);
  };
  
  const handleCustomTimeSubmit = () => {
    if (!customTime) return;
    
    const message = `${customTime} (answering: "${currentQuestion.prompt}")`;
    onQuestionSubmit(message);
    setShowCustomTime(false);
    setCustomTime('');
    
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
      }
    }, 300);
  };

  if (!currentQuestion) return null;

  return (
    <div className="space-y-4">
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex space-x-2">
          {questions.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 w-2 rounded-full transition-all duration-300 ${
                idx < currentIndex 
                  ? 'bg-sage w-8' 
                  : idx === currentIndex 
                  ? 'bg-sage-dark w-8' 
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
        <span className="text-sm text-gray-500">
          {currentIndex + 1} of {questions.length}
        </span>
      </div>

      {/* Current Question */}
      <div className="animate-in slide-in-from-right duration-300">
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
          <div className="flex items-start space-x-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sage-light to-sage flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 flex-1">
              {currentQuestion.prompt}
            </h3>
          </div>

          {/* Time selection question */}
          {currentQuestion.quickOptions?.includes('9:00 PM') && (
            <div className="space-y-2">
              {!showCustomTime ? (
                currentQuestion.quickOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleTimeSelect(option)}
                    className="w-full p-4 text-left rounded-xl border-2 border-gray-200 
                             hover:border-sage hover:bg-sage-light/10 transition-all duration-200
                             flex items-center justify-between group"
                  >
                    <span className="text-gray-700 group-hover:text-gray-900">
                      {option}
                    </span>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-sage 
                                           transform group-hover:translate-x-1 transition-all" />
                  </button>
                ))
              ) : (
                <div className="space-y-3">
                  <input
                    type="time"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    className="w-full p-4 rounded-xl border-2 border-sage focus:border-sage-dark
                             focus:ring-2 focus:ring-sage/20 text-lg"
                    autoFocus
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setShowCustomTime(false);
                        setCustomTime('');
                      }}
                      className="flex-1 p-3 rounded-xl border-2 border-gray-300 text-gray-600
                               hover:bg-gray-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCustomTimeSubmit}
                      disabled={!customTime}
                      className="flex-1 p-3 rounded-xl bg-sage text-white hover:bg-sage-dark
                               transition-all disabled:opacity-50 disabled:cursor-not-allowed
                               flex items-center justify-center space-x-2"
                    >
                      <span>Submit</span>
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Yes/No/Not sure questions */}
          {currentQuestion.quickOptions?.includes('Yes') && 
           currentQuestion.quickOptions?.includes('No') && (
            <div className="grid grid-cols-2 gap-3">
              {currentQuestion.quickOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => handleQuickReply(currentQuestion, option)}
                  className={`p-4 rounded-xl font-medium transition-all duration-200
                            ${option === 'Yes' 
                              ? 'bg-gradient-to-r from-sage-light to-sage text-white hover:shadow-lg hover:scale-105' 
                              : option === 'No'
                              ? 'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 hover:shadow-lg hover:scale-105'
                              : 'col-span-2 bg-gradient-to-r from-dusty-rose/20 to-dusty-rose/30 text-gray-700 hover:shadow-lg hover:scale-105'
                            }`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Skip remaining questions option */}
      {currentIndex < questions.length - 1 && (
        <button
          onClick={() => setCurrentIndex(questions.length)}
          className="w-full text-center text-sm text-gray-500 hover:text-gray-700 py-2"
        >
          Skip remaining questions
        </button>
      )}

      {/* Previously answered questions (collapsed) */}
      {currentIndex > 0 && (
        <div className="mt-8 space-y-2">
          <p className="text-sm text-gray-500 mb-2">Answered:</p>
          {questions.slice(0, currentIndex).map((q) => (
            <div key={q.id} className="flex items-center space-x-2 text-sm text-gray-600">
              <Check className="w-4 h-4 text-sage-600" />
              <span>{q.prompt}</span>
              <span className="text-sage-600 font-medium">{answers[q.id]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};