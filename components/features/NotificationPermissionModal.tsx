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
      <div className="fixed inset-x-[4vw] max-inset-x-[1rem] top-1/2 -translate-y-1/2 w-[90vw] max-w-[400px] mx-auto z-50 animate-scale-in">
        <div className="bg-white rounded-[6vw] max-rounded-[1.5rem] shadow-2xl overflow-hidden">
          {/* Header with gradient background */}
          <div className="relative bg-gradient-to-br from-rose/20 via-dusty-rose/15 to-soft-lavender/20 p-[6vw] max-p-[1.5rem] pb-[8vw] max-pb-[2rem]">
            <button
              onClick={handleNotNow}
              className="absolute top-[4vw] max-top-[1rem] right-[4vw] max-right-[1rem] p-[2vw] max-p-[0.5rem] rounded-full hover:bg-white/50 transition-colors"
              aria-label="Close"
            >
              <X className="w-[5vw] h-[5vw] max-w-[1.25rem] max-h-[1.25rem] text-gray-600" />
            </button>
            
            {/* Icon */}
            <div className="w-[16vw] h-[16vw] max-w-[4rem] max-h-[4rem] mx-auto mb-[4vw] max-mb-[1rem] bg-gradient-to-br from-rose to-burgundy rounded-[4vw] max-rounded-[1rem] flex items-center justify-center shadow-lg">
              <Bell className="w-[8vw] h-[8vw] max-w-[2rem] max-h-[2rem] text-white" />
            </div>
            
            {/* Title */}
            <h2 className="text-[min(6vw,1.5rem)] font-bold text-center text-gray-900">
              Never Miss a Step
            </h2>
            <p className="text-center text-[min(4vw,1rem)] text-gray-600 mt-[2vw] max-mt-[0.5rem]">
              Get gentle reminders for {routineName}
            </p>
          </div>
          
          {/* Benefits */}
          <div className="p-[6vw] max-p-[1.5rem] space-y-[4vw] max-space-y-[1rem]">
            <div className="flex items-start space-x-[3vw] max-space-x-[0.75rem]">
              <div className="w-[10vw] h-[10vw] max-w-[2.5rem] max-h-[2.5rem] rounded-[3vw] max-rounded-[0.75rem] bg-sage-light/20 flex items-center justify-center flex-shrink-0">
                <Clock className="w-[5vw] h-[5vw] max-w-[1.25rem] max-h-[1.25rem] text-sage-dark" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-[min(4vw,1rem)]">Timely Reminders</h3>
                <p className="text-[min(3.5vw,0.875rem)] text-gray-600 mt-0.5">
                  Stay on track with your wellness goals
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-[3vw] max-space-x-[0.75rem]">
              <div className="w-[10vw] h-[10vw] max-w-[2.5rem] max-h-[2.5rem] rounded-[3vw] max-rounded-[0.75rem] bg-dusty-rose/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-[5vw] h-[5vw] max-w-[1.25rem] max-h-[1.25rem] text-dusty-rose" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-[min(4vw,1rem)]">Build Healthy Habits</h3>
                <p className="text-[min(3.5vw,0.875rem)] text-gray-600 mt-0.5">
                  Consistency is key to lasting wellness
                </p>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="p-[6vw] max-p-[1.5rem] pt-[2vw] max-pt-[0.5rem] space-y-[3vw] max-space-y-[0.75rem]">
            <button
              onClick={handleEnableNotifications}
              disabled={isRequesting}
              className="w-full py-[4vw] max-py-[1rem] rounded-[4vw] max-rounded-[1rem] bg-gradient-to-r from-rose to-burgundy text-white text-[min(4vw,1rem)] font-semibold 
                       hover:shadow-lg transition-all disabled:opacity-70 touch-feedback touch-manipulation"
            >
              {isRequesting ? (
                <span className="flex items-center justify-center space-x-[2vw] max-space-x-[0.5rem]">
                  <span className="animate-spin rounded-full h-[4vw] w-[4vw] max-h-[1rem] max-w-[1rem] border-b-2 border-white"></span>
                  <span>Requesting...</span>
                </span>
              ) : (
                'Enable Notifications'
              )}
            </button>
            
            <button
              onClick={handleNotNow}
              className="w-full py-[3vw] max-py-[0.75rem] rounded-[4vw] max-rounded-[1rem] text-[min(4vw,1rem)] text-gray-600 font-medium hover:bg-gray-50 transition-colors touch-feedback touch-manipulation"
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