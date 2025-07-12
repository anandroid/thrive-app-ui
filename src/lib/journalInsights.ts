/**
 * @fileoverview Journal Insights Engine - Pattern Recognition and Learning
 * @module lib/journalInsights
 * 
 * Provides AI-like learning through data analysis and pattern recognition
 * for personalized journal experiences and routine optimization.
 */

import { 
  JournalEntry, 
  JournalInsights, 
  UserLearningProfile, 
  Thriving,
  DynamicJournalTemplate,
  JournalPrompt,
  CustomJournalField
} from '@/src/types/thriving';

export class JournalInsightsEngine {
  private static readonly CONFIDENCE_THRESHOLD = 0.6;
  private static readonly MIN_DATA_POINTS = 5;

  /**
   * Analyze sleep patterns from journal entries
   */
  static analyzeSleepPatterns(entries: JournalEntry[]): UserLearningProfile['insights']['sleepOptimization'] {
    const sleepEntries = entries.filter(entry => 
      entry.customData?.sleepQuality !== undefined || 
      entry.customData?.bedtime !== undefined
    );

    if (sleepEntries.length < this.MIN_DATA_POINTS) {
      return {
        effectiveSupplements: [],
        environmentFactors: [],
        averageQuality: 0,
        patterns: {}
      };
    }

    // Calculate average sleep quality
    const sleepQualities = sleepEntries
      .map(entry => Number(entry.customData?.sleepQuality) || 0)
      .filter(quality => quality > 0);
    
    const averageQuality = sleepQualities.length > 0 
      ? sleepQualities.reduce((sum, quality) => sum + quality, 0) / sleepQualities.length 
      : 0;

    // Find supplement effectiveness
    const supplementEffectiveness = this.analyzeSupplementImpact(sleepEntries, 'sleepQuality');

    // Analyze bedtime patterns
    const optimalBedtime = this.findOptimalTiming(sleepEntries, 'bedtime', 'sleepQuality');

    // Environment factors analysis
    const environmentFactors = this.extractEnvironmentFactors(sleepEntries);

    return {
      optimalBedtime,
      effectiveSupplements: supplementEffectiveness,
      environmentFactors,
      averageQuality,
      patterns: {
        weekdayVsWeekend: this.analyzeWeekdayVsWeekend(sleepEntries, 'sleepQuality'),
        seasonalPatterns: this.analyzeSeasonalPatterns(sleepEntries, 'sleepQuality'),
        correlationFactors: this.findCorrelationFactors(sleepEntries, 'sleepQuality')
      }
    };
  }

  /**
   * Analyze pain patterns and triggers
   */
  static analyzePainPatterns(entries: JournalEntry[]): UserLearningProfile['insights']['painManagement'] {
    const painEntries = entries.filter(entry => 
      entry.painLevel !== undefined || 
      entry.customData?.painLevel !== undefined
    );

    if (painEntries.length < this.MIN_DATA_POINTS) {
      return {
        triggers: [],
        reliefStrategies: [],
        painPatterns: {}
      };
    }

    // Find pain triggers
    const triggers = this.identifyPainTriggers(painEntries);
    
    // Analyze relief strategies
    const reliefStrategies = this.analyzeReliefStrategies(painEntries);
    
    // Find optimal exercise timing
    const optimalExerciseTiming = this.findOptimalTiming(painEntries, 'exerciseTime', 'painLevel', true); // true for inverse correlation

    return {
      triggers,
      reliefStrategies,
      optimalExerciseTiming,
      painPatterns: {
        dailyPatterns: this.analyzeDailyPainPatterns(painEntries),
        weatherCorrelation: this.analyzeWeatherCorrelation(painEntries),
        activityCorrelation: this.analyzeActivityCorrelation(painEntries)
      }
    };
  }

  /**
   * Analyze stress management patterns
   */
  static analyzeStressPatterns(entries: JournalEntry[]): UserLearningProfile['insights']['stressManagement'] {
    const stressEntries = entries.filter(entry => 
      entry.customData?.stressLevel !== undefined ||
      entry.mood === 'challenging' || entry.mood === 'difficult'
    );

    const stressTriggers = this.identifyStressTriggers(stressEntries);
    const copingStrategies = this.analyzeCopingStrategies(stressEntries);
    const optimalTiming = this.findOptimalTiming(stressEntries, 'stressReliefTime', 'stressLevel', true);

    return {
      stressTriggers,
      effectiveCopingStrategies: copingStrategies,
      optimalStressRelieveTiming: optimalTiming,
      stressPatterns: {
        dailyPatterns: this.analyzeDailyStressPatterns(stressEntries),
        triggerFrequency: this.analyzeStressTriggerFrequency(stressEntries),
        copingEffectiveness: this.analyzeCopingEffectiveness(stressEntries)
      }
    };
  }

