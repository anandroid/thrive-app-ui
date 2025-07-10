/**
 * @fileoverview Icon mapping utilities for actionable items
 * @module utils/chat/iconMapping
 * 
 * This module provides utilities for mapping actionable item types and icon names
 * to appropriate Lucide React icons.
 * 
 * @see {@link https://lucide.dev} for available icons
 * @see {@link components/features/SmartCardChat.tsx} for usage
 */

import {
  Calendar,
  Pill,
  Heart,
  Sparkles,
  Moon,
  Brain,
  Activity,
  FileText,
  Globe,
  BookOpen,
  ShoppingCart,
  PlusCircle,
  LucideIcon
} from 'lucide-react';
import { ActionableItem } from '@/src/services/openai/types';

/**
 * Map of icon names to Lucide React components
 * @constant
 */
export const ICON_MAP = {
  'calendar': Calendar,
  'pill': Pill,
  'heart': Heart,
  'sparkles': Sparkles,
  'moon': Moon,
  'brain': Brain,
  'activity': Activity,
  'file-text': FileText,
  'globe': Globe,
  'book-open': BookOpen,
  'shopping-cart': ShoppingCart,
  'plus-circle': PlusCircle
} as const;

/**
 * Valid icon names
 * @type
 */
export type IconName = keyof typeof ICON_MAP;

/**
 * Color scheme configuration for actionable items
 * @interface
 */
export interface ColorScheme {
  gradientClass: string;
  iconColorClass: string;
  backgroundClass: string;
  shadowClass: string;
  borderColorHover: string;
}

/**
 * Get icon component for an actionable item
 * @param {ActionableItem} item - The actionable item
 * @returns {LucideIcon} The appropriate icon component
 * 
 * @example
 * const Icon = getItemIcon(actionableItem);
 * <Icon className="w-4 h-4" />
 */
export const getItemIcon = (item: ActionableItem): LucideIcon => {
  // Check for explicit icon property
  if (item.icon && item.icon in ICON_MAP) {
    return ICON_MAP[item.icon as IconName];
  }
  
  // Default icons based on type
  switch (item.type) {
    case 'appointment':
      return Calendar;
    case 'medicine':
    case 'supplement':
      return Pill;
    case 'routine':
    case 'create_routine':
    case 'thriving':
      return Sparkles;
    case 'information':
      return FileText;
    case 'buy':
      return ShoppingCart;
    case 'add_to_pantry':
    case 'already_have':
      return PlusCircle;
    default:
      return Heart;
  }
};

/**
 * Get color scheme based on index (cycles through 3 color schemes)
 * @param {number} index - The index of the item
 * @returns {ColorScheme} The color scheme configuration
 * 
 * @description
 * Color sequence: sage green -> pink/bronze -> slate blue -> repeat
 * 
 * @example
 * const colorScheme = getColorScheme(index);
 * <div className={`bg-gradient-to-r ${colorScheme.gradientClass}`}>
 */
export const getColorScheme = (index: number): ColorScheme => {
  const colorIndex = index % 3;
  
  switch (colorIndex) {
    case 0:
      // Light sage green
      return {
        gradientClass: "from-sage-light/30 to-sage/20",
        iconColorClass: "text-sage-dark",
        backgroundClass: "from-sage-light/10 to-sage/5",
        shadowClass: "shadow-sage/15",
        borderColorHover: "hover:border-sage/30"
      };
    case 1:
      // Light pink/bronze
      return {
        gradientClass: "from-rose/20 to-dusty-rose/15",
        iconColorClass: "text-rose",
        backgroundClass: "from-rose/5 to-dusty-rose/5",
        shadowClass: "shadow-rose/10",
        borderColorHover: "hover:border-rose/25"
      };
    case 2:
    default:
      // Light slate blue
      return {
        gradientClass: "from-slate-300/30 to-slate-400/20",
        iconColorClass: "text-slate-700",
        backgroundClass: "from-slate-50 to-slate-100/50",
        shadowClass: "shadow-slate-300/20",
        borderColorHover: "hover:border-slate-400/30"
      };
  }
};

/**
 * Check if an item is a thriving-related action
 * @param {ActionableItem} item - The actionable item to check
 * @returns {boolean} True if the item is thriving-related
 * 
 * @example
 * if (isThrivingAction(item)) {
 *   // Handle thriving-specific logic
 * }
 */
export const isThrivingAction = (item: ActionableItem): boolean => {
  return item.type === 'create_routine' || 
         item.type === 'routine' || 
         item.type === 'thriving' || 
         item.type === 'start_journey';
};

/**
 * Check if an item is a supplement-related action
 * @param {ActionableItem} item - The actionable item to check
 * @returns {boolean} True if the item is supplement-related
 * 
 * @example
 * if (isSupplementAction(item)) {
 *   // Handle supplement-specific logic
 * }
 */
export const isSupplementAction = (item: ActionableItem): boolean => {
  return item.type === 'buy' || 
         item.type === 'already_have' || 
         item.type === 'supplement_choice' ||
         (item.productName !== undefined) ||
         (Boolean(item.title) && (
           item.title.toLowerCase().includes('magnesium') ||
           item.title.toLowerCase().includes('melatonin') ||
           item.title.toLowerCase().includes('vitamin') ||
           item.title.toLowerCase().includes('supplement')
         ));
};