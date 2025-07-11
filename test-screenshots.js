const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

async function takeScreenshots() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 375, height: 812 } // iPhone X viewport
  });
  const page = await browser.newPage();
  
  // Create screenshots directory
  const screenshotDir = path.join(__dirname, 'test-screenshots');
  await fs.mkdir(screenshotDir, { recursive: true });
  
  try {
    console.log('Navigating to test page...');
    await page.goto('http://localhost:3001/test-functions', { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    
    // Take initial screenshot
    await page.screenshot({ 
      path: path.join(screenshotDir, '01-test-page-initial.png'),
      fullPage: true 
    });
    console.log('✓ Initial screenshot taken');
    
    // Click Setup Test Data button
    console.log('Setting up test data...');
    await page.click('button:has-text("Setup Test Data")');
    await page.waitForTimeout(3000);
    await page.screenshot({ 
      path: path.join(screenshotDir, '02-after-setup.png'),
      fullPage: true 
    });
    console.log('✓ Setup test data screenshot taken');
    
    // Test each function button
    const buttons = [
      { text: 'Test Get Context', filename: '03-get-context' },
      { text: 'Test Get Pantry', filename: '04-get-pantry' },
      { text: 'Test Get Routines', filename: '05-get-routines' },
      { text: 'Test Add to Pantry', filename: '06-add-pantry' },
      { text: 'Test Create Routine', filename: '07-create-routine' },
      { text: 'Test Create Journey', filename: '08-create-journey' }
    ];
    
    for (const button of buttons) {
      console.log(`Testing ${button.text}...`);
      await page.click(`button:has-text("${button.text}")`);
      await page.waitForTimeout(2000);
      await page.screenshot({ 
        path: path.join(screenshotDir, `${button.filename}.png`),
        fullPage: true 
      });
      console.log(`✓ ${button.text} screenshot taken`);
    }
    
    // Navigate to main chat to test assistant flow
    console.log('Testing assistant chat flow...');
    await page.goto('http://localhost:3001/', { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    
    // Test pain journey flow
    await page.type('textarea[placeholder*="wellness"]', 'I have chronic lower back pain');
    await page.screenshot({ 
      path: path.join(screenshotDir, '09-chat-pain-input.png'),
      fullPage: true 
    });
    
    await page.keyboard.press('Enter');
    await page.waitForTimeout(5000); // Wait for AI response
    await page.screenshot({ 
      path: path.join(screenshotDir, '10-chat-pain-response.png'),
      fullPage: true 
    });
    
    // Check if pain intensity slider appears
    const painSlider = await page.$('input[type="range"]');
    if (painSlider) {
      console.log('✓ Pain intensity slider found');
    }
    
    // Test supplement recommendation flow
    await page.reload();
    await page.waitForTimeout(2000);
    await page.type('textarea[placeholder*="wellness"]', 'I want to sleep better');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(5000);
    await page.screenshot({ 
      path: path.join(screenshotDir, '11-chat-sleep-response.png'),
      fullPage: true 
    });
    
    console.log('All tests completed!');
    
  } catch (error) {
    console.error('Error during testing:', error);
    await page.screenshot({ 
      path: path.join(screenshotDir, 'error-screenshot.png'),
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
}

takeScreenshots();