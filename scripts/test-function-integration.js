// Test script for function integration with multiple assistants
// Run this in the browser console to test various scenarios

const testFunctionIntegration = {
  // Test 1: Empty pantry scenario
  async testEmptyPantry() {
    console.log('🧪 Test 1: Empty Pantry');
    
    // Clear pantry
    localStorage.removeItem('thrive_pantry_items');
    
    // Ask about supplements
    console.log('Ask the assistant: "What supplements do you recommend for better sleep?"');
    console.log('Expected: Assistant should acknowledge empty pantry and suggest supplements');
  },

  // Test 2: Routine not found scenario
  async testRoutineNotFound() {
    console.log('🧪 Test 2: Routine Not Found');
    
    // Clear routines
    localStorage.removeItem('thrive_wellness_routines');
    
    // Ask about routines
    console.log('Ask the assistant: "Show me my sleep routine"');
    console.log('Expected: Assistant should acknowledge no routines found and offer to create one');
  },

  // Test 3: Function error handling
  async testFunctionError() {
    console.log('🧪 Test 3: Function Error Handling');
    
    // Set corrupted data
    localStorage.setItem('thrive_pantry_items', 'invalid json data');
    
    // Ask about pantry
    console.log('Ask the assistant: "What supplements do I have?"');
    console.log('Expected: Assistant should handle error gracefully and continue conversation');
    
    // Clean up
    setTimeout(() => {
      localStorage.removeItem('thrive_pantry_items');
    }, 5000);
  },

  // Test 4: Multiple function calls
  async testMultipleFunctions() {
    console.log('🧪 Test 4: Multiple Function Calls');
    
    // Set up test data
    const testPantry = [
      {
        id: '1',
        name: 'Melatonin',
        category: 'supplements',
        dosage: '3mg',
        timing: 'Before bed',
        notes: 'For sleep',
        dateAdded: new Date().toISOString()
      }
    ];
    
    const testRoutine = {
      id: '1',
      name: 'Evening Wind Down',
      type: 'sleep_wellness',
      isActive: true,
      steps: [
        { title: 'Dim lights', duration: 5 },
        { title: 'Take melatonin', duration: 2 }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem('thrive_pantry_items', JSON.stringify(testPantry));
    localStorage.setItem('thrive_wellness_routines', JSON.stringify([testRoutine]));
    
    // Ask a question that triggers multiple functions
    console.log('Ask the assistant: "Review my sleep routine and supplements"');
    console.log('Expected: Assistant should call both get_routines and get_pantry_items functions');
  },

  // Test 5: Assistant handoff with functions
  async testAssistantHandoff() {
    console.log('🧪 Test 5: Assistant Handoff');
    
    // Set up context
    console.log('Ask the assistant: "I want to create a new morning routine"');
    console.log('Expected: Chat specialist should handoff to Routine specialist');
    console.log('Then ask: "What time should I wake up?"');
    console.log('Expected: Routine specialist should respond with time options');
  },

  // Run all tests
  async runAllTests() {
    console.log('🚀 Running all function integration tests...\n');
    
    const tests = [
      this.testEmptyPantry,
      this.testRoutineNotFound,
      this.testFunctionError,
      this.testMultipleFunctions,
      this.testAssistantHandoff
    ];
    
    for (const test of tests) {
      await test();
      console.log('\n---\n');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('✅ All tests scenarios prepared. Please interact with the assistant as instructed above.');
  },

  // Monitor function calls
  monitorFunctions() {
    console.log('📊 Monitoring function calls...');
    
    // Override console.log to capture function-related logs
    const originalLog = console.log;
    console.log = function(...args) {
      const message = args.join(' ');
      if (message.includes('Function call:') || 
          message.includes('Function execution') || 
          message.includes('Tool outputs')) {
        originalLog.apply(console, ['🔧 FUNCTION:', ...args]);
      } else {
        originalLog.apply(console, args);
      }
    };
    
    console.log('Monitoring started. Function calls will be highlighted with 🔧');
  },

  // Check current state
  checkState() {
    const pantry = localStorage.getItem('thrive_pantry_items');
    const routines = localStorage.getItem('thrive_wellness_routines');
    
    console.log('📦 Current State:');
    console.log('Pantry items:', pantry ? JSON.parse(pantry).length : 0);
    console.log('Active routines:', routines ? JSON.parse(routines).filter(r => r.isActive).length : 0);
    
    return {
      hasPantryItems: pantry && JSON.parse(pantry).length > 0,
      hasRoutines: routines && JSON.parse(routines).length > 0
    };
  },

  // Helper to simulate function errors
  simulateError(functionName) {
    console.log(`🔴 Simulating error for function: ${functionName}`);
    
    // Temporarily override the function to return an error
    const script = `
      if (window.thriveTestOriginalFunctions === undefined) {
        window.thriveTestOriginalFunctions = {};
      }
      
      // Store original function and override
      window.thriveTestOriginalFunctions['${functionName}'] = window['${functionName}'];
      window['${functionName}'] = () => ({ error: true, message: 'Test error: Function failed' });
      
      console.log('Function ${functionName} will now return errors');
    `;
    
    eval(script);
  },

  // Restore functions
  restoreFunctions() {
    console.log('♻️ Restoring original functions');
    
    if (window.thriveTestOriginalFunctions) {
      Object.keys(window.thriveTestOriginalFunctions).forEach(funcName => {
        window[funcName] = window.thriveTestOriginalFunctions[funcName];
      });
      delete window.thriveTestOriginalFunctions;
    }
  }
};

// Make it available globally
window.thriveTests = testFunctionIntegration;

console.log('🧪 Thrive Function Integration Tests Loaded!');
console.log('Available commands:');
console.log('- thriveTests.runAllTests() - Run all test scenarios');
console.log('- thriveTests.checkState() - Check current data state');
console.log('- thriveTests.monitorFunctions() - Monitor function calls');
console.log('- thriveTests.testEmptyPantry() - Test empty pantry scenario');
console.log('- thriveTests.testRoutineNotFound() - Test routine not found');
console.log('- thriveTests.simulateError("get_pantry_items") - Simulate function error');
console.log('- thriveTests.restoreFunctions() - Restore original functions');