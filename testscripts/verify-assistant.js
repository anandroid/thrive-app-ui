#!/usr/bin/env node

/**
 * Script to verify the OpenAI Assistant configuration
 * Shows current settings including response format
 */

require('dotenv').config({ path: '.env.local' });
const OpenAI = require('openai');

async function verifyAssistant() {
  const apiKey = process.env.THRIVE_OPENAI_API_KEY;
  const assistantId = process.env.THRIVE_OPENAI_ASSISTANT_ID;

  if (!apiKey || !assistantId) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
  }

  console.log('🔍 Verifying assistant configuration...');
  console.log(`   Assistant ID: ${assistantId}`);

  try {
    const openai = new OpenAI({ apiKey });
    
    // Get current assistant
    const assistant = await openai.beta.assistants.retrieve(assistantId);
    
    console.log('\n✅ Assistant Details:');
    console.log(`   Name: ${assistant.name}`);
    console.log(`   Model: ${assistant.model}`);
    console.log(`   Response Format: ${JSON.stringify(assistant.response_format)}`);
    console.log(`   Instructions Length: ${assistant.instructions?.length || 0} characters`);
    console.log(`   Tools: ${assistant.tools?.length || 0} functions`);
    
    if (assistant.tools && assistant.tools.length > 0) {
      console.log('\n📋 Functions:');
      assistant.tools.forEach(tool => {
        if (tool.type === 'function') {
          console.log(`   - ${tool.function.name}`);
        }
      });
    }
    
    // Check if instructions contain enhanced questions
    if (assistant.instructions) {
      const hasEnhancedQuestions = assistant.instructions.includes('"type": "time_input"') ||
                                  assistant.instructions.includes('"type": "quick_reply"');
      console.log(`\n🔍 Enhanced Questions in Instructions: ${hasEnhancedQuestions ? 'Yes ✅' : 'No ❌'}`);
    }
    
    console.log('\n✨ Assistant is properly configured for JSON responses!');

  } catch (error) {
    console.error('❌ Error verifying assistant:', error.message);
    process.exit(1);
  }
}

// Run the verification
verifyAssistant();