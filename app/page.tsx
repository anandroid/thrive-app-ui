'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Sparkles, Weight, Pill, Brain, Activity, Heart, Moon, Leaf, Send } from 'lucide-react';
import Link from 'next/link';

const promptTemplates = [
  {
    icon: Weight,
    text: "Help me lose weight sustainably",
    gradient: "from-rose/20 to-dusty-rose/20",
    iconGradient: "from-rose to-burgundy",
    shadow: "shadow-rose/30"
  },
  {
    icon: Pill,
    text: "Create a routine for my medications",
    gradient: "from-sage-light/20 to-sage/20",
    iconGradient: "from-sage to-sage-dark",
    shadow: "shadow-sage/30"
  },
  {
    icon: Brain,
    text: "I need help managing anxiety",
    gradient: "from-soft-lavender/30 to-burgundy/20",
    iconGradient: "from-burgundy to-dark-burgundy",
    shadow: "shadow-burgundy/30"
  },
  {
    icon: Activity,
    text: "Help me reduce chronic pain",
    gradient: "from-dusty-rose/30 to-rose/20",
    iconGradient: "from-dusty-rose to-rose",
    shadow: "shadow-dusty-rose/30"
  },
  {
    icon: Moon,
    text: "I can't sleep well at night",
    gradient: "from-soft-lavender/40 to-soft-blush/30",
    iconGradient: "from-burgundy to-dusty-rose",
    shadow: "shadow-burgundy/30"
  },
  {
    icon: Heart,
    text: "Build my morning wellness routine",
    gradient: "from-rose/20 to-soft-blush/30",
    iconGradient: "from-rose to-burgundy",
    shadow: "shadow-rose/30"
  }
];

export default function HomePage() {
  const router = useRouter();
  const [input, setInput] = useState('');

  const handlePromptClick = (prompt: string) => {
    // Store the prompt and navigate to chat
    sessionStorage.setItem('initialMessage', prompt);
    router.push('/chat/new');
  };

  const handleSendMessage = () => {
    if (input.trim()) {
      sessionStorage.setItem('initialMessage', input);
      router.push('/chat/new');
    }
  };

  return (
    <div className="app-screen relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-soft-blush via-white to-soft-lavender/20" />
      
      {/* Decorative Elements */}
      <div className="absolute top-20 -right-20 w-96 h-96 rounded-full bg-gradient-to-br from-rose/10 to-dusty-rose/10 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-gradient-to-tr from-sage-light/20 to-sage/10 blur-3xl" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Status Bar Area */}
        <div className="safe-area-top" />
        
        {/* Header */}
        <div className="app-header backdrop-blur-xl bg-white/70 border-b-0">
          <div className="flex items-center justify-between px-4 h-14">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose to-burgundy flex items-center justify-center shadow-md shadow-rose/30">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold bg-gradient-to-r from-burgundy to-rose bg-clip-text text-transparent">Thrive</h1>
            </div>
            <Link 
              href="/settings"
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white/50 hover:bg-white/80 native-transition shadow-sm"
            >
              <Settings className="w-5 h-5 text-burgundy" />
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-6">
            {/* Welcome Section */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-rose/20 to-burgundy/20 flex items-center justify-center shadow-lg shadow-rose/20">
                <Sparkles className="w-10 h-10 text-gradient-primary" />
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-burgundy to-rose bg-clip-text text-transparent mb-2">
                Welcome to Thrive
              </h2>
              <p className="text-primary-text/70 text-base">
                Your holistic wellness journey starts here
              </p>
            </div>

            {/* Elegant Divider */}
            <div className="relative mb-8">
              <div className="h-px bg-gradient-to-r from-transparent via-rose/20 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-rose/40" />
              </div>
            </div>

            {/* Prompt Templates */}
            <div className="space-y-3">
              <p className="text-sm text-primary-text/60 font-medium text-center mb-4">
                How can I help you thrive today?
              </p>
              
              <div className="grid gap-3">
                {promptTemplates.map((template, index) => {
                  const Icon = template.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => handlePromptClick(template.text)}
                      className={`relative flex items-center space-x-3 p-4 rounded-2xl bg-white/60 backdrop-blur-sm hover:bg-white/80 native-transition text-left group shadow-md ${template.shadow} hover:shadow-lg overflow-hidden`}
                    >
                      {/* Card gradient background */}
                      <div className={`absolute inset-0 bg-gradient-to-r ${template.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
                      
                      <div className="relative flex items-center space-x-3 w-full">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${template.iconGradient} flex items-center justify-center flex-shrink-0 shadow-lg ${template.shadow}`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-primary-text text-sm font-medium flex-1">
                          {template.text}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Input Area - Fixed at Bottom */}
        <div className="border-t border-gray-100 bg-white safe-area-bottom">
          <div className="p-4">
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about your wellness journey..."
                className="flex-1 h-12 rounded-full px-5 bg-gray-50 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-rose/20 transition-all text-base"
              />
              <button
                onClick={handleSendMessage}
                disabled={!input.trim()}
                className="w-12 h-12 rounded-full bg-gradient-to-r from-rose to-burgundy text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed native-transition ios-active shadow-2xl shadow-rose/50 ring-2 ring-burgundy/50 ring-offset-2 ring-offset-white"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}