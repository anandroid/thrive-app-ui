'use client';

import React from 'react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { Shield } from 'lucide-react';

interface PrivacySectionProps {
  visible: boolean;
}

// Option 2: Right-aligned illustration
export const PrivacySection2: React.FC<PrivacySectionProps> = ({ visible }) => {
  if (!visible) return null;

  return (
    <div className="content-padding py-6 bg-gradient-to-br from-soft-lavender/20 via-white to-soft-blush/20">
      <div className="flex items-center justify-between max-w-md mx-auto">
        {/* Privacy Text - Left side */}
        <div className="flex-1 space-y-2 pr-4">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-bloom-300" />
            <h3 className="text-base font-semibold text-primary-text">Your Privacy First</h3>
          </div>
          <p className="text-xs text-secondary-text-thin leading-relaxed">
            All your thrivings are encrypted and stored locally on your device. We never access your personal wellness data.
          </p>
        </div>
        
        {/* Privacy Illustration - Right side */}
        <div className="relative w-20 h-20 flex-shrink-0">
          <OptimizedImage
            src="/illustrations/privacy.png"
            alt="Privacy First"
            fill
            className="object-contain"
            sizes="80px"
          />
        </div>
      </div>
    </div>
  );
};