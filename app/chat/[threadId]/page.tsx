'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Heart } from 'lucide-react';
import { SmartCardChat } from '@/components/features/SmartCardChat';
import { TouchLink } from '@/components/ui/TouchLink';
import { saveThrivingToStorage } from '@/src/utils/thrivingStorage';
import { saveJourneyToStorage } from '@/src/utils/journeyStorage';
import { Thriving, AdditionalRecommendation } from '@/src/types/thriving';
import { NotificationPermissionModal } from '@/components/features/NotificationPermissionModal';
import { NotificationHelper } from '@/src/utils/notificationHelper';
import bridge from '@/src/lib/react-native-bridge';
import { AppLayout } from '@/components/layout/AppLayout';

export default function ChatPage({ params }: { params: Promise<{ threadId: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { threadId } = use(params);
  const [initialMessage, setInitialMessage] = useState<string>('');
  const [currentThreadId, setCurrentThreadId] = useState<string>(threadId);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [createdThriving, setCreatedThriving] = useState<Thriving | null>(null);
  
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
    <>
      <AppLayout
        customHeader={
          <>
            <div className="action-bar-content">
              <div className="action-bar-left">
                <TouchLink 
                  href="/"
                  className="action-bar-button"
                  variant="icon"
                  haptic="medium"
                >
                  <ArrowLeft className="w-5 h-5" />
                </TouchLink>
              </div>
              <div className="action-bar-center">
                <div className="flex items-center space-x-2">
                  <h1 className="action-bar-title">Companion</h1>
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose/20 to-dusty-rose/30 flex items-center justify-center">
                    <Heart className="w-4 h-4 text-rose fill-rose/30" />
                  </div>
                </div>
              </div>
              <div className="action-bar-right">
                <div className="w-11" />
              </div>
            </div>
            {chatIntent === 'create_thriving' && (
              <div className="flex justify-center py-2 bg-white/80">
                <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-rose to-burgundy text-white px-4 py-1.5 rounded-full text-sm shadow-lg">
                  <span>🌿</span>
                  <span className="font-medium">Thriving Creation Mode</span>
                </div>
              </div>
            )}
          </>
        }
        className="chat-layout"
      >
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
                additionalRecommendations: routine.additionalSteps?.map((s: string | { id?: string; title?: string; description?: string; frequency?: string; tips?: string[]; videoSearchQuery?: string; will_video_tutorial_help?: boolean }) => {
                  if (typeof s === 'string') return s;
                  // Ensure title is present for object format
                  if (s && s.title) {
                    return {
                      id: s.id,
                      title: s.title,
                      description: s.description,
                      frequency: s.frequency,
                      tips: s.tips,
                      videoSearchQuery: s.videoSearchQuery,
                      will_video_tutorial_help: s.will_video_tutorial_help
                    } as AdditionalRecommendation;
                  }
                  // Fallback to string if no title
                  return s.description || '';
                }).filter(Boolean) || [],
                proTips: [],
                reminderTimes: routine.reminderTimes || routine.steps?.filter((s: { reminderTime?: string }) => s.reminderTime).map((s: { reminderTime?: string }) => s.reminderTime!).filter(Boolean) || [],
                healthConcern: routine.healthConcern,
                customInstructions: undefined,
                createdAt: routine.createdAt instanceof Date ? routine.createdAt.toISOString() : new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                completedDates: [],
                isActive: true,
                startDate: routine.createdAt instanceof Date ? routine.createdAt.toISOString() : new Date().toISOString(),
                version: '1.0'
              };
              
              // Save to localStorage using utility function
              saveThrivingToStorage(thriving);
              console.log('Thriving saved to localStorage successfully');
              
              // Check if we should show notification permission modal
              const notificationAskCount = parseInt(localStorage.getItem('notificationAskCount') || '0');
              const lastAskSession = localStorage.getItem('notificationLastAskSession');
              const currentSession = sessionStorage.getItem('sessionId') || Date.now().toString();
              
              // Set session ID if not exists
              if (!sessionStorage.getItem('sessionId')) {
                sessionStorage.setItem('sessionId', currentSession);
              }
              
              // Debug logging
              console.log('Notification Modal Check:', {
                isInReactNative: bridge.isInReactNative(),
                notificationPermissionGranted: localStorage.getItem('notificationPermissionGranted'),
                notificationAskCount,
                lastAskSession,
                currentSession,
                reminderTimes: thriving.reminderTimes,
                reminderTimesLength: thriving.reminderTimes?.length
              });
              
              const shouldShowNotificationModal = 
                bridge.isInReactNative() && // Running in React Native
                localStorage.getItem('notificationPermissionGranted') !== 'true' && // Not already granted
                notificationAskCount < 3 && // Haven't asked 3 times yet
                (notificationAskCount === 0 || lastAskSession !== currentSession) && // First time or different session
                thriving.reminderTimes && thriving.reminderTimes.length > 0; // Has reminders
              
              console.log('Should show notification modal:', shouldShowNotificationModal);
              
              if (shouldShowNotificationModal) {
                // Update ask count and session
                localStorage.setItem('notificationAskCount', (notificationAskCount + 1).toString());
                localStorage.setItem('notificationLastAskSession', currentSession);
                
                // Store the thriving for later navigation
                setCreatedThriving(thriving);
                
                // Navigate to thrivings page immediately
                router.push(`/thrivings?id=${thriving.id}`);
                
                // Show notification modal after 4 seconds
                setTimeout(() => {
                  setShowNotificationModal(true);
                }, 4000);
              } else {
                // Redirect to the thriving page with the newly created thriving
                router.push(`/thrivings?id=${thriving.id}`);
              }
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
              
              // For now, navigate to journeys page since journeys are handled separately
              // TODO: Consider unifying journeys and routines under thrivings
              sessionStorage.setItem('selectedJourneyId', journey.id);
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
      </AppLayout>
        
      <NotificationPermissionModal
        isOpen={showNotificationModal}
        onClose={() => {
          setShowNotificationModal(false);
          
          // Check if this is the first time asking for notifications
          const notificationAskCount = parseInt(localStorage.getItem('notificationAskCount') || '0');
          if (notificationAskCount === 1) {
            // First time - mark that adjustment tutorial should be shown
            sessionStorage.setItem('showAdjustmentTutorial', 'true');
          }
        }}
        onPermissionGranted={() => {
          // Schedule notifications for the created thriving
          if (createdThriving && window.ReactNativeBridge) {
            const thrivings = JSON.parse(localStorage.getItem('thrive_thrivings') || '[]');
            NotificationHelper.scheduleRoutineReminders(thrivings);
          }
          
          // Check if this is the first time asking for notifications
          const notificationAskCount = parseInt(localStorage.getItem('notificationAskCount') || '0');
          if (notificationAskCount === 1) {
            // First time - mark that adjustment tutorial should be shown
            sessionStorage.setItem('showAdjustmentTutorial', 'true');
          }
        }}
        routineName={createdThriving?.title}
      />
    </>
  );
}