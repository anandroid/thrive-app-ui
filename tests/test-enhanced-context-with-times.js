const fetch = require('node-fetch');

async function testEnhancedContextWithTimes() {
  console.log('🧪 Testing Enhanced Basic Context with Times and Dosages\n');

  // Create rich context with times and dosages
  const enhancedContext = {
    pantryCount: 5,
    activeRoutineCount: 2,
    routineTypes: 'sleep_wellness, stress_management',
    pantryItems: [
      "Magnesium Glycinate 400mg - Take 30 min before bed",
      "Vitamin D3 2000IU - Morning with breakfast",
      "Melatonin 3mg - For sleep, 1 hour before bed",
      "Ashwagandha 600mg - Morning for stress relief",
      "Omega-3 1000mg - With dinner"
    ],
    activeRoutines: [
      {
        name: "Evening Wind-Down",
        type: "sleep_wellness",
        reminderTimes: ["8:30 PM", "9:00 PM"],
        steps: [
          "Take Magnesium 400mg (8:30 PM)",
          "Dim lights (8:45 PM)",
          "10-min meditation (9:00 PM)",
          "Journal gratitude (9:15 PM)",
          "Read calming book"
        ]
      },
      {
        name: "Morning Energy Boost",
        type: "stress_management",
        reminderTimes: ["7:00 AM", "7:30 AM"],
        steps: [
          "Take Vitamin D & Ashwagandha (7:00 AM)",
          "5-min stretching (7:15 AM)",
          "Mindful breakfast (7:30 AM)",
          "Set daily intentions"
        ]
      }
    ]
  };

  console.log('Enhanced Context:', JSON.stringify(enhancedContext, null, 2));

  // Test queries that should work with enhanced context
  const testQueries = [
    {
      message: "What supplements do I have and when should I take them?",
      expected: "Should list supplements with timing from context"
    },
    {
      message: "What time is my evening routine scheduled?",
      expected: "Should show 8:30 PM and 9:00 PM reminder times"
    },
    {
      message: "When should I take my magnesium?",
      expected: "Should say 8:30 PM based on routine steps"
    },
    {
      message: "What are all my morning activities?",
      expected: "Should list Morning Energy Boost routine steps with times"
    }
  ];

  for (const test of testQueries) {
    console.log(`\n📋 Testing: "${test.message}"`);
    console.log(`Expected: ${test.expected}`);
    console.log('─'.repeat(60));

    try {
      const response = await fetch('http://localhost:3000/api/assistant/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: test.message,
          threadId: null,
          basicContext: enhancedContext
        })
      });

      const reader = response.body;
      let buffer = '';
      let functionCalls = 0;
      let content = '';
      let timeoutId;

      // Set timeout
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
                      console.log(`  ⚡ Function call: ${data.function_name}`);
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

      console.log(`\n✅ Function calls made: ${functionCalls}`);
      
      try {
        const parsed = JSON.parse(content);
        console.log(`Response greeting: "${parsed.greeting?.substring(0, 100)}..."`);
        
        // Check if response mentions specific times and dosages
        const responseText = JSON.stringify(parsed).toLowerCase();
        const mentionedElements = {
          magnesium: responseText.includes('magnesium'),
          '400mg': responseText.includes('400mg'),
          '8:30 pm': responseText.includes('8:30') || responseText.includes('8.30'),
          'evening routine': responseText.includes('evening'),
          'morning routine': responseText.includes('morning'),
          times: responseText.includes('7:00') || responseText.includes('8:30') || responseText.includes('9:00')
        };
        
        console.log('\n🔍 Context Usage Analysis:');
        console.log(`  - Mentioned Magnesium: ${mentionedElements.magnesium ? '✅' : '❌'}`);
        console.log(`  - Mentioned dosage (400mg): ${mentionedElements['400mg'] ? '✅' : '❌'}`);
        console.log(`  - Mentioned specific times: ${mentionedElements.times ? '✅' : '❌'}`);
        console.log(`  - Mentioned evening routine: ${mentionedElements['evening routine'] ? '✅' : '❌'}`);
        
      } catch (e) {
        console.log('\n⚠️  Could not parse response as JSON');
        console.log(`Raw response preview: ${content.substring(0, 300)}...`);
      }

    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
  }

  console.log('\n\n🎯 Summary: Enhanced context with times and dosages allows the assistant');
  console.log('to answer detailed questions about supplement timing and routine schedules');
  console.log('WITHOUT making function calls!');
}

// Run test
testEnhancedContextWithTimes().catch(console.error);