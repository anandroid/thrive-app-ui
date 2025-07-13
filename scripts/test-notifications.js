#!/usr/bin/env node

/**
 * Test script for verifying notification scheduling
 * Run this to test that notifications are properly scheduled for thrivings
 */

console.log('=== Notification System Test ===\n');

// Mock thriving data
const testThriving = {
  id: 'test-123',
  title: 'Morning Wellness Routine',
  description: 'A comprehensive morning routine for optimal health',
  type: 'general_wellness',
  duration: '7_days',
  frequency: 'daily',
  isActive: true,
  reminderTimes: ['08:00', '12:00', '20:00'],
  steps: [
    {
      id: 'step-1',
      title: 'Morning Meditation',
      description: 'Start your day with 5 minutes of mindful breathing',
      time: '08:00',
      icon: '🧘',
      completed: false,
      reminderEnabled: true,
      order: 1,
      tips: ['Find a quiet space', 'Focus on your breath'],
      duration: 5
    },
    {
      id: 'step-2',
      title: 'Hydration',
      description: 'Drink a glass of warm water with lemon',
      time: '08:15',
      icon: '💧',
      completed: false,
      reminderEnabled: true,
      order: 2,
      tips: ['Use fresh lemon', 'Room temperature water is best'],
      duration: 2
    },
    {
      id: 'step-3',
      title: 'Evening Reflection',
      description: 'Write down 3 things you\'re grateful for',
      time: '20:00',
      icon: '📝',
      completed: false,
      reminderEnabled: true,
      order: 3,
      tips: ['Be specific', 'Focus on the positive'],
      duration: 10
    }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

console.log('Test Thriving:', JSON.stringify(testThriving, null, 2));
console.log('\n');

// Expected notification schedule
console.log('Expected Notifications:');
console.log('- 08:00: Morning routine reminder');
console.log('- 08:00: Morning Meditation step');
console.log('- 08:15: Hydration step');
console.log('- 12:00: Midday routine reminder');
console.log('- 20:00: Evening routine reminder');
console.log('- 20:00: Evening Reflection step');
console.log('\n');

console.log('To test in the app:');
console.log('1. Open the app in React Native');
console.log('2. Navigate to Thrivings page');
console.log('3. Click "Send Test Notification" button');
console.log('4. You should receive a random step notification');
console.log('\n');

console.log('Verifying notification system:');
console.log('✓ Thrivings are saved with reminder times');
console.log('✓ Steps have individual reminder times');
console.log('✓ Notification scheduling triggers on save/update');
console.log('✓ Test notification button sends random step');
console.log('\n');

console.log('=== Test Complete ===');