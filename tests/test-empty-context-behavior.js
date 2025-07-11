const fetch = require('node-fetch');

async function testEmptyContextBehavior() {
  console.log('🧪 Testing Assistant Behavior with Empty Context\n');

  const tests = [
    {
      name: "Empty Pantry Query",
      message: "What supplements do I have?",
      basicContext: {
        pantryCount: 0,
        activeRoutineCount: 0,
        routineTypes: 'none'
      },
      expected: "Should skip function call and suggest buying supplements"
    },
    {
      name: "Sleep Issue with Empty Pantry",
      message: "I have trouble sleeping. What supplements can help?",
      basicContext: {
        pantryCount: 0,
        activeRoutineCount: 0,
        routineTypes: 'none'
      },
      expected: "Should recommend supplements and routine creation"
    },
    {
      name: "Routine Query with No Routines",
      message: "Show me my wellness routines",
      basicContext: {
        pantryCount: 5,
        activeRoutineCount: 0,
        routineTypes: 'none'
      },
      expected: "Should skip function call and suggest creating routines"
    }
  ];

  for (const test of tests) {
    console.log(`\n📋 Test: ${test.name}`);
    console.log(`Message: "${test.message}"`);
    console.log(`Context: ${JSON.stringify(test.basicContext)}`);
    console.log(`Expected: ${test.expected}`);
    console.log('─'.repeat(60));

    try {
      const response = await fetch('http://localhost:3000/api/assistant/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: test.message,
          threadId: null,
          basicContext: test.basicContext
        }),
        timeout: 30000 // 30 second timeout
      });

      const reader = response.body;
      let buffer = '';
      let events = [];
      let timeoutId;

      // Set a timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Response timeout')), 25000);
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
                    events.push(data);
                  } catch (e) {
                    // Ignore parse errors
                  }
                }
              }
            }
          })(),
          timeoutPromise
        ]);
      } catch (timeoutError) {
        console.log('⏱️  Response timed out after 25 seconds');
      } finally {
        clearTimeout(timeoutId);
      }

      // Analyze response
      const functionCalls = events.filter(e => e.type === 'function_call');
      const content = events.filter(e => e.type === 'content').map(e => e.content).join('');
      
      console.log(`\nResults:`);
      console.log(`- Function calls: ${functionCalls.length}`);
      
      if (functionCalls.length > 0) {
        const functions = functionCalls.flatMap(fc => 
          fc.toolCalls?.map(tc => tc.function.name) || []
        );
        console.log(`- Functions called: ${functions.join(', ')}`);
      }

      // Try to parse response
      try {
        const parsed = JSON.parse(content);
        console.log(`- Response type: Valid JSON`);
        
        if (parsed.greeting) {
          console.log(`- Greeting: "${parsed.greeting.substring(0, 50)}..."`);
        }
        
        if (parsed.actionableItems?.length > 0) {
          console.log(`- Actionable items: ${parsed.actionableItems.length}`);
          parsed.actionableItems.forEach((item, i) => {
            console.log(`  ${i + 1}. ${item.type}: ${item.title}`);
          });
        }
        
        if (parsed.actionItems?.length > 0) {
          console.log(`- Action items: ${parsed.actionItems.length}`);
        }
      } catch (e) {
        console.log(`- Response: ${content.substring(0, 100)}...`);
      }

    } catch (error) {
      console.error(`\n❌ Test failed: ${error.message}`);
    }
  }

  console.log('\n\n✅ Test complete!');
}

// Run test
testEmptyContextBehavior().catch(console.error);