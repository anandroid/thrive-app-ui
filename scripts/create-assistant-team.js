#!/usr/bin/env node

/**
 * Dynamic script to create/update the Thrive AI assistant team
 * This version dynamically imports configurations from TypeScript files
 * to avoid duplication and ensure consistency
 */

require('dotenv').config({ path: '.env.local' });
const OpenAI = require('openai');
const fs = require('fs').promises;
const path = require('path');

const openai = new OpenAI({
  apiKey: process.env.THRIVE_OPENAI_API_KEY,
});

// Helper to extract instructions from TypeScript files
async function extractInstructionsFromTS(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Extract the instructions constant (handles template literals)
    const instructionsMatch = content.match(/export\s+const\s+\w*_INSTRUCTIONS\s*=\s*`([\s\S]*?)`;/);
    if (instructionsMatch) {
      return instructionsMatch[1];
    }
    
    // If using COMMON_TEAM_INSTRUCTIONS, extract the additional part
    const commonMatch = content.match(/\$\{COMMON_TEAM_INSTRUCTIONS\}\s*\n([\s\S]*?)`;/);
    if (commonMatch) {
      return commonMatch[1];
    }
    
    throw new Error('Could not extract instructions from file');
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    throw error;
  }
}

// Helper to extract config from TypeScript files
async function extractConfigFromTS(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Extract the config object
    const configMatch = content.match(/export\s+const\s+\w*_CONFIG\s*=\s*\{([\s\S]*?)\};/);
    if (configMatch) {
      // Parse the config manually (simple approach for known structure)
      const configStr = configMatch[1];
      const config = {};
      
      // Extract name
      const nameMatch = configStr.match(/name:\s*['"`]([^'"`]+)['"`]/);
      if (nameMatch) config.name = nameMatch[1];
      
      // Extract model
      const modelMatch = configStr.match(/model:\s*['"`]([^'"`]+)['"`]/);
      if (modelMatch) config.model = modelMatch[1];
      
      // Extract description
      const descMatch = configStr.match(/description:\s*['"`]([^'"`]+)['"`]/);
      if (descMatch) config.description = descMatch[1];
      
      // Extract temperature
      const tempMatch = configStr.match(/temperature:\s*([\d.]+)/);
      if (tempMatch) config.temperature = parseFloat(tempMatch[1]);
      
      // Extract response_format if present
      const responseFormatMatch = configStr.match(/response_format:\s*(\{[\s\S]*?\n\s*\})/);
      if (responseFormatMatch) {
        // For now, we'll mark that it exists and handle it specially
        config.hasResponseFormat = true;
      }
      
      return config;
    }
    
    throw new Error('Could not extract config from file');
  } catch (error) {
    console.error(`Error extracting config from ${filePath}:`, error.message);
    throw error;
  }
}

// Shared functions for all assistants
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
          enum: ['all', 'pain', 'mood', 'symptoms', 'medications', 'supplements'],
          description: 'Filter by entry type'
        }
      },
      required: ['query']
    }
  }
];

// Additional functions for specific assistants
const ROUTINE_FUNCTIONS = [
  {
    name: 'analyze_schedule',
    description: 'Analyze user\'s daily schedule to find optimal times for routine activities',
    parameters: {
      type: 'object',
      properties: {
        wake_time: { type: 'string', description: 'Usual wake up time' },
        sleep_time: { type: 'string', description: 'Usual sleep time' },
        work_schedule: { type: 'string', description: 'Work schedule description' }
      }
    }
  }
];

const PANTRY_FUNCTIONS = [
  {
    name: 'get_supplement_recommendations',
    description: 'Get personalized supplement recommendations based on user health goals and conditions',
    parameters: {
      type: 'object',
      properties: {
        health_concern: { type: 'string', description: 'The primary health concern to address' },
        existing_medications: {
          type: 'array',
          items: { type: 'string' },
          description: 'Current medications to check for interactions'
        }
      },
      required: ['health_concern']
    }
  }
];

/**
 * Create or update an assistant
 */
