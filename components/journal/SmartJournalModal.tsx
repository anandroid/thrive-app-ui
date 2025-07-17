'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { SmartJournalField } from './SmartJournalField';
import { LoadingButton } from '@/components/ui/LoadingButton';
import Button from '@/components/ui/Button';
import { Thriving } from '@/src/types/thriving';
import { JournalFieldValue, SmartJournalEntry } from '@/src/types/journal-inputs';
// import { useRouter } from 'next/navigation';
import { Sparkles, BookOpen, ChevronRight } from 'lucide-react';

interface SmartJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  thriving: Thriving;
  onSave?: (entry: SmartJournalEntry) => void;
  previousEntry?: SmartJournalEntry;
}

export function SmartJournalModal({ 
  isOpen, 
  onClose, 
  thriving,
  onSave,
  previousEntry
}: SmartJournalModalProps) {
  const [fieldValues, setFieldValues] = useState<Record<string, JournalFieldValue>>({});
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInsight, setShowInsight] = useState(false);
  const [aiInsight, setAiInsight] = useState('');
  // const router = useRouter();

  const template = thriving.journalTemplate;
  const fields = template?.customFields || [];
  const currentField = fields[currentFieldIndex];
  
  // Debug: Log what we receive
  console.log('SmartJournalModal:', {
    thrivingId: thriving.id,
    thrivingTitle: thriving.title,
    hasTemplate: !!template,
    templateType: template?.journalType,
    fieldsCount: fields.length,
    template: template
  });

  // Initialize with previous values if available
  useEffect(() => {
    if (previousEntry?.fieldValues) {
      setFieldValues(previousEntry.fieldValues);
    }
  }, [previousEntry]);

  const handleFieldChange = (fieldId: string, value: JournalFieldValue) => {
    setFieldValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleNext = () => {
    if (currentFieldIndex < fields.length - 1) {
      setCurrentFieldIndex(currentFieldIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentFieldIndex > 0) {
      setCurrentFieldIndex(currentFieldIndex - 1);
    }
  };

  const canProceed = () => {
    if (!currentField) return false;
    const value = fieldValues[currentField.id];
    
    if (currentField.required && !value) return false;
    if (Array.isArray(value) && value.length === 0 && currentField.required) return false;
    
    return true;
  };

  const allFieldsComplete = () => {
    return fields.every(field => {
      if (!field.required) return true;
      const value = fieldValues[field.id];
      if (!value) return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    });
  };

  const handleSubmit = async () => {
    if (!allFieldsComplete()) return;
    
    setIsSubmitting(true);
    try {
      // Generate AI insight based on the entry
      const insight = await generateInsight();
      setAiInsight(insight);
      setShowInsight(true);
      
      // Save the journal entry
      const entry: SmartJournalEntry = {
        id: `entry-${Date.now()}`,
        thrivingId: thriving.id,
        date: new Date().toISOString(),
        fieldValues,
        aiInsight: insight,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      if (onSave) {
        onSave(entry);
      }
      
      // Show insight for 3 seconds then close
      setTimeout(() => {
        onClose();
        setFieldValues({});
        setCurrentFieldIndex(0);
        setShowInsight(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error saving journal entry:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateInsight = async (): Promise<string> => {
    try {
      const response = await fetch('/api/journal/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entry: {
            fieldValues,
            date: new Date().toISOString(),
          },
          thriving: {
            title: thriving.title,
            type: thriving.type,
            journalTemplate: thriving.journalTemplate,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate insight');
      }

      const data = await response.json();
      return data.insight;
    } catch (error) {
      console.error('Error generating insight:', error);
      // Fallback insight
      return "Great job tracking today! Your consistency in journaling helps identify patterns that support your wellness journey. Keep it up! 🌟";
    }
  };

  if (!template || fields.length === 0) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Journal Entry">
        <div className="text-center py-8">
          <p className="text-gray-600">No journal template configured for this routine.</p>
        </div>
      </Modal>
    );
  }

  // Insight display screen
  if (showInsight) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <div className="text-center py-[min(8vw,2rem)] px-[min(4vw,1rem)]">
          <div className="mb-[min(6vw,1.5rem)]">
            <Sparkles className="w-[min(16vw,4rem)] h-[min(16vw,4rem)] text-rose mx-auto" />
          </div>
          <h3 className="text-[min(5vw,1.25rem)] font-bold text-gray-900 mb-[min(4vw,1rem)]">
            Entry Saved!
          </h3>
          <p className="text-[min(4vw,1rem)] text-gray-700">
            {aiInsight}
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="lg"
      header={
        <div className="space-y-[min(4vw,1rem)]">
          {/* Header with icon and title */}
          <div className="flex items-center space-x-[min(3vw,0.75rem)]">
            <div className="w-[min(10vw,2.5rem)] h-[min(10vw,2.5rem)] rounded-xl bg-gradient-to-br from-rose to-burgundy flex items-center justify-center">
              <BookOpen className="w-[min(5vw,1.25rem)] h-[min(5vw,1.25rem)] text-white" />
            </div>
            <div>
              <h2 className="text-[min(5vw,1.25rem)] font-bold text-gray-900">
                {thriving.title} Journal
              </h2>
              <p className="text-[min(3.5vw,0.875rem)] text-gray-600">
                Track your progress
              </p>
            </div>
          </div>
          
          {/* Progress dots */}
          <div className="flex items-center justify-center space-x-[min(2vw,0.5rem)]">
            {fields.map((_, index) => (
              <div
                key={index}
                className={`
                  transition-all duration-300
                  ${index === currentFieldIndex 
                    ? 'w-[min(2.5vw,0.625rem)] h-[min(2.5vw,0.625rem)] bg-gradient-to-r from-rose to-burgundy shadow-sm' 
                    : index < currentFieldIndex
                    ? 'w-[min(2vw,0.5rem)] h-[min(2vw,0.5rem)] bg-rose/60'
                    : 'w-[min(2vw,0.5rem)] h-[min(2vw,0.5rem)] bg-gray-300'
                  }
                  rounded-full
                `}
              />
            ))}
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handlePrevious}
            disabled={currentFieldIndex === 0}
            className="text-gray-600"
          >
            Back
          </Button>
          
          {currentFieldIndex === fields.length - 1 ? (
            <LoadingButton
              onClick={handleSubmit}
              isLoading={isSubmitting}
              disabled={!allFieldsComplete()}
              className="px-[min(6vw,1.5rem)] py-[min(3vw,0.75rem)] rounded-full bg-gradient-to-r from-rose to-burgundy text-white"
              loadingMessages={[
                'Saving entry...',
                'Analyzing patterns...',
                'Generating insights...'
              ]}
              springAnimation
              gradientOverlay
              cardGlow
              haptic="medium"
            >
              Complete Entry
            </LoadingButton>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              variant="gradient"
              gradient={{
                from: 'rose',
                to: 'burgundy',
                activeFrom: 'rose/40',
                activeTo: 'burgundy/30'
              }}
              springAnimation
              gradientOverlay
              cardGlow
              haptic="medium"
              className="px-[min(6vw,1.5rem)]"
            >
              Next
              <ChevronRight className="w-[min(4vw,1rem)] h-[min(4vw,1rem)] ml-1" />
            </Button>
          )}
        </div>
      }
    >
      <div className="py-[min(4vw,1rem)]">
        {currentField && (
          <SmartJournalField
            field={currentField}
            value={fieldValues[currentField.id] || ''}
            onChange={(value) => handleFieldChange(currentField.id, value)}
            previousValue={previousEntry?.fieldValues[currentField.id]}
          />
        )}
        
        {/* Optional prompts section */}
        {template.prompts && template.prompts.length > 0 && currentFieldIndex === fields.length - 1 && (
          <div className="mt-[min(6vw,1.5rem)] p-[min(4vw,1rem)] bg-gray-50 rounded-xl">
            <h4 className="text-[min(4vw,1rem)] font-medium text-gray-900 mb-[min(2vw,0.5rem)]">
              Reflection
            </h4>
            {template.prompts.map(prompt => (
              <p key={prompt.id} className="text-[min(3.5vw,0.875rem)] text-gray-700 mb-[min(2vw,0.5rem)]">
                {prompt.question}
              </p>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}