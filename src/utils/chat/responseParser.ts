/**
 * @fileoverview Assistant response parsing utilities
 * @module utils/chat/responseParser
 * 
 * This module provides utilities for parsing OpenAI assistant responses
 * and ensuring proper formatting of actionable items.
 * 
 * @see {@link src/services/openai/types/index.ts} for type definitions
 * @see {@link components/features/SmartCardChat.tsx} for usage
 */

import {
  AssistantResponse,
  PartialAssistantResponse,
  ActionableItem,
  ActionItem,
  EnhancedQuestion
} from '@/src/services/openai/types';

/**
 * Parses complete assistant response from JSON string
 * @param {string} content - JSON string containing assistant response
 * @returns {AssistantResponse | undefined} Parsed response or undefined if invalid
 * 
 * @example
 * const response = parseAssistantResponse(jsonString);
 * if (response) {
 *   console.log(response.greeting);
 * }
 */
export const parseAssistantResponse = (content: string): AssistantResponse | undefined => {
  try {
    // First try to parse as JSON
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === 'object') {
      // Post-process actionableItems to ensure both buy and already_have options exist for supplements
      if (parsed.actionableItems && Array.isArray(parsed.actionableItems)) {
        const supplementBuyActions = parsed.actionableItems.filter((item: ActionableItem) => 
          item.type === 'buy' && (item.productName || item.title.toLowerCase().includes('magnesium') || 
          item.title.toLowerCase().includes('melatonin') || item.title.toLowerCase().includes('vitamin') ||
          item.title.toLowerCase().includes('supplement'))
        );
        
        // For each buy action, check if there's a corresponding already_have action
        for (const buyAction of supplementBuyActions) {
          const productName = buyAction.productName || buyAction.title.replace(/^Where to find |^Buy |^Get /i, '').trim();
          const hasAlreadyHaveOption = parsed.actionableItems.some((item: ActionableItem) => 
            item.type === 'already_have' && 
            (item.productName === productName || item.title.includes(productName))
          );
          
          if (!hasAlreadyHaveOption) {
            // Insert the already_have option before the buy option
            const buyIndex = parsed.actionableItems.indexOf(buyAction);
            const alreadyHaveOption: ActionableItem = {
              type: 'already_have',
              title: 'I already have',
              description: 'Track in pantry',
              productName: productName,
              suggestedNotes: buyAction.dosage ? `${buyAction.dosage}, ${buyAction.timing || 'as directed'}` : '',
              contextMessage: 'Great! Tracking this helps me personalize your wellness routines',
              dosage: buyAction.dosage,
              timing: buyAction.timing
            };
            parsed.actionableItems.splice(buyIndex, 0, alreadyHaveOption);
          }
        }
      }
      
      return parsed as AssistantResponse;
    }
    return undefined;
  } catch {
    // If JSON parsing fails, check if it's plain text
    if (typeof content === 'string' && content.trim().length > 0) {
      // This is a fallback for when the assistant returns plain text instead of JSON
      // Convert plain text to proper JSON structure
      console.warn('Assistant returned plain text instead of JSON:', content);
      
      // Check if it's a supplement recommendation
      const hasSupplementMention = /magnesium|vitamin|melatonin|supplement|before bed|dosage|mg/i.test(content);
      
      const fallbackResponse: AssistantResponse = {
        greeting: content,
        attentionRequired: null,
        emergencyReasoning: null,
        actionItems: [],
        additionalInformation: '',
        actionableItems: [],
        questions: []
      };
      
      // If it mentions supplements, try to extract and create actionableItems
      if (hasSupplementMention) {
        // Try to extract supplement info from the text
        const magnesiumMatch = content.match(/magnesium\s*(?:glycinate)?/i);
        const dosageMatch = content.match(/(\d+[-–]\d+|\d+)\s*mg/i);
        const timingMatch = content.match(/before bed|minutes before|at bedtime/i);
        
        if (magnesiumMatch) {
          const productName = "Magnesium Glycinate";
          const dosage = dosageMatch ? dosageMatch[0] : "200-400mg";
          const timing = timingMatch ? "30 minutes before bed" : "before bed";
          
          // Only add supplement_choice - the UI will automatically create both buttons
          fallbackResponse.actionableItems = [
            {
              type: 'supplement_choice',
              title: `Consider ${productName}`,
              description: 'Helps with sleep quality and muscle relaxation',
              productName: productName,
              dosage: dosage,
              timing: timing,
              searchQuery: 'magnesium+glycinate',
              suggestedNotes: `${dosage}, ${timing}`
            }
          ];
        }
      }
      
      return fallbackResponse;
    }
    return undefined;
  }
};

