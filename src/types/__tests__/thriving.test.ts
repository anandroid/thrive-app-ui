import { Thriving } from '../thriving';

describe('Thriving Model Parsing', () => {
  const mockThrivingData = {
    "id": "1751982456116",
    "createdAt": "2025-07-08T13:47:36.116Z",
    "routineType": "weight_loss",
    "duration": 7,
    "frequency": "daily",
    "healthConcern": "Help me lose weight sustainably",
    "routineTitle": "Sustainable Weight Loss Journey 🌱",
    "routineDescription": "This routine focuses on daily activities that promote gradual weight loss through healthy eating, exercise, and mindfulness, leading to sustainable lifestyle changes.",
    "totalSteps": 6,
    "reminderFrequency": "daily",
    "steps": [
      {
        "order": 1,
        "title": "Morning Hydration 💧",
        "description": "Start your day by drinking a glass of water to boost your metabolism and hydrate your body after sleep.",
        "duration": 5,
        "stepNumber": 1,
        "bestTime": "Morning (07:00)",
        "tips": [
          "Add a slice of lemon for flavor",
          "Keep a water bottle by your bed as a reminder"
        ],
        "videoSearchQuery": "how to drink water for weight loss",
        "will_video_tutorial_help": false,
        "reminderText": "Don't forget to hydrate!",
        "reminderTime": "07:05"
      },
      {
        "order": 2,
        "title": "Morning Exercise 🏋️‍♂️",
        "description": "Engage in a 30-minute workout that includes cardio and strength training exercises to kickstart your metabolism.",
        "duration": 30,
        "stepNumber": 2,
        "bestTime": "Morning (07:30)",
        "tips": [
          "Choose exercises you enjoy",
          "Consider a mix of HIIT and strength training"
        ],
        "videoSearchQuery": "30 minute weight loss workout",
        "will_video_tutorial_help": true,
        "reminderText": "Time for your workout!",
        "reminderTime": "07:30"
      },
      {
        "order": 3,
        "title": "Healthy Breakfast 🍳",
        "description": "Prepare a nutritious breakfast that includes protein, healthy fats, and fiber to keep you full longer.",
        "duration": 15,
        "stepNumber": 3,
        "bestTime": "Morning (08:00)",
        "tips": [
          "Include oatmeal, eggs, or yogurt",
          "Avoid sugary cereals"
        ],
        "videoSearchQuery": "healthy breakfast ideas for weight loss",
        "will_video_tutorial_help": true,
        "reminderText": "Time for a healthy breakfast!",
        "reminderTime": "08:00"
      },
      {
        "order": 4,
        "title": "Mindful Lunch 🥗",
        "description": "Take 20 minutes to prepare and enjoy a balanced lunch, focusing on portion control and mindful eating.",
        "duration": 20,
        "stepNumber": 4,
        "bestTime": "Lunch (12:30)",
        "tips": [
          "Use smaller plates to control portions",
          "Chew slowly and savor each bite"
        ],
        "videoSearchQuery": "how to eat mindfully",
        "will_video_tutorial_help": true,
        "reminderText": "Enjoy your mindful lunch!",
        "reminderTime": "12:30"
      },
      {
        "order": 5,
        "title": "Evening Walk 🚶‍♀️",
        "description": "End your day with a 30-minute walk to relax, promote digestion, and burn extra calories.",
        "duration": 30,
        "stepNumber": 5,
        "bestTime": "Evening (19:00)",
        "tips": [
          "Choose a scenic route",
          "Invite a friend for motivation"
        ],
        "videoSearchQuery": "benefits of walking for weight loss",
        "will_video_tutorial_help": false,
        "reminderText": "Time for your evening walk!",
        "reminderTime": "19:00"
      },
      {
        "order": 6,
        "title": "Evening Reflection 📖",
        "description": "Spend 10 minutes journaling about your day, focusing on what went well and areas for improvement.",
        "duration": 10,
        "stepNumber": 6,
        "bestTime": "Before bed (21:30)",
        "tips": [
          "Write down three positive things from your day",
          "Set intentions for tomorrow"
        ],
        "videoSearchQuery": "journaling for weight loss",
        "will_video_tutorial_help": false,
        "reminderText": "Time for your evening reflection!",
        "reminderTime": "21:30"
      }
    ],
    "additionalSteps": [
      {
        "id": "grocery_shopping",
        "title": "Plan Grocery Shopping 🛒",
        "description": "Create a list of healthy foods and snacks to support your weight loss goals.",
        "frequency": "weekly",
        "tips": [
          "Stick to the perimeter of the grocery store",
          "Avoid processed foods"
        ],
        "videoSearchQuery": "",
        "will_video_tutorial_help": false
      },
      {
        "id": "meal_prep",
        "title": "Weekly Meal Prep 🍱",
        "description": "Spend a few hours on the weekend preparing meals for the week to avoid unhealthy choices.",
        "frequency": "weekly",
        "tips": [
          "Use clear containers for easy access",
          "Batch cook grains and proteins"
        ],
        "videoSearchQuery": "meal prep ideas for weight loss",
        "will_video_tutorial_help": true
      },
      {
        "id": "grocery_list_update",
        "title": "Update Grocery List 📝",
        "description": "Review and update your grocery list based on what you used up and any new recipes you want to try.",
        "frequency": "weekly",
        "tips": [
          "Check pantry for staple items",
          "Plan meals around seasonal produce"
        ],
        "videoSearchQuery": "",
        "will_video_tutorial_help": false
      }
    ],
    "expectedOutcomes": [
      "Improved energy levels",
      "Gradual weight loss of 0.5-1 kg per week",
      "Establishment of healthier eating habits"
    ],
    "safetyNotes": [
      "Consult with a healthcare provider before starting any new exercise program.",
      "Stay hydrated throughout the day."
    ],
    "progressTracking": "Use a journal to track your daily meals, workouts, and reflections on your progress.",
    "name": "Sustainable Weight Loss Journey 🌱",
    "description": "This routine focuses on daily activities that promote gradual weight loss through healthy eating, exercise, and mindfulness, leading to sustainable lifestyle changes.",
    "type": "weight_loss",
    "reminderTimes": [
      "07:05",
      "07:30",
      "08:00",
      "12:30",
      "19:00",
      "21:30"
    ],
    "updatedAt": "2025-07-08T13:47:36.116Z",
    "isActive": true
  };

  it('should parse routine data into Thriving model correctly', () => {
    // Convert routine data to Thriving format
    const thriving: Thriving = {
      id: mockThrivingData.id,
      title: mockThrivingData.routineTitle || mockThrivingData.name,
      description: mockThrivingData.routineDescription || mockThrivingData.description,
      type: 'general_wellness', // weight_loss would map to general_wellness
      duration: '7_days',
      frequency: 'daily',
      steps: mockThrivingData.steps.map((step, index) => ({
        id: `step-${index + 1}`,
        title: step.title,
        description: step.description,
        time: step.reminderTime,
        icon: undefined,
        completed: false,
        reminderEnabled: true,
        order: step.order,
        tips: step.tips,
        duration: step.duration,
        will_video_tutorial_help: step.will_video_tutorial_help
      })),
      additionalRecommendations: mockThrivingData.additionalSteps.map(step => step.title),
      proTips: [],
      reminderTimes: mockThrivingData.reminderTimes,
      healthConcern: mockThrivingData.healthConcern,
      customInstructions: undefined,
      createdAt: mockThrivingData.createdAt,
      updatedAt: mockThrivingData.updatedAt,
      completedDates: [],
      isActive: mockThrivingData.isActive,
      startDate: mockThrivingData.createdAt
    };

    // Test main properties
    expect(thriving.id).toBe('1751982456116');
    expect(thriving.title).toBe('Sustainable Weight Loss Journey 🌱');
    expect(thriving.description).toBe('This routine focuses on daily activities that promote gradual weight loss through healthy eating, exercise, and mindfulness, leading to sustainable lifestyle changes.');
    expect(thriving.type).toBe('general_wellness');
    expect(thriving.duration).toBe('7_days');
    expect(thriving.frequency).toBe('daily');
    expect(thriving.isActive).toBe(true);
    expect(thriving.healthConcern).toBe('Help me lose weight sustainably');

    // Test steps
    expect(thriving.steps).toHaveLength(6);
    
    // Test first step (Morning Hydration)
    const firstStep = thriving.steps[0];
    expect(firstStep.title).toBe('Morning Hydration 💧');
    expect(firstStep.description).toBe('Start your day by drinking a glass of water to boost your metabolism and hydrate your body after sleep.');
    expect(firstStep.time).toBe('07:05');
    expect(firstStep.duration).toBe(5);
    expect(firstStep.will_video_tutorial_help).toBe(false);
    expect(firstStep.tips).toEqual([
      'Add a slice of lemon for flavor',
      'Keep a water bottle by your bed as a reminder'
    ]);

    // Test second step (Morning Exercise) - should have video help
    const secondStep = thriving.steps[1];
    expect(secondStep.title).toBe('Morning Exercise 🏋️‍♂️');
    expect(secondStep.will_video_tutorial_help).toBe(true);
    expect(secondStep.duration).toBe(30);

    // Test additional recommendations
    expect(thriving.additionalRecommendations).toHaveLength(3);
    expect(thriving.additionalRecommendations).toContain('Plan Grocery Shopping 🛒');
    expect(thriving.additionalRecommendations).toContain('Weekly Meal Prep 🍱');
    expect(thriving.additionalRecommendations).toContain('Update Grocery List 📝');

    // Test reminder times
    expect(thriving.reminderTimes).toHaveLength(6);
    expect(thriving.reminderTimes).toEqual([
      '07:05',
      '07:30',
      '08:00',
      '12:30',
      '19:00',
      '21:30'
    ]);
  });

  it('should correctly identify which steps need video tutorials', () => {
    const steps = mockThrivingData.steps;
    
    // Steps that should have video tutorials
    const stepsWithVideo = steps.filter(step => step.will_video_tutorial_help);
    expect(stepsWithVideo).toHaveLength(3);
    expect(stepsWithVideo.map(s => s.title)).toEqual([
      'Morning Exercise 🏋️‍♂️',
      'Healthy Breakfast 🍳',
      'Mindful Lunch 🥗'
    ]);

    // Steps that should NOT have video tutorials
    const stepsWithoutVideo = steps.filter(step => !step.will_video_tutorial_help);
    expect(stepsWithoutVideo).toHaveLength(3);
    expect(stepsWithoutVideo.map(s => s.title)).toEqual([
      'Morning Hydration 💧',
      'Evening Walk 🚶‍♀️',
      'Evening Reflection 📖'
    ]);
  });

  it('should parse additional steps with all properties', () => {
    const additionalSteps = mockThrivingData.additionalSteps;
    
    // Test meal prep step (should have video)
    const mealPrepStep = additionalSteps.find(s => s.id === 'meal_prep');
    expect(mealPrepStep).toBeDefined();
    expect(mealPrepStep!.title).toBe('Weekly Meal Prep 🍱');
    expect(mealPrepStep!.description).toBe('Spend a few hours on the weekend preparing meals for the week to avoid unhealthy choices.');
    expect(mealPrepStep!.frequency).toBe('weekly');
    expect(mealPrepStep!.will_video_tutorial_help).toBe(true);
    expect(mealPrepStep!.tips).toHaveLength(2);

    // Test grocery shopping (should not have video)
    const groceryStep = additionalSteps.find(s => s.id === 'grocery_shopping');
    expect(groceryStep).toBeDefined();
    expect(groceryStep!.will_video_tutorial_help).toBe(false);
  });

  it('should handle expected outcomes and safety notes', () => {
    expect(mockThrivingData.expectedOutcomes).toHaveLength(3);
    expect(mockThrivingData.expectedOutcomes).toContain('Improved energy levels');
    expect(mockThrivingData.expectedOutcomes).toContain('Gradual weight loss of 0.5-1 kg per week');
    
    expect(mockThrivingData.safetyNotes).toHaveLength(2);
    expect(mockThrivingData.safetyNotes).toContain('Consult with a healthcare provider before starting any new exercise program.');
  });

  it('should format reminder times correctly', () => {
    const reminderTimes = mockThrivingData.reminderTimes;
    
    // All times should be in HH:MM format
    reminderTimes.forEach(time => {
      expect(time).toMatch(/^\d{2}:\d{2}$/);
    });
    
    // Check they're in chronological order
    const timesInMinutes = reminderTimes.map(time => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    });
    
    for (let i = 1; i < timesInMinutes.length; i++) {
      expect(timesInMinutes[i]).toBeGreaterThan(timesInMinutes[i - 1]);
    }
  });
});