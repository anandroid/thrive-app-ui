const fetch = require('node-fetch');

async function testAdjustRoutine() {
  console.log('🧪 Testing Adjust Routine Functionality\n');

  // Context with an existing sleep routine
  const contextWithRoutine = {
    pantryCount: 3,
    activeRoutineCount: 1,
    routineTypes: 'sleep_wellness',
    pantryItems: [
      "Magnesium Glycinate 400mg - Take 30 min before bed",
      "Melatonin 3mg - For sleep, 1 hour before bed"
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

  // Test cases for adjust routine
  const testCases = [
    {
      message: "My sleep routine isn't working, I still can't fall asleep",
      expectedAction: "adjust_routine",
      expectedInstructions: "Should suggest adding supplements or meditation"
    },
    {
      message: "Can we move my evening routine earlier? I need to wake up at 5am now",
      expectedAction: "adjust_routine", 
      expectedInstructions: "Should suggest moving all times earlier"
    },
    {
      message: "I want to add meditation to my bedtime routine",
      expectedAction: "adjust_routine",
      expectedInstructions: "Should suggest adding meditation step"
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
        timeoutId = setTimeout(() => reject(new Error('Timeout')), 10000);
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
        
        // Check for adjust_routine action
        const adjustAction = parsed.actionableItems?.find(item => item.type === 'adjust_routine');
        
        if (adjustAction) {
          console.log('✅ Found adjust_routine action!');
          console.log(`   Title: ${adjustAction.title}`);
          console.log(`   Instructions: ${adjustAction.adjustmentInstructions || adjustAction.description}`);
        } else {
          console.log('❌ No adjust_routine action found');
          
          // Check what actions were suggested instead
          if (parsed.actionableItems && parsed.actionableItems.length > 0) {
            console.log('   Other actions suggested:');
            parsed.actionableItems.forEach(item => {
              console.log(`   - ${item.type}: ${item.title}`);
            });
          }
        }
        
      } catch (e) {
        console.log('⚠️  Could not parse response');
      }

    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
  }

  console.log('\n\n🎯 Summary: Assistant should suggest adjust_routine when user');
  console.log('has existing routines and wants to modify them.');
}

// Run test
testAdjustRoutine().catch(console.error);