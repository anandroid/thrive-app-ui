'use client';

import React, { useState, useEffect } from 'react';
import { X, Heart, TrendingUp, Sparkles } from 'lucide-react';

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

  if (!isOpen) return null;

  const healthServiceName = devicePlatform === 'ios' ? 'Apple Health' : 
                           devicePlatform === 'android' ? 'Google Fit' : 
                           'Health Data';
  
  const healthServiceIcon = devicePlatform === 'ios' ? '🍎' : 
                           devicePlatform === 'android' ? '🤖' : 
                           '❤️';

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full animate-slide-up">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
          
          {/* Content */}
          <div className="p-8 text-center">
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
                  onConnect();
                  onClose();
                }}
                className="w-full py-3 px-6 rounded-full bg-gradient-to-r from-sage to-sage-dark text-white font-medium shadow-lg hover:shadow-xl transition-all"
              >
                Connect {healthServiceName}
              </button>
              
              <button
                onClick={onClose}
                className="w-full py-3 px-6 rounded-full text-gray-600 font-medium hover:bg-gray-50 transition-colors"
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
        </div>
      </div>
    </>
  );
};