const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

async function testNewColors() {
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
        { id: '1', name: 'Vitamin D', notes: '1000 IU', tags: ['vitamin'], dateAdded: new Date().toISOString() },
        { id: '2', name: 'Magnesium', notes: '400mg', tags: ['mineral'], dateAdded: new Date().toISOString() }
      ]));
      // Add some thrivings for testing
      localStorage.setItem('thrivings', JSON.stringify([
        {
          id: 'thriving-1',
          title: 'Better Sleep & Recovery',
          description: 'A comprehensive routine to improve your sleep quality',
          type: 'sleep',
          isActive: true,
          createdAt: new Date().toISOString(),
          steps: [
            {
              id: 'step-1',
              title: 'Wind Down Routine',
              description: 'Start dimming lights',
              time: '21:00',
              duration: 30,
              completed: false
            }
          ]
        }
      ]));
    });

    // Reload to apply localStorage changes
    console.log('Reloading to apply settings...');
    await page.reload({ 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    // Take screenshots
    const screenshotsDir = path.join(__dirname, '..', 'screenshots');
    await fs.mkdir(screenshotsDir, { recursive: true });

    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Screenshot 1: Home page with new colors
    console.log('Taking screenshot of home page...');
    await page.screenshot({
      path: path.join(screenshotsDir, 'home-bright-vitality-colors.png'),
      fullPage: false
    });

    // Scroll to recommendations
    await page.evaluate(() => {
      const heading = Array.from(document.querySelectorAll('h2')).find(h => h.textContent.includes('Your Recommendations'));
      if (heading) {
        heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Screenshot 2: Recommendations without gradients
    console.log('Taking screenshot of recommendations...');
    await page.screenshot({
      path: path.join(screenshotsDir, 'recommendations-no-gradients.png'),
      fullPage: false
    });

    // Scroll to products
    await page.evaluate(() => {
      const heading = Array.from(document.querySelectorAll('h3')).find(h => h.textContent.includes('Recommended Products'));
      if (heading) {
        heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Screenshot 3: Products section
    console.log('Taking screenshot of products...');
    await page.screenshot({
      path: path.join(screenshotsDir, 'products-solid-colors.png'),
      fullPage: false
    });

    // Scroll to CTA
    await page.evaluate(() => {
      const button = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Ask Wellness Companion'));
      if (button) {
        button.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Screenshot 4: CTA with gradient
    console.log('Taking screenshot of CTA...');
    await page.screenshot({
      path: path.join(screenshotsDir, 'cta-gradient-button.png'),
      fullPage: false
    });

    console.log('✅ Screenshots saved successfully!');
    console.log('- home-bright-vitality-colors.png');
    console.log('- recommendations-no-gradients.png');
    console.log('- products-solid-colors.png');
    console.log('- cta-gradient-button.png');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

testNewColors();