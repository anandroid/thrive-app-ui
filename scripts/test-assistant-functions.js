#!/usr/bin/env node

/**
 * Test script for multi-assistant function calls and handoffs
 * Tests the complete flow of function execution with assistant transitions
 */

// Test scenarios that will trigger function calls and handoffs
const testScenarios = {
  // Scenario 1: Test function calls in chat assistant
  chatAssistantFunctions: {
    setup: () => {
      console.log('\n📋 Scenario 1: Chat Assistant Function Calls');
      console.log('Setting up empty pantry and no routines...');
      localStorage.removeItem('thriveApp_pantryItems');
      localStorage.removeItem('thriveApp_routines');
    },
    test: async () => {
      console.log('\n1. Test empty pantry response:');
      console.log('   Send: "What supplements do I have?"');
      console.log('   Expected: Assistant calls get_pantry_items, acknowledges empty pantry');
      
      await delay(2000);
      
      console.log('\n2. Test no routines response:');
      console.log('   Send: "Show me my wellness routines"');
      console.log('   Expected: Assistant calls get_thriving_progress, offers to create routine');
    }
  },

  // Scenario 2: Test handoff with function context
  handoffWithContext: {
    setup: () => {
      console.log('\n📋 Scenario 2: Assistant Handoff with Function Context');
      console.log('Adding test supplements to pantry...');
      
      const supplements = [
        {
          id: 'test-mg-1',
          name: 'Magnesium Glycinate',
          tags: ['supplement', 'mineral', 'sleep'],
          notes: '400mg before bed for better sleep',
          dateAdded: new Date().toISOString()
        },
        {
          id: 'test-mel-1',
          name: 'Melatonin',
          tags: ['supplement', 'sleep'],
          notes: '3mg, 30 minutes before sleep',
          dateAdded: new Date().toISOString()
        }
      ];
      
      localStorage.setItem('thriveApp_pantryItems', JSON.stringify(supplements));
      console.log('✅ Added 2 sleep supplements to pantry');
    },
    test: async () => {
      console.log('\n1. Initiate routine creation with context:');
      console.log('   Send: "I need help creating a sleep routine"');
      console.log('   Expected: Chat assistant suggests routine creation');
      
      await delay(2000);
      
      console.log('\n2. During routine creation, ask about supplements:');
      console.log('   Click: Create Sleep Routine button');
      console.log('   Then ask: "Should I include my current supplements?"');
      console.log('   Expected: Routine specialist calls get_pantry_items and sees Magnesium & Melatonin');
    }
  },

  // Scenario 3: Test multiple function calls
  multipleFunctions: {
    setup: () => {
      console.log('\n📋 Scenario 3: Multiple Function Calls');
      console.log('Setting up complete test data...');
      
      // Add routine
      const routine = {
        id: 'evening-routine-1',
        name: 'Evening Wind-Down',
        type: 'sleep_wellness',
        description: 'Relaxing bedtime routine',
        duration: 45,
        frequency: 'daily',
        steps: [
          { order: 1, description: 'Dim lights', duration: 5 },
          { order: 2, description: 'Take magnesium', duration: 2 },
          { order: 3, description: 'Gentle stretches', duration: 10 },
          { order: 4, description: 'Meditation', duration: 20 }
        ],
        isActive: true,
        createdAt: new Date().toISOString()
      };
      
      localStorage.setItem('thriveApp_routines', JSON.stringify([routine]));
      console.log('✅ Added evening routine');
      
      // Ensure pantry items exist from previous test
      const pantryItems = localStorage.getItem('thriveApp_pantryItems');
      if (!pantryItems) {
        testScenarios.handoffWithContext.setup();
      }
    },
    test: async () => {
      console.log('\n1. Request that triggers multiple functions:');
      console.log('   Send: "Review my sleep routine and what supplements I\'m taking for sleep"');
      console.log('   Expected: Assistant calls both get_thriving_progress AND get_pantry_items');
      console.log('   Should show: Evening Wind-Down routine + Magnesium & Melatonin');
    }
  },

  // Scenario 4: Test function error handling
  errorHandling: {
    setup: () => {
      console.log('\n📋 Scenario 4: Function Error Handling');
      console.log('Corrupting localStorage data...');
      
      // Set invalid JSON to trigger parse errors
      localStorage.setItem('thriveApp_pantryItems', '{invalid json]');
      console.log('✅ Pantry data corrupted');
    },
    test: async () => {
      console.log('\n1. Test error recovery:');
      console.log('   Send: "Show me my supplements"');
      console.log('   Expected: Assistant handles error gracefully, suggests re-adding items');
      
      await delay(2000);
      
      // Clean up
      console.log('\n2. Cleaning up corrupted data...');
      localStorage.removeItem('thriveApp_pantryItems');
    }
  },

  // Scenario 5: Test pantry specialist functions
  pantrySpecialistFunctions: {
    setup: () => {
      console.log('\n📋 Scenario 5: Pantry Specialist Functions');
      console.log('Clearing pantry for fresh start...');
      localStorage.removeItem('thriveApp_pantryItems');
    },
    test: async () => {
      console.log('\n1. Ask pantry specialist for recommendations:');
      console.log('   Send: "I\'m having trouble sleeping, what supplements do you recommend?"');
      console.log('   Expected: Pantry specialist provides supplement recommendations');
      console.log('   Should offer: Magnesium, Melatonin, etc. with buy/already have options');
      
      await delay(2000);
      
      console.log('\n2. After clicking "I already have it":');
      console.log('   Expected: Opens pantry modal to add the supplement');
      console.log('   Pantry specialist should acknowledge addition');
    }
  }
};

