#!/usr/bin/env node

/**
 * Dynamic script to create/update the Thrive AI assistant team
 * This version dynamically imports configurations from TypeScript files
 * to avoid duplication and ensure consistency
 * 
 * Usage:
 *   npm run create-assistants           # Creates/updates dev assistants (default)
 *   npm run create-assistants -- --prod # Creates/updates production assistants
 */

require('dotenv').config({ path: '.env.local' });
const OpenAI = require('openai');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Parse command line arguments
const args = process.argv.slice(2);
const isProduction = args.includes('--prod');
const environment = isProduction ? 'production' : 'dev';

console.log(`\n🎯 Environment: ${environment.toUpperCase()}`);
console.log(`🔑 Using ${isProduction ? 'production' : 'development'} API keys and project\n`);

// Helper to get production API key from Google Cloud
async function getProductionApiKey() {
  if (!isProduction) {
    return process.env.THRIVE_OPENAI_API_KEY;
  }
  
  try {
    console.log('🔑 Fetching production API key from Google Cloud...');
    const command = `gcloud secrets versions access latest --secret=THRIVE_OPENAI_API_KEY --project=thrive-465618`;
    const { stdout } = await execPromise(command);
    const apiKey = stdout.trim();
    console.log(`🔑 Production API key fetched successfully`);
    return apiKey;
  } catch (error) {
    console.error(`❌ Error fetching production API key from Google Cloud: ${error.message}`);
    console.log(`🔄 Falling back to local environment variable...`);
    return process.env.THRIVE_OPENAI_API_KEY;
  }
}

// Environment-specific configuration
const envConfig = {
  dev: {
    apiKey: process.env.THRIVE_OPENAI_API_KEY, // Dev environment uses the dev API key
    project: 'thrive-dev-465922',
    assistantSuffix: ' (Dev)',
    envPrefix: 'THRIVE_'
  },
  production: {
    apiKey: null, // Will be set dynamically from Google Cloud
    project: 'thrive-465618', 
    assistantSuffix: '',
    envPrefix: 'THRIVE_'
  }
};

const config = envConfig[environment];

// OpenAI client will be initialized in main() after getting the API key
let openai;

