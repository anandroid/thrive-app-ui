'use client';

import React from 'react';
import { UserCheck, CheckCircle } from 'lucide-react';
import { getExpertConsultationConfig } from '@/src/config/features';

interface ExpertConsultationMetadata {
  highlight?: string;
  benefits?: string[];
  userConcerns?: string[];
  relatedRoutines?: string[];
}

interface ExpertConsultationCardProps {
  title: string;
  description: string;
  content?: string;
  metadata?: ExpertConsultationMetadata;
  threadId: string;
  messageId?: string;
}

export const ExpertConsultationCard: React.FC<ExpertConsultationCardProps> = ({
  title,
  description,
  content,
  metadata,
  threadId,
  messageId
}) => {
  const config = getExpertConsultationConfig();
  
  if (!config.enabled) return null;

  const handleBookConsultation = () => {
    // Store context for post-consultation summary
    const consultationContext = {
      threadId,
      messageId,
      userConcerns: metadata?.userConcerns || [],
      relatedRoutines: metadata?.relatedRoutines || [],
      timestamp: new Date().toISOString()
    };
    
    sessionStorage.setItem('consultationContext', JSON.stringify(consultationContext));
    
    // Redirect to Shopify booking with context parameters
    if (config.shopifyBookingUrl) {
      const bookingUrl = new URL(config.shopifyBookingUrl);
      bookingUrl.searchParams.set('ref', 'thrive-app');
      bookingUrl.searchParams.set('context', threadId);
      bookingUrl.searchParams.set('concerns', metadata?.userConcerns?.join(',') || '');
      
      window.open(bookingUrl.toString(), '_blank');
    } else {
      console.error('Shopify booking URL not configured');
    }
  };

  return (
    <div className="w-full p-[5vw] max-p-6 rounded-[4vw] max-rounded-2xl bg-gradient-to-br from-sage-300/20 to-sage-400/10 border border-sage-300/30 shadow-lg hover:shadow-xl transition-shadow">
      <div className="flex items-start space-x-[4vw] max-space-x-4">
        <div className="w-[12vw] h-[12vw] max-w-14 max-h-14 rounded-[3vw] max-rounded-xl bg-gradient-to-br from-sage-400 to-sage-600 flex items-center justify-center flex-shrink-0 shadow-md">
          <UserCheck className="w-[6vw] h-[6vw] max-w-7 max-h-7 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-[min(4.5vw,1.125rem)] font-semibold text-gray-900 mb-[1vw]">
            {title}
          </h3>
          {metadata?.highlight && (
            <p className="text-[min(3.5vw,0.875rem)] font-medium text-sage-600 mb-[2vw] bg-sage-300/20 px-[2vw] py-[1vw] rounded-[2vw] max-rounded-lg inline-block">
              {metadata.highlight}
            </p>
          )}
          <p className="text-[min(3.5vw,0.875rem)] text-gray-700 mb-[3vw]">
            {description}
          </p>
          {content && (
            <p className="text-[min(3.5vw,0.875rem)] text-gray-600 mb-[3vw] italic">
              {content}
            </p>
          )}
          {metadata?.benefits && metadata.benefits.length > 0 && (
            <ul className="space-y-[1.5vw] mb-[4vw]">
              {metadata.benefits.map((benefit, idx) => (
                <li key={idx} className="flex items-start space-x-[2vw] text-[min(3.2vw,0.8rem)] text-gray-600">
                  <CheckCircle className="w-[4vw] h-[4vw] max-w-4 max-h-4 text-sage-400 flex-shrink-0 mt-[0.5vw]" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          )}
          <button
            onClick={handleBookConsultation}
            className="w-full py-[3.5vw] max-py-4 px-[5vw] max-px-6 bg-gradient-to-r from-sage-400 to-sage-600 text-white rounded-[3vw] max-rounded-xl font-medium text-[min(4vw,1rem)] hover:from-sage-600 hover:to-sage-600 transition-all shadow-md hover:shadow-lg active:scale-[0.98] touch-feedback touch-manipulation"
          >
            Book Free Consultation
          </button>
          <p className="text-[min(2.8vw,0.7rem)] text-gray-500 text-center mt-[2vw]">
            No credit card required • 45-minute session
          </p>
        </div>
      </div>
    </div>
  );
};