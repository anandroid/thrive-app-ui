'use client';

import React, { useState } from 'react';
import { Bell, Clock, ChevronRight, Calendar } from 'lucide-react';
import { Thriving, NotificationSettings } from '@/src/types/thriving';
import { NotificationSettingsModal } from './NotificationSettingsModal';

interface ThrivingNotificationCardProps {
  thriving: Thriving;
  onSettingsUpdate?: (settings: NotificationSettings) => void;
}

export const ThrivingNotificationCard: React.FC<ThrivingNotificationCardProps> = ({
  thriving,
  onSettingsUpdate
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get all step times from the thriving
  const stepTimes = thriving.steps
    .filter(step => step.time)
    .map(step => ({
      id: step.id,
      time: step.time!,
      title: step.title,
      enabled: step.reminderEnabled !== false
    }))
    .sort((a, b) => a.time.localeCompare(b.time));

  // Get notification settings with defaults
  const settings = thriving.notificationSettings || {
    enabledWeekdays: true,
    enabledWeekends: true,
    stepNotifications: {}
  };

  // Count enabled notifications
  const enabledCount = stepTimes.filter(st => 
    settings.stepNotifications?.[st.id] !== false && st.enabled
  ).length;

  const handleSettingsUpdate = (newSettings: NotificationSettings) => {
    onSettingsUpdate?.(newSettings);
    setIsModalOpen(false);
  };

  if (stepTimes.length === 0) {
    return null; // Don't show card if no step times
  }

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className="bg-gradient-to-r from-sage-light/20 to-soft-lavender/20 rounded-[4vw] max-rounded-[1rem] p-[4vw] max-p-[1rem] mb-[4vw] max-mb-[1rem] cursor-pointer hover:shadow-md transition-shadow touch-feedback"
      >
        <div className="flex items-center justify-between mb-[3vw] max-mb-[0.75rem]">
          <div className="flex items-center gap-[3vw] max-gap-[0.75rem]">
            <div className="w-[10vw] h-[10vw] max-w-[2.5rem] max-h-[2.5rem] bg-white rounded-[2.5vw] max-rounded-[0.625rem] flex items-center justify-center">
              <Bell className="w-[5vw] h-[5vw] max-w-[1.25rem] max-h-[1.25rem] text-sage-dark" />
            </div>
            <div>
              <h3 className="text-[min(4.5vw,1.125rem)] font-semibold text-gray-900">
                Reminders
              </h3>
              <p className="text-[min(3.5vw,0.875rem)] text-gray-600">
                {enabledCount} of {stepTimes.length} active
              </p>
            </div>
          </div>
          <ChevronRight className="w-[5vw] h-[5vw] max-w-[1.25rem] max-h-[1.25rem] text-gray-400" />
        </div>

        {/* Time pills */}
        <div className="flex flex-wrap gap-[2vw] max-gap-[0.5rem]">
          {stepTimes.slice(0, 4).map((stepTime) => {
            const isEnabled = settings.stepNotifications?.[stepTime.id] !== false && stepTime.enabled;
            return (
              <div
                key={stepTime.id}
                className={`flex items-center gap-[1.5vw] max-gap-[0.375rem] px-[3vw] max-px-[0.75rem] py-[1.5vw] max-py-[0.375rem] rounded-full text-[min(3.5vw,0.875rem)] ${
                  isEnabled
                    ? 'bg-sage-light/30 text-sage-dark'
                    : 'bg-gray-100 text-gray-400 line-through'
                }`}
              >
                <Clock className="w-[3.5vw] h-[3.5vw] max-w-[0.875rem] max-h-[0.875rem]" />
                <span>{stepTime.time}</span>
              </div>
            );
          })}
          {stepTimes.length > 4 && (
            <div className="px-[3vw] max-px-[0.75rem] py-[1.5vw] max-py-[0.375rem] rounded-full bg-gray-100 text-gray-500 text-[min(3.5vw,0.875rem)]">
              +{stepTimes.length - 4} more
            </div>
          )}
        </div>

        {/* Weekday settings preview */}
        <div className="flex items-center gap-[3vw] max-gap-[0.75rem] mt-[3vw] max-mt-[0.75rem]">
          <Calendar className="w-[3.5vw] h-[3.5vw] max-w-[0.875rem] max-h-[0.875rem] text-gray-500" />
          <span className="text-[min(3.5vw,0.875rem)] text-gray-600">
            {settings.enabledWeekdays && settings.enabledWeekends && 'Every day'}
            {settings.enabledWeekdays && !settings.enabledWeekends && 'Weekdays only'}
            {!settings.enabledWeekdays && settings.enabledWeekends && 'Weekends only'}
            {!settings.enabledWeekdays && !settings.enabledWeekends && 'Notifications paused'}
          </span>
        </div>
      </div>

      {/* Settings Modal */}
      <NotificationSettingsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        thriving={thriving}
        onSettingsUpdate={handleSettingsUpdate}
      />
    </>
  );
};