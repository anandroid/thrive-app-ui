'use client';

import React, { useState } from 'react';
import { Bell, BellOff, Calendar, Clock } from 'lucide-react';
import { Thriving, NotificationSettings } from '@/src/types/thriving';
import { Modal } from '@/components/ui/Modal';

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

  const modalHeader = (
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 bg-gradient-to-br from-zen-100 to-zen-200 rounded-xl flex items-center justify-center">
        <Bell className="w-6 h-6 text-zen-600" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          Notification Settings
        </h2>
        <p className="text-sm text-gray-600">
          Choose when to receive reminders
        </p>
      </div>
    </div>
  );

  const modalFooter = (
    <button
      onClick={handleSave}
      className="w-full py-3 rounded-xl bg-gradient-to-r from-zen-400 to-zen-600 text-white font-semibold hover:shadow-lg transition-all touch-feedback touch-manipulation"
    >
      Save Settings
    </button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      header={modalHeader}
      footer={modalFooter}
      size="lg"
      className="max-w-lg"
    >
      <div className="space-y-6">
        {/* Weekday Settings */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            Days of Week
          </h3>
          
          <div className="space-y-3">
            {/* Weekdays Toggle */}
            <button
              onClick={handleWeekdayToggle}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors touch-feedback"
            >
              <span className="text-base font-medium text-gray-700">
                Monday - Friday
              </span>
              <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.enabledWeekdays ? 'bg-zen-400' : 'bg-gray-300'
              }`}>
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  settings.enabledWeekdays ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </div>
            </button>
            
            {/* Weekends Toggle */}
            <button
              onClick={handleWeekendToggle}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors touch-feedback"
            >
              <span className="text-base font-medium text-gray-700">
                Saturday & Sunday
              </span>
              <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.enabledWeekends ? 'bg-zen-400' : 'bg-gray-300'
              }`}>
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  settings.enabledWeekends ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </div>
            </button>
          </div>
        </div>
        
        {/* Step Notifications */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-500" />
            Step Reminders
          </h3>
          
          <div className="space-y-2">
            {stepsWithTime.map((step) => {
              const isEnabled = settings.stepNotifications?.[step.id] !== false && step.reminderEnabled !== false;
              
              return (
                <button
                  key={step.id}
                  onClick={() => handleStepToggle(step.id)}
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors touch-feedback"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isEnabled ? 'bg-zen-300/30' : 'bg-gray-200'
                    }`}>
                      {isEnabled ? (
                        <Bell className="w-4 h-4 text-zen-600" />
                      ) : (
                        <BellOff className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    
                    <div className="flex-1 text-left">
                      <p className={`text-sm font-medium ${
                        isEnabled ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {step.time}
                      </p>
                      <p className={`text-xs ${
                        isEnabled ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        {step.title}
                      </p>
                    </div>
                  </div>
                  
                  <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    isEnabled ? 'bg-zen-400' : 'bg-gray-300'
                  }`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isEnabled ? 'translate-x-5' : 'translate-x-0.5'
                        }`} />
                      </div>
                    </button>
                  );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
};