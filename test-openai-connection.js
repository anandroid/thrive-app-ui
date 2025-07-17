const OpenAI = require('openai');
require('dotenv').config({ path: '.env.local' });

console.log('Testing OpenAI connection...');
console.log('API Key present:', !!process.env.THRIVE_OPENAI_API_KEY);
console.log('API Key length:', process.env.THRIVE_OPENAI_API_KEY?.length);

const openai = new OpenAI({ 
  apiKey: process.env.THRIVE_OPENAI_API_KEY,
  timeout: 30000
});

async function testConnection() {
  try {
    console.log('Testing simple completion...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Say hello' }],
      max_tokens: 10
    });
    
    console.log('✅ OpenAI connection successful!');
    console.log('Response:', completion.choices[0].message.content);
    
  } catch (error) {
    console.error('❌ OpenAI connection failed:', error.message);
    if (error.status) {
      console.error('Status:', error.status);
    }
  }
}

testConnection();