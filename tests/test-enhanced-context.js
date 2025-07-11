const fetch = require('node-fetch');

async function testEnhancedContext() {
  console.log('🧪 Testing Enhanced Basic Context\n');

  // First, let's set up some test data
  const testData = {
    pantryItems: [
      { name: "Magnesium Glycinate", dosage: "400mg", notes: "Take 30 min before bed for better sleep" },
      { name: "Vitamin D3", dosage: "2000IU", notes: "Morning with breakfast" },
      { name: "Melatonin", dosage: "3mg", notes: "For jet lag and sleep issues" }
    ],
    routines: [
      {
        name: "Evening Wind-Down",
        type: "sleep_wellness",
        isActive: true,
        steps: [
          { title: "Take Magnesium 400mg", description: "30 minutes before bed" },
          { title: "Dim lights", description: "Create calming atmosphere" },
          { title: "10-min meditation", description: "Use calm app" },
          { title: "Journal gratitude", description: "Write 3 things" }
        ]
      }
    ]
  };

  // Create enhanced context
  const enhancedContext = {
    pantryCount: testData.pantryItems.length,
    activeRoutineCount: 1,
    routineTypes: 'sleep_wellness',
    pantryItems: testData.pantryItems.map(item => {
      let formatted = item.name;
      if (item.dosage) formatted += ` ${item.dosage}`;
      if (item.notes) formatted += ` - ${item.notes.substring(0, 30)}`;
      return formatted;
    }),
    activeRoutines: testData.routines.map(routine => ({
      name: routine.name,
      type: routine.type,
      steps: routine.steps.map(step => step.title)
    }))
  };

  console.log('Enhanced Context:', JSON.stringify(enhancedContext, null, 2));

  // Test queries that should now work without function calls
  const testQueries = [
    {
      message: "What supplements do I have?",
      expected: "Should list supplements from context without function call"
    },
    {
      message: "What's in my evening routine?",
      expected: "Should describe routine steps from context"
    },
    {
      message: "Do I have magnesium?",
      expected: "Should confirm from context data"
    }
  ];

  for (const test of testQueries) {
    console.log(`\n📋 Testing: "${test.message}"`);
    console.log(`Expected: ${test.expected}`);
    console.log('─'.repeat(50));

    try {
      const response = await fetch('http://localhost:3000/api/assistant/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: test.message,
          threadId: null,
          basicContext: enhancedContext
        })
      });

      const reader = response.body;
      let buffer = '';
      let functionCalls = 0;
      let content = '';
      let timeoutId;

      // Set timeout
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Timeout')), 15000);
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
                      functionCalls++;
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

      console.log(`Function calls: ${functionCalls}`);
      
      try {
        const parsed = JSON.parse(content);
        console.log(`Response: "${parsed.greeting || content.substring(0, 100)}..."`);
        
        // Check if it used context
        const mentionedMagnesium = content.toLowerCase().includes('magnesium');
        const mentionedVitaminD = content.toLowerCase().includes('vitamin d');
        const mentionedRoutine = content.toLowerCase().includes('evening wind-down');
        
        console.log(`Used context data: ${mentionedMagnesium || mentionedVitaminD || mentionedRoutine ? 'YES' : 'NO'}`);
      } catch (e) {
        console.log(`Response preview: "${content.substring(0, 100)}..."`);
      }

    } catch (error) {
      console.error(`Error: ${error.message}`);
    }
  }

  console.log('\n✅ Test complete!');
}

// Run test
testEnhancedContext().catch(console.error);