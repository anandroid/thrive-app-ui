const puppeteer = require('puppeteer');

// Mock data for localStorage
const mockData = {
  thrive_thrivings: JSON.stringify([
    {
      id: 'thriving-1',
      title: 'Better Sleep & Recovery',
      description: 'A comprehensive evening routine designed to improve your sleep quality and morning energy levels through proven relaxation techniques and optimal sleep hygiene practices.',
      type: 'sleep_wellness',
      isActive: true,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      duration: '30_days',
      frequency: 'daily',
      version: '1.0',
      steps: [
        {
          id: 'step-1',
          title: 'Digital Sunset',
          description: 'Turn off all screens and devices to signal your brain it\'s time to wind down.',
          time: '21:00',
          duration: 15,
          tips: ['Use blue light filters if you must use devices', 'Set a gentle reminder alarm'],
          icon: '📱',
          order: 1,
          reminderEnabled: true
        },
        {
          id: 'step-2',
          title: 'Calming Tea Ritual',
          description: 'Prepare and enjoy a cup of chamomile or passionflower tea.',
          time: '21:15',
          duration: 10,
          tips: ['Avoid caffeinated teas', 'Add a touch of honey for sweetness'],
          icon: '☕',
          order: 2,
          reminderEnabled: true
        },
        {
          id: 'step-3',
          title: 'Gentle Stretching',
          description: 'Do light stretches focusing on neck, shoulders, and lower back.',
          time: '21:30',
          duration: 15,
          tips: ['Keep movements slow and gentle', 'Focus on deep breathing'],
          icon: '🧘',
          order: 3,
          reminderEnabled: true,
          will_video_tutorial_help: true
        }
      ],
      additionalRecommendations: [
        {
          title: 'Magnesium Glycinate Supplement',
          description: 'Take 200-400mg before bed to support muscle relaxation and deeper sleep.',
          frequency: 'daily',
          tips: ['Start with lower dose', 'Take 30 minutes before bed']
        }
      ],
      proTips: [
        'Consistency is key - try to sleep and wake at the same time daily',
        'Avoid large meals 3 hours before bedtime'
      ],
      reminderTimes: ['21:00', '21:15', '21:30'],
      notificationSettings: {
        enabledWeekdays: true,
        enabledWeekends: true
      },
      completedDates: []
    },
    {
      id: 'thriving-2',
      title: 'Morning Energy & Focus',
      description: 'Start your day with intention and energy through mindful morning practices.',
      type: 'mental_wellness',
      isActive: true,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      duration: '14_days',
      frequency: 'daily',
      version: '1.0',
      steps: [
        {
          id: 'step-1',
          title: 'Hydrate First Thing',
          description: 'Drink 16-20oz of room temperature water with lemon.',
          time: '07:00',
          duration: 5,
          tips: ['Add a pinch of sea salt for electrolytes'],
          icon: '💧',
          order: 1,
          reminderEnabled: true
        },
        {
          id: 'step-2',
          title: 'Morning Movement',
          description: 'Get your blood flowing with 10 minutes of light exercise.',
          time: '07:15',
          duration: 10,
          tips: ['Start gentle and increase intensity gradually'],
          icon: '🏃',
          order: 2,
          reminderEnabled: true
        }
      ],
      additionalRecommendations: [],
      proTips: ['Avoid checking phone for first 30 minutes after waking'],
      reminderTimes: ['07:00', '07:15'],
      notificationSettings: {
        enabledWeekdays: true,
        enabledWeekends: false
      },
      completedDates: []
    },
    {
      id: 'thriving-3',
      title: 'Stress Relief & Calm',
      description: 'Manage daily stress and anxiety through proven techniques.',
      type: 'stress_management',
      isActive: false,
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      duration: 'ongoing',
      frequency: 'twice_daily',
      version: '1.0',
      steps: [
        {
          id: 'step-1',
          title: 'Midday Breathing Break',
          description: 'Take 5 minutes to practice deep breathing exercises.',
          time: '12:00',
          duration: 5,
          tips: ['Find a quiet spot', 'Try box breathing (4-4-4-4)'],
          icon: '🌬️',
          order: 1,
          reminderEnabled: true
        }
      ],
      additionalRecommendations: ['L-Theanine supplement for calm focus'],
      proTips: ['Practice the STOP technique: Stop, Take a breath, Observe, Proceed'],
      reminderTimes: ['12:00'],
      notificationSettings: {
        enabledWeekdays: true,
        enabledWeekends: true
      },
      completedDates: []
    }
  ]),
  hasCompletedOnboarding: 'true',
  userName: 'Sarah',
  notificationPermissionGranted: 'true'
};

async function takeScreenshot() {
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
  
  try {
    // First go to home page to set localStorage
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
    
    // Wait for app to load
    await page.waitForSelector('body', { timeout: 5000 });
    
    // Set localStorage
    await page.evaluate((data) => {
      Object.keys(data).forEach(key => {
        localStorage.setItem(key, data[key]);
      });
    }, mockData);
    
    // Navigate to thrivings page
    await page.goto('http://localhost:3000/thrivings', { waitUntil: 'networkidle2' });
    
    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take screenshot
    await page.screenshot({
      path: 'screenshots/thrivings-with-mock-data.png',
      fullPage: false
    });
    
    console.log('Screenshot saved to screenshots/thrivings-with-mock-data.png');
    
    // Also take a full page screenshot
    await page.screenshot({
      path: 'screenshots/thrivings-full-page.png',
      fullPage: true
    });
    
    console.log('Full page screenshot saved to screenshots/thrivings-full-page.png');
    
  } catch (error) {
    console.error('Error taking screenshot:', error);
  }
  
  // Keep browser open for manual inspection
  console.log('Browser will stay open. Close it manually when done.');
}

takeScreenshot().catch(console.error);