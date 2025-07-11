#!/usr/bin/env node

/**
 * Update existing assistants with function tools
 */

const OpenAI = require('openai');
require('dotenv').config({ path: '.env.local' });

const openai = new OpenAI({
  apiKey: process.env.THRIVE_OPENAI_API_KEY,
});

// Function definitions from sharedFunctions.ts
const SHARED_FUNCTIONS = [
  {
    name: 'get_pantry_items',
    description: 'Get the current pantry items (supplements, medicines, foods, remedies) the user has at home',
    parameters: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['all', 'supplements', 'medicines', 'foods', 'remedies'],
          description: 'Filter items by category'
        }
      }
    }
  },
  {
    name: 'get_thriving_progress',
    description: 'Get the current progress on all active thrivings (routines and journals)',
    parameters: {
      type: 'object',
      properties: {
        thriving_type: {
          type: 'string',
          enum: ['all', 'sleep_wellness', 'stress_management', 'pain_management', 'mental_wellness', 'nutrition', 'exercise', 'general_wellness', 'medication_management'],
          description: 'Filter by thriving type'
        },
        include_inactive: {
          type: 'boolean',
          description: 'Include inactive thrivings',
          default: false
        }
      }
    }
  },
  {
    name: 'search_health_history',
    description: 'Search through journal entries and health history for specific topics or symptoms',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query for health history'
        },
        days_back: {
          type: 'number',
          description: 'Number of days to search back',
          default: 30
        },
        entry_type: {
          type: 'string',
          enum: ['all', 'journal', 'check_in', 'notes'],
          description: 'Type of entries to search'
        }
      },
      required: ['query']
    }
  }
];

// Pantry specialist gets an additional function
const PANTRY_FUNCTIONS = [
  ...SHARED_FUNCTIONS,
  {
    name: 'get_supplement_recommendations',
    description: 'Get personalized supplement recommendations based on health concerns',
    parameters: {
      type: 'object',
      properties: {
        health_concern: {
          type: 'string',
          description: 'The health concern to address (e.g., sleep, anxiety, pain)'
        },
        category: {
          type: 'string',
          enum: ['vitamins', 'minerals', 'herbs', 'amino_acids', 'probiotics', 'all'],
          description: 'Category of supplements to recommend'
        },
        budget: {
          type: 'string',
          enum: ['budget', 'moderate', 'premium'],
          description: 'Budget range for recommendations'
        }
      },
      required: ['health_concern']
    }
  }
];

async function updateAssistants() {
  console.log('🔧 Updating Assistants with Functions\n');

  try {
    // List all assistants
    const assistants = await openai.beta.assistants.list({ limit: 100 });
    
    // Find Thrive assistants
    const thriveAssistants = assistants.data.filter(a => 
      a.name.includes('Thrive') && a.metadata?.team === 'thrive-wellness'
    );

    console.log(`Found ${thriveAssistants.length} Thrive assistants to update\n`);

    for (const assistant of thriveAssistants) {
      const role = assistant.metadata?.role || 'unknown';
      console.log(`Updating ${assistant.name} (${role})...`);

      // Determine which functions to use
      const functions = role === 'pantry' ? PANTRY_FUNCTIONS : SHARED_FUNCTIONS;
      const tools = functions.map(func => ({ type: 'function', function: func }));

      try {
        // Update the assistant
        await openai.beta.assistants.update(assistant.id, { tools });
        console.log(`✅ Updated with ${tools.length} functions`);
      } catch (error) {
        console.error(`❌ Failed to update: ${error.message}`);
      }
    }

    console.log('\n✅ Assistant update complete!');
    
    // Verify the updates
    console.log('\n📋 Verification:');
    for (const assistant of thriveAssistants) {
      const updated = await openai.beta.assistants.retrieve(assistant.id);
      console.log(`${updated.name}: ${updated.tools?.length || 0} tools`);
    }

  } catch (error) {
    console.error('Error updating assistants:', error);
  }
}

// Run the update
updateAssistants();