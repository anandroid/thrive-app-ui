#!/usr/bin/env node

/**
 * Test the assistant via the API endpoint
 */

async function testApiQuestions() {
  console.log('🧪 Testing assistant questions via API...\n');
  
  try {
    // Send a test message
    const response = await fetch('http://localhost:3000/api/assistant/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'I have trouble sleeping',
        threadId: null,
        chatIntent: null,
        basicContext: {
          pantryCount: 0,
          activeRoutineCount: 0,
          routineTypes: ''
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let foundQuestions = false;

    console.log('📡 Receiving stream...\n');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6);
          if (dataStr === '[DONE]') continue;
          
          try {
            const data = JSON.parse(dataStr);
            if (data.type === 'delta') {
              fullContent += data.content;
            } else if (data.type === 'completed') {
              fullContent = data.content;
              console.log('✅ Received complete response\n');
              
              // Parse and check questions
              try {
                const parsed = JSON.parse(fullContent);
                console.log('📊 Questions analysis:');
                
                if (parsed.questions && Array.isArray(parsed.questions)) {
                  console.log(`   Total questions: ${parsed.questions.length}`);
                  
                  if (parsed.questions.length > 0) {
                    const firstQ = parsed.questions[0];
                    
                    if (typeof firstQ === 'string') {
                      console.log('\n   ❌ Questions are in STRING format');
                      console.log(`   Example: "${firstQ}"`);
                      console.log('\n   All questions:');
                      parsed.questions.forEach((q, i) => {
                        console.log(`     ${i + 1}. "${q}"`);
                      });
                    } else if (typeof firstQ === 'object') {
                      console.log('\n   ✅ Questions are in ENHANCED format!');
                      console.log('\n   Questions details:');
                      parsed.questions.forEach((q, i) => {
                        console.log(`\n   ${i + 1}. ${q.prompt}`);
                        console.log(`      - ID: ${q.id}`);
                        console.log(`      - Type: ${q.type}`);
                        console.log(`      - User Voice: "${q.userVoice}"`);
                        if (q.quickOptions) {
                          console.log(`      - Quick Options: ${q.quickOptions.join(', ')}`);
                        }
                        if (q.options) {
                          console.log(`      - Options: ${q.options.join(', ')}`);
                        }
                        if (q.placeholder) {
                          console.log(`      - Placeholder: ${q.placeholder}`);
                        }
                      });
                      foundQuestions = true;
                    }
                  }
                } else {
                  console.log('   ❌ No questions found in response');
                }
                
              } catch (e) {
                console.error('❌ Failed to parse response:', e.message);
              }
            }
          } catch (e) {
            // Ignore parsing errors for incomplete chunks
          }
        }
      }
    }

    if (foundQuestions) {
      console.log('\n🎉 SUCCESS: Assistant is returning enhanced questions!');
    } else {
      console.log('\n❌ FAILED: Assistant is still returning string questions');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nMake sure the Next.js dev server is running on port 3000');
  }
}

// Run the test
testApiQuestions();