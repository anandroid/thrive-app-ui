#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

// Thrive app theme colors
const THEME_COLORS = {
  strongRose: '#e11d48',
  rose: '#fb7185', 
  dustyRose: '#daa0a9',
  burgundy: '#914372',
  darkBurgundy: '#6d335a',
  sageLight: '#a3bfa0',
  sage: '#87a878',
  sageDark: '#6b8c5f',
  softLavender: '#dfbad8',
  softBlush: '#f7e1e5'
};

// Sample icons (4 representatives from each category)
const SAMPLE_ICONS = [
  {
    name: 'heart-disease',
    title: 'Heart Disease',
    category: 'diseases',
    colors: [THEME_COLORS.dustyRose, THEME_COLORS.burgundy],
    svg: `
      <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${THEME_COLORS.dustyRose};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${THEME_COLORS.burgundy};stop-opacity:1" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <!-- Heart shape -->
        <path d="M256 448l-30.164-27.211C118.718 322.442 48 258.61 48 179.095 48 114.221 97.918 64 162.4 64c36.399 0 70.717 16.742 93.6 43.947C278.882 80.742 313.199 64 349.6 64 414.082 64 464 114.221 464 179.095c0 79.516-70.718 143.348-177.836 241.694L256 448z" 
              fill="url(#heartGradient)" 
              filter="url(#glow)"
              rx="20"/>
        
        <!-- Healing plus sign -->
        <g transform="translate(256,256)">
          <rect x="-4" y="-30" width="8" height="60" fill="white" rx="4" opacity="0.9"/>
          <rect x="-30" y="-4" width="60" height="8" fill="white" rx="4" opacity="0.9"/>
        </g>
      </svg>
    `
  },
  {
    name: 'arjuna',
    title: 'Arjuna (Heart Tonic)',
    category: 'herbs',
    colors: [THEME_COLORS.sage, THEME_COLORS.sageLight],
    svg: `
      <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${THEME_COLORS.sageLight};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${THEME_COLORS.sage};stop-opacity:1" />
          </linearGradient>
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <!-- Tree bark/trunk -->
        <rect x="230" y="300" width="52" height="120" fill="${THEME_COLORS.sageDark}" rx="26"/>
        
        <!-- Main leaf -->
        <ellipse cx="256" cy="200" rx="80" ry="120" fill="url(#leafGradient)" filter="url(#softGlow)"/>
        
        <!-- Leaf veins -->
        <path d="M256 100 Q256 150 256 200 Q240 180 220 160 M256 200 Q272 180 292 160 M256 200 Q240 220 220 240 M256 200 Q272 220 292 240" 
              stroke="${THEME_COLORS.sageDark}" 
              stroke-width="2" 
              fill="none" 
              opacity="0.6"/>
        
        <!-- Small healing sparkles -->
        <circle cx="200" cy="150" r="3" fill="white" opacity="0.8"/>
        <circle cx="320" cy="180" r="2" fill="white" opacity="0.6"/>
        <circle cx="290" cy="130" r="2.5" fill="white" opacity="0.7"/>
      </svg>
    `
  },
  {
    name: 'yoga-cobra',
    title: 'Cobra Pose (Bhujangasana)',
    category: 'exercises',
    colors: [THEME_COLORS.rose, THEME_COLORS.sage],
    svg: `
      <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${THEME_COLORS.rose};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${THEME_COLORS.sage};stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- Body in cobra pose -->
        <ellipse cx="256" cy="350" rx="140" ry="25" fill="url(#bodyGradient)" opacity="0.8"/>
        
        <!-- Torso lifted -->
        <ellipse cx="256" cy="280" rx="45" ry="80" fill="url(#bodyGradient)"/>
        
        <!-- Head -->
        <circle cx="256" cy="200" r="30" fill="url(#bodyGradient)"/>
        
        <!-- Arms supporting -->
        <ellipse cx="200" cy="320" rx="15" ry="40" fill="url(#bodyGradient)" transform="rotate(-20 200 320)"/>
        <ellipse cx="312" cy="320" rx="15" ry="40" fill="url(#bodyGradient)" transform="rotate(20 312 320)"/>
        
        <!-- Energy flow lines -->
        <path d="M256 180 Q256 160 256 140" stroke="white" stroke-width="3" fill="none" opacity="0.6" stroke-linecap="round"/>
        <path d="M256 140 Q250 130 244 120" stroke="white" stroke-width="2" fill="none" opacity="0.4" stroke-linecap="round"/>
        <path d="M256 140 Q262 130 268 120" stroke="white" stroke-width="2" fill="none" opacity="0.4" stroke-linecap="round"/>
      </svg>
    `
  },
  {
    name: 'abhyanga',
    title: 'Abhyanga (Oil Massage)',
    category: 'therapies',
    colors: [THEME_COLORS.softLavender, THEME_COLORS.dustyRose],
    svg: `
      <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="handGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${THEME_COLORS.softLavender};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${THEME_COLORS.dustyRose};stop-opacity:1" />
          </linearGradient>
          <radialGradient id="dropGradient" cx="50%" cy="30%">
            <stop offset="0%" style="stop-color:white;stop-opacity:0.9" />
            <stop offset="100%" style="stop-color:${THEME_COLORS.dustyRose};stop-opacity:0.7" />
          </radialGradient>
        </defs>
        
        <!-- Healing hands -->
        <ellipse cx="180" cy="220" rx="50" ry="80" fill="url(#handGradient)" transform="rotate(-15 180 220)"/>
        <ellipse cx="332" cy="220" rx="50" ry="80" fill="url(#handGradient)" transform="rotate(15 332 220)"/>
        
        <!-- Oil droplets -->
        <ellipse cx="200" cy="150" rx="8" ry="12" fill="url(#dropGradient)"/>
        <ellipse cx="256" cy="140" rx="10" ry="15" fill="url(#dropGradient)"/>
        <ellipse cx="312" cy="150" rx="8" ry="12" fill="url(#dropGradient)"/>
        <ellipse cx="230" cy="170" rx="6" ry="9" fill="url(#dropGradient)"/>
        <ellipse cx="282" cy="170" rx="6" ry="9" fill="url(#dropGradient)"/>
        
        <!-- Healing energy -->
        <circle cx="256" cy="300" r="80" fill="none" stroke="white" stroke-width="2" opacity="0.3"/>
        <circle cx="256" cy="300" r="60" fill="none" stroke="white" stroke-width="1" opacity="0.2"/>
        <circle cx="256" cy="300" r="40" fill="none" stroke="white" stroke-width="1" opacity="0.1"/>
        
        <!-- Small sparkles -->
        <circle cx="160" cy="180" r="2" fill="white" opacity="0.8"/>
        <circle cx="350" cy="190" r="2" fill="white" opacity="0.8"/>
        <circle cx="256" cy="120" r="1.5" fill="white" opacity="0.6"/>
      </svg>
    `
  }
];

