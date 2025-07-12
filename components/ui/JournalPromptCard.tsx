'use client';

import React, { useState } from 'react';
import { MessageCircle, Lightbulb, Target, Sparkles, TrendingUp } from 'lucide-react';
import { JournalPrompt, UserLearningProfile } from '@/src/types/thriving';

interface JournalPromptCardProps {
  prompt: JournalPrompt;
  response: string;
  onChange: (response: string) => void;
  userProfile?: UserLearningProfile | null;
}

export function JournalPromptCard({ prompt, response, onChange, userProfile }: JournalPromptCardProps) {
  const [isFocused, setIsFocused] = useState(false);

  const getPromptIcon = () => {
    switch (prompt.type) {
      case 'reflection':
        return <MessageCircle className="w-5 h-5" />;
      case 'tracking':
        return <Target className="w-5 h-5" />;
      case 'troubleshooting':
        return <Lightbulb className="w-5 h-5" />;
      case 'celebration':
        return <Sparkles className="w-5 h-5" />;
      default:
        return <MessageCircle className="w-5 h-5" />;
    }
  };

  const getPromptColor = () => {
    switch (prompt.type) {
      case 'reflection':
        return {
          bg: 'from-blue-50 to-indigo-50',
          border: 'border-blue-100',
          icon: 'text-blue-600',
          text: 'text-blue-900'
        };
      case 'tracking':
        return {
          bg: 'from-emerald-50 to-teal-50',
          border: 'border-emerald-100',
          icon: 'text-emerald-600',
          text: 'text-emerald-900'
        };
      case 'troubleshooting':
        return {
          bg: 'from-amber-50 to-yellow-50',
          border: 'border-amber-100',
          icon: 'text-amber-600',
          text: 'text-amber-900'
        };
      case 'celebration':
        return {
          bg: 'from-purple-50 to-pink-50',
          border: 'border-purple-100',
          icon: 'text-purple-600',
          text: 'text-purple-900'
        };
      default:
        return {
          bg: 'from-gray-50 to-slate-50',
          border: 'border-gray-100',
          icon: 'text-gray-600',
          text: 'text-gray-900'
        };
    }
  };

  const getPromptTypeLabel = () => {
    switch (prompt.type) {
      case 'reflection':
        return 'Reflection';
      case 'tracking':
        return 'Progress Tracking';
      case 'troubleshooting':
        return 'Problem Solving';
      case 'celebration':
        return 'Celebrate Success';
      default:
        return 'Question';
    }
  };

  const colors = getPromptColor();
  const isPersonalized = prompt.question.includes('which has been') || 
                        prompt.question.includes('your most effective') ||
                        prompt.question.includes('based on your');

  return (
    <div className={`relative rounded-2xl bg-gradient-to-r ${colors.bg} border ${colors.border} p-5 transition-all duration-300 ${
      isFocused ? 'shadow-lg scale-[1.02]' : 'shadow-sm'
    }`}>
      
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-xl bg-white/80 ${colors.icon}`}>
            {getPromptIcon()}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className={`text-xs font-medium ${colors.text} uppercase tracking-wide`}>
                {getPromptTypeLabel()}
              </span>
              {isPersonalized && (
                <div className="flex items-center space-x-1">
                  <TrendingUp className="w-3 h-3 text-dusty-rose" />
                  <span className="text-xs text-dusty-rose font-medium">Smart</span>
                </div>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              Priority: {prompt.priority}/10
            </div>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="mb-4">
        <h4 className={`font-medium ${colors.text} leading-relaxed`}>
          {prompt.question}
        </h4>
        
        {/* Show personalization indicator */}
        {isPersonalized && userProfile && (
          <div className="mt-2 p-2 bg-white/60 rounded-lg border border-dusty-rose/20">
            <div className="flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-dusty-rose" />
              <span className="text-xs text-gray-700">
                Personalized based on your {userProfile.dataPoints} journal entries
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Response Area */}
      <div className="relative">
        <textarea
          value={response}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={getPlaceholderText()}
          rows={4}
          className="w-full p-4 bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl focus:border-dusty-rose/50 focus:ring-2 focus:ring-dusty-rose/20 outline-none resize-none transition-all"
        />
        
        {/* Character count */}
        <div className="absolute bottom-2 right-2 text-xs text-gray-400">
          {response.length} characters
        </div>
      </div>

      {/* Helpful hints based on prompt type */}
      {isFocused && (
        <div className="mt-3 p-3 bg-white/60 rounded-lg border border-white/50">
          <div className="text-xs text-gray-600">
            {getHintText()}
          </div>
        </div>
      )}

      {/* Completion indicator */}
      {response.trim().length > 0 && (
        <div className="absolute top-3 right-3">
          <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
        </div>
      )}
    </div>
  );

  function getPlaceholderText(): string {
    switch (prompt.type) {
      case 'reflection':
        return "Take a moment to reflect... What thoughts come to mind?";
      case 'tracking':
        return "Share your observations... How did things go?";
      case 'troubleshooting':
        return "Let's think through this together... What challenges did you face?";
      case 'celebration':
        return "Celebrate your wins! What went well today?";
      default:
        return "Share your thoughts...";
    }
  }

  function getHintText(): string {
    switch (prompt.type) {
      case 'reflection':
        return "💭 Be honest and kind to yourself. There's no right or wrong answer.";
      case 'tracking':
        return "📊 Specific details help us learn your patterns better.";
      case 'troubleshooting':
        return "🔍 Think about what worked, what didn't, and what you might try differently.";
      case 'celebration':
        return "🎉 Acknowledging progress, no matter how small, builds momentum.";
      default:
        return "✍️ Your honest thoughts help us understand what works best for you.";
    }
  }
}