  /**
   * Generate comprehensive journal insights
   */
  static generateJournalInsights(entries: JournalEntry[], routine: Thriving): JournalInsights {
    const insights: JournalInsights = {
      patterns: {},
      recommendations: [],
      celebratoryInsights: [],
      lastAnalyzed: new Date().toISOString()
    };

    // Sleep quality analysis
    if (routine.type === 'sleep_wellness') {
      const sleepData = this.analyzeSleepQualityTrends(entries);
      insights.patterns.sleepQuality = sleepData;
      insights.recommendations.push(...this.generateSleepRecommendations(sleepData, entries));
    }

    // Pain level analysis
    if (routine.type === 'pain_management') {
      const painData = this.analyzePainLevelTrends(entries);
      insights.patterns.painLevels = painData;
      insights.recommendations.push(...this.generatePainRecommendations(painData, entries));
    }

    // Mood pattern analysis
    const moodData = this.analyzeMoodPatterns(entries);
    insights.patterns.moodPatterns = moodData;

    // Routine adherence analysis
    const adherenceData = this.analyzeRoutineAdherence(entries, routine);
    insights.patterns.routineAdherence = adherenceData;

    // Generate celebratory insights
    insights.celebratoryInsights = this.generateCelebratoryInsights(entries, routine);

    return insights;
  }

