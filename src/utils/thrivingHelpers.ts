import { ThrivingStep } from '@/src/types/thriving';

/**
 * Sort thriving steps by time, with steps that have time coming first
 * @param steps Array of thriving steps
 * @returns Sorted array of steps
 */
export function sortThrivingSteps(steps: ThrivingStep[]): ThrivingStep[] {
  return [...steps].sort((a, b) => {
    // Sort by time if both steps have time
    if (a.time && b.time) {
      return a.time.localeCompare(b.time);
    }
    // Steps with time come before steps without time
    if (a.time && !b.time) return -1;
    if (!a.time && b.time) return 1;
    // For steps without time, sort by order
    return (a.order || 0) - (b.order || 0);
  });
}

/**
 * Find the index of a step in the sorted steps array
 * @param steps Original array of steps
 * @param stepId The ID of the step to find
 * @returns The index in the sorted array, or -1 if not found
 */
export function findSortedStepIndex(steps: ThrivingStep[], stepId: string): number {
  const sortedSteps = sortThrivingSteps(steps);
  return sortedSteps.findIndex(step => step.id === stepId);
}