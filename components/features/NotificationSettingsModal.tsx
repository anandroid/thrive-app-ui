'use client';

import React, { useState } from 'react';
import { Bell, BellOff, Calendar, Clock } from 'lucide-react';
import { Thriving, NotificationSettings } from '@/src/types/thriving';
import { TouchCloseButton } from '@/components/ui/TouchCloseButton';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  thriving: Thriving;
  onSettingsUpdate: (settings: NotificationSettings) => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  thriving,
  onSettingsUpdate
}) => {
  // Initialize settings from thriving or defaults
  const [settings, setSettings] = useState<NotificationSettings>(() => 
    thriving.notificationSettings || {
      enabledWeekdays: true,
      enabledWeekends: true,
      stepNotifications: {}
    }
  );

  // Get all steps with times
  const stepsWithTime = thriving.steps
    .filter(step => step.time)
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  const handleWeekdayToggle = () => {
    setSettings(prev => ({
      ...prev,
      enabledWeekdays: !prev.enabledWeekdays
    }));
  };

  const handleWeekendToggle = () => {
    setSettings(prev => ({
      ...prev,
      enabledWeekends: !prev.enabledWeekends
    }));
  };

  const handleStepToggle = (stepId: string) => {
    setSettings(prev => ({
      ...prev,
      stepNotifications: {
        ...prev.stepNotifications,
        [stepId]: !(prev.stepNotifications?.[stepId] !== false)
      }
    }));
  };

  const handleSave = () => {
    onSettingsUpdate(settings);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50 animate-fade-in" onClick={onClose} />
      
      {/* Modal */}
      <div className="fixed inset-x-[4vw] max-inset-x-[1rem] top-[50%] -translate-y-1/2 w-[92vw] max-w-[500px] mx-auto z-50 animate-scale-in">
        <div className="bg-white rounded-[6vw] max-rounded-[1.5rem] shadow-2xl max-h-[85vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="relative bg-gradient-to-br from-sage-light/20 to-soft-lavender/20 p-[6vw] max-p-[1.5rem]">
            <TouchCloseButton onClose={onClose} size="sm" />
            
            <div className="flex items-center gap-[3vw] max-gap-[0.75rem]">
              <div className="w-[12vw] h-[12vw] max-w-[3rem] max-h-[3rem] bg-white rounded-[3vw] max-rounded-[0.75rem] flex items-center justify-center">
                <Bell className="w-[6vw] h-[6vw] max-w-[1.5rem] max-h-[1.5rem] text-sage-dark" />
              </div>
              <div>
                <h2 className="text-[min(5vw,1.25rem)] font-bold text-gray-900">
                  Notification Settings
                </h2>
                <p className="text-[min(3.5vw,0.875rem)] text-gray-600 mt-[1vw] max-mt-[0.25rem]">
                  Choose when to receive reminders
                </p>
              </div>
            </div>
          </div>
          
          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            {/* Weekday Settings */}
            <div className="p-[6vw] max-p-[1.5rem] border-b border-gray-100">
              <h3 className="text-[min(4.5vw,1.125rem)] font-semibold text-gray-900 mb-[4vw] max-mb-[1rem] flex items-center gap-[2vw] max-gap-[0.5rem]">
                <Calendar className="w-[5vw] h-[5vw] max-w-[1.25rem] max-h-[1.25rem] text-gray-500" />
                Days of Week
              </h3>
              
              <div className="space-y-[3vw] max-space-y-[0.75rem]">
                {/* Weekdays Toggle */}
                <button
                  onClick={handleWeekdayToggle}
                  className="w-full flex items-center justify-between p-[4vw] max-p-[1rem] rounded-[3vw] max-rounded-[0.75rem] bg-gray-50 hover:bg-gray-100 transition-colors touch-feedback"
                >
                  <span className="text-[min(4vw,1rem)] font-medium text-gray-700">
                    Monday - Friday
                  </span>
                  <div className={`relative inline-flex h-[6vw] w-[11vw] max-h-[1.5rem] max-w-[2.75rem] items-center rounded-full transition-colors ${
                    settings.enabledWeekdays ? 'bg-sage' : 'bg-gray-300'
                  }`}>
                    <span className={`inline-block h-[5vw] w-[5vw] max-h-[1.25rem] max-w-[1.25rem] transform rounded-full bg-white transition-transform ${
                      settings.enabledWeekdays ? 'translate-x-[5.5vw] max:translate-x-[1.375rem]' : 'translate-x-[0.5vw] max:translate-x-[0.125rem]'
                    }`} />
                  </div>
                </button>
                
                {/* Weekends Toggle */}
                <button
                  onClick={handleWeekendToggle}
                  className="w-full flex items-center justify-between p-[4vw] max-p-[1rem] rounded-[3vw] max-rounded-[0.75rem] bg-gray-50 hover:bg-gray-100 transition-colors touch-feedback"
                >
                  <span className="text-[min(4vw,1rem)] font-medium text-gray-700">
                    Saturday & Sunday
                  </span>
                  <div className={`relative inline-flex h-[6vw] w-[11vw] max-h-[1.5rem] max-w-[2.75rem] items-center rounded-full transition-colors ${
                    settings.enabledWeekends ? 'bg-sage' : 'bg-gray-300'
                  }`}>
                    <span className={`inline-block h-[5vw] w-[5vw] max-h-[1.25rem] max-w-[1.25rem] transform rounded-full bg-white transition-transform ${
                      settings.enabledWeekends ? 'translate-x-[5.5vw] max:translate-x-[1.375rem]' : 'translate-x-[0.5vw] max:translate-x-[0.125rem]'
                    }`} />
                  </div>
                </button>
              </div>
            </div>
            
            {/* Step Notifications */}
            <div className="p-[6vw] max-p-[1.5rem]">
              <h3 className="text-[min(4.5vw,1.125rem)] font-semibold text-gray-900 mb-[4vw] max-mb-[1rem] flex items-center gap-[2vw] max-gap-[0.5rem]">
                <Clock className="w-[5vw] h-[5vw] max-w-[1.25rem] max-h-[1.25rem] text-gray-500" />
                Step Reminders
              </h3>
              
              <div className="space-y-[2vw] max-space-y-[0.5rem]">
                {stepsWithTime.map((step) => {
                  const isEnabled = settings.stepNotifications?.[step.id] !== false && step.reminderEnabled !== false;
                  
                  return (
                    <button
                      key={step.id}
                      onClick={() => handleStepToggle(step.id)}
                      className="w-full flex items-center justify-between p-[3vw] max-p-[0.75rem] rounded-[2vw] max-rounded-[0.5rem] bg-gray-50 hover:bg-gray-100 transition-colors touch-feedback"
                    >
                      <div className="flex items-center gap-[3vw] max-gap-[0.75rem] flex-1">
                        <div className={`w-[8vw] h-[8vw] max-w-[2rem] max-h-[2rem] rounded-[2vw] max-rounded-[0.5rem] flex items-center justify-center ${
                          isEnabled ? 'bg-sage-light/30' : 'bg-gray-200'
                        }`}>
                          {isEnabled ? (
                            <Bell className="w-[4vw] h-[4vw] max-w-[1rem] max-h-[1rem] text-sage-dark" />
                          ) : (
                            <BellOff className="w-[4vw] h-[4vw] max-w-[1rem] max-h-[1rem] text-gray-400" />
                          )}
                        </div>
                        
                        <div className="flex-1 text-left">
                          <p className={`text-[min(3.5vw,0.875rem)] font-medium ${
                            isEnabled ? 'text-gray-900' : 'text-gray-500'
                          }`}>
                            {step.time}
                          </p>
                          <p className={`text-[min(3vw,0.75rem)] ${
                            isEnabled ? 'text-gray-600' : 'text-gray-400'
                          }`}>
                            {step.title}
                          </p>
                        </div>
                      </div>
                      
                      <div className={`relative inline-flex h-[5vw] w-[9vw] max-h-[1.25rem] max-w-[2.25rem] items-center rounded-full transition-colors ${
                        isEnabled ? 'bg-sage' : 'bg-gray-300'
                      }`}>
                        <span className={`inline-block h-[4vw] w-[4vw] max-h-[1rem] max-w-[1rem] transform rounded-full bg-white transition-transform ${
                          isEnabled ? 'translate-x-[4.5vw] max:translate-x-[1.125rem]' : 'translate-x-[0.5vw] max:translate-x-[0.125rem]'
                        }`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="border-t border-gray-100 p-[6vw] max-p-[1.5rem]">
            <button
              onClick={handleSave}
              className="w-full py-[4vw] max-py-[1rem] rounded-[4vw] max-rounded-[1rem] bg-gradient-to-r from-sage to-sage-dark text-white text-[min(4vw,1rem)] font-semibold hover:shadow-lg transition-all touch-feedback touch-manipulation"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </>
  );
};