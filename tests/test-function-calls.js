/**
 * Focused test for assistant function calls
 * Tests the actual flow when assistant makes function calls
 */

const puppeteer = require('puppeteer');

async function testAssistantFunctionCalls() {
  console.log('🧪 Testing Assistant Function Calls\n');

  const browser = await puppeteer.launch({
    headless: false, // Show browser for debugging
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    devtools: true
  });

  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Function') || text.includes('Tool') || text.includes('Error')) {
      console.log('Browser console:', text);
    }
  });

  // Monitor network requests
  page.on('request', request => {
    const url = request.url();
    if (url.includes('/api/assistant')) {
      console.log('📤 Request:', request.method(), url.split('/').slice(-2).join('/'));
    }
  });

  page.on('response', response => {
    const url = response.url();
    if (url.includes('/api/assistant') && response.status() !== 200) {
      console.log('📥 Response Error:', response.status(), url.split('/').slice(-2).join('/'));
    }
  });

  try {
    // Test 1: Navigate to chat
    console.log('1️⃣ Navigating to chat...');
    await page.goto('http://localhost:3001/', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Send message that triggers function calls
    console.log('2️⃣ Sending message that triggers function calls...');
    const chatInput = await page.waitForSelector('textarea[placeholder*="wellness"]', { timeout: 5000 });
    
    // This message should trigger get_pantry_items function
    await chatInput.type('What supplements do I have in my pantry?');
    await page.keyboard.press('Enter');

    // Wait and monitor the response
    console.log('3️⃣ Waiting for function call response...');
    await new Promise(resolve => setTimeout(resolve, 8000)); // Give plenty of time

    // Check for function call indicators
    const pageContent = await page.content();
    
    // Look for signs of function execution
    if (pageContent.includes('pantry is empty') || pageContent.includes('don\'t have any')) {
      console.log('✅ Assistant handled empty pantry correctly');
    } else if (pageContent.includes('supplement') || pageContent.includes('vitamin')) {
      console.log('✅ Assistant returned pantry items');
    } else {
      console.log('⚠️  Unexpected response - checking for errors...');
    }

    // Test 3: Test another function - routines
    console.log('\n4️⃣ Testing routine function call...');
    await chatInput.click();
    await page.keyboard.down('Control');
    await page.keyboard.press('A');
    await page.keyboard.up('Control');
    await chatInput.type('Show me my wellness routines');
    await page.keyboard.press('Enter');

    await new Promise(resolve => setTimeout(resolve, 8000));

    // Test 4: Test submit-tool-outputs specifically
    console.log('\n5️⃣ Testing complex query with multiple functions...');
    await chatInput.click();
    await page.keyboard.down('Control');
    await page.keyboard.press('A');
    await page.keyboard.up('Control');
    await chatInput.type('I have trouble sleeping. What supplements do I have that can help? Also show my sleep routines.');
    await page.keyboard.press('Enter');

    console.log('⏳ Waiting for multi-function response...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Take screenshots
    await page.screenshot({ path: 'tests/screenshots/function-calls-final.png', fullPage: true });

    console.log('\n📊 Test Complete - Check browser window for results');
    console.log('Press Ctrl+C to close browser and exit');

    // Keep browser open for inspection
    await new Promise(() => {});

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'tests/screenshots/function-calls-error.png', fullPage: true });
  }
}

// Run the test
testAssistantFunctionCalls().catch(console.error);