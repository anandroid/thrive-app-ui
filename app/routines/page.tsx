'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  Clock, AlertCircle, 
  Bell, Edit2, Trash2,
  Plus, Shield, Target, Settings, ArrowLeft,
  ChevronDown, ChevronUp, Lightbulb, Package, Play, CheckCircle2
} from 'lucide-react';
import { WellnessRoutine } from '@/src/services/openai/types';
import { getRoutinesFromStorage, updateRoutineInStorage, deleteRoutineFromStorage } from '@/src/utils/routineStorage';
import { CelebrationShower } from '@/components/ui/CelebrationShower';

export default function RoutinesPage() {
  const [routines, setRoutines] = useState<WellnessRoutine[]>([]);
  const [selectedRoutine, setSelectedRoutine] = useState<WellnessRoutine | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [expandedTips, setExpandedTips] = useState<Set<number>>(new Set());
  const [isRecommendationsCollapsed, setIsRecommendationsCollapsed] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [showAdjustmentEditor, setShowAdjustmentEditor] = useState(false);
  const [adjustmentText, setAdjustmentText] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // Load routines from localStorage
    const savedRoutines = getRoutinesFromStorage();
    setRoutines(savedRoutines);
    
    // Check if there's a specific routine to show from query params
    const urlParams = new URLSearchParams(window.location.search);
    const routineId = urlParams.get('id');
    const stepIndex = urlParams.get('step');
    
    if (routineId && savedRoutines.length > 0) {
      const routine = savedRoutines.find(r => r.id === routineId);
      if (routine) {
        setSelectedRoutine(routine);
        // Set active step if provided
        if (stepIndex !== null) {
          setActiveStep(parseInt(stepIndex));
        }
      } else {
        setSelectedRoutine(savedRoutines[0]);
      }
    } else if (savedRoutines.length > 0) {
      setSelectedRoutine(savedRoutines[0]);
    }
    
    // Load recommendations collapsed state from localStorage
    const savedCollapsedState = localStorage.getItem('recommendationsCollapsed');
    if (savedCollapsedState !== null) {
      setIsRecommendationsCollapsed(savedCollapsedState === 'true');
    }
  }, []);

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

  const handleRoutineToggle = (routineId: string) => {
    const routine = routines.find(r => r.id === routineId);
    if (routine) {
      const updatedRoutine = { ...routine, isActive: !routine.isActive };
      updateRoutineInStorage(updatedRoutine);
      setRoutines(prev => prev.map(r => 
        r.id === routineId ? updatedRoutine : r
      ));
    }
  };

  const handleDeleteRoutine = (routineId: string) => {
    if (confirm('Are you sure you want to delete this routine?')) {
      deleteRoutineFromStorage(routineId);
      const remainingRoutines = routines.filter(r => r.id !== routineId);
      setRoutines(remainingRoutines);
      
      if (selectedRoutine?.id === routineId) {
        setSelectedRoutine(remainingRoutines[0] || null);
      }
    }
  };

  const handleCompleteRoutine = (routineId: string) => {
    const routine = routines.find(r => r.id === routineId);
    if (routine) {
      // Show celebration animation
      setShowCelebration(true);
      
      // After celebration, remove the routine
      setTimeout(() => {
        deleteRoutineFromStorage(routineId);
        const remainingRoutines = routines.filter(r => r.id !== routineId);
        setRoutines(remainingRoutines);
        
        // Select next routine if available
        if (selectedRoutine?.id === routineId) {
          setSelectedRoutine(remainingRoutines[0] || null);
        }
      }, 3500); // Wait for celebration to finish
    }
  };

  const handleAdjustRoutine = async () => {
    if (!selectedRoutine || !adjustmentText.trim()) return;
    
    setIsAdjusting(true);
    try {
      const response = await fetch('/api/routine/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentRoutine: selectedRoutine,
          userFeedback: adjustmentText,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to adjust routine');
      
      const adjustedRoutine = await response.json();
      
      // Update the routine in storage
      updateRoutineInStorage(adjustedRoutine);
      
      // Update local state
      setRoutines(prev => prev.map(r => 
        r.id === adjustedRoutine.id ? adjustedRoutine : r
      ));
      setSelectedRoutine(adjustedRoutine);
      
      // Reset editor
      setShowAdjustmentEditor(false);
      setAdjustmentText('');
    } catch (error) {
      console.error('Error adjusting routine:', error);
      alert('Failed to adjust routine. Please try again.');
    } finally {
      setIsAdjusting(false);
    }
  };

  // Format time to ensure proper AM/PM display
  const formatReminderTime = (time: string) => {
    if (!time) return '';
    
    // If time already includes AM/PM, return as is
    if (time.toLowerCase().includes('am') || time.toLowerCase().includes('pm')) {
      return time;
    }
    
    // Parse time and add AM/PM
    const [hours, minutes] = time.split(':').map(Number);
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
      const currentIndex = routines.findIndex(r => r.id === selectedRoutine?.id);
      let nextIndex = currentIndex;
      
      if (isLeftSwipe && currentIndex < routines.length - 1) {
        nextIndex = currentIndex + 1;
      } else if (isRightSwipe && currentIndex > 0) {
        nextIndex = currentIndex - 1;
      }
      
      if (nextIndex !== currentIndex) {
        setSelectedRoutine(routines[nextIndex]);
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
  const getNextUpcomingStep = (routine: WellnessRoutine) => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes

    // Find steps with reminder times
    const stepsWithTimes = routine.steps
      .filter((step) => step.reminderTime)
      .map((step) => {
        const [hours, minutes] = step.reminderTime!.split(':').map(Number);
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

  // Calculate progress percentage
  const calculateProgress = (routine: WellnessRoutine) => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const stepsWithTimes = routine.steps.filter(step => step.reminderTime);
    const completedSteps = stepsWithTimes.filter(step => {
      const [hours, minutes] = step.reminderTime!.split(':').map(Number);
      const stepTime = hours * 60 + minutes;
      return stepTime <= currentTime;
    }).length;
    
    return stepsWithTimes.length > 0 ? (completedSteps / stepsWithTimes.length) * 100 : 0;
  };

  // Scroll to active step
  useEffect(() => {
    if (selectedRoutine && stepRefs.current[activeStep]) {
      setTimeout(() => {
        stepRefs.current[activeStep]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);
    }
  }, [activeStep, selectedRoutine]);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="p-2 rounded-lg hover:bg-gray-50 transition-all">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <h1 className="text-2xl font-bold gradient-text">Thrive</h1>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                Home
              </Link>
              <Link href="/routines" className="text-gray-900 font-medium">
                Routines
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-4 lg:p-8">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Wellness Routines</h1>
            <p className="text-gray-600">Track your progress and stay consistent with your healing journey</p>
          </div>

          {/* Empty State */}
          {routines.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sage-light/30 to-sage/20 flex items-center justify-center mb-4">
                <Plus className="w-10 h-10 text-sage-dark" />
              </div>
              <h2 className="text-xl font-semibold text-primary-text mb-2">No Routines Yet</h2>
              <p className="text-secondary-text-thin text-center max-w-xs mb-6">
                Create personalized wellness routines to support your healing journey
              </p>
              <Link
                href="/chat/new"
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-sage to-sage-dark text-white font-medium shadow-lg hover:shadow-xl transition-all"
              >
                Create Your First Routine
              </Link>
            </div>
          ) : (
            <>
              {/* Routine Cards - Horizontal Scroll */}
              <div className="relative mb-8">
                {/* Scroll Indicators - Dots at bottom */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
                  {[...routines, { id: 'add-new' }].map((item, index) => (
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
                        item.id !== 'add-new' && selectedRoutine?.id === item.id
                          ? 'bg-rose w-6' 
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>

                <div 
                  ref={scrollContainerRef}
                  className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide snap-x snap-mandatory"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                  onScroll={(e) => {
                    const container = e.currentTarget;
                    const cardWidth = 320 + 16; // card width + gap
                    const scrollPosition = container.scrollLeft;
                    const index = Math.round(scrollPosition / cardWidth);
                    if (routines[index]) {
                      setSelectedRoutine(routines[index]);
                    }
                  }}
                >
                  {routines.map((routine) => (
                    <div
                      key={routine.id}
                      onClick={() => setSelectedRoutine(routine)}
                      className={`flex-shrink-0 w-[calc(100vw-2rem)] max-w-sm rounded-2xl p-6 cursor-pointer transition-all snap-center ${
                        selectedRoutine?.id === routine.id 
                          ? 'bg-white shadow-xl border-2 border-rose/20' 
                          : 'bg-white hover:shadow-lg border border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {routine.name}
                          </h3>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRoutineToggle(routine.id);
                          }}
                          className={`px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium transition-all ${
                            routine.isActive 
                              ? 'bg-rose/10 text-rose hover:bg-rose/20' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <Bell className="w-4 h-4" />
                          {routine.isActive ? 'Pause' : 'Resume'}
                        </button>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between mb-1.5 text-xs">
                          <span className="text-gray-600">Today&apos;s Progress</span>
                          <span className="font-medium text-burgundy">
                            {getRemainingStepsToday(routine)} more steps
                          </span>
                        </div>
                        <div className="bg-gray-100 rounded-full overflow-hidden h-2">
                          <div 
                            className="h-full bg-gradient-to-r from-sage to-sage-dark transition-all duration-500"
                            style={{ width: `${calculateProgress(routine)}%` }}
                          />
                        </div>
                      </div>

                      {/* What's Next */}
                      {(() => {
                        const nextStep = getNextUpcomingStep(routine);
                        const remainingToday = getRemainingStepsToday(routine);
                        
                        return nextStep ? (
                          <div 
                            className="rounded-xl bg-gradient-to-r from-sage-light/20 to-sage/10 border border-sage-light/30 p-3 mb-3 cursor-pointer hover:from-sage-light/30 hover:to-sage/20 transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRoutine(routine);
                              setActiveStep(nextStep.order - 1);
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
                          <div className="text-xs text-gray-500 italic">
                            No scheduled reminders
                          </div>
                        );
                      })()}
                    </div>
                  ))}

                  {/* Add New Routine Card */}
                  <Link 
                    href="/chat/new" 
                    className="flex-shrink-0 w-[calc(100vw-2rem)] max-w-sm rounded-2xl border-2 border-dashed border-gray-300 p-6 flex flex-col items-center justify-center cursor-pointer hover:border-rose/50 hover:bg-gray-50 transition-all snap-center"
                  >
                    <Plus className="w-12 h-12 text-gray-400 mb-3" />
                    <p className="text-gray-900 font-medium">Create New Routine</p>
                    <p className="text-sm text-gray-600 text-center mt-1">
                      Add a personalized routine to your wellness journey
                    </p>
                  </Link>
                </div>
              </div>

              {/* Selected Routine Details */}
              {selectedRoutine && (
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
                            onClick={() => setIsEditing(!isEditing)}
                            className="p-2 rounded-lg hover:bg-gray-50 transition-all"
                          >
                            <Edit2 className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleDeleteRoutine(selectedRoutine.id)}
                            className="p-2 rounded-lg hover:bg-gray-50 transition-all"
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
                        {selectedRoutine.steps.map((step, index) => (
                          <div 
                            key={step.order} 
                            ref={el => {stepRefs.current[index] = el;}}
                            className="group">
                            <div className="rounded-2xl bg-white border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
                              {/* Header with time and title */}
                              <div className="px-6 py-4 border-b border-gray-100">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center text-sage-dark">
                                      <Bell className="w-4 h-4 mr-1.5" />
                                      <span className="text-sm font-medium">
                                        {step.reminderTime ? formatReminderTime(step.reminderTime) : `Step ${step.order}`}
                                      </span>
                                    </div>
                                    <span className="text-gray-300">•</span>
                                    <span className="text-sm text-gray-500 flex items-center">
                                      <Clock className="w-4 h-4 mr-1.5" />
                                      {step.duration} min
                                    </span>
                                  </div>
                                  {step.will_video_tutorial_help !== false && (
                                    <button
                                      onClick={() => {
                                        const searchQuery = step.videoSearchQuery || step.title;
                                        window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery + ' tutorial short')}`, '_blank');
                                      }}
                                      className="md:opacity-0 md:group-hover:opacity-100 transition-opacity inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-rose/10 to-dusty-rose/10 text-burgundy hover:from-rose/20 hover:to-dusty-rose/20"
                                    >
                                      <Play className="w-3.5 h-3.5 mr-1.5" />
                                      Watch Tutorial
                                    </button>
                                  )}
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
                                
                                {/* Pro Tips button in content area */}
                                {step.tips && step.tips.length > 0 && (
                                  <>
                                    <button
                                      onClick={() => toggleTips(step.order)}
                                      className="mt-4 flex items-center text-sm text-sage-dark hover:text-sage transition-colors"
                                    >
                                      <Lightbulb className="w-4 h-4 mr-1.5" />
                                      Pro Tips
                                      {expandedTips.has(step.order) ? (
                                        <ChevronUp className="w-4 h-4 ml-1" />
                                      ) : (
                                        <ChevronDown className="w-4 h-4 ml-1" />
                                      )}
                                    </button>
                                    
                                    {/* Pro Tips Content - Collapsible */}
                                    {expandedTips.has(step.order) && (
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
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Additional Recommendations Section */}
                    {selectedRoutine.additionalSteps && selectedRoutine.additionalSteps.length > 0 && (
                      <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center">
                            <Package className="w-5 h-5 mr-2 text-rose" />
                            <h2 className="text-xl font-semibold text-gray-900">Additional Recommendations</h2>
                          </div>
                          <button
                            onClick={toggleRecommendations}
                            className="p-2 rounded-lg hover:bg-gray-50 transition-all"
                          >
                            {isRecommendationsCollapsed ? (
                              <ChevronDown className="w-5 h-5 text-gray-600" />
                            ) : (
                              <ChevronUp className="w-5 h-5 text-gray-600" />
                            )}
                          </button>
                        </div>
                        
                        {isRecommendationsCollapsed ? (
                          <div className="space-y-3">
                            {selectedRoutine.additionalSteps.map((step) => (
                              <div key={step.id} className="border-l-4 border-rose/20 pl-4">
                                <h5 className="font-medium text-gray-900 text-sm mb-1">{step.title}</h5>
                                {step.description && (
                                  <p className="text-xs text-gray-600 mb-2">{step.description}</p>
                                )}
                                {step.tips && step.tips.length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    {step.tips.map((tip, idx) => (
                                      <span key={idx} className="text-xs text-gray-500 italic">
                                        • {tip}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {selectedRoutine.additionalSteps.map((step) => {
                              // Icon mapping based on recommendation type
                              const getIcon = () => {
                                const title = step.title.toLowerCase();
                                if (title.includes('humidifier') || title.includes('air')) return '💨';
                                if (title.includes('exercise') || title.includes('equipment')) return '🏋️';
                                if (title.includes('filter') || title.includes('clean')) return '🧹';
                                if (title.includes('supplement') || title.includes('vitamin')) return '💊';
                                if (title.includes('sleep') || title.includes('bed')) return '🛏️';
                                if (title.includes('water') || title.includes('hydrat')) return '💧';
                                return '📦';
                              };

                              return (
                                <div
                                  key={step.id}
                                  className="group relative rounded-2xl bg-white border border-gray-100 hover:border-rose/30 hover:shadow-lg transition-all overflow-hidden"
                                >
                                  <div className="p-5">
                                    {/* Header with Icon and Title */}
                                    <div className="flex items-start gap-4 mb-3">
                                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose/10 to-burgundy/10 flex items-center justify-center flex-shrink-0 text-2xl shadow-sm">
                                        {getIcon()}
                                      </div>
                                      <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900 text-lg mb-2">{step.title}</h4>
                                        <div className="flex items-center gap-2">
                                          <span className={`inline-flex items-center text-xs font-medium px-3 py-1.5 rounded-full ${
                                            step.frequency === 'one_time' ? 'bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-700' :
                                            step.frequency === 'weekly' ? 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-700' :
                                            step.frequency === 'monthly' ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-700' :
                                            'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700'
                                          }`}>
                                            {step.frequency === 'one_time' ? '✨ One-time' :
                                             step.frequency === 'weekly' ? '🔄 Weekly' :
                                             step.frequency === 'monthly' ? '📅 Monthly' :
                                             '📌 As needed'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Description */}
                                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                                      {step.description}
                                    </p>
                                    
                                    {/* Tips Section */}
                                    {step.tips && step.tips.length > 0 && (
                                      <div className="bg-gradient-to-r from-sage-light/20 to-sage/10 rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                          <div className="w-6 h-6 rounded-full bg-sage/20 flex items-center justify-center">
                                            <Lightbulb className="w-3.5 h-3.5 text-sage-dark" />
                                          </div>
                                          <p className="text-sm font-medium text-sage-dark">Tips:</p>
                                        </div>
                                        <ul className="space-y-1.5">
                                          {step.tips.map((tip, idx) => (
                                            <li key={idx} className="text-sm text-gray-700 flex items-start pl-8">
                                              <span className="text-sage mr-2">•</span>
                                              {tip}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Hover Action */}
                                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-white via-white/95 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                                    <button className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sage to-sage-dark text-white font-medium text-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2">
                                      <CheckCircle2 className="w-4 h-4" />
                                      Mark as Complete
                                    </button>
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
                    {/* Action Buttons */}
                    <div className="rounded-2xl bg-gradient-to-br from-burgundy/10 to-burgundy/5 backdrop-blur-sm p-4 border border-burgundy/10">
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleCompleteRoutine(selectedRoutine.id)}
                          className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sage to-sage-dark text-white font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-sm"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Complete</span>
                        </button>
                        
                        <button
                          onClick={() => handleDeleteRoutine(selectedRoutine.id)}
                          className="flex-1 px-4 py-2.5 rounded-xl bg-white/80 backdrop-blur-sm text-gray-700 font-medium border border-gray-200 hover:bg-white/90 transition-all flex items-center justify-center gap-2 text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                    {/* Routine Adjustment */}
                    <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Settings className="w-5 h-5 mr-2 text-rose" />
                        Adjust Routine
                      </h3>
                      
                      {!showAdjustmentEditor ? (
                        <div>
                          <p className="text-sm text-gray-600 mb-4">
                            Need to adjust this routine to better fit your schedule or preferences?
                          </p>
                          <button
                            onClick={() => setShowAdjustmentEditor(true)}
                            className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-rose/10 to-dusty-rose/10 text-burgundy text-sm font-medium hover:from-rose/20 hover:to-dusty-rose/20 transition-all"
                          >
                            Adjust Routine
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <textarea
                            value={adjustmentText}
                            onChange={(e) => setAdjustmentText(e.target.value)}
                            placeholder="Describe how you'd like to adjust this routine. For example: 'My work hours are 9 AM to 6 PM, so please adjust the routine timing accordingly...'"
                            className="w-full p-4 rounded-xl border border-gray-200 focus:border-rose/50 focus:ring-2 focus:ring-rose/20 text-sm resize-none"
                            rows={4}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleAdjustRoutine}
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
                    
                    {/* Routine Description & Expected Outcomes */}
                    <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Target className="w-5 h-5 mr-2 text-rose" />
                        About This Routine
                      </h3>
                      
                      {/* Description */}
                      <p className="text-gray-600 mb-6 leading-relaxed">
                        {selectedRoutine.description}
                      </p>
                      
                      {/* Expected Outcomes */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Expected Outcomes</h4>
                        <ul className="space-y-2">
                          {selectedRoutine.expectedOutcomes.map((outcome, idx) => (
                            <li key={idx} className="flex items-start text-sm text-gray-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-sage mt-1.5 mr-2 flex-shrink-0" />
                              {outcome}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Safety Notes */}
                    <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Shield className="w-5 h-5 mr-2 text-rose" />
                        Safety Notes
                      </h3>
                      <ul className="space-y-2">
                        {selectedRoutine.safetyNotes.map((note, idx) => (
                          <li key={idx} className="flex items-start text-sm text-gray-600">
                            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                            {note}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Celebration Animation */}
      {showCelebration && (
        <CelebrationShower 
          onComplete={() => setShowCelebration(false)}
          duration={3000}
        />
      )}
    </div>
  );
}