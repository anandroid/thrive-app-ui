// Script to setup mock data in localStorage
// Run this in the browser console while on the thrive app

const mockThrivings = [
  {
    id: 'thriving-1',
    title: 'Morning Energy Boost',
    description: 'A comprehensive morning routine to maximize your energy levels throughout the day',
    type: 'energy',
    isActive: true,
    createdAt: new Date().toISOString(),
    steps: [
      {
        id: 'step-1',
        title: 'Hydrate with Lemon Water',
        description: 'Start your day with warm lemon water to kickstart metabolism',
        time: '06:30',
        duration: 5,
        tips: ['Use fresh lemon juice', 'Add a pinch of sea salt for electrolytes'],
        icon: '💧'
      },
      {
        id: 'step-2',
        title: 'Morning Stretches',
        description: 'Gentle stretching routine to awaken your body',
        time: '06:45',
        duration: 10,
        tips: ['Focus on breathing', 'Start slowly and increase intensity'],
        icon: '🧘'
      },
      {
        id: 'step-3',
        title: 'Energizing Breakfast',
        description: 'Nutrient-dense meal with protein and healthy fats',
        time: '07:00',
        duration: 20,
        tips: ['Include berries for antioxidants', 'Avoid sugary foods'],
        icon: '🥗'
      }
    ],
    additionalRecommendations: [
      {
        title: 'B-Complex Vitamins',
        description: 'Support energy production at cellular level',
        frequency: 'daily',
        tips: ['Take with breakfast', 'Choose methylated forms']
      },
      {
        title: 'Magnesium Glycinate',
        description: 'Essential for over 300 enzymatic reactions',
        frequency: 'daily',
        tips: ['Take in the evening', 'Start with 200mg']
      }
    ],
    proTips: [
      'Consistency is key - stick to the routine for at least 21 days',
      'Track your energy levels in a journal',
      'Adjust timing based on your schedule'
    ]
  },
  {
    id: 'thriving-2',
    title: 'Better Sleep Protocol',
    description: 'Evening routine for deep, restorative sleep',
    type: 'sleep',
    isActive: true,
    createdAt: new Date().toISOString(),
    steps: [
      {
        id: 'step-1',
        title: 'Digital Sunset',
        description: 'Turn off all screens to reduce blue light exposure',
        time: '20:00',
        duration: 5,
        tips: ['Use blue light glasses if needed', 'Set phone to do not disturb'],
        icon: '📱'
      },
      {
        id: 'step-2',
        title: 'Relaxing Tea Time',
        description: 'Enjoy calming herbal tea like chamomile or passionflower',
        time: '20:30',
        duration: 15,
        tips: ['Avoid caffeine after 2pm', 'Try different herbal blends'],
        icon: '☕'
      },
      {
        id: 'step-3',
        title: 'Sleep Meditation',
        description: 'Guided meditation or breathing exercises',
        time: '21:00',
        duration: 10,
        tips: ['Use 4-7-8 breathing technique', 'Keep room cool and dark'],
        icon: '🧘'
      }
    ],
    additionalRecommendations: [
      {
        title: 'Melatonin',
        description: 'Natural sleep hormone supplement',
        frequency: 'as_needed',
        tips: ['Start with 0.5-1mg', 'Take 30 minutes before bed']
      }
    ],
    proTips: [
      'Keep your bedroom at 65-68°F for optimal sleep',
      'Invest in blackout curtains',
      'Consider a white noise machine'
    ]
  }
];

// Set the mock data
localStorage.setItem('thrive_thrivings', JSON.stringify(mockThrivings));
localStorage.setItem('hasCompletedOnboarding', 'true');
localStorage.setItem('userName', 'Sarah');

console.log('Mock data set successfully!');
console.log('Now navigate to /thrivings to see the purple theme');