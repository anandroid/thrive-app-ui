'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Heart } from 'lucide-react';
import { SmartCardChat } from '@/components/features/SmartCardChat';
import { saveJourneyToStorage } from '@/src/utils/journeyStorage';
import { AppLayout } from '@/components/layout/AppLayout';

export default function ChatPage({ params }: { params: Promise<{ threadId: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { threadId } = use(params);
  const [initialMessage, setInitialMessage] = useState<string>('');
  const [currentThreadId, setCurrentThreadId] = useState<string>(threadId);
  
  // Get intent from URL parameters
  const chatIntent = searchParams?.get('intent') || null;
  const chatMode = searchParams?.get('mode') || null;

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
        header={{
          title: (
            <div className="flex items-center space-x-2">
              <h1 className="action-bar-title">Companion</h1>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-coral-400/20 to-coral-500/30 flex items-center justify-center">
                <Heart className="w-4 h-4 text-coral-500 fill-coral-500/30" />
              </div>
            </div>
          ),
          showBackButton: true,
          backHref: "/"
        }}
        className="chat-layout"
        showBottomNav={false}
      >
        {(chatIntent === 'create_thriving' || chatMode === 'thriving') && (
          <div className="flex justify-center py-2 bg-white/80 border-b border-gray-100">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-forest-500 to-forest-600 text-white px-4 py-1.5 rounded-full text-sm shadow-lg">
              <span>🌿</span>
              <span className="font-medium">Thriving Creation Mode</span>
            </div>
          </div>
        )}
        <SmartCardChat
          threadId={currentThreadId === 'new' ? undefined : currentThreadId}
          chatIntent={chatIntent || (chatMode === 'thriving' ? 'create_thriving' : null)}
          onThreadCreated={(newThreadId) => {
            // Update the thread ID without navigating
            setCurrentThreadId(newThreadId);
            // Update URL without causing a re-render
            window.history.replaceState({}, '', `/chat/${newThreadId}`);
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
    </>
  );
}