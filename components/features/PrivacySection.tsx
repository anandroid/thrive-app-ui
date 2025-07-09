'use client';

import React from 'react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { Shield } from 'lucide-react';

interface PrivacySectionProps {
  visible: boolean;
}

export const PrivacySection: React.FC<PrivacySectionProps> = ({ visible }) => {
  if (!visible) return null;

  return (
    <div className="content-padding py-8 bg-gradient-to-b from-soft-lavender/20 via-soft-blush/15 to-soft-lavender/10 rounded-t-3xl">
      <div className="text-center max-w-sm mx-auto">
        {/* Privacy Illustration */}
        <div className="relative w-20 h-20 mx-auto mb-3">
          <OptimizedImage
            src="/illustrations/privacy.png"
            alt="Privacy First"
            fill
            className="object-contain"
            sizes="80px"
          />
        </div>
        
        {/* Privacy Text */}
        <div className="space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <Shield className="w-4 h-4 text-lavender" />
            <h3 className="text-base font-semibold text-primary-text">Your Privacy First</h3>
          </div>
          <p className="text-xs text-secondary-text-thin leading-relaxed px-4">
            All your thrivings are encrypted and stored locally on your device. We never access your personal wellness data.
          </p>
        </div>
      </div>
    </div>
  );
};