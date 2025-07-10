#!/usr/bin/env node

/**
 * Script to update the OpenAI Assistant with function calling capabilities
 * Run this script to enable real-time data access for the assistant
 */

require('dotenv').config({ path: '.env.local' });
const OpenAI = require('openai');

// Define the assistant functions
const assistantFunctions = [
  {
    type: 'function',
    function: {
      name: 'get_pantry_items',
      description: 'Get the current pantry items (supplements, medicines, foods, remedies) the user has at home',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_thriving_progress',
      description: 'Get the current progress on all active thrivings (routines and journals)',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_health_history',
      description: 'Search through journal entries and health history for specific topics or symptoms',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query (e.g., "headache", "sleep", "anxiety")'
          }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_supplement_recommendations',
      description: 'Get personalized supplement recommendations based on user health goals and conditions',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Optional category filter (e.g., "sleep", "energy", "mood", "immune")'
          }
        },
        required: []
      }
    }
  }
];

async function updateAssistant() {
  const apiKey = process.env.THRIVE_OPENAI_API_KEY;
  const assistantId = process.env.THRIVE_OPENAI_ASSISTANT_ID;

  if (!apiKey || !assistantId) {
    console.error('❌ Missing required environment variables:');
    console.error('   THRIVE_OPENAI_API_KEY and THRIVE_OPENAI_ASSISTANT_ID must be set in .env.local');
    process.exit(1);
  }

  console.log('🚀 Updating assistant with function calling capabilities...');
  console.log(`   Assistant ID: ${assistantId}`);

  try {
    const openai = new OpenAI({ apiKey });
    
    // Get current assistant
    const currentAssistant = await openai.beta.assistants.retrieve(assistantId);
    console.log(`✅ Found assistant: ${currentAssistant.name}`);

    // Read the assistant instructions from the TypeScript file
    const fs = require('fs');
    const path = require('path');
    const instructionsFile = fs.readFileSync(
      path.join(__dirname, '../src/services/openai/assistant/assistantInstructions.ts'),
      'utf8'
    );
    
    // Extract the ASSISTANT_INSTRUCTIONS constant
    const match = instructionsFile.match(/export const ASSISTANT_INSTRUCTIONS = `([^`]+)`/s);
    const ASSISTANT_INSTRUCTIONS = match ? match[1] : '';

    // Update with function calling tools and instructions
    const updatedAssistant = await openai.beta.assistants.update(assistantId, {
      tools: assistantFunctions,
      instructions: ASSISTANT_INSTRUCTIONS,
      response_format: { type: 'json_object' }
    });

    console.log('✅ Assistant updated successfully!');
    console.log('   Instructions updated: ' + (ASSISTANT_INSTRUCTIONS.length > 0 ? 'Yes' : 'No'));
    console.log('   Functions added:');
    assistantFunctions.forEach(tool => {
      console.log(`   - ${tool.function.name}: ${tool.function.description}`);
    });

    console.log('\n🎉 Your assistant can now:');
    console.log('   - Access pantry items in real-time');
    console.log('   - Check thriving progress');
    console.log('   - Search health history');
    console.log('   - Provide supplement recommendations');
    console.log('\nThe assistant will automatically use these functions when needed!');

  } catch (error) {
    console.error('❌ Error updating assistant:', error.message);
    process.exit(1);
  }
}

// Run the update
updateAssistant();