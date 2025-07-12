'use client';

import React from 'react';
import { CustomJournalField } from '@/src/types/thriving';

interface DynamicJournalFieldProps {
  field: CustomJournalField;
  value: unknown;
  onChange: (value: unknown) => void;
}

export function DynamicJournalField({ field, value, onChange }: DynamicJournalFieldProps) {
  return (
    <div className="space-y-3">
      <label className="font-medium text-gray-900">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {field.type === 'text_area' && (
        <textarea
          value={String(value || '')}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="w-full p-4 border rounded-xl"
          required={field.required}
        />
      )}
      
      {field.type === 'rating_scale' && (
        <div className="flex space-x-2">
          {[1,2,3,4,5,6,7,8,9,10].map((n) => (
            <button
              key={n}
              onClick={() => onChange(n)}
              className={`p-2 rounded-xl ${value === n ? 'bg-rose text-white' : 'bg-gray-100'}`}
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
          className="p-3 border rounded-xl"
          required={field.required}
        />
      )}
    </div>
  );
}