  /**
   * Generate personalized journal prompts based on user patterns
   */
  static generatePersonalizedPrompts(
    routine: Thriving, 
    userProfile: UserLearningProfile, 
    recentEntries: JournalEntry[]
  ): JournalPrompt[] {
    const prompts: JournalPrompt[] = [];
    const basePrompts = this.getBasePromptsForRoutineType(routine.type);
    
    // Add base prompts
    prompts.push(...basePrompts);

    // Add personalized prompts based on user patterns
    if (userProfile.insights.sleepOptimization.effectiveSupplements.length > 0) {
      const topSupplement = userProfile.insights.sleepOptimization.effectiveSupplements[0];
      prompts.push({
        id: `supplement_${topSupplement.name.toLowerCase()}`,
        question: `How did ${topSupplement.name} (which has been working well for you) affect your sleep tonight?`,
        type: 'tracking',
        priority: 8,
        conditions: { daysCompleted: 3 }
      });
    }

    if (userProfile.insights.painManagement.triggers.length > 0) {
      const mainTrigger = userProfile.insights.painManagement.triggers[0];
      prompts.push({
        id: `trigger_${mainTrigger.trigger.toLowerCase()}`,
        question: `Did you notice any ${mainTrigger.trigger.toLowerCase()} today? How did it affect your pain levels?`,
        type: 'troubleshooting',
        priority: 7,
        conditions: { painLevel: { min: 4 } }
      });
    }

    // Add celebration prompts for improvements
    if (this.hasPositiveTrend(recentEntries, routine.type)) {
      prompts.push({
        id: 'celebration_improvement',
        question: 'Your recent patterns show improvement! What do you think is contributing to this positive change?',
        type: 'celebration',
        priority: 9,
        conditions: { daysCompleted: 7 }
      });
    }

    return prompts.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Create dynamic journal template based on routine and user profile
   */
  static createDynamicTemplate(
    routine: Thriving, 
    userProfile?: UserLearningProfile
  ): DynamicJournalTemplate {
    const template: DynamicJournalTemplate = {
      templateId: `template_${routine.id}_${Date.now()}`,
      routineId: routine.id,
      journalType: this.mapRoutineTypeToJournalType(routine.type),
      customFields: [],
      prompts: [],
      trackingFocus: [],
      version: '1.0',
      createdAt: new Date().toISOString()
    };

    // Add base fields for routine type
    template.customFields = this.getBaseFieldsForRoutineType(routine.type);
    
    // Add routine-specific tracking
    template.trackingFocus = this.getTrackingFocusForRoutineType(routine.type);

    // Generate personalized prompts
    if (userProfile) {
      template.prompts = this.generatePersonalizedPrompts(routine, userProfile, []);
    } else {
      template.prompts = this.getBasePromptsForRoutineType(routine.type);
    }

    return template;
  }

  // Private helper methods
  private static analyzeSupplementImpact(
    entries: JournalEntry[], 
    targetMetric: string
  ): Array<{name: string, effectiveness: number, confidence: number}> {
    const supplementData: Record<string, {values: number[], dates: string[]}> = {};
    
    entries.forEach(entry => {
      if (entry.customData?.supplements && entry.customData[targetMetric]) {
        const supplements = Array.isArray(entry.customData.supplements) 
          ? entry.customData.supplements 
          : [entry.customData.supplements];
        
        supplements.forEach((supplement: string) => {
          if (!supplementData[supplement]) {
            supplementData[supplement] = { values: [], dates: [] };
          }
          supplementData[supplement].values.push(Number(entry.customData[targetMetric]));
          supplementData[supplement].dates.push(entry.date);
        });
      }
    });

    return Object.entries(supplementData)
      .map(([name, data]) => {
        const avg = data.values.reduce((sum, val) => sum + val, 0) / data.values.length;
        const confidence = Math.min(data.values.length / 10, 1); // More data = higher confidence
        return { name, effectiveness: avg, confidence };
      })
      .filter(item => item.confidence >= this.CONFIDENCE_THRESHOLD)
      .sort((a, b) => b.effectiveness - a.effectiveness);
  }

  private static findOptimalTiming(
    entries: JournalEntry[], 
    timeField: string, 
    outcomeField: string,
    inverse: boolean = false
  ): string | undefined {
    const timingData: Record<string, number[]> = {};
    
    entries.forEach(entry => {
      const timing = String(entry.customData?.[timeField] || '');
      const outcome = Number(entry.customData?.[outcomeField]) || entry.painLevel;
      
      if (timing && outcome !== undefined) {
        if (!timingData[timing]) {
          timingData[timing] = [];
        }
        timingData[timing].push(outcome);
      }
    });

    let bestTiming: string | undefined;
    let bestScore = inverse ? Infinity : -Infinity;

    Object.entries(timingData).forEach(([timing, outcomes]) => {
      if (outcomes.length >= 3) { // Minimum data points for reliability
        const avgOutcome = outcomes.reduce((sum, val) => sum + val, 0) / outcomes.length;
        
        if (inverse ? avgOutcome < bestScore : avgOutcome > bestScore) {
          bestScore = avgOutcome;
          bestTiming = timing;
        }
      }
    });

    return bestTiming;
  }

  private static extractEnvironmentFactors(entries: JournalEntry[]): string[] {
    const factors = new Set<string>();
    
    entries.forEach(entry => {
      if (entry.customData?.environmentFactors) {
        const entryFactors = Array.isArray(entry.customData.environmentFactors)
          ? entry.customData.environmentFactors
          : [entry.customData.environmentFactors];
        entryFactors.forEach((factor: string) => factors.add(factor));
      }
    });

    return Array.from(factors);
  }

  private static analyzeWeekdayVsWeekend(entries: JournalEntry[], metric: string): Record<string, number> {
    const weekdayValues: number[] = [];
    const weekendValues: number[] = [];

    entries.forEach(entry => {
      const date = new Date(entry.date);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const value = Number(entry.customData?.[metric]);

      if (value !== undefined) {
        if (isWeekend) {
          weekendValues.push(value);
        } else {
          weekdayValues.push(value);
        }
      }
    });

    return {
      weekdayAverage: weekdayValues.length > 0 
        ? weekdayValues.reduce((sum, val) => sum + val, 0) / weekdayValues.length 
        : 0,
      weekendAverage: weekendValues.length > 0 
        ? weekendValues.reduce((sum, val) => sum + val, 0) / weekendValues.length 
        : 0
    };
  }

  private static analyzeSeasonalPatterns(entries: JournalEntry[], metric: string): Record<string, number> {
    const seasonalData: Record<string, number[]> = {
      spring: [], summer: [], fall: [], winter: []
    };

    entries.forEach(entry => {
      const date = new Date(entry.date);
      const month = date.getMonth();
      const value = Number(entry.customData?.[metric]);

      if (value !== undefined) {
        let season: string;
        if (month >= 2 && month <= 4) season = 'spring';
        else if (month >= 5 && month <= 7) season = 'summer';
        else if (month >= 8 && month <= 10) season = 'fall';
        else season = 'winter';

        seasonalData[season].push(value);
      }
    });

    const result: Record<string, number> = {};
    Object.entries(seasonalData).forEach(([season, values]) => {
      result[`${season}Average`] = values.length > 0 
        ? values.reduce((sum, val) => sum + val, 0) / values.length 
        : 0;
    });

    return result;
  }

  private static findCorrelationFactors(_entries: JournalEntry[], _targetMetric: string): Array<{factor: string, correlation: number}> { // eslint-disable-line @typescript-eslint/no-unused-vars
    const correlations: Array<{factor: string, correlation: number}> = [];
    
    // Analyze various factors that might correlate with the target metric
    // const factorsToAnalyze = ['exerciseTime', 'screenTime', 'caffeine', 'alcohol', 'stress'];
    
    // TODO: Implement correlation analysis
    // factorsToAnalyze.forEach(factor => {
    //   const correlation = this.calculateCorrelation(entries, factor, targetMetric);
    //   if (Math.abs(correlation) > 0.3) { // Only include meaningful correlations
    //     correlations.push({ factor, correlation });
    //   }
    // });

    return correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  }

  private static calculateCorrelation(entries: JournalEntry[], factor1: string, factor2: string): number {
    const pairs: Array<{x: number, y: number}> = [];

    entries.forEach(entry => {
      const x = Number(entry.customData?.[factor1]) || entry.painLevel;
      const y = Number(entry.customData?.[factor2]) || entry.painLevel;
      
      if (x !== undefined && y !== undefined) {
        pairs.push({ x, y });
      }
    });

    if (pairs.length < 3) return 0;

    const n = pairs.length;
    const sumX = pairs.reduce((sum, pair) => sum + pair.x, 0);
    const sumY = pairs.reduce((sum, pair) => sum + pair.y, 0);
    const sumXY = pairs.reduce((sum, pair) => sum + pair.x * pair.y, 0);
    const sumXX = pairs.reduce((sum, pair) => sum + pair.x * pair.x, 0);
    const sumYY = pairs.reduce((sum, pair) => sum + pair.y * pair.y, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  private static identifyPainTriggers(entries: JournalEntry[]): Array<{trigger: string, frequency: number, confidence: number}> {
    const triggerCounts: Record<string, {total: number, highPainDays: number}> = {};

    entries.forEach(entry => {
      const painLevel = entry.painLevel || Number(entry.customData?.painLevel) || 0;
      const triggers = (entry.customData?.triggers as string[]) || [];

      triggers.forEach((trigger: string) => {
        if (!triggerCounts[trigger]) {
          triggerCounts[trigger] = { total: 0, highPainDays: 0 };
        }
        triggerCounts[trigger].total++;
        if (painLevel >= 6) {
          triggerCounts[trigger].highPainDays++;
        }
      });
    });

    return Object.entries(triggerCounts)
      .map(([trigger, data]) => ({
        trigger,
        frequency: data.total,
        confidence: data.total > 0 ? data.highPainDays / data.total : 0
      }))
      .filter(item => item.confidence > 0.5)
      .sort((a, b) => b.confidence - a.confidence);
  }

  private static analyzeReliefStrategies(entries: JournalEntry[]): Array<{strategy: string, effectiveness: number, confidence: number}> {
    const strategyData: Record<string, {beforePain: number[], afterPain: number[]}> = {};

    entries.forEach(entry => {
      const strategies = (entry.customData?.reliefStrategies as string[]) || [];
      const painBefore = Number(entry.customData?.painBefore) || entry.painLevel || 0;
      const painAfter = Number(entry.customData?.painAfter) || entry.painLevel || painBefore;

      strategies.forEach((strategy: string) => {
        if (!strategyData[strategy]) {
          strategyData[strategy] = { beforePain: [], afterPain: [] };
        }
        strategyData[strategy].beforePain.push(painBefore);
        strategyData[strategy].afterPain.push(painAfter);
      });
    });

    return Object.entries(strategyData)
      .map(([strategy, data]) => {
        if (data.beforePain.length === 0) return null;
        
        const avgBefore = data.beforePain.reduce((sum, val) => sum + val, 0) / data.beforePain.length;
        const avgAfter = data.afterPain.reduce((sum, val) => sum + val, 0) / data.afterPain.length;
        const effectiveness = Math.max(0, avgBefore - avgAfter); // Pain reduction
        const confidence = Math.min(data.beforePain.length / 5, 1);

        return { strategy, effectiveness, confidence };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null && item.confidence >= 0.6)
      .sort((a, b) => b.effectiveness - a.effectiveness);
  }

  private static analyzeDailyPainPatterns(entries: JournalEntry[]): Record<string, number> {
    const hourlyData: Record<number, number[]> = {};

    entries.forEach(entry => {
      const time = Number(entry.customData?.timeOfPain) || new Date(entry.createdAt).getHours();
      const painLevel = entry.painLevel || Number(entry.customData?.painLevel) || 0;

      if (!hourlyData[time]) {
        hourlyData[time] = [];
      }
      hourlyData[time].push(painLevel);
    });

    const patterns: Record<string, number> = {};
    Object.entries(hourlyData).forEach(([hour, painLevels]) => {
      const avgPain = painLevels.reduce((sum, pain) => sum + pain, 0) / painLevels.length;
      patterns[`hour${hour}Average`] = avgPain;
    });

    return patterns;
  }

  private static analyzeWeatherCorrelation(_entries: JournalEntry[]): Record<string, unknown> { // eslint-disable-line @typescript-eslint/no-unused-vars
    // This would integrate with weather data if available
    // For now, return placeholder analysis
    return {
      pressureCorrelation: 0,
      temperatureCorrelation: 0,
      humidityCorrelation: 0
    };
  }

  private static analyzeActivityCorrelation(entries: JournalEntry[]): Record<string, number> {
    const activities = ['exercise', 'sitting', 'standing', 'walking', 'sleeping'];
    const correlations: Record<string, number> = {};

    activities.forEach(activity => {
      correlations[`${activity}Correlation`] = this.calculateCorrelation(entries, activity, 'painLevel');
    });

    return correlations;
  }

  private static identifyStressTriggers(entries: JournalEntry[]): string[] {
    const triggerCounts: Record<string, number> = {};

    entries.forEach(entry => {
      const stressLevel = Number(entry.customData?.stressLevel) || 0;
      const triggers = (entry.customData?.stressTriggers as string[]) || [];

      if (stressLevel >= 6) { // High stress days
        triggers.forEach((trigger: string) => {
          triggerCounts[trigger] = (triggerCounts[trigger] || 0) + 1;
        });
      }
    });

    return Object.entries(triggerCounts)
      .filter(([, count]) => count >= 2) // Must appear at least twice
      .sort(([, a], [, b]) => b - a)
      .map(([trigger]) => trigger);
  }

  private static analyzeCopingStrategies(entries: JournalEntry[]): Array<{strategy: string, effectiveness: number}> {
    const strategyData: Record<string, {beforeStress: number[], afterStress: number[]}> = {};

    entries.forEach(entry => {
      const strategies = (entry.customData?.copingStrategies as string[]) || [];
      const stressBefore = Number(entry.customData?.stressBefore) || 0;
      const stressAfter = Number(entry.customData?.stressAfter) || stressBefore;

      strategies.forEach((strategy: string) => {
        if (!strategyData[strategy]) {
          strategyData[strategy] = { beforeStress: [], afterStress: [] };
        }
        strategyData[strategy].beforeStress.push(stressBefore);
        strategyData[strategy].afterStress.push(stressAfter);
      });
    });

    return Object.entries(strategyData)
      .map(([strategy, data]) => {
        if (data.beforeStress.length === 0) return null;
        
        const avgBefore = data.beforeStress.reduce((sum, val) => sum + val, 0) / data.beforeStress.length;
        const avgAfter = data.afterStress.reduce((sum, val) => sum + val, 0) / data.afterStress.length;
        const effectiveness = Math.max(0, avgBefore - avgAfter);

        return { strategy, effectiveness };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null && item.effectiveness > 0)
      .sort((a, b) => b.effectiveness - a.effectiveness);
  }

  private static analyzeDailyStressPatterns(entries: JournalEntry[]): Record<string, number> {
    const patterns: Record<string, number[]> = {
      morning: [], afternoon: [], evening: [], night: []
    };

    entries.forEach(entry => {
      const hour = new Date(entry.createdAt).getHours();
      const stressLevel = entry.customData?.stressLevel || 0;

      let period: string;
      if (hour >= 6 && hour < 12) period = 'morning';
      else if (hour >= 12 && hour < 17) period = 'afternoon';
      else if (hour >= 17 && hour < 22) period = 'evening';
      else period = 'night';

      patterns[period].push(stressLevel);
    });

    const result: Record<string, number> = {};
    Object.entries(patterns).forEach(([period, stressLevels]) => {
      result[`${period}Average`] = stressLevels.length > 0 
        ? stressLevels.reduce((sum, stress) => sum + stress, 0) / stressLevels.length 
        : 0;
    });

    return result;
  }

  private static analyzeStressTriggerFrequency(entries: JournalEntry[]): Record<string, number> {
    const triggerCounts: Record<string, number> = {};

    entries.forEach(entry => {
      const triggers = entry.customData?.stressTriggers || [];
      triggers.forEach((trigger: string) => {
        triggerCounts[trigger] = (triggerCounts[trigger] || 0) + 1;
      });
    });

    return triggerCounts;
  }

  private static analyzeCopingEffectiveness(entries: JournalEntry[]): Record<string, number> {
    const strategyEffectiveness: Record<string, number[]> = {};

    entries.forEach(entry => {
      const strategies = entry.customData?.copingStrategies || [];
      const effectiveness = entry.customData?.copingEffectiveness || 0;

      strategies.forEach((strategy: string) => {
        if (!strategyEffectiveness[strategy]) {
          strategyEffectiveness[strategy] = [];
        }
        strategyEffectiveness[strategy].push(effectiveness);
      });
    });

    const result: Record<string, number> = {};
    Object.entries(strategyEffectiveness).forEach(([strategy, ratings]) => {
      result[strategy] = ratings.length > 0 
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
        : 0;
    });

    return result;
  }

  private static analyzeSleepQualityTrends(entries: JournalEntry[]): NonNullable<JournalInsights['patterns']['sleepQuality']> {
    const sleepQualities = entries
      .map(entry => entry.customData?.sleepQuality || 0)
      .filter(quality => quality > 0);

    if (sleepQualities.length === 0) {
      return { average: 0, trend: 'stable', correlations: [] };
    }

    const average = sleepQualities.reduce((sum, quality) => sum + quality, 0) / sleepQualities.length;
    
    // Calculate trend
    const trend = this.calculateTrend(sleepQualities);
    
    // Find correlations
    const correlations = this.findCorrelationFactors(entries, 'sleepQuality');

    return { average, trend, correlations };
  }

  private static analyzePainLevelTrends(entries: JournalEntry[]): NonNullable<JournalInsights['patterns']['painLevels']> {
    const painLevels = entries
      .map(entry => entry.painLevel || entry.customData?.painLevel || 0)
      .filter(pain => pain > 0);

    if (painLevels.length === 0) {
      return { average: 0, trend: 'stable', triggers: [] };
    }

    const average = painLevels.reduce((sum, pain) => sum + pain, 0) / painLevels.length;
    const trend = this.calculateTrend(painLevels);
    const triggers = this.identifyPainTriggers(entries);

    return { 
      average, 
      trend, 
      triggers: triggers.map(t => ({ trigger: t.trigger, impact: t.confidence }))
    };
  }

  private static analyzeMoodPatterns(entries: JournalEntry[]): NonNullable<JournalInsights['patterns']['moodPatterns']> {
    const moodCounts: Record<string, number> = {};
    const moodValues: number[] = [];

    entries.forEach(entry => {
      if (entry.mood) {
        moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
        
        // Convert mood to numeric value for trend analysis
        const moodValue = this.moodToNumeric(entry.mood);
        moodValues.push(moodValue);
      }
    });

    const mostCommon = Object.entries(moodCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'okay';

    const trend = this.calculateTrend(moodValues);

    return {
      mostCommon,
      trend,
      triggers: [] // Could be enhanced with trigger analysis
    };
  }

  private static analyzeRoutineAdherence(entries: JournalEntry[], _routine: Thriving): NonNullable<JournalInsights['patterns']['routineAdherence']> { // eslint-disable-line @typescript-eslint/no-unused-vars
    const completionData = entries.map(entry => ({
      date: entry.date,
      completed: entry.customData?.routineCompleted || false,
      dayOfWeek: new Date(entry.date).toLocaleDateString('en', { weekday: 'long' })
    }));

    const completionRate = completionData.length > 0 
      ? completionData.filter(d => d.completed).length / completionData.length 
      : 0;

    // Find best days
    const dayPerformance: Record<string, {completed: number, total: number}> = {};
    completionData.forEach(({ dayOfWeek, completed }) => {
      if (!dayPerformance[dayOfWeek]) {
        dayPerformance[dayOfWeek] = { completed: 0, total: 0 };
      }
      dayPerformance[dayOfWeek].total++;
      if (completed) dayPerformance[dayOfWeek].completed++;
    });

    const bestDays = Object.entries(dayPerformance)
      .map(([day, data]) => ({ day, rate: data.completed / data.total }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 3)
      .map(({ day }) => day);

    const challengingTimes = Object.entries(dayPerformance)
      .map(([day, data]) => ({ day, rate: data.completed / data.total }))
      .sort((a, b) => a.rate - b.rate)
      .slice(0, 2)
      .map(({ day }) => day);

    return {
      completionRate,
      bestDays,
      challengingTimes
    };
  }

  private static generateSleepRecommendations(
    sleepData: NonNullable<JournalInsights['patterns']['sleepQuality']>, 
    _entries: JournalEntry[] // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Array<{type: 'timing' | 'supplement' | 'activity' | 'environment', suggestion: string, confidence: number, reasoning: string}> {
    const recommendations: Array<{type: 'timing' | 'supplement' | 'activity' | 'environment', suggestion: string, confidence: number, reasoning: string}> = [];

    if (sleepData.average < 6) {
      recommendations.push({
        type: 'timing',
        suggestion: 'Consider adjusting your bedtime routine to start 30 minutes earlier',
        confidence: 0.8,
        reasoning: `Your average sleep quality is ${sleepData.average.toFixed(1)}, which could improve with more preparation time`
      });
    }

    sleepData.correlations.forEach(({ factor, correlation }) => {
      if (correlation < -0.5) {
        recommendations.push({
          type: 'activity',
          suggestion: `Reduce ${factor} before bedtime as it appears to negatively impact your sleep`,
          confidence: Math.abs(correlation),
          reasoning: `Strong negative correlation (${correlation.toFixed(2)}) found between ${factor} and sleep quality`
        });
      }
    });

    return recommendations;
  }

  private static generatePainRecommendations(
    painData: NonNullable<JournalInsights['patterns']['painLevels']>, 
    _entries: JournalEntry[] // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Array<{type: 'timing' | 'supplement' | 'activity' | 'environment', suggestion: string, confidence: number, reasoning: string}> {
    const recommendations: Array<{type: 'timing' | 'supplement' | 'activity' | 'environment', suggestion: string, confidence: number, reasoning: string}> = [];

    if (painData.trend === 'declining') {
      recommendations.push({
        type: 'activity',
        suggestion: 'Continue your current pain management strategies as they show positive results',
        confidence: 0.9,
        reasoning: `Your pain levels are trending downward (average: ${painData.average.toFixed(1)})`
      });
    }

    painData.triggers.forEach(({ trigger, impact }) => {
      if (impact > 0.7) {
        recommendations.push({
          type: 'environment',
          suggestion: `Consider strategies to minimize exposure to ${trigger}`,
          confidence: impact,
          reasoning: `${trigger} shows strong correlation with increased pain levels`
        });
      }
    });

    return recommendations;
  }

  private static generateCelebratoryInsights(entries: JournalEntry[], routine: Thriving): string[] {
    const insights: string[] = [];

    if (entries.length >= 7) {
      insights.push(`🎉 You've been consistently journaling for ${entries.length} days! This dedication to self-reflection is incredible.`);
    }

    const recentEntries = entries.slice(-7);
    const goodMoodDays = recentEntries.filter(e => e.mood === 'great' || e.mood === 'good').length;
    
    if (goodMoodDays >= 5) {
      insights.push(`✨ You've had ${goodMoodDays} good mood days this week! Your wellness routine is really paying off.`);
    }

    if (routine.type === 'sleep_wellness') {
      const sleepQualities = recentEntries
        .map(e => Number(e.customData?.sleepQuality))
        .filter(q => !isNaN(q) && q > 0);
      
      if (sleepQualities.length > 0) {
        const avgQuality = sleepQualities.reduce((sum, q) => sum + q, 0) / sleepQualities.length;
        if (avgQuality >= 7) {
          insights.push(`🌙 Your sleep quality has been excellent this week (${avgQuality.toFixed(1)}/10 average)!`);
        }
      }
    }

    return insights;
  }

  private static calculateTrend(values: number[]): 'improving' | 'declining' | 'stable' {
    if (values.length < 3) return 'stable';

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

    const difference = secondAvg - firstAvg;
    const threshold = 0.5; // Minimum change to consider significant

    if (difference > threshold) return 'improving';
    if (difference < -threshold) return 'declining';
    return 'stable';
  }

  private static moodToNumeric(mood: string): number {
    const moodMap: Record<string, number> = {
      'challenging': 1,
      'difficult': 2,
      'okay': 3,
      'good': 4,
      'great': 5
    };
    return moodMap[mood] || 3;
  }

  private static hasPositiveTrend(entries: JournalEntry[], routineType: string): boolean {
    if (entries.length < 5) return false;

    if (routineType === 'sleep_wellness') {
      const sleepQualities = entries
        .map(e => Number(e.customData?.sleepQuality))
        .filter(q => !isNaN(q) && q > 0);
      return this.calculateTrend(sleepQualities) === 'improving';
    }

    if (routineType === 'pain_management') {
      const painLevels = entries
        .map(e => e.painLevel || Number(e.customData?.painLevel))
        .filter(p => p !== undefined && !isNaN(p));
      return this.calculateTrend(painLevels) === 'declining'; // Lower pain is better
    }

    const moodValues = entries
      .map(e => this.moodToNumeric(e.mood || 'okay'))
      .filter(m => m > 0);
    return this.calculateTrend(moodValues) === 'improving';
  }

  private static getBasePromptsForRoutineType(routineType: string): JournalPrompt[] {
    const basePrompts: Record<string, JournalPrompt[]> = {
      sleep_wellness: [
        {
          id: 'sleep_quality_general',
          question: 'How was your sleep quality last night?',
          type: 'tracking',
          priority: 5
        },
        {
          id: 'sleep_routine_reflection',
          question: 'How did your bedtime routine feel tonight?',
          type: 'reflection',
          priority: 4
        }
      ],
      pain_management: [
        {
          id: 'pain_level_general',
          question: 'How are your pain levels today?',
          type: 'tracking',
          priority: 5
        },
        {
          id: 'pain_relief_reflection',
          question: 'What strategies helped with your pain today?',
          type: 'reflection',
          priority: 4
        }
      ],
      stress_management: [
        {
          id: 'stress_level_general',
          question: 'How has your stress been today?',
          type: 'tracking',
          priority: 5
        },
        {
          id: 'stress_coping_reflection',
          question: 'What helped you manage stress today?',
          type: 'reflection',
          priority: 4
        }
      ],
      mental_wellness: [
        {
          id: 'mood_general',
          question: 'How are you feeling overall today?',
          type: 'tracking',
          priority: 5
        },
        {
          id: 'mental_wellness_reflection',
          question: 'What brought you joy or peace today?',
          type: 'reflection',
          priority: 4
        }
      ]
    };

    return basePrompts[routineType] || basePrompts.mental_wellness;
  }

  private static getBaseFieldsForRoutineType(routineType: string): CustomJournalField[] {
    const baseFields: Record<string, CustomJournalField[]> = {
      sleep_wellness: [
        {
          id: 'sleep_quality',
          type: 'rating_scale',
          label: 'Sleep Quality',
          description: 'Rate your sleep quality from last night',
          required: true,
          scale: { min: 1, max: 10, labels: { 1: 'Very Poor', 5: 'Average', 10: 'Excellent' } }
        },
        {
          id: 'bedtime',
          type: 'time_input',
          label: 'Bedtime',
          description: 'What time did you go to bed?',
          required: false
        },
        {
          id: 'sleep_duration',
          type: 'custom_metric',
          label: 'Hours of Sleep',
          description: 'How many hours did you sleep?',
          required: false,
          validation: { min: 0, max: 24 }
        }
      ],
      pain_management: [
        {
          id: 'pain_level',
          type: 'pain_scale',
          label: 'Pain Level',
          description: 'Rate your pain level today',
          required: true,
          scale: { min: 1, max: 10, labels: { 1: 'No Pain', 5: 'Moderate', 10: 'Severe' } }
        },
        {
          id: 'pain_location',
          type: 'checkbox_list',
          label: 'Pain Locations',
          description: 'Where are you experiencing pain?',
          required: false,
          options: ['Head', 'Neck', 'Shoulders', 'Back', 'Arms', 'Legs', 'Joints', 'Other']
        }
      ],
      stress_management: [
        {
          id: 'stress_level',
          type: 'rating_scale',
          label: 'Stress Level',
          description: 'Rate your stress level today',
          required: true,
          scale: { min: 1, max: 10, labels: { 1: 'Very Calm', 5: 'Moderate', 10: 'Very Stressed' } }
        },
        {
          id: 'stress_triggers',
          type: 'text_area',
          label: 'Stress Triggers',
          description: 'What caused stress today?',
          required: false,
          placeholder: 'Work deadlines, traffic, family issues...'
        }
      ],
      mental_wellness: [
        {
          id: 'energy_level',
          type: 'energy_level',
          label: 'Energy Level',
          description: 'How energetic do you feel?',
          required: true,
          scale: { min: 1, max: 10, labels: { 1: 'Exhausted', 5: 'Moderate', 10: 'Energized' } }
        },
        {
          id: 'mood_notes',
          type: 'text_area',
          label: 'Mood Notes',
          description: 'Any additional thoughts about your mood?',
          required: false,
          placeholder: 'Feeling grateful for..., struggling with...'
        }
      ]
    };

    return baseFields[routineType] || baseFields.mental_wellness;
  }

  private static getTrackingFocusForRoutineType(routineType: string): string[] {
    const trackingFocus: Record<string, string[]> = {
      sleep_wellness: ['sleep_quality', 'sleep_duration', 'bedtime_routine_completion', 'supplement_effectiveness'],
      pain_management: ['pain_levels', 'pain_triggers', 'relief_strategies', 'exercise_impact'],
      stress_management: ['stress_levels', 'stress_triggers', 'coping_strategies', 'relaxation_effectiveness'],
      mental_wellness: ['mood_patterns', 'energy_levels', 'gratitude_practice', 'social_connections']
    };

    return trackingFocus[routineType] || trackingFocus.mental_wellness;
  }

  private static mapRoutineTypeToJournalType(routineType: string): DynamicJournalTemplate['journalType'] {
    const mapping: Record<string, DynamicJournalTemplate['journalType']> = {
      sleep_wellness: 'sleep_tracking',
      pain_management: 'pain_monitoring',
      stress_management: 'stress_management',
      mental_wellness: 'mood_wellness'
    };

    return mapping[routineType] || 'general_wellness';
  }
}