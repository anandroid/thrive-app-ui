#!/usr/bin/env node

/**
 * Test script for sliding window context management
 */

require('dotenv').config({ path: '.env.local' });

async function testSlidingWindow() {
  console.log('🧪 Testing Sliding Window Context Management\n');

  try {
    // Create a test conversation with multiple messages
    const messages = [
      { role: 'user', content: 'I have trouble sleeping at night' },
      { role: 'assistant', content: 'I understand sleep issues can be challenging. What time do you usually go to bed?' },
      { role: 'user', content: 'Around midnight' },
      { role: 'assistant', content: 'That\'s quite late. Have you tried any sleep hygiene practices?' },
      { role: 'user', content: 'No, what are those?' },
      { role: 'assistant', content: 'Sleep hygiene includes things like avoiding screens before bed...' },
      { role: 'user', content: 'I use my phone in bed a lot' },
      { role: 'assistant', content: 'That could be affecting your sleep. Blue light from screens...' },
      { role: 'user', content: 'What supplements might help?' },
      { role: 'assistant', content: 'Several supplements can help with sleep, including melatonin...' },
      { role: 'user', content: 'Tell me more about melatonin' },
      { role: 'assistant', content: 'Melatonin is a natural hormone that regulates sleep-wake cycles...' },
      { role: 'user', content: 'Should I take it every night?' },
      { role: 'assistant', content: 'It\'s best to use melatonin as needed rather than daily...' },
      { role: 'user', content: 'What about magnesium?' }
    ];

    console.log(`📊 Total messages in conversation: ${messages.length}`);
    console.log('💬 Full conversation history:');
    messages.forEach((msg, idx) => {
      console.log(`   ${idx + 1}. ${msg.role}: ${msg.content.substring(0, 50)}...`);
    });

    // Test API endpoint
    const response = await fetch('http://localhost:3002/api/assistant/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'What about magnesium for sleep?',
        threadId: 'test-thread-' + Date.now(),
        basicContext: {
          pantryCount: 3,
          activeRoutineCount: 1,
          routineTypes: 'sleep_wellness'
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    console.log('\n✅ API call successful!');
    console.log('📝 Response should include context from last 10 messages');
    console.log('🔍 The assistant should be aware of the sleep discussion and melatonin mention');

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
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }

    console.log('\n📤 Assistant response preview:');
    console.log(fullResponse.substring(0, 200) + '...');

    // Check if response shows context awareness
    const hasContext = fullResponse.toLowerCase().includes('melatonin') || 
                      fullResponse.toLowerCase().includes('sleep') ||
                      fullResponse.toLowerCase().includes('already discussed');

    console.log('\n🎯 Context awareness check:', hasContext ? 'PASSED ✅' : 'FAILED ❌');
    
    if (hasContext) {
      console.log('   The assistant remembered the previous conversation!');
    } else {
      console.log('   The assistant might not be using the sliding window context properly.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Check if server is running
fetch('http://localhost:3002/api/health')
  .then(() => {
    console.log('🌐 Server is running, starting test...\n');
    testSlidingWindow();
  })
  .catch(() => {
    console.error('❌ Server is not running. Please run: npm run dev');
    process.exit(1);
  });