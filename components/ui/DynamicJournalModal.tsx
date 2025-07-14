'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Brain, TrendingUp, Calendar } from 'lucide-react';
import { 
  DynamicJournalTemplate, 
  JournalEntry, 
  JournalPrompt,
  Thriving,
  UserLearningProfile
} from '@/src/types/thriving';
import { JournalInsightsEngine } from '@/src/lib/journalInsights';
import { UserLearningProfileManager } from '@/src/lib/userLearningProfile';
import { DynamicJournalField } from './DynamicJournalField';
import { JournalPromptCard } from './JournalPromptCard';
import { Modal } from './Modal';
import { addJournalEntry, getJournalByThrivingId } from '@/src/utils/thrivingStorage';

interface DynamicJournalModalProps {
  thriving: Thriving;
  isOpen: boolean;
  onClose: () => void;
}

export function DynamicJournalModal({ thriving, isOpen, onClose }: DynamicJournalModalProps) {
  const [currentStep, setCurrentStep] = useState<'fields' | 'prompts' | 'insights'>('fields');
  const [fieldValues, setFieldValues] = useState<Record<string, unknown>>({});
  const [selectedPrompts, setSelectedPrompts] = useState<JournalPrompt[]>([]);
  const [promptResponses, setPromptResponses] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [journalTemplate, setJournalTemplate] = useState<DynamicJournalTemplate | null>(null);
  const [userProfile, setUserProfile] = useState<UserLearningProfile | null>(null);
  const [contextualPrompts, setContextualPrompts] = useState<string[]>([]);

  const initializeJournal = useCallback(async () => {
    // Get user learning profile
    const profile = UserLearningProfileManager.getUserProfile();
    setUserProfile(profile);

    // Get or create journal template
    let template = thriving.journalTemplate;
    if (!template) {
      // Create dynamic template based on routine type and user profile
      template = JournalInsightsEngine.createDynamicTemplate(thriving, profile);
    }
    setJournalTemplate(template);

    // Generate contextual prompts based on user patterns
    const journal = getJournalByThrivingId(thriving.id);
    const recentEntries = journal?.entries.slice(-10) || [];
    
    if (profile.dataPoints > 5) {
      const contextPrompts = UserLearningProfileManager.generateContextualPrompts(
        profile, 
        thriving, 
        recentEntries
      );
      setContextualPrompts(contextPrompts);
    }

    // Select personalized prompts
    const personalizedPrompts = JournalInsightsEngine.generatePersonalizedPrompts(
      thriving,
      profile,
      recentEntries
    );
    setSelectedPrompts(personalizedPrompts.slice(0, 3)); // Top 3 prompts
  }, [thriving]);

  useEffect(() => {
    if (isOpen && thriving) {
      initializeJournal();
    }
  }, [isOpen, thriving, initializeJournal]);

  const handleFieldChange = (fieldId: string, value: unknown) => {
    setFieldValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handlePromptResponse = (promptId: string, response: string) => {
    setPromptResponses(prev => ({
      ...prev,
      [promptId]: response
    }));
  };

  const handleNext = () => {
    if (currentStep === 'fields') {
      setCurrentStep('prompts');
    } else if (currentStep === 'prompts') {
      setCurrentStep('insights');
    }
  };

  const handleBack = () => {
    if (currentStep === 'prompts') {
      setCurrentStep('fields');
    } else if (currentStep === 'insights') {
      setCurrentStep('prompts');
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Create journal entry with dynamic data
      const entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'> = {
        thrivingId: thriving.id,
        date: new Date().toISOString().split('T')[0],
        content: promptResponses[selectedPrompts[0]?.id] || '',
        customData: {
          ...fieldValues,
          promptResponses,
          routineVersion: thriving.version,
          templateVersion: journalTemplate?.version
        },
        routineVersion: thriving.version
      };

      // Add mood from field values if present
      if (fieldValues.mood) {
        entry.mood = fieldValues.mood as JournalEntry['mood'];
      }

      // Add pain level from field values if present
      if (fieldValues.pain_level) {
        entry.painLevel = Number(fieldValues.pain_level);
      }

      // Save journal entry
      addJournalEntry(thriving.id, entry);

      // Update user learning profile with new data
      const journal = getJournalByThrivingId(thriving.id);
      if (journal) {
        UserLearningProfileManager.updateProfileFromJournalEntries(
          journal.entries,
          [thriving]
        );
      }

      onClose();
    } catch (error) {
      console.error('Error saving journal entry:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRequiredFields = () => {
    return journalTemplate?.customFields.filter(field => field.required) || [];
  };

  const isStepComplete = () => {
    if (currentStep === 'fields') {
      const requiredFields = getRequiredFields();
      return requiredFields.every(field => 
        fieldValues[field.id] !== undefined && fieldValues[field.id] !== ''
      );
    }
    if (currentStep === 'prompts') {
      return selectedPrompts.length === 0 || 
             selectedPrompts.some(prompt => promptResponses[prompt.id]?.trim());
    }
    return true;
  };

  const getStepProgress = () => {
    const steps = ['fields', 'prompts', 'insights'];
    const currentIndex = steps.indexOf(currentStep);
    return ((currentIndex + 1) / steps.length) * 100;
  };

  const modalHeader = (
    <div className="w-full">
      {/* Content */}
      <div className="relative">
        <div className="flex items-center space-x-[min(3vw,0.75rem)]">
          <div className="w-[min(10vw,2.5rem)] h-[min(10vw,2.5rem)] rounded-2xl bg-gradient-to-br from-[#daa0a9] to-[#fb7185] flex items-center justify-center">
            <Brain className="w-[min(5vw,1.25rem)] h-[min(5vw,1.25rem)] text-white" />
          </div>
          <div>
            <h2 className="text-[min(5vw,1.25rem)] font-semibold text-gray-900">Smart Journal</h2>
            <p className="text-[min(3.5vw,0.875rem)] text-gray-600">{thriving.title}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-[min(4vw,1rem)]">
          <div className="flex justify-between text-[min(3vw,0.75rem)] text-gray-500 mb-[min(2vw,0.5rem)]">
            <span className={currentStep === 'fields' ? 'text-[#daa0a9] font-medium' : ''}>
              Track Progress
            </span>
            <span className={currentStep === 'prompts' ? 'text-[#daa0a9] font-medium' : ''}>
              Reflect
            </span>
            <span className={currentStep === 'insights' ? 'text-[#daa0a9] font-medium' : ''}>
              Insights
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-[min(2vw,0.5rem)]">
            <div 
              className="bg-gradient-to-r from-[#daa0a9] to-[#fb7185] h-full rounded-full transition-all duration-500"
              style={{ width: `${getStepProgress()}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const modalFooter = (
    <div className="flex space-x-3">
      {currentStep !== 'fields' && (
        <button
          onClick={handleBack}
          className="flex-1 py-[min(3vw,0.75rem)] px-[min(5vw,1rem)] rounded-2xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors touch-feedback touch-manipulation"
        >
          Back
        </button>
      )}
      
      {currentStep !== 'insights' ? (
        <button
          onClick={handleNext}
          disabled={!isStepComplete()}
          className="flex-1 py-[min(3vw,0.75rem)] px-[min(5vw,1rem)] rounded-2xl bg-gradient-to-r from-[#daa0a9] to-[#fb7185] text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all touch-feedback touch-manipulation"
        >
          {currentStep === 'fields' ? 'Continue' : 'Next'}
        </button>
      ) : (
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !isStepComplete()}
          className="flex-1 py-[min(3vw,0.75rem)] px-[min(5vw,1rem)] rounded-2xl bg-gradient-to-r from-sage to-sage-dark text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all touch-feedback touch-manipulation"
        >
          {isSubmitting ? 'Saving...' : 'Save Entry'}
        </button>
      )}
    </div>
  );

  if (!journalTemplate) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      header={modalHeader}
      footer={modalFooter}
      size="lg"
    >

      {/* Fields Step */}
      {currentStep === 'fields' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  How are you feeling?
                </h3>
                <p className="text-sm text-gray-600">
                  Track your progress with personalized metrics
                </p>
              </div>

              {journalTemplate.customFields.map((field) => (
                <DynamicJournalField
                  key={field.id}
                  field={field}
                  value={fieldValues[field.id]}
                  onChange={(value) => handleFieldChange(field.id, value)}
                />
              ))}

              {/* Show contextual hints based on user patterns */}
              {userProfile && userProfile.dataPoints > 10 && (
                <div className="mt-6 p-[min(5vw,1rem)] bg-gradient-to-r from-sage-light/10 to-sage/5 rounded-2xl border border-sage-light/20">
                  <div className="flex items-start space-x-3">
                    <TrendingUp className="w-5 h-5 text-sage-dark mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-sage-dark text-sm">Your Pattern</h4>
                      <p className="text-xs text-gray-600 mt-1">
                        Based on {userProfile.dataPoints} journal entries, we&apos;ve learned your patterns to make tracking more helpful.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Prompts Step */}
          {currentStep === 'prompts' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Let&apos;s reflect together
                </h3>
                <p className="text-sm text-gray-600">
                  {contextualPrompts.length > 0 
                    ? "These questions are personalized based on your patterns"
                    : "Answer any questions that resonate with you today"
                  }
                </p>
              </div>

              {selectedPrompts.map((prompt) => (
                <JournalPromptCard
                  key={prompt.id}
                  prompt={prompt}
                  response={promptResponses[prompt.id] || ''}
                  onChange={(response) => handlePromptResponse(prompt.id, response)}
                  userProfile={userProfile}
                />
              ))}

              {/* Show contextual prompts from learning */}
              {contextualPrompts.length > 0 && (
                <div className="mt-6 p-[min(5vw,1rem)] bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                  <h4 className="font-medium text-blue-900 text-sm mb-2 flex items-center">
                    <Brain className="w-4 h-4 mr-2" />
                    Smart Suggestions
                  </h4>
                  <div className="space-y-2">
                    {contextualPrompts.slice(0, 2).map((prompt, index) => (
                      <p key={index} className="text-xs text-blue-700 bg-blue-50 p-[min(3vw,0.5rem)] rounded-lg">
                        💡 {prompt}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Insights Step */}
          {currentStep === 'insights' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Ready to save your entry
                </h3>
                <p className="text-sm text-gray-600">
                  Your insights will help us personalize future experiences
                </p>
              </div>

              {/* Summary of what was tracked */}
              <div className="bg-gray-50 rounded-2xl p-[min(5vw,1rem)]">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Today&apos;s Entry Summary
                </h4>
                
                <div className="space-y-2">
                  {Object.entries(fieldValues).map(([fieldId, value]) => {
                    const field = journalTemplate.customFields.find(f => f.id === fieldId);
                    if (!field || value === undefined || value === '') return null;
                    
                    return (
                      <div key={fieldId} className="flex justify-between text-sm">
                        <span className="text-gray-600">{field.label}:</span>
                        <span className="font-medium text-gray-900">
                          {field.type === 'rating_scale' || field.type === 'pain_scale' 
                            ? `${value}/10` 
                            : String(value)
                          }
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Show learning preview if enough data */}
              {userProfile && userProfile.dataPoints >= 5 && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-[min(5vw,1rem)] border border-emerald-100">
                  <h4 className="font-medium text-emerald-900 mb-2 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Your Progress Insights
                  </h4>
                  <p className="text-xs text-emerald-700">
                    We&apos;re tracking patterns to make your journal more helpful. 
                    After {userProfile.dataPoints} entries, your insights are {Math.round(userProfile.confidenceLevel * 100)}% confident.
                  </p>
                </div>
              )}
        </div>
      )}
    </Modal>
  );
}