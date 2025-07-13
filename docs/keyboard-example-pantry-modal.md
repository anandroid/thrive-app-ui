// Example: How to update PantryAddModal to use keyboard handling

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Loader2, Sparkles, AlertCircle, Scan } from 'lucide-react';
// ... other imports ...

// ADD THIS IMPORT
import { KeyboardAvoidingView } from '@/components/ui/KeyboardAvoidingView';
// OR use the hook for more control
import { useKeyboardAwareInput } from '@/hooks/useKeyboardAwareInput';

export function PantryAddModal({ isOpen, onClose, onAddItem, initialData, contextMessage }: PantryAddModalProps) {
  // ... existing state ...
  
  // Option 1: Use the hook for individual inputs
  const { handleFocus } = useKeyboardAwareInput();

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Option 2: Wrap the modal content in KeyboardAvoidingView */}
      <KeyboardAvoidingView 
        className="relative w-full max-w-lg"
        behavior="padding"
      >
        <div className="bg-white rounded-t-3xl animate-slide-up max-h-[90vh] flex flex-col">
          {/* Header - stays fixed */}
          <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-primary-text">Add to Pantry</h2>
            <TouchCloseButton onClose={onClose} size="sm" />
          </div>
          
          {/* Scrollable content - will adjust when keyboard appears */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Form fields */}
              <div>
                <label>Item Name</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  onFocus={handleFocus} // ADD THIS for keyboard handling
                  placeholder="e.g., Vitamin D3, Turmeric"
                  className="w-full px-4 py-3 rounded-xl border"
                />
              </div>
              
              <div>
                <label>Notes</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  onFocus={handleFocus} // ADD THIS for keyboard handling
                  placeholder="e.g., 1000 IU daily, organic"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border resize-none"
                />
              </div>
            </div>
          </div>
          
          {/* Footer - stays at bottom */}
          <div className="p-6 pt-4 border-t border-gray-100">
            <button className="w-full py-3 rounded-full bg-gradient-to-r from-rose to-dusty-rose">
              Add to Pantry
            </button>
          </div>
        </div>
      </KeyboardAvoidingView>
    </div>
  );
}

// Alternative: For pages with forms, wrap at the page level
export default function PantryPage() {
  return (
    <KeyboardAvoidingView className="min-h-screen">
      {/* Your page content */}
    </KeyboardAvoidingView>
  );
}