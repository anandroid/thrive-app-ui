/**
 * Image Analysis Service
 * Provides AI-powered image analysis using Gemini API
 * Falls back to keyword analysis when API is not available
 */

import { geminiService } from '../gemini/GeminiService';

export interface PantryItemAnalysis {
  name: string;
  confidence: number;
  category?: 'supplement' | 'medicine' | 'food' | 'herb' | 'remedy' | 'other';
  suggestedTags?: string[];
  description?: string;
  dosageInfo?: string;
  warnings?: string[];
}

export class ImageAnalysisService {
  /**
   * Analyze image using Gemini API if available, otherwise fall back to basic analysis
   */
  async analyzeImage(imageBase64: string): Promise<PantryItemAnalysis> {
    try {
      // Try Gemini API first if configured
      if (geminiService.isConfigured()) {
        return await geminiService.analyzePantryItem(imageBase64);
      }
    } catch (error) {
      console.error('Gemini API analysis failed, using fallback:', error);
    }
    
    // Basic fallback - prompt user to enter details manually
    return {
      name: '',
      confidence: 0,
      category: 'other',
      suggestedTags: [],
      description: 'Please enter item details manually'
    };
  }

  /**
   * Analyze item name and suggest metadata
   */
  async analyzeItemName(name: string): Promise<PantryItemAnalysis> {
    try {
      // Try Gemini API first if configured
      if (geminiService.isConfigured()) {
        return await geminiService.quickAnalyze(name);
      }
    } catch (error) {
      console.error('Gemini API quick analysis failed, using fallback:', error);
    }
    
    // Fallback to keyword analysis
    return this.keywordAnalysis(name);
  }
  
  /**
   * Basic keyword-based analysis fallback
   */
  private keywordAnalysis(name: string): PantryItemAnalysis {
    // const lowercaseName = name.toLowerCase(); // Reserved for future use
    
    // Category detection based on keywords
    let category: PantryItemAnalysis['category'] = 'other';
    const suggestedTags: string[] = [];
    
    // Supplement keywords
    if (/vitamin|mineral|supplement|omega|probiotic|collagen/i.test(name)) {
      category = 'supplement';
      suggestedTags.push('supplement');
      
      if (/vitamin\s*[a-e]/i.test(name)) suggestedTags.push('vitamin');
      if (/vitamin\s*d/i.test(name)) suggestedTags.push('immune-support');
      if (/vitamin\s*c/i.test(name)) suggestedTags.push('immune-support');
      if (/omega/i.test(name)) suggestedTags.push('heart-health');
      if (/probiotic/i.test(name)) suggestedTags.push('digestive-health');
    }
    
    // Medicine keywords
    else if (/medicine|medication|pain|relief|tablet|capsule|pill/i.test(name)) {
      category = 'medicine';
      suggestedTags.push('medicine');
      
      if (/pain/i.test(name)) suggestedTags.push('pain-relief');
      if (/sleep/i.test(name)) suggestedTags.push('sleep-aid');
      if (/allergy/i.test(name)) suggestedTags.push('allergy-relief');
    }
    
    // Herb keywords
    else if (/herb|tea|root|leaf|extract|tincture|essential/i.test(name)) {
      category = 'herb';
      suggestedTags.push('herb');
      
      if (/tea/i.test(name)) suggestedTags.push('tea');
      if (/sleep|chamomile|valerian/i.test(name)) suggestedTags.push('sleep-aid');
      if (/ginger|turmeric/i.test(name)) suggestedTags.push('anti-inflammatory');
      if (/echinacea|elderberry/i.test(name)) suggestedTags.push('immune-support');
    }
    
    // Food keywords
    else if (/food|snack|bar|powder|shake|juice/i.test(name)) {
      category = 'food';
      suggestedTags.push('food');
      
      if (/protein/i.test(name)) suggestedTags.push('protein');
      if (/energy/i.test(name)) suggestedTags.push('energy');
      if (/organic/i.test(name)) suggestedTags.push('organic');
    }
    
    // Remedy keywords
    else if (/remedy|balm|salve|oil|cream|lotion/i.test(name)) {
      category = 'remedy';
      suggestedTags.push('remedy');
      
      if (/muscle|joint/i.test(name)) suggestedTags.push('pain-relief');
      if (/skin/i.test(name)) suggestedTags.push('skin-care');
    }
    
    // Generate description based on category
    let description = '';
    switch (category) {
      case 'supplement':
        description = 'Dietary supplement to support health and wellness';
        break;
      case 'medicine':
        description = 'Medication for health management';
        break;
      case 'herb':
        description = 'Natural herbal product';
        break;
      case 'food':
        description = 'Nutritional food product';
        break;
      case 'remedy':
        description = 'Natural remedy for wellness';
        break;
      default:
        description = 'Health and wellness product';
    }
    
    // Extract dosage info if present
    let dosageInfo: string | undefined;
    const dosageMatch = name.match(/(\d+)\s*(mg|g|ml|iu|mcg)/i);
    if (dosageMatch) {
      dosageInfo = `Contains ${dosageMatch[0]}`;
    }
    
    return {
      name: this.formatProductName(name),
      confidence: 0.6, // Medium confidence for keyword-based analysis
      category,
      suggestedTags: [...new Set(suggestedTags)], // Remove duplicates
      description,
      dosageInfo
    };
  }
  
  /**
   * Format product name to proper case
   */
  private formatProductName(name: string): string {
    return name
      .split(' ')
      .map(word => {
        // Keep acronyms uppercase
        if (word.length <= 3 && word === word.toUpperCase()) {
          return word;
        }
        // Capitalize first letter
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  }
  
  /**
   * Check if image analysis is supported (placeholder for future browser APIs)
   */
  static isSupported(): boolean {
    // In the future, we could check for:
    // - Shape Detection API
    // - Text Detection API
    // - WebCodecs API
    // For now, we always provide fallback functionality
    return true;
  }
}

// Export singleton instance
export const imageAnalysisService = new ImageAnalysisService();