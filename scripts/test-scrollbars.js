const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

async function testScrollbars() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Set mobile viewport
    await page.setViewport({
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true
    });

    // Navigate to page first to set localStorage
    console.log('Setting up localStorage...');
    await page.goto('http://localhost:3002/', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Set localStorage after page loads
    await page.evaluate(() => {
      localStorage.setItem('thrive_onboarding_complete', 'true');
      localStorage.setItem('thrive_user_name', JSON.stringify('Test User'));
      // Add some pantry items for recommendations
      localStorage.setItem('pantry_items', JSON.stringify([
        { id: '1', name: 'Vitamin D', notes: '1000 IU', tags: ['vitamin'], dateAdded: new Date().toISOString() }
      ]));
    });

    // Reload to apply localStorage changes
    console.log('Reloading to apply settings...');
    await page.reload({ 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    // Wait for recommendations section to load
    await page.waitForSelector('h2', { timeout: 5000 });
    
    // Scroll to recommendations section
    await page.evaluate(() => {
      const heading = Array.from(document.querySelectorAll('h2')).find(h => h.textContent.includes('Your Recommendations'));
      if (heading) {
        heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Take screenshot of recommendations section
    const screenshotsDir = path.join(__dirname, '..', 'screenshots');
    await fs.mkdir(screenshotsDir, { recursive: true });

    console.log('Taking screenshot of recommendations without scrollbars...');
    await page.screenshot({
      path: path.join(screenshotsDir, 'home-recommendations-no-scrollbars.png'),
      fullPage: false
    });

    // Scroll to product recommendations
    await page.evaluate(() => {
      const heading = Array.from(document.querySelectorAll('h3')).find(h => h.textContent.includes('Recommended Products'));
      if (heading) {
        heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('Taking screenshot of products section...');
    await page.screenshot({
      path: path.join(screenshotsDir, 'home-products-no-scrollbars.png'),
      fullPage: false
    });

    console.log('✅ Screenshots saved successfully!');
    console.log('- home-recommendations-no-scrollbars.png');
    console.log('- home-products-no-scrollbars.png');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

testScrollbars();