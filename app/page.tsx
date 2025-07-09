'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Sparkles, Weight, Pill, Brain, Activity, Heart, Moon, Leaf, ChevronRight, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { Thriving } from '@/src/types/thriving';
import { getThrivingsFromStorage, migrateRoutinesToThrivings } from '@/src/utils/thrivingStorage';
import { GetStarted } from '@/components/features/GetStarted';
import { ChatEditor } from '@/components/ui/ChatEditor';
import { PrivacySection } from '@/components/features/PrivacySection';
// import { PrivacySection2 } from '@/components/features/PrivacySection2';
// import { PrivacySection3 } from '@/components/features/PrivacySection3';

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
    iconGradient: "from-[#E08B5D] to-[#D4696F]"
  },
  {
    icon: Activity,
    text: "Help me reduce chronic pain",
    iconGradient: "from-dusty-rose/90 to-dark-burgundy"
  },
  {
    icon: Moon,
    text: "I can't sleep well at night",
    iconGradient: "from-slate-400 to-blue-500"
  },
  {
    icon: Heart,
    text: "Help me with my symptoms",
    iconGradient: "from-sage-light/90 to-sage"
  }
];

// Get the next upcoming step based on current time
const getNextUpcomingStep = (thriving: Thriving) => {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const stepsWithTimes = thriving.steps
    .filter((step) => step.time)
    .map((step) => {
      const [hours, minutes] = step.time!.split(':').map(Number);
      const stepTime = hours * 60 + minutes;
      return { ...step, stepTime };
    })
    .sort((a, b) => a.stepTime - b.stepTime);

  const nextStep = stepsWithTimes.find((step) => step.stepTime > currentTime);
  return nextStep || stepsWithTimes[0];
};

