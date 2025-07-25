'use client';

import React from 'react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { Shield } from 'lucide-react';

interface PrivacySectionProps {
  visible: boolean;
}

// Option 3: Compact card with background illustration
export const PrivacySection3: React.FC<PrivacySectionProps> = ({ visible }) => {
  if (!visible) return null;

  return (
    <div className="content-padding py-6">
      <div className="relative bg-gradient-to-br from-soft-lavender/30 to-soft-blush/30 rounded-2xl p-6 overflow-hidden max-w-md mx-auto">
        {/* Background illustration - faded */}
        <div className="absolute -right-8 -bottom-8 w-32 h-32 opacity-20">
          <OptimizedImage
            src="/illustrations/privacy.png"
            alt=""
            fill
            className="object-contain"
            sizes="128px"
          />
        </div>
        
        {/* Content */}
        <div className="relative z-10 space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center">
              <Shield className="w-4 h-4 text-bloom-300" />
            </div>
            <h3 className="text-base font-semibold text-primary-text">Your Privacy First</h3>
          </div>
          <p className="text-xs text-secondary-text-thin leading-relaxed">
            All your thrivings are encrypted and stored locally on your device. We never access your personal wellness data.
          </p>
        </div>
      </div>
    </div>
  );
};