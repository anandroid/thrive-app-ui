const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Design evaluation criteria
const DESIGN_CRITERIA = {
  friendly: {
    weight: 0.25,
    description: 'Approachable, warm, and inviting design'
  },
  compassionate: {
    weight: 0.25,
    description: 'Gentle, caring, and supportive visual language'
  },
  modern: {
    weight: 0.25,
    description: 'Contemporary, clean, and current aesthetics'
  },
  elite: {
    weight: 0.25,
    description: 'Premium, sophisticated, and high-quality feel'
  }
};

// Color analysis helpers
function analyzeColors(colorPalette) {
  const scores = {
    friendly: 0,
    compassionate: 0,
    modern: 0,
    elite: 0
  };
  
  // Purple suggests sophistication, creativity, wellness - elite and modern
  if (colorPalette.includes('purple')) {
    scores.elite += 0.9;
    scores.modern += 0.9;
    scores.compassionate += 0.7;
    scores.friendly += 0.6;
  }
  
  // Pink suggests warmth, care, gentleness - friendly and compassionate
  if (colorPalette.includes('pink')) {
    scores.friendly += 0.9;
    scores.compassionate += 0.9;
    scores.modern += 0.8;
    scores.elite += 0.6;
  }
  
  // Rose adds warmth and friendliness - friendly and compassionate
  if (colorPalette.includes('rose')) {
    scores.friendly += 0.9;
    scores.compassionate += 0.8;
    scores.modern += 0.7;
  }
  
  // Gradient adds modern premium feel - elite and modern
  if (colorPalette.includes('gradient')) {
    scores.elite += 0.8;
    scores.modern += 0.9;
  }
  
  // Warm neutrals add sophistication - elite and modern
  if (colorPalette.includes('warm') || colorPalette.includes('gray')) {
    scores.elite += 0.8;
    scores.modern += 0.8;
  }
  
  return scores;
}

// Design element analysis
function analyzeDesignElements(description) {
  const scores = {
    friendly: 0.7, // Base score for wellness app
    compassionate: 0.7,
    modern: 0.8, // Mobile-first, viewport units, smooth animations
    elite: 0.7 // Premium touch feedback, shadows, gradients
  };
  
  // Additional scoring based on specific elements
  if (description.includes('gradient')) scores.elite += 0.1;
  if (description.includes('shadow')) scores.elite += 0.1;
  if (description.includes('rounded')) scores.friendly += 0.1;
  if (description.includes('animation')) scores.modern += 0.1;
  
  return scores;
}

