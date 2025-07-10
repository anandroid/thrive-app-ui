#!/usr/bin/env node

/**
 * Test script to verify assistant returns enhanced questions format
 */

require('dotenv').config({ path: '.env.local' });
const OpenAI = require('openai');

async function testAssistantQuestions() {
  const apiKey = process.env.THRIVE_OPENAI_API_KEY;
  const assistantId = process.env.THRIVE_OPENAI_ASSISTANT_ID;

  if (!apiKey || !assistantId) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
  }

  console.log('🧪 Testing assistant enhanced questions...\n');

  try {
    const openai = new OpenAI({ apiKey });
    
    // Create a thread
    const thread = await openai.beta.threads.create();
    console.log(`✅ Created thread: ${thread.id}`);
    
    // Send a test message
    const message = await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: 'I have trouble sleeping'
    });
    console.log('✅ Sent message: "I have trouble sleeping"\n');
    
    // Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId
    });
    console.log('⏳ Running assistant...');
    console.log(`   Run ID: ${run.id}\n`);
    
    // Wait for completion
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    while (runStatus.status !== 'completed' && runStatus.status !== 'failed') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }
    
    if (runStatus.status === 'failed') {
      console.error('❌ Run failed:', runStatus.last_error);
      process.exit(1);
    }
    
    // Get the response
    const messages = await openai.beta.threads.messages.list(thread.id);
    const assistantMessage = messages.data.find(m => m.role === 'assistant');
    
    if (assistantMessage && assistantMessage.content[0].type === 'text') {
      const response = assistantMessage.content[0].text.value;
      console.log('📝 Raw Response:\n', response.substring(0, 500) + '...\n');
      
      try {
        const parsed = JSON.parse(response);
        
        console.log('✅ Valid JSON response received\n');
        console.log('📊 Questions format check:');
        console.log(`   Questions count: ${parsed.questions?.length || 0}`);
        
        if (parsed.questions && Array.isArray(parsed.questions)) {
          if (parsed.questions.length > 0) {
            const firstQuestion = parsed.questions[0];
            console.log(`\n   First question type: ${typeof firstQuestion}`);
            
            if (typeof firstQuestion === 'string') {
              console.log('   ❌ Questions are still in string format!');
              console.log(`   Example: "${firstQuestion}"`);
            } else if (typeof firstQuestion === 'object') {
              console.log('   ✅ Questions are in enhanced object format!');
              console.log('\n   First question structure:');
              console.log(`     - id: ${firstQuestion.id}`);
              console.log(`     - type: ${firstQuestion.type}`);
              console.log(`     - prompt: ${firstQuestion.prompt}`);
              console.log(`     - userVoice: ${firstQuestion.userVoice}`);
              console.log(`     - quickOptions: ${JSON.stringify(firstQuestion.quickOptions)}`);
              
              console.log('\n   All questions:');
              parsed.questions.forEach((q, idx) => {
                console.log(`\n   Question ${idx + 1}:`);
                console.log(`     - Type: ${q.type}`);
                console.log(`     - Prompt: ${q.prompt}`);
                console.log(`     - User Voice: ${q.userVoice}`);
              });
            }
          }
        } else {
          console.log('   ❌ No questions array found');
        }
        
      } catch (e) {
        console.error('❌ Failed to parse JSON:', e.message);
      }
    }
    
    // Clean up
    try {
      await openai.beta.threads.del(thread.id);
      console.log('\n✅ Cleaned up test thread');
    } catch (e) {
      // Ignore cleanup errors
    }
    
  } catch (error) {
    console.error('❌ Error testing assistant:', error.message);
    process.exit(1);
  }
}

// Run the test
testAssistantQuestions();