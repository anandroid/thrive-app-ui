#!/usr/bin/env node

/**
 * Create/update Thrive AI assistant team - Version 2
 * Uses the dynamic instruction builder and feature flags
 */

require('dotenv').config({ path: '.env.local' });
const OpenAI = require('openai');

// We need to compile TypeScript imports
const { register } = require('ts-node');
register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs',
    target: 'es2017',
    moduleResolution: 'node',
    allowJs: true,
    esModuleInterop: true
  }
});

// Now we can import TypeScript modules
const { createAssistantConfiguration, getAssistantId } = require('../src/services/openai/assistant/team/assistantManager');
const { getAssistantModeDescription } = require('../src/services/openai/assistant/team/instructionBuilder');
const { getFeatureFlags } = require('../src/config/features');

const openai = new OpenAI({
  apiKey: process.env.THRIVE_OPENAI_API_KEY,
});

const ROLES = ['chat', 'routine', 'pantry'];

async function createOrUpdateAssistant(role) {
  try {
    console.log(`\n📋 Processing ${role} assistant...`);
    
    // Get configuration
    const config = createAssistantConfiguration(role);
    const existingId = getAssistantId(role);
    
    // Log mode
    console.log(`   Mode: ${getAssistantModeDescription()}`);
    console.log(`   Functions: ${config.tools.length} tools configured`);
    
    if (existingId) {
      console.log(`   Found existing assistant: ${existingId}`);
      console.log('   Updating configuration...');
      
      const assistant = await openai.beta.assistants.update(existingId, {
        name: config.name,
        description: config.description,
        model: config.model,
        instructions: config.instructions,
        tools: config.tools,
        response_format: config.response_format,
        temperature: config.temperature,
        metadata: config.metadata
      });
      
      console.log(`   ✅ Updated: ${assistant.name}`);
      return { role, id: assistant.id, status: 'updated' };
    } else {
      console.log('   Creating new assistant...');
      
      const assistant = await openai.beta.assistants.create({
        name: config.name,
        description: config.description,
        model: config.model,
        instructions: config.instructions,
        tools: config.tools,
        response_format: config.response_format,
        temperature: config.temperature,
        metadata: config.metadata
      });
      
      console.log(`   ✅ Created: ${assistant.name}`);
      console.log(`   🆔 ID: ${assistant.id}`);
      return { role, id: assistant.id, status: 'created' };
    }
  } catch (error) {
    console.error(`   ❌ Error with ${role} assistant:`, error.message);
    return { role, error: error.message };
  }
}

async function main() {
  console.log('🚀 Thrive AI Assistant Team Setup\n');
  
  // Show feature flags
  const flags = getFeatureFlags();
  console.log('📊 Feature Flags:');
  console.log(`   Assistant Functions: ${flags.assistantFunctions ? '✅ Enabled' : '❌ Disabled'}`);
  
  // Create/update all assistants
  const results = await Promise.all(
    ROLES.map(role => createOrUpdateAssistant(role))
  );
  
  // Summary
  console.log('\n📊 Summary:');
  const created = results.filter(r => r.status === 'created');
  const updated = results.filter(r => r.status === 'updated');
  const failed = results.filter(r => r.error);
  
  if (created.length > 0) {
    console.log(`\n✨ Created ${created.length} new assistant(s):`);
    created.forEach(r => {
      console.log(`   ${r.role}: ${r.id}`);
      console.log(`   Add to .env.local: THRIVE_${r.role.toUpperCase()}_ASSISTANT_ID=${r.id}`);
    });
  }
  
  if (updated.length > 0) {
    console.log(`\n🔄 Updated ${updated.length} existing assistant(s):`);
    updated.forEach(r => {
      console.log(`   ${r.role}: ${r.id}`);
    });
  }
  
  if (failed.length > 0) {
    console.log(`\n❌ Failed ${failed.length} assistant(s):`);
    failed.forEach(r => {
      console.log(`   ${r.role}: ${r.error}`);
    });
  }
  
  console.log('\n✨ Assistant team setup complete!');
  console.log(`   Mode: ${getAssistantModeDescription()}`);
  
  if (!flags.assistantFunctions) {
    console.log('\n📝 Note: Functions are disabled. Assistants will work with basicContext only.');
    console.log('   To enable functions, set ENABLE_ASSISTANT_FUNCTIONS=true in .env.local');
  }
}

main().catch(console.error);