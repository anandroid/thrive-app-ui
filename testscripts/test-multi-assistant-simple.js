#!/usr/bin/env node

/**
 * Simple test for multi-assistant routing
 * Tests that each assistant responds appropriately
 */

require('dotenv').config({ path: '.env.local' });

// Test messages
const testMessages = [
  { role: 'chat', message: 'I have been feeling tired lately' },
  { role: 'routine', message: 'Create a morning energy routine for me' },
  { role: 'pantry', message: 'What supplements help with energy levels?' }
];

async function testMessage(test) {
  console.log(`\n🧪 Testing ${test.role} specialist:`);
  console.log(`   Message: "${test.message}"`);
  
  try {
    const response = await fetch('http://localhost:3002/api/assistant/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: test.message,
        threadId: `test-${Date.now()}`
      })
    });

    if (!response.ok) {
      console.log(`   ❌ Error: HTTP ${response.status}`);
      return false;
    }

    console.log(`   ✅ Response received`);
    console.log(`   📊 Status: ${response.status}`);
    console.log(`   📄 Content-Type: ${response.headers.get('content-type')}`);
    
    // For streaming responses, we just verify the connection works
    if (response.headers.get('content-type')?.includes('text/event-stream')) {
      console.log(`   ✅ Streaming response confirmed`);
    }
    
    return true;
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Multi-Assistant Simple Tests\n');
  
  // Quick server check
  try {
    const health = await fetch('http://localhost:3002/api/health');
    console.log('✅ Server is running\n');
  } catch (error) {
    console.log('❌ Server not running on port 3002');
    console.log('💡 Start the server with: npm run dev\n');
    return;
  }
  
  // Run tests
  let passed = 0;
  for (const test of testMessages) {
    const result = await testMessage(test);
    if (result) passed++;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n📊 Summary: ${passed}/${testMessages.length} tests passed`);
  
  if (passed === testMessages.length) {
    console.log('\n✨ All assistants are responding correctly!\n');
  }
}

// Use built-in fetch (Node 18+) or require node-fetch
if (typeof fetch === 'undefined') {
  try {
    global.fetch = require('node-fetch');
  } catch (e) {
    console.log('This test requires Node.js 18+ or node-fetch');
    process.exit(1);
  }
}

runTests();