/**
 * Configuration for thriving UI elements positioning during streaming creation
 * This allows for easy reordering and addition of new elements
 */

export interface StreamingElementConfig {
  id: string;
  type: 'title' | 'description' | 'step' | 'outcome' | 'tip' | 'recommendation' | 'safety';
  selector?: string; // CSS selector for the element
  delay: number; // Delay in ms before showing this element
  duration: number; // Animation duration in ms
  order: number; // Order of appearance
}

export const THRIVING_STREAMING_CONFIG: StreamingElementConfig[] = [
  {
    id: 'thriving-title',
    type: 'title',
    selector: '[data-thriving-title]',
    delay: 0,
    duration: 500,
    order: 1
  },
  {
    id: 'thriving-description',
    type: 'description',
    selector: '[data-thriving-description]',
    delay: 300,
    duration: 500,
    order: 2
  },
  {
    id: 'progress-bar',
    type: 'description',
    selector: '[data-progress-bar]',
    delay: 600,
    duration: 300,
    order: 3
  },
  {
    id: 'step-1',
    type: 'step',
    selector: '[data-step="1"]',
    delay: 1000,
    duration: 600,
    order: 4
  },
  {
    id: 'step-2',
    type: 'step',
    selector: '[data-step="2"]',
    delay: 1800,
    duration: 600,
    order: 5
  },
  {
    id: 'step-3',
    type: 'step',
    selector: '[data-step="3"]',
    delay: 2600,
    duration: 600,
    order: 6
  },
  {
    id: 'step-4',
    type: 'step',
    selector: '[data-step="4"]',
    delay: 3400,
    duration: 600,
    order: 7
  },
  {
    id: 'step-5',
    type: 'step',
    selector: '[data-step="5"]',
    delay: 4200,
    duration: 600,
    order: 8
  },
  {
    id: 'additional-recommendations',
    type: 'recommendation',
    selector: '[data-recommendations]',
    delay: 5000,
    duration: 600,
    order: 9
  },
  {
    id: 'expected-outcomes',
    type: 'outcome',
    selector: '[data-outcomes]',
    delay: 5600,
    duration: 600,
    order: 10
  },
  {
    id: 'pro-tips',
    type: 'tip',
    selector: '[data-pro-tips]',
    delay: 6200,
    duration: 600,
    order: 11
  },
  {
    id: 'safety-notes',
    type: 'safety',
    selector: '[data-safety-notes]',
    delay: 6800,
    duration: 600,
    order: 12
  },
  {
    id: 'action-buttons',
    type: 'description',
    selector: '[data-action-buttons]',
    delay: 7400,
    duration: 400,
    order: 13
  }
];

// Helper to get config for a specific step
export const getStepConfig = (stepIndex: number): StreamingElementConfig | undefined => {
  return THRIVING_STREAMING_CONFIG.find(config => 
    config.id === `step-${stepIndex + 1}`
  );
};

// Helper to get all step configs in order
export const getStepConfigs = (): StreamingElementConfig[] => {
  return THRIVING_STREAMING_CONFIG.filter(config => config.type === 'step')
    .sort((a, b) => a.order - b.order);
};

// Helper to calculate total animation time
export const getTotalAnimationTime = (): number => {
  const lastElement = THRIVING_STREAMING_CONFIG.reduce((prev, current) => 
    (prev.delay + prev.duration) > (current.delay + current.duration) ? prev : current
  );
  return lastElement.delay + lastElement.duration;
};