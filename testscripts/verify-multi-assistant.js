#!/usr/bin/env node

/**
 * Script to verify the Multi-Assistant Team configuration
 * Shows current settings for all three specialized assistants
 */

require('dotenv').config({ path: '.env.local' });
const OpenAI = require('openai');

async function verifyMultiAssistant() {
  const apiKey = process.env.THRIVE_OPENAI_API_KEY;
  const assistantIds = {
    chat: process.env.THRIVE_CHAT_ASSISTANT_ID,
    routine: process.env.THRIVE_ROUTINE_ASSISTANT_ID,
    pantry: process.env.THRIVE_PANTRY_ASSISTANT_ID
  };

  if (!apiKey) {
    console.error('❌ Missing THRIVE_OPENAI_API_KEY');
    process.exit(1);
  }

  // Check if all assistants are configured
  const missingAssistants = Object.entries(assistantIds)
    .filter(([role, id]) => !id)
    .map(([role]) => role);

  if (missingAssistants.length > 0) {
    console.error('❌ Missing assistant IDs for:', missingAssistants.join(', '));
    console.log('\n💡 Run this command to create the assistant team:');
    console.log('   node scripts/create-assistant-team-simple.js');
    process.exit(1);
  }

  console.log('🔍 Verifying multi-assistant team configuration...\n');

  try {
    const openai = new OpenAI({ apiKey });
    
    // Verify each assistant
    for (const [role, id] of Object.entries(assistantIds)) {
      console.log(`📋 ${role.toUpperCase()} SPECIALIST (${id}):`);
      
      try {
        const assistant = await openai.beta.assistants.retrieve(id);
        
        console.log(`   ✅ Name: ${assistant.name}`);
        console.log(`   ✅ Model: ${assistant.model}`);
        console.log(`   ✅ Response Format: ${JSON.stringify(assistant.response_format)}`);
        console.log(`   ✅ Instructions Length: ${assistant.instructions?.length || 0} characters`);
        console.log(`   ✅ Tools: ${assistant.tools?.length || 0} functions`);
        
        if (assistant.tools && assistant.tools.length > 0) {
          console.log('   📌 Functions:');
          assistant.tools.forEach(tool => {
            if (tool.type === 'function') {
              console.log(`      - ${tool.function.name}`);
            }
          });
        }
        
        // Check metadata
        if (assistant.metadata) {
          console.log(`   ✅ Metadata: ${JSON.stringify(assistant.metadata)}`);
        }
        
        console.log('');
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
      }
    }
    
    console.log('✨ Multi-assistant team verification complete!');
    console.log('\n🧪 Test the assistants with these example messages:');
    console.log('   Chat: "I have trouble sleeping"');
    console.log('   Routine: "Create a sleep routine for me"');
    console.log('   Pantry: "What supplements help with sleep?"');

  } catch (error) {
    console.error('❌ Error verifying assistants:', error.message);
    process.exit(1);
  }
}

// Run the verification
verifyMultiAssistant();