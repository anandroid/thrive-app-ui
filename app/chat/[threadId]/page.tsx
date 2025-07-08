'use client';

import React, { useState, useEffect, use } from 'react';
// import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SmartCardChat } from '@/components/features/SmartCardChat';
import { ArrowLeft, Heart } from 'lucide-react';
import { saveThrivingToStorage } from '@/src/utils/thrivingStorage';
import { saveJourneyToStorage } from '@/src/utils/journeyStorage';
import { Thriving } from '@/src/types/thriving';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ChatPage({ params }: { params: Promise<{ threadId: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { threadId } = use(params);
  const [initialMessage, setInitialMessage] = useState<string>('');
  const [currentThreadId, setCurrentThreadId] = useState<string>(threadId);
  
  // Get intent from URL parameters
  const chatIntent = searchParams?.get('intent') || null;

  useEffect(() => {
    // Get the initial message from sessionStorage
    const message = sessionStorage.getItem('initialMessage');
    if (message) {
      setInitialMessage(message);
      sessionStorage.removeItem('initialMessage');
    }
  }, []);

  return (
    <div className="app-screen bg-gray-50">
      {/* Status Bar Area */}
      <div className="safe-area-top" />
      
      {/* Header */}
      <div className="app-header backdrop-blur-xl bg-white/90 border-b border-gray-200">
        <div className="flex items-center justify-between px-4 h-14">
          <Link 
            href="/"
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/80 hover:bg-white native-transition shadow-md"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Link>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-gray-800">Companion</h1>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose/20 to-dusty-rose/30 flex items-center justify-center">
              <Heart className="w-4 h-4 text-rose fill-rose/30" />
            </div>
          </div>
          <div className="w-11" />
        </div>
      </div>
      
      {/* Creation Mode Badge */}
      {chatIntent === 'create_thriving' && (
        <div className="flex justify-center py-2">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-rose to-burgundy text-white px-4 py-1.5 rounded-full text-sm shadow-lg">
            <span>🌿</span>
            <span className="font-medium">Thriving Creation Mode</span>
          </div>
        </div>
      )}
      
      {/* Main Chat Container - Full Height */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <SmartCardChat
          threadId={currentThreadId === 'new' ? undefined : currentThreadId}
          chatIntent={chatIntent}
          onThreadCreated={(newThreadId) => {
            // Update the thread ID without navigating
            setCurrentThreadId(newThreadId);
            // Update URL without causing a re-render
            window.history.replaceState({}, '', `/chat/${newThreadId}`);
          }}
          onRoutineCreated={(routine) => {
            console.log('Routine created:', routine);
            
            try {
              // Convert routine format to thriving format
              const thriving: Thriving = {
                id: routine.id,
                title: routine.routineTitle || routine.name || 'Wellness Thriving',
                description: routine.routineDescription || routine.description || '',
                type: (routine.routineType === 'wellness' ? 'general_wellness' : 
                      routine.routineType === 'sleep_routine' ? 'sleep_wellness' :
                      routine.routineType === 'stress_management' ? 'stress_management' :
                      routine.routineType === 'pain_relief' ? 'pain_management' :
                      routine.routineType === 'meditation' ? 'mental_wellness' :
                      routine.routineType === 'exercise' ? 'exercise' :
                      routine.routineType === 'nutrition' ? 'nutrition' : 'general_wellness') as Thriving['type'],
                duration: typeof routine.duration === 'number' 
                  ? (routine.duration <= 7 ? '7_days' : 
                     routine.duration <= 14 ? '14_days' : 
                     routine.duration <= 30 ? '30_days' : 'ongoing')
                  : '7_days',
                frequency: (routine.frequency === 'twice_daily' ? 'twice_daily' : 
                          routine.frequency === 'weekly' ? 'weekly' : 'daily') as Thriving['frequency'],
                steps: routine.steps?.map((step: { id?: string; title?: string; name?: string; description?: string; reminderTime?: string; time?: string; icon?: string; order?: number; tips?: string[]; duration?: number; will_video_tutorial_help?: boolean }, index: number) => ({
                  id: step.id || `step-${index + 1}`,
                  title: step.title || step.name || `Step ${index + 1}`,
                  description: step.description,
                  time: step.reminderTime || step.time,
                  icon: step.icon,
                  completed: false,
                  reminderEnabled: true,
                  order: step.order || index + 1,
                  tips: step.tips || [],
                  duration: step.duration || 5,
                  will_video_tutorial_help: step.will_video_tutorial_help
                })) || [],
                additionalRecommendations: routine.additionalSteps?.map((s: string | { title?: string; description?: string }) => 
                  typeof s === 'string' ? s : (s.title || s.description || '')
                ).filter(Boolean) || [],
                proTips: [],
                reminderTimes: routine.reminderTimes || routine.steps?.filter((s: { reminderTime?: string }) => s.reminderTime).map((s: { reminderTime?: string }) => s.reminderTime!).filter(Boolean) || [],
                healthConcern: routine.healthConcern,
                customInstructions: undefined,
                createdAt: routine.createdAt instanceof Date ? routine.createdAt.toISOString() : new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                completedDates: [],
                isActive: true,
                startDate: routine.createdAt instanceof Date ? routine.createdAt.toISOString() : new Date().toISOString()
              };
              
              // Save to localStorage using utility function
              saveThrivingToStorage(thriving);
              console.log('Thriving saved to localStorage successfully');
              
              // Clear creation mode after successful creation by redirecting without intent
              router.push(`/chat/${currentThreadId}`);
              
              // You could add a toast notification here for better UX
              // toast.success('Thriving created successfully!');
              
              // Optionally redirect to thrivings page
              // router.push('/thrivings');
            } catch (error) {
              console.error('Failed to save thriving:', error);
              // toast.error('Failed to save thriving. Please try again.');
            }
          }}
          onJourneyCreated={(journey) => {
            console.log('Journey created:', journey);
            
            try {
              // Save to localStorage using utility function
              saveJourneyToStorage(journey);
              console.log('Journey saved to localStorage successfully');
              
              // Clear creation mode after successful creation by redirecting without intent
              router.push(`/chat/${currentThreadId}`);
              
              // Navigate to the journey chat
              router.push('/journeys');
            } catch (error) {
              console.error('Failed to save journey:', error);
            }
          }}
          onNavigateToJourney={(journey) => {
            // Navigate to journeys page with the selected journey
            sessionStorage.setItem('selectedJourneyId', journey.id);
            router.push('/journeys');
          }}
          selectedPrompt={initialMessage}
        />
      </div>
    </div>
  );
}