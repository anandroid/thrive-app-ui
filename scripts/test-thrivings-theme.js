const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Mock thrivings data with purple-pink theme
const mockThrivings = [
  {
    id: 'thriving-1',
    title: 'Better Sleep & Recovery',
    description: 'A comprehensive routine to improve your sleep quality and morning recovery',
    type: 'sleep',
    isActive: true,
    createdAt: new Date().toISOString(),
    steps: [
      {
        id: 'step-1',
        title: 'Wind Down Routine',
        description: 'Start dimming lights and reducing screen time',
        time: '21:00',
        duration: 30,
        tips: ['Use blue light filters', 'Try reading a book', 'Practice gentle stretches'],
        completed: false
      },
      {
        id: 'step-2',
        title: 'Evening Supplements',
        description: 'Take your sleep support supplements',
        time: '21:30',
        duration: 5,
        tips: ['Take with water', 'Avoid heavy meals'],
        completed: false
      },
      {
        id: 'step-3',
        title: 'Bedtime Meditation',
        description: 'Practice calming breathing or meditation',
        time: '22:00',
        duration: 15,
        tips: ['Use a meditation app', 'Focus on breathing'],
        completed: false
      }
    ],
    additionalRecommendations: [
      { title: 'Blackout curtains', description: 'Block all light for deeper sleep' },
      { title: 'White noise machine', description: 'Maintain consistent background sound' }
    ],
    proTips: [
      'Keep your bedroom temperature between 60-67°F',
      'Avoid caffeine after 2 PM'
    ],
    reminderTimes: ['21:00', '21:30', '22:00']
  },
  {
    id: 'thriving-2',
    title: 'Morning Energy Boost',
    description: 'Start your day with sustained energy and focus',
    type: 'energy',
    isActive: true,
    createdAt: new Date().toISOString(),
    steps: [
      {
        id: 'step-1',
        title: 'Morning Hydration',
        description: 'Drink 16oz of water upon waking',
        time: '06:30',
        duration: 5,
        tips: ['Add lemon for vitamin C', 'Room temperature is best'],
        completed: true
      },
      {
        id: 'step-2',
        title: 'Energy Supplements',
        description: 'Take your morning vitamins and supplements',
        time: '07:00',
        duration: 5,
        tips: ['Take with breakfast', 'Include B-complex vitamins'],
        completed: false
      }
    ],
    reminderTimes: ['06:30', '07:00']
  },
  {
    id: 'thriving-3',
    title: 'Stress Relief Practice',
    description: 'Daily practices to manage stress and anxiety',
    type: 'stress',
    isActive: false,
    createdAt: new Date().toISOString(),
    steps: [
      {
        id: 'step-1',
        title: 'Midday Breathing',
        description: 'Take 5 minutes for deep breathing exercises',
        time: '14:00',
        duration: 5,
        tips: ['4-7-8 breathing technique', 'Find a quiet space'],
        completed: false
      }
    ],
    reminderTimes: ['14:00']
  }
];

async function testThrivingsTheme() {
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

    // Set localStorage before navigation
    await page.evaluateOnNewDocument((thrivings) => {
      localStorage.setItem('thrivings', JSON.stringify(thrivings));
      localStorage.setItem('thrive_onboarding_complete', 'true');
      localStorage.setItem('thrive_user_name', JSON.stringify('Test User'));
    }, mockThrivings);

    console.log('Navigating to thrivings page...');
    await page.goto('http://localhost:3002/thrivings', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Take screenshot of cards view
    const screenshotsDir = path.join(__dirname, '..', 'screenshots');
    await fs.mkdir(screenshotsDir, { recursive: true });

    console.log('Taking screenshot of thrivings cards...');
    await page.screenshot({
      path: path.join(screenshotsDir, 'thrivings-purple-theme.png'),
      fullPage: false
    });

    // Click on first card to see detail view
    try {
      await page.click('.thriving-card:first-child');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Taking screenshot of thriving detail...');
      await page.screenshot({
        path: path.join(screenshotsDir, 'thrivings-detail-purple-theme.png'),
        fullPage: true
      });
    } catch (e) {
      console.log('Could not click on card:', e.message);
    }

    console.log('✅ Screenshots saved successfully!');
    console.log('- thrivings-purple-theme.png');
    console.log('- thrivings-detail-purple-theme.png');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

testThrivingsTheme();