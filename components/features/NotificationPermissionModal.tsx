'use client';

import React, { useState } from 'react';
import { Bell, X, Sparkles, Clock } from 'lucide-react';
import { NotificationHelper } from '@/src/utils/notificationHelper';
import bridge from '@/src/lib/react-native-bridge';

interface NotificationPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPermissionGranted?: () => void;
  routineName?: string;
}

export const NotificationPermissionModal: React.FC<NotificationPermissionModalProps> = ({ 
  isOpen, 
  onClose,
  onPermissionGranted,
  routineName = 'your routine'
}) => {
  const [isRequesting, setIsRequesting] = useState(false);

  const handleEnableNotifications = async () => {
    setIsRequesting(true);
    
    try {
      // Use the React Native bridge directly for proper iOS/Android permission
      const granted = await bridge.requestNotificationPermission();
      
      if (granted) {
        // Mark that permission was granted
        localStorage.setItem('notificationPermissionGranted', 'true');
        // Reset ask count since they granted permission
        localStorage.setItem('notificationAskCount', '0');
        
        // Schedule notifications for existing thrivings
        const thrivings = JSON.parse(localStorage.getItem('thrive_thrivings') || '[]');
        if (thrivings.length > 0) {
          await NotificationHelper.scheduleRoutineReminders(thrivings);
        }
        
        if (onPermissionGranted) {
          onPermissionGranted();
        }
        
        // Close modal after a short delay to show success
        setTimeout(() => {
          onClose();
        }, 500);
      } else {
        // Permission denied
        localStorage.setItem('notificationPermissionGranted', 'false');
        onClose();
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      onClose();
    } finally {
      setIsRequesting(false);
    }
  };

  const handleNotNow = () => {
    // Just close the modal - we've already tracked the ask count
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50 animate-fade-in" onClick={handleNotNow} />
      
      {/* Modal */}
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto z-50 animate-scale-in">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header with gradient background */}
          <div className="relative bg-gradient-to-br from-rose/20 via-dusty-rose/15 to-soft-lavender/20 p-6 pb-8">
            <button
              onClick={handleNotNow}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/50 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
            
            {/* Icon */}
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-rose to-burgundy rounded-2xl flex items-center justify-center shadow-lg">
              <Bell className="w-8 h-8 text-white" />
            </div>
            
            {/* Title */}
            <h2 className="text-2xl font-bold text-center text-gray-900">
              Never Miss a Step
            </h2>
            <p className="text-center text-gray-600 mt-2">
              Get gentle reminders for {routineName}
            </p>
          </div>
          
          {/* Benefits */}
          <div className="p-6 space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-sage-light/20 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-sage-dark" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Timely Reminders</h3>
                <p className="text-sm text-gray-600 mt-0.5">
                  Stay on track with your wellness goals
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-dusty-rose/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-dusty-rose" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Build Healthy Habits</h3>
                <p className="text-sm text-gray-600 mt-0.5">
                  Consistency is key to lasting wellness
                </p>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="p-6 pt-2 space-y-3">
            <button
              onClick={handleEnableNotifications}
              disabled={isRequesting}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose to-burgundy text-white font-semibold 
                       hover:shadow-lg transition-all disabled:opacity-70 touch-feedback touch-manipulation"
            >
              {isRequesting ? (
                <span className="flex items-center justify-center space-x-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  <span>Requesting...</span>
                </span>
              ) : (
                'Enable Notifications'
              )}
            </button>
            
            <button
              onClick={handleNotNow}
              className="w-full py-3 rounded-2xl text-gray-600 font-medium hover:bg-gray-50 transition-colors touch-feedback touch-manipulation"
            >
              Not Now
            </button>
            
            <p className="text-xs text-center text-gray-500 mt-4">
              {(() => {
                const askCount = parseInt(localStorage.getItem('notificationAskCount') || '1');
                if (askCount < 3) {
                  return `You can enable notifications later (${3 - askCount} more ${3 - askCount === 1 ? 'reminder' : 'reminders'})`;
                } else {
                  return 'You can always enable notifications later in Settings';
                }
              })()}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};