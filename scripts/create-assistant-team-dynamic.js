#!/usr/bin/env node

/**
 * Create/update Thrive AI assistant team with dynamic instructions
 * This version reads feature flags and adjusts instructions accordingly
 */

require('dotenv').config({ path: '.env.local' });
const OpenAI = require('openai');
const fs = require('fs').promises;
const path = require('path');

const openai = new OpenAI({
  apiKey: process.env.THRIVE_OPENAI_API_KEY,
});

// Feature flag check
const FUNCTIONS_ENABLED = process.env.ENABLE_ASSISTANT_FUNCTIONS === 'true';

// BasicContext instructions to append when functions are disabled
const BASIC_CONTEXT_INSTRUCTIONS = `
## Working with BasicContext
You receive basicContext in conversations containing:

### basicContext structure:
- pantryItems: Array of strings describing supplements/medications
  Example: ["Magnesium 400mg - for sleep", "Vitamin D 2000IU"]
- activeRoutines: Array of routine objects with:
  - id: Unique identifier
  - name: Routine name
  - type: Routine type (sleep, stress, etc.)
  - reminderTimes: Array of reminder times
  - steps: Array of routine steps

### Guidelines
- Use the provided context to understand user's current setup
- Empty arrays mean user has no items/routines
- Make personalized recommendations based on this context
- Follow all conversation flow rules as normal`;

// Function-enabled instructions for each role
const FUNCTION_ENABLED_INSTRUCTIONS = {
  chat: `
## Available Functions
When functions are enabled, you have access to:
- get_pantry_items: Retrieve user's pantry contents
- get_thriving_progress: Check routine progress
- get_pantry_recommendations: Get personalized supplement suggestions

Use these functions when you need detailed information beyond basicContext.`,
  
  routine: `
## Available Functions
When functions are enabled, you can:
- Access detailed pantry information
- Check current routine progress
- Get personalized recommendations

Use functions to enhance routine personalization with real-time data.`,
  
  pantry: `
## Available Functions
When functions are enabled, you can:
- Get complete pantry inventory
- Check for interactions
- Access detailed supplement information

Use functions for comprehensive pantry management.`
};

// Read instructions from TypeScript files
async function getInstructions(role) {
  const filePath = path.join(__dirname, `../src/services/openai/assistant/team/${role}Assistant.ts`);
  const content = await fs.readFile(filePath, 'utf-8');
  
  // Extract the instructions
  const match = content.match(/export\s+const\s+\w*_ASSISTANT_INSTRUCTIONS\s*=\s*`([\s\S]*?)`;/);
  if (!match) {
    throw new Error(`Could not extract instructions for ${role}`);
  }
  
  let instructions = match[1];
  
  // Resolve COMMON_TEAM_INSTRUCTIONS
  if (instructions.includes('${COMMON_TEAM_INSTRUCTIONS}')) {
    const commonPath = path.join(__dirname, '../src/services/openai/assistant/team/commonInstructions.ts');
    const commonContent = await fs.readFile(commonPath, 'utf-8');
    const commonMatch = commonContent.match(/export\s+const\s+COMMON_TEAM_INSTRUCTIONS\s*=\s*`([\s\S]*?)`;/);
    if (commonMatch) {
      instructions = instructions.replace('${COMMON_TEAM_INSTRUCTIONS}', commonMatch[1]);
    }
  }
  
  // Add function-specific instructions
  if (FUNCTIONS_ENABLED) {
    instructions += FUNCTION_ENABLED_INSTRUCTIONS[role] || '';
  } else {
    instructions += BASIC_CONTEXT_INSTRUCTIONS;
  }
  
  return instructions;
}

