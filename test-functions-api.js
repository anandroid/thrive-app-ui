// Using native fetch in Node.js 18+

const API_URL = 'http://localhost:3001/api/assistant/tools';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testFunction(name, functionName, args = {}) {
  console.log(`\n=== Testing ${name} ===`);
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool_calls: [{
          function: {
            name: functionName,
            arguments: typeof args === 'string' ? args : JSON.stringify(args)
          }
        }]
      })
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

async function runAllTests() {
  console.log('Starting Assistant Function Tests...\n');
  
  // Test 1: Get User Context
  await testFunction('Get User Context', 'get_user_context');
  await delay(1000);
  
  // Test 2: Get Pantry Items
  await testFunction('Get Pantry Items', 'get_pantry_items');
  await delay(1000);
  
  // Test 3: Get Routines
  await testFunction('Get Routines', 'get_routines');
  await delay(1000);
  
  // Test 4: Add to Pantry
  await testFunction('Add to Pantry', 'add_to_pantry', {
    name: 'Melatonin',
    dosage: '3mg',
    timing: 'bedtime',
    category: 'supplement',
    notes: 'For sleep support'
  });
  await delay(1000);
  
  // Test 5: Create Routine
  await testFunction('Create Routine', 'create_routine', {
    name: 'Morning Energy Routine',
    description: 'Start your day with energy',
    steps: [
      {
        action: 'Drink water',
        time: '07:00',
        duration: 5,
        notes: '16oz room temperature'
      },
      {
        action: 'Take vitamin D',
        time: '07:05',
        duration: 2,
        notes: 'With breakfast'
      }
    ]
  });
  await delay(1000);
  
  // Test 6: Create Journey
  await testFunction('Create Journey', 'create_journey', {
    condition: 'chronic back pain',
    intensity: 6,
    notes: 'Lower back pain from sitting too much'
  });
  
  console.log('\n=== All tests completed ===');
}

// Run the tests
runAllTests().catch(console.error);