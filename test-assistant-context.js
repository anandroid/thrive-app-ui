#!/usr/bin/env node

/**
 * Test script to verify assistant behavior with basic context
 * Tests if assistant avoids function calls when context shows empty data
 */

require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

async function testAssistantWithContext() {
  const API_URL = 'http://localhost:3000/api/assistant/stream';
  
  // Test 1: Empty context - should NOT trigger function calls
  console.log('\n🧪 Test 1: Empty Context (should NOT call functions)');
  console.log('=' + '='.repeat(60));
  
  const emptyContextPayload = {
    message: "I want to sleep better",
    threadId: null,
    basicContext: {
      pantryCount: 0,
      activeRoutineCount: 0,
      routineTypes: "none",
      pantryItems: [],
      activeRoutines: []
    }
  };
  
  console.log('📤 Sending:', JSON.stringify(emptyContextPayload, null, 2));
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emptyContextPayload)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let functionCallMade = false;
    let responseContent = '';
    let threadId = null;
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6);
          try {
            const data = JSON.parse(dataStr);
            
            if (data.type === 'thread_created') {
              threadId = data.threadId;
              console.log(`\n🆔 Thread created: ${threadId}`);
            } else if (data.type === 'function_call') {
              functionCallMade = true;
              console.log('\n⚠️  FUNCTION CALL DETECTED:', data.toolCalls.map(t => t.function.name).join(', '));
            } else if (data.type === 'content' || data.type === 'delta') {
              responseContent += data.content;
            } else if (data.type === 'done' || data.type === 'completed') {
              console.log('\n✅ Response complete');
            }
          } catch (e) {
            // Ignore parsing errors for non-JSON lines
          }
        }
      }
    }
    
    console.log('\n📥 Response content preview:', responseContent.substring(0, 200) + '...');
    
    // Check if response is JSON
    try {
      const parsedResponse = JSON.parse(responseContent);
      console.log('\n✅ Response is valid JSON');
      console.log('   - Has greeting:', !!parsedResponse.greeting);
      console.log('   - Has actionableItems:', Array.isArray(parsedResponse.actionableItems));
      console.log('   - Actionable items count:', parsedResponse.actionableItems?.length || 0);
      
      if (parsedResponse.actionableItems?.length > 0) {
        console.log('   - First actionable item:', parsedResponse.actionableItems[0]);
      }
    } catch (e) {
      console.log('\n❌ Response is NOT valid JSON:', e.message);
    }
    
    console.log(`\n📊 Result: ${functionCallMade ? '❌ FAILED - Made unnecessary function calls' : '✅ PASSED - No function calls made'}`);
    
    // Test 2: Context with data - MAY trigger function calls for details
    console.log('\n\n🧪 Test 2: Context with Data (MAY call functions for details)');
    console.log('=' + '='.repeat(60));
    
    const dataContextPayload = {
      message: "Should I take magnesium with my current supplements?",
      threadId: threadId,
      basicContext: {
        pantryCount: 3,
        activeRoutineCount: 1,
        routineTypes: "sleep_wellness",
        pantryItems: [
          "Vitamin D 2000IU - for immunity",
          "Melatonin 5mg - for sleep",
          "Omega-3 1000mg - for heart health"
        ],
        activeRoutines: [{
          name: "Evening Wind Down",
          type: "sleep_wellness",
          reminderTimes: ["9:00 PM"],
          steps: [
            "Take melatonin (9:00 PM)",
            "10-minute meditation (9:15 PM)",
            "Read a book (9:30 PM)"
          ]
        }]
      }
    };
    
    console.log('📤 Sending:', JSON.stringify(dataContextPayload, null, 2));
    
    const response2 = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataContextPayload)
    });
    
    const reader2 = response2.body.getReader();
    let functionCallMade2 = false;
    let responseContent2 = '';
    
    while (true) {
      const { done, value } = await reader2.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6);
          try {
            const data = JSON.parse(dataStr);
            
            if (data.type === 'function_call') {
              functionCallMade2 = true;
              console.log('\n🔍 Function call made for details:', data.toolCalls.map(t => t.function.name).join(', '));
            } else if (data.type === 'content' || data.type === 'delta') {
              responseContent2 += data.content;
            }
          } catch (e) {
            // Ignore
          }
        }
      }
    }
    
    console.log('\n📥 Response content preview:', responseContent2.substring(0, 200) + '...');
    
    // Check if response is JSON
    try {
      const parsedResponse = JSON.parse(responseContent2);
      console.log('\n✅ Response is valid JSON');
      console.log('   - Has actionableItems:', Array.isArray(parsedResponse.actionableItems));
      console.log('   - Suggests routine adjustment:', parsedResponse.actionableItems?.some(item => item.type === 'adjust_routine'));
    } catch (e) {
      console.log('\n❌ Response is NOT valid JSON:', e.message);
    }
    
    console.log(`\n📊 Result: Context utilized, function calls: ${functionCallMade2 ? 'Yes (for additional details)' : 'No (used basic context)'}`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

// Run tests directly
console.log('🚀 Starting tests...');
testAssistantWithContext();