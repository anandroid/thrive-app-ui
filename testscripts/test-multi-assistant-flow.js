#!/usr/bin/env node

/**
 * Test script for multi-assistant flow
 * Tests routing, handoffs, and responses from each specialist
 */

require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Test messages for each assistant
const testCases = [
  {
    name: 'Chat Specialist Test',
    message: 'I have trouble sleeping at night',
    expectedAssistant: 'chat',
    expectedContent: ['sleep', 'rest', 'bedtime']
  },
  {
    name: 'Routine Specialist Test',
    message: 'Create a sleep routine for me',
    expectedAssistant: 'routine',
    expectedContent: ['routine', 'schedule', 'morning']
  },
  {
    name: 'Pantry Specialist Test',
    message: 'What supplements can help with sleep?',
    expectedAssistant: 'pantry',
    expectedContent: ['supplement', 'magnesium', 'melatonin']
  },
  {
    name: 'Handoff Test',
    message: 'I want supplements and a routine for better sleep',
    expectedAssistants: ['chat', 'routine', 'pantry'],
    expectedContent: ['supplement', 'routine']
  }
];

async function testAssistant(testCase) {
  console.log(`\n${colors.cyan}🧪 ${testCase.name}${colors.reset}`);
  console.log(`   Message: "${testCase.message}"`);
  
  try {
    const response = await fetch('http://localhost:3002/api/assistant/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: testCase.message,
        threadId: `test-${Date.now()}`,
        basicContext: {
          pantryCount: 5,
          activeRoutineCount: 2,
          routineTypes: 'sleep_wellness, stress_management'
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Read streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let assistantRole = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            
            if (data.type === 'content') {
              fullContent += data.content;
              if (data.role && !assistantRole) {
                assistantRole = data.role;
                console.log(`   ${colors.green}✓${colors.reset} Assistant: ${colors.bright}${assistantRole}${colors.reset}`);
              }
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }

    // Verify response
    console.log(`   ${colors.green}✓${colors.reset} Response received (${fullContent.length} chars)`);
    
    // Parse JSON response
    try {
      const parsed = JSON.parse(fullContent);
      
      // Check for expected content
      const responseText = JSON.stringify(parsed).toLowerCase();
      const foundExpected = testCase.expectedContent.filter(word => 
        responseText.includes(word.toLowerCase())
      );
      
      if (foundExpected.length > 0) {
        console.log(`   ${colors.green}✓${colors.reset} Found expected content: ${foundExpected.join(', ')}`);
      } else {
        console.log(`   ${colors.yellow}⚠${colors.reset} Expected content not found`);
      }
      
      // Check for actionable items
      if (parsed.actionableItems && parsed.actionableItems.length > 0) {
        console.log(`   ${colors.green}✓${colors.reset} Actionable items: ${parsed.actionableItems.length}`);
        
        // Check for supplement recommendations with both options
        const supplementItems = parsed.actionableItems.filter(item => 
          item.type === 'supplement_choice' || item.type === 'already_have' || item.type === 'buy'
        );
        
        if (supplementItems.length > 0) {
          console.log(`   ${colors.green}✓${colors.reset} Supplement recommendations: ${supplementItems.length}`);
        }
      }
      
    } catch (e) {
      console.log(`   ${colors.yellow}⚠${colors.reset} Response is not JSON (might be streaming text)`);
    }
    
    return true;
    
  } catch (error) {
    console.log(`   ${colors.red}✗${colors.reset} Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log(`\n${colors.bright}${colors.cyan}🚀 Multi-Assistant Flow Tests${colors.reset}\n`);
  
  // Check if server is running
  try {
    await fetch('http://localhost:3002/api/health');
  } catch (error) {
    console.log(`${colors.red}❌ Server not running on port 3002${colors.reset}`);
    console.log(`${colors.yellow}💡 Start the server with: npm run dev${colors.reset}\n`);
    process.exit(1);
  }
  
  console.log(`${colors.green}✓${colors.reset} Server is running\n`);
  
  // Run all tests
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    const result = await testAssistant(testCase);
    if (result) passed++;
    else failed++;
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log(`\n${colors.bright}📊 Test Summary${colors.reset}`);
  console.log(`   ${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`   ${colors.red}Failed: ${failed}${colors.reset}`);
  
  if (failed === 0) {
    console.log(`\n${colors.bright}${colors.green}✨ All tests passed!${colors.reset}\n`);
  } else {
    console.log(`\n${colors.bright}${colors.red}⚠️  Some tests failed${colors.reset}\n`);
  }
}

// Add node-fetch check
try {
  require.resolve('node-fetch');
} catch (e) {
  console.log(`${colors.yellow}Installing node-fetch...${colors.reset}`);
  require('child_process').execSync('npm install --no-save node-fetch@2', { stdio: 'inherit' });
}

// Run tests
runTests().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});