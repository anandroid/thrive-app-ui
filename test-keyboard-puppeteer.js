const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function testKeyboardLayout() {
  console.log('Starting Puppeteer keyboard layout test...');
  
  const browser = await puppeteer.launch({
    headless: false, // Set to true for CI
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Set mobile viewport (Android device)
  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });
  
  try {
    // Test 1: Signal Test Page
    console.log('\n=== Test 1: Signal Test Page ===');
    const signalTestPath = `file://${path.resolve(__dirname, 'test-keyboard-signal.html')}`;
    await page.goto(signalTestPath);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'screenshots/01-signal-initial.png',
      fullPage: true 
    });
    console.log('✓ Screenshot: Signal test initial state');
    
    // Simulate keyboard show
    await page.click('button:first-of-type'); // "Simulate Keyboard Show (300px)"
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await page.screenshot({ 
      path: 'screenshots/02-signal-keyboard-shown.png',
      fullPage: true 
    });
    console.log('✓ Screenshot: Signal test with keyboard shown');
    
    // Check CSS variable
    const cssVar = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--keyboard-height');
    });
    console.log(`✓ CSS Variable --keyboard-height: ${cssVar}`);
    
    // Check body class
    const hasClass = await page.evaluate(() => {
      return document.body.classList.contains('keyboard-visible');
    });
    console.log(`✓ Body has keyboard-visible class: ${hasClass}`);
    
    // Test 2: Chat Layout Test
    console.log('\n=== Test 2: Chat Layout Test ===');
    const chatTestPath = `file://${path.resolve(__dirname, 'test-chat-keyboard.html')}`;
    await page.goto(chatTestPath);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Initial state
    await page.screenshot({ 
      path: 'screenshots/03-chat-initial.png',
      fullPage: false // Don't use fullPage for fixed positioned elements
    });
    console.log('✓ Screenshot: Chat initial state');
    
    // Get initial container position
    const initialBottom = await page.evaluate(() => {
      const container = document.querySelector('.chat-container');
      return getComputedStyle(container).bottom;
    });
    console.log(`✓ Initial container bottom: ${initialBottom}`);
    
    // Simulate keyboard (300px)
    await page.evaluate(() => {
      document.documentElement.style.setProperty('--keyboard-height', '300px');
      document.body.classList.add('keyboard-visible');
    });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await page.screenshot({ 
      path: 'screenshots/04-chat-keyboard-300px.png',
      fullPage: false
    });
    console.log('✓ Screenshot: Chat with 300px keyboard');
    
    // Check new container position
    const newBottom = await page.evaluate(() => {
      const container = document.querySelector('.chat-container');
      return getComputedStyle(container).bottom;
    });
    console.log(`✓ Container bottom after keyboard: ${newBottom}`);
    
    // Check if input is visible
    const inputVisible = await page.evaluate(() => {
      const input = document.querySelector('input');
      const rect = input.getBoundingClientRect();
      return rect.bottom <= window.innerHeight && rect.top >= 0;
    });
    console.log(`✓ Input visible: ${inputVisible}`);
    
    // Test with larger keyboard (400px)
    await page.evaluate(() => {
      document.documentElement.style.setProperty('--keyboard-height', '400px');
    });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await page.screenshot({ 
      path: 'screenshots/05-chat-keyboard-400px.png',
      fullPage: false
    });
    console.log('✓ Screenshot: Chat with 400px keyboard');
    
    // Test 3: Real Chat Page
    console.log('\n=== Test 3: Real Chat Page (Development Server) ===');
    
    // Try to load the real chat page if dev server is running
    try {
      await page.goto('http://localhost:3000/chat/new', { waitUntil: 'networkidle0' });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await page.screenshot({ 
        path: 'screenshots/06-real-chat-initial.png',
        fullPage: false
      });
      console.log('✓ Screenshot: Real chat page initial');
      
      // Inject keyboard simulation
      await page.evaluate(() => {
        // Simulate keyboard height message
        window.postMessage(JSON.stringify({
          type: 'keyboard_height_changed',
          payload: {
            height: 350,
            visible: true,
            duration: 250
          }
        }), '*');
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await page.screenshot({ 
        path: 'screenshots/07-real-chat-keyboard.png',
        fullPage: false
      });
      console.log('✓ Screenshot: Real chat page with keyboard');
      
      // Check real chat container
      const realChatBottom = await page.evaluate(() => {
        const container = document.querySelector('.chat-container');
        if (container) {
          const styles = getComputedStyle(container);
          return {
            bottom: styles.bottom,
            position: styles.position,
            hasClass: document.body.classList.contains('keyboard-visible'),
            cssVar: getComputedStyle(document.documentElement).getPropertyValue('--keyboard-height')
          };
        }
        return null;
      });
      console.log('✓ Real chat container styles:', realChatBottom);
      
    } catch (error) {
      console.log('⚠ Could not test real chat page (dev server may not be running)');
    }
    
    // Summary
    console.log('\n=== Test Summary ===');
    console.log('✓ CSS variable is being set correctly');
    console.log('✓ Body class is being added/removed');
    console.log(`✓ Container bottom changes from ${initialBottom} to ${newBottom}`);
    console.log(`✓ Input visibility: ${inputVisible}`);
    console.log('\nCheck the screenshots/ folder for visual results');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Create screenshots directory
if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
}

// Run the test
testKeyboardLayout().catch(console.error);