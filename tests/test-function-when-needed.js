const fetch = require('node-fetch');

async function testFunctionWhenNeeded() {
  console.log('🧪 Testing Function Calls When Context Is Insufficient\n');

  // Test case where basic context exists but user asks for specific details
  const testCase = {
    message: "Can you show me the full details and notes for my magnesium supplement?",
    basicContext: {
      pantryCount: 3,
      activeRoutineCount: 1,
      routineTypes: 'sleep_wellness',
      pantryItems: ['Magnesium Glycinate 400mg - Take 30 min before bed'],
      activeRoutines: [{
        name: "Evening Wind-Down",
        type: "sleep_wellness",
        steps: ["Take Magnesium 400mg", "Dim lights"]
      }]
    }
  };

  console.log('📋 Test: Request for Full Details');
  console.log(`Message: "${testCase.message}"`);
  console.log('Context: Has basic pantry info but user wants FULL details');
  console.log('Expected: Should make function call to get_pantry_items for complete info');
  console.log('─'.repeat(60));

  try {
    const response = await fetch('http://localhost:3000/api/assistant/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: testCase.message,
        threadId: null,
        basicContext: testCase.basicContext
      })
    });

    const reader = response.body;
    let buffer = '';
    let functionCalls = [];
    let content = '';
    let timeoutId;

    // Set timeout
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
                    functionCalls.push(data.function_name);
                    console.log(`\n⚡ Function called: ${data.function_name}`);
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

    console.log(`\n✅ Function calls made: ${functionCalls.length}`);
    if (functionCalls.length > 0) {
      console.log('   Functions called:', functionCalls.join(', '));
    }
    
    console.log('\n🎯 Result: The assistant should call get_pantry_items when user asks for');
    console.log('   "full details" even though basic context has some pantry info.');

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
  }

  console.log('\n✅ Test complete!');
}

// Run test
testFunctionWhenNeeded().catch(console.error);