#!/usr/bin/env node

/**
 * Test script to demonstrate question context inclusion
 */

console.log('🧪 Question Context Examples\n');

const examples = [
  {
    type: 'Quick Reply',
    question: 'Have you tried any sleep supplements before?',
    userInput: 'No',
    output: 'No (answering: "Have you tried any sleep supplements before?")',
    explanation: 'Now the assistant knows the user hasn\'t tried supplements'
  },
  {
    type: 'Quick Reply',
    question: 'What time of day do you prefer to exercise?',
    userInput: 'Morning',
    output: 'Morning (answering: "What time of day do you prefer to exercise?")',
    explanation: 'Assistant understands this is about exercise timing preference'
  },
  {
    type: 'Text Input',
    question: 'Would you like assistance in creating a list of your current medications?',
    userInput: 'Yes, that would be helpful yes please',
    output: 'Yes, that would be helpful yes please (answering: "Would you like assistance in creating a list of your current medications?")',
    explanation: 'Clear that user wants help with medication list'
  },
  {
    type: 'Time Input',
    question: 'What time do you usually go to bed?',
    userInput: '10:30 PM',
    output: '10:30 PM (answering: "What time do you usually go to bed?")',
    explanation: 'Assistant knows this is bedtime, not wake time'
  },
  {
    type: 'Multi-Select',
    question: 'What factors might be affecting your sleep?',
    userInput: ['Stress', 'Poor diet', 'Lack of exercise'],
    output: 'Stress, Poor diet, Lack of exercise (answering: "What factors might be affecting your sleep?")',
    explanation: 'Assistant can address multiple sleep factors'
  },
  {
    type: 'Quick Reply',
    question: 'Do you have any allergies we should be aware of?',
    userInput: 'Not sure',
    output: 'Not sure (answering: "Do you have any allergies we should be aware of?")',
    explanation: 'Assistant knows to be cautious with recommendations'
  }
];

console.log('📊 Examples of Question Context in Action:\n');

examples.forEach((example, idx) => {
  console.log(`${idx + 1}. ${example.type} Question`);
  console.log(`   ❓ Question: "${example.question}"`);
  console.log(`   👤 User Input: ${Array.isArray(example.userInput) ? example.userInput.join(', ') : example.userInput}`);
  console.log(`   📤 API Receives: "${example.output}"`);
  console.log(`   💡 Benefit: ${example.explanation}`);
  console.log('');
});

console.log('🎯 Key Benefits:\n');
console.log('1. No ambiguity - "No" always has context');
console.log('2. Better acknowledgments - Assistant knows what to acknowledge');
console.log('3. Smarter responses - Assistant can tailor response to the specific question');
console.log('4. Works with sliding window - Context preserved even if older messages drop off');
console.log('5. Universal format - Same pattern for all question types');

console.log('\n✨ Example Assistant Responses:\n');

console.log('Before: User says "No" → Assistant: "I understand. Let\'s explore your options..."');
console.log('After:  User says "No (answering: "Have you tried sleep supplements?")" → Assistant: "I see you haven\'t tried supplements yet. Let\'s start with natural sleep techniques..."');

console.log('\n✅ Implementation Complete!');
console.log('All question types now include context for better conversation flow.');