async function createSampleIcons() {
  console.log('🎨 Creating 4 sample Ayurvedic icons for Thrive app...\n');
  
  // Create output directory
  const outputDir = path.join(__dirname, '..', 'public', 'icons', 'ayurvedic', 'samples');
  await fs.mkdir(outputDir, { recursive: true });
  
  const results = [];
  
  for (let i = 0; i < SAMPLE_ICONS.length; i++) {
    const icon = SAMPLE_ICONS[i];
    console.log(`${i + 1}. Creating ${icon.title} (${icon.category})...`);
    
    try {
      // Create SVG file
      const svgPath = path.join(outputDir, `${icon.name}.svg`);
      await fs.writeFile(svgPath, icon.svg.trim());
      
      // Create detailed prompt for AI image generation
      const prompt = generateDetailedPrompt(icon);
      const promptPath = path.join(outputDir, `${icon.name}.prompt.txt`);
      await fs.writeFile(promptPath, prompt);
      
      // Create metadata
      const metadata = {
        name: icon.name,
        title: icon.title,
        category: icon.category,
        colors: icon.colors,
        svg: svgPath,
        prompt: promptPath,
        generated: new Date().toISOString()
      };
      const metadataPath = path.join(outputDir, `${icon.name}.json`);
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
      
      results.push({
        success: true,
        ...metadata
      });
      
      console.log(`   ✅ SVG: ${icon.name}.svg`);
      console.log(`   📝 Prompt: ${icon.name}.prompt.txt`);
      console.log(`   📋 Metadata: ${icon.name}.json`);
      
    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}`);
      results.push({
        success: false,
        name: icon.name,
        title: icon.title,
        error: error.message
      });
    }
    
    console.log('');
  }
  
  // Create index file
  const indexData = {
    generated: new Date().toISOString(),
    app: 'Thrive - Ayurvedic Wellness',
    description: 'Sample icons for approval before generating complete set',
    themeColors: THEME_COLORS,
    samples: results,
    categories: {
      diseases: 'Health conditions with healing-focused symbols',
      herbs: 'Ayurvedic herbs and remedies with natural elements',
      exercises: 'Yoga poses and physical practices', 
      therapies: 'External treatments and lifestyle interventions'
    }
  };
  
  const indexPath = path.join(outputDir, 'index.json');
  await fs.writeFile(indexPath, JSON.stringify(indexData, null, 2));
  
  // Generate summary
  console.log('📊 SAMPLE ICON GENERATION SUMMARY');
  console.log('═'.repeat(60));
  
  const successCount = results.filter(r => r.success).length;
  console.log(`✅ Successfully created: ${successCount}/4 sample icons`);
  console.log(`📁 Output directory: ${outputDir}`);
  console.log(`🎨 Theme colors: ${Object.keys(THEME_COLORS).length} colors from Thrive app`);
  
  console.log('\n📋 FILES CREATED:');
  results.forEach(result => {
    if (result.success) {
      console.log(`• ${result.name}.svg - Basic vector icon`);
      console.log(`• ${result.name}.prompt.txt - AI generation prompt`);
      console.log(`• ${result.name}.json - Metadata`);
    }
  });
  console.log(`• index.json - Complete manifest`);
  
  console.log('\n🔄 NEXT STEPS:');
  console.log('1. Review the generated SVG icons');
  console.log('2. Use the .prompt.txt files with DALL-E/Midjourney for high-quality versions');
  console.log('3. Replace SVG files with PNG versions if needed');
  console.log('4. Once approved, generate the full icon set');
  
  return results;
}

function generateDetailedPrompt(icon) {
  const categoryDescription = {
    diseases: 'Medical condition icon that emphasizes healing and hope rather than illness',
    herbs: 'Ayurvedic herbal remedy icon with natural, botanical elements',
    exercises: 'Yoga/exercise pose icon showing peaceful human movement',
    therapies: 'Wellness therapy icon emphasizing gentle care and relaxation'
  };

  return `AYURVEDIC WELLNESS ICON: ${icon.title}

DESIGN BRIEF:
Create a modern, minimalist mobile app icon for "${icon.title}" in the Ayurvedic holistic health domain.
Category: ${icon.category} - ${categoryDescription[icon.category]}

VISUAL SPECIFICATIONS:
- Style: Clean vector icon with rounded shapes, friendly and approachable
- Colors: Use ONLY these Thrive app theme colors: ${icon.colors.join(', ')}
- Background: Completely transparent
- Format: 512x512px PNG, optimized for mobile (scalable to 48px)
- Mood: Healing, peaceful, non-intimidating, warm and inviting

DESIGN PRINCIPLES:
- Rounded corners and soft edges (NO sharp angles)
- Single focal element for clarity at small sizes
- Flat design with subtle gradients allowed
- No text or labels within the icon
- Cultural sensitivity for Ayurvedic traditions
- Conveys wellness and natural healing

TECHNICAL REQUIREMENTS:
- PNG format with transparent background
- Clear at both 512px and 48px sizes
- Consistent visual weight with other wellness icons
- Optimized for both light and dark app backgrounds
- Mobile-first design approach

AVOID:
- Clinical or harsh medical appearance
- Sharp edges or aggressive shapes
- Complex details that disappear when scaled down
- Bright or alarming colors outside the specified palette
- Text, numbers, or written labels
- Photorealistic style (use clean vector art)

The icon should feel like part of a cohesive, premium wellness app that guides users on their healing journey with Ayurvedic principles. Focus on hope, healing, and natural wellness rather than illness or problems.`;
}

// Run the script
if (require.main === module) {
  createSampleIcons().catch(error => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });
}

module.exports = { createSampleIcons, SAMPLE_ICONS, THEME_COLORS };