/**
 * Parses partial assistant response for progressive rendering during streaming
 * @param {string} content - Partial JSON string containing assistant response
 * @returns {PartialAssistantResponse | undefined} Parsed partial response or undefined
 * 
 * @description
 * This function attempts to parse incomplete JSON responses during streaming,
 * extracting completed fields for progressive UI updates.
 * 
 * @example
 * const partialResponse = parsePartialAssistantResponse(partialJson);
 * if (partialResponse?.greeting) {
 *   // Show greeting while other content is still streaming
 * }
 */
export const parsePartialAssistantResponse = (content: string): PartialAssistantResponse | undefined => {
  try {
    // Try to parse complete JSON first
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === 'object') {
      // Apply same post-processing as complete response
      if (parsed.actionableItems && Array.isArray(parsed.actionableItems)) {
        const supplementBuyActions = parsed.actionableItems.filter((item: ActionableItem) => 
          item.type === 'buy' && (item.productName || item.title.toLowerCase().includes('magnesium') || 
          item.title.toLowerCase().includes('melatonin') || item.title.toLowerCase().includes('vitamin') ||
          item.title.toLowerCase().includes('supplement'))
        );
        
        for (const buyAction of supplementBuyActions) {
          const productName = buyAction.productName || buyAction.title.replace(/^Where to find |^Buy |^Get /i, '').trim();
          const hasAlreadyHaveOption = parsed.actionableItems.some((item: ActionableItem) => 
            item.type === 'already_have' && 
            (item.productName === productName || item.title.includes(productName))
          );
          
          if (!hasAlreadyHaveOption) {
            const buyIndex = parsed.actionableItems.indexOf(buyAction);
            const alreadyHaveOption: ActionableItem = {
              type: 'already_have',
              title: 'I already have',
              description: 'Track in pantry',
              productName: productName,
              suggestedNotes: buyAction.dosage ? `${buyAction.dosage}, ${buyAction.timing || 'as directed'}` : '',
              contextMessage: 'Great! Tracking this helps me personalize your wellness routines',
              dosage: buyAction.dosage,
              timing: buyAction.timing
            };
            parsed.actionableItems.splice(buyIndex, 0, alreadyHaveOption);
          }
        }
      }
      
      return parsed as PartialAssistantResponse;
    }
  } catch {
    // If complete parse fails, try to extract completed fields
    const partial: PartialAssistantResponse = {};
    
    // Extract greeting if complete
    const greetingMatch = content.match(/"greeting"\s*:\s*"([^"]*)"(?:\s*,|\s*})/);
    if (greetingMatch && greetingMatch[1]) {
      partial.greeting = greetingMatch[1];
    }
    
    // Extract attentionRequired if complete
    const attentionMatch = content.match(/"attentionRequired"\s*:\s*"([^"]*)"/);
    if (attentionMatch) {
      partial.attentionRequired = attentionMatch[1] as 'emergency' | null;
    }
    
    // Extract emergencyReasoning if complete
    const emergencyMatch = content.match(/"emergencyReasoning"\s*:\s*"([^"]*)"/);
    if (emergencyMatch) {
      partial.emergencyReasoning = emergencyMatch[1];
    }
    
    // Extract complete action items
    const actionItemsMatch = content.match(/"actionItems"\s*:\s*\[([\s\S]*?)(?:\]|$)/);
    if (actionItemsMatch) {
      try {
        if (content.includes('"actionItems"') && content.includes(']', content.indexOf('"actionItems"'))) {
          const completeMatch = content.match(/"actionItems"\s*:\s*\[([\s\S]*?)\]/);
          if (completeMatch) {
            const items = JSON.parse('[' + completeMatch[1] + ']');
            if (Array.isArray(items) && items.length > 0) {
              partial.actionItems = items;
            }
          }
        } else {
          // Try to extract individual completed items
          const partialItems: ActionItem[] = [];
          const itemMatches = actionItemsMatch[1].matchAll(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
          for (const match of itemMatches) {
            try {
              const item = JSON.parse(match[0]);
              if (item.title && item.content) {
                partialItems.push(item);
              }
            } catch {}
          }
          if (partialItems.length > 0) {
            partial.actionItems = partialItems;
          }
        }
      } catch {}
    }
    
    // Extract complete actionable items
    const actionableMatch = content.match(/"actionableItems"\s*:\s*\[([\s\S]*?)(?:\]|$)/);
    if (actionableMatch) {
      try {
        if (content.includes('"actionableItems"') && content.includes(']', content.indexOf('"actionableItems"'))) {
          const completeMatch = content.match(/"actionableItems"\s*:\s*\[([\s\S]*?)\]/);
          if (completeMatch) {
            const items = JSON.parse('[' + completeMatch[1] + ']');
            if (Array.isArray(items) && items.length > 0) {
              partial.actionableItems = items;
            }
          }
        } else {
          // Try to extract individual completed items
          const partialItems: ActionableItem[] = [];
          const itemMatches = actionableMatch[1].matchAll(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
          for (const match of itemMatches) {
            try {
              const item = JSON.parse(match[0]);
              if (item.title && item.type) {
                partialItems.push(item);
              }
            } catch {}
          }
          if (partialItems.length > 0) {
            // Post-process for supplement actions
            const supplementBuyActions = partialItems.filter((item: ActionableItem) => 
              item.type === 'buy' && (item.productName || (item.title && item.title.includes('find')))
            );
            
            for (const buyAction of supplementBuyActions) {
              const productName = buyAction.productName || buyAction.title.replace(/^Where to find |^Buy |^Get /i, '').trim();
              const hasAlreadyHaveOption = partialItems.some((item: ActionableItem) => 
                item.type === 'already_have' && 
                (item.productName === productName || item.title.includes(productName))
              );
              
              if (!hasAlreadyHaveOption) {
                const buyIndex = partialItems.indexOf(buyAction);
                const alreadyHaveOption: ActionableItem = {
                  type: 'already_have',
                  title: `I already have ${productName}`,
                  description: 'Add to your pantry for personalized tracking',
                  productName: productName,
                  suggestedNotes: buyAction.dosage ? `${buyAction.dosage}, ${buyAction.timing || 'as directed'}` : '',
                  contextMessage: 'Great! Tracking this helps me personalize your wellness routines'
                };
                partialItems.splice(buyIndex, 0, alreadyHaveOption);
              }
            }
            
            partial.actionableItems = partialItems;
          }
        }
      } catch {}
    }
    
    // Extract additionalInformation if complete
    const infoMatch = content.match(/"additionalInformation"\s*:\s*"([^"]*)"/);
    if (infoMatch) {
      partial.additionalInformation = infoMatch[1];
    }
    
    // Extract questions array (enhanced questions)
    const questionsMatch = content.match(/"questions"\s*:\s*\[([\s\S]*?)\]/);
    if (questionsMatch) {
      try {
        const questionsContent = '[' + questionsMatch[1] + ']';
        const questions = JSON.parse(questionsContent);
        if (Array.isArray(questions) && questions.length > 0) {
          partial.questions = questions;
        }
      } catch {}
    }
    
    return Object.keys(partial).length > 0 ? partial : undefined;
  }
};

/**
 * Type guard to check if questions are in enhanced format
 * @param {any} questions - Questions array to check
 * @returns {questions is EnhancedQuestion[]} True if questions are enhanced
 */
export const isEnhancedQuestions = (questions: unknown): questions is EnhancedQuestion[] => {
  return Array.isArray(questions) && 
         questions.length > 0 && 
         typeof questions[0] === 'object' &&
         questions[0] !== null &&
         'id' in questions[0] &&
         'type' in questions[0];
};

/**
 * Type guard to check if questions are legacy string format
 * @param {any} questions - Questions array to check
 * @returns {questions is string[]} True if questions are strings
 */
export const isLegacyQuestions = (questions: unknown): questions is string[] => {
  return Array.isArray(questions) && 
         questions.length > 0 && 
         typeof questions[0] === 'string';
};