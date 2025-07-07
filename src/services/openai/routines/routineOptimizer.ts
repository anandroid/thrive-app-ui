export class RoutineOptimizer {
  determineOptimalRoutineType(healthConcern: string): string {
    const concern = healthConcern.toLowerCase();

    if (concern.includes('sleep') || concern.includes('insomnia')) {
      return 'sleep_routine';
    } else if (
      concern.includes('stress') ||
      concern.includes('anxiety') ||
      concern.includes('nervous')
    ) {
      return 'stress_management';
    } else if (
      concern.includes('pain') ||
      concern.includes('ache') ||
      concern.includes('hurt')
    ) {
      return 'pain_relief';
    } else if (
      concern.includes('meditat') ||
      concern.includes('mindful') ||
      concern.includes('calm')
    ) {
      return 'meditation';
    } else if (
      concern.includes('weight') ||
      concern.includes('exercise') ||
      concern.includes('fitness') ||
      concern.includes('gym')
    ) {
      return 'exercise';
    }

    return 'wellness_routine';
  }

  determineOptimalFrequency(routineType: string, duration: string): string {
    // AI logic to determine optimal frequency
    if (routineType === 'pain_relief' || routineType === 'medication') {
      return duration === '7_days' ? 'hourly' : 'twice_daily';
    } else if (routineType === 'sleep_routine') {
      return 'daily';
    } else if (
      routineType === 'meditation' ||
      routineType === 'stress_management'
    ) {
      return 'twice_daily';
    } else if (routineType === 'exercise') {
      return duration === '7_days' ? 'daily' : 'twice_daily';
    } else if (duration === 'until_passed') {
      return 'daily';
    }
    // Default based on duration
    return duration === '7_days' ? 'twice_daily' : 'daily';
  }
}