const fetch = require('node-fetch');

async function testSubmitToolOutputs() {
  console.log('🧪 Testing Submit Tool Outputs Flow\n');

  // First, create a message that triggers a function call
  console.log('1️⃣ Sending message to trigger function call...');
  
  const response = await fetch('http://localhost:3000/api/assistant/stream', {
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

  const reader = response.body;
  let buffer = '';
  let functionCallData = null;
  let threadId = null;

  // Read until we get a function call
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
            functionCallData = data;
            console.log(`✓ Function call received!`);
            console.log(`  Run ID: ${data.runId}`);
            console.log(`  Functions: ${data.toolCalls?.map(tc => tc.function.name).join(', ')}`);
            break; // Stop reading after function call
          }
        } catch (e) {
          // Ignore
        }
      }
    }
    
    if (functionCallData) break;
  }

  if (!functionCallData) {
    console.log('❌ No function call received');
    return;
  }

  // Now test submitting tool outputs
  console.log('\n2️⃣ Submitting tool outputs...');
  
  const toolOutputs = functionCallData.toolCalls.map(tc => ({
    tool_call_id: tc.id,
    output: JSON.stringify({
      items: [],
      totalCount: 0,
      isEmpty: true
    })
  }));

  console.log(`  Submitting ${toolOutputs.length} outputs...`);

  const submitResponse = await fetch('http://localhost:3000/api/assistant/submit-tool-outputs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      threadId: threadId || functionCallData.threadId,
      runId: functionCallData.runId,
      toolOutputs: toolOutputs
    })
  });

  console.log(`  Submit response status: ${submitResponse.status}`);
  
  // Read the submit response
  const submitReader = submitResponse.body;
  let submitBuffer = '';
  let events = [];
  let startTime = Date.now();

  console.log('\n3️⃣ Reading submit response...');
  
  try {
    for await (const chunk of submitReader) {
      submitBuffer += chunk.toString();
      const lines = submitBuffer.split('\n');
      submitBuffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            events.push(data);
            console.log(`  Event: ${data.type}`);
            
            if (data.type === 'error') {
              console.log(`  ❌ Error: ${data.error}`);
            }
          } catch (e) {
            // Ignore
          }
        }
      }
      
      // Timeout after 10 seconds
      if (Date.now() - startTime > 10000) {
        console.log('  ⏱️  Timeout after 10 seconds');
        break;
      }
    }
  } catch (error) {
    console.log(`  ❌ Stream error: ${error.message}`);
  }

  console.log(`\n📊 Summary:`);
  console.log(`  Total events: ${events.length}`);
  console.log(`  Event types: ${[...new Set(events.map(e => e.type))].join(', ')}`);
  
  const content = events.filter(e => e.type === 'content').map(e => e.content).join('');
  if (content) {
    console.log(`  Response preview: "${content.substring(0, 100)}..."`);
  }
}

// Run test
testSubmitToolOutputs().catch(console.error);