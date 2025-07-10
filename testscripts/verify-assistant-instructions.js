#!/usr/bin/env node

/**
 * Script to retrieve and verify the current OpenAI Assistant instructions
 */

require('dotenv').config({ path: '.env.local' });
const OpenAI = require('openai');

async function verifyInstructions() {
  const apiKey = process.env.THRIVE_OPENAI_API_KEY;
  const assistantId = process.env.THRIVE_OPENAI_ASSISTANT_ID;

  if (!apiKey || !assistantId) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
  }

  console.log('🔍 Retrieving assistant instructions...\n');

  try {
    const openai = new OpenAI({ apiKey });
    
    // Get current assistant
    const assistant = await openai.beta.assistants.retrieve(assistantId);
    
    console.log('📋 Assistant Configuration:');
    console.log(`   Name: ${assistant.name}`);
    console.log(`   Model: ${assistant.model}`);
    console.log(`   Response Format: ${JSON.stringify(assistant.response_format)}`);
    console.log(`   Tools Count: ${assistant.tools?.length || 0}`);
    console.log('\n📝 Instructions (first 500 chars):');
    console.log(assistant.instructions?.substring(0, 500) + '...\n');
    
    // Check for key instruction elements
    const instructions = assistant.instructions || '';
    
    console.log('✅ Instruction Checks:');
    
    // Check for enhanced questions format
    const hasEnhancedQuestions = instructions.includes('"type": "time_input"') || 
                                instructions.includes('"type": "quick_reply"');
    console.log(`   Enhanced Questions Format: ${hasEnhancedQuestions ? '✅ Yes' : '❌ No'}`);
    
    // Check for supplement instructions
    const hasAlreadyHaveInstructions = instructions.includes('already_have') && 
                                      instructions.includes('ALWAYS provide BOTH');
    console.log(`   Already Have Instructions: ${hasAlreadyHaveInstructions ? '✅ Yes' : '❌ No'}`);
    
    // Check for example with both options
    const hasCorrectExample = instructions.includes('"type": "already_have"') && 
                             instructions.includes('"title": "I already have');
    console.log(`   Example with Both Options: ${hasCorrectExample ? '✅ Yes' : '❌ No'}`);
    
    // Check for JSON format requirement
    const hasJsonFormat = instructions.includes('JSON') && 
                         instructions.includes('respond with valid JSON');
    console.log(`   JSON Format Required: ${hasJsonFormat ? '✅ Yes' : '❌ No'}`);
    
    // Save full instructions to file for inspection
    const fs = require('fs');
    const path = require('path');
    const outputPath = path.join(__dirname, '../assistant-instructions-current.txt');
    fs.writeFileSync(outputPath, assistant.instructions || 'No instructions found');
    console.log(`\n💾 Full instructions saved to: ${outputPath}`);
    
    // Check specific supplement-related content
    console.log('\n🔍 Supplement Instructions Analysis:');
    const supplementMatches = instructions.match(/supplement.*already.*have|already.*have.*supplement/gi);
    if (supplementMatches) {
      console.log(`   Found ${supplementMatches.length} references to supplement + already have`);
    }
    
    // Look for the critical instruction
    const criticalInstruction = instructions.includes('CRITICAL: For EACH supplement recommendation, you MUST create TWO actionableItems');
    console.log(`   Critical Two Options Rule: ${criticalInstruction ? '✅ Yes' : '❌ No'}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run verification
verifyInstructions();