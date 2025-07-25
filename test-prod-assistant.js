#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const OpenAI = require('openai');

async function testChatAssistant() {
  console.log('🧪 Testing Production Chat Assistant\n');
  
  const apiKey = process.env.THRIVE_OPENAI_API_KEY;
  const assistantId = process.env.THRIVE_CHAT_ASSISTANT_ID;
  
  console.log('📋 Configuration:');
  console.log(`   API Key: ${apiKey ? '✅ Found' : '❌ Missing'}`);
  console.log(`   Assistant ID: ${assistantId || 'Missing'}\n`);
  
  if (!apiKey || !assistantId) {
    console.error('❌ Missing required environment variables');
    return;
  }
  
  const openai = new OpenAI({ apiKey });
  
  try {
    // 1. Verify assistant exists
    console.log('1️⃣ Verifying assistant exists...');
    const assistant = await openai.beta.assistants.retrieve(assistantId);
    console.log(`   ✅ Found: ${assistant.name}`);
    console.log(`   Model: ${assistant.model}`);
    console.log(`   Response format: ${assistant.response_format?.type || 'text'}\n`);
    
    // 2. Create a thread
    console.log('2️⃣ Creating thread...');
    const thread = await openai.beta.threads.create();
    console.log(`   ✅ Thread ID: ${thread.id}\n`);
    
    // 3. Send a test message
    console.log('3️⃣ Sending test message...');
    const message = await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: 'I have trouble sleeping at night'
    });
    console.log(`   ✅ Message sent\n`);
    
    // 4. Run the assistant
    console.log('4️⃣ Running assistant...');
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId
    });
    console.log(`   Run ID: ${run.id}`);
    
    // 5. Wait for completion
    console.log('   Waiting for response...');
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    let attempts = 0;
    
    while (runStatus.status !== 'completed' && runStatus.status !== 'failed' && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      process.stdout.write(`   Status: ${runStatus.status}\\r`);
      attempts++;
    }
    
    console.log(`\\n   Final status: ${runStatus.status}\\n`);
    
    if (runStatus.status === 'failed') {
      console.error('❌ Run failed:', runStatus.last_error);
      return;
    }
    
    // 6. Get the response
    console.log('5️⃣ Getting response...');
    const messages = await openai.beta.threads.messages.list(thread.id);
    const assistantMessage = messages.data.find(m => m.role === 'assistant');
    
    if (assistantMessage) {
      console.log('   ✅ Response received:\\n');
      const content = assistantMessage.content[0].text.value;
      console.log('   Content:', content.substring(0, 200) + '...');
      
      // Try to parse as JSON if it's json_object format
      try {
        const parsed = JSON.parse(content);
        console.log('\\n   ✅ Valid JSON response');
        console.log('   Keys:', Object.keys(parsed).join(', '));
      } catch (e) {
        console.log('\\n   ℹ️  Response is not JSON');
      }
    }
    
    console.log('\\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('\\n❌ Error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testChatAssistant();