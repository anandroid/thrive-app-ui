'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SmartCardChat } from '@/components/features/SmartCardChat';
import { ArrowLeft, Leaf } from 'lucide-react';

export default function ChatPage({ params }: { params: Promise<{ threadId: string }> }) {
  const router = useRouter();
  const { threadId } = use(params);
  const [initialMessage, setInitialMessage] = useState<string>('');
  const [currentThreadId, setCurrentThreadId] = useState<string>(threadId);

  useEffect(() => {
    // Get the initial message from sessionStorage
    const message = sessionStorage.getItem('initialMessage');
    if (message) {
      setInitialMessage(message);
      sessionStorage.removeItem('initialMessage');
    }
  }, []);

  return (
    <div className="app-screen bg-white">
      {/* Status Bar Area */}
      <div className="safe-area-top" />
      
      {/* Header */}
      <div className="app-header backdrop-blur-xl bg-white/95 border-b border-gray-100">
        <div className="flex items-center justify-between px-4 h-14">
          <Link 
            href="/"
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-50 native-transition"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-rose to-burgundy flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-gray-900">Thrive Chat</h1>
          </div>
          <div className="w-10" />
        </div>
      </div>
      
      {/* Main Chat Container - Full Height */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <SmartCardChat
          threadId={currentThreadId === 'new' ? undefined : currentThreadId}
          onThreadCreated={(newThreadId) => {
            // Update the thread ID without navigating
            setCurrentThreadId(newThreadId);
            // Update URL without causing a re-render
            window.history.replaceState({}, '', `/chat/${newThreadId}`);
          }}
          onRoutineCreated={(routine) => {
            console.log('Routine created:', routine);
          }}
          selectedPrompt={initialMessage}
        />
      </div>
    </div>
  );
}