// Helper to extract instructions from TypeScript files
async function extractInstructionsFromTS(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    
    // For files that use template literal interpolation with COMMON_TEAM_INSTRUCTIONS
    const templateMatch = content.match(/export\s+const\s+\w*_INSTRUCTIONS\s*=\s*`\$\{COMMON_TEAM_INSTRUCTIONS\}\s*([\s\S]*?)`;/);
    if (templateMatch) {
      console.log(`   📄 Found template literal instructions in ${path.basename(filePath)}`);
      // We need to resolve the COMMON_TEAM_INSTRUCTIONS at runtime
      return templateMatch[1]; // Return only the specific part, we'll add common instructions in main function
    }
    
    // Extract standalone instructions constant (handles template literals)
    const instructionsMatch = content.match(/export\s+const\s+\w*_INSTRUCTIONS\s*=\s*`([\s\S]*?)`;/);
    if (instructionsMatch) {
      console.log(`   📄 Found standalone instructions in ${path.basename(filePath)}`);
      return instructionsMatch[1];
    }
    
    throw new Error(`Could not extract instructions from ${path.basename(filePath)}`);
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
 * Store assistant ID in Google Cloud Secret Manager
 */
async function storeSecretInGCloud(secretName, assistantId) {
  try {
    console.log(`   📝 Storing ${secretName} in Google Cloud Secret Manager...`);
    
    // Create or update secret version in the dev project
    const command = `echo "${assistantId}" | gcloud secrets versions add ${secretName} --project=${config.project} --data-file=-`;
    await execPromise(command);
    
    console.log(`   ✅ Stored ${secretName} in ${config.project}`);
  } catch (error) {
    console.error(`   ⚠️  Warning: Could not store secret in Google Cloud: ${error.message}`);
    console.log(`   📝 Please manually add: ${secretName}=${assistantId} to your ${environment} environment`);
  }
}

/**
 * Get assistant ID from Google Cloud Secret Manager
 */
async function getAssistantIdFromCloud(secretName) {
  try {
    const command = `gcloud secrets versions access latest --secret=${secretName} --project=${config.project}`;
    const { stdout } = await execPromise(command);
    const assistantId = stdout.trim();
    if (assistantId && assistantId !== 'null' && assistantId !== '') {
      return assistantId;
    }
  } catch (error) {
    console.log(`   ⚠️  Could not fetch ${secretName} from Google Cloud: ${error.message}`);
  }
  
  // Try local env as fallback
  const localId = process.env[secretName];
  if (localId && localId !== 'null' && localId !== '') {
    return localId;
  }
  
  console.log(`   ℹ️  No existing assistant ID found for ${secretName}, will create new assistant`);
  return null;
}

/**
 * Create or update an assistant
 */
async function createOrUpdateAssistant(role, assistantConfig) {
  const envKey = `${config.envPrefix}${role.toUpperCase()}_ASSISTANT_ID`;
  
  // Get existing ID from appropriate source (cloud for dev, env for prod)
  const existingId = await getAssistantIdFromCloud(envKey);
  
  console.log(`\n🤖 Processing ${role} assistant for ${environment}...`);
  if (existingId) {
    console.log(`   📋 Found existing assistant: ${existingId}`);
  }
  
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
      },
      recommendation: {
        type: 'json_object'
      }
    };

    // Check if functions should be enabled
    const enableFunctions = process.env.ENABLE_ASSISTANT_FUNCTIONS === 'true';
    
    // Configure vector store IDs for file search
    const vectorStoreConfig = {
      dev: {
        chat: 'vs_68759409b70c8191a6163bfb9daa9fc4',
        routine: 'vs_68759409b70c8191a6163bfb9daa9fc4'
      },
      production: {
        chat: 'vs_68748581bae881918043903a14276e6e',
        routine: 'vs_68748581bae881918043903a14276e6e'
      }
    };
    
    // Build tools array
    const tools = [];
    
    // Add function tools if enabled
    if (enableFunctions) {
      tools.push(...assistantConfig.functions.map(func => ({ type: 'function', function: func })));
    }
    
    // Add file search for chat and routine assistants
    if (role === 'chat' || role === 'routine') {
      const vectorStoreId = vectorStoreConfig[environment][role];
      if (vectorStoreId) {
        tools.push({
          type: 'file_search'
        });
        console.log(`   📚 Added file search capability for ${role} assistant`);
      }
    }
    
    const finalAssistantConfig = {
      name: assistantConfig.name + config.assistantSuffix,
      description: assistantConfig.description + (isProduction ? '' : ' - Development version'),
      model: assistantConfig.model,
      instructions: assistantConfig.instructions,
      tools: tools,
      response_format: { type: 'json_object' },
      temperature: assistantConfig.temperature,
      metadata: {
        role,
        environment,
        version: '3.0',
        team: 'thrive-wellness',
        source: 'typescript-files',
        project: config.project
      }
    };
    
    // Add tool resources for file search if vector store is configured
    if ((role === 'chat' || role === 'routine') && vectorStoreConfig[environment][role]) {
      finalAssistantConfig.tool_resources = {
        file_search: {
          vector_store_ids: [vectorStoreConfig[environment][role]]
        }
      };
      console.log(`   📚 Will attempt to add vector store: ${vectorStoreConfig[environment][role]}`);
    }
    
    if (existingId) {
      // Update existing assistant
      console.log(`   Updating existing assistant: ${existingId}`);
      try {
        const assistant = await openai.beta.assistants.update(existingId, finalAssistantConfig);
        console.log(`   ✅ Updated: ${assistant.name}`);
        if (finalAssistantConfig.tool_resources?.file_search) {
          console.log(`   📚 File search enabled with vector store`);
        }
        return { role, id: assistant.id, name: assistant.name };
      } catch (error) {
        if (error.message.includes('vector store') || error.message.includes('No vector store found')) {
          console.log(`   ⚠️  Vector store not found, updating without file search...`);
          // Remove tool_resources and file_search tool, then retry
          delete finalAssistantConfig.tool_resources;
          finalAssistantConfig.tools = finalAssistantConfig.tools.filter(tool => tool.type !== 'file_search');
          const assistant = await openai.beta.assistants.update(existingId, finalAssistantConfig);
          console.log(`   ✅ Updated: ${assistant.name} (without file search)`);
          return { role, id: assistant.id, name: assistant.name };
        }
        throw error;
      }
    } else {
      // Create new assistant
      console.log(`   Creating new ${role} assistant...`);
      try {
        const assistant = await openai.beta.assistants.create(finalAssistantConfig);
        console.log(`   ✅ Created: ${assistant.name} (${assistant.id})`);
        if (finalAssistantConfig.tool_resources?.file_search) {
          console.log(`   📚 File search enabled with vector store`);
        }
        
        // Store assistant ID in Google Cloud Secret Manager for the appropriate environment
        if (!isProduction) {
          await storeSecretInGCloud(envKey, assistant.id);
        }
        
        return { role, id: assistant.id, name: assistant.name, isNew: true };
      } catch (error) {
        if (error.message.includes('vector store') || error.message.includes('No vector store found')) {
          console.log(`   ⚠️  Vector store not found, creating without file search...`);
          // Remove tool_resources and file_search tool, then retry
          delete finalAssistantConfig.tool_resources;
          finalAssistantConfig.tools = finalAssistantConfig.tools.filter(tool => tool.type !== 'file_search');
          const assistant = await openai.beta.assistants.create(finalAssistantConfig);
          console.log(`   ✅ Created: ${assistant.name} (${assistant.id}) (without file search)`);
          
          // Store assistant ID in Google Cloud Secret Manager for the appropriate environment
          if (!isProduction) {
            await storeSecretInGCloud(envKey, assistant.id);
          }
          
          return { role, id: assistant.id, name: assistant.name, isNew: true };
        }
        throw error;
      }
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
  console.log(`🚀 Thrive AI Assistant Team Setup - ${environment.toUpperCase()}\n`);
  
  // Initialize API key and OpenAI client
  const apiKey = await getProductionApiKey();
  if (!apiKey) {
    console.error(`❌ Error: Could not get API key for ${environment}`);
    process.exit(1);
  }
  
  // Initialize OpenAI client with the correct API key
  openai = new OpenAI({
    apiKey: apiKey,
  });
  
  const enableFunctions = process.env.ENABLE_ASSISTANT_FUNCTIONS === 'true';
  console.log(`📋 Assistant Functions: ${enableFunctions ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`🗄️  Project: ${config.project}`);
  console.log(`🏷️  Assistant Suffix: "${config.assistantSuffix}"\n`);
  
  if (isProduction) {
    console.log('⚠️  PRODUCTION MODE: Please confirm you want to update production assistants');
    console.log('   Press Ctrl+C to cancel, or Enter to continue...');
    
    // Wait for user confirmation in production
    await new Promise((resolve) => {
      process.stdin.once('data', () => {
        resolve();
      });
    });
  }
  
  try {
    // Load common instructions
    const commonInstructionsPath = path.join(__dirname, '../src/services/openai/assistant/team/commonInstructions.ts');
    const commonInstructions = await extractInstructionsFromTS(commonInstructionsPath);
    
    // Load assistant-specific configurations
    const assistantPaths = {
      chat: path.join(__dirname, '../src/services/openai/assistant/team/chatAssistant.ts'),
      routine: path.join(__dirname, '../src/services/openai/assistant/team/routineAssistant.ts'),
      pantry: path.join(__dirname, '../src/services/openai/assistant/team/pantryAssistant.ts'),
      recommendation: path.join(__dirname, '../src/services/openai/assistant/team/recommendationAssistant.ts')
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
      
      console.log(`\n✨ Thrive AI Assistant Team setup complete for ${environment.toUpperCase()}!`);
      console.log('\n💡 Instructions are now dynamically loaded from TypeScript files.');
      console.log('   Any changes to the .ts files will be reflected when you run this script.');
      
      if (!isProduction) {
        console.log(`\n🔐 Assistant IDs have been stored in Google Cloud Secret Manager (${config.project})`);
        console.log('   Your dev environment is ready to use these assistants.');
      }
      
      console.log('\n📝 Usage:');
      console.log('   Dev:        npm run create-assistants');
      console.log('   Production: npm run create-assistants -- --prod');
    }
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
main();