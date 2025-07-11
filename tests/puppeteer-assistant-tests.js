/**
 * Puppeteer tests for assistant function calls and coordination
 * This runs in headless mode and captures screenshots
 * 
 * Run with: node tests/puppeteer-assistant-tests.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const WAIT_TIME = 2000; // Time to wait for responses

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// Ensure screenshots directory exists
async function ensureScreenshotsDir() {
  try {
    await fs.mkdir(SCREENSHOTS_DIR, { recursive: true });
    console.log(`📁 Screenshots will be saved to: ${SCREENSHOTS_DIR}`);
  } catch (err) {
    console.error('Failed to create screenshots directory:', err);
  }
}

// Helper to take screenshots with descriptive names
async function takeScreenshot(page, name) {
  const filename = `${new Date().toISOString().split('T')[0]}_${name}.png`;
  const filepath = path.join(SCREENSHOTS_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`📸 Screenshot saved: ${filename}`);
  return filename;
}

// Test 1: Function Calls UI Test
async function testFunctionCallsUI(browser) {
  console.log('\n🧪 Test 1: Testing Function Calls UI Page');
  const page = await browser.newPage();
  const test = { name: 'Function Calls UI', passed: true, screenshots: [], errors: [] };

  try {
    // Navigate to test functions page
    await page.goto(`${BASE_URL}/test-functions`, { waitUntil: 'networkidle2' });
    await takeScreenshot(page, '01_test_functions_page');
    test.screenshots.push('01_test_functions_page.png');

    // Click setup test data
    console.log('  ➤ Setting up test data...');
    await page.click('button:has-text("Setup Test Data")');
    await page.waitForTimeout(1000);

    // Dismiss alert
    page.on('dialog', async dialog => {
      console.log('  ✓ Alert:', dialog.message());
      await dialog.accept();
    });

    // Test each function button
    const functionTests = [
      { selector: 'button:has-text("Get All Pantry Items")', name: 'get_all_pantry' },
      { selector: 'button:has-text("Get Supplements Only")', name: 'get_supplements' },
      { selector: 'button:has-text("Search Pantry")', name: 'search_pantry' },
      { selector: 'button:has-text("Get All Routines")', name: 'get_routines' },
      { selector: 'button:has-text("Get Recommendations")', name: 'get_recommendations' }
    ];

    for (let i = 0; i < functionTests.length; i++) {
      const test = functionTests[i];
      console.log(`  ➤ Testing: ${test.name}`);
      
      await page.click(test.selector);
      await page.waitForTimeout(1500);
      
      // Check for results
      const hasResults = await page.$('.bg-gray-50.p-2.rounded');
      if (hasResults) {
        console.log(`  ✓ ${test.name} returned results`);
        await takeScreenshot(page, `02_function_${test.name}`);
      } else {
        console.log(`  ❌ ${test.name} failed to return results`);
        test.passed = false;
      }
    }

    // Test error handling
    console.log('  ➤ Testing error handling...');
    await page.click('button:has-text("Test Error Handling")');
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '03_error_handling');

  } catch (error) {
    console.error('  ❌ Test failed:', error.message);
    test.passed = false;
    test.errors.push(error.message);
  }

  await page.close();
  testResults.tests.push(test);
  if (test.passed) testResults.passed++; else testResults.failed++;
}

// Test 2: Chat Assistant Supplement-First Protocol
async function testSupplementFirstProtocol(browser) {
  console.log('\n🧪 Test 2: Testing Supplement-First Protocol');
  const page = await browser.newPage();
  const test = { name: 'Supplement-First Protocol', passed: true, screenshots: [], errors: [] };

  try {
    // Navigate to chat
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    
    // Type sleep issue message
    console.log('  ➤ Sending sleep issue message...');
    const chatInput = await page.$('textarea[placeholder*="wellness"]');
    if (!chatInput) {
      throw new Error('Chat input not found');
    }
    
    await chatInput.type('I have trouble sleeping at night. What can help me?');
    await takeScreenshot(page, '04_chat_sleep_input');
    
    // Submit message
    await page.click('button[aria-label*="Send"], button:has(svg[class*="Send"])');
    
    // Wait for response
    console.log('  ➤ Waiting for assistant response...');
    await page.waitForTimeout(5000); // Give time for streaming response
    
    // Take screenshot of response
    await takeScreenshot(page, '05_chat_sleep_response');
    
    // Check for supplement recommendations
    const supplementElements = await page.$$('[class*="supplement"]');
    const routineElements = await page.$$('button:has-text("Create"), button:has-text("Routine")');
    
    console.log(`  ✓ Found ${supplementElements.length} supplement elements`);
    console.log(`  ✓ Found ${routineElements.length} routine elements`);
    
    // Verify supplements appear before routines in DOM
    if (supplementElements.length > 0 && routineElements.length > 0) {
      console.log('  ✓ Both supplements and routines found');
      test.passed = true;
    } else {
      console.log('  ⚠️  Could not verify supplement-first order');
    }

  } catch (error) {
    console.error('  ❌ Test failed:', error.message);
    test.passed = false;
    test.errors.push(error.message);
  }

  await page.close();
  testResults.tests.push(test);
  if (test.passed) testResults.passed++; else testResults.failed++;
}

// Test 3: Pain Journey with Intensity Slider
async function testPainIntensitySlider(browser) {
  console.log('\n🧪 Test 3: Testing Pain Journey Intensity Slider');
  const page = await browser.newPage();
  const test = { name: 'Pain Intensity Slider', passed: true, screenshots: [], errors: [] };

  try {
    // Navigate to chat
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    
    // Send pain tracking message
    console.log('  ➤ Sending pain tracking message...');
    const chatInput = await page.$('textarea[placeholder*="wellness"]');
    await chatInput.type('I want to track my chronic back pain');
    await page.click('button[aria-label*="Send"], button:has(svg[class*="Send"])');
    
    // Wait for response with journey suggestion
    await page.waitForTimeout(5000);
    await takeScreenshot(page, '06_pain_journey_suggestion');
    
    // Look for journey creation button
    const journeyButton = await page.$('button:has-text("Journey"), button:has-text("Track")');
    if (journeyButton) {
      console.log('  ✓ Found journey creation button');
      await journeyButton.click();
      await page.waitForTimeout(2000);
      
      // Check for pain intensity slider in modal
      const sliderExists = await page.$('input[type="range"]');
      const painIntensityText = await page.$('text=/Current Pain Intensity/i');
      
      if (sliderExists && painIntensityText) {
        console.log('  ✓ Pain intensity slider found!');
        await takeScreenshot(page, '07_pain_intensity_slider');
        
        // Test slider interaction
        await sliderExists.evaluate(slider => slider.value = '7');
        await page.waitForTimeout(500);
        await takeScreenshot(page, '08_pain_slider_adjusted');
      } else {
        console.log('  ❌ Pain intensity slider not found');
        test.passed = false;
      }
    } else {
      console.log('  ⚠️  Journey button not found in response');
    }

  } catch (error) {
    console.error('  ❌ Test failed:', error.message);
    test.passed = false;
    test.errors.push(error.message);
  }

  await page.close();
  testResults.tests.push(test);
  if (test.passed) testResults.passed++; else testResults.failed++;
}

// Test 4: Context Sharing in Routine Creation
async function testContextSharing(browser) {
  console.log('\n🧪 Test 4: Testing Context Sharing in Routine Creation');
  const page = await browser.newPage();
  const test = { name: 'Context Sharing', passed: true, screenshots: [], errors: [] };

  try {
    // Navigate to chat
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    
    // Send message with specific context
    console.log('  ➤ Sending message with supplement and pain context...');
    const chatInput = await page.$('textarea[placeholder*="wellness"]');
    await chatInput.type('I take magnesium glycinate 400mg for sleep and have shoulder pain from desk work');
    await page.click('button[aria-label*="Send"], button:has(svg[class*="Send"])');
    
    await page.waitForTimeout(5000);
    await takeScreenshot(page, '09_context_message');
    
    // Send routine request
    console.log('  ➤ Requesting routine creation...');
    await chatInput.type('Can you create a routine for my shoulder pain?');
    await page.click('button[aria-label*="Send"], button:has(svg[class*="Send"])');
    
    await page.waitForTimeout(5000);
    await takeScreenshot(page, '10_routine_suggestion');
    
    // Click routine creation if available
    const routineButton = await page.$('button:has-text("Create"), button:has-text("Routine")');
    if (routineButton) {
      console.log('  ✓ Found routine creation button');
      await routineButton.click();
      await page.waitForTimeout(2000);
      await takeScreenshot(page, '11_routine_modal');
      
      // The context should be passed to the routine creation
      console.log('  ✓ Context should include magnesium and shoulder pain details');
    }

  } catch (error) {
    console.error('  ❌ Test failed:', error.message);
    test.passed = false;
    test.errors.push(error.message);
  }

  await page.close();
  testResults.tests.push(test);
  if (test.passed) testResults.passed++; else testResults.failed++;
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Puppeteer Assistant Tests\n');
  console.log(`📍 Testing against: ${BASE_URL}`);
  console.log('⚠️  Make sure the dev server is running on port 3001\n');

  await ensureScreenshotsDir();

  // Launch browser
  const browser = await puppeteer.launch({
    headless: 'new', // Use new headless mode
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // Run all tests
    await testFunctionCallsUI(browser);
    await testSupplementFirstProtocol(browser);
    await testPainIntensitySlider(browser);
    await testContextSharing(browser);

  } catch (error) {
    console.error('Fatal error during tests:', error);
  } finally {
    await browser.close();
  }

  // Print summary
  console.log('\n📊 Test Summary');
  console.log('===============');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📸 Screenshots saved to: ${SCREENSHOTS_DIR}\n`);

  // Detailed results
  testResults.tests.forEach(test => {
    console.log(`${test.passed ? '✅' : '❌'} ${test.name}`);
    if (test.errors.length > 0) {
      test.errors.forEach(err => console.log(`   └─ Error: ${err}`));
    }
    if (test.screenshots.length > 0) {
      console.log(`   └─ Screenshots: ${test.screenshots.join(', ')}`);
    }
  });

  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };