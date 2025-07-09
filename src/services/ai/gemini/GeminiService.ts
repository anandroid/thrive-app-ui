/**
 * Gemini API Service (Client-side)
 * Provides AI-powered image analysis using Google's Gemini API via Next.js API routes
 */

import { PantryItemAnalysis } from '../fallback/ImageAnalysisService';

export class GeminiService {
  private static instance: GeminiService;
  
  private constructor() {}
  
  static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }
  
  /**
   * Check if the service is configured and ready to use
   * For client-side, we assume it's configured if the API route exists
   */
  isConfigured(): boolean {
    return true;
  }
  
  /**
   * Analyze a pantry item from image using Gemini Vision API
   */
  async analyzePantryItem(imageBase64: string): Promise<PantryItemAnalysis> {
    try {
      const response = await fetch('/api/pantry/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageBase64,
          mode: 'image'
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  }
  
  /**
   * Quick text-only analysis for pantry items
   */
  async quickAnalyze(itemName: string): Promise<PantryItemAnalysis> {
    try {
      const response = await fetch('/api/pantry/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: itemName,
          mode: 'text'
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const geminiService = GeminiService.getInstance();