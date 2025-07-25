#!/usr/bin/env node

const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.THRIVE_OPENAI_API_KEY
});

async function createDiscoveryAssistant() {
  try {
    console.log('Creating Discovery Assistant...');

    // Read the instructions
    const instructionsPath = path.join(__dirname, '../src/lib/assistants/discoveryAssistantInstructions.ts');
    const instructionsContent = fs.readFileSync(instructionsPath, 'utf8');
    const instructions = instructionsContent.match(/export const discoveryAssistantInstructions = `([\s\S]*?)`;/)[1];

    const assistant = await openai.beta.assistants.create({
      name: "Thrive Discovery Content Moderator",
      instructions: instructions,
      tools: [],
      model: "gpt-4o"
    });

    console.log('✅ Discovery Assistant created successfully!');
    console.log('Assistant ID:', assistant.id);
    console.log('\nAdd this to your .env.local file:');
    console.log(`THRIVE_DISCOVERY_ASSISTANT_ID=${assistant.id}`);

    // Save to a file for reference
    const envPath = path.join(__dirname, '../.env.discovery');
    fs.writeFileSync(envPath, `THRIVE_DISCOVERY_ASSISTANT_ID=${assistant.id}\n`);
    console.log(`\nAlso saved to: ${envPath}`);

  } catch (error) {
    console.error('Error creating assistant:', error);
    process.exit(1);
  }
}

// Run the script
createDiscoveryAssistant();