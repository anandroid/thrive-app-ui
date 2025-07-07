'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  Clock, AlertCircle, Calendar, 
  Bell, ChevronRight, ChevronLeft, Edit2, Trash2,
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load routines from localStorage
    const savedRoutines = getRoutinesFromStorage();
    setRoutines(savedRoutines);
    
    // Check if there's a specific routine to show from query params
    const urlParams = new URLSearchParams(window.location.search);
    const routineId = urlParams.get('id');
    
    if (routineId && savedRoutines.length > 0) {
      const routine = savedRoutines.find(r => r.id === routineId);
      if (routine) {
        setSelectedRoutine(routine);
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

  const scrollRoutines = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

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
                <button
                  onClick={() => scrollRoutines('left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 transition-all"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                
                <button
                  onClick={() => scrollRoutines('right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 transition-all"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>

                <div 
                  ref={scrollContainerRef}
                  className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {routines.map((routine) => (
                    <div
                      key={routine.id}
                      onClick={() => setSelectedRoutine(routine)}
                      className={`flex-shrink-0 w-80 rounded-2xl p-6 cursor-pointer transition-all ${
                        selectedRoutine?.id === routine.id 
                          ? 'bg-white shadow-xl border-2 border-rose/20' 
                          : 'bg-white hover:shadow-lg border border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">{routine.name}</h3>
                          <p className="text-sm text-gray-600 line-clamp-2">{routine.description}</p>
                        </div>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          routine.isActive ? 'bg-rose/10' : 'bg-gray-100'
                        }`}>
                          <Bell className={`w-5 h-5 ${routine.isActive ? 'text-rose' : 'text-gray-400'}`} />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-gray-500">
                          <Clock className="w-4 h-4 mr-1" />
                          {routine.duration} min
                        </div>
                        <div className="flex items-center text-gray-500">
                          <Calendar className="w-4 h-4 mr-1" />
                          {routine.frequency}
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          {routine.steps.length} steps
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRoutineToggle(routine.id);
                          }}
                          className="text-xs font-medium text-rose hover:text-burgundy transition-colors"
                        >
                          {routine.isActive ? 'Pause' : 'Resume'}
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add New Routine Card */}
                  <Link 
                    href="/chat/new" 
                    className="flex-shrink-0 w-80 rounded-2xl border-2 border-dashed border-gray-300 p-6 flex flex-col items-center justify-center cursor-pointer hover:border-rose/50 hover:bg-gray-50 transition-all"
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

                      <div className="space-y-4">
                        {selectedRoutine.steps.map((step) => (
                          <div key={step.order} className="relative">
                            {/* Mobile: Time at top, Desktop: Time on side */}
                            <div className="md:flex md:gap-4">
                              {/* Time Badge - Top on mobile, Side on desktop */}
                              <div className="mb-3 md:mb-0 md:flex-shrink-0 md:w-28">
                                <div className="inline-flex items-center rounded-full bg-gradient-to-br from-sage-light/30 to-sage/20 px-4 py-2">
                                  <Bell className="w-3.5 h-3.5 mr-1.5 text-sage-dark" />
                                  <span className="text-sm font-medium text-sage-dark">
                                    {step.reminderTime ? formatReminderTime(step.reminderTime) : `Step ${step.order}`}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Content Card */}
                              <div className="flex-1 rounded-xl bg-white shadow-sm hover:shadow-md transition-all p-5">
                                <div className="flex flex-col space-y-3">
                                  {/* Title with emoji */}
                                  <h4 className="font-semibold text-gray-900 text-lg">
                                    {step.title}
                                  </h4>

                                  {/* Description */}
                                  <p className="text-gray-600 leading-relaxed">
                                    {step.description}
                                  </p>
                                  
                                  {/* Footer with duration and actions */}
                                  <div className="flex items-center gap-3 pt-2">
                                    <span className="text-sm text-gray-500 flex items-center">
                                      <Clock className="w-4 h-4 mr-1.5" />
                                      {step.duration} min
                                    </span>
                                    {step.videoUrl && (
                                      <button
                                        onClick={() => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(step.title + ' tutorial')}`, '_blank')}
                                        className="inline-flex items-center rounded-xl font-medium transition-all text-sm px-4 py-2 bg-gradient-to-r from-rose/20 to-dusty-rose/20 text-burgundy hover:from-rose/30 hover:to-dusty-rose/30"
                                      >
                                        <Play className="w-4 h-4 mr-2" />
                                        <span className="hidden sm:inline">Watch Tutorial</span>
                                        <span className="sm:hidden">Video</span>
                                      </button>
                                    )}
                                    {step.tips && step.tips.length > 0 && (
                                      <button
                                        onClick={() => toggleTips(step.order)}
                                        className="flex items-center text-sm text-sage-dark hover:text-sage transition-colors"
                                      >
                                        <Lightbulb className="w-4 h-4 mr-1.5" />
                                        Pro Tips
                                        {expandedTips.has(step.order) ? (
                                          <ChevronUp className="w-4 h-4 ml-1" />
                                        ) : (
                                          <ChevronDown className="w-4 h-4 ml-1" />
                                        )}
                                      </button>
                                    )}
                                  </div>
                                  
                                  {/* Pro Tips Content - Collapsible */}
                                  {step.tips && step.tips.length > 0 && expandedTips.has(step.order) && (
                                    <div className="mt-4 p-4 rounded-lg bg-sage-light/10 border border-sage-light/30">
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
                          <div className="flex flex-wrap gap-2">
                            {selectedRoutine.additionalSteps.map((step, index) => (
                              <span
                                key={step.id}
                                className="inline-flex items-center text-sm text-gray-600"
                              >
                                <span className="font-medium">{step.title}</span>
                                {index < (selectedRoutine.additionalSteps?.length ?? 0) - 1 && (
                                  <span className="mx-2 text-gray-400">•</span>
                                )}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {selectedRoutine.additionalSteps.map((step) => (
                              <div
                                key={step.id}
                                className="rounded-xl p-4 bg-gray-50 hover:bg-gray-100 transition-all"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose/20 to-dusty-rose/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Package className="w-4 h-4 text-rose" />
                                  </div>

                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                      <h4 className="font-medium text-gray-900">{step.title}</h4>
                                      <span className={`text-xs px-2 py-1 rounded-full ${
                                        step.frequency === 'one_time' ? 'bg-blue-100 text-blue-700' :
                                        step.frequency === 'weekly' ? 'bg-purple-100 text-purple-700' :
                                        step.frequency === 'monthly' ? 'bg-amber-100 text-amber-700' :
                                        'bg-gray-100 text-gray-700'
                                      }`}>
                                        {step.frequency === 'one_time' ? 'One-time' :
                                         step.frequency === 'weekly' ? 'Weekly' :
                                         step.frequency === 'monthly' ? 'Monthly' :
                                         'As needed'}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                                    
                                    {/* Tips for Additional Steps */}
                                    {step.tips && step.tips.length > 0 && (
                                      <div className="mt-2 p-3 rounded-lg bg-blue-50/50 border border-blue-100">
                                        <p className="text-xs font-medium text-blue-700 mb-1">Tips:</p>
                                        <ul className="space-y-1">
                                          {step.tips.map((tip, idx) => (
                                            <li key={idx} className="text-xs text-gray-600 flex items-start">
                                              <span className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 mr-2 flex-shrink-0" />
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
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="rounded-2xl bg-gradient-to-br from-burgundy/10 to-burgundy/5 backdrop-blur-sm p-6 border border-burgundy/10">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={() => handleCompleteRoutine(selectedRoutine.id)}
                          className="flex-1 px-6 py-3 rounded-2xl bg-gradient-to-r from-rose to-burgundy text-white font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          <span>Complete Routine</span>
                        </button>
                        
                        <button
                          onClick={() => handleDeleteRoutine(selectedRoutine.id)}
                          className="flex-1 px-6 py-3 rounded-2xl bg-white/80 backdrop-blur-sm text-burgundy font-medium border border-burgundy/20 hover:bg-white/90 transition-all flex items-center justify-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete Routine</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Info Section */}
                  <div className="space-y-4">
                    {/* Expected Outcomes */}
                    <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Target className="w-5 h-5 mr-2 text-rose" />
                        Expected Outcomes
                      </h3>
                      <ul className="space-y-2">
                        {selectedRoutine.expectedOutcomes.map((outcome, idx) => (
                          <li key={idx} className="flex items-start text-sm text-gray-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-sage mt-1.5 mr-2 flex-shrink-0" />
                            {outcome}
                          </li>
                        ))}
                      </ul>
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

                    {/* Routine Settings */}
                    <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Settings className="w-5 h-5 mr-2 text-rose" />
                        Routine Settings
                      </h3>
                      <div className="space-y-3">
                        <button
                          onClick={() => {/* TODO: Implement adjust modal */}}
                          className="w-full px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-900 text-sm font-medium transition-all text-left"
                        >
                          Adjust Routine
                        </button>
                        <button className="w-full px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-900 text-sm font-medium transition-all text-left">
                          Change Reminder Times
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}