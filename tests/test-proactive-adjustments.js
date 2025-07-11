const fetch = require('node-fetch');

async function testProactiveAdjustments() {
  console.log('🧪 Testing Proactive Routine Adjustments\n');

  // Context with an existing sleep routine
  const contextWithRoutine = {
    pantryCount: 2,
    activeRoutineCount: 1,
    routineTypes: 'sleep_wellness',
    pantryItems: [
      "Melatonin 3mg - For sleep, 1 hour before bed",
      "Vitamin D3 2000IU - Morning with breakfast"
    ],
    activeRoutines: [{
      name: "Evening Wind-Down",
      type: "sleep_wellness",
      reminderTimes: ["9:00 PM"],
      steps: [
        "Dim lights (9:00 PM)",
        "Read book (9:30 PM)",
        "Sleep by 10:00 PM"
      ]
    }]
  };

  // Test cases for proactive adjustments
  const testCases = [
    {
      message: "I just bought magnesium glycinate for better sleep",
      expectedAction: "adjust_routine",
      expectedDescription: "should explain how magnesium will enhance the routine"
    },
    {
      message: "I learned that box breathing helps with relaxation",
      expectedAction: "adjust_routine",
      expectedDescription: "should suggest adding box breathing to routine"
    },
    {
      message: "My doctor recommended I take ashwagandha for stress",
      expectedAction: "adjust_routine or add_to_pantry",
      expectedDescription: "should suggest tracking and potentially adding to routine"
    },
    {
      message: "I got a white noise machine",
      expectedAction: "adjust_routine",
      expectedDescription: "should suggest integrating white noise into bedtime routine"
    }
  ];

  for (const test of testCases) {
    console.log(`\n📋 Testing: "${test.message}"`);
    console.log(`Expected: ${test.expectedAction} action`);
    console.log('─'.repeat(60));

    try {
      const response = await fetch('http://localhost:3000/api/assistant/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: test.message,
          threadId: null,
          basicContext: contextWithRoutine
        })
      });

      const reader = response.body;
      let buffer = '';
      let content = '';
      let functionCalls = 0;
      let timeoutId;

      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Timeout')), 15000);
      });

      try {
        await Promise.race([
          (async () => {
            for await (const chunk of reader) {
              buffer += chunk.toString();
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6));
                    if (data.type === 'function_call') {
                      functionCalls++;
                    } else if (data.type === 'content') {
                      content += data.content;
                    }
                  } catch (e) {}
                }
              }
            }
          })(),
          timeoutPromise
        ]);
      } catch (e) {
        // Timeout is ok
      } finally {
        clearTimeout(timeoutId);
      }

      console.log(`\nFunction calls: ${functionCalls}`);
      
      try {
        const parsed = JSON.parse(content);
        console.log(`\nGreeting: "${parsed.greeting}"`);
        
        // Check for adjust_routine action
        const adjustAction = parsed.actionableItems?.find(item => item.type === 'adjust_routine');
        const pantryAction = parsed.actionableItems?.find(item => item.type === 'add_to_pantry');
        
        if (adjustAction) {
          console.log('\n✅ Found adjust_routine action!');
          console.log(`   Title: ${adjustAction.title}`);
          console.log(`   Description: ${adjustAction.description}`);
          console.log(`   Instructions: ${adjustAction.adjustmentInstructions || 'Not provided'}`);
          
          // Check description quality
          if (adjustAction.description && adjustAction.description.length > 20) {
            console.log('   ✅ Description is meaningful and detailed');
          } else {
            console.log('   ❌ Description is too short or generic');
          }
        } else if (pantryAction && test.expectedAction.includes('add_to_pantry')) {
          console.log('\n✅ Found add_to_pantry action (alternative acceptable)');
          console.log(`   Title: ${pantryAction.title}`);
          console.log(`   Description: ${pantryAction.description}`);
        } else {
          console.log('\n❌ No adjust_routine action found');
          
          // Show what was suggested instead
          if (parsed.actionableItems && parsed.actionableItems.length > 0) {
            console.log('\n   Other actions suggested:');
            parsed.actionableItems.forEach(item => {
              console.log(`   - ${item.type}: ${item.title}`);
              if (item.description) {
                console.log(`     Description: ${item.description}`);
              }
            });
          }
        }
        
      } catch (e) {
        console.log('⚠️  Could not parse response');
        console.log(`Raw response preview: ${content.substring(0, 200)}...`);
      }

    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
  }

  console.log('\n\n🎯 Summary: Assistant should proactively suggest routine adjustments');
  console.log('when user mentions new supplements, techniques, or tools that could');
  console.log('enhance their existing routines. Descriptions should be detailed and');
  console.log('explain the specific benefits.');
}

// Run test
testProactiveAdjustments().catch(console.error);