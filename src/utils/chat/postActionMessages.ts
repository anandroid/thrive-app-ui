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
             `While I'm checking it out, what techniques can I try tonight for immediate relief?`;
    
    case 'pantry_added':
      // More specific messages based on supplement type
      const productName = context.productName || 'the supplement';
      const supplementMessages: Record<string, string> = {
        'Magnesium': `I added ${productName} to my pantry. Since this helps with sleep, should I take it every night or just when I'm having trouble?`,
        'Melatonin': `I added ${productName} to my pantry. Should I take this every night or only occasionally?`,
        'Vitamin D': `I added ${productName} to my pantry. What's the best time of day to take this for energy?`,
        'Ashwagandha': `I added ${productName} to my pantry. How long before I might notice stress reduction benefits?`,
        'L-Theanine': `I added ${productName} to my pantry. Can I take this daily or should I cycle it?`,
        'Omega-3': `I added ${productName} to my pantry. Should I take this with food or on an empty stomach?`,
        'Probiotics': `I added ${productName} to my pantry. When's the best time to take this for gut health?`,
      };
      
      // Find matching supplement type
      const supplementKey = Object.keys(supplementMessages).find(key => 
        productName.toLowerCase().includes(key.toLowerCase())
      );
      
      if (supplementKey) {
        return supplementMessages[supplementKey];
      }
      
      return `I added ${productName} ${context.dosage ? `(${context.dosage})` : ''} to my pantry. ` +
             `When would be the best time to start taking it?`;
    
    case 'routine_created':
      return `I created the ${context.routineName || 'wellness routine'}! ` +
             `I'm excited to start. Will you help me track my progress?`;
    
    case 'routine_adjusted':
      return `I updated my ${context.routineName || 'routine'} as suggested. ` +
             `Should I start with the new changes today?`;
    
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