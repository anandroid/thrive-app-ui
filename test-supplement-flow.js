#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

async function testSupplementFlow() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Testing Supplement Recommendation Flow\n');
  
  // Test 1: Ask about sleep issues (should recommend supplements not in pantry)
  console.log('📤 Test 1: Asking about sleep issues...');
  
  const response = await fetch(`${baseUrl}/api/assistant/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: "I'm having trouble sleeping. What supplements can help?",
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

  // Read the stream
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
          
          if (data.type === 'thread_created') {
            threadId = data.threadId;
            console.log('  ✓ Thread created:', threadId);
          }
          
          if (data.type === 'function_call') {
            runId = data.runId;
            toolCalls = data.toolCalls;
            console.log('  ✓ Function call requested:', toolCalls[0].function.name);
          }
          
          if (data.type === 'delta') {
            finalResponse += data.content;
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }

  // If function was called, handle based on function type
  if (toolCalls) {
    const functionName = toolCalls[0].function.name;
    console.log(`\n🔧 Handling function call: ${functionName}`);
    
    let output;
    if (functionName === 'get_pantry_items') {
      // Empty pantry
      output = JSON.stringify({ items: [] });
    } else if (functionName === 'get_supplement_recommendations') {
      // Return sleep-related supplement recommendations
      output = JSON.stringify({
        recommendations: [
          {
            name: "Magnesium Glycinate",
            dosage: "200-400mg",
            timing: "30 minutes before bed",
            benefits: "Promotes muscle relaxation and better sleep quality",
            category: "minerals"
          },
          {
            name: "L-Theanine",
            dosage: "100-200mg",
            timing: "1 hour before bed",
            benefits: "Reduces anxiety and promotes calm without drowsiness",
            category: "amino acids"
          },
          {
            name: "Melatonin",
            dosage: "0.5-3mg",
            timing: "30 minutes before bed",
            benefits: "Regulates sleep-wake cycle",
            category: "hormones"
          }
        ]
      });
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
      return;
    }

    // Read the final response
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

  // Analyze the response
  console.log('\n📊 Analyzing response...');
  try {
    const parsed = JSON.parse(finalResponse);
    console.log('✅ Valid JSON response received!');
    
    // Check for buy actions
    const buyActions = parsed.actionableItems?.filter(item => item.type === 'buy') || [];
    console.log(`\n🛒 Buy recommendations: ${buyActions.length}`);
    
    buyActions.forEach((action, idx) => {
      console.log(`\n  ${idx + 1}. ${action.title}`);
      console.log(`     Product: ${action.productName || 'N/A'}`);
      console.log(`     Dosage: ${action.dosage || 'N/A'}`);
      console.log(`     Timing: ${action.timing || 'N/A'}`);
      console.log(`     Price: ${action.price_range || 'N/A'}`);
      console.log(`     Reason: ${action.reason || action.description}`);
    });
    
    // Check for add to pantry actions
    const addToPantryActions = parsed.actionableItems?.filter(item => item.type === 'add_to_pantry') || [];
    console.log(`\n📦 Add to pantry suggestions: ${addToPantryActions.length}`);
    
    // Check action items for usage instructions
    console.log(`\n💊 Action items with supplement advice: ${parsed.actionItems?.length || 0}`);
    
    if (parsed.greeting) {
      console.log(`\n💬 Assistant says: "${parsed.greeting}"`);
    }
    
  } catch (e) {
    console.log('❌ Response is not valid JSON');
    console.log('Response:', finalResponse.substring(0, 200) + '...');
  }
  
  console.log('\n✅ Test complete!');
}

testSupplementFlow().catch(console.error);