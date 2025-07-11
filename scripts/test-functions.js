#!/usr/bin/env node

/**
 * Test script for multi-assistant function integration
 * Run in browser console to test various function scenarios
 */

// Test helpers
const testHelpers = {
  // Enable test mode for function failures
  enableTestMode: () => {
    localStorage.setItem('test_function_failures', 'true');
    console.log('✅ Test mode enabled - functions will randomly fail');
  },
  
  disableTestMode: () => {
    localStorage.removeItem('test_function_failures');
    console.log('✅ Test mode disabled');
  },
  
  // Corrupt pantry data
  corruptPantryData: () => {
    localStorage.setItem('thriveApp_pantryItems', 'invalid json {]');
    console.log('✅ Pantry data corrupted');
  },
  
  // Clear pantry data
  clearPantryData: () => {
    localStorage.removeItem('thriveApp_pantryItems');
    console.log('✅ Pantry data cleared');
  },
  
  // Add valid pantry items
  addTestPantryItems: () => {
    const testItems = [
      {
        id: 'test-1',
        name: 'Vitamin D3',
        tags: ['supplement', 'vitamin'],
        notes: '2000 IU daily',
        dateAdded: new Date().toISOString()
      },
      {
        id: 'test-2',
        name: 'Magnesium Glycinate',
        tags: ['supplement', 'mineral'],
        notes: 'For sleep, 400mg before bed',
        dateAdded: new Date().toISOString()
      }
    ];
    localStorage.setItem('thriveApp_pantryItems', JSON.stringify(testItems));
    console.log('✅ Added test pantry items:', testItems);
  },
  
  // Clear all routines
  clearRoutines: () => {
    localStorage.removeItem('thriveApp_routines');
    console.log('✅ Routines cleared');
  },
  
  // Add test routine
  addTestRoutine: () => {
    const testRoutine = {
      id: 'test-routine-1',
      name: 'Evening Wind-Down',
      type: 'sleep_wellness',
      description: 'Relaxing bedtime routine',
      duration: 30,
      frequency: 'daily',
      steps: [
        {
          order: 1,
          description: 'Dim the lights',
          duration: 5
        },
        {
          order: 2,
          description: 'Take magnesium supplement',
          duration: 2
        }
      ],
      isActive: true,
      createdAt: new Date().toISOString()
    };
    const existing = JSON.parse(localStorage.getItem('thriveApp_routines') || '[]');
    existing.push(testRoutine);
    localStorage.setItem('thriveApp_routines', JSON.stringify(existing));
    console.log('✅ Added test routine:', testRoutine);
  },
  
  // Monitor function calls
  monitorFunctions: () => {
    console.log('🔍 Monitoring function calls...');
    console.log('Watch for:');
    console.log('- [FUNCTION] Executing... - Function started');
    console.log('- [FUNCTION] Result: - Function completed');
    console.log('- Error in function... - Function failed');
    console.log('- Submit tool outputs received - Server processing');
  }
};

// Test scenarios
const testScenarios = {
  // Test 1: Empty pantry
  testEmptyPantry: () => {
    console.log('\n📋 TEST 1: Empty Pantry Response');
    console.log('1. Clear pantry data');
    testHelpers.clearPantryData();
    console.log('2. Send message: "What supplements do I have?"');
    console.log('Expected: Assistant acknowledges empty pantry, suggests adding items\n');
  },
  
  // Test 2: Corrupted data
  testCorruptedData: () => {
    console.log('\n📋 TEST 2: Corrupted Data Handling');
    console.log('1. Corrupt pantry data');
    testHelpers.corruptPantryData();
    console.log('2. Send message: "Show me my supplements"');
    console.log('Expected: Assistant handles error gracefully\n');
  },
  
  // Test 3: Valid data
  testValidData: () => {
    console.log('\n📋 TEST 3: Valid Data Response');
    console.log('1. Add test pantry items');
    testHelpers.addTestPantryItems();
    console.log('2. Send message: "What vitamins am I taking?"');
    console.log('Expected: Assistant lists Vitamin D3 and Magnesium\n');
  },
  
  // Test 4: Multiple functions
  testMultipleFunctions: () => {
    console.log('\n📋 TEST 4: Multiple Function Calls');
    console.log('1. Add pantry and routine data');
    testHelpers.addTestPantryItems();
    testHelpers.addTestRoutine();
    console.log('2. Send message: "Show me my sleep routine and related supplements"');
    console.log('Expected: Assistant shows both routine and magnesium supplement\n');
  },
  
  // Test 5: Assistant handoff
  testAssistantHandoff: () => {
    console.log('\n📋 TEST 5: Assistant Handoff with Functions');
    console.log('1. Start with: "I need help with sleep"');
    console.log('2. When routine creation is suggested, click it');
    console.log('3. Check if routine specialist can access pantry data');
    console.log('Expected: Smooth handoff, functions work across assistants\n');
  }
};

// Export for browser console
window.thriveTests = {
  helpers: testHelpers,
  scenarios: testScenarios,
  
  // Run all tests
  runAll: () => {
    console.log('🚀 Running all function integration tests...\n');
    testHelpers.monitorFunctions();
    
    // Run each scenario with delay
    const scenarios = Object.values(testScenarios);
    scenarios.forEach((scenario, index) => {
      setTimeout(() => scenario(), index * 1000);
    });
  },
  
  // Quick test
  quickTest: () => {
    console.log('⚡ Quick function test...');
    testHelpers.addTestPantryItems();
    console.log('✅ Ready! Try: "What supplements do I have?"');
  }
};

// Instructions
console.log(`
🧪 Thrive Function Integration Test Suite
========================================

Available commands:

Quick test:
  thriveTests.quickTest()

Run all tests:
  thriveTests.runAll()

Individual tests:
  thriveTests.scenarios.testEmptyPantry()
  thriveTests.scenarios.testCorruptedData()
  thriveTests.scenarios.testValidData()
  thriveTests.scenarios.testMultipleFunctions()
  thriveTests.scenarios.testAssistantHandoff()

Helpers:
  thriveTests.helpers.enableTestMode()
  thriveTests.helpers.clearPantryData()
  thriveTests.helpers.addTestPantryItems()
  thriveTests.helpers.monitorFunctions()

Start with: thriveTests.quickTest()
`);