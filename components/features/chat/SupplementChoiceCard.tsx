/**
 * @fileoverview SupplementChoiceCard component for supplement recommendations
 * @module components/features/chat/SupplementChoiceCard
 * 
 * This component renders a supplement recommendation card with two action buttons:
 * "I already have it" and "Buy" options.
 * 
 * @see {@link src/services/openai/types/index.ts} for ActionableItem type
 * @see {@link components/features/PantryAddModal.tsx} for pantry tracking
 */

'use client';

import React from 'react';
import { ShoppingCart, PlusCircle } from 'lucide-react';
import { ActionableItem } from '@/src/services/openai/types';

/**
 * Props for SupplementChoiceCard component
 * @interface
 */
interface SupplementChoiceCardProps {
  /**
   * The supplement choice item containing product details
   */
  item: ActionableItem;
  
  /**
   * Handler for "I already have it" action
   * @param {ActionableItem} alreadyHaveAction - The already have action to handle
   */
  onAlreadyHave: (alreadyHaveAction: ActionableItem) => void;
  
  /**
   * Handler for "Buy" action
   * @param {string} searchUrl - The URL to open for purchasing
   */
  onBuy: (searchUrl: string) => void;
  
  /**
   * Optional className for additional styling
   */
  className?: string;
}

/**
 * SupplementChoiceCard component
 * 
 * @description
 * Renders a card for supplement recommendations with two action buttons.
 * Displays title, optional dosage/timing info, and action buttons.
 * 
 * @example
 * ```tsx
 * <SupplementChoiceCard
 *   item={supplementChoice}
 *   onAlreadyHave={handleAlreadyHave}
 *   onBuy={handleBuy}
 * />
 * ```
 * 
 * @param {SupplementChoiceCardProps} props - Component props
 * @returns {JSX.Element} Rendered supplement choice card
 */
export const SupplementChoiceCard: React.FC<SupplementChoiceCardProps> = ({
  item,
  onAlreadyHave,
  onBuy,
  className = ''
}) => {
  /**
   * Handle "I already have it" button click
   * Creates an already_have action and passes it to the handler
   */
  const handleAlreadyHaveClick = () => {
    const alreadyHaveAction: ActionableItem = {
      type: 'already_have',
      title: 'I already have',
      description: 'Track in pantry',
      productName: item.productName,
      suggestedNotes: item.suggestedNotes || `${item.dosage}, ${item.timing}`,
      contextMessage: 'Great! Tracking this helps me personalize your wellness routines'
    };
    onAlreadyHave(alreadyHaveAction);
  };
  
  /**
   * Handle "Buy" button click
   * Constructs Amazon search URL and passes it to the handler
   */
  const handleBuyClick = () => {
    const searchQuery = item.searchQuery || encodeURIComponent(item.productName || item.title);
    const amazonSearchUrl = `https://www.amazon.com/s?k=${searchQuery}`;
    onBuy(amazonSearchUrl);
  };
  
  return (
    <div 
      className={`
        rounded-xl bg-gradient-to-r from-white to-gray-50/30 
        border border-gray-200/70 p-4 
        shadow-sm hover:shadow-md transition-all
        ${className}
      `}
    >
      {/* Title */}
      <div className="mb-3">
        <h4 className="font-semibold text-gray-900 text-[16px]">
          {item.title}
        </h4>
      </div>
      
      {/* Action Buttons */}
      <div className="flex gap-2">
        {/* Already Have Button */}
        <button
          onClick={handleAlreadyHaveClick}
          className="
            flex-1 px-4 py-2.5 rounded-lg 
            bg-gradient-to-r from-sage-light/20 to-sage/10 
            border border-sage/20 hover:border-sage/40 
            hover:shadow-sm transition-all duration-200 
            group touch-feedback
          "
          aria-label="I already have this supplement"
        >
          <div className="flex items-center justify-center space-x-2">
            <PlusCircle className="w-4 h-4 text-sage-dark" />
            <span className="text-[13px] font-medium text-sage-dark">
              I already have it
            </span>
          </div>
        </button>
        
        {/* Buy Button */}
        <button
          onClick={handleBuyClick}
          className="
            flex-1 px-4 py-2.5 rounded-lg 
            bg-gradient-to-r from-rose/10 to-dusty-rose/10 
            border border-rose/20 hover:border-rose/40 
            hover:shadow-sm transition-all duration-200 
            group touch-feedback
          "
          aria-label="Buy this supplement"
        >
          <div className="flex items-center justify-center space-x-2">
            <ShoppingCart className="w-4 h-4 text-rose-500" />
            <span className="text-[13px] font-medium text-rose-500">
              Buy
            </span>
          </div>
        </button>
      </div>
      
      {/* Dosage and Timing Info */}
      {item.dosage && item.timing && (
        <p className="text-[11px] text-gray-500 mt-2 text-center">
          {item.dosage} • {item.timing}
        </p>
      )}
    </div>
  );
};

/**
 * Legacy supplement group card for backward compatibility
 * Renders grouped supplement options (already_have + buy)
 * 
 * @deprecated Use SupplementChoiceCard for new implementations
 */
interface SupplementGroupCardProps {
  productName: string;
  alreadyHaveItem?: ActionableItem;
  buyItem?: ActionableItem;
  onActionClick: (item: ActionableItem) => void;
  className?: string;
}

/**
 * @deprecated Legacy component for grouped supplement actions
 */
export const SupplementGroupCard: React.FC<SupplementGroupCardProps> = ({
  productName,
  alreadyHaveItem,
  buyItem,
  onActionClick,
  className = ''
}) => {
  return (
    <div 
      className={`
        rounded-xl bg-gradient-to-r from-gray-50/50 to-white 
        border border-gray-200/70 p-4 
        shadow-sm hover:shadow-md transition-all
        ${className}
      `}
    >
      <h4 className="font-semibold text-gray-900 text-[15px] mb-3">
        {productName}
      </h4>
      
      <div className="flex gap-2">
        {alreadyHaveItem && (
          <button
            onClick={() => onActionClick(alreadyHaveItem)}
            className="
              flex-1 px-4 py-2.5 rounded-lg 
              bg-gradient-to-r from-sage-light/20 to-sage/10 
              border border-sage/20 hover:border-sage/40 
              hover:shadow-sm transition-all duration-200 
              group touch-feedback
            "
          >
            <div className="flex items-center justify-center space-x-2">
              <PlusCircle className="w-4 h-4 text-sage-dark" />
              <span className="text-[13px] font-medium text-sage-dark">
                I already have it
              </span>
            </div>
          </button>
        )}
        
        {buyItem && (
          <button
            onClick={() => onActionClick(buyItem)}
            className="
              flex-1 px-4 py-2.5 rounded-lg 
              bg-gradient-to-r from-rose/10 to-dusty-rose/10 
              border border-rose/20 hover:border-rose/40 
              hover:shadow-sm transition-all duration-200 
              group touch-feedback
            "
          >
            <div className="flex items-center justify-center space-x-2">
              <ShoppingCart className="w-4 h-4 text-rose-500" />
              <span className="text-[13px] font-medium text-rose-500">
                Buy
              </span>
            </div>
          </button>
        )}
      </div>
      
      {(alreadyHaveItem?.dosage || buyItem?.dosage) && (
        <p className="text-[11px] text-gray-500 mt-2 text-center">
          {alreadyHaveItem?.dosage || buyItem?.dosage} • {alreadyHaveItem?.timing || buyItem?.timing || 'As directed'}
        </p>
      )}
    </div>
  );
};

/**
 * Export components and types
 */
export type { SupplementChoiceCardProps, SupplementGroupCardProps };