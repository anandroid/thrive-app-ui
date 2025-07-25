'use client';

import { useRouter } from 'next/navigation';
import type { ChatHistoryItem } from '@/src/types/chat';

interface WellnessCompanionCTAProps {
  latestChat?: ChatHistoryItem | null;
}

export function WellnessCompanionCTA({ latestChat }: WellnessCompanionCTAProps) {
  const router = useRouter();

  return (
    <div>
      {/* Latest Chat */}
      {latestChat && (
        <div style={{ marginBottom: '3vh' }}>
          <h3 className="font-semibold text-gray-900" style={{ fontSize: '4vw', marginBottom: '2vh' }}>Recent Chat</h3>
          <button
            onClick={() => router.push(`/chat/${latestChat.threadId}`)}
            className="w-full bg-white border border-gray-200 rounded-2xl hover:border-gray-300 transition-all text-left active:scale-[0.98]"
            style={{ padding: '4vw' }}
          >
            <div className="flex items-start" style={{ gap: '3vw' }}>
              <div className="rounded-xl flex items-center justify-center flex-shrink-0" style={{ width: '10vw', height: '10vw', background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
                <svg style={{ width: '5vw', height: '5vw' }} viewBox="0 0 24 24" fill="white">
                  <path d="M8 9H16M8 13H14M18 3H6C4.89543 3 4 3.89543 4 5V15C4 16.1046 4.89543 17 6 17H7L10 20V17H18C19.1046 17 20 16.1046 20 15V5C20 3.89543 19.1046 3 18 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate" style={{ fontSize: '3.5vw', marginBottom: '1vw' }}>
                  {latestChat.title === 'New Conversation' && latestChat.lastMessage 
                    ? latestChat.lastMessage.length > 40 
                      ? latestChat.lastMessage.substring(0, 40) + '...'
                      : latestChat.lastMessage
                    : latestChat.title}
                </p>
                <p className="text-gray-600 truncate" style={{ fontSize: '3vw' }}>
                  {latestChat.lastMessage}
                </p>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Ask Companion Button */}
      <button
        onClick={() => router.push('/chat/new')}
        className="w-full text-white shadow-lg flex items-center justify-center gap-2"
        style={{ 
          borderRadius: '4vw',
          padding: '4vw',
          fontSize: '4vw',
          background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-mid), var(--gradient-end))'
        }}
      >
        <svg className="text-white" style={{ width: '5vw', height: '5vw' }} viewBox="0 0 24 24" fill="none">
          <path d="M8 9H16M8 13H14M18 3H6C4.89543 3 4 3.89543 4 5V15C4 16.1046 4.89543 17 6 17H7L10 20V17H18C19.1046 17 20 16.1046 20 15V5C20 3.89543 19.1046 3 18 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="font-medium">Ask Wellness Companion</span>
      </button>
      <p className="text-center text-gray-600" style={{ fontSize: '3vw', marginTop: '2vh' }}>
        Get instant advice or connect with a specialist
      </p>
    </div>
  );
}