// Helper function to add delay
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Monitor function calls in console
function enableFunctionMonitoring() {
  console.log('\n🔍 Enabling function call monitoring...');
  
  // Override console.log to highlight function-related messages
  const originalLog = console.log;
  console.log = function(...args) {
    const message = args.join(' ');
    
    // Highlight function-related logs
    if (message.includes('[FUNCTION]') || 
        message.includes('Function call:') || 
        message.includes('Executing functions') ||
        message.includes('Function execution') ||
        message.includes('Tool outputs') ||
        message.includes('get_pantry_items') ||
        message.includes('get_thriving_progress') ||
        message.includes('get_supplement_recommendations')) {
      originalLog.apply(console, ['🔧 FUNCTION:', ...args]);
    } else if (message.includes('Assistant:') || 
               message.includes('Handoff to') ||
               message.includes('specialist')) {
      originalLog.apply(console, ['🤖 ASSISTANT:', ...args]);
    } else {
      originalLog.apply(console, args);
    }
  };
  
  console.log('✅ Function monitoring enabled');
}

// Main test runner
async function runTests() {
  console.log('🧪 Multi-Assistant Function Integration Tests');
  console.log('============================================\n');
  
  enableFunctionMonitoring();
  
  // Run each scenario
  for (const [name, scenario] of Object.entries(testScenarios)) {
    scenario.setup();
    await scenario.test();
    await delay(3000); // Pause between scenarios
  }
  
  console.log('\n✅ All test scenarios completed!');
  console.log('\n📝 Summary:');
  console.log('- Chat assistant function calls');
  console.log('- Assistant handoffs with context');
  console.log('- Multiple function execution');
  console.log('- Error handling and recovery');
  console.log('- Specialist-specific functions');
  
  console.log('\n💡 Next steps:');
  console.log('1. Open the chat interface');
  console.log('2. Run through each scenario manually');
  console.log('3. Watch the console for function execution logs');
  console.log('4. Verify assistants handle functions correctly during handoffs');
}

// Export for browser console
if (typeof window !== 'undefined') {
  window.multiAssistantTests = {
    runAll: runTests,
    scenarios: testScenarios,
    enableMonitoring: enableFunctionMonitoring,
    
    // Quick test helpers
    clearAll: () => {
      localStorage.removeItem('thriveApp_pantryItems');
      localStorage.removeItem('thriveApp_routines');
      localStorage.removeItem('thriveApp_journals');
      console.log('✅ All data cleared');
    },
    
    setupTestData: () => {
      testScenarios.handoffWithContext.setup();
      testScenarios.multipleFunctions.setup();
      console.log('✅ Test data ready');
    }
  };
  
  console.log('🧪 Multi-Assistant Test Suite Loaded!');
  console.log('Run: multiAssistantTests.runAll()');
} else {
  // Node.js execution
  runTests();
}