'use client';

import React, { useState } from 'react';
import { ChatEditor } from '@/components/ui/ChatEditor';
import { PantryItem } from '@/src/types/pantry';
import { Sparkles } from 'lucide-react';

interface PantryNaturalInputProps {
  onAddItems: (items: PantryItem[]) => void;
  visible?: boolean;
}

export const PantryNaturalInput: React.FC<PantryNaturalInputProps> = ({ 
  onAddItems,
  visible = true 
}) => {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const processNaturalInput = async (text: string) => {
    setIsProcessing(true);
    
    try {
      // Parse natural language input
      // Examples:
      // "I have vitamin D, magnesium, and omega 3"
      // "I take metformin 500mg twice daily"
      // "Add turmeric powder, ginger tea, and ashwagandha"
      
      // Simple parsing for now - split by common delimiters
      const delimiters = /,|and|&|\+/gi;
      const items = text.split(delimiters)
        .map(item => item.trim())
        .filter(item => item.length > 0);
      
      const pantryItems: PantryItem[] = items.map(itemText => {
        // Extract dosage information if present
        const dosageMatch = itemText.match(/(\d+\s*(?:mg|g|ml|mcg|iu))/i);
        const frequencyMatch = itemText.match(/(?:once|twice|three times|)\s*(?:daily|a day|per day)/i);
        
        // Clean item name by removing dosage and frequency
        let itemName = itemText;
        if (dosageMatch) {
          itemName = itemName.replace(dosageMatch[0], '').trim();
        }
        if (frequencyMatch) {
          itemName = itemName.replace(frequencyMatch[0], '').trim();
        }
        
        // Determine category based on keywords
        let category = 'supplement';
        const medicineKeywords = ['metformin', 'medication', 'prescription', 'rx'];
        const foodKeywords = ['tea', 'powder', 'juice', 'oil', 'honey'];
        const remedyKeywords = ['tincture', 'extract', 'balm', 'salve'];
        
        if (medicineKeywords.some(kw => itemName.toLowerCase().includes(kw))) {
          category = 'medicine';
        } else if (foodKeywords.some(kw => itemName.toLowerCase().includes(kw))) {
          category = 'food';
        } else if (remedyKeywords.some(kw => itemName.toLowerCase().includes(kw))) {
          category = 'remedy';
        }
        
        // Build notes from dosage and frequency
        const notes: string[] = [];
        if (dosageMatch) notes.push(dosageMatch[0]);
        if (frequencyMatch) notes.push(frequencyMatch[0]);
        
        return {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: itemName,
          notes: notes.join(', '),
          tags: [category],
          dateAdded: new Date().toISOString()
        };
      });
      
      onAddItems(pantryItems);
      setInput('');
    } catch (error) {
      console.error('Error processing natural input:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = () => {
    if (input.trim() && !isProcessing) {
      processNaturalInput(input);
    }
  };

  if (!visible) return null;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-rose/5 to-burgundy/5 p-4 border border-rose/20">
      <div className="flex items-start space-x-3 mb-3">
        <Sparkles className="w-5 h-5 text-rose mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-primary-text">Quick Add to Pantry</h3>
          <p className="text-sm text-secondary-text-thin mt-1">
            Tell me what you have! Try: &quot;I have vitamin D, magnesium 400mg, and omega 3&quot;
          </p>
        </div>
      </div>
      
      <ChatEditor
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        placeholder="Type or speak what's in your pantry..."
        isLoading={isProcessing}
      />
    </div>
  );
};