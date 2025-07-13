// Example: Migrating PantryAddModal to use keyboard-aware inputs

// BEFORE:
import React from 'react';

export function PantryAddModal() {
  return (
    <div>
      {/* Name Input - OLD WAY */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Name *
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            onBlur={handleQuickAnalyze}
            placeholder="e.g., Vitamin D3, Turmeric, Chamomile Tea"
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose/30"
          />
        </div>
      </div>

      {/* Notes - OLD WAY */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes
        </label>
        <textarea
          value={formData.notes || ''}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="e.g., 1000 IU daily, organic, helps with sleep"
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose/30 resize-none"
        />
      </div>
    </div>
  );
}

// AFTER:
import React from 'react';
import { Input, Textarea } from '@/components/ui/form-inputs';

export function PantryAddModal() {
  return (
    <div>
      {/* Name Input - NEW WAY with automatic keyboard handling */}
      <div className="flex gap-2">
        <Input
          label="Name *"
          value={formData.name || ''}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          onBlur={handleQuickAnalyze}
          placeholder="e.g., Vitamin D3, Turmeric, Chamomile Tea"
          className="flex-1" // Additional styling if needed
        />
        {aiAvailable && formData.name && !imagePreview && (
          <button onClick={handleQuickAnalyze}>
            {/* AI button */}
          </button>
        )}
      </div>

      {/* Notes - NEW WAY with automatic keyboard handling */}
      <Textarea
        label="Notes"
        value={formData.notes || ''}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        placeholder="e.g., 1000 IU daily, organic, helps with sleep"
        rows={3}
      />
    </div>
  );
}

// That's it! The Input and Textarea components automatically:
// 1. Handle keyboard focus in WebView
// 2. Apply consistent styling with viewport units
// 3. Provide error/helper text support
// 4. Ensure proper mobile behavior