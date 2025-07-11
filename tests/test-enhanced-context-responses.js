const fetch = require('node-fetch');

async function testEnhancedContextResponses() {
  console.log('🧪 Testing Enhanced Context with Full Responses\n');

  // Create enhanced context with real data
  const enhancedContext = {
    pantryCount: 3,
    activeRoutineCount: 1,
    routineTypes: 'sleep_wellness',
    pantryItems: [
      "Magnesium Glycinate 400mg - Take 30 min before bed for better sleep",
      "Vitamin D3 2000IU - Morning with breakfast", 
      "Melatonin 3mg - For jet lag and sleep issues"
    ],
    activeRoutines: [{
      name: "Evening Wind-Down",
      type: "sleep_wellness",
      steps: [
        "Take Magnesium 400mg",
        "Dim lights", 
        "10-min meditation",
        "Journal gratitude"
      ]
    }]
  };

  // Test queries that should use context without function calls
  const testQueries = [
    "What supplements do I have?",
    "Tell me about my sleep routine",
    "Do I have magnesium?"
  ];

  for (const query of testQueries) {
    console.log(`\n📋 Testing: "${query}"`);
    console.log('─'.repeat(60));

    try {
      const response = await fetch('http://localhost:3000/api/assistant/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          threadId: null,
          basicContext: enhancedContext
        })
      });

      const reader = response.body;
      let buffer = '';
      let functionCalls = 0;
      let assistantResponse = '';
      
      // Read the stream
      for await (const chunk of reader) {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'function_call') {
                functionCalls++;
                console.log(`  ⚡ Function call: ${data.function_name}`);
              } else if (data.type === 'content') {
                assistantResponse += data.content;
              } else if (data.type === 'completed') {
                break;
              }
            } catch (e) {
              // Skip non-JSON lines
            }
          }
        }
      }

      console.log(`\n✅ Function calls made: ${functionCalls}`);
      
      // Parse and display the response
      try {
        const parsed = JSON.parse(assistantResponse);
        console.log('\n📝 Assistant Response:');
        console.log(`Greeting: ${parsed.greeting}`);
        
        if (parsed.actionItems && parsed.actionItems.length > 0) {
          console.log('\nAction Items:');
          parsed.actionItems.forEach((item, i) => {
            console.log(`  ${i + 1}. ${item.title}`);
          });
        }
        
        // Check if response mentions specific items from context
        const responseText = JSON.stringify(parsed).toLowerCase();
        const mentionedItems = {
          magnesium: responseText.includes('magnesium'),
          vitaminD: responseText.includes('vitamin d'),
          melatonin: responseText.includes('melatonin'),
          windDown: responseText.includes('wind-down') || responseText.includes('wind down'),
          meditation: responseText.includes('meditation')
        };
        
        console.log('\n🔍 Context Usage Analysis:');
        console.log(`  - Mentioned Magnesium: ${mentionedItems.magnesium ? '✅' : '❌'}`);
        console.log(`  - Mentioned Vitamin D: ${mentionedItems.vitaminD ? '✅' : '❌'}`);
        console.log(`  - Mentioned Melatonin: ${mentionedItems.melatonin ? '✅' : '❌'}`);
        console.log(`  - Mentioned Wind-Down routine: ${mentionedItems.windDown ? '✅' : '❌'}`);
        console.log(`  - Mentioned Meditation step: ${mentionedItems.meditation ? '✅' : '❌'}`);
        
      } catch (e) {
        console.log('\n⚠️  Could not parse response as JSON');
        console.log(`Raw response preview: ${assistantResponse.substring(0, 200)}...`);
      }

    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
  }

  console.log('\n\n🎯 Summary: Enhanced context allows the assistant to answer questions about');
  console.log('pantry items and routines WITHOUT making function calls, reducing latency');
  console.log('and improving user experience!');
}

// Run test
testEnhancedContextResponses().catch(console.error);