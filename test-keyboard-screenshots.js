const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const THRIVE_APP_URL = 'http://localhost:3000'; // Adjust if different
const SCREENSHOTS_DIR = './keyboard-test-screenshots';

async function captureKeyboardScreenshots() {
  // Create screenshots directory
  await fs.mkdir(SCREENSHOTS_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: false, // Set to true for CI
    defaultViewport: {
      width: 390,  // iPhone 12/13/14 width
      height: 844, // iPhone 12/13/14 height
      isMobile: true,
      hasTouch: true,
    },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Set user agent to simulate WebView
  await page.setUserAgent('thrive-app/1.0 ReactNative Android');

  console.log('Navigating to app...');
  await page.goto(THRIVE_APP_URL, { waitUntil: 'networkidle2' });
  
  // Wait for app to load
  await page.waitForTimeout(2000);

  // Test 1: Home page with input
  console.log('Testing home page input...');
  
  // Take screenshot before keyboard
  await page.screenshot({ 
    path: path.join(SCREENSHOTS_DIR, '01-home-before-keyboard.png'),
    fullPage: false 
  });

  // Find and click on an input field (adjust selector as needed)
  const inputSelector = 'input[type="text"], textarea';
  await page.waitForSelector(inputSelector, { timeout: 5000 });
  
  // Simulate keyboard appearance by injecting the message
  await page.evaluate(() => {
    window.postMessage(JSON.stringify({
      type: 'keyboard_height_changed',
      payload: { height: 300, visible: true }
    }), '*');
  });

  // Wait for animation
  await page.waitForTimeout(500);

  // Take screenshot with keyboard
  await page.screenshot({ 
    path: path.join(SCREENSHOTS_DIR, '02-home-with-keyboard.png'),
    fullPage: false 
  });

  // Highlight the action bar to show it didn't move
  await page.evaluate(() => {
    const actionBar = document.querySelector('.action-bar');
    if (actionBar) {
      actionBar.style.outline = '3px solid red';
      actionBar.style.outlineOffset = '-3px';
    }
  });

  await page.screenshot({ 
    path: path.join(SCREENSHOTS_DIR, '03-home-keyboard-actionbar-highlighted.png'),
    fullPage: false 
  });

  // Test 2: Chat page
  console.log('Testing chat page...');
  
  // Navigate to chat
  await page.goto(`${THRIVE_APP_URL}/chat/new`, { waitUntil: 'networkidle2' });
  await page.waitForTimeout(2000);

  // Before keyboard
  await page.screenshot({ 
    path: path.join(SCREENSHOTS_DIR, '04-chat-before-keyboard.png'),
    fullPage: false 
  });

  // Simulate keyboard
  await page.evaluate(() => {
    window.postMessage(JSON.stringify({
      type: 'keyboard_height_changed',
      payload: { height: 300, visible: true }
    }), '*');
  });

  await page.waitForTimeout(500);

  // With keyboard
  await page.screenshot({ 
    path: path.join(SCREENSHOTS_DIR, '05-chat-with-keyboard.png'),
    fullPage: false 
  });

  // Test 3: Modal with input
  console.log('Testing modal with keyboard...');
  
  // Go to pantry page which has modals
  await page.goto(`${THRIVE_APP_URL}/pantry`, { waitUntil: 'networkidle2' });
  await page.waitForTimeout(2000);

  // Click add button to open modal (adjust selector)
  const addButtonSelector = 'button:has-text("Add"), button:has-text("add")';
  try {
    await page.click(addButtonSelector);
    await page.waitForTimeout(1000);

    // Modal before keyboard
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, '06-modal-before-keyboard.png'),
      fullPage: false 
    });

    // Simulate keyboard in modal
    await page.evaluate(() => {
      window.postMessage(JSON.stringify({
        type: 'keyboard_height_changed',
        payload: { height: 300, visible: true }
      }), '*');
    });

    await page.waitForTimeout(500);

    // Modal with keyboard
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, '07-modal-with-keyboard.png'),
      fullPage: false 
    });
  } catch (e) {
    console.log('Could not open modal, skipping modal test');
  }

  // Hide keyboard
  await page.evaluate(() => {
    window.postMessage(JSON.stringify({
      type: 'keyboard_height_changed',
      payload: { height: 0, visible: false }
    }), '*');
  });

  console.log(`Screenshots saved to ${SCREENSHOTS_DIR}`);
  console.log('\nTest Summary:');
  console.log('- Check if action bar stays at top in all screenshots');
  console.log('- Verify main content shifts up when keyboard appears');
  console.log('- Ensure inputs are visible above keyboard');

  await browser.close();
}

// Run the test
captureKeyboardScreenshots().catch(console.error);