// Get functions for a role (when enabled)
async function getFunctions(role) {
  if (!FUNCTIONS_ENABLED) {
    return [];
  }
  
  // Define functions based on role
  const functionDefinitions = {
    chat: [
      {
        name: 'get_pantry_items',
        description: 'Get all items in the user\'s pantry/medicine cabinet',
        parameters: { type: 'object', properties: {}, required: [] }
      },
      {
        name: 'get_thriving_progress',
        description: 'Get user\'s active wellness routines and their progress',
        parameters: { type: 'object', properties: {}, required: [] }
      },
      {
        name: 'get_pantry_recommendations',
        description: 'Get personalized supplement recommendations based on user\'s health goals',
        parameters: {
          type: 'object',
          properties: {
            health_goals: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of health goals or concerns'
            }
          },
          required: ['health_goals']
        }
      }
    ],
    routine: [
      {
        name: 'get_pantry_items',
        description: 'Get all items in the user\'s pantry/medicine cabinet',
        parameters: { type: 'object', properties: {}, required: [] }
      },
      {
        name: 'get_thriving_progress',
        description: 'Get user\'s active wellness routines and their progress',
        parameters: { type: 'object', properties: {}, required: [] }
      }
    ],
    pantry: [
      {
        name: 'get_pantry_items',
        description: 'Get all items in the user\'s pantry/medicine cabinet',
        parameters: { type: 'object', properties: {}, required: [] }
      },
      {
        name: 'check_interactions',
        description: 'Check for potential interactions between supplements/medications',
        parameters: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of supplements/medications to check'
            }
          },
          required: ['items']
        }
      }
    ]
  };
  
  return (functionDefinitions[role] || []).map(func => ({
    type: 'function',
    function: func
  }));
}

// Assistant configurations
const ASSISTANT_CONFIGS = {
  chat: {
    name: 'Thrive Chat Specialist',
    description: 'General wellness conversations and initial assessments',
    model: 'gpt-4.1-nano-2025-04-14',
    temperature: 0.7,
    response_format: { type: 'json_object' }
  },
  routine: {
    name: 'Thrive Routine Specialist',
    description: 'Creates and adjusts personalized wellness routines',
    model: 'gpt-4.1-nano-2025-04-14',
    temperature: 0.6,
    response_format: { type: 'json_object' }
  },
  pantry: {
    name: 'Thrive Pantry Specialist',
    description: 'Supplement recommendations and pantry management',
    model: 'gpt-4.1-nano-2025-04-14',
    temperature: 0.5,
    response_format: { type: 'json_object' }
  }
};

async function createOrUpdateAssistant(role) {
  try {
    console.log(`\n📋 Processing ${role} assistant...`);
    
    const config = ASSISTANT_CONFIGS[role];
    const existingId = process.env[`THRIVE_${role.toUpperCase()}_ASSISTANT_ID`];
    const instructions = await getInstructions(role);
    const tools = await getFunctions(role);
    
    console.log(`   Functions: ${FUNCTIONS_ENABLED ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`   Tools: ${tools.length} configured`);
    
    const assistantData = {
      name: config.name,
      description: config.description,
      model: config.model,
      instructions,
      tools,
      response_format: config.response_format,
      temperature: config.temperature,
      metadata: {
        role,
        version: '2.0',
        team: 'thrive-wellness',
        functionsEnabled: FUNCTIONS_ENABLED ? 'true' : 'false'
      }
    };
    
    if (existingId) {
      console.log(`   Found existing assistant: ${existingId}`);
      console.log('   Updating configuration...');
      
      const assistant = await openai.beta.assistants.update(existingId, assistantData);
      
      console.log(`   ✅ Updated: ${assistant.name}`);
      return { role, id: assistant.id, status: 'updated' };
    } else {
      console.log('   Creating new assistant...');
      
      const assistant = await openai.beta.assistants.create(assistantData);
      
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
  
  console.log('📊 Configuration:');
  console.log(`   Assistant Functions: ${FUNCTIONS_ENABLED ? '✅ Enabled' : '❌ Disabled'}`);
  
  const roles = ['chat', 'routine', 'pantry'];
  const results = await Promise.all(roles.map(createOrUpdateAssistant));
  
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
  
  if (!FUNCTIONS_ENABLED) {
    console.log('\n📝 Note: Functions are disabled. Assistants will work with basicContext only.');
    console.log('   To enable functions, set ENABLE_ASSISTANT_FUNCTIONS=true in .env.local');
  }
}

main().catch(console.error);