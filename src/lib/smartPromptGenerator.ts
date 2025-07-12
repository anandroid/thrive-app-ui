/**
 * @fileoverview Smart Prompt Generation Service
 * @module lib/smartPromptGenerator
 * 
 * Generates intelligent, context-aware journal prompts based on user patterns,
 * routine type, progress, and learning profile data.
 */

import { 
  JournalPrompt, 
  UserLearningProfile, 
  JournalEntry, 
  Thriving 
} from '@/src/types/thriving';

export class SmartPromptGenerator {
  
  /**
   * Generate contextual prompts based on user's current state and patterns
   */
  static generateContextualPrompts(
    routine: Thriving,
    userProfile: UserLearningProfile,
    recentEntries: JournalEntry[],
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' = 'evening'
  ): JournalPrompt[] {
    const prompts: JournalPrompt[] = [];
    
    // Add base prompts for routine type
    prompts.push(...this.getBasePrompts(routine.type));
    
    // Add personalized prompts based on user learning
    prompts.push(...this.getPersonalizedPrompts(routine, userProfile));
    
    // Add progress-based prompts
    prompts.push(...this.getProgressPrompts(recentEntries, routine));
    
    // Add time-sensitive prompts
    prompts.push(...this.getTimeSensitivePrompts(timeOfDay, routine.type));
    
    // Add celebration prompts for positive trends
    prompts.push(...this.getCelebrationPrompts(recentEntries, userProfile));
    
    // Add troubleshooting prompts for concerning patterns
    prompts.push(...this.getTroubleshootingPrompts(recentEntries, userProfile));
    
    // Sort by priority and return top prompts
    return prompts
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 5);
  }

  /**
   * Generate adaptive prompts that evolve based on user's journey stage
   */
  static generateAdaptivePrompts(
    userProfile: UserLearningProfile,
    daysInJourney: number
  ): JournalPrompt[] {
    const prompts: JournalPrompt[] = [];
    
    if (daysInJourney <= 7) {
      // Week 1: Focus on habit building and initial observations
      prompts.push(...this.getOnboardingPrompts());
    } else if (daysInJourney <= 21) {
      // Weeks 2-3: Focus on pattern recognition and optimization
      prompts.push(...this.getPatternRecognitionPrompts(userProfile));
    } else if (daysInJourney <= 60) {
      // Weeks 4-8: Focus on fine-tuning and deep insights
      prompts.push(...this.getOptimizationPrompts(userProfile));
    } else {
      // Long-term: Focus on maintenance and evolution
      prompts.push(...this.getMaintenancePrompts(userProfile));
    }
    
    return prompts;
  }

  /**
   * Generate prompts for specific conditions or events
   */
  static generateConditionalPrompts(
    condition: 'bad_day' | 'great_day' | 'missed_routine' | 'streak' | 'plateau',
    context: {
      routine: Thriving;
      userProfile: UserLearningProfile;
      recentEntries: JournalEntry[];
    }
  ): JournalPrompt[] {
    switch (condition) {
      case 'bad_day':
        return this.getBadDayPrompts(context);
      case 'great_day':
        return this.getGreatDayPrompts(context);
      case 'missed_routine':
        return this.getMissedRoutinePrompts(context);
      case 'streak':
        return this.getStreakPrompts(context);
      case 'plateau':
        return this.getPlateauPrompts(context);
      default:
        return [];
    }
  }

  // Private methods for different prompt categories

  private static getBasePrompts(routineType: string): JournalPrompt[] {
    const basePrompts: Record<string, JournalPrompt[]> = {
      sleep_wellness: [
        {
          id: 'sleep_quality_base',
          question: 'How would you describe your sleep quality last night?',
          type: 'tracking',
          priority: 5
        },
        {
          id: 'sleep_routine_reflection',
          question: 'What part of your bedtime routine felt most calming tonight?',
          type: 'reflection',
          priority: 4
        }
      ],
      pain_management: [
        {
          id: 'pain_level_base',
          question: 'How are your pain levels today compared to yesterday?',
          type: 'tracking',
          priority: 5
        },
        {
          id: 'pain_relief_reflection',
          question: 'What gave you the most relief from pain today?',
          type: 'reflection',
          priority: 4
        }
      ],
      stress_management: [
        {
          id: 'stress_level_base',
          question: 'How did you handle stress today?',
          type: 'tracking',
          priority: 5
        },
        {
          id: 'stress_coping_reflection',
          question: 'Which coping strategy felt most natural to you today?',
          type: 'reflection',
          priority: 4
        }
      ],
      mental_wellness: [
        {
          id: 'mood_base',
          question: 'What three words would describe your emotional state today?',
          type: 'tracking',
          priority: 5
        },
        {
          id: 'mental_wellness_reflection',
          question: 'What moment today made you feel most like yourself?',
          type: 'reflection',
          priority: 4
        }
      ]
    };

    return basePrompts[routineType] || basePrompts.mental_wellness;
  }

  private static getPersonalizedPrompts(
    routine: Thriving,
    userProfile: UserLearningProfile
  ): JournalPrompt[] {
    const prompts: JournalPrompt[] = [];

    // Sleep-specific personalized prompts
    if (routine.type === 'sleep_wellness') {
      const effectiveSupplements = userProfile.insights.sleepOptimization.effectiveSupplements
        .filter(s => s.confidence > 0.7);
      
      if (effectiveSupplements.length > 0) {
        const topSupplement = effectiveSupplements[0];
        prompts.push({
          id: `supplement_${topSupplement.name.toLowerCase().replace(/\s+/g, '_')}`,
          question: `How did ${topSupplement.name} (which typically improves your sleep by ${topSupplement.effectiveness.toFixed(1)} points) work tonight?`,
          type: 'tracking',
          priority: 8
        });
      }

      if (userProfile.insights.sleepOptimization.optimalBedtime) {
        prompts.push({
          id: 'optimal_bedtime_check',
          question: `Did you stick close to your optimal ${userProfile.insights.sleepOptimization.optimalBedtime} bedtime tonight?`,
          type: 'tracking',
          priority: 7
        });
      }
    }

    // Pain-specific personalized prompts
    if (routine.type === 'pain_management') {
      const commonTriggers = userProfile.insights.painManagement.triggers
        .filter(t => t.confidence > 0.6);
      
      if (commonTriggers.length > 0) {
        const topTrigger = commonTriggers[0];
        prompts.push({
          id: `trigger_${topTrigger.trigger.toLowerCase().replace(/\s+/g, '_')}`,
          question: `Did you encounter ${topTrigger.trigger} today? How did it affect your pain levels?`,
          type: 'troubleshooting',
          priority: 8
        });
      }

      const effectiveStrategies = userProfile.insights.painManagement.reliefStrategies
        .filter(s => s.confidence > 0.6);
        
      if (effectiveStrategies.length > 0) {
        const topStrategy = effectiveStrategies[0];
        prompts.push({
          id: `strategy_${topStrategy.strategy.toLowerCase().replace(/\s+/g, '_')}`,
          question: `How effective was ${topStrategy.strategy} (your go-to relief strategy) today?`,
          type: 'tracking',
          priority: 7
        });
      }
    }

    // Stress-specific personalized prompts
    if (routine.type === 'stress_management') {
      const commonStressors = userProfile.insights.stressManagement.stressTriggers;
      
      if (commonStressors.length > 0) {
        prompts.push({
          id: 'stress_triggers_check',
          question: `Did you encounter any of your usual stress triggers today (${commonStressors.slice(0, 2).join(', ')})?`,
          type: 'troubleshooting',
          priority: 7
        });
      }

      const effectiveCoping = userProfile.insights.stressManagement.effectiveCopingStrategies
        .filter(s => s.effectiveness > 2);
        
      if (effectiveCoping.length > 0) {
        const topCoping = effectiveCoping[0];
        prompts.push({
          id: `coping_${topCoping.strategy.toLowerCase().replace(/\s+/g, '_')}`,
          question: `How did ${topCoping.strategy} (your most effective stress relief) work today?`,
          type: 'tracking',
          priority: 8
        });
      }
    }

    return prompts;
  }

  private static getProgressPrompts(entries: JournalEntry[], routine: Thriving): JournalPrompt[] {
    const prompts: JournalPrompt[] = [];
    
    if (entries.length >= 7) {
      const recentTrend = this.analyzeRecentTrend(entries, routine.type);
      
      if (recentTrend === 'improving') {
        prompts.push({
          id: 'improvement_reflection',
          question: 'Your recent progress shows improvement! What do you think is contributing to this positive change?',
          type: 'celebration',
          priority: 9
        });
      } else if (recentTrend === 'declining') {
        prompts.push({
          id: 'decline_troubleshooting',
          question: 'It looks like things have been more challenging lately. What barriers or changes might be affecting your progress?',
          type: 'troubleshooting',
          priority: 8
        });
      }
    }

    // Weekly reflection prompts
    if (entries.length % 7 === 0 && entries.length > 0) {
      prompts.push({
        id: 'weekly_reflection',
        question: 'Looking back at this week, what patterns do you notice in your wellness journey?',
        type: 'reflection',
        priority: 6
      });
    }

    return prompts;
  }

  private static getTimeSensitivePrompts(
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night',
    routineType: string
  ): JournalPrompt[] {
    const prompts: JournalPrompt[] = [];

    if (timeOfDay === 'morning') {
      prompts.push({
        id: 'morning_reflection',
        question: 'How do you feel as you start this new day?',
        type: 'tracking',
        priority: 6
      });
    } else if (timeOfDay === 'evening') {
      prompts.push({
        id: 'evening_reflection',
        question: 'As you wind down, what stands out about today?',
        type: 'reflection',
        priority: 6
      });
    }

    // Routine-specific timing prompts
    if (routineType === 'sleep_wellness' && timeOfDay === 'evening') {
      prompts.push({
        id: 'bedtime_preparation',
        question: 'How are you preparing your mind and body for restful sleep tonight?',
        type: 'tracking',
        priority: 7
      });
    }

    return prompts;
  }

  private static getCelebrationPrompts(
    entries: JournalEntry[],
    userProfile: UserLearningProfile
  ): JournalPrompt[] {
    const prompts: JournalPrompt[] = [];

    // Consistency celebration
    if (entries.length >= 7) {
      const recentEntries = entries.slice(-7);
      const uniqueDates = new Set(recentEntries.map(e => e.date.split('T')[0]));
      
      if (uniqueDates.size >= 5) {
        prompts.push({
          id: 'consistency_celebration',
          question: `You've been consistently journaling this week! How has this self-reflection been helping you?`,
          type: 'celebration',
          priority: 8
        });
      }
    }

    // Milestone celebrations
    if (userProfile.dataPoints === 30) {
      prompts.push({
        id: 'milestone_30',
        question: 'Congratulations on 30 journal entries! What has surprised you most about your wellness journey so far?',
        type: 'celebration',
        priority: 9
      });
    }

    return prompts;
  }

  private static getTroubleshootingPrompts(
    entries: JournalEntry[],
    userProfile: UserLearningProfile
  ): JournalPrompt[] {
    const prompts: JournalPrompt[] = [];

    // Low confidence prompts
    if (userProfile.confidenceLevel < 0.5 && userProfile.dataPoints > 10) {
      prompts.push({
        id: 'inconsistent_patterns',
        question: 'Your patterns seem varied. What factors might be influencing your day-to-day experience?',
        type: 'troubleshooting',
        priority: 7
      });
    }

    // Routine adherence issues
    const routineCompletionRate = this.calculateCompletionRate(entries);
    if (routineCompletionRate < 0.6) {
      prompts.push({
        id: 'adherence_barriers',
        question: 'What barriers are making it challenging to stick to your routine? Let\'s problem-solve together.',
        type: 'troubleshooting',
        priority: 8
      });
    }

    return prompts;
  }

  // Prompt generators for different journey stages

  private static getOnboardingPrompts(): JournalPrompt[] {
    return [
      {
        id: 'onboarding_expectations',
        question: 'As you start this wellness journey, what hopes or expectations do you have?',
        type: 'reflection',
        priority: 7
      },
      {
        id: 'onboarding_baseline',
        question: 'How would you describe your current state before starting this routine?',
        type: 'tracking',
        priority: 6
      },
      {
        id: 'onboarding_motivation',
        question: 'What motivated you to start this wellness routine?',
        type: 'reflection',
        priority: 5
      }
    ];
  }

  private static getPatternRecognitionPrompts(_userProfile: UserLearningProfile): JournalPrompt[] { // eslint-disable-line @typescript-eslint/no-unused-vars
    return [
      {
        id: 'pattern_observation',
        question: 'What patterns are you starting to notice in how you feel day to day?',
        type: 'reflection',
        priority: 7
      },
      {
        id: 'pattern_correlation',
        question: 'Have you noticed any connections between your routine and how you feel?',
        type: 'tracking',
        priority: 6
      }
    ];
  }

  private static getOptimizationPrompts(_userProfile: UserLearningProfile): JournalPrompt[] { // eslint-disable-line @typescript-eslint/no-unused-vars
    return [
      {
        id: 'optimization_tweaks',
        question: 'Based on what you\'ve learned about yourself, what small adjustments might be helpful?',
        type: 'reflection',
        priority: 7
      },
      {
        id: 'optimization_timing',
        question: 'Have you found certain times of day work better for different parts of your routine?',
        type: 'tracking',
        priority: 6
      }
    ];
  }

  private static getMaintenancePrompts(_userProfile: UserLearningProfile): JournalPrompt[] { // eslint-disable-line @typescript-eslint/no-unused-vars
    return [
      {
        id: 'maintenance_evolution',
        question: 'How has your wellness routine evolved since you started?',
        type: 'reflection',
        priority: 6
      },
      {
        id: 'maintenance_wisdom',
        question: 'What wisdom would you share with someone just starting a similar journey?',
        type: 'reflection',
        priority: 5
      }
    ];
  }

  // Conditional prompt generators

  private static getBadDayPrompts(_context: { // eslint-disable-line @typescript-eslint/no-unused-vars
    routine: Thriving;
    userProfile: UserLearningProfile;
    recentEntries: JournalEntry[];
  }): JournalPrompt[] {
    return [
      {
        id: 'bad_day_compassion',
        question: 'Difficult days are part of the journey. How can you show yourself compassion today?',
        type: 'reflection',
        priority: 9
      },
      {
        id: 'bad_day_support',
        question: 'What small thing from your routine might offer some comfort right now?',
        type: 'troubleshooting',
        priority: 8
      }
    ];
  }

  private static getGreatDayPrompts(_context: { // eslint-disable-line @typescript-eslint/no-unused-vars
    routine: Thriving;
    userProfile: UserLearningProfile;
    recentEntries: JournalEntry[];
  }): JournalPrompt[] {
    return [
      {
        id: 'great_day_celebration',
        question: 'What a wonderful day! What contributed most to feeling this good?',
        type: 'celebration',
        priority: 9
      },
      {
        id: 'great_day_replication',
        question: 'How can you set yourself up for more days like this one?',
        type: 'reflection',
        priority: 8
      }
    ];
  }

  private static getMissedRoutinePrompts(_context: { // eslint-disable-line @typescript-eslint/no-unused-vars
    routine: Thriving;
    userProfile: UserLearningProfile;
    recentEntries: JournalEntry[];
  }): JournalPrompt[] {
    return [
      {
        id: 'missed_routine_barriers',
        question: 'What got in the way of your routine today? Let\'s understand so we can plan better.',
        type: 'troubleshooting',
        priority: 8
      },
      {
        id: 'missed_routine_restart',
        question: 'How are you feeling about getting back to your routine tomorrow?',
        type: 'reflection',
        priority: 7
      }
    ];
  }

  private static getStreakPrompts(_context: { // eslint-disable-line @typescript-eslint/no-unused-vars
    routine: Thriving;
    userProfile: UserLearningProfile;
    recentEntries: JournalEntry[];
  }): JournalPrompt[] {
    return [
      {
        id: 'streak_celebration',
        question: 'You\'re on a great streak! What\'s helping you stay consistent?',
        type: 'celebration',
        priority: 9
      },
      {
        id: 'streak_momentum',
        question: 'How does this consistency feel in your body and mind?',
        type: 'reflection',
        priority: 7
      }
    ];
  }

  private static getPlateauPrompts(_context: { // eslint-disable-line @typescript-eslint/no-unused-vars
    routine: Thriving;
    userProfile: UserLearningProfile;
    recentEntries: JournalEntry[];
  }): JournalPrompt[] {
    return [
      {
        id: 'plateau_exploration',
        question: 'Sometimes progress feels slower. What changes might help you feel unstuck?',
        type: 'troubleshooting',
        priority: 8
      },
      {
        id: 'plateau_perspective',
        question: 'Plateaus can be times of integration. What have you solidified in your routine?',
        type: 'reflection',
        priority: 6
      }
    ];
  }

  // Helper methods

  private static analyzeRecentTrend(
    entries: JournalEntry[], 
    routineType: string
  ): 'improving' | 'declining' | 'stable' {
    if (entries.length < 6) return 'stable';

    const recent = entries.slice(-3);
    const earlier = entries.slice(-6, -3);

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
      return earlierScore - recentScore > 1 ? 'improving' : 
             recentScore - earlierScore > 1 ? 'declining' : 'stable';
    } else {
      // Use mood as general metric
      const moodToNumber = (mood: string) => {
        const map: Record<string, number> = { 
          challenging: 1, difficult: 2, okay: 3, good: 4, great: 5 
        };
        return map[mood] || 3;
      };
      
      recentScore = recent
        .map(e => moodToNumber(e.mood || 'okay'))
        .reduce((sum, val) => sum + val, 0) / recent.length;
      earlierScore = earlier
        .map(e => moodToNumber(e.mood || 'okay'))
        .reduce((sum, val) => sum + val, 0) / earlier.length;
    }

    const difference = recentScore - earlierScore;
    return difference > 0.5 ? 'improving' : 
           difference < -0.5 ? 'declining' : 'stable';
  }

  private static calculateCompletionRate(entries: JournalEntry[]): number {
    const completionData = entries.filter(entry => 
      entry.customData?.routineCompleted !== undefined
    );

    if (completionData.length === 0) return 1; // Assume good if no data

    const completed = completionData.filter(entry => 
      entry.customData?.routineCompleted === true
    ).length;

    return completed / completionData.length;
  }
}