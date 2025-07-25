const puppeteer = require('puppeteer');

const mockData = {
  thrive_onboarding_complete: 'true',
  thrive_user_name: '"Sarah"',
  thrive_pantry: JSON.stringify([
    { id: 'item-1', name: 'Vitamin D3', brand: 'Nature Made' },
    { id: 'item-2', name: 'Melatonin', brand: 'Nature Made' },
    { id: 'item-3', name: 'Magnesium', brand: 'Pure Encapsulations' }
  ]),
  thrive_thrivings: JSON.stringify([
    {
      id: 'thriving-1',
      title: 'Morning Energy Boost',
      type: 'energy',
      isActive: true,
      createdAt: new Date().toISOString()
    }
  ])
};

async function checkHomeButtons() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: {
      width: 375,
      height: 812,
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2
    }
  });

  const page = await browser.newPage();
  
  // Navigate to home page
  await page.goto('http://localhost:3002');
  
  // Set localStorage to bypass onboarding
  await page.evaluate((data) => {
    Object.keys(data).forEach(key => {
      localStorage.setItem(key, data[key]);
    });
  }, mockData);
  
  // Reload to apply localStorage
  await page.reload({ waitUntil: 'networkidle2' });
  
  // Wait for content and CSS to load
  await page.waitForSelector('button', { visible: true });
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Take screenshot
  await page.screenshot({
    path: 'screenshots/home-with-buttons.png',
    fullPage: true
  });
  
  console.log('Screenshot saved to screenshots/home-with-buttons.png');
  
  // Check CSS variables
  const cssVars = await page.evaluate(() => {
    const computed = getComputedStyle(document.documentElement);
    return {
      primary: computed.getPropertyValue('--primary'),
      secondary: computed.getPropertyValue('--secondary'),
      gradientStart: computed.getPropertyValue('--gradient-start'),
      gradientMid: computed.getPropertyValue('--gradient-mid'),
      gradientEnd: computed.getPropertyValue('--gradient-end'),
      primaryLight: computed.getPropertyValue('--primary-light'),
      secondaryLight: computed.getPropertyValue('--secondary-light'),
      secondaryDark: computed.getPropertyValue('--secondary-dark')
    };
  });
  
  console.log('CSS Variables:', cssVars);
  
  // Check button styles
  const buttonStyles = await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    const styles = [];
    buttons.forEach((button, index) => {
      const computed = getComputedStyle(button);
      styles.push({
        index,
        text: button.textContent?.trim().substring(0, 30),
        background: computed.background,
        backgroundColor: computed.backgroundColor,
        backgroundImage: computed.backgroundImage
      });
    });
    return styles;
  });
  
  console.log('\nButton Styles:');
  buttonStyles.forEach(style => {
    console.log(`Button ${style.index}: "${style.text}"`);
    console.log(`  background: ${style.background}`);
    console.log(`  backgroundImage: ${style.backgroundImage}`);
    console.log('');
  });
  
  // Keep browser open
  console.log('\nBrowser will stay open. Close it manually when done.');
}

checkHomeButtons().catch(console.error);