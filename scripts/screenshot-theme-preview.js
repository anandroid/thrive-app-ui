const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function captureScreenshots() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // Ensure screenshots directory exists
    const screenshotsDir = path.join(__dirname, '..', 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    // Mobile viewport screenshots
    const mobilePage = await browser.newPage();
    await mobilePage.setViewport({ width: 390, height: 844 });
    
    const htmlPath = `file://${path.join(__dirname, '..', 'thrivings-preview.html')}`;
    console.log('Loading preview from:', htmlPath);
    
    await mobilePage.goto(htmlPath, { waitUntil: 'networkidle0' });
    
    // Wait for any animations to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Screenshot 1: Full thrivings cards view (mobile)
    console.log('Capturing mobile thrivings cards view...');
    await mobilePage.screenshot({
      path: path.join(screenshotsDir, 'purple-pink-theme-mobile-cards.png'),
      fullPage: false
    });
    
    // Screenshot 2: Scroll to Daily Rituals section
    console.log('Scrolling to Daily Rituals section...');
    await mobilePage.evaluate(() => {
      const ritualSection = document.querySelector('h2');
      if (ritualSection) {
        ritualSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await mobilePage.screenshot({
      path: path.join(screenshotsDir, 'purple-pink-theme-mobile-rituals.png'),
      fullPage: false
    });
    
    // Screenshot 3: Full page mobile view
    console.log('Capturing full mobile page...');
    await mobilePage.screenshot({
      path: path.join(screenshotsDir, 'purple-pink-theme-mobile-full.png'),
      fullPage: true
    });
    
    // Screenshot 4: Capture hover state on a button
    console.log('Capturing button hover state...');
    const buttons = await mobilePage.$$('button');
    if (buttons.length > 0) {
      await buttons[0].hover();
      await new Promise(resolve => setTimeout(resolve, 500));
      await mobilePage.screenshot({
        path: path.join(screenshotsDir, 'purple-pink-theme-mobile-hover.png'),
        fullPage: false
      });
    }
    
    // Desktop viewport screenshots
    const desktopPage = await browser.newPage();
    await desktopPage.setViewport({ width: 1400, height: 900 });
    
    await desktopPage.goto(htmlPath, { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Screenshot 5: Desktop view
    console.log('Capturing desktop view...');
    await desktopPage.screenshot({
      path: path.join(screenshotsDir, 'purple-pink-theme-desktop.png'),
      fullPage: false
    });
    
    // Screenshot 6: Desktop full page
    console.log('Capturing full desktop page...');
    await desktopPage.screenshot({
      path: path.join(screenshotsDir, 'purple-pink-theme-desktop-full.png'),
      fullPage: true
    });
    
    // Screenshot 7: Desktop with hover on card
    console.log('Capturing desktop card hover state...');
    const cards = await desktopPage.$$('.thrive-card');
    if (cards.length > 0) {
      await cards[0].hover();
      await new Promise(resolve => setTimeout(resolve, 500));
      await desktopPage.screenshot({
        path: path.join(screenshotsDir, 'purple-pink-theme-desktop-card-hover.png'),
        fullPage: false
      });
    }
    
    console.log('\n✅ Screenshots captured successfully!');
    console.log('\nScreenshots saved to:');
    console.log('- purple-pink-theme-mobile-cards.png (390x844)');
    console.log('- purple-pink-theme-mobile-rituals.png (390x844)');
    console.log('- purple-pink-theme-mobile-full.png (390x full height)');
    console.log('- purple-pink-theme-mobile-hover.png (390x844 with button hover)');
    console.log('- purple-pink-theme-desktop.png (1400x900)');
    console.log('- purple-pink-theme-desktop-full.png (1400x full height)');
    console.log('- purple-pink-theme-desktop-card-hover.png (1400x900 with card hover)');
    
  } catch (error) {
    console.error('Error capturing screenshots:', error);
  } finally {
    await browser.close();
  }
}

// Run the screenshot capture
captureScreenshots().catch(console.error);