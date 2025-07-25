const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

// Mock data for localStorage
const mockData = {
  // Thrivings data
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
          description: 'Turn off all screens and devices to signal your brain it\'s time to wind down. This reduces blue light exposure and mental stimulation.',
          time: '21:00',
          duration: 15,
          tips: ['Use blue light filters if you must use devices', 'Set a gentle reminder alarm', 'Replace screen time with reading or journaling'],
          icon: '📱',
          order: 1,
          reminderEnabled: true,
          reminderText: 'Time for your digital sunset! Let\'s prepare your mind for restful sleep 🌙'
        },
        {
          id: 'step-2',
          title: 'Calming Tea Ritual',
          description: 'Prepare and enjoy a cup of chamomile or passionflower tea. The warmth and herbs help relax your nervous system.',
          time: '21:15',
          duration: 10,
          tips: ['Avoid caffeinated teas', 'Add a touch of honey for sweetness', 'Make this a mindful moment'],
          icon: '☕',
          order: 2,
          reminderEnabled: true
        },
        {
          id: 'step-3',
          title: 'Gentle Stretching',
          description: 'Do light stretches focusing on neck, shoulders, and lower back to release physical tension from the day.',
          time: '21:30',
          duration: 15,
          tips: ['Keep movements slow and gentle', 'Focus on deep breathing', 'Try child\'s pose or legs up the wall'],
          icon: '🧘',
          order: 3,
          reminderEnabled: true,
          will_video_tutorial_help: true
        },
        {
          id: 'step-4',
          title: 'Sleep Environment Prep',
          description: 'Dim lights, set room temperature to 65-68°F, and ensure your bedroom is quiet and comfortable.',
          time: '21:45',
          duration: 10,
          tips: ['Use blackout curtains', 'Consider white noise if needed', 'Keep phone out of reach'],
          icon: '🛏️',
          order: 4,
          reminderEnabled: true
        },
        {
          id: 'step-5',
          title: 'Bedtime Meditation',
          description: 'Practice a guided sleep meditation or breathing exercise to calm your mind and prepare for sleep.',
          time: '22:00',
          duration: 10,
          tips: ['Try 4-7-8 breathing technique', 'Use a meditation app if helpful', 'Focus on gratitude'],
          icon: '😴',
          order: 5,
          reminderEnabled: true,
          videoUrl: 'https://www.youtube.com/watch?v=sleep-meditation'
        }
      ],
      additionalRecommendations: [
        {
          title: 'Magnesium Glycinate Supplement',
          description: 'Take 200-400mg before bed to support muscle relaxation and deeper sleep.',
          frequency: 'daily',
          tips: ['Start with lower dose', 'Take 30 minutes before bed', 'Consult healthcare provider first']
        },
        {
          title: 'Sleep-Friendly Bedroom Setup',
          description: 'Optimize your sleep environment with proper bedding, temperature control, and darkness.',
          frequency: 'one_time',
          tips: ['Invest in comfortable pillows', 'Use breathable bedding materials', 'Consider a white noise machine']
        }
      ],
      proTips: [
        'Consistency is key - try to sleep and wake at the same time daily',
        'Avoid large meals 3 hours before bedtime',
        'If you can\'t fall asleep after 20 minutes, get up and do a quiet activity until sleepy',
        'Keep a sleep journal to track what works best for you'
      ],
      reminderTimes: ['21:00', '21:15', '21:30', '21:45', '22:00'],
      notificationSettings: {
        enabledWeekdays: true,
        enabledWeekends: true
      },
      completedDates: []
    },
    {
      id: 'thriving-2',
      title: 'Morning Energy & Focus',
      description: 'Start your day with intention and energy through mindful morning practices that boost mental clarity and physical vitality.',
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
          description: 'Drink 16-20oz of room temperature water with lemon to rehydrate and kickstart your metabolism.',
          time: '07:00',
          duration: 5,
          tips: ['Add a pinch of sea salt for electrolytes', 'Use fresh lemon juice', 'Keep water by your bedside'],
          icon: '💧',
          order: 1,
          reminderEnabled: true
        },
        {
          id: 'step-2',
          title: 'Morning Movement',
          description: 'Get your blood flowing with 10 minutes of light exercise - stretching, yoga, or a short walk.',
          time: '07:15',
          duration: 10,
          tips: ['Start gentle and increase intensity gradually', 'Open windows for fresh air', 'Play energizing music'],
          icon: '🏃',
          order: 2,
          reminderEnabled: true,
          will_video_tutorial_help: true
        },
        {
          id: 'step-3',
          title: 'Mindful Breakfast',
          description: 'Eat a balanced breakfast with protein, healthy fats, and complex carbs. No rushing!',
          time: '07:30',
          duration: 20,
          tips: ['Prep ingredients night before', 'Include colorful fruits/veggies', 'Avoid sugary cereals'],
          icon: '🥗',
          order: 3,
          reminderEnabled: true
        }
      ],
      additionalRecommendations: [
        {
          title: 'Light Therapy Lamp',
          description: 'Use for 20-30 minutes in the morning to regulate circadian rhythm and boost mood.',
          frequency: 'daily',
          tips: ['Use within first hour of waking', 'Position 16-24 inches from face', 'Start with 15 minutes']
        }
      ],
      proTips: [
        'Avoid checking phone for first 30 minutes after waking',
        'Set out clothes and prep breakfast the night before',
        'Create a morning playlist that energizes you'
      ],
      reminderTimes: ['07:00', '07:15', '07:30'],
      notificationSettings: {
        enabledWeekdays: true,
        enabledWeekends: false
      },
      completedDates: []
    },
    {
      id: 'thriving-3',
      title: 'Stress Relief & Calm',
      description: 'Manage daily stress and anxiety through proven techniques that help you stay centered and peaceful throughout your day.',
      type: 'stress_management',
      isActive: false, // This one is paused
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      duration: 'ongoing',
      frequency: 'twice_daily',
      version: '1.0',
      steps: [
        {
          id: 'step-1',
          title: 'Midday Breathing Break',
          description: 'Take 5 minutes to practice deep breathing exercises to reset your nervous system.',
          time: '12:00',
          duration: 5,
          tips: ['Find a quiet spot', 'Try box breathing (4-4-4-4)', 'Close your eyes if comfortable'],
          icon: '🌬️',
          order: 1,
          reminderEnabled: true
        },
        {
          id: 'step-2',
          title: 'Evening Wind-Down',
          description: 'Journal about your day, focusing on gratitude and releasing any tension or worries.',
          time: '20:00',
          duration: 15,
          tips: ['Write 3 things you\'re grateful for', 'Don\'t judge your thoughts', 'Keep journal by bedside'],
          icon: '📝',
          order: 2,
          reminderEnabled: true
        }
      ],
      additionalRecommendations: [
        'L-Theanine supplement for calm focus',
        'Essential oil diffuser with lavender',
        'Stress-relief herbal tea blend'
      ],
      proTips: [
        'Practice the STOP technique: Stop, Take a breath, Observe, Proceed',
        'Set boundaries with work emails after hours',
        'Schedule regular "worry time" to process concerns'
      ],
      reminderTimes: ['12:00', '20:00'],
      notificationSettings: {
        enabledWeekdays: true,
        enabledWeekends: true
      },
      completedDates: []
    }
  ]),

  // Pantry items
  thrive_pantry: JSON.stringify([
    {
      id: 'item-1',
      name: 'Vitamin D3',
      brand: 'Nature Made',
      category: 'vitamins',
      dosage: '2000 IU',
      timing: 'Morning with breakfast',
      notes: 'For immune support and mood',
      dateAdded: new Date().toISOString()
    },
    {
      id: 'item-2',
      name: 'Omega-3 Fish Oil',
      brand: 'Nordic Naturals',
      category: 'supplements',
      dosage: '1000mg EPA/DHA',
      timing: 'With meals',
      notes: 'For heart and brain health',
      dateAdded: new Date().toISOString()
    },
    {
      id: 'item-3',
      name: 'Probiotics',
      brand: 'Garden of Life',
      category: 'supplements',
      dosage: '50 billion CFU',
      timing: 'Empty stomach',
      notes: 'For gut health',
      dateAdded: new Date().toISOString()
    },
    {
      id: 'item-4',
      name: 'Ashwagandha',
      brand: 'Gaia Herbs',
      category: 'herbs',
      dosage: '600mg',
      timing: 'Evening',
      notes: 'For stress management',
      dateAdded: new Date().toISOString()
    },
    {
      id: 'item-5',
      name: 'Turmeric Curcumin',
      brand: 'Thorne',
      category: 'supplements',
      dosage: '500mg',
      timing: 'With meals',
      notes: 'Anti-inflammatory',
      dateAdded: new Date().toISOString()
    }
  ]),

  // User preferences
  hasCompletedOnboarding: 'true',
  userName: 'Sarah',
  notificationPermissionGranted: 'true'
};

