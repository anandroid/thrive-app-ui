const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

// Load the instructions
const instructionsPath = path.join(__dirname, '../src/assistants/instructions/feedAssistantInstructions.ts');
const instructionsContent = fs.readFileSync(instructionsPath, 'utf8');
const instructions = instructionsContent
  .replace('export const feedAssistantInstructions = `', '')
  .replace('`;', '')
  .trim();

async function createAssistant(apiKey, projectName) {
  const openai = new OpenAI({ apiKey });

  try {
    console.log(`\nCreating Feed Assistant for ${projectName}...`);

    const assistant = await openai.beta.assistants.create({
      name: `Thrive Feed Moderator - ${projectName}`,
      description: 'Reviews and moderates user posts for the Thrive wellness community feed',
      instructions: instructions,
      model: 'gpt-4-turbo-preview',
      tools: [],
      metadata: {
        project: projectName,
        purpose: 'community_feed_moderation',
        created: new Date().toISOString()
      }
    });

    console.log(`✅ Feed Assistant created for ${projectName}`);
    console.log(`   ID: ${assistant.id}`);
    console.log(`   Name: ${assistant.name}`);

    return {
      project: projectName,
      assistantId: assistant.id,
      envVarName: projectName === 'thrive' ? 'THRIVE_FEED_ASSISTANT_ID' : 'THRIVE_DEV_FEED_ASSISTANT_ID'
    };
  } catch (error) {
    console.error(`❌ Error creating assistant for ${projectName}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Creating Feed Assistants for Thrive Projects\n');

  // Check for API keys
  const thriveApiKey = process.env.THRIVE_OPENAI_API_KEY;
  const thriveDevApiKey = process.env.THRIVE_DEV_OPENAI_API_KEY;

  if (!thriveApiKey || !thriveDevApiKey) {
    console.error('❌ Missing API keys. Please ensure both THRIVE_OPENAI_API_KEY and THRIVE_DEV_OPENAI_API_KEY are set.');
    process.exit(1);
  }

  const results = [];

  // Create for thrive project
  const thriveResult = await createAssistant(thriveApiKey, 'thrive');
  if (thriveResult) results.push(thriveResult);

  // Create for thrive-dev project
  const thriveDevResult = await createAssistant(thriveDevApiKey, 'thrive-dev');
  if (thriveDevResult) results.push(thriveDevResult);

  if (results.length > 0) {
    console.log('\n📝 Add these to your environment variables:\n');
    results.forEach(result => {
      console.log(`${result.envVarName}=${result.assistantId}`);
    });

    console.log('\n📋 For .env.local:');
    results.forEach(result => {
      console.log(`${result.envVarName}="${result.assistantId}"`);
    });

    console.log('\n☁️  For Google Cloud Secret Manager:');
    results.forEach(result => {
      console.log(`echo -n "${result.assistantId}" | gcloud secrets create ${result.envVarName} --data-file=-`);
    });
  }

  console.log('\n✅ Feed Assistant creation completed!');
}

main().catch(console.error);