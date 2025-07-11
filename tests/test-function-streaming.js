/**
 * Test function calls with streaming response
 */

const fetch = require('node-fetch');

async function testFunctionCalls() {
  console.log('🧪 Testing Function Calls with Streaming\n');

  const messages = [
    {
      text: "What supplements do I have?",
      expectedFunction: "get_pantry_items"
    },
    {
      text: "Show me my wellness routines",
      expectedFunction: "get_thriving_progress"
    },
    {
      text: "I have trouble sleeping. What supplements can help and what do I have?",
      expectedFunction: ["get_pantry_items", "get_supplement_recommendations"]
    }
  ];

  for (const test of messages) {
    console.log(`\n📤 Sending: "${test.text}"`);
    console.log('─'.repeat(50));

    try {
      const response = await fetch('http://localhost:3001/api/assistant/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: test.text, threadId: null })
      });

      const reader = response.body;
      let buffer = '';
      let functionCalls = [];
      let contentChunks = [];
      let threadId = null;

      for await (const chunk of reader) {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'thread_created') {
                threadId = data.threadId;
                console.log(`✓ Thread created: ${threadId}`);
              } else if (data.type === 'function_call') {
                console.log(`🔧 Function call detected!`);
                console.log(`   Run ID: ${data.runId}`);
                console.log(`   Functions:`, data.toolCalls?.map(tc => tc.function.name));
                functionCalls.push(data);
              } else if (data.type === 'content') {
                contentChunks.push(data.content);
              } else if (data.type === 'error') {
                console.error(`❌ Error: ${data.error}`);
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }

      // Check results
      if (functionCalls.length > 0) {
        console.log(`\n✅ Function calls made: ${functionCalls.length}`);
        const calledFunctions = functionCalls.flatMap(fc => 
          fc.toolCalls?.map(tc => tc.function.name) || []
        );
        
        const expected = Array.isArray(test.expectedFunction) 
          ? test.expectedFunction 
          : [test.expectedFunction];
        
        const matched = expected.every(ef => calledFunctions.includes(ef));
        console.log(`   Expected: ${expected.join(', ')}`);
        console.log(`   Called: ${calledFunctions.join(', ')}`);
        console.log(`   Match: ${matched ? '✅' : '❌'}`);
      } else {
        console.log(`\n⚠️  No function calls detected`);
        console.log(`   Response preview: ${contentChunks.slice(0, 10).join('')}...`);
      }

    } catch (error) {
      console.error(`\n❌ Test failed: ${error.message}`);
    }
  }

  console.log('\n✅ Test complete!');
}

// Run test
testFunctionCalls().catch(console.error);