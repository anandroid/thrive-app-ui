const puppeteer = require('puppeteer');

const mockData = {
  thrive_thrivings: JSON.stringify([
    {
      id: 'thriving-1',
      title: 'Morning Energy Boost',
      description: 'A comprehensive morning routine to maximize your energy levels throughout the day',
      type: 'energy',
      isActive: true,
      createdAt: new Date().toISOString(),
      steps: [
        {
          id: 'step-1',
          title: 'Hydrate with Lemon Water',
          description: 'Start your day with warm lemon water to kickstart metabolism',
          time: '06:30',
          duration: 5,
          tips: ['Use fresh lemon juice', 'Add a pinch of sea salt for electrolytes'],
          icon: '💧'
        },
        {
          id: 'step-2',
          title: 'Morning Stretches',
          description: 'Gentle stretching routine to awaken your body',
          time: '06:45',
          duration: 10,
          tips: ['Focus on breathing', 'Start slowly and increase intensity'],
          icon: '🧘'
        },
        {
          id: 'step-3',
          title: 'Energizing Breakfast',
          description: 'Nutrient-dense meal with protein and healthy fats',
          time: '07:00',
          duration: 20,
          tips: ['Include berries for antioxidants', 'Avoid sugary foods'],
          icon: '🥗'
        }
      ]
    }
  ])
};

async function setMockDataAndScreenshot() {
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
  
  // Go to the page
  await page.goto('http://localhost:3000/thrivings');
  
  // Set localStorage
  await page.evaluate((data) => {
    Object.keys(data).forEach(key => {
      localStorage.setItem(key, data[key]);
    });
  }, mockData);
  
  // Reload to apply localStorage
  await page.reload({ waitUntil: 'networkidle2' });
  
  // Wait for content to load
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Take screenshot
  await page.screenshot({
    path: 'screenshots/thrivings-with-data.png',
    fullPage: false
  });
  
  console.log('Screenshot saved to screenshots/thrivings-with-data.png');
  
  // Keep browser open for manual inspection
  console.log('Browser will stay open. Close it manually when done.');
}

setMockDataAndScreenshot().catch(console.error);