// Get count of remaining reminders today
const getRemainingStepsToday = (thriving: Thriving) => {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  return thriving.steps.filter((step) => {
    if (!step.time) return false;
    const [hours, minutes] = step.time.split(':').map(Number);
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
  // Initialize with localStorage values to prevent flicker
  const [thrivings] = useState<Thriving[]>(() => {
    if (typeof window !== 'undefined') {
      migrateRoutinesToThrivings();
      return getThrivingsFromStorage();
    }
    return [];
  });
  const [showGetStarted, setShowGetStarted] = useState<boolean | null>(null);
  const [showMenuSparkle, setShowMenuSparkle] = useState(false);
  const [showMainContent, setShowMainContent] = useState(() => {
    // If user has already seen GetStarted, show main content immediately
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('hasSeenGetStarted');
    }
    return false;
  });

  useEffect(() => {
    // Initialize showGetStarted after mount to prevent hydration mismatch
    const hasSeenGetStarted = localStorage.getItem('hasSeenGetStarted');
    setShowGetStarted(!hasSeenGetStarted);
    
    // Check if should show menu sparkle
    const hasUsedChat = localStorage.getItem('hasUsedChat');
    const hasClickedMenu = localStorage.getItem('hasClickedMenu');
    if (hasUsedChat && !hasClickedMenu) {
      setShowMenuSparkle(true);
    }
  }, []);

  const handleGetStartedComplete = () => {
    // The GetStarted component handles the fade-out animation
    // We just need to update our state after it completes
    setShowGetStarted(false);
    setShowMainContent(true);
  };

  const handlePromptClick = (prompt: string) => {
    // Store the prompt and navigate to chat
    sessionStorage.setItem('initialMessage', prompt);
    localStorage.setItem('hasUsedChat', 'true');
    
    // Pass thriving intent through URL for medication routine
    if (prompt === "Create a routine for my medications") {
      router.push('/chat/new?intent=create_thriving');
    } else {
      router.push('/chat/new');
    }
  };

  const handleSendMessage = () => {
    if (input.trim()) {
      sessionStorage.setItem('initialMessage', input);
      localStorage.setItem('hasUsedChat', 'true');
      router.push('/chat/new');
    }
  };

  // Only show loading screen if we don't know the state AND haven't seen GetStarted
  if (showGetStarted === null && !showMainContent) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-soft-blush/80 via-white to-soft-lavender/30 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose"></div>
      </div>
    );
  }

  return (
    <>
      {/* Show get started overlay when needed */}
      {showGetStarted && (
        <div className="fixed inset-0 z-50">
          <GetStarted onComplete={handleGetStartedComplete} />
        </div>
      )}
      
      {/* Main app content - Only render when ready */}
      {showMainContent && (
        <div className="chat-container">
        {/* Header - stays at top */}
        <div className="chat-header safe-top">
          <div className="flex items-center justify-between content-padding h-14">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose to-burgundy flex items-center justify-center">
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
              className="w-11 h-11 rounded-2xl flex items-center justify-center bg-white/60 hover:bg-white/90 native-transition shadow-lg hover:shadow-xl relative overflow-hidden touch-feedback touch-manipulation"
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

        {/* Main Content - Scrollable */}
        <div className="chat-messages">
          <div className="chat-messages-content">
            {/* Thrivings Section - Only show if thrivings exist */}
            {thrivings.length > 0 && (
              <div className="content-padding py-6 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-primary-text">Your Thrivings</h2>
                  <Link 
                    href="/thrivings"
                    onClick={() => {
                      // Set flag to indicate we're navigating from home page
                      sessionStorage.setItem('navigateFromHome', 'true');
                    }}
                    className="flex items-center space-x-1 text-sm font-medium text-secondary-text hover:text-primary-text transition-colors"
                  >
                    <span>See all</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                
                {/* Horizontal Scroll Container */}
                <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide">
                  <div className="flex space-x-3 pb-2">
                    {thrivings.slice(0, 5).map((thriving, index) => (
                      <div
                        key={thriving.id}
                        className="flex-none w-[280px] p-5 rounded-2xl bg-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer touch-feedback touch-manipulation"
                        onClick={() => router.push(`/thrivings?id=${thriving.id}`)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                            index % 4 === 0 ? 'bg-gradient-to-br from-sage-light/30 to-sage/20' :
                            index % 4 === 1 ? 'bg-gradient-to-br from-rose/20 to-burgundy/15' :
                            index % 4 === 2 ? 'bg-gradient-to-br from-lavender/25 to-dusty-rose/20' :
                            'bg-gradient-to-br from-dusty-rose/20 to-rose/15'
                          }`}>
                            <Sparkles className={`w-5 h-5 ${
                              index % 4 === 0 ? 'text-sage-dark' :
                              index % 4 === 1 ? 'text-burgundy' :
                              index % 4 === 2 ? 'text-purple-600' :
                              'text-rose'
                            }`} />
                          </div>
                          <span className="text-xs font-medium text-burgundy">
                            {getRemainingStepsToday(thriving)} more steps
                          </span>
                        </div>
                        <h3 className="font-semibold text-primary-text text-lg mb-3">{thriving.title}</h3>
                        
                        {/* What's Next Section */}
                        {(() => {
                          const nextStep = getNextUpcomingStep(thriving);
                          const remainingToday = getRemainingStepsToday(thriving);
                          
                          return nextStep ? (
                            <div 
                              className="rounded-xl bg-gradient-to-r from-sage-light/20 to-sage/10 border border-sage-light/30 p-3 mb-3 hover:from-sage-light/30 hover:to-sage/20 transition-all touch-feedback touch-manipulation"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Find the index of this step in the steps array
                                const stepIndex = thriving.steps.findIndex(s => s.id === nextStep.id);
                                router.push(`/thrivings?id=${thriving.id}&step=${stepIndex}`);
                              }}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-sage-dark">
                                  Next: {nextStep.time ? formatReminderTime(nextStep.time) : 'Soon'}
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
                        
                        {/* Journal Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/thrivings/${thriving.id}/journal`);
                          }}
                          className="w-full mt-3 py-2 rounded-xl bg-gradient-to-r from-dusty-rose/20 to-rose/20 text-dusty-rose font-medium text-sm hover:from-dusty-rose/30 hover:to-rose/30 transition-all flex items-center justify-center space-x-2 touch-feedback touch-manipulation"
                        >
                          <BookOpen className="w-4 h-4" />
                          <span>Open Journal</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Section - Only show if no thrivings */}
            <PrivacySection visible={thrivings.length === 0} />

            {/* Prompt Templates */}
            <div className={`content-padding py-8 space-y-3 bg-gradient-to-br from-sage-light/10 to-sage/10 backdrop-blur-sm ${
              thrivings.length === 0 ? 'rounded-b-3xl' : 'rounded-3xl'
            }`}>
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
                      className="relative flex items-center space-x-4 p-5 rounded-3xl bg-white/90 backdrop-blur-sm hover:bg-white native-transition text-left group card-soft-glow hover:scale-[1.01] overflow-hidden touch-feedback touch-manipulation"
                    >
                      
                      <div className="flex items-center space-x-4 w-full">
                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${template.iconGradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-gray-800 text-[15px] font-medium flex-1">
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
        <div className="chat-input-area safe-bottom">
          <ChatEditor
            value={input}
            onChange={setInput}
            onSubmit={handleSendMessage}
          />
        </div>
      </div>
      )}
    </>
  );
}