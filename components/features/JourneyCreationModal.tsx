'use client';

import React, { useState } from 'react';
import { X, Edit3, AlertCircle, Target, BookOpen } from 'lucide-react';
import { ActionableItem } from '@/src/services/openai/types';
import { WellnessJourney, JourneyType } from '@/src/services/openai/types/journey';
import { LoadingButton } from '@/components/ui/LoadingButton';
import { Modal } from '@/components/ui/Modal';
import bridge from '@/src/lib/react-native-bridge';

interface JourneyCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  journeyData: ActionableItem;
  healthConcern: string;
  onJourneyCreated: (journey: WellnessJourney) => void;
}

const journeyTypeConfig: Record<string, { 
  type: JourneyType; 
  icon: React.FC<{ className?: string }>; 
  description: string 
}> = {
  'pain_journey': {
    type: 'pain',
    icon: AlertCircle,
    description: 'Track pain levels, triggers, and management strategies'
  },
  'mental_health_journey': {
    type: 'mental_health',
    icon: BookOpen,
    description: 'Monitor mood, emotions, and mental wellness'
  },
  'chronic_condition_journey': {
    type: 'chronic_condition',
    icon: Target,
    description: 'Manage symptoms and track condition progress'
  },
  'wellness_journey': {
    type: 'wellness_general',
    icon: BookOpen,
    description: 'General wellness and health tracking'
  }
};

export const JourneyCreationModal: React.FC<JourneyCreationModalProps> = ({
  isOpen,
  onClose,
  journeyData,
  healthConcern,
  onJourneyCreated
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [goals, setGoals] = useState<string[]>(['']);
  const [specificCondition, setSpecificCondition] = useState('');
  const [painIntensity, setPainIntensity] = useState(5); // For pain journey

  // Determine journey type from actionable item
  const journeyTypeKey = journeyData.journey_type || 'wellness_journey';
  const journeyConfig = journeyTypeConfig[journeyTypeKey] || journeyTypeConfig['wellness_journey'];
  const Icon = journeyConfig.icon;

  const handleCreateJourney = async () => {
    setIsCreating(true);

    try {
      const response = await fetch('/api/journey/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          journeyType: journeyConfig.type,
          healthConcern: journeyData.description || healthConcern,
          specificCondition: specificCondition || undefined,
          goals: goals.filter(g => g.trim()),
          painIntensity: journeyConfig.type === 'pain' ? painIntensity : undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create journey');
      }

      const journey = await response.json();
      onJourneyCreated(journey);
      
      // Notify React Native that a thriving was created
      bridge.notifyThrivingCreated();
    } catch (error) {
      console.error('Error creating journey:', error);
      alert('Failed to create journey. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const addGoal = () => {
    setGoals([...goals, '']);
  };

  const updateGoal = (index: number, value: string) => {
    const newGoals = [...goals];
    newGoals[index] = value;
    setGoals(newGoals);
  };

  const removeGoal = (index: number) => {
    setGoals(goals.filter((_, i) => i !== index));
  };

  const modalHeader = (
    <div className="flex items-center space-x-3">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sage-300 to-sage-400 flex items-center justify-center">
        <Edit3 className="w-6 h-6 text-white" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-primary-text">Create a Journey</h2>
        <p className="text-sm text-secondary-text-thin">Your wellness journal</p>
      </div>
    </div>
  );

  const modalFooter = (
    <div className="space-y-3">
      <LoadingButton
        onClick={handleCreateJourney}
        isLoading={isCreating}
        disabled={isCreating}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-sage-400 to-sage-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all touch-feedback touch-manipulation"
        loadingMessages={[
          'Creating Journal...',
          'Setting up your wellness space...',
          'Preparing tracking tools...',
          'Adding insights features...',
          'Personalizing experience...',
          'Almost ready...'
        ]}
        messageInterval={2500}
      >
        Create My Journal
      </LoadingButton>
      
      <button
        onClick={onClose}
        className="w-full py-3 rounded-2xl text-secondary-text hover:bg-gray-50 transition-colors touch-feedback touch-manipulation"
      >
        Cancel
      </button>
    </div>
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
            {/* Journey Type Info */}
            <div className="rounded-2xl bg-gradient-to-br from-sage-300/10 to-sage-400/5 p-5 border border-sage-400/20">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sage-300 to-sage-400 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-primary-text mb-1">
                    {journeyData.title}
                  </h3>
                  <p className="text-sm text-secondary-text-thin">
                    {journeyConfig.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Condition Input (for chronic conditions) */}
            {journeyConfig.type === 'chronic_condition' && (
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-2">
                  Specific Condition (Optional)
                </label>
                <input
                  type="text"
                  value={specificCondition}
                  onChange={(e) => setSpecificCondition(e.target.value)}
                  placeholder="e.g., Diabetes, Arthritis, IBS..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sage-400 focus:ring-2 focus:ring-sage-400/20 transition-all"
                />
              </div>
            )}

            {/* Pain Intensity Slider (for pain journeys) */}
            {journeyConfig.type === 'pain' && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-secondary-text">
                  Current Pain Intensity
                </label>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs text-gray-500">No Pain</span>
                    <span className="text-2xl font-bold text-rose-500">{painIntensity}</span>
                    <span className="text-xs text-gray-500">Worst Pain</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={painIntensity}
                    onChange={(e) => setPainIntensity(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #10b981 0%, #f59e0b 50%, #ef4444 100%)`
                    }}
                  />
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-gray-400">0</span>
                    <span className="text-xs text-gray-400">5</span>
                    <span className="text-xs text-gray-400">10</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    This helps us personalize your pain management journey
                  </p>
                </div>
              </div>
            )}

            {/* Goals */}
            <div>
              <label className="block text-sm font-medium text-secondary-text mb-3">
                What are your goals for this journey?
              </label>
              <div className="space-y-3">
                {goals.map((goal, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={goal}
                      onChange={(e) => updateGoal(index, e.target.value)}
                      placeholder={`Goal ${index + 1}`}
                      className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-sage-400 focus:ring-2 focus:ring-sage-400/20 transition-all"
                    />
                    {goals.length > 1 && (
                      <button
                        onClick={() => removeGoal(index)}
                        className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors touch-feedback touch-manipulation"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={addGoal}
                className="mt-3 text-sm text-sage-400 hover:text-sage-600 transition-colors"
              >
                + Add another goal
              </button>
            </div>

            {/* What is a Journey? */}
            <div className="rounded-xl bg-gradient-to-br from-sage-300/10 to-sage-400/5 p-4 border border-sage-400/20">
              <h4 className="text-sm font-semibold text-primary-text mb-2">
                What is a Journey?
              </h4>
              <p className="text-xs text-secondary-text-thin leading-relaxed">
                A Journey is your personal wellness journal where you&apos;ll track daily check-ins, 
                mood changes, and symptoms. Over time, you&apos;ll discover patterns and insights 
                that help you better understand and manage your health.
              </p>
            </div>

            {/* Description */}
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-secondary-text-thin leading-relaxed">
                {journeyData.description || 
                 'This journey will help you track your progress, identify patterns, and work towards better health outcomes.'}
              </p>
            </div>
      </div>
    </Modal>
  );
};