async function createOrUpdateAssistant(role, config) {
  const envKey = `THRIVE_${role.toUpperCase()}_ASSISTANT_ID`;
  const existingId = process.env[envKey];
  
  console.log(`\n🤖 Processing ${role} assistant...`);
  
  try {
    // Define response schemas for each role
    const responseSchemas = {
      chat: {
        type: 'json_schema',
        json_schema: {
          name: 'chat_response',
          schema: {
            type: 'object',
            properties: {
              greeting: { type: 'string' },
              attentionRequired: { type: ['string', 'null'] },
              emergencyReasoning: { type: ['string', 'null'] },
              actionItems: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    content: { type: 'string' }
                  },
                  required: ['title', 'content'],
                  additionalProperties: false
                }
              },
              additionalInformation: { type: ['string', 'null'] },
              actionableItems: { 
                type: 'array', 
                items: { 
                  type: 'object',
                  additionalProperties: false 
                } 
              },
              questions: { 
                type: 'array', 
                items: { 
                  type: 'object',
                  additionalProperties: false 
                } 
              }
            },
            required: ['greeting', 'actionItems', 'actionableItems', 'questions'],
            additionalProperties: false
          },
          strict: true
        }
      },
      routine: {
        type: 'json_schema',
        json_schema: {
          name: 'routine_response',
          schema: {
            type: 'object',
            properties: {
              greeting: { type: 'string' },
              attentionRequired: { type: ['string', 'null'] },
              emergencyReasoning: { type: ['string', 'null'] },
              actionItems: { 
                type: 'array', 
                items: { 
                  type: 'object',
                  additionalProperties: false 
                } 
              },
              additionalInformation: { type: ['string', 'null'] },
              actionableItems: { 
                type: 'array', 
                items: { 
                  type: 'object',
                  additionalProperties: false 
                } 
              },
              questions: { 
                type: 'array', 
                items: { 
                  type: 'object',
                  additionalProperties: false 
                } 
              }
            },
            required: ['greeting', 'actionItems', 'actionableItems', 'questions'],
            additionalProperties: false
          },
          strict: true
        }
      },
      pantry: {
        type: 'json_schema',
        json_schema: {
          name: 'pantry_response',
          schema: {
            type: 'object',
            properties: {
              greeting: { type: 'string' },
              attentionRequired: { type: ['string', 'null'] },
              emergencyReasoning: { type: ['string', 'null'] },
              actionItems: { 
                type: 'array', 
                items: { 
                  type: 'object',
                  additionalProperties: false 
                } 
              },
              additionalInformation: { type: ['string', 'null'] },
              actionableItems: { 
                type: 'array', 
                items: { 
                  type: 'object',
                  additionalProperties: false 
                } 
              },
              questions: { 
                type: 'array', 
                items: { 
                  type: 'object',
                  additionalProperties: false 
                } 
              }
            },
            required: ['greeting', 'actionItems', 'actionableItems', 'questions'],
            additionalProperties: false
          },
          strict: true
        }
      }
    };

    // Check if functions should be enabled
    const enableFunctions = process.env.ENABLE_ASSISTANT_FUNCTIONS === 'true';
    
    const assistantConfig = {
      name: config.name,
      description: config.description,
      model: config.model,
      instructions: config.instructions,
      tools: enableFunctions ? config.functions.map(func => ({ type: 'function', function: func })) : [],
      response_format: { type: 'json_object' },
      temperature: config.temperature,
      metadata: {
        role,
        version: '3.0',
        team: 'thrive-wellness',
        source: 'typescript-files'
      }
    };
    
    if (existingId) {
      // Update existing assistant
      console.log(`   Updating existing assistant: ${existingId}`);
      const assistant = await openai.beta.assistants.update(existingId, assistantConfig);
      console.log(`   ✅ Updated: ${assistant.name}`);
      return { role, id: assistant.id, name: assistant.name };
    } else {
      // Create new assistant
      console.log(`   Creating new ${role} assistant...`);
      const assistant = await openai.beta.assistants.create(assistantConfig);
      console.log(`   ✅ Created: ${assistant.name} (${assistant.id})`);
      return { role, id: assistant.id, name: assistant.name, isNew: true };
    }
  } catch (error) {
    console.error(`   ❌ Error with ${role} assistant:`, error.message);
    throw error;
  }
}

/**
 * Update .env.local file with assistant IDs
 */
