'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Sparkles, Weight, Pill, Brain, Activity, Heart, Moon, Leaf, ChevronRight, Edit3, Calendar } from 'lucide-react';
import Link from 'next/link';
import { WellnessRoutine } from '@/src/services/openai/types';
import { getRoutinesFromStorage } from '@/src/utils/routineStorage';
import { WellnessJourney } from '@/src/services/openai/types/journey';
import { getJourneysFromStorage } from '@/src/utils/journeyStorage';
import { Onboarding } from '@/components/features/Onboarding';
import { ChatEditor } from '@/components/ui/ChatEditor';

const promptTemplates = [
  {
    icon: Weight,
    text: "Help me lose weight sustainably",
    iconGradient: "from-rose/90 to-burgundy"
  },
  {
    icon: Pill,
    text: "Create a routine for my medications",
    iconGradient: "from-sage/90 to-sage-dark"
  },
  {
    icon: Brain,
    text: "I need help managing anxiety",
    iconGradient: "from-burgundy/90 to-dark-burgundy"
  },
  {
    icon: Activity,
    text: "Help me reduce chronic pain",
    iconGradient: "from-dusty-rose/90 to-rose"
  },
  {
    icon: Moon,
    text: "I can't sleep well at night",
    iconGradient: "from-burgundy/90 to-dusty-rose"
  },
  {
    icon: Heart,
    text: "Build my morning wellness routine",
    iconGradient: "from-rose/90 to-burgundy"
  }
];

// Get the next upcoming step based on current time
const getNextUpcomingStep = (routine: WellnessRoutine) => {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const stepsWithTimes = routine.steps
    .filter((step) => step.reminderTime)
    .map((step) => {
      const [hours, minutes] = step.reminderTime!.split(':').map(Number);
      const stepTime = hours * 60 + minutes;
      return { ...step, stepTime };
    })
    .sort((a, b) => a.stepTime - b.stepTime);

  const nextStep = stepsWithTimes.find((step) => step.stepTime > currentTime);
  return nextStep || stepsWithTimes[0];
};

// Get count of remaining reminders today
const getRemainingStepsToday = (routine: WellnessRoutine) => {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  return routine.steps.filter((step) => {
    if (!step.reminderTime) return false;
    const [hours, minutes] = step.reminderTime.split(':').map(Number);
    const stepTime = hours * 60 + minutes;
    return stepTime > currentTime;
  }).length;
};

