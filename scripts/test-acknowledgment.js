#!/usr/bin/env node

/**
 * Test script to verify assistants acknowledge user input
 */

require('dotenv').config({ path: '.env.local' });

async function testAcknowledgment() {
  console.log('🧪 Testing User Input Acknowledgment\n');

  const testCases = [
    {
      setup: "Have you tried any sleep supplements before?",
      userResponse: "No",
      expectedPatterns: ["understand", "haven't tried", "no supplements", "let's start"]
    },
    {
      setup: "What time do you usually go to bed?",
      userResponse: "Around midnight",
      expectedPatterns: ["midnight", "late", "12am", "understand"]
    },
    {
      setup: "How would you rate your stress level?",
      userResponse: "Very high",
      expectedPatterns: ["high stress", "very high", "stressful", "challenging"]
    },
    {
      setup: "Would you prefer morning or evening routine?",
      userResponse: "Not sure",
      expectedPatterns: ["not sure", "that's fine", "perfectly okay", "help you decide"]
    }
  ];

  for (const test of testCases) {
    console.log(`\n📝 Test Case: "${test.setup}"`);
    console.log(`👤 User responds: "${test.userResponse}"`);
    
    try {
      const response = await fetch('http://localhost:3002/api/assistant/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: test.userResponse,
          threadId: `test-ack-${Date.now()}`,
          basicContext: {
            pantryCount: 0,
            activeRoutineCount: 0,
            routineTypes: 'none'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      // Read streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'content') {
                fullResponse += data.content;
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }

      // Parse the response
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(fullResponse);
      } catch {
        console.log('❌ Response is not valid JSON');
        continue;
      }

      // Check for acknowledgment in greeting or additionalInformation
      const checkText = (parsedResponse.greeting || '') + ' ' + 
                       (parsedResponse.additionalInformation || '');
      
      const acknowledged = test.expectedPatterns.some(pattern => 
        checkText.toLowerCase().includes(pattern.toLowerCase())
      );

      if (acknowledged) {
        console.log('✅ Acknowledgment found!');
        console.log(`   Response: "${checkText.substring(0, 100)}..."`);
      } else {
        console.log('❌ No acknowledgment found');
        console.log(`   Response: "${checkText.substring(0, 100)}..."`);
      }

    } catch (error) {
      console.error('❌ Test failed:', error.message);
    }
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n\n📊 Summary:');
  console.log('The assistants should now acknowledge user input before proceeding.');
  console.log('This creates a more natural conversation flow.');
}

// Check if server is running
fetch('http://localhost:3002/api/health')
  .then(() => {
    console.log('🌐 Server is running, starting tests...\n');
    testAcknowledgment();
  })
  .catch(() => {
    console.error('❌ Server is not running. Please run: npm run dev');
    process.exit(1);
  });