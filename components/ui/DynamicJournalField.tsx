'use client';

import React from 'react';
import { CustomJournalField, LegacyJournalField } from '@/src/types/thriving';

interface DynamicJournalFieldProps {
  field: CustomJournalField;
  value: unknown;
  onChange: (value: unknown) => void;
}

// Type guard to check if it's a legacy field
function isLegacyField(field: CustomJournalField): field is LegacyJournalField {
  return 'placeholder' in field || 
    ['text_area', 'rating_scale', 'time_input', 'energy_level', 'mood_scale', 'pain_scale', 'sleep_quality', 'custom_metric'].includes(field.type);
}

export function DynamicJournalField({ field, value, onChange }: DynamicJournalFieldProps) {
  return (
    <div className="space-y-[min(3vw,0.75rem)]">
      <label className="font-medium text-[min(4vw,1rem)] text-gray-900">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {(field.type === 'text_area' || field.type === 'text_input') && (
        <textarea
          value={String(value || '')}
          onChange={(e) => onChange(e.target.value)}
          placeholder={isLegacyField(field) ? field.placeholder : undefined}
          className="w-full p-[min(4vw,1rem)] border border-gray-300 rounded-xl focus:border-rose focus:ring-2 focus:ring-rose/20 transition-all"
          required={field.required}
        />
      )}
      
      {field.type === 'rating_scale' && (
        <div className="flex space-x-2">
          {[1,2,3,4,5,6,7,8,9,10].map((n) => (
            <button
              key={n}
              onClick={() => onChange(n)}
              className={`p-[min(2vw,0.5rem)] rounded-xl transition-all ${value === n ? 'bg-rose text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              {n}
            </button>
          ))}
        </div>
      )}
      
      {field.type === 'time_input' && (
        <input
          type="time"
          value={String(value || '')}
          onChange={(e) => onChange(e.target.value)}
          className="p-[min(3vw,0.75rem)] border border-gray-300 rounded-xl focus:border-rose focus:ring-2 focus:ring-rose/20 transition-all"
          required={field.required}
        />
      )}
      
      {/* Default to slider for any scale or numeric fields */}
      {(field.type === 'energy_level' || field.type === 'mood_scale' || 
        field.type === 'pain_scale' || field.type === 'sleep_quality' || 
        field.type === 'custom_metric' || field.type === 'slider') && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[min(3.5vw,0.875rem)] text-gray-600">
            <span>Low</span>
            <span className="font-medium text-gray-900">{String(value || 5)}/10</span>
            <span>High</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={String(value || 5)}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full h-[min(2vw,0.5rem)] bg-gray-200 rounded-lg appearance-none cursor-pointer accent-rose"
            required={field.required}
          />
        </div>
      )}
      
      {/* Fallback for unknown field types - show as text input */}
      {!['text_area', 'text_input', 'rating_scale', 'time_input', 'energy_level', 'mood_scale', 'pain_scale', 'sleep_quality', 'custom_metric', 'slider'].includes(field.type as string) && (
        <input
          type="text"
          value={String(value || '')}
          onChange={(e) => onChange(e.target.value)}
          placeholder={isLegacyField(field) && field.placeholder ? field.placeholder : `Enter ${field.label.toLowerCase()}`}
          className="w-full p-[min(3vw,0.75rem)] border border-gray-300 rounded-xl focus:border-rose focus:ring-2 focus:ring-rose/20 transition-all"
          required={field.required}
        />
      )}
    </div>
  );
}