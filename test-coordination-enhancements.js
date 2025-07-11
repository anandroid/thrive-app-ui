/**
 * Test script to verify assistant coordination enhancements
 * Tests that supplements are recommended before routines and context is properly shared
 */

const testScenarios = {
  // Test 1: Verify supplement-first protocol
  supplementFirstProtocol: {
    description: 'Chat assistant should recommend supplements BEFORE suggesting routine creation',
    userMessage: 'I have trouble sleeping at night',
    expectedBehavior: {
      supplements: ['Magnesium', 'Melatonin', 'L-Theanine'],
      order: 'Supplements should appear in actionableItems BEFORE routine suggestion',
      routineDescription: 'Should mention "including your supplements" or similar'
    },
    validate: (response) => {
      try {
        const data = JSON.parse(response.content);
        const actionableItems = data.actionableItems || [];
        
        // Find first supplement and first routine
        let firstSupplementIndex = -1;
        let firstRoutineIndex = -1;
        
        actionableItems.forEach((item, index) => {
          if (item.type === 'supplement_choice' && firstSupplementIndex === -1) {
            firstSupplementIndex = index;
          }
          if ((item.type === 'thriving' || item.type === 'routine') && firstRoutineIndex === -1) {
            firstRoutineIndex = index;
          }
        });
        
        console.log(`✓ Found supplement at index: ${firstSupplementIndex}`);
        console.log(`✓ Found routine at index: ${firstRoutineIndex}`);
        
        if (firstSupplementIndex !== -1 && firstRoutineIndex !== -1) {
          if (firstSupplementIndex < firstRoutineIndex) {
            console.log('✅ PASS: Supplements appear before routine suggestion');
            return true;
          } else {
            console.log('❌ FAIL: Routine appears before supplements');
            return false;
          }
        } else {
          console.log('⚠️  Missing supplements or routine in response');
          return false;
        }
      } catch (e) {
        console.error('Error parsing response:', e);
        return false;
      }
    }
  },

  // Test 2: Verify context sharing for routines
  contextSharingTest: {
    description: 'Routine creation should include context from chat conversation',
    setupMessage: 'I take magnesium glycinate 400mg and have shoulder pain from working at my desk all day',
    routineRequest: 'Create a routine for my shoulder pain',
    expectedContext: {
      supplements: 'Magnesium Glycinate 400mg',
      specificIssue: 'shoulder pain',
      lifestyle: 'desk work'
    },
    validate: (conversationContext) => {
      const hasSupplementMention = conversationContext.includes('Magnesium') || 
                                  conversationContext.includes('400mg');
      const hasShoulderMention = conversationContext.includes('shoulder');
      const hasDeskMention = conversationContext.includes('desk');
      
      console.log(`✓ Supplement context: ${hasSupplementMention ? 'YES' : 'NO'}`);
      console.log(`✓ Shoulder pain context: ${hasShoulderMention ? 'YES' : 'NO'}`);
      console.log(`✓ Desk work context: ${hasDeskMention ? 'YES' : 'NO'}`);
      
      const passed = hasSupplementMention && hasShoulderMention && hasDeskMention;
      console.log(passed ? '✅ PASS: All context captured' : '❌ FAIL: Missing context');
      return passed;
    }
  },

  // Test 3: Pain intensity for journeys
  painIntensityTest: {
    description: 'Pain management journey should show intensity slider',
    userMessage: 'I want to track my chronic back pain',
    expectedBehavior: {
      journeyType: 'pain_journey',
      hasIntensitySlider: true,
      sliderRange: '0-10'
    },
    validateUI: () => {
      // This would be tested in the actual UI
      console.log('⚠️  UI test - check JourneyCreationModal for pain intensity slider');
      console.log('   - Should show 0-10 scale');
      console.log('   - Gradient from green to red');
      console.log('   - Current intensity display');
      return 'manual';
    }
  },

  // Test 4: No generic routines
  noGenericRoutinesTest: {
    description: 'Routines should be highly personalized, not generic',
    specificRequest: 'I have fibromyalgia and need a gentle morning routine',
    expectedBehavior: {
      shouldInclude: ['fibromyalgia-specific', 'gentle movements', 'pacing strategies'],
      shouldNotInclude: ['generic stretches', 'standard exercises', 'one-size-fits-all']
    },
    validate: (routineContent) => {
      const hasSpecificCondition = routineContent.includes('fibromyalgia');
      const hasGenericContent = routineContent.includes('generic') || 
                               routineContent.includes('standard routine');
      
      console.log(`✓ Condition-specific: ${hasSpecificCondition ? 'YES' : 'NO'}`);
      console.log(`✓ Generic content: ${hasGenericContent ? 'YES (BAD)' : 'NO (GOOD)'}`);
      
      const passed = hasSpecificCondition && !hasGenericContent;
      console.log(passed ? '✅ PASS: Personalized routine' : '❌ FAIL: Too generic');
      return passed;
    }
  }
};

// Helper function to display test instructions
function displayTestInstructions() {
  console.log('🧪 Assistant Coordination Enhancement Tests');
  console.log('==========================================\n');
  
  console.log('These tests verify the recent enhancements:');
  console.log('1. Supplement-first protocol');
  console.log('2. Context sharing between assistants');
  console.log('3. Pain intensity slider for journeys');
  console.log('4. No generic routines policy\n');
  
  console.log('📋 Manual Test Steps:\n');
  
  Object.entries(testScenarios).forEach(([key, scenario], index) => {
    console.log(`Test ${index + 1}: ${scenario.description}`);
    console.log(`--------`);
    
    if (scenario.userMessage) {
      console.log(`1. Send message: "${scenario.userMessage}"`);
    }
    if (scenario.setupMessage) {
      console.log(`1. Setup: Send "${scenario.setupMessage}"`);
      console.log(`2. Then: "${scenario.routineRequest}"`);
    }
    if (scenario.specificRequest) {
      console.log(`1. Send specific request: "${scenario.specificRequest}"`);
    }
    
    console.log(`2. Expected behavior:`);
    Object.entries(scenario.expectedBehavior || scenario.expectedContext || {}).forEach(([key, value]) => {
      console.log(`   - ${key}: ${JSON.stringify(value)}`);
    });
    
    console.log('\n');
  });
  
  console.log('🔍 Validation Functions Available:');
  console.log('- testEnhancements.validateSupplementFirst(responseJson)');
  console.log('- testEnhancements.validateContext(conversationContext)');
  console.log('- testEnhancements.validateNoGeneric(routineContent)\n');
}

// Export test functions for browser console
if (typeof window !== 'undefined') {
  window.testEnhancements = {
    scenarios: testScenarios,
    showInstructions: displayTestInstructions,
    
    // Quick validation functions
    validateSupplementFirst: (responseJson) => {
      return testScenarios.supplementFirstProtocol.validate({ content: JSON.stringify(responseJson) });
    },
    
    validateContext: (conversationContext) => {
      return testScenarios.contextSharingTest.validate(conversationContext);
    },
    
    validateNoGeneric: (routineContent) => {
      return testScenarios.noGenericRoutinesTest.validate(routineContent);
    },
    
    // Run all tests
    runAll: () => {
      console.log('🚀 Running all enhancement tests...\n');
      displayTestInstructions();
      console.log('\n⚠️  Note: These are manual tests. Follow the instructions above and use the validation functions.');
    }
  };
  
  console.log('✅ Enhancement Test Suite Loaded!');
  console.log('Run: testEnhancements.runAll()');
  console.log('Or: testEnhancements.showInstructions()');
} else {
  // Node.js execution
  displayTestInstructions();
}