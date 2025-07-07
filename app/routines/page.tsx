'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { 
  Clock, Play, CheckCircle, AlertCircle, Calendar, 
  Bell, ChevronRight, ChevronLeft, Edit2, Trash2,
  Plus, Video, Shield, Target, Settings, ArrowLeft
} from 'lucide-react';
import { WellnessRoutine } from '@/src/services/openai/types';

// Mock data for demonstration
const mockRoutines: WellnessRoutine[] = [
  {
    id: '1',
    name: 'Morning Anxiety Relief',
    description: 'A gentle routine to start your day with calm and clarity',
    type: 'stress_management',
    duration: 20,
    frequency: 'daily',
    reminderTimes: ['07:00'],
    healthConcern: 'Morning anxiety and stress',
    steps: [
      {
        order: 1,
        title: 'Deep Breathing Exercise',
        description: 'Take 5 deep breaths, inhaling for 4 counts and exhaling for 6',
        duration: 3,
        videoUrl: 'https://example.com/breathing'
      },
      {
        order: 2,
        title: 'Gentle Stretching',
        description: 'Perform neck rolls and shoulder shrugs to release tension',
        duration: 5,
        videoUrl: 'https://example.com/stretching'
      },
      {
        order: 3,
        title: 'Positive Affirmations',
        description: 'Repeat 3 positive affirmations while looking in the mirror',
        duration: 2
      },
      {
        order: 4,
        title: 'Mindful Tea Preparation',
        description: 'Prepare your morning tea mindfully, focusing on each step',
        duration: 5
      },
      {
        order: 5,
        title: 'Gratitude Journaling',
        description: 'Write down 3 things you\'re grateful for today',
        duration: 5
      }
    ],
    expectedOutcomes: [
      'Reduced morning anxiety levels',
      'Improved mental clarity',
      'Better emotional regulation throughout the day'
    ],
    safetyNotes: [
      'If you experience dizziness during breathing exercises, return to normal breathing',
      'Adjust stretches to your comfort level'
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true
  },
  {
    id: '2',
    name: 'Evening Sleep Routine',
    description: 'Wind down and prepare for restful sleep',
    type: 'sleep_routine',
    duration: 30,
    frequency: 'daily',
    reminderTimes: ['21:00'],
    healthConcern: 'Insomnia and sleep difficulties',
    steps: [
      {
        order: 1,
        title: 'Digital Detox',
        description: 'Turn off all screens and dim the lights',
        duration: 5
      },
      {
        order: 2,
        title: 'Warm Bath or Shower',
        description: 'Take a warm bath with lavender essential oils',
        duration: 10
      },
      {
        order: 3,
        title: 'Progressive Muscle Relaxation',
        description: 'Tense and release each muscle group from toes to head',
        duration: 10,
        videoUrl: 'https://example.com/pmr'
      },
      {
        order: 4,
        title: 'Bedtime Reading',
        description: 'Read a calming book for 5 minutes',
        duration: 5
      }
    ],
    expectedOutcomes: [
      'Fall asleep within 20 minutes',
      'Reduced nighttime awakening',
      'More refreshed morning feeling'
    ],
    safetyNotes: [
      'Ensure bath water is not too hot',
      'Keep bedroom temperature cool'
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true
  }
];

export default function RoutinesPage() {
  const [routines, setRoutines] = useState<WellnessRoutine[]>(mockRoutines);
  const [selectedRoutine, setSelectedRoutine] = useState<WellnessRoutine | null>(routines[0]);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isEditing, setIsEditing] = useState(false);
  // const [showAdjustModal, setShowAdjustModal] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleStepComplete = (stepOrder: number) => {
    setCompletedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepOrder)) {
        newSet.delete(stepOrder);
      } else {
        newSet.add(stepOrder);
      }
      return newSet;
    });
  };

  const handleRoutineToggle = (routineId: string) => {
    setRoutines(prev => prev.map(r => 
      r.id === routineId ? { ...r, isActive: !r.isActive } : r
    ));
  };

  const handleDeleteRoutine = (routineId: string) => {
    if (confirm('Are you sure you want to delete this routine?')) {
      setRoutines(prev => prev.filter(r => r.id !== routineId));
      if (selectedRoutine?.id === routineId) {
        setSelectedRoutine(routines.find(r => r.id !== routineId) || null);
      }
    }
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
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

      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Wellness Routines</h1>
          <p className="text-gray-600">Track your progress and stay consistent with your healing journey</p>
        </div>

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
            <div className="flex-shrink-0 w-80 rounded-2xl border-2 border-dashed border-gray-300 p-6 flex flex-col items-center justify-center cursor-pointer hover:border-rose/50 hover:bg-gray-50 transition-all">
              <Plus className="w-12 h-12 text-gray-400 mb-3" />
              <p className="text-gray-900 font-medium">Create New Routine</p>
              <p className="text-sm text-gray-600 text-center mt-1">
                Add a personalized routine to your wellness journey
              </p>
            </div>
          </div>
        </div>

        {/* Selected Routine Details */}
        {selectedRoutine && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Steps Section */}
            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Routine Steps</h2>
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

                <div className="space-y-3">
                  {selectedRoutine.steps.map((step) => (
                    <div
                      key={step.order}
                      className={`rounded-xl p-4 transition-all ${
                        completedSteps.has(step.order)
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => handleStepComplete(step.order)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            completedSteps.has(step.order)
                              ? 'bg-green-500 border-green-500'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {completedSteps.has(step.order) && (
                            <CheckCircle className="w-4 h-4 text-white" />
                          )}
                        </button>

                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">
                            Step {step.order}: {step.title}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                          
                          <div className="flex items-center gap-4 text-xs">
                            <span className="text-gray-500 flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {step.duration} min
                            </span>
                            {step.videoUrl && (
                              <a
                                href={step.videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-rose hover:text-burgundy flex items-center transition-colors"
                              >
                                <Video className="w-3 h-3 mr-1" />
                                Watch tutorial
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    Progress: {completedSteps.size}/{selectedRoutine.steps.length} steps completed
                  </div>
                  <button className="px-4 py-2 rounded-full bg-primary-text text-white text-sm font-medium hover:opacity-90 transition-all flex items-center">
                    <Play className="w-4 h-4 mr-2" />
                    Start Routine
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
                  <button className="w-full px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-900 text-sm font-medium transition-all text-left">
                    View History
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}