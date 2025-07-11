const fetch = require('node-fetch');

async function captureFullResponse() {
  console.log('Capturing full response...\n');
  
  const response = await fetch('http://localhost:3000/api/assistant/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: "What supplements do I have?",
      threadId: null
    })
  });

  const reader = response.body;
  let buffer = '';
  let events = [];

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
          console.log('Parse error:', line);
        }
      }
    }
  }

  // Analyze events
  console.log(`Total events: ${events.length}\n`);
  
  const functionCalls = events.filter(e => e.type === 'function_call');
  const content = events.filter(e => e.type === 'content').map(e => e.content).join('');
  
  console.log(`Function calls: ${functionCalls.length}`);
  if (functionCalls.length > 0) {
    console.log('Functions called:', functionCalls[0].toolCalls?.map(tc => tc.function.name));
  }
  
  console.log(`\nFull response:`);
  console.log(content);
  
  // Try to parse as JSON
  try {
    const parsed = JSON.parse(content);
    console.log('\nParsed response:');
    console.log('- Greeting:', parsed.greeting);
    console.log('- Action items:', parsed.actionItems?.length || 0);
    console.log('- Actionable items:', parsed.actionableItems?.length || 0);
  } catch (e) {
    console.log('\nNot valid JSON');
  }
}

captureFullResponse().catch(console.error);