'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Sparkles, Clock } from 'lucide-react';
import { NotificationHelper } from '@/src/utils/notificationHelper';
import bridge from '@/src/lib/react-native-bridge';
import { Modal } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { LoadingButton } from '@/components/ui/LoadingButton';

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
  const [askCount, setAskCount] = useState(1);

  useEffect(() => {
    // Only access localStorage on client side
    if (typeof window !== 'undefined') {
      const count = parseInt(localStorage.getItem('notificationAskCount') || '1');
      setAskCount(count);
    }
  }, [isOpen]);

  const handleEnableNotifications = async () => {
    console.log('[NotificationModal] Starting notification permission request');
    setIsRequesting(true);
    
    try {
      // Use the React Native bridge directly for proper iOS/Android permission
      console.log('[NotificationModal] Calling bridge.requestNotificationPermission()');
      const granted = await bridge.requestNotificationPermission();
      console.log('[NotificationModal] Permission result:', granted);
      
      if (granted) {
        // Mark that permission was granted
        localStorage.setItem('notificationPermissionGranted', 'true');
        // Reset ask count since they granted permission
        localStorage.setItem('notificationAskCount', '0');
        console.log('[NotificationModal] Permission granted, saved to localStorage');
        
        // Schedule notifications for existing thrivings
        const thrivings = JSON.parse(localStorage.getItem('thrive_thrivings') || '[]');
        console.log('[NotificationModal] Found', thrivings.length, 'thrivings to schedule');
        
        if (thrivings.length > 0) {
          console.log('[NotificationModal] Scheduling routine reminders...');
          const result = await NotificationHelper.scheduleRoutineReminders(thrivings);
          console.log('[NotificationModal] Schedule result:', result);
        }
        
        if (onPermissionGranted) {
          console.log('[NotificationModal] Calling onPermissionGranted callback');
          onPermissionGranted();
        }
        
        // Close modal after a short delay to show success
        console.log('[NotificationModal] Closing modal in 500ms');
        setTimeout(() => {
          onClose();
        }, 500);
      } else {
        // Permission denied
        console.log('[NotificationModal] Permission denied by user');
        localStorage.setItem('notificationPermissionGranted', 'false');
        onClose();
      }
    } catch (error) {
      console.error('[NotificationModal] Error requesting notification permission:', error);
      onClose();
    } finally {
      setIsRequesting(false);
    }
  };

  const handleNotNow = () => {
    // Just close the modal - we've already tracked the ask count
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleNotNow}
      showCloseButton={false}
      size="sm"
      className="max-w-md"
    >
      {/* Header with gradient background */}
      <div className="-m-6 mb-6">
        <div className="relative bg-gradient-to-br from-rose/20 via-dusty-rose/15 to-soft-lavender/20 p-6 pb-8">
          {/* Icon */}
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-rose to-burgundy rounded-xl flex items-center justify-center shadow-lg">
            <Bell className="w-8 h-8 text-white" />
          </div>
          
          {/* Title */}
          <h2 className="text-2xl font-bold text-center text-gray-900">
            Never Miss a Step
          </h2>
          <p className="text-center text-base text-gray-600 mt-2">
            Get gentle reminders for {routineName}
          </p>
        </div>
      </div>
      
      {/* Benefits */}
      <div className="space-y-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-sage-light/20 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-sage-dark" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Timely Reminders</h3>
            <p className="text-sm text-gray-600 mt-0.5">
              Stay on track with your wellness goals
            </p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-dusty-rose/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-dusty-rose-600" />
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
      <div className="space-y-3">
        <LoadingButton
          onClick={handleEnableNotifications}
          isLoading={isRequesting}
          disabled={isRequesting}
          variant="gradient"
          gradient={{
            from: 'rose',
            to: 'burgundy',
            hoverFrom: 'burgundy',
            hoverTo: 'burgundy',
            activeFrom: 'rose/40',
            activeTo: 'burgundy/30'
          }}
          fullWidth
          size="lg"
          springAnimation
          gradientOverlay
          cardGlow
          haptic="medium"
          shadow="lg"
          className="font-semibold"
          loadingMessages={[
            'Requesting...',
            'Checking permissions...',
            'Setting up reminders...',
            'Almost ready...'
          ]}
          messageInterval={2000}
        >
          Enable Notifications
        </LoadingButton>
        
        <Button
          onClick={handleNotNow}
          variant="ghost"
          fullWidth
          springAnimation
          haptic="light"
          className="text-gray-600 font-medium"
        >
          Not Now
        </Button>
        
        <p className="text-xs text-center text-gray-500 mt-4">
          {askCount < 3
            ? `You can enable notifications later (${3 - askCount} more ${3 - askCount === 1 ? 'reminder' : 'reminders'})`
            : 'You can always enable notifications later in Settings'
          }
        </p>
      </div>
    </Modal>
  );
};