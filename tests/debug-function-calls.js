/**
 * Debug function calls - why aren't they working?
 */

const fetch = require('node-fetch');

async function debugFunctionCalls() {
  console.log('🔍 Debugging Function Calls\n');

  // Test 1: Without basicContext
  console.log('Test 1: WITHOUT basicContext');
  console.log('─'.repeat(50));
  
  let response = await fetch('http://localhost:3001/api/assistant/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: "What supplements do I have in my pantry?",
      threadId: null
    })
  });

  await processStream(response, 'Test 1');

  // Test 2: With basicContext showing empty pantry
  console.log('\n\nTest 2: WITH basicContext (empty pantry)');
  console.log('─'.repeat(50));
  
  response = await fetch('http://localhost:3001/api/assistant/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: "What supplements do I have?",
      threadId: null,
      basicContext: {
        pantryCount: 0,
        activeRoutineCount: 0,
        routineTypes: 'none'
      }
    })
  });

  await processStream(response, 'Test 2');

  // Test 3: Force a different assistant
  console.log('\n\nTest 3: Pantry specialist question');
  console.log('─'.repeat(50));
  
  response = await fetch('http://localhost:3001/api/assistant/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: "I need supplement recommendations for better sleep",
      threadId: null
    })
  });

  await processStream(response, 'Test 3');
}

async function processStream(response, testName) {
  const reader = response.body;
  let buffer = '';
  let functionCallDetected = false;
  let contentPreview = '';
  let role = '';

  for await (const chunk of reader) {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          
          if (data.type === 'function_call') {
            functionCallDetected = true;
            console.log(`✅ FUNCTION CALL DETECTED!`);
            console.log(`   Functions:`, data.toolCalls?.map(tc => tc.function.name));
          } else if (data.type === 'content' && data.content) {
            contentPreview += data.content;
            if (data.role) role = data.role;
          } else if (data.type === 'error') {
            console.log(`❌ Error: ${data.error}`);
          }
        } catch (e) {
          // Ignore
        }
      }
    }
  }

  if (!functionCallDetected) {
    console.log(`⚠️  No function calls detected`);
    console.log(`   Role: ${role || 'unknown'}`);
    console.log(`   Response preview: "${contentPreview.substring(0, 100)}..."`);
    
    // Try to parse JSON response
    try {
      const parsed = JSON.parse(contentPreview);
      if (parsed.greeting) {
        console.log(`   Greeting: "${parsed.greeting}"`);
      }
      if (parsed.actionableItems?.length > 0) {
        console.log(`   Actionable items: ${parsed.actionableItems.length}`);
      }
    } catch (e) {
      // Not JSON
    }
  }
}

// Run debug
debugFunctionCalls().catch(console.error);