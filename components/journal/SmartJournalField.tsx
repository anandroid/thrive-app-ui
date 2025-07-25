'use client';

import React, { useState } from 'react';
import { SmartJournalField as SmartJournalFieldType, JournalFieldValue } from '@/src/types/journal-inputs';
// import Button from '@/components/ui/Button';
// import { TouchLink } from '@/components/ui/TouchLink';

interface SmartJournalFieldProps {
  field: SmartJournalFieldType;
  value: JournalFieldValue;
  onChange: (value: JournalFieldValue) => void;
  previousValue?: JournalFieldValue;
}

export function SmartJournalField({ field, value, onChange, previousValue }: SmartJournalFieldProps) {
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Slider Input
  if (field.type === 'slider' && field.sliderConfig) {
    const config = field.sliderConfig;
    const currentValue = (value as number) || config.min;
    
    return (
      <div className="space-y-[min(3vw,0.75rem)]">
        <label className="font-medium text-[min(4vw,1rem)] text-gray-900">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {field.description && (
          <p className="text-[min(3.5vw,0.875rem)] text-gray-600">{field.description}</p>
        )}
        
        <div className="space-y-[min(4vw,1rem)]">
          {/* Value display */}
          {config.showValue !== false && (
            <div className="text-center">
              <span className="text-[min(8vw,2rem)] font-bold text-gray-900">
                {currentValue}
              </span>
              {config.labels?.[currentValue] && (
                <span className="block text-[min(3.5vw,0.875rem)] text-gray-600">
                  {config.labels[currentValue]}
                </span>
              )}
            </div>
          )}
          
          {/* Slider with optional gradient */}
          <div className="relative">
            <input
              type="range"
              min={config.min}
              max={config.max}
              step={config.step || 1}
              value={currentValue}
              onChange={(e) => onChange(Number(e.target.value))}
              className={`w-full h-[min(3vw,0.75rem)] rounded-full appearance-none cursor-pointer
                ${config.gradient 
                  ? 'bg-gradient-to-r from-green-400 via-yellow-400 to-red-400' 
                  : 'bg-gray-200'
                }
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-[min(6vw,1.5rem)]
                [&::-webkit-slider-thumb]:h-[min(6vw,1.5rem)]
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-white
                [&::-webkit-slider-thumb]:shadow-lg
                [&::-webkit-slider-thumb]:border-2
                [&::-webkit-slider-thumb]:border-rose
              `}
              required={field.required}
            />
            
            {/* Labels */}
            {config.labels && (
              <div className="flex justify-between mt-[min(2vw,0.5rem)] text-[min(3vw,0.75rem)] text-gray-600">
                {Object.entries(config.labels).map(([val, label]) => (
                  <span key={val} className={Number(val) === currentValue ? 'font-medium text-gray-900' : ''}>
                    {label}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          {/* Previous value indicator */}
          {field.showPreviousValue && previousValue !== undefined && (
            <p className="text-[min(3vw,0.75rem)] text-gray-500">
              Previous: {String(previousValue)}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Emoji Picker
  if (field.type === 'emoji_picker' && field.emojiConfig) {
    const config = field.emojiConfig;
    const columns = config.columns || 5;
    
    return (
      <div className="space-y-[min(3vw,0.75rem)]">
        <label className="font-medium text-[min(4vw,1rem)] text-gray-900">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {field.description && (
          <p className="text-[min(3.5vw,0.875rem)] text-gray-600">{field.description}</p>
        )}
        
        <div className={`grid grid-cols-${columns} gap-[min(3vw,0.75rem)]`}>
          {config.emojiSet.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onChange(emoji)}
              className={`
                p-[min(4vw,1rem)] rounded-xl text-[min(8vw,2rem)] transition-all
                ${value === emoji 
                  ? 'bg-rose text-white scale-110 shadow-lg' 
                  : 'bg-gray-100 hover:bg-gray-200 hover:scale-105'
                }
              `}
            >
              {emoji}
            </button>
          ))}
        </div>
        
        {config.allowCustom && (
          <button
            onClick={() => setShowCustomInput(!showCustomInput)}
            className="text-[min(3.5vw,0.875rem)] text-rose-500 hover:text-burgundy-700"
          >
            Use different emoji
          </button>
        )}
      </div>
    );
  }

  // Tag Selector
  if (field.type === 'tag_selector' && field.tagConfig) {
    const config = field.tagConfig;
    const selectedTags = (value as string[]) || [];
    
    return (
      <div className="space-y-[min(3vw,0.75rem)]">
        <label className="font-medium text-[min(4vw,1rem)] text-gray-900">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
          {config.maxSelections && (
            <span className="text-[min(3vw,0.75rem)] text-gray-500 ml-2">
              (Select up to {config.maxSelections})
            </span>
          )}
        </label>
        {field.description && (
          <p className="text-[min(3.5vw,0.875rem)] text-gray-600">{field.description}</p>
        )}
        
        <div className="flex flex-wrap gap-[min(2vw,0.5rem)]">
          {config.options.map((option) => {
            const isSelected = selectedTags.includes(option);
            const isDisabled = !isSelected && config.maxSelections && selectedTags.length >= config.maxSelections;
            
            return (
              <button
                key={option}
                onClick={() => {
                  if (isSelected) {
                    onChange(selectedTags.filter(t => t !== option));
                  } else if (!isDisabled) {
                    onChange([...selectedTags, option]);
                  }
                }}
                disabled={!!isDisabled}
                className={`
                  px-[min(4vw,1rem)] py-[min(2vw,0.5rem)] rounded-full text-[min(3.5vw,0.875rem)]
                  transition-all ${isSelected 
                    ? 'bg-rose text-white' 
                    : isDisabled
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {option}
              </button>
            );
          })}
        </div>
        
        {config.allowCustom && (
          <div className="mt-[min(3vw,0.75rem)]">
            <input
              type="text"
              placeholder={config.placeholder || "Add custom..."}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value) {
                  e.preventDefault();
                  const newTag = e.currentTarget.value.trim();
                  if (!selectedTags.includes(newTag)) {
                    onChange([...selectedTags, newTag]);
                    e.currentTarget.value = '';
                  }
                }
              }}
              className="w-full p-[min(3vw,0.75rem)] border border-gray-300 rounded-xl focus:border-rose focus:ring-2 focus:ring-rose/20"
            />
          </div>
        )}
      </div>
    );
  }

  // Time Picker
  if (field.type === 'time_picker' && field.timeConfig) {
    const config = field.timeConfig;
    
    return (
      <div className="space-y-[min(3vw,0.75rem)]">
        <label className="font-medium text-[min(4vw,1rem)] text-gray-900">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {field.description && (
          <p className="text-[min(3.5vw,0.875rem)] text-gray-600">{field.description}</p>
        )}
        
        <input
          type="time"
          value={String(value || config.defaultValue || '')}
          onChange={(e) => onChange(e.target.value)}
          min={config.minTime}
          max={config.maxTime}
          className="w-full p-[min(4vw,1rem)] text-[min(4vw,1rem)] border border-gray-300 rounded-xl focus:border-rose focus:ring-2 focus:ring-rose/20"
          required={field.required}
        />
      </div>
    );
  }

  // Magnitude Input
  if (field.type === 'magnitude_input' && field.magnitudeConfig) {
    const config = field.magnitudeConfig;
    const currentValue = (value as number) || config.min;
    
    return (
      <div className="space-y-[min(3vw,0.75rem)]">
        <label className="font-medium text-[min(4vw,1rem)] text-gray-900">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {field.description && (
          <p className="text-[min(3.5vw,0.875rem)] text-gray-600">{field.description}</p>
        )}
        
        <div className="flex items-center space-x-[min(4vw,1rem)]">
          <input
            type="number"
            min={config.min}
            max={config.max}
            step={config.step}
            value={currentValue}
            onChange={(e) => onChange(Number(e.target.value))}
            className="flex-1 p-[min(4vw,1rem)] text-[min(5vw,1.25rem)] font-medium text-center border border-gray-300 rounded-xl focus:border-rose focus:ring-2 focus:ring-rose/20"
            required={field.required}
          />
          <span className="text-[min(4vw,1rem)] font-medium text-gray-700">
            {config.unit}
          </span>
        </div>
        
        {/* Quick increment/decrement buttons */}
        <div className="flex justify-center space-x-[min(4vw,1rem)]">
          <button
            onClick={() => onChange(Math.max(config.min, currentValue - config.step))}
            className="w-[min(12vw,3rem)] h-[min(12vw,3rem)] rounded-full bg-gray-100 hover:bg-gray-200 text-[min(6vw,1.5rem)] font-medium"
          >
            -
          </button>
          <button
            onClick={() => onChange(Math.min(config.max, currentValue + config.step))}
            className="w-[min(12vw,3rem)] h-[min(12vw,3rem)] rounded-full bg-gray-100 hover:bg-gray-200 text-[min(6vw,1.5rem)] font-medium"
          >
            +
          </button>
        </div>
        
        {/* Trend indicator */}
        {config.showTrend && previousValue !== undefined && (
          <p className="text-[min(3vw,0.75rem)] text-center">
            {currentValue > (previousValue as number) ? (
              <span className="text-green-600">↑ Up from {String(previousValue)} {config.unit}</span>
            ) : currentValue < (previousValue as number) ? (
              <span className="text-red-600">↓ Down from {String(previousValue)} {config.unit}</span>
            ) : (
              <span className="text-gray-500">Same as before</span>
            )}
          </p>
        )}
      </div>
    );
  }

  // Multiple Choice
  if (field.type === 'multiple_choice' && field.multipleChoiceConfig) {
    const config = field.multipleChoiceConfig;
    const layout = config.layout || 'vertical';
    
    return (
      <div className="space-y-[min(3vw,0.75rem)]">
        <label className="font-medium text-[min(4vw,1rem)] text-gray-900">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {field.description && (
          <p className="text-[min(3.5vw,0.875rem)] text-gray-600">{field.description}</p>
        )}
        
        <div className={`
          ${layout === 'horizontal' ? 'flex flex-wrap gap-[min(3vw,0.75rem)]' : ''}
          ${layout === 'grid' ? 'grid grid-cols-2 gap-[min(3vw,0.75rem)]' : ''}
          ${layout === 'vertical' ? 'space-y-[min(2vw,0.5rem)]' : ''}
        `}>
          {config.options.map((option) => (
            <button
              key={option}
              onClick={() => onChange(option)}
              className={`
                w-full p-[min(4vw,1rem)] rounded-xl text-[min(3.75vw,0.9375rem)]
                transition-all text-left
                ${value === option 
                  ? 'bg-rose text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Text Input (explicit handler)
  if (field.type === 'text_input') {
    return (
      <div className="space-y-[min(3vw,0.75rem)]">
        <label className="font-medium text-[min(4vw,1rem)] text-gray-900">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {field.description && (
          <p className="text-[min(3.5vw,0.875rem)] text-gray-600">{field.description}</p>
        )}
        
        <input
          type="text"
          value={String(value || '')}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.description || `Enter ${field.label.toLowerCase()}`}
          className="w-full p-[min(4vw,1rem)] border border-gray-300 rounded-xl focus:border-rose focus:ring-2 focus:ring-rose/20"
          required={field.required}
        />
        
        {/* Previous value indicator */}
        {field.showPreviousValue && previousValue !== undefined && (
          <p className="text-[min(3vw,0.75rem)] text-gray-500">
            Previous: {String(previousValue)}
          </p>
        )}
      </div>
    );
  }

  // Number Input (explicit handler) 
  if (field.type === 'number_input') {
    return (
      <div className="space-y-[min(3vw,0.75rem)]">
        <label className="font-medium text-[min(4vw,1rem)] text-gray-900">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {field.description && (
          <p className="text-[min(3.5vw,0.875rem)] text-gray-600">{field.description}</p>
        )}
        
        <input
          type="number"
          value={String(value || '')}
          onChange={(e) => onChange(Number(e.target.value))}
          placeholder={field.description || `Enter ${field.label.toLowerCase()}`}
          className="w-full p-[min(4vw,1rem)] border border-gray-300 rounded-xl focus:border-rose focus:ring-2 focus:ring-rose/20"
          required={field.required}
          min={field.validation?.min}
          max={field.validation?.max}
        />
        
        {/* Previous value indicator */}
        {field.showPreviousValue && previousValue !== undefined && (
          <p className="text-[min(3vw,0.75rem)] text-gray-500">
            Previous: {String(previousValue)}
          </p>
        )}
      </div>
    );
  }

  // Fallback for any other types
  return (
    <div className="space-y-[min(3vw,0.75rem)]">
      <label className="font-medium text-[min(4vw,1rem)] text-gray-900">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {field.description && (
        <p className="text-[min(3.5vw,0.875rem)] text-gray-600">{field.description}</p>
      )}
      
      <input
        type="text"
        value={String(value || '')}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.description || `Enter ${field.label.toLowerCase()}`}
        className="w-full p-[min(4vw,1rem)] border border-gray-300 rounded-xl focus:border-rose focus:ring-2 focus:ring-rose/20"
        required={field.required}
      />
    </div>
  );
}