// Format time to ensure proper AM/PM display
const formatReminderTime = (time: string) => {
  if (!time) return '';
  
  if (time.toLowerCase().includes('am') || time.toLowerCase().includes('pm')) {
    return time;
  }
  
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

export default function HomePage() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [routines, setRoutines] = useState<WellnessRoutine[]>([]);
  const [journeys, setJourneys] = useState<WellnessJourney[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showMenuSparkle, setShowMenuSparkle] = useState(false);

  useEffect(() => {
    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }

    // Load routines from localStorage using utility function
    const savedRoutines = getRoutinesFromStorage();
    setRoutines(savedRoutines);
    
    // Load journeys from localStorage
    const savedJourneys = getJourneysFromStorage();
    setJourneys(savedJourneys);
    
    // Check if should show menu sparkle
    const hasUsedChat = localStorage.getItem('hasUsedChat');
    const hasClickedMenu = localStorage.getItem('hasClickedMenu');
    if (hasUsedChat && !hasClickedMenu) {
      setShowMenuSparkle(true);
    }
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setShowOnboarding(false);
  };

  const handlePromptClick = (prompt: string) => {
    // Store the prompt and navigate to chat
    sessionStorage.setItem('initialMessage', prompt);
    localStorage.setItem('hasUsedChat', 'true');
    router.push('/chat/new');
  };

  const handleSendMessage = () => {
    if (input.trim()) {
      sessionStorage.setItem('initialMessage', input);
      localStorage.setItem('hasUsedChat', 'true');
      router.push('/chat/new');
    }
  };

  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className={`app-screen relative overflow-hidden ${!showOnboarding ? 'animate-slide-in-from-right' : ''}`}>
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-soft-blush/80 via-white to-soft-lavender/30" />
      
      {/* Decorative Elements */}
      <div className="absolute top-20 -right-20 w-96 h-96 rounded-full bg-gradient-to-br from-rose/20 to-dusty-rose/20 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-gradient-to-tr from-sage-light/40 to-sage/30 blur-3xl" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Status Bar Area */}
        <div className="safe-area-top" />
        
        {/* Header */}
        <div className="app-header backdrop-blur-xl bg-white/80 border-b-0 shadow-lg shadow-gray-200/50">
          <div className="flex items-center justify-between px-4 h-14">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose to-burgundy flex items-center justify-center shadow-xl shadow-rose/50">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-burgundy to-rose bg-clip-text text-transparent">Thrive</h1>
            </div>
            <Link 
              href="/settings"
              onClick={() => {
                localStorage.setItem('hasClickedMenu', 'true');
                setShowMenuSparkle(false);
              }}
              className="w-11 h-11 rounded-2xl flex items-center justify-center bg-white/60 hover:bg-white/90 native-transition shadow-lg hover:shadow-xl relative overflow-hidden"
            >
              <Menu className="w-5 h-5 text-burgundy" />
              {showMenuSparkle && (
                <div className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-rose to-burgundy rounded-full" />
                  <Sparkles className="w-2.5 h-2.5 text-white relative z-10 animate-pulse" />
                </div>
              )}
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-6">
            {/* Routines Section - Only show if routines exist */}
            {routines.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-primary-text">Your Routines</h2>
                  <Link 
                    href="/routines"
                    className="flex items-center space-x-1 text-sm font-medium text-secondary-text hover:text-primary-text transition-colors"
                  >
                    <span>See all</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                
                {/* Horizontal Scroll Container */}
                <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide">
                  <div className="flex space-x-3 pb-2">
                    {routines.slice(0, 5).map((routine) => (
                      <div
                        key={routine.id}
                        className="flex-none w-[280px] p-5 rounded-2xl bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all group cursor-pointer"
                        onClick={() => router.push(`/routines?id=${routine.id}`)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sage-light/30 to-sage/20 flex items-center justify-center shadow-sm">
                            <Sparkles className="w-5 h-5 text-sage-dark" />
                          </div>
                          <span className="text-xs font-medium text-burgundy">
                            {getRemainingStepsToday(routine)} more steps
                          </span>
                        </div>
                        <h3 className="font-semibold text-primary-text text-lg mb-3">{routine.name}</h3>
                        
                        {/* What's Next Section */}
                        {(() => {
                          const nextStep = getNextUpcomingStep(routine);
                          const remainingToday = getRemainingStepsToday(routine);
                          
                          return nextStep ? (
                            <div 
                              className="rounded-xl bg-gradient-to-r from-sage-light/20 to-sage/10 border border-sage-light/30 p-3 mb-3 hover:from-sage-light/30 hover:to-sage/20 transition-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/routines?id=${routine.id}&step=${nextStep.order - 1}`);
                              }}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-sage-dark">
                                  Next: {nextStep.reminderTime ? formatReminderTime(nextStep.reminderTime) : 'Soon'}
                                </span>
                                {remainingToday > 1 && (
                                  <span className="text-xs text-gray-600">
                                    +{remainingToday - 1} more
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-medium text-gray-900">{nextStep.title}</p>
                            </div>
                          ) : (
                            <div className="text-xs text-gray-500 italic mb-3">
                              No scheduled reminders
                            </div>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Journeys Section - Only show if journeys exist */}
            {journeys.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-primary-text">Your Journeys</h2>
                    <p className="text-xs text-secondary-text-thin">Daily wellness journals</p>
                  </div>
                  <Link 
                    href="/journeys"
                    className="flex items-center space-x-1 text-sm font-medium text-secondary-text hover:text-primary-text transition-colors"
                  >
                    <span>See all</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                
                {/* Horizontal Scroll Container */}
                <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide">
                  <div className="flex space-x-3 pb-2">
                    {journeys.slice(0, 5).map((journey) => {
                      const lastEntry = journey.entries[journey.entries.length - 1];
                      return (
                        <button
                          key={journey.id}
                          onClick={() => {
                            sessionStorage.setItem('selectedJourneyId', journey.id);
                            router.push('/journeys');
                          }}
                          className="flex-none w-[280px] p-5 rounded-2xl bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all group text-left"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lavender/30 to-purple-500/20 flex items-center justify-center shadow-sm">
                              <Edit3 className="w-5 h-5 text-purple-600" />
                            </div>
                            <span className="text-xs font-medium text-secondary-text-thin">
                              {journey.entries.length} entries
                            </span>
                          </div>
                          <h3 className="font-semibold text-primary-text text-lg mb-2">{journey.title}</h3>
                          <p className="text-sm text-secondary-text-thin line-clamp-2 mb-3">
                            {journey.description}
                          </p>
                          {lastEntry && (
                            <div className="flex items-center justify-between text-xs text-light-text">
                              <span className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>Last: {new Date(lastEntry.timestamp).toLocaleDateString()}</span>
                              </span>
                              <span className="text-lg">
                                {lastEntry.mood === 'great' && '😊'}
                                {lastEntry.mood === 'good' && '🙂'}
                                {lastEntry.mood === 'okay' && '😐'}
                                {lastEntry.mood === 'not_great' && '😔'}
                                {lastEntry.mood === 'struggling' && '😢'}
                              </span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}


            {/* Prompt Templates */}
            <div className="space-y-3">
              <p className="text-lg text-secondary-text font-light text-center mb-8">
                How can I help you thrive?
              </p>
              
              <div className="grid gap-3">
                {promptTemplates.map((template, index) => {
                  const Icon = template.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => handlePromptClick(template.text)}
                      className="relative flex items-center space-x-4 p-6 rounded-3xl bg-white/90 backdrop-blur-sm hover:bg-white native-transition text-left group shadow-lg shadow-gray-200/40 hover:shadow-xl hover:scale-[1.01] overflow-hidden"
                    >
                      
                      <div className="flex items-center space-x-4 w-full">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${template.iconGradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <span className="text-gray-800 text-[17px] font-medium flex-1">
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
        <ChatEditor
          value={input}
          onChange={setInput}
          onSubmit={handleSendMessage}
          className="border-t border-gray-200 bg-white/95 backdrop-blur-xl shadow-xl"
        />
      </div>
    </div>
  );
}