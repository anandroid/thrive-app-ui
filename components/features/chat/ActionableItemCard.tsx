/**
 * @fileoverview Reusable ActionableItemCard component
 * @module components/features/chat/ActionableItemCard
 * 
 * This component renders a single actionable item card with appropriate
 * icon, colors, and click handling.
 * 
 * @see {@link src/services/openai/types/index.ts} for ActionableItem type
 * @see {@link src/utils/chat/iconMapping.ts} for icon and color utilities
 */

'use client';

import React, { forwardRef } from 'react';
import { ChevronRight } from 'lucide-react';
import { ActionableItem } from '@/src/services/openai/types';
import { getItemIcon, getColorScheme } from '@/src/utils/chat/iconMapping';

/**
 * Props for ActionableItemCard component
 * @interface
 */
interface ActionableItemCardProps {
  /**
   * The actionable item to render
   */
  item: ActionableItem;
  
  /**
   * Index for color scheme selection
   */
  index: number;
  
  /**
   * Click handler for the card
   */
  onClick: (item: ActionableItem) => void;
  
  /**
   * Optional className for additional styling
   */
  className?: string;
}

/**
 * ActionableItemCard component
 * 
 * @description
 * Renders a clickable card for an actionable item with appropriate icon,
 * colors, and hover effects. Uses forwardRef to support tutorial targeting.
 * 
 * @example
 * ```tsx
 * <ActionableItemCard
 *   item={actionableItem}
 *   index={0}
 *   onClick={handleActionClick}
 * />
 * ```
 * 
 * @param {ActionableItemCardProps} props - Component props
 * @param {React.Ref<HTMLButtonElement>} ref - Forwarded ref
 * @returns {JSX.Element} Rendered card component
 */
export const ActionableItemCard = forwardRef<HTMLButtonElement, ActionableItemCardProps>(
  ({ item, index, onClick, className = '' }, ref) => {
    const Icon = getItemIcon(item);
    const colorScheme = getColorScheme(index);
    
    return (
      <button
        ref={ref}
        onClick={() => onClick(item)}
        className={`
          w-full p-3 rounded-xl 
          bg-gradient-to-r ${colorScheme.backgroundClass} 
          border border-gray-200/50 
          shadow-sm ${colorScheme.shadowClass} 
          hover:shadow-md ${colorScheme.borderColorHover} 
          transition-all duration-200 
          text-left group 
          touch-feedback touch-manipulation
          ${className}
        `}
        aria-label={`${item.title} - ${item.type} action`}
      >
        <div className="flex items-start space-x-3">
          {/* Icon Container */}
          <div 
            className={`
              w-8 h-8 rounded-lg 
              bg-gradient-to-br ${colorScheme.gradientClass} 
              flex items-center justify-center 
              flex-shrink-0 mt-0.5 shadow-sm 
              group-hover:scale-105 transition-transform
            `}
          >
            <Icon className={`w-4 h-4 ${colorScheme.iconColorClass}`} />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900 text-[14px]">
                {item.title}
              </h4>
              <ChevronRight 
                className="
                  w-4 h-4 text-gray-400 
                  group-hover:text-gray-600 
                  group-hover:translate-x-0.5 
                  transition-all flex-shrink-0 ml-2
                " 
              />
            </div>
            
            {item.description && (
              <p className="text-[12px] text-gray-600 mt-0.5 leading-relaxed">
                {item.description}
              </p>
            )}
          </div>
        </div>
      </button>
    );
  }
);

ActionableItemCard.displayName = 'ActionableItemCard';

/**
 * Export component and types
 */
export type { ActionableItemCardProps };