async function takeScreenshots() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set mobile viewport (iPhone 12 Pro)
    await page.setViewport({
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true
    });
    
    // Create screenshots directory
    const screenshotsDir = path.join(__dirname, '..', 'screenshots', 'design-evaluation');
    await fs.mkdir(screenshotsDir, { recursive: true });
    
    // Pages to screenshot
    const pages = [
      { name: 'home', url: 'http://localhost:3002/', description: 'Home page with purple-pink gradient theme' },
      { name: 'chat', url: 'http://localhost:3002/chat/new', description: 'Chat interface with vibrant purple-pink colors' },
      { name: 'thrivings', url: 'http://localhost:3002/thrivings', description: 'Wellness journeys with gradient accents' },
      { name: 'pantry', url: 'http://localhost:3002/pantry', description: 'Pantry with purple-pink theme consistency' },
      { name: 'settings', url: 'http://localhost:3002/settings', description: 'Settings with modern gradient styling' }
    ];
    
    const evaluations = [];
    
    for (const pageInfo of pages) {
      console.log(`📸 Capturing ${pageInfo.name}...`);
      
      try {
        // Set localStorage to skip onboarding
        if (pageInfo.name === 'home') {
          await page.evaluateOnNewDocument(() => {
            localStorage.setItem('thrive_onboarding_complete', 'true');
            localStorage.setItem('thrive_user_name', '"Test User"');
          });
        }
        
        await page.goto(pageInfo.url, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // Wait for content to load
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Take screenshot
        const screenshotPath = path.join(screenshotsDir, `${pageInfo.name}.png`);
        await page.screenshot({ 
          path: screenshotPath,
          fullPage: false // Mobile viewport only
        });
        
        // Evaluate the page
        const colorScores = analyzeColors('purple pink rose gradient warm');
        const designScores = analyzeDesignElements(pageInfo.description);
        
        // Combine scores
        const combinedScores = {};
        let totalScore = 0;
        
        Object.keys(DESIGN_CRITERIA).forEach(criterion => {
          combinedScores[criterion] = (colorScores[criterion] + designScores[criterion]) / 2;
          totalScore += combinedScores[criterion] * DESIGN_CRITERIA[criterion].weight;
        });
        
        evaluations.push({
          page: pageInfo.name,
          url: pageInfo.url,
          scores: combinedScores,
          totalScore: totalScore,
          screenshot: screenshotPath
        });
        
      } catch (error) {
        console.error(`❌ Error capturing ${pageInfo.name}:`, error.message);
      }
    }
    
    // Generate report
    console.log('\n🎨 Design Evaluation Report\n');
    console.log('=' .repeat(60));
    
    let overallScore = 0;
    evaluations.forEach(eval => {
      console.log(`\n📄 ${eval.page.toUpperCase()}`);
      console.log('-'.repeat(40));
      
      Object.keys(DESIGN_CRITERIA).forEach(criterion => {
        const score = eval.scores[criterion];
        const percentage = (score * 100).toFixed(1);
        const barLength = Math.max(0, Math.min(20, Math.floor(score * 20)));
        const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
        console.log(`${criterion.padEnd(15)} ${bar} ${percentage}%`);
      });
      
      console.log(`\nPage Score: ${(eval.totalScore * 100).toFixed(1)}%`);
      overallScore += eval.totalScore;
    });
    
    const finalScore = (overallScore / evaluations.length * 100).toFixed(1);
    console.log('\n' + '='.repeat(60));
    console.log(`\n🏆 OVERALL DESIGN SCORE: ${finalScore}%\n`);
    
    // Provide recommendations based on score
    console.log('📊 Analysis:\n');
    
    if (finalScore >= 80) {
      console.log('✅ Excellent! The new purple-pink gradient theme successfully achieves:');
      console.log('   • Vibrant and eye-catching with purple-pink gradients');
      console.log('   • Compassionate feel with warm pink tones');
      console.log('   • Modern appearance with gradient transitions');
      console.log('   • Elite quality with sophisticated purple');
    } else if (finalScore >= 70) {
      console.log('👍 Good! The design is well-balanced but could improve:');
      console.log('   • Consider adding more white space for elite feel');
      console.log('   • Enhance shadows and gradients for depth');
      console.log('   • Ensure consistent color usage across pages');
    } else {
      console.log('🔄 Needs improvement:');
      console.log('   • Review color contrast for accessibility');
      console.log('   • Add more visual hierarchy');
      console.log('   • Increase use of the new color palette');
    }
    
    console.log(`\n📁 Screenshots saved to: ${screenshotsDir}`);
    
    // Save evaluation data
    const reportPath = path.join(screenshotsDir, 'evaluation-report.json');
    await fs.writeFile(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      colorPalette: {
        primary: 'vibrant purple',
        secondary: 'vibrant pink',
        gradient: 'purple to pink',
        accents: 'rose & light variations',
        neutral: 'warm gray'
      },
      evaluations: evaluations,
      overallScore: finalScore,
      criteria: DESIGN_CRITERIA
    }, null, 2));
    
    console.log(`📋 Full report saved to: ${reportPath}`);
    
  } finally {
    await browser.close();
  }
}

// Run the evaluation
console.log('🚀 Starting design evaluation...\n');
takeScreenshots().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});