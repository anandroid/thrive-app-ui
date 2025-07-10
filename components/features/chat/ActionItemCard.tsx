/**
 * @fileoverview ActionItemCard component for displaying remedies and suggestions
 * @module components/features/chat/ActionItemCard
 * 
 * This component renders remedy/suggestion cards with HTML content support.
 * 
 * @see {@link src/services/openai/types/index.ts} for ActionItem type
 */

'use client';

import React from 'react';
import { Leaf } from 'lucide-react';
import { ActionItem } from '@/src/services/openai/types';

/**
 * Props for ActionItemCard component
 * @interface
 */
interface ActionItemCardProps {
  /**
   * The action item (remedy/suggestion) to display
   */
  item: ActionItem;
  
  /**
   * Optional icon component (defaults to Leaf)
   */
  icon?: React.ElementType;
  
  /**
   * Optional className for additional styling
   */
  className?: string;
}

/**
 * ActionItemCard component
 * 
 * @description
 * Renders a card displaying a remedy or suggestion with an icon and
 * HTML-formatted content. Supports rich text formatting including
 * bold, italic, and emphasized text.
 * 
 * @example
 * ```tsx
 * <ActionItemCard
 *   item={{
 *     title: "Magnesium for Better Sleep",
 *     content: "<p>Take <strong>400mg</strong> before bed</p>"
 *   }}
 * />
 * ```
 * 
 * @param {ActionItemCardProps} props - Component props
 * @returns {JSX.Element} Rendered action item card
 */
export const ActionItemCard: React.FC<ActionItemCardProps> = ({
  item,
  icon: Icon = Leaf,
  className = ''
}) => {
  return (
    <div className={`flex space-x-3 ${className}`}>
      {/* Icon Container */}
      <div 
        className="
          w-10 h-10 rounded-xl 
          bg-gradient-to-br from-sage-light/40 to-sage/30 
          flex items-center justify-center 
          flex-shrink-0 
          shadow-lg shadow-sage/25
        "
        aria-hidden="true"
      >
        <Icon className="w-5 h-5 text-sage-dark" />
      </div>
      
      {/* Content */}
      <div className="flex-1">
        <h4 className="font-bold text-[18px] text-primary-text mb-2">
          {item.title}
        </h4>
        
        {/* HTML Content with styling */}
        <div 
          className="
            text-[15px] text-primary-text leading-[1.7] 
            [&_strong]:font-bold [&_strong]:text-primary-text 
            [&_em]:font-semibold [&_em]:text-primary-text [&_em]:not-italic
            [&_p]:mb-2 [&_p:last-child]:mb-0
            [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-2
            [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-2
            [&_li]:mb-1
          "
          dangerouslySetInnerHTML={{ 
            __html: item.content || item.description || '' 
          }}
        />
      </div>
    </div>
  );
};

/**
 * ActionItemList component for rendering multiple action items
 * 
 * @interface ActionItemListProps
 */
interface ActionItemListProps {
  /**
   * Array of action items to display
   */
  items: ActionItem[];
  
  /**
   * Optional icon component for all items
   */
  icon?: React.ElementType;
  
  /**
   * Optional className for the container
   */
  className?: string;
}

/**
 * ActionItemList component
 * 
 * @description
 * Renders a list of action items with consistent spacing.
 * 
 * @example
 * ```tsx
 * <ActionItemList
 *   items={actionItems}
 *   icon={Heart}
 * />
 * ```
 * 
 * @param {ActionItemListProps} props - Component props
 * @returns {JSX.Element} Rendered action item list
 */
export const ActionItemList: React.FC<ActionItemListProps> = ({
  items,
  icon,
  className = ''
}) => {
  if (!items || items.length === 0) {
    return null;
  }
  
  return (
    <div className={`space-y-4 ${className}`}>
      {items.map((item, idx) => (
        <ActionItemCard
          key={idx}
          item={item}
          icon={icon}
        />
      ))}
    </div>
  );
};

/**
 * Export components and types
 */
export type { ActionItemCardProps, ActionItemListProps };