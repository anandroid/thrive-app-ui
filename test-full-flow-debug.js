#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

async function testFullFlow() {
  // Use port 3000
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Testing Full Flow on port 3000\n');
  
  // Step 1: Test health endpoint
  try {
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    console.log('✅ Health check:', healthResponse.status === 200 ? 'OK' : 'FAILED');
  } catch (e) {
    console.error('❌ Server not responding on port 3000:', e.message);
    return;
  }
  
  // Step 2: Send a message that triggers function call
  console.log('\n📤 Sending message: "What supplements do I have in my pantry?"');
  
  const response = await fetch(`${baseUrl}/api/assistant/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: "What supplements do I have in my pantry?",
      threadId: null,
      chatIntent: null
    })
  });

  if (!response.ok) {
    console.error('❌ Failed to send message:', response.status);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  
  let threadId = null;
  let runId = null;
  let toolCalls = null;
  let events = [];

  // Read initial stream
  console.log('\n📥 Reading stream...');
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const dataStr = line.slice(6);
        if (dataStr === '[DONE]') break;
        
        try {
          const data = JSON.parse(dataStr);
          events.push(data);
          
          if (data.type === 'thread_created') {
            threadId = data.threadId;
            console.log('  ✓ Thread created:', threadId);
          }
          
          if (data.type === 'function_call') {
            runId = data.runId;
            toolCalls = data.toolCalls;
            console.log('  ✓ Function call requested:', toolCalls[0].function.name);
          }
          
          if (data.type === 'awaiting_function_results') {
            console.log('  ✓ Awaiting function results');
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }

  if (!toolCalls) {
    console.error('\n❌ No function call was triggered!');
    console.log('Events received:', events.map(e => e.type).join(', '));
    return;
  }

  // Step 3: Execute function locally (simulate browser)
  console.log('\n🔧 Simulating browser function execution...');
  const toolOutputs = [{
    tool_call_id: toolCalls[0].id,
    output: JSON.stringify({
      items: [
        { name: "Vitamin D", category: "vitamins", notes: "2000 IU daily" },
        { name: "Magnesium", category: "minerals", notes: "For sleep and relaxation" },
        { name: "Omega-3", category: "supplements", notes: "Fish oil capsules" }
      ]
    })
  }];
  console.log('  ✓ Function result prepared');

  // Step 4: Submit results back
  console.log('\n📤 Submitting function results...');
  const submitPayload = { threadId, runId, toolOutputs };
  console.log('  Payload:', JSON.stringify(submitPayload, null, 2));
  
  const submitResponse = await fetch(`${baseUrl}/api/assistant/submit-tool-outputs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(submitPayload)
  });

  if (!submitResponse.ok) {
    console.error('❌ Failed to submit results:', submitResponse.status);
    const error = await submitResponse.text();
    console.error('Error:', error);
    return;
  }

  // Step 5: Read the assistant's response
  console.log('\n📥 Reading assistant response...');
  const submitReader = submitResponse.body.getReader();
  let assistantResponse = '';
  let submitEvents = [];
  
  while (true) {
    const { done, value } = await submitReader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const dataStr = line.slice(6);
        try {
          const data = JSON.parse(dataStr);
          submitEvents.push(data.type);
          
          if (data.type === 'delta') {
            assistantResponse += data.content;
            process.stdout.write('.');
          }
          if (data.type === 'completed') {
            console.log('\n  ✓ Response completed');
          }
        } catch (e) {
          // Ignore
        }
      }
    }
  }

  console.log(`\n  Events: ${submitEvents.join(', ')}`);
  console.log(`  Response length: ${assistantResponse.length} characters`);

  // Step 6: Analyze response
  if (assistantResponse) {
    try {
      const parsed = JSON.parse(assistantResponse);
      console.log('\n✅ Valid JSON response received!');
      console.log('  - Has greeting:', !!parsed.greeting);
      console.log('  - Has action items:', Array.isArray(parsed.actionItems));
      console.log('  - Has questions:', Array.isArray(parsed.questions));
      
      if (parsed.greeting) {
        console.log(`\n💬 Assistant says: "${parsed.greeting}"`);
      }
    } catch (e) {
      console.log('\n❌ Response is not valid JSON');
      console.log('Response:', assistantResponse.substring(0, 200) + '...');
    }
  } else {
    console.log('\n❌ No response received from assistant');
  }
  
  console.log('\n✅ Test complete!');
}

testFullFlow().catch(console.error);