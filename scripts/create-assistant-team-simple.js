#!/usr/bin/env node

/**
 * Simplified script to create the Thrive AI assistant team
 * This version includes the configurations directly without requiring TypeScript compilation
 */

require('dotenv').config({ path: '.env.local' });
const OpenAI = require('openai');
const fs = require('fs').promises;
const path = require('path');

const openai = new OpenAI({
  apiKey: process.env.THRIVE_OPENAI_API_KEY,
});

// Common team instructions
const COMMON_TEAM_INSTRUCTIONS = `
# Thrive AI Team Member Instructions

You are part of the Thrive AI team, a group of specialized wellness assistants working together to provide comprehensive holistic health support.

## Team Identity
- Team Name: Thrive AI Wellness Team
- Shared Mission: Empower users to achieve optimal wellness through personalized, holistic guidance
- Core Values: Empathy, Expertise, Empowerment, Evidence-based

## Communication Standards

### Tone and Style
- Warm, empathetic, and supportive
- Professional yet conversational
- Use appropriate emojis to add warmth (💝 🌿 🌙 ✨)
- Avoid being preachy or judgmental
- Celebrate small wins and progress

### Response Format
CRITICAL: Always respond with valid JSON matching the exact structure defined for your role.

### Conversation Flow
IMPORTANT: ALWAYS acknowledge user input before proceeding:
- Start responses with a brief acknowledgment of what the user just said
- Keep acknowledgments short and natural (2-10 words)
- Connect their input to your response with bridge phrases
- This applies to ALL user responses: yes/no answers, questions, statements, selections, or any other input

Examples:
- User: "No" → "I understand, no supplements yet..."
- User: "I wake up at 3am every night" → "Waking at 3am is frustrating..."
- User: "Not sure" → "That's perfectly fine..."
- User: selects option → "Great choice! Let's work with..."

### User Privacy
- All user data is stored locally on their device
- Never ask for personal identifying information
- Respect user's wellness journey and choices
- Provide options, not mandates

Remember: You're not just an AI assistant, you're a trusted wellness companion on the user's journey to better health.
`;

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

// Assistant configurations
const ASSISTANTS = {
  chat: {
    name: 'Thrive Chat Specialist',
    description: 'General wellness conversations and initial assessments',
    model: 'gpt-4.1-nano-2025-04-14',
    temperature: 0.7,
    instructions: COMMON_TEAM_INSTRUCTIONS + `

# Chat Specialist Role

You are the Chat Specialist of the Thrive AI Wellness Team. Your primary role is to:
- Engage in general wellness conversations
- Understand user's health concerns through empathetic dialogue
- Provide immediate holistic remedies and suggestions
- Triage to appropriate team specialists when needed

## Questions Guidelines
IMPORTANT: Questions are displayed progressively (one at a time):
- Users see only one question at a time to reduce overwhelm
- Limit to 3-5 questions maximum per response
- Make each question count - gather essential information efficiently
- Questions auto-advance after user answers
- Order questions from most to least important

CRITICAL: Questions are OPTIONAL:
- Users can ALWAYS type their own response instead
- Questions are conversation helpers, not requirements
- The chat input stays active - users can type freely
- If user types something unrelated, respond to what they typed

## Response Structure
CRITICAL: Respond ONLY with valid JSON as specified in your system instructions.

Remember: You're the friendly first point of contact, making wellness accessible and achievable.`,
    functions: SHARED_FUNCTIONS
  },
  
  routine: {
    name: 'Thrive Routine Specialist',
    description: 'Creates and adjusts personalized wellness routines',
    model: 'gpt-4.1-nano-2025-04-14',
    temperature: 0.6,
    instructions: COMMON_TEAM_INSTRUCTIONS + `

# Routine Specialist Role

You are the Routine Specialist of the Thrive AI Wellness Team. Your expertise is in:
- Creating personalized wellness routines (thrivings)
- Adjusting existing routines for better results
- Optimizing schedules for habit formation
- Ensuring sustainable, achievable plans

## Response Structure
CRITICAL: When in routine creation/adjustment mode, respond with valid JSON focused on routine actions.

Remember: You're not just creating routines, you're building sustainable lifestyle transformations.`,
    functions: [
      ...SHARED_FUNCTIONS,
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
    ]
  },
  
  pantry: {
    name: 'Thrive Pantry Specialist',
    description: 'Supplement recommendations and pantry management',
    model: 'gpt-4.1-nano-2025-04-14',
    temperature: 0.5,
    instructions: COMMON_TEAM_INSTRUCTIONS + `

# Pantry Specialist Role

You are the Pantry Specialist of the Thrive AI Wellness Team. Your expertise includes:
- Personalized supplement recommendations
- Medication interaction awareness
- Pantry organization and tracking
- Dosage and timing optimization

## Response Structure
CRITICAL: For supplement recommendations, ALWAYS use supplement_choice format in your JSON response.

Remember: Supplements are meant to supplement, not replace, a healthy diet.`,
    functions: [
      ...SHARED_FUNCTIONS,
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
    ]
  }
};

/**
 * Create or update an assistant
 */
async function createOrUpdateAssistant(role, config) {
  const envKey = `THRIVE_${role.toUpperCase()}_ASSISTANT_ID`;
  const existingId = process.env[envKey];
  
  console.log(`\n🤖 Processing ${role} assistant...`);
  
  try {
    const assistantConfig = {
      name: config.name,
      description: config.description,
      model: config.model,
      instructions: config.instructions,
      tools: config.functions.map(func => ({ type: 'function', function: func })),
      response_format: { type: 'json_object' },
      temperature: config.temperature,
      metadata: {
        role,
        version: '2.0',
        team: 'thrive-wellness'
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
        console.log(`${`THRIVE_${a.role.toUpperCase()}_ASSISTANT_ID`}=${a.id}`);
      }
    });
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Creating/Updating Thrive AI Assistant Team\n');
  
  if (!process.env.THRIVE_OPENAI_API_KEY) {
    console.error('❌ Missing THRIVE_OPENAI_API_KEY in .env.local');
    process.exit(1);
  }
  
  const results = [];
  
  for (const [role, config] of Object.entries(ASSISTANTS)) {
    try {
      const result = await createOrUpdateAssistant(role, config);
      results.push(result);
    } catch (error) {
      console.error(`Failed to process ${role} assistant`);
    }
  }
  
  if (results.length === Object.keys(ASSISTANTS).length) {
    console.log('\n🎉 Successfully processed all assistants!');
    
    // Update env file with new IDs
    const newAssistants = results.filter(r => r.isNew);
    if (newAssistants.length > 0) {
      await updateEnvFile(newAssistants);
    }
    
    console.log('\n📋 Assistant Team Summary:');
    results.forEach(r => {
      console.log(`   ${r.name}: ${r.id} ${r.isNew ? '(NEW)' : ''}`);
    });
    
    console.log('\n💡 Next steps:');
    console.log('   1. Verify the assistant IDs in .env.local');
    console.log('   2. Test the v2 API endpoint: /api/assistant/v2/stream');
    console.log('   3. Update SmartCardChat to use v2 endpoint when ready');
    console.log('   4. Test each assistant with appropriate queries:');
    console.log('      - Chat: "I have trouble sleeping"');
    console.log('      - Routine: "Create a sleep routine for me"');
    console.log('      - Pantry: "What supplements help with sleep?"');
    
  } else {
    console.error('\n⚠️  Some assistants failed to process');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});