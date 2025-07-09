'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  Clock, 
  Bell, Edit2, Trash2,
  Plus, Target, Settings,
  ChevronDown, ChevronUp, ChevronRight, Lightbulb, Package, Play, CheckCircle2, BookOpen, Heart
} from 'lucide-react';
import { Thriving } from '@/src/types/thriving';
import { getThrivingsFromStorage, updateThrivingInStorage, deleteThrivingFromStorage } from '@/src/utils/thrivingStorage';
import { CelebrationShower } from '@/components/ui/CelebrationShower';
import { PageLayout } from '@/components/layout/PageLayout';
import { AdjustmentTutorial } from '@/components/features/AdjustmentTutorial';

export default function ThrivingsPage() {
  const [thrivings, setThrivings] = useState<Thriving[]>([]);
  const [selectedThriving, setSelectedThriving] = useState<Thriving | null>(null);
  const [expandedTips, setExpandedTips] = useState<Set<number>>(new Set());
  const [isRecommendationsCollapsed, setIsRecommendationsCollapsed] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [showAdjustmentEditor, setShowAdjustmentEditor] = useState(false);
  const [adjustmentText, setAdjustmentText] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [highlightedStep, setHighlightedStep] = useState<number | null>(null);
  const [showAdjustmentTutorial, setShowAdjustmentTutorial] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const adjustButtonRef = useRef<HTMLButtonElement | null>(null);
  const hasShownTutorialInSession = useRef(false);

  useEffect(() => {
    // Load thrivings from localStorage
    const savedThrivings = getThrivingsFromStorage();
    setThrivings(savedThrivings);
    
    // Check if there's a specific thriving to show from query params
    const urlParams = new URLSearchParams(window.location.search);
    const thrivingId = urlParams.get('id');
    const stepIndex = urlParams.get('step');
    
    // Only scroll to top when navigating from external pages (not from home page cards)
    // Check if we came from home page with specific step
    const fromHome = sessionStorage.getItem('navigateFromHome');
    if (!stepIndex && !fromHome) {
      window.scrollTo(0, 0);
    }
    // Clear the flag after checking
    sessionStorage.removeItem('navigateFromHome');
    
    if (thrivingId && savedThrivings.length > 0) {
      const thriving = savedThrivings.find(t => t.id === thrivingId);
      if (thriving) {
        setSelectedThriving(thriving);
        // Set active step if provided
        if (stepIndex !== null) {
          setActiveStep(parseInt(stepIndex));
        }
      } else {
        setSelectedThriving(savedThrivings[0]);
      }
    } else if (savedThrivings.length > 0) {
      setSelectedThriving(savedThrivings[0]);
    }
    
    // Load recommendations collapsed state from localStorage
    const savedCollapsedState = localStorage.getItem('recommendationsCollapsed');
    if (savedCollapsedState !== null) {
      setIsRecommendationsCollapsed(savedCollapsedState === 'true');
    }
  }, []);

  // Show adjustment tutorial when appropriate
  useEffect(() => {
    if (selectedThriving && !showAdjustmentTutorial && !hasShownTutorialInSession.current) {
      const tutorialCount = parseInt(localStorage.getItem('adjustmentTutorialCount') || '0');
      
      // Show tutorial if:
      // 1. User has created a thriving (selectedThriving exists)
      // 2. Tutorial has been shown less than 2 times
      // 3. Not already shown in this session
      if (tutorialCount < 2) {
        // Show tutorial after a delay
        const timer = setTimeout(() => {
          setShowAdjustmentTutorial(true);
          hasShownTutorialInSession.current = true;
        }, 3000); // 3 second delay to let the page load
        
        return () => clearTimeout(timer);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedThriving]); // Intentionally exclude showAdjustmentTutorial to prevent re-runs

  const toggleTips = (stepOrder: number) => {
    setExpandedTips(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepOrder)) {
        newSet.delete(stepOrder);
      } else {
        newSet.add(stepOrder);
      }
      return newSet;
    });
  };

  const toggleRecommendations = () => {
    const newState = !isRecommendationsCollapsed;
    setIsRecommendationsCollapsed(newState);
    localStorage.setItem('recommendationsCollapsed', newState.toString());
  };

  const handleThrivingToggle = (thrivingId: string) => {
    const thriving = thrivings.find(r => r.id === thrivingId);
    if (thriving) {
      const updatedThriving = { ...thriving, isActive: !thriving.isActive };
      updateThrivingInStorage(thrivingId, { isActive: !thriving.isActive });
      setThrivings(prev => prev.map(r => 
        r.id === thrivingId ? updatedThriving : r
      ));
    }
  };

  const handleDeleteThriving = (thrivingId: string) => {
    if (confirm('Are you sure you want to delete this thriving?')) {
      deleteThrivingFromStorage(thrivingId);
      const remainingThrivings = thrivings.filter(r => r.id !== thrivingId);
      setThrivings(remainingThrivings);
      
      if (selectedThriving?.id === thrivingId) {
        setSelectedThriving(remainingThrivings[0] || null);
      }
    }
  };

  const handleCompleteThriving = (thrivingId: string) => {
    const thriving = thrivings.find(r => r.id === thrivingId);
    if (thriving) {
      // Show celebration animation
      setShowCelebration(true);
      
      // After celebration, remove the thriving
      setTimeout(() => {
        deleteThrivingFromStorage(thrivingId);
        const remainingThrivings = thrivings.filter(r => r.id !== thrivingId);
        setThrivings(remainingThrivings);
        
        // Select next thriving if available
        if (selectedThriving?.id === thrivingId) {
          setSelectedThriving(remainingThrivings[0] || null);
        }
      }, 3500); // Wait for celebration to finish
    }
  };

  const handleAdjustThriving = async () => {
    if (!selectedThriving || !adjustmentText.trim()) return;
    
    setIsAdjusting(true);
    try {
      const response = await fetch('/api/thriving/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentThriving: selectedThriving,
          userFeedback: adjustmentText,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to adjust thriving');
      
      const adjustedThriving = await response.json();
      
      // Update the thriving in storage
      updateThrivingInStorage(adjustedThriving.id, adjustedThriving);
      
      // Update local state
      setThrivings(prev => prev.map(r => 
        r.id === adjustedThriving.id ? adjustedThriving : r
      ));
      setSelectedThriving(adjustedThriving);
      
      // Reset editor
      setShowAdjustmentEditor(false);
      setAdjustmentText('');
    } catch (error) {
      console.error('Error adjusting thriving:', error);
      alert('Failed to adjust thriving. Please try again.');
    } finally {
      setIsAdjusting(false);
    }
  };

  // Format time to ensure proper AM/PM display
  const formatReminderTime = (time: string | undefined | null) => {
    if (!time) return '';
    
    // Convert to string in case it's not
    const timeStr = String(time);
    
    // If time already includes AM/PM, return as is
    if (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm')) {
      return timeStr;
    }
    
    // Parse time and add AM/PM
    const timeParts = timeStr.split(':');
    if (timeParts.length !== 2) return timeStr; // Return as is if not in HH:MM format
    
    const hours = Number(timeParts[0]);
    const minutes = Number(timeParts[1]);
    
    if (isNaN(hours) || isNaN(minutes)) return timeStr; // Return as is if not valid numbers
    
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Touch handling for swipe gestures
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe || isRightSwipe) {
      const currentIndex = thrivings.findIndex(r => r.id === selectedThriving?.id);
      let nextIndex = currentIndex;
      
      if (isLeftSwipe && currentIndex < thrivings.length - 1) {
        nextIndex = currentIndex + 1;
      } else if (isRightSwipe && currentIndex > 0) {
        nextIndex = currentIndex - 1;
      }
      
      if (nextIndex !== currentIndex) {
        setSelectedThriving(thrivings[nextIndex]);
        if (scrollContainerRef.current) {
          const cardWidth = 320 + 16;
          scrollContainerRef.current.scrollTo({
            left: nextIndex * cardWidth,
            behavior: 'smooth'
          });
        }
      }
    }
  };

  // Get the next upcoming step based on current time
  const getNextUpcomingStep = (thriving: Thriving) => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes

    // Find steps with reminder times
    const stepsWithTimes = thriving.steps
      .filter((step) => step.time)
      .map((step) => {
        const [hours, minutes] = step.time!.split(':').map(Number);
        const stepTime = hours * 60 + minutes;
        return { ...step, stepTime };
      })
      .sort((a, b) => a.stepTime - b.stepTime);

    // Find next upcoming step
    const nextStep = stepsWithTimes.find((step) => step.stepTime > currentTime);

    // If no steps later today, return first step tomorrow
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

  // Calculate progress percentage
  const calculateProgress = (thriving: Thriving) => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const stepsWithTimes = thriving.steps.filter(step => step.time);
    const completedSteps = stepsWithTimes.filter(step => {
      if (!step.time) return false;
      const [hours, minutes] = step.time.split(':').map(Number);
      const stepTime = hours * 60 + minutes;
      return stepTime <= currentTime;
    }).length;
    
    return stepsWithTimes.length > 0 ? (completedSteps / stepsWithTimes.length) * 100 : 0;
  };

  // Scroll to active step only when coming from external navigation
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const stepParam = urlParams.get('step');
    
    // Only scroll if we have a step parameter from URL (from home page navigation)
    if (stepParam !== null && selectedThriving && stepRefs.current[activeStep] && activeStep >= 0) {
      setTimeout(() => {
        stepRefs.current[activeStep]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
        
        // Highlight the step temporarily
        setHighlightedStep(activeStep);
        
        // Remove highlight after 3 seconds
        setTimeout(() => {
          setHighlightedStep(null);
        }, 3000);
        
        // Clear the URL parameter after scrolling
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('step');
        window.history.replaceState({}, '', newUrl.toString());
      }, 100);
    }
  }, [activeStep, selectedThriving]);


  return (
    <PageLayout
      header={{
        showBackButton: true,
        backHref: '/',
        centerElement: (
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-gray-800">Thrivings</h1>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sage-light/30 to-sage/20 flex items-center justify-center">
              <Heart className="w-4 h-4 text-sage-dark fill-sage-light/30" />
            </div>
          </div>
        )
      }}
    >

        <div className="max-w-7xl mx-auto p-4 lg:p-8">

          {/* Empty State */}
          {thrivings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sage-light/30 to-sage/20 flex items-center justify-center mb-4">
                <Plus className="w-10 h-10 text-sage-dark" />
              </div>
              <h2 className="text-xl font-semibold text-primary-text mb-2">No Thrivings Yet</h2>
              <p className="text-secondary-text-thin text-center max-w-xs mb-6">
                Create personalized wellness thrivings to support your healing journey
              </p>
              <Link
                href="/chat/new"
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-sage to-sage-dark text-white font-medium shadow-lg hover:shadow-xl transition-all"
              >
                Create Your First Thriving
              </Link>
            </div>
          ) : (
            <>
              {/* Thriving Cards - Horizontal Scroll */}
              <div className="relative mb-8">
                {/* Scroll Indicators - Dots at bottom */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
                  {[...thrivings, { id: 'add-new' }].map((item, index) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (scrollContainerRef.current) {
                          const container = scrollContainerRef.current;
                          const cardWidth = container.offsetWidth - 32; // viewport width - padding
                          scrollContainerRef.current.scrollTo({
                            left: index * (cardWidth + 16), // 16px gap
                            behavior: 'smooth'
                          });
                        }
                      }}
                      className={`w-2 h-2 rounded-full transition-all ${
                        item.id !== 'add-new' && selectedThriving?.id === item.id
                          ? 'bg-rose w-6' 
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>

                <div 
                  ref={scrollContainerRef}
                  className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide snap-x snap-mandatory -mx-4 px-4"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                  onScroll={(e) => {
                    const container = e.currentTarget;
                    const cardWidth = 320 + 16; // card width + gap
                    const scrollPosition = container.scrollLeft;
                    const index = Math.round(scrollPosition / cardWidth);
                    if (thrivings[index]) {
                      setSelectedThriving(thrivings[index]);
                    }
                  }}
                >
                  {thrivings.map((thriving) => (
                    <div
                      key={thriving.id}
                      onClick={() => setSelectedThriving(thriving)}
                      className={`flex-shrink-0 w-[calc(100vw-2rem)] max-w-sm rounded-2xl p-6 cursor-pointer transition-all snap-center ${
                        selectedThriving?.id === thriving.id 
                          ? 'bg-white shadow-xl border-2 border-rose/20' 
                          : 'bg-white hover:shadow-lg border border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {thriving.title}
                          </h3>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleThrivingToggle(thriving.id);
                          }}
                          className={`px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium transition-all ${
                            thriving.isActive 
                              ? 'bg-rose/10 text-rose hover:bg-rose/20' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <Bell className="w-4 h-4" />
                          {thriving.isActive ? 'Pause' : 'Resume'}
                        </button>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between mb-1.5 text-xs">
                          <span className="text-gray-600">Today&apos;s Progress</span>
                          <span className="font-medium text-burgundy">
                            {getRemainingStepsToday(thriving)} more steps
                          </span>
                        </div>
                        <div className="bg-gray-100 rounded-full overflow-hidden h-2">
                          <div 
                            className="h-full bg-gradient-to-r from-sage to-sage-dark transition-all duration-500"
                            style={{ width: `${calculateProgress(thriving)}%` }}
                          />
                        </div>
                      </div>

                      {/* What's Next */}
                      {(() => {
                        const nextStep = getNextUpcomingStep(thriving);
                        const remainingToday = getRemainingStepsToday(thriving);
                        
                        return nextStep ? (
                          <div 
                            className="rounded-xl bg-gradient-to-r from-sage-light/20 to-sage/10 border border-sage-light/30 p-3 mb-3 cursor-pointer hover:from-sage-light/30 hover:to-sage/20 transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedThriving(thriving);
                              // Find the index of this step in the steps array
                              const stepIndex = thriving.steps.findIndex(s => s.id === nextStep.id);
                              setActiveStep(stepIndex);
                              
                              // Manually scroll to the step
                              setTimeout(() => {
                                if (stepRefs.current[stepIndex]) {
                                  stepRefs.current[stepIndex]?.scrollIntoView({
                                    behavior: 'smooth',
                                    block: 'center',
                                  });
                                  
                                  // Highlight the step temporarily
                                  setHighlightedStep(stepIndex);
                                  
                                  // Remove highlight after 3 seconds
                                  setTimeout(() => {
                                    setHighlightedStep(null);
                                  }, 3000);
                                }
                              }, 100);
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
                          <div className="text-xs text-gray-500 italic">
                            No scheduled reminders
                          </div>
                        );
                      })()}
                      
                      {/* Journal Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `/thrivings/${thriving.id}/journal`;
                        }}
                        className="w-full mt-3 py-3 rounded-2xl bg-gradient-to-r from-dusty-rose/15 to-rose/15 border border-dusty-rose/20 text-dusty-rose font-medium text-sm hover:from-dusty-rose/25 hover:to-rose/25 hover:border-dusty-rose/30 hover:shadow-md transition-all flex items-center justify-center space-x-2 touch-feedback touch-manipulation group relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-dusty-rose/0 via-dusty-rose/10 to-dusty-rose/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <BookOpen className="w-4 h-4 relative z-10" />
                        <span className="relative z-10">Open Journal</span>
                      </button>
                    </div>
                  ))}

                  {/* Add New Thriving Card */}
                  <button
                    onClick={() => {
                      sessionStorage.setItem('initialMessage', 'Create a wellness thriving for me');
                      window.location.href = '/chat/new?intent=create_thriving';
                    }}
                    className="flex-shrink-0 w-[calc(100vw-2rem)] max-w-sm rounded-2xl border-2 border-dashed border-gray-300 p-6 flex flex-col items-center justify-center cursor-pointer hover:border-rose/50 hover:bg-gray-50 transition-all snap-center"
                  >
                    <Plus className="w-12 h-12 text-gray-400 mb-3" />
                    <p className="text-gray-900 font-medium">Create New Thriving</p>
                    <p className="text-sm text-gray-600 text-center mt-1">
                      Add a personalized thriving to your wellness journey
                    </p>
                  </button>
                </div>
              </div>
              
              {/* Swipe Indicator - Below Cards */}
              {thrivings.length > 1 && (
                <div className="flex items-center justify-center text-xs text-gray-400 mb-6 animate-pulse">
                  <span>swipe to see more</span>
                  <ChevronRight className="w-3 h-3 ml-0.5" />
                </div>
              )}

              {/* Selected Thriving Details */}
              {selectedThriving && (
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Steps Section */}
                    <div className="lg:col-span-2 space-y-4">
                    {/* Daily Reminders Section */}
                    <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900">Daily Reminders</h2>
                          <p className="text-sm text-gray-600 mt-1">Gentle reminders for your wellness journey</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              // Scroll to adjust button and click it
                              if (adjustButtonRef.current) {
                                adjustButtonRef.current.scrollIntoView({ 
                                  behavior: 'smooth', 
                                  block: 'center' 
                                });
                                
                                // Add visual indication
                                adjustButtonRef.current.classList.add('animate-pulse');
                                
                                // Click after 2 seconds
                                setTimeout(() => {
                                  if (adjustButtonRef.current) {
                                    adjustButtonRef.current.classList.remove('animate-pulse');
                                    adjustButtonRef.current.click();
                                  }
                                }, 2000);
                              }
                            }}
                            className="p-2 rounded-lg hover:bg-gray-50 transition-all touch-feedback touch-manipulation"
                          >
                            <Edit2 className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleDeleteThriving(selectedThriving.id)}
                            className="p-2 rounded-lg hover:bg-gray-50 transition-all touch-feedback touch-manipulation"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </div>

                      {/* 
                        Alternative Design Options:
                        
                        1. Current Design: Card with header section
                        2. Minimal Timeline: Vertical timeline with dots
                        3. Compact Cards: Simple cards with inline time
                      */}
                      
                      <div className="space-y-4">
                        {selectedThriving.steps.map((step, index) => (
                          <div 
                            key={index + 1} 
                            ref={el => {stepRefs.current[index] = el;}}
                            className="group">
                            <div className={`rounded-2xl bg-white shadow-sm hover:shadow-md transition-all duration-500 overflow-hidden ${
                              highlightedStep === index 
                                ? 'ring-2 ring-offset-2 ring-rose/50 border-2 border-transparent bg-gradient-to-r from-rose/5 to-burgundy/5 shadow-lg shadow-rose/20' 
                                : 'border border-gray-100 hover:border-gray-200'
                            }`}>
                              {/* Header with time and title */}
                              <div className="px-6 py-4 border-b border-gray-100">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="flex items-center text-sage-dark">
                                    <Bell className="w-4 h-4 mr-1.5" />
                                    <span className="text-sm font-medium">
                                      {step.time ? formatReminderTime(step.time) : `Step ${index + 1}`}
                                    </span>
                                  </div>
                                  <span className="text-gray-300">•</span>
                                  <span className="text-sm text-gray-500 flex items-center">
                                    <Clock className="w-4 h-4 mr-1.5" />
                                    {step.duration} min
                                  </span>
                                </div>
                                <h4 className="font-semibold text-gray-900 text-lg">
                                  {step.title}
                                </h4>
                              </div>

                              {/* Content */}
                              <div className="px-6 py-4">
                                <p className="text-gray-600 leading-relaxed">
                                  {step.description}
                                </p>
                                
                                {/* Action buttons area - only show if there are buttons to display */}
                                {((step.tips && step.tips.length > 0) || step.videoUrl || step.will_video_tutorial_help) && (
                                  <div className="mt-4 flex items-center justify-between">
                                    {/* Pro Tips button */}
                                    {step.tips && step.tips.length > 0 ? (
                                      <button
                                        onClick={() => toggleTips(index + 1)}
                                        className="flex items-center text-sm text-sage-dark hover:text-sage transition-colors"
                                      >
                                        <Lightbulb className="w-4 h-4 mr-1.5" />
                                        Pro Tips
                                        {expandedTips.has(index + 1) ? (
                                          <ChevronUp className="w-4 h-4 ml-1" />
                                        ) : (
                                          <ChevronDown className="w-4 h-4 ml-1" />
                                        )}
                                      </button>
                                    ) : (
                                      <div /> // Empty div to maintain flex layout
                                    )}
                                    
                                    {/* Tutorial button - aligned to the right */}
                                    {(step.videoUrl || step.will_video_tutorial_help) && (
                                      <button
                                        onClick={() => {
                                          if (step.videoUrl && step.videoUrl.includes('youtube.com') || step.videoUrl?.includes('youtu.be')) {
                                            window.open(step.videoUrl, '_blank');
                                          } else {
                                            window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(step.title + ' tutorial')}`, '_blank');
                                          }
                                        }}
                                        className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-gradient-to-r from-rose/10 to-dusty-rose/10 text-burgundy hover:from-rose/20 hover:to-dusty-rose/20 transition-all border border-rose/20 shadow-sm hover:shadow-md"
                                      >
                                        <Play className="w-3 h-3 mr-1.5 fill-current" />
                                        Tutorial
                                      </button>
                                    )}
                                  </div>
                                )}
                                
                                {/* Pro Tips Content - Collapsible */}
                                {step.tips && step.tips.length > 0 && expandedTips.has(index + 1) && (
                                  <div className="mt-3 p-4 rounded-lg bg-sage-light/10 border border-sage-light/30">
                                    <ul className="space-y-2">
                                      {step.tips.map((tip, idx) => (
                                        <li key={idx} className="text-sm text-gray-600 flex items-start">
                                          <span className="w-1.5 h-1.5 rounded-full bg-sage mt-1.5 mr-2 flex-shrink-0" />
                                          {tip}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Additional Recommendations Section */}
                    {selectedThriving.additionalRecommendations && selectedThriving.additionalRecommendations.length > 0 && (
                      <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center">
                            <Package className="w-5 h-5 mr-2 text-rose" />
                            <h2 className="text-xl font-semibold text-gray-900">Additional Recommendations</h2>
                          </div>
                          <button
                            onClick={toggleRecommendations}
                            className="p-2 rounded-lg hover:bg-gray-50 transition-all touch-feedback touch-manipulation"
                          >
                            {isRecommendationsCollapsed ? (
                              <ChevronDown className="w-5 h-5 text-gray-600" />
                            ) : (
                              <ChevronUp className="w-5 h-5 text-gray-600" />
                            )}
                          </button>
                        </div>
                        
                        {isRecommendationsCollapsed ? (
                          <div className="flex flex-wrap gap-2">
                            {selectedThriving.additionalRecommendations.map((rec, index) => {
                              const title = typeof rec === 'string' ? rec : rec.title;
                              return (
                                <span
                                  key={index}
                                  className="inline-flex items-center text-sm text-gray-600"
                                >
                                  <span className="font-medium">{title}</span>
                                  {index < (selectedThriving.additionalRecommendations?.length ?? 0) - 1 && (
                                    <span className="mx-2 text-gray-400">•</span>
                                  )}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {selectedThriving.additionalRecommendations.map((rec, index) => {
                              const isString = typeof rec === 'string';
                              const title = isString ? rec : rec.title;
                              const description = isString ? 'Consider adding this to your wellness routine for enhanced benefits.' : rec.description;
                              const tips = isString ? [] : (rec.tips || []);
                              const frequency = isString ? undefined : rec.frequency;
                              
                              // Icon mapping based on recommendation type
                              const getIcon = () => {
                                const titleLower = title.toLowerCase();
                                if (titleLower.includes('humidifier') || titleLower.includes('air')) return '💨';
                                if (titleLower.includes('exercise') || titleLower.includes('equipment')) return '🏋️';
                                if (titleLower.includes('filter') || titleLower.includes('clean')) return '🧹';
                                if (titleLower.includes('supplement') || titleLower.includes('vitamin')) return '💊';
                                if (titleLower.includes('sleep') || titleLower.includes('bed')) return '🛏️';
                                if (titleLower.includes('water') || titleLower.includes('hydrat')) return '💧';
                                return '📦';
                              };

                              return (
                                <div
                                  key={index}
                                  className="group relative rounded-2xl bg-white border border-gray-100 hover:border-rose/30 hover:shadow-lg transition-all overflow-hidden"
                                >
                                  <div className="p-5">
                                    {/* Header with Icon and Title */}
                                    <div className="flex items-start gap-4">
                                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose/10 to-burgundy/10 flex items-center justify-center flex-shrink-0 text-2xl shadow-sm">
                                        {getIcon()}
                                      </div>
                                      <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900 text-lg">{title}</h4>
                                        {frequency && (
                                          <span className="inline-block mt-1 text-xs font-medium text-sage-dark bg-sage-light/20 px-2 py-1 rounded-full">
                                            {frequency.replace('_', ' ')}
                                          </span>
                                        )}
                                        {description && (
                                          <p className="text-sm text-gray-600 mt-2">
                                            {description}
                                          </p>
                                        )}
                                        {tips.length > 0 && (
                                          <div className="mt-3">
                                            <p className="text-xs font-medium text-gray-700 mb-2">Tips:</p>
                                            <ul className="space-y-1">
                                              {tips.map((tip, tipIndex) => (
                                                <li key={tipIndex} className="text-sm text-gray-600 flex items-start">
                                                  <span className="text-rose mr-2">•</span>
                                                  <span>{tip}</span>
                                                </li>
                                              ))}
                                            </ul>
                                          </div>
                                        )}
                                        {!isString && (rec.videoSearchQuery || rec.will_video_tutorial_help) && (
                                          <div className="mt-4">
                                            <button
                                              onClick={() => {
                                                const searchQuery = rec.videoSearchQuery || title + ' tutorial';
                                                window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`, '_blank');
                                              }}
                                              className="inline-flex items-center rounded-full px-4 py-2 text-sm font-medium bg-gradient-to-r from-rose/10 to-dusty-rose/10 text-burgundy hover:from-rose/20 hover:to-dusty-rose/20 transition-all border border-rose/20 shadow-sm hover:shadow-md"
                                            >
                                              <Play className="w-3.5 h-3.5 mr-2 fill-current" />
                                              Tutorial
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                  </div>

                  {/* Info Section */}
                  <div className="space-y-4">
                    {/* Complete and Delete Buttons */}
                    <div className="rounded-2xl bg-gradient-to-br from-burgundy/10 to-burgundy/5 backdrop-blur-sm p-4 border border-burgundy/10">
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleCompleteThriving(selectedThriving.id)}
                          className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sage to-sage-dark text-white font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-sm touch-feedback touch-manipulation"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Complete</span>
                        </button>
                        
                        <button
                          onClick={() => handleDeleteThriving(selectedThriving.id)}
                          className="flex-1 px-4 py-2.5 rounded-xl bg-white/80 backdrop-blur-sm text-gray-700 font-medium border border-gray-200 hover:bg-white/90 transition-all flex items-center justify-center gap-2 text-sm touch-feedback touch-manipulation"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                    
                    {/* Thriving Adjustment */}
                    <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Settings className="w-5 h-5 mr-2 text-rose" />
                        Adjust Thriving
                      </h3>
                      
                      {!showAdjustmentEditor ? (
                        <div>
                          <p className="text-sm text-gray-600 mb-4">
                            Need to adjust this thriving to better fit your schedule or preferences?
                          </p>
                          <button
                            ref={adjustButtonRef}
                            onClick={() => setShowAdjustmentEditor(true)}
                            className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-rose/10 to-dusty-rose/10 text-burgundy text-sm font-medium hover:from-rose/20 hover:to-dusty-rose/20 transition-all"
                          >
                            Adjust Thriving
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <textarea
                            value={adjustmentText}
                            onChange={(e) => setAdjustmentText(e.target.value)}
                            placeholder="Describe how you'd like to adjust this thriving. For example: 'My work hours are 9 AM to 6 PM, so please adjust the thriving timing accordingly...'"
                            className="w-full p-4 rounded-xl border border-gray-200 focus:border-rose/50 focus:ring-2 focus:ring-rose/20 text-sm resize-none"
                            rows={4}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleAdjustThriving}
                              disabled={!adjustmentText.trim() || isAdjusting}
                              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose to-burgundy text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                              {isAdjusting ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  Adjusting...
                                </>
                              ) : (
                                'Apply Adjustments'
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setShowAdjustmentEditor(false);
                                setAdjustmentText('');
                              }}
                              disabled={isAdjusting}
                              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Thriving Description & Expected Outcomes */}
                    <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Target className="w-5 h-5 mr-2 text-rose" />
                        About This Thriving
                      </h3>
                      
                      {/* Description */}
                      <p className="text-gray-600 leading-relaxed">
                        {selectedThriving.description}
                      </p>
                    </div>
                    
                    {/* Pro Tips */}
                    {selectedThriving.proTips && selectedThriving.proTips.length > 0 && (
                      <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                          Pro Tips
                        </h3>
                        
                        <ul className="space-y-2">
                          {selectedThriving.proTips.map((tip, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-rose mr-2">•</span>
                              <span className="text-sm text-gray-600">{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Reminder Schedule */}
                    {selectedThriving.reminderTimes && selectedThriving.reminderTimes.length > 0 && (
                      <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <Bell className="w-5 h-5 mr-2 text-blue-500" />
                          Reminder Schedule
                        </h3>
                        
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600 mb-3">
                            Daily reminders are set for the following times:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {selectedThriving.reminderTimes.map((time, index) => (
                              <span 
                                key={index}
                                className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-medium"
                              >
                                <Clock className="w-3.5 h-3.5 mr-1.5" />
                                {formatReminderTime(time)}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      
      {/* Celebration Animation */}
      {showCelebration && (
        <CelebrationShower 
          onComplete={() => setShowCelebration(false)}
          duration={3000}
        />
      )}
      
      {/* Adjustment Tutorial */}
      {showAdjustmentTutorial && (
        <AdjustmentTutorial
          onClose={() => {
            setShowAdjustmentTutorial(false);
            const currentCount = parseInt(localStorage.getItem('adjustmentTutorialCount') || '0');
            localStorage.setItem('adjustmentTutorialCount', String(currentCount + 1));
          }}
          onArrowClick={() => {
            // Scroll to the adjust button and click it after 2 seconds
            if (adjustButtonRef.current) {
              // Scroll the button into view
              adjustButtonRef.current.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
              });
              
              // Add a visual indication that the button will be clicked
              adjustButtonRef.current.classList.add('animate-pulse');
              
              // Click the button after 2 seconds
              setTimeout(() => {
                if (adjustButtonRef.current) {
                  adjustButtonRef.current.classList.remove('animate-pulse');
                  adjustButtonRef.current.click();
                }
              }, 2000);
            }
          }}
        />
      )}
    </PageLayout>
  );
}