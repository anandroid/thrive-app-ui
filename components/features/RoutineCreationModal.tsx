'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, Moon, Sun, Info } from 'lucide-react';
import { ActionableItem, WellnessRoutine } from '@/src/services/openai/types';
import { LoadingButton } from '@/components/ui/LoadingButton';
import bridge from '@/src/lib/react-native-bridge';

interface RoutineModalData {
  title?: string;
  description?: string;
  modalTitle?: string;
  modalDescription?: string;
  duration?: string;
  frequency?: string;
  customInstructionsPlaceholder?: string;
  routineType?: string;
}

interface RoutineCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  routineData: ActionableItem;
  healthConcern?: string;
  onRoutineCreated: (routine: WellnessRoutine) => void;
}

export const RoutineCreationModal: React.FC<RoutineCreationModalProps> = ({
  isOpen,
  onClose,
  routineData,
  healthConcern,
  onRoutineCreated
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDuration, setSelectedDuration] = useState('7_days');
  const [sleepTime, setSleepTime] = useState('22:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [customInstructions, setCustomInstructions] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Parse routine data from the AI response
  const modalData: RoutineModalData = {
    modalTitle: routineData.modalTitle || routineData.title || 'Create Your Healing Routine',
    modalDescription: routineData.modalDescription || routineData.description || 'A personalized routine tailored to your needs',
    duration: routineData.duration || '7_days',
    frequency: routineData.frequency || 'daily',
    customInstructionsPlaceholder: routineData.customInstructionsPlaceholder || 'Add any specific preferences or limitations...',
    routineType: routineData.routineType || 'wellness_routine'
  };

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setSelectedDuration('7_days');
      setCustomInstructions('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreate = async () => {
    setIsCreating(true);

    try {
      const response = await fetch('/api/routine/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routineType: modalData.routineType,
          healthConcern: healthConcern || routineData.description,
          customInstructions: customInstructions.trim() || undefined,
          frequency: modalData.frequency,
          duration: selectedDuration,
          userPreferences: {
            sleepSchedule: {
              bedtime: sleepTime,
              wakeTime: wakeTime
            },
            availableTime: selectedDuration === '7_days' ? 20 : 30
          }
        })
      });

      if (!response.ok) throw new Error('Failed to create routine');

      const routine = await response.json();
      onRoutineCreated(routine);
      
      // Notify React Native that a thriving was created
      bridge.notifyThrivingCreated();
    } catch (error) {
      console.error('Error creating routine:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {modalData.modalTitle}
              </h2>
              <p className="text-gray-600">
                {modalData.modalDescription}
              </p>
            </div>

            {/* Health Concern Display */}
            <div className="mb-6 p-4 bg-gray-50 rounded-xl">
              <p className="text-sm font-medium text-gray-700 mb-1">Your Current Focus 🎯</p>
              <p className="text-gray-900">{healthConcern || routineData.description}</p>
            </div>

            {/* Duration Selection */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Duration</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSelectedDuration('7_days')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedDuration === '7_days'
                      ? 'border-rose bg-rose/5 text-gray-900'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="text-2xl font-bold">7</div>
                  <div className="text-sm">DAYS</div>
                </button>
                <button
                  onClick={() => setSelectedDuration('14_days')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedDuration === '14_days'
                      ? 'border-rose bg-rose/5 text-gray-900'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="text-2xl font-bold">14</div>
                  <div className="text-sm">DAYS</div>
                </button>
                <button
                  onClick={() => setSelectedDuration('30_days')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedDuration === '30_days'
                      ? 'border-rose bg-rose/5 text-gray-900'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="text-2xl font-bold">30</div>
                  <div className="text-sm">DAYS</div>
                </button>
                <button
                  onClick={() => setSelectedDuration('until_better')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedDuration === 'until_better'
                      ? 'border-rose bg-rose/5 text-gray-900'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="text-2xl font-bold">∞</div>
                  <div className="text-sm">UNTIL BETTER</div>
                </button>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-full text-gray-700 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => setCurrentStep(2)}
                className="px-6 py-3 rounded-full bg-primary-text text-white hover:opacity-90 transition-all"
              >
                Continue
              </button>
            </div>
          </>
        );

      case 2:
        return (
          <>
            <div className="mb-6">
              <button
                onClick={() => setCurrentStep(1)}
                className="text-gray-600 hover:text-gray-900 transition-colors mb-4"
              >
                ← Back
              </button>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Your Sleep Schedule 😴
              </h2>
              <p className="text-gray-600">
                This helps us schedule activities at the right times
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Moon className="w-4 h-4 inline mr-1" />
                  Bedtime
                </label>
                <input
                  type="time"
                  value={sleepTime}
                  onChange={(e) => setSleepTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-rose focus:ring-2 focus:ring-rose/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Sun className="w-4 h-4 inline mr-1" />
                  Wake Time
                </label>
                <input
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-rose focus:ring-2 focus:ring-rose/20 transition-all"
                />
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-6 py-3 rounded-full text-gray-700 hover:bg-gray-50 transition-all"
              >
                Back
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                className="px-6 py-3 rounded-full bg-primary-text text-white hover:opacity-90 transition-all"
              >
                Continue
              </button>
            </div>
          </>
        );

      case 3:
        return (
          <>
            <div className="mb-6">
              <button
                onClick={() => setCurrentStep(2)}
                className="text-gray-600 hover:text-gray-900 transition-colors mb-4"
              >
                ← Back
              </button>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Your Personal Touch ✨
              </h2>
              <p className="text-gray-600">
                Help us customize your routine
              </p>
            </div>

            <div className="mb-6">
              <textarea
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder={modalData.customInstructionsPlaceholder}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-rose focus:ring-2 focus:ring-rose/20 transition-all min-h-[120px] resize-none"
              />
            </div>

            {/* Smart Reminders Info */}
            <div className="mb-6 p-4 bg-blue-50 rounded-xl">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">
                    Smart Reminders
                  </h4>
                  <p className="text-xs text-gray-600">
                    I&apos;ll determine the best reminder frequency based on your health needs and your schedule.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-full text-gray-700 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <LoadingButton
                onClick={handleCreate}
                isLoading={isCreating}
                disabled={isCreating}
                className="px-6 py-3 rounded-full bg-primary-text text-white hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px]"
                loadingMessages={[
                  'Creating...',
                  'Analyzing needs...',
                  'Personalizing...',
                  'Adding wisdom...',
                  'Optimizing schedule...',
                  'Almost ready...'
                ]}
                messageInterval={2500}
              >
                <>
                  Create Routine
                  <Sparkles className="w-4 h-4 ml-2 inline" />
                </>
              </LoadingButton>
            </div>
          </>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Fixed header with close button */}
        <div className="absolute top-0 right-0 p-4 z-10">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center hover:bg-white transition-all duration-200 shadow-lg touch-feedback touch-manipulation cursor-pointer active:scale-95 active:bg-gray-100"
            aria-label="Close modal"
            type="button"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>
        </div>
        
        {/* Modal content */}
        <div className="max-h-[90vh] overflow-y-auto p-6">
          {renderStepContent()}
        </div>
      </div>
    </div>
  );
};