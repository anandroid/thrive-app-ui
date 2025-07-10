#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

async function testPantryCheckFlow() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Testing Pantry Check and Supplement Recommendation Flow\n');
  
  // First check what's in pantry, then recommend based on what's missing
  console.log('📤 Asking about sleep supplements and checking pantry...');
  
  const response = await fetch(`${baseUrl}/api/assistant/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: "I'm having trouble sleeping. Do I have any supplements in my pantry that can help? If not, what should I buy?",
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
  let finalResponse = '';
  let functionCallCount = 0;

  // Read the stream
  console.log('\n📥 Reading initial stream...');
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
          
          if (data.type === 'thread_created') {
            threadId = data.threadId;
            console.log('  ✓ Thread created:', threadId);
          }
          
          if (data.type === 'function_call') {
            runId = data.runId;
            toolCalls = data.toolCalls;
            functionCallCount++;
            console.log(`  ✓ Function call #${functionCallCount} requested:`, toolCalls[0].function.name);
          }
          
          if (data.type === 'delta' && !toolCalls) {
            finalResponse += data.content;
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }

  // Handle multiple function calls
  while (toolCalls) {
    const functionName = toolCalls[0].function.name;
    console.log(`\n🔧 Handling function: ${functionName}`);
    
    let output;
    if (functionName === 'get_pantry_items') {
      // Return pantry with only Vitamin D
      output = JSON.stringify({ 
        items: [
          {
            id: "1",
            name: "Vitamin D3",
            notes: "1000 IU tablets",
            tags: ["vitamins", "supplements"]
          }
        ] 
      });
      console.log('  → Returning pantry with Vitamin D only');
    } else {
      output = JSON.stringify({});
    }
    
    const toolOutputs = [{
      tool_call_id: toolCalls[0].id,
      output: output
    }];
    
    const submitResponse = await fetch(`${baseUrl}/api/assistant/submit-tool-outputs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threadId, runId, toolOutputs })
    });

    if (!submitResponse.ok) {
      console.error('❌ Failed to submit results:', submitResponse.status);
      break;
    }

    // Reset for next potential function call
    toolCalls = null;
    runId = null;
    
    // Read the response
    const submitReader = submitResponse.body.getReader();
    finalResponse = '';
    
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
            
            if (data.type === 'function_call') {
              runId = data.runId;
              toolCalls = data.toolCalls;
              functionCallCount++;
              console.log(`  ✓ Function call #${functionCallCount} requested:`, toolCalls[0].function.name);
            }
            
            if (data.type === 'delta') {
              finalResponse += data.content;
            }
          } catch (e) {
            // Ignore
          }
        }
      }
    }
  }

  // Analyze the final response
  console.log('\n📊 Analyzing final response...');
  try {
    const parsed = JSON.parse(finalResponse);
    console.log('✅ Valid JSON response received!');
    
    // Check for buy actions
    const buyActions = parsed.actionableItems?.filter(item => item.type === 'buy') || [];
    console.log(`\n🛒 Buy recommendations: ${buyActions.length}`);
    
    buyActions.forEach((action, idx) => {
      console.log(`\n  ${idx + 1}. ${action.title}`);
      console.log(`     Product: ${action.productName || 'N/A'}`);
      console.log(`     Search: ${action.searchQuery || 'N/A'}`);
      console.log(`     Dosage: ${action.dosage || 'N/A'}`);
      console.log(`     Timing: ${action.timing || 'N/A'}`);
      console.log(`     Price: ${action.price_range || 'N/A'}`);
      console.log(`     Reason: ${action.reason || action.description}`);
    });
    
    // Check for add to pantry actions
    const addToPantryActions = parsed.actionableItems?.filter(item => item.type === 'add_to_pantry') || [];
    console.log(`\n📦 Add to pantry suggestions: ${addToPantryActions.length}`);
    
    addToPantryActions.forEach((action, idx) => {
      console.log(`\n  ${idx + 1}. ${action.title}`);
      console.log(`     Notes: ${action.suggestedNotes || 'N/A'}`);
    });
    
    // Check action items for usage instructions
    console.log(`\n💊 Action items with supplement advice: ${parsed.actionItems?.length || 0}`);
    parsed.actionItems?.forEach((item, idx) => {
      if (item.title.toLowerCase().includes('vitamin') || 
          item.title.toLowerCase().includes('magnesium') ||
          item.title.toLowerCase().includes('melatonin')) {
        console.log(`\n  ${idx + 1}. ${item.title}`);
      }
    });
    
    if (parsed.greeting) {
      console.log(`\n💬 Assistant says: "${parsed.greeting}"`);
    }
    
  } catch (e) {
    console.log('❌ Response is not valid JSON');
    console.log('Response preview:', finalResponse.substring(0, 300) + '...');
  }
  
  console.log('\n✅ Test complete!');
}

testPantryCheckFlow().catch(console.error);