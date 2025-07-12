/**
 * @fileoverview Post-action message templates for chat assistant
 * @module utils/chat/postActionMessages
 * 
 * Provides message templates for the chat assistant after user actions
 */

export interface PostActionMessage {
  type: 'buy_clicked' | 'pantry_added' | 'routine_created' | 'routine_adjusted';
  context: {
    productName?: string;
    dosage?: string;
    timing?: string;
    routineName?: string;
    routineType?: string;
  };
}

/**
 * Generate a message for the chat assistant based on user action
 * @param action - The action taken by the user
 * @returns Message string for the chat assistant
 */
export const generatePostActionMessage = (action: PostActionMessage): string => {
  const { type, context } = action;
  
  switch (type) {
    case 'buy_clicked':
      return `I clicked on "Where to find ${context.productName || 'the supplement'}". ` +
             `Should I order it now or would you like to suggest other options first?`;
    
    case 'pantry_added':
      return `I just added ${context.productName || 'the supplement'} ` +
             `${context.dosage ? `(${context.dosage})` : ''} to my pantry. ` +
             `What's the best way to incorporate it into my routine?`;
    
    case 'routine_created':
      return `I created the ${context.routineName || 'wellness routine'}! ` +
             `Any tips for sticking with it?`;
    
    case 'routine_adjusted':
      return `I updated my ${context.routineName || 'routine'} as suggested. ` +
             `Is there anything else I should consider?`;
    
    default:
      return 'I completed the action you suggested. What should I do next?';
  }
};

/**
 * Generate context summary for the chat assistant
 * @param action - The action taken
 * @returns Context string to append to basicContext
 */
export const generateActionContext = (action: PostActionMessage): string => {
  const { type, context } = action;
  
  switch (type) {
    case 'pantry_added':
      return `User just added: ${context.productName} ${context.dosage || ''} to pantry`;
    
    case 'buy_clicked':
      return `User clicked buy for: ${context.productName}`;
    
    case 'routine_created':
      return `User created routine: ${context.routineName}`;
    
    case 'routine_adjusted':
      return `User adjusted routine: ${context.routineName}`;
    
    default:
      return '';
  }
};