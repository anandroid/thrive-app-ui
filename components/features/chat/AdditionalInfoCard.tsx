/**
 * @fileoverview AdditionalInfoCard component for displaying supplementary information
 * @module components/features/chat/AdditionalInfoCard
 * 
 * This component renders additional information in a styled card with
 * gradient background and HTML content support.
 */

'use client';

import React from 'react';

/**
 * Props for AdditionalInfoCard component
 * @interface
 */
interface AdditionalInfoCardProps {
  /**
   * HTML content to display
   */
  content: string;
  
  /**
   * Optional className for additional styling
   */
  className?: string;
}

/**
 * AdditionalInfoCard component
 * 
 * @description
 * Renders additional information in a card with gradient background,
 * decorative elements, and HTML content support. Typically used for
 * tips, notes, or supplementary advice.
 * 
 * @example
 * ```tsx
 * <AdditionalInfoCard
 *   content="<p><em>Remember to stay hydrated throughout the day.</em></p>"
 * />
 * ```
 * 
 * @param {AdditionalInfoCardProps} props - Component props
 * @returns {JSX.Element} Rendered additional info card
 */
export const AdditionalInfoCard: React.FC<AdditionalInfoCardProps> = ({
  content,
  className = ''
}) => {
  return (
    <div 
      className={`
        relative overflow-hidden rounded-2xl 
        bg-gradient-to-br from-gray-50/50 to-gray-100/30 
        p-6 border border-gray-200/40
        ${className}
      `}
    >
      {/* Decorative background element */}
      <div 
        className="
          absolute -top-8 -right-8 
          w-24 h-24 rounded-full 
          bg-gradient-to-br from-gray-100/20 to-gray-200/10 
          blur-2xl
        "
        aria-hidden="true"
      />
      
      {/* Content container */}
      <div className="relative flex items-start space-x-3">
        {/* Vertical accent line */}
        <div 
          className="
            w-1 h-full 
            bg-gradient-to-b from-gray-300/50 to-gray-400/30 
            rounded-full flex-shrink-0
          "
          aria-hidden="true"
        />
        
        {/* HTML Content */}
        <div 
          className="
            text-[14px] text-gray-600 
            leading-[1.6] italic font-medium
            [&_em]:not-italic [&_em]:font-semibold
            [&_strong]:font-bold [&_strong]:text-gray-700
            [&_p]:mb-2 [&_p:last-child]:mb-0
            [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-2
            [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-2
            [&_li]:mb-1
          "
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </div>
  );
};

/**
 * Export component and types
 */
export type { AdditionalInfoCardProps };