async function takeScreenshots() {
  const browser = await puppeteer.launch({
    headless: 'new', // Use new headless mode
    defaultViewport: {
      width: 375,
      height: 812,
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2
    }
  });

  const page = await browser.newPage();

  // Create screenshots directory
  const screenshotsDir = path.join(__dirname, '../screenshots');
  await fs.mkdir(screenshotsDir, { recursive: true });

  // Navigate to the page first
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  
  // Set localStorage after navigation
  await page.evaluate((mockData) => {
    Object.keys(mockData).forEach(key => {
      localStorage.setItem(key, mockData[key]);
    });
  }, mockData);

  // Pages to screenshot
  const pages = [
    { name: 'home', url: 'http://localhost:3000/' },
    { name: 'thrivings', url: 'http://localhost:3000/thrivings' },
    { name: 'thrivings-detail', url: 'http://localhost:3000/thrivings?id=thriving-1' },
    { name: 'discover', url: 'http://localhost:3000/discover' },
    { name: 'pantry', url: 'http://localhost:3000/pantry' },
    { name: 'settings', url: 'http://localhost:3000/settings' }
  ];

  for (const pageInfo of pages) {
    console.log(`Taking screenshot of ${pageInfo.name}...`);
    
    await page.goto(pageInfo.url, { waitUntil: 'networkidle2' });
    
    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take full page screenshot
    await page.screenshot({
      path: path.join(screenshotsDir, `${pageInfo.name}.png`),
      fullPage: true
    });
    
    // Also take viewport screenshot
    await page.screenshot({
      path: path.join(screenshotsDir, `${pageInfo.name}-viewport.png`),
      fullPage: false
    });
  }

  // Take some interaction screenshots
  console.log('Taking interaction screenshots...');
  
  // Thrivings page with expanded tips
  await page.goto('http://localhost:3000/thrivings?id=thriving-1', { waitUntil: 'networkidle2' });
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Click on pro tips button if available
  try {
    const proTipsButton = await page.$$eval('button', buttons => {
      const button = buttons.find(btn => btn.textContent?.includes('Pro Tips'));
      if (button) button.click();
      return !!button;
    });
    
    if (proTipsButton) {
      await new Promise(resolve => setTimeout(resolve, 500));
      await page.screenshot({
        path: path.join(screenshotsDir, 'thrivings-tips-expanded.png'),
        fullPage: false
      });
    }
  } catch (e) {
    console.log('Could not find Pro Tips button');
  }

  // Bottom navigation states
  for (const pageInfo of pages) {
    await page.goto(pageInfo.url, { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Screenshot just the bottom navigation
    const bottomNav = await page.$('nav');
    if (bottomNav) {
      await bottomNav.screenshot({
        path: path.join(screenshotsDir, `${pageInfo.name}-bottom-nav.png`)
      });
    }
  }

  await browser.close();
  console.log('Screenshots completed!');
}

// Run the script
takeScreenshots().catch(console.error);