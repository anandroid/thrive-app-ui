'use client';

import React, { useState, useEffect } from 'react';
import { Heart, TrendingUp, Sparkles } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

interface HealthConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: () => void;
}

export const HealthConnectModal: React.FC<HealthConnectModalProps> = ({ 
  isOpen, 
  onClose, 
  onConnect 
}) => {
  const [devicePlatform, setDevicePlatform] = useState<'ios' | 'android' | 'web'>('web');

  useEffect(() => {
    detectPlatform();
  }, []);

  const detectPlatform = () => {
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent.toLowerCase();
      
      if (window.ReactNativeBridge) {
        if (userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('ipod')) {
          setDevicePlatform('ios');
        } else if (userAgent.includes('android')) {
          setDevicePlatform('android');
        } else {
          setDevicePlatform('web');
        }
      } else {
        setDevicePlatform('web');
      }
    }
  };

  const healthServiceName = devicePlatform === 'ios' ? 'Apple Health' : 
                           devicePlatform === 'android' ? 'Google Fit' : 
                           'Health Data';
  
  const healthServiceIcon = devicePlatform === 'ios' ? '🍎' : 
                           devicePlatform === 'android' ? '🤖' : 
                           '❤️';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={true}
      size="md"
      className="max-w-md"
    >
      <div className="text-center">
        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-sage-light/30 to-rose/20 flex items-center justify-center text-4xl">
          {healthServiceIcon}
        </div>
        
        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Track Your Progress with {healthServiceName}
        </h2>
        
        {/* Description */}
        <p className="text-gray-600 mb-8">
          See how your new wellness thriving impacts your health! Connect {healthServiceName} to track:
        </p>
        
        {/* Benefits */}
        <div className="space-y-3 mb-8">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Heart className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-sm text-gray-700">
              Monitor how thrivings affect your heart rate & activity
            </p>
          </div>
          
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-sm text-gray-700">
              Track improvements in sleep, steps, and wellness metrics
            </p>
          </div>
          
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-rose-600" />
            </div>
            <p className="text-sm text-gray-700">
              Get personalized insights based on your progress
            </p>
          </div>
        </div>
        
        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => {
              console.log('[HealthConnectModal] Connect button clicked');
              console.log('[HealthConnectModal] Platform:', devicePlatform);
              console.log('[HealthConnectModal] Health service:', healthServiceName);
              onConnect();
              onClose();
            }}
            className="w-full py-3 px-6 rounded-full bg-gradient-to-r from-sage to-sage-dark text-white font-medium shadow-lg hover:shadow-xl transition-all touch-feedback touch-manipulation"
          >
            Connect {healthServiceName}
          </button>
          
          <button
            onClick={onClose}
            className="w-full py-3 px-6 rounded-full text-gray-600 font-medium hover:bg-gray-50 transition-colors touch-feedback touch-manipulation"
          >
            Maybe Later
          </button>
        </div>
        
        {devicePlatform === 'web' && (
          <p className="text-xs text-gray-500 mt-4">
            Health tracking is available in the mobile app
          </p>
        )}
      </div>
    </Modal>
  );
};