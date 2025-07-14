'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Sparkles, Weight, Pill, Brain, Activity, Heart, Moon, Leaf, ChevronRight, BookOpen, MessageCircle } from 'lucide-react';
import { Thriving } from '@/src/types/thriving';
import { TouchLink } from '@/components/ui/TouchLink';
import { MenuButton, CardButton, SoftButton } from '@/components/ui/Button';
import { getThrivingsFromStorage, migrateRoutinesToThrivings } from '@/src/utils/thrivingStorage';
import { getChatHistory } from '@/src/utils/chatStorage';
import { ChatHistoryItem } from '@/src/types/chat';
import { GetStarted } from '@/components/features/GetStarted';
import { ChatEditor } from '@/components/ui/ChatEditor';
import { PrivacySection } from '@/components/features/PrivacySection';
import { NotificationPermissionBanner } from '@/components/features/NotificationPermissionBanner';
import { HealthConnectModal } from '@/components/features/HealthConnectModal';
import { AppLayout } from '@/components/layout/AppLayout';
// import { PrivacySection2 } from '@/components/features/PrivacySection2';
// import { PrivacySection3 } from '@/components/features/PrivacySection3';

const promptTemplates = [
  {
    icon: Weight,
    text: "I want to lose weight sustainably",
    iconGradient: "from-rose/90 to-burgundy"
  },
  {
    icon: Pill,
    text: "I want to manage my medications better",
    iconGradient: "from-sage/90 to-sage-dark"
  },
  {
    icon: Brain,
    text: "I want to feel calmer and less anxious",
    iconGradient: "from-[#E08B5D] to-[#D4696F]"
  },
  {
    icon: Activity,
    text: "I want to reduce my chronic pain",
    iconGradient: "from-dusty-rose/90 to-dark-burgundy"
  },
  {
    icon: Moon,
    text: "I want to sleep better at night",
    iconGradient: "from-slate-400 to-blue-500"
  },
  {
    icon: Heart,
    text: "I want to improve my overall wellness",
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
  const [showHealthConnectModal, setShowHealthConnectModal] = useState(false);
  const [latestChat, setLatestChat] = useState<ChatHistoryItem | null>(null);

  useEffect(() => {
    // Initialize showGetStarted after mount to prevent hydration mismatch
    const hasSeenGetStarted = localStorage.getItem('hasSeenGetStarted');
    setShowGetStarted(!hasSeenGetStarted);
    
    // Get latest chat
    const chatHistory = getChatHistory();
    if (chatHistory.length > 0) {
      setLatestChat(chatHistory[0]);
    }
    
    // Check if should show menu sparkle
    const hasUsedChat = localStorage.getItem('hasUsedChat');
    const hasClickedMenu = localStorage.getItem('hasClickedMenu');
    if (hasUsedChat && !hasClickedMenu) {
      setShowMenuSparkle(true);
    }
    
    // Check if should show health connect modal
    checkHealthConnectModal();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const checkHealthConnectModal = () => {
    // Only show if we're in the React Native app
    if (!window.ReactNativeBridge) return;
    
    // Check if user has created a thriving
    const hasCreatedThriving = localStorage.getItem('hasCreatedThriving');
    const hasSeenHealthConnect = localStorage.getItem('hasSeenHealthConnect');
    
    if (hasCreatedThriving && !hasSeenHealthConnect && thrivings.length > 0) {
      // Show modal after a short delay to let the page load
      setTimeout(() => {
        setShowHealthConnectModal(true);
      }, 1500);
    }
  };

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
        <AppLayout
          customHeader={
            <div className="flex items-center justify-between content-padding h-14 bg-white border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose to-burgundy flex items-center justify-center">
                  <Leaf className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-burgundy to-rose bg-clip-text text-transparent">Thrive</h1>
              </div>
              <MenuButton
                onClick={() => {
                  localStorage.setItem('hasClickedMenu', 'true');
                  setShowMenuSparkle(false);
                  router.push('/settings');
                }}
                className="w-11 h-11"
              >
                <Menu className="w-5 h-5 text-burgundy" />
                {showMenuSparkle && (
                  <div className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-rose to-burgundy rounded-full" />
                    <Sparkles className="w-2.5 h-2.5 text-white relative z-10 animate-pulse" />
                  </div>
                )}
              </MenuButton>
            </div>
          }
          className="chat-simple-layout"
        >

          {/* Main Content */}
          <div className="chat-messages-content">
            {/* Thrivings Section - Only show if thrivings exist */}
            {thrivings.length > 0 && (
              <div className="content-padding py-6 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-primary-text">Your Thrivings</h2>
                  <TouchLink 
                    href="/thrivings"
                    variant="subtle"
                    className="flex items-center space-x-1 text-sm font-medium text-secondary-text hover:text-primary-text transition-colors"
                  >
                    <span>See all</span>
                    <ChevronRight className="w-4 h-4" />
                  </TouchLink>
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
                            {getRemainingStepsToday(thriving) === 0 
                              ? '✓ Done for today!' 
                              : `${getRemainingStepsToday(thriving)} more ${getRemainingStepsToday(thriving) === 1 ? 'step' : 'steps'}`
                            }
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
                        <SoftButton
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/thrivings/${thriving.id}/journal`);
                          }}
                          size="sm"
                          fullWidth
                          className="mt-3 text-dusty-rose relative overflow-hidden"
                          icon={<BookOpen className="w-4 h-4" />}
                          gradientOverlay
                        >
                          Open Journal
                        </SoftButton>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Section - Only show if no thrivings */}
            <PrivacySection visible={thrivings.length === 0} />

            {/* Continue with Previous Chat - Only show if there's a latest chat */}
            {latestChat && (
              <div className="content-padding py-6">
                <h3 className="text-[min(4.5vw,1.125rem)] font-semibold text-gray-700 mb-3">Pick up where you left off</h3>
                <button
                  onClick={() => router.push(`/chat/${latestChat.threadId}`)}
                  className="w-full p-[5vw] max-p-[1.5rem] rounded-[5vw] max-rounded-[1.25rem] bg-white shadow-md hover:shadow-lg active:scale-[0.98] transition-all border border-gray-100 text-left group touch-feedback touch-manipulation"
                >
                  <div className="flex items-start space-x-[4vw] max-space-x-4">
                    <div className="w-[12vw] h-[12vw] max-w-[3rem] max-h-[3rem] rounded-[3vw] max-rounded-[0.75rem] bg-gradient-to-br from-rose/20 to-burgundy/15 flex items-center justify-center flex-shrink-0 group-hover:from-rose/30 group-hover:to-burgundy/25 transition-colors">
                      <MessageCircle className="w-[6vw] h-[6vw] max-w-[1.5rem] max-h-[1.5rem] text-burgundy" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[min(4vw,1rem)] font-semibold text-gray-900 mb-[1vw] truncate">
                        {latestChat.title === 'New Conversation' && latestChat.lastMessage 
                          ? latestChat.lastMessage.length > 40 
                            ? latestChat.lastMessage.substring(0, 40) + '...'
                            : latestChat.lastMessage
                          : latestChat.title}
                      </h4>
                      <p className="text-[min(3.5vw,0.875rem)] text-gray-600 line-clamp-2">
                        {latestChat.lastMessage}
                      </p>
                      <div className="flex items-center justify-between mt-[2vw]">
                        <span className="text-[min(3vw,0.75rem)] text-gray-500">
                          {latestChat.messageCount} {latestChat.messageCount === 1 ? 'message' : 'messages'}
                        </span>
                        <span className="text-[min(3vw,0.75rem)] text-gray-500">
                          {(() => {
                            const updatedDate = new Date(latestChat.updatedAt);
                            const today = new Date();
                            const yesterday = new Date(today);
                            yesterday.setDate(yesterday.getDate() - 1);
                            
                            if (updatedDate.toDateString() === today.toDateString()) {
                              return 'Today';
                            } else if (updatedDate.toDateString() === yesterday.toDateString()) {
                              return 'Yesterday';
                            } else {
                              return updatedDate.toLocaleDateString();
                            }
                          })()}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-[5vw] h-[5vw] max-w-[1.25rem] max-h-[1.25rem] text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
                  </div>
                </button>
              </div>
            )}

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
                    <CardButton
                      key={index}
                      onClick={() => handlePromptClick(template.text)}
                      className="p-5"
                    >
                      <div className="flex items-center space-x-4 w-full">
                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${template.iconGradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-gray-800 text-[15px] font-medium flex-1">
                          {template.text}
                        </span>
                      </div>
                    </CardButton>
                  );
                })}
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
        </AppLayout>
      )}
      
      {/* Notification Permission Banner */}
      <NotificationPermissionBanner />
      
      {/* Health Connect Modal */}
      <HealthConnectModal
        isOpen={showHealthConnectModal}
        onClose={() => {
          setShowHealthConnectModal(false);
          localStorage.setItem('hasSeenHealthConnect', 'true');
        }}
        onConnect={() => {
          // Navigate to thrivings page to show health insights
          router.push('/thrivings#health-insights');
        }}
      />
    </>
  );
}