async function updateEnvFile(assistants) {
  const envPath = path.join(process.cwd(), '.env.local');
  
  try {
    let envContent = await fs.readFile(envPath, 'utf-8');
    
    // Add comment for multi-assistant section if not present
    if (!envContent.includes('# Multi-assistant IDs')) {
      envContent += '\n# Multi-assistant IDs';
    }
    
    for (const assistant of assistants) {
      if (assistant.isNew) {
        const envKey = `THRIVE_${assistant.role.toUpperCase()}_ASSISTANT_ID`;
        const envLine = `${envKey}=${assistant.id}`;
        
        // Check if the key already exists
        const keyRegex = new RegExp(`^${envKey}=.*$`, 'm');
        if (keyRegex.test(envContent)) {
          // Update existing line
          envContent = envContent.replace(keyRegex, envLine);
        } else {
          // Add new line
          envContent += `\n${envLine}`;
        }
      }
    }
    
    await fs.writeFile(envPath, envContent);
    console.log('\n✅ Updated .env.local with new assistant IDs');
  } catch (error) {
    console.error('❌ Error updating .env.local:', error.message);
    console.log('\nPlease add these lines to your .env.local manually:');
    assistants.forEach(a => {
      if (a.isNew) {
        console.log(`${a.role.toUpperCase()}_ASSISTANT_ID=${a.id}`);
      }
    });
  }
}

/**
 * Main function to create/update all assistants
 */
async function main() {
  console.log('🚀 Thrive AI Assistant Team Setup (Dynamic Version)\n');
  
  const enableFunctions = process.env.ENABLE_ASSISTANT_FUNCTIONS === 'true';
  console.log(`📋 Assistant Functions: ${enableFunctions ? '✅ Enabled' : '❌ Disabled'}\n`);
  
  if (!process.env.THRIVE_OPENAI_API_KEY) {
    console.error('❌ Error: THRIVE_OPENAI_API_KEY not found in .env.local');
    process.exit(1);
  }
  
  try {
    // Load common instructions
    const commonInstructionsPath = path.join(__dirname, '../src/services/openai/assistant/team/commonInstructions.ts');
    const commonInstructions = await extractInstructionsFromTS(commonInstructionsPath);
    
    // Load assistant-specific configurations
    const assistantPaths = {
      chat: path.join(__dirname, '../src/services/openai/assistant/team/chatAssistant.ts'),
      routine: path.join(__dirname, '../src/services/openai/assistant/team/routineAssistant.ts'),
      pantry: path.join(__dirname, '../src/services/openai/assistant/team/pantryAssistant.ts')
    };
    
    const results = [];
    
    // Process each assistant
    for (const [role, filePath] of Object.entries(assistantPaths)) {
      console.log(`\n📄 Loading ${role} assistant from TypeScript files...`);
      
      try {
        const specificInstructions = await extractInstructionsFromTS(filePath);
        const config = await extractConfigFromTS(filePath);
        
        // Combine instructions
        const fullInstructions = commonInstructions + '\n' + specificInstructions;
        
        // Add appropriate functions
        let functions = [...SHARED_FUNCTIONS];
        if (role === 'routine') {
          functions = [...functions, ...ROUTINE_FUNCTIONS];
        } else if (role === 'pantry') {
          functions = [...functions, ...PANTRY_FUNCTIONS];
        }
        
        // Create/update assistant
        const result = await createOrUpdateAssistant(role, {
          ...config,
          instructions: fullInstructions,
          functions,
          // Use nano model as default if not specified
          model: config.model || 'gpt-4.1-nano-2025-04-14'
        });
        
        results.push(result);
      } catch (error) {
        console.error(`❌ Failed to process ${role} assistant:`, error.message);
      }
    }
    
    // Update environment file
    if (results.length > 0) {
      await updateEnvFile(results);
      
      console.log('\n📊 Summary:');
      console.log('─'.repeat(50));
      results.forEach(r => {
        console.log(`${r.role.padEnd(10)} - ${r.name} (${r.id})`);
      });
      
      console.log('\n✨ Thrive AI Assistant Team setup complete!');
      console.log('\n💡 Instructions are now dynamically loaded from TypeScript files.');
      console.log('   Any changes to the .ts files will be reflected when you run this script.');
    }
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
main();