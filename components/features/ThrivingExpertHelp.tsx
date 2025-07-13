'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, Sparkles } from 'lucide-react';
import { Thriving } from '@/src/types/thriving';
import { getExpertConsultationConfig } from '@/src/config/features';

interface ThrivingExpertHelpProps {
  thriving: Thriving;
}

const getDaysSince = (dateString: string): number => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const ThrivingExpertHelp: React.FC<ThrivingExpertHelpProps> = ({ thriving }) => {
  const router = useRouter();
  const config = getExpertConsultationConfig();
  
  if (!config.enabled) return null;

  const handleGetExpertHelp = () => {
    const daysSince = getDaysSince(thriving.createdAt);
    const message = `I need help with my "${thriving.title}" routine. I've been following it for ${daysSince} ${daysSince === 1 ? 'day' : 'days'}, but I'm still struggling. Can you connect me with an expert who can help optimize this routine?`;
    
    // Store thriving context
    const consultationContext = {
      thrivingId: thriving.id,
      thrivingTitle: thriving.title,
      daysSinceCreated: daysSince,
      originThreadId: thriving.origin?.threadId,
      requestType: 'thriving_help',
      timestamp: new Date().toISOString()
    };
    
    sessionStorage.setItem('consultationContext', JSON.stringify(consultationContext));
    
    // If thriving has origin thread, navigate there
    if (thriving.origin?.threadId) {
      router.push(`/chat/${thriving.origin.threadId}?expertHelp=true&message=${encodeURIComponent(message)}`);
    } else {
      // Create new chat with expert help context
      sessionStorage.setItem('initialMessage', message);
      router.push(`/chat/new?expertHelp=true&thrivingId=${thriving.id}`);
    }
  };

  // Only show after at least 3 days of using the routine
  const daysSinceCreated = getDaysSince(thriving.createdAt);
  if (daysSinceCreated < 3) return null;

  return (
    <div className="mt-[6vw] p-[5vw] max-p-5 rounded-[4vw] max-rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 hover:border-gray-300 transition-all">
      <div className="flex items-start space-x-[3vw] max-space-x-3">
        <div className="w-[10vw] h-[10vw] max-w-12 max-h-12 rounded-[2.5vw] max-rounded-lg bg-gradient-to-br from-sage-light to-sage flex items-center justify-center flex-shrink-0">
          <MessageCircle className="w-[5vw] h-[5vw] max-w-6 max-h-6 text-white" />
        </div>
        <div className="flex-1">
          <h4 className="text-[min(4vw,1rem)] font-semibold text-gray-800 mb-[1.5vw] flex items-center">
            Need personalized guidance?
            <Sparkles className="w-[3.5vw] h-[3.5vw] max-w-4 max-h-4 text-sage ml-[1vw]" />
          </h4>
          <p className="text-[min(3.5vw,0.875rem)] text-gray-600 mb-[3vw]">
            Get expert help to optimize your routine and achieve better results. First consultation is FREE!
          </p>
          <button
            onClick={handleGetExpertHelp}
            className="w-full py-[2.5vw] max-py-3 px-[4vw] max-px-5 bg-white border border-sage-light rounded-[2.5vw] max-rounded-lg text-[min(3.5vw,0.875rem)] font-medium text-sage-dark hover:bg-sage-light/10 hover:border-sage transition-all active:scale-[0.98] touch-feedback touch-manipulation"
          >
            Connect with an Expert →
          </button>
        </div>
      </div>
    </div>
  );
};