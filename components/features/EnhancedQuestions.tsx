'use client';

import React, { useState } from 'react';
import { EnhancedQuestion } from '@/src/services/openai/types';
import { ChevronRight, Clock, CheckSquare, MessageSquare, Send } from 'lucide-react';

interface EnhancedQuestionsProps {
  questions: EnhancedQuestion[];
  onQuestionSubmit: (userMessage: string) => void;
}

export const EnhancedQuestions: React.FC<EnhancedQuestionsProps> = ({
  questions,
  onQuestionSubmit
}) => {
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, Record<string, string | boolean>>>({});

  const handleQuickReply = (question: EnhancedQuestion, option: string) => {
    let message = '';
    
    // Handle yes/no questions specially
    if (question.quickOptions?.includes('Yes') && question.quickOptions?.includes('No')) {
      if (option === 'No') {
        // For "No" answers, use a different phrasing
        message = option; // Just "No" is cleaner
      } else if (option === 'Yes') {
        // For "Yes" answers, use the userVoice if it makes sense
        if (question.userVoice.toLowerCase().includes('yes')) {
          message = question.userVoice.replace(/yes,?\s*/i, '') + ' some supplements';
        } else {
          message = 'Yes';
        }
      } else {
        // For other options like "Not sure"
        message = option;
      }
    } else {
      // For non yes/no questions, use the original logic
      message = question.userVoice + ' ' + option;
    }
    
    onQuestionSubmit(message);
  };

  const handleFormSubmit = (question: EnhancedQuestion) => {
    const values = formValues[question.id];
    if (!values) return;

    let message = question.userVoice;
    
    switch (question.type) {
      case 'time_input':
        message += ' ' + values.time;
        break;
      case 'multi_select':
        const selected = Object.keys(values).filter(k => values[k]);
        if (selected.length > 0) {
          message += ' ' + selected.join(', ');
        }
        break;
      case 'text_input':
        message += ' ' + values.text;
        break;
    }

    onQuestionSubmit(message);
    setExpandedQuestion(null);
    setFormValues({});
  };

  const renderQuestionContent = (question: EnhancedQuestion) => {
    switch (question.type) {
      case 'quick_reply':
        return (
          <div className="mt-3 flex flex-wrap gap-2">
            {question.quickOptions?.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickReply(question, option)}
                className="px-4 py-2 rounded-full bg-sage-light/30 hover:bg-sage/30 text-sm text-gray-700 transition-all touch-feedback"
              >
                {option}
              </button>
            ))}
          </div>
        );

      case 'time_input':
        if (expandedQuestion !== question.id) {
          return (
            <div className="mt-3 flex flex-wrap gap-2">
              {question.quickOptions?.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickReply(question, option)}
                  className="px-4 py-2 rounded-full bg-sage-light/30 hover:bg-sage/30 text-sm text-gray-700 transition-all touch-feedback"
                >
                  {option}
                </button>
              ))}
              <button
                onClick={() => setExpandedQuestion(question.id)}
                className="px-4 py-2 rounded-full bg-white border border-sage/30 hover:border-sage text-sm text-gray-700 transition-all touch-feedback"
              >
                Custom time
              </button>
            </div>
          );
        }
        return (
          <div className="mt-3 space-y-3 animate-fadeIn">
            <div className="flex items-center gap-3">
              <input
                type="time"
                value={(formValues[question.id]?.time as string) || ''}
                onChange={(e) => setFormValues({
                  ...formValues,
                  [question.id]: { time: e.target.value }
                })}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:border-sage focus:ring-2 focus:ring-sage/20"
              />
              <button
                onClick={() => handleFormSubmit(question)}
                disabled={!formValues[question.id]?.time}
                className="p-3 rounded-xl bg-sage text-white hover:bg-sage-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-feedback"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={() => setExpandedQuestion(null)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        );

      case 'multi_select':
        return (
          <div className="mt-3 space-y-3">
            <div className="space-y-2">
              {question.options?.map((option, idx) => (
                <label
                  key={idx}
                  className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-all"
                >
                  <input
                    type="checkbox"
                    checked={(formValues[question.id]?.[option] as boolean) || false}
                    onChange={(e) => setFormValues({
                      ...formValues,
                      [question.id]: {
                        ...formValues[question.id],
                        [option]: e.target.checked
                      }
                    })}
                    className="w-5 h-5 rounded border-gray-300 text-sage focus:ring-sage"
                  />
                  <span className="text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </div>
            <button
              onClick={() => handleFormSubmit(question)}
              disabled={!Object.values(formValues[question.id] || {}).some(v => v)}
              className="w-full px-4 py-3 rounded-xl bg-sage text-white hover:bg-sage-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-feedback"
            >
              Submit
            </button>
          </div>
        );

      case 'text_input':
        return (
          <div className="mt-3 space-y-3">
            <textarea
              value={(formValues[question.id]?.text as string) || ''}
              onChange={(e) => setFormValues({
                ...formValues,
                [question.id]: { text: e.target.value }
              })}
              placeholder={question.placeholder || question.userVoice}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-sage focus:ring-2 focus:ring-sage/20 min-h-[80px] resize-none"
            />
            <button
              onClick={() => handleFormSubmit(question)}
              disabled={!formValues[question.id]?.text}
              className="w-full px-4 py-3 rounded-xl bg-sage text-white hover:bg-sage-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-feedback"
            >
              Submit
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  const getQuestionIcon = (type: string) => {
    switch (type) {
      case 'time_input':
        return Clock;
      case 'multi_select':
        return CheckSquare;
      case 'text_input':
        return MessageSquare;
      default:
        return ChevronRight;
    }
  };

  return (
    <div className="space-y-3">
      {questions.map((question) => {
        const Icon = getQuestionIcon(question.type);
        const isExpanded = expandedQuestion === question.id;

        return (
          <div
            key={question.id}
            className={`rounded-2xl bg-gradient-to-r from-white to-gray-50/30 hover:from-white hover:to-sage-light/10 hover:shadow-xl hover:shadow-sage/20 transition-all duration-300 border-2 ${
              isExpanded ? 'border-sage/40' : 'border-gray-200 hover:border-sage/40'
            }`}
          >
            <div className="p-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sage-light/30 to-sage/20 flex items-center justify-center flex-shrink-0 shadow-md shadow-sage/20">
                  <Icon className="w-5 h-5 text-sage-dark" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {question.prompt}
                  </p>
                  {renderQuestionContent(question)}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};