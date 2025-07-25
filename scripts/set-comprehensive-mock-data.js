const puppeteer = require('puppeteer');

const mockData = {
  thrive_thrivings: JSON.stringify([
    {
      id: 'thriving-1',
      title: 'Better Sleep & Recovery',
      description: 'A comprehensive evening routine designed to improve your sleep quality and morning energy levels through proven relaxation techniques and optimal sleep hygiene practices.',
      type: 'sleep_wellness',
      isActive: true,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
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
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
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
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
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
  
  // Wait for page to load
  await page.waitForSelector('body', { timeout: 10000 });
  
  // Set localStorage
  await page.evaluate((data) => {
    Object.keys(data).forEach(key => {
      localStorage.setItem(key, data[key]);
    });
  }, mockData);
  
  // Reload to apply localStorage
  await page.reload({ waitUntil: 'networkidle2' });
  
  // Wait for content to load
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Take initial screenshot showing the cards
  await page.screenshot({
    path: 'screenshots/thrivings-cards-view.png',
    fullPage: false
  });
  
  console.log('Screenshot saved to screenshots/thrivings-cards-view.png');
  
  // Click on the first thriving card to show details
  await page.click('.thriving-card');
  
  // Wait for details to render
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Scroll down to show the daily rituals
  await page.evaluate(() => {
    window.scrollBy(0, 300);
  });
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Take screenshot of thriving details
  await page.screenshot({
    path: 'screenshots/thrivings-details-view.png',
    fullPage: false
  });
  
  console.log('Screenshot saved to screenshots/thrivings-details-view.png');
  
  // Scroll to show more content
  await page.evaluate(() => {
    window.scrollBy(0, 400);
  });
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Take screenshot of recommendations section
  await page.screenshot({
    path: 'screenshots/thrivings-recommendations-view.png',
    fullPage: false
  });
  
  console.log('Screenshot saved to screenshots/thrivings-recommendations-view.png');
  
  // Keep browser open for manual inspection
  console.log('Browser will stay open. Close it manually when done.');
}

setMockDataAndScreenshot().catch(console.error);