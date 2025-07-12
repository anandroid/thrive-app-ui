/**
 * @fileoverview User Learning Profile Management
 * @module lib/userLearningProfile
 * 
 * Manages user learning profiles for AI personalization.
 * Provides progressive learning capabilities through data analysis.
 */

import { UserLearningProfile, JournalEntry, Thriving } from '@/src/types/thriving';
import { JournalInsightsEngine } from './journalInsights';

const STORAGE_KEY = 'thrive_user_learning_profile';
const PROFILE_VERSION = '1.0';

export class UserLearningProfileManager {
  /**
   * Get the current user learning profile
   */
  static getUserProfile(): UserLearningProfile {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const profile = JSON.parse(stored) as UserLearningProfile;
        
        // Migrate older versions if needed
        if (profile.version !== PROFILE_VERSION) {
          return this.migrateProfile(profile);
        }
        
        return profile;
      }
    } catch (error) {
      console.error('Error loading user learning profile:', error);
    }

    // Return default profile
    return this.createDefaultProfile();
  }

  /**
   * Update user profile with new insights from journal entries
   */
  static updateProfileFromJournalEntries(
    entries: JournalEntry[], 
    routines: Thriving[]
  ): UserLearningProfile {
    const currentProfile = this.getUserProfile();
    
    // Update data points count
    const newDataPoints = entries.length;
    const confidenceLevel = Math.min(newDataPoints / 50, 1); // Max confidence at 50+ entries

    // Analyze sleep patterns
    const sleepInsights = JournalInsightsEngine.analyzeSleepPatterns(entries);
    
    // Analyze pain patterns
    const painInsights = JournalInsightsEngine.analyzePainPatterns(entries);
    
    // Analyze stress patterns
    const stressInsights = JournalInsightsEngine.analyzeStressPatterns(entries);
    
    // Analyze routine adherence patterns
    const routineInsights = this.analyzeRoutinePersonalization(entries, routines);
    
    // Analyze supplement tracking
    const supplementInsights = this.analyzeSupplementTracking(entries);

    const updatedProfile: UserLearningProfile = {
      ...currentProfile,
      insights: {
        sleepOptimization: {
          ...currentProfile.insights.sleepOptimization,
          ...sleepInsights
        },
        painManagement: {
          ...currentProfile.insights.painManagement,
          ...painInsights
        },
        stressManagement: {
          ...currentProfile.insights.stressManagement,
          ...stressInsights
        },
        routinePersonalization: routineInsights,
        supplementTracking: supplementInsights
      },
      dataPoints: newDataPoints,
      confidenceLevel,
      lastUpdated: new Date().toISOString()
    };

    // Save updated profile
    this.saveProfile(updatedProfile);
    
    return updatedProfile;
  }

  /**
   * Get personalized recommendations based on user profile
   */
  static getPersonalizedRecommendations(profile: UserLearningProfile): Array<{
    type: 'timing' | 'supplement' | 'activity' | 'environment';
    category: 'sleep' | 'pain' | 'stress' | 'routine';
    recommendation: string;
    confidence: number;
    reasoning: string;
  }> {
    const recommendations: Array<{
      type: 'timing' | 'supplement' | 'activity' | 'environment';
      category: 'sleep' | 'pain' | 'stress' | 'routine';
      recommendation: string;
      confidence: number;
      reasoning: string;
    }> = [];

    // Sleep recommendations
    if (profile.insights.sleepOptimization.optimalBedtime) {
      recommendations.push({
        type: 'timing',
        category: 'sleep',
        recommendation: `Your optimal bedtime appears to be ${profile.insights.sleepOptimization.optimalBedtime}`,
        confidence: profile.confidenceLevel,
        reasoning: `Based on analysis of ${profile.dataPoints} journal entries`
      });
    }

    profile.insights.sleepOptimization.effectiveSupplements
      .filter(s => s.confidence > 0.7)
      .forEach(supplement => {
        recommendations.push({
          type: 'supplement',
          category: 'sleep',
          recommendation: `${supplement.name} has been consistently effective for your sleep`,
          confidence: supplement.confidence,
          reasoning: `Sleep quality improved by ${supplement.effectiveness.toFixed(1)} points on average`
        });
      });

    // Pain management recommendations
    profile.insights.painManagement.reliefStrategies
      .filter(s => s.confidence > 0.6)
      .forEach(strategy => {
        recommendations.push({
          type: 'activity',
          category: 'pain',
          recommendation: `${strategy.strategy} has been effective for pain relief`,
          confidence: strategy.confidence,
          reasoning: `Reduced pain by ${strategy.effectiveness.toFixed(1)} points on average`
        });
      });

    // Stress management recommendations
    if (profile.insights.stressManagement.optimalStressRelieveTiming) {
      recommendations.push({
        type: 'timing',
        category: 'stress',
        recommendation: `${profile.insights.stressManagement.optimalStressRelieveTiming} appears to be your optimal time for stress relief activities`,
        confidence: profile.confidenceLevel,
        reasoning: 'Based on your stress patterns and relief strategy effectiveness'
      });
    }

    // Routine optimization recommendations
    if (profile.insights.routinePersonalization.successPatterns.length > 0) {
      const topPattern = profile.insights.routinePersonalization.successPatterns[0];
      recommendations.push({
        type: 'timing',
        category: 'routine',
        recommendation: `You're most successful with routines when ${topPattern}`,
        confidence: profile.confidenceLevel,
        reasoning: 'Based on your routine completion patterns'
      });
    }

    return recommendations.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Generate contextual prompts based on user learning
   */
  static generateContextualPrompts(
    profile: UserLearningProfile,
    routine: Thriving,
    recentEntries: JournalEntry[]
  ): string[] {
    const prompts: string[] = [];

    // Sleep-specific prompts
    if (routine.type === 'sleep_wellness') {
      const effectiveSupplements = profile.insights.sleepOptimization.effectiveSupplements
        .filter(s => s.confidence > 0.7);
      
      if (effectiveSupplements.length > 0) {
        const topSupplement = effectiveSupplements[0];
        prompts.push(
          `How did ${topSupplement.name} (which has improved your sleep by ${topSupplement.effectiveness.toFixed(1)} points) work tonight?`
        );
      }

      if (profile.insights.sleepOptimization.optimalBedtime) {
        prompts.push(
          `Did you stick to your optimal ${profile.insights.sleepOptimization.optimalBedtime} bedtime tonight?`
        );
      }
    }

    // Pain-specific prompts
    if (routine.type === 'pain_management') {
      const commonTriggers = profile.insights.painManagement.triggers
        .filter(t => t.confidence > 0.6);
      
      if (commonTriggers.length > 0) {
        const topTrigger = commonTriggers[0];
        prompts.push(
          `Did you encounter ${topTrigger.trigger} today? How did it affect your pain levels?`
        );
      }

      const effectiveStrategies = profile.insights.painManagement.reliefStrategies
        .filter(s => s.confidence > 0.6);
        
      if (effectiveStrategies.length > 0) {
        const topStrategy = effectiveStrategies[0];
        prompts.push(
          `How effective was ${topStrategy.strategy} for your pain today?`
        );
      }
    }

    // Stress-specific prompts
    if (routine.type === 'stress_management') {
      const commonStressors = profile.insights.stressManagement.stressTriggers;
      
      if (commonStressors.length > 0) {
        prompts.push(
          `Did you encounter any of your common stress triggers today (${commonStressors.slice(0, 2).join(', ')})?`
        );
      }

      const effectiveCoping = profile.insights.stressManagement.effectiveCopingStrategies
        .filter(s => s.effectiveness > 2);
        
      if (effectiveCoping.length > 0) {
        const topCoping = effectiveCoping[0];
        prompts.push(
          `How did ${topCoping.strategy} (your most effective stress relief) work today?`
        );
      }
    }

    // Pattern-based prompts
    if (this.hasRecentImprovementTrend(recentEntries, routine.type)) {
      prompts.push(
        "Your recent patterns show improvement! What do you think is contributing to this positive change?"
      );
    }

    if (this.hasConsistencyPattern(recentEntries)) {
      prompts.push(
        `You've been consistently journaling for ${recentEntries.length} days! How has this self-reflection been helping you?`
      );
    }

    return prompts;
  }

  /**
   * Get learning insights summary for user
   */
  static getLearningInsightsSummary(profile: UserLearningProfile): {
    totalInsights: number;
    confidenceLevel: number;
    keyFindings: string[];
    dataQuality: 'low' | 'medium' | 'high';
  } {
    const keyFindings: string[] = [];

    // Sleep insights
    if (profile.insights.sleepOptimization.effectiveSupplements.length > 0) {
      const topSupplement = profile.insights.sleepOptimization.effectiveSupplements[0];
      keyFindings.push(`${topSupplement.name} improves your sleep quality by ${topSupplement.effectiveness.toFixed(1)} points`);
    }

    if (profile.insights.sleepOptimization.optimalBedtime) {
      keyFindings.push(`Your optimal bedtime is ${profile.insights.sleepOptimization.optimalBedtime}`);
    }

    // Pain insights
    if (profile.insights.painManagement.reliefStrategies.length > 0) {
      const topStrategy = profile.insights.painManagement.reliefStrategies[0];
      keyFindings.push(`${topStrategy.strategy} reduces your pain by ${topStrategy.effectiveness.toFixed(1)} points`);
    }

    // Stress insights
    if (profile.insights.stressManagement.effectiveCopingStrategies.length > 0) {
      const topCoping = profile.insights.stressManagement.effectiveCopingStrategies[0];
      keyFindings.push(`${topCoping.strategy} is your most effective stress relief strategy`);
    }

    // Routine insights
    if (profile.insights.routinePersonalization.successPatterns.length > 0) {
      const topPattern = profile.insights.routinePersonalization.successPatterns[0];
      keyFindings.push(`You're most successful when ${topPattern}`);
    }

    const dataQuality: 'low' | 'medium' | 'high' = 
      profile.dataPoints < 10 ? 'low' :
      profile.dataPoints < 30 ? 'medium' : 'high';

    return {
      totalInsights: keyFindings.length,
      confidenceLevel: profile.confidenceLevel,
      keyFindings,
      dataQuality
    };
  }

  /**
   * Reset user learning profile (for testing or privacy)
   */
  static resetProfile(): UserLearningProfile {
    const defaultProfile = this.createDefaultProfile();
    this.saveProfile(defaultProfile);
    return defaultProfile;
  }

  // Private helper methods
  private static createDefaultProfile(): UserLearningProfile {
    return {
      userId: 'local_user',
      insights: {
        sleepOptimization: {
          effectiveSupplements: [],
          environmentFactors: [],
          averageQuality: 0,
          patterns: {}
        },
        painManagement: {
          triggers: [],
          reliefStrategies: [],
          painPatterns: {}
        },
        stressManagement: {
          stressTriggers: [],
          effectiveCopingStrategies: [],
          stressPatterns: {}
        },
        routinePersonalization: {
          preferredTiming: [],
          motivationStyle: 'gentle',
          successPatterns: [],
          completionRates: {}
        },
        supplementTracking: {
          effectiveness: {},
          interactions: [],
          preferences: []
        }
      },
      dataPoints: 0,
      lastUpdated: new Date().toISOString(),
      confidenceLevel: 0,
      version: PROFILE_VERSION
    };
  }

  private static saveProfile(profile: UserLearningProfile): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch (error) {
      console.error('Error saving user learning profile:', error);
    }
  }

  private static migrateProfile(oldProfile: UserLearningProfile): UserLearningProfile {
    // Handle profile migrations for version changes
    const newProfile = this.createDefaultProfile();
    
    // Copy over any compatible data
    if (oldProfile.insights) {
      newProfile.insights = { ...newProfile.insights, ...oldProfile.insights };
    }
    
    newProfile.dataPoints = oldProfile.dataPoints || 0;
    newProfile.confidenceLevel = oldProfile.confidenceLevel || 0;
    
    this.saveProfile(newProfile);
    return newProfile;
  }

  private static analyzeRoutinePersonalization(
    entries: JournalEntry[], 
    _routines: Thriving[] // eslint-disable-line @typescript-eslint/no-unused-vars
  ): UserLearningProfile['insights']['routinePersonalization'] {
    const completionData = entries.filter(entry => 
      entry.customData?.routineCompleted !== undefined
    );

    const completionRates: Record<string, number> = {};
    const successPatterns: string[] = [];
    const preferredTiming: string[] = [];

    // Analyze completion rates by day of week
    const dayPerformance: Record<string, {completed: number, total: number}> = {};
    
    completionData.forEach(entry => {
      const date = new Date(entry.date);
      const dayOfWeek = date.toLocaleDateString('en', { weekday: 'long' });
      const completed = entry.customData?.routineCompleted;
      const completionTime = entry.customData?.completionTime;

      if (!dayPerformance[dayOfWeek]) {
        dayPerformance[dayOfWeek] = { completed: 0, total: 0 };
      }
      dayPerformance[dayOfWeek].total++;
      if (completed) {
        dayPerformance[dayOfWeek].completed++;
        
        // Track preferred timing
        if (completionTime && !preferredTiming.includes(String(completionTime))) {
          preferredTiming.push(String(completionTime));
        }
      }
    });

    // Calculate completion rates
    Object.entries(dayPerformance).forEach(([day, data]) => {
      completionRates[day] = data.total > 0 ? data.completed / data.total : 0;
    });

    // Identify success patterns
    const bestDays = Object.entries(completionRates)
      .filter(([, rate]) => rate > 0.7)
      .map(([day]) => day);
    
    if (bestDays.length > 0) {
      successPatterns.push(`completing routines on ${bestDays.join(', ')}`);
    }

    // Analyze timing patterns
    const timePerformance: Record<string, number> = {};
    completionData.forEach(entry => {
      const time = String(entry.customData?.completionTime || '');
      const completed = Boolean(entry.customData?.routineCompleted);
      
      if (time) {
        if (!timePerformance[time]) timePerformance[time] = 0;
        if (completed) timePerformance[time]++;
      }
    });

    const bestTimes = Object.entries(timePerformance)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .map(([time]) => time);

    if (bestTimes.length > 0) {
      successPatterns.push(`doing routines at ${bestTimes.join(' or ')}`);
    }

    // Determine motivation style based on completion patterns
    // const totalEntries = completionData.length;
    const avgCompletionRate = Object.values(completionRates).reduce((sum, rate) => sum + rate, 0) / Object.keys(completionRates).length;
    
    let motivationStyle: 'gentle' | 'structured' | 'flexible' = 'gentle';
    if (avgCompletionRate > 0.8) {
      motivationStyle = 'structured';
    } else if (avgCompletionRate > 0.6) {
      motivationStyle = 'flexible';
    }

    return {
      preferredTiming: preferredTiming.slice(0, 3), // Top 3 preferred times
      motivationStyle,
      successPatterns,
      completionRates
    };
  }

  private static analyzeSupplementTracking(
    entries: JournalEntry[]
  ): UserLearningProfile['insights']['supplementTracking'] {
    const supplementData: Record<string, {
      ratings: number[];
      sideEffects: string[];
      timings: string[];
    }> = {};

    entries.forEach(entry => {
      const supplements = (entry.customData?.supplements as string[]) || [];
      const supplementRating = Number(entry.customData?.supplementRating);
      const sideEffects = (entry.customData?.sideEffects as string[]) || [];
      const supplementTiming = String(entry.customData?.supplementTiming || '');

      supplements.forEach((supplement: string) => {
        if (!supplementData[supplement]) {
          supplementData[supplement] = { ratings: [], sideEffects: [], timings: [] };
        }

        if (!isNaN(supplementRating)) supplementData[supplement].ratings.push(supplementRating);
        if (sideEffects.length > 0) supplementData[supplement].sideEffects.push(...sideEffects);
        if (supplementTiming) supplementData[supplement].timings.push(supplementTiming);
      });
    });

    const effectiveness: Record<string, {rating: number, sideEffects: string[], timing: string}> = {};
    const interactions: string[] = [];
    const preferences: string[] = [];

    Object.entries(supplementData).forEach(([supplement, data]) => {
      if (data.ratings.length > 0) {
        const avgRating = data.ratings.reduce((sum, rating) => sum + rating, 0) / data.ratings.length;
        const uniqueSideEffects = [...new Set(data.sideEffects)];
        const mostCommonTiming = this.getMostCommon(data.timings);

        effectiveness[supplement] = {
          rating: avgRating,
          sideEffects: uniqueSideEffects,
          timing: mostCommonTiming || 'morning'
        };

        // Track preferences (high rating, low side effects)
        if (avgRating >= 7 && uniqueSideEffects.length <= 1) {
          preferences.push(supplement);
        }
      }
    });

    return {
      effectiveness,
      interactions, // Could be enhanced with drug interaction checking
      preferences: preferences.slice(0, 5) // Top 5 preferred supplements
    };
  }

  private static getMostCommon(items: string[]): string | undefined {
    if (items.length === 0) return undefined;
    
    const counts: Record<string, number> = {};
    items.forEach(item => {
      counts[item] = (counts[item] || 0) + 1;
    });

    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)[0]?.[0];
  }

  private static hasRecentImprovementTrend(entries: JournalEntry[], routineType: string): boolean {
    if (entries.length < 5) return false;

    const recent = entries.slice(-7); // Last 7 entries
    const earlier = entries.slice(-14, -7); // 7 entries before that

    if (earlier.length === 0) return false;

    let recentScore = 0;
    let earlierScore = 0;

    if (routineType === 'sleep_wellness') {
      recentScore = recent
        .map(e => Number(e.customData?.sleepQuality) || 0)
        .reduce((sum, val) => sum + val, 0) / recent.length;
      earlierScore = earlier
        .map(e => Number(e.customData?.sleepQuality) || 0)
        .reduce((sum, val) => sum + val, 0) / earlier.length;
    } else if (routineType === 'pain_management') {
      recentScore = recent
        .map(e => e.painLevel || Number(e.customData?.painLevel) || 0)
        .reduce((sum, val) => sum + val, 0) / recent.length;
      earlierScore = earlier
        .map(e => e.painLevel || Number(e.customData?.painLevel) || 0)
        .reduce((sum, val) => sum + val, 0) / earlier.length;
      // For pain, lower is better
      return earlierScore - recentScore > 1;
    } else {
      // Use mood as general metric
      const moodToNumber = (mood: string) => {
        const map: Record<string, number> = { challenging: 1, difficult: 2, okay: 3, good: 4, great: 5 };
        return map[mood] || 3;
      };
      
      recentScore = recent
        .map(e => moodToNumber(e.mood || 'okay'))
        .reduce((sum, val) => sum + val, 0) / recent.length;
      earlierScore = earlier
        .map(e => moodToNumber(e.mood || 'okay'))
        .reduce((sum, val) => sum + val, 0) / earlier.length;
    }

    return recentScore - earlierScore > 0.5; // Significant improvement
  }

  private static hasConsistencyPattern(entries: JournalEntry[]): boolean {
    if (entries.length < 7) return false;

    // Check if user has been journaling consistently (at least 5 out of last 7 days)
    const recent = entries.slice(-7);
    const uniqueDates = new Set(recent.map(e => e.date.split('T')[0]));
    
    return uniqueDates.size >= 5;
  }
}