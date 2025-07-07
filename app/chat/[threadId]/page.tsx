'use client';

import React, { useState, useEffect, use } from 'react';
// import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { SmartCardChat } from '@/components/features/SmartCardChat';
import { ArrowLeft } from 'lucide-react';
import { saveRoutineToStorage } from '@/src/utils/routineStorage';
import { saveJourneyToStorage } from '@/src/utils/journeyStorage';
import { useRouter } from 'next/navigation';

export default function ChatPage({ params }: { params: Promise<{ threadId: string }> }) {
  const router = useRouter();
  const { threadId } = use(params);
  const [initialMessage, setInitialMessage] = useState<string>('');
  const [currentThreadId, setCurrentThreadId] = useState<string>(threadId);
  const [chatIntent, setChatIntent] = useState<string | null>(null);

  useEffect(() => {
    // Get the initial message from sessionStorage
    const message = sessionStorage.getItem('initialMessage');
    if (message) {
      setInitialMessage(message);
      sessionStorage.removeItem('initialMessage');
    }
    
    // Get the chat intent (create_journey or create_routine)
    const intent = sessionStorage.getItem('chatIntent');
    if (intent) {
      setChatIntent(intent);
      // Don't remove it yet - we'll clear it when exiting creation mode
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
            <h1 className="text-xl font-bold text-secondary-text">Companion</h1>
            <Image 
              src="/companion-3d.png" 
              alt="Companion" 
              width={32} 
              height={32}
              className="object-contain"
            />
          </div>
          <div className="w-11" />
        </div>
      </div>
      
      {/* Creation Mode Banner */}
      {chatIntent && (
        <div className="bg-gradient-to-r from-rose to-burgundy text-white px-4 py-3 flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">
              {chatIntent === 'create_journey' ? '📝' : '🌿'}
            </span>
            <span className="font-medium">
              {chatIntent === 'create_journey' ? 'Journey Creation Mode' : 'Routine Creation Mode'}
            </span>
          </div>
          <button
            onClick={() => {
              setChatIntent(null);
              sessionStorage.removeItem('chatIntent');
            }}
            className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors"
          >
            Exit Creation Mode
          </button>
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
              // Save to localStorage using utility function
              saveRoutineToStorage(routine);
              console.log('Routine saved to localStorage successfully');
              
              // Clear creation mode after successful creation
              setChatIntent(null);
              sessionStorage.removeItem('chatIntent');
              
              // You could add a toast notification here for better UX
              // toast.success('Routine created successfully!');
              
              // Optionally redirect to routines page
              // router.push('/routines');
            } catch (error) {
              console.error('Failed to save routine:', error);
              // toast.error('Failed to save routine. Please try again.');
            }
          }}
          onJourneyCreated={(journey) => {
            console.log('Journey created:', journey);
            
            try {
              // Save to localStorage using utility function
              saveJourneyToStorage(journey);
              console.log('Journey saved to localStorage successfully');
              
              // Clear creation mode after successful creation
              setChatIntent(null);
              sessionStorage.removeItem('chatIntent');
              
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