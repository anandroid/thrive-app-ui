#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

// Thrive app theme colors from globals.css
const THEME_COLORS = {
  // Rose/Burgundy Family (Primary)
  strongRose: '#e11d48',
  rose: '#fb7185', 
  dustyRose: '#daa0a9',
  burgundy: '#914372',
  darkBurgundy: '#6d335a',
  
  // Sage Green Family (Secondary)
  sageLight: '#a3bfa0',
  sage: '#87a878',
  sageDark: '#6b8c5f',
  
  // Soft Accents
  softLavender: '#dfbad8',
  softBlush: '#f7e1e5'
};

// Icon definitions organized by category
const ICON_DEFINITIONS = {
  diseases: [
    {
      name: 'heart-disease',
      title: 'Heart Disease (Coronary Artery Disease)',
      description: 'Simple heart shape with a subtle plus sign or healing glow, rendered in dusty rose'
    },
    {
      name: 'hypertension',
      title: 'Hypertension (High Blood Pressure)', 
      description: 'Blood pressure monitor or heart with upward arrow, in burgundy'
    },
    {
      name: 'high-cholesterol',
      title: 'High Cholesterol (Hyperlipidemia)',
      description: 'Stylized cholesterol molecule or heart with droplet, in sage green'
    },
    {
      name: 'type2-diabetes',
      title: 'Type 2 Diabetes (Madhumeha)',
      description: 'Blood glucose drop or simple glucose meter icon, in soft rose'
    }
  ],
  herbs: [
    {
      name: 'arjuna',
      title: 'Arjuna (Heart tonic)',
      description: 'Stylized tree or leaf representing Arjuna herb, in sage green'
    },
    {
      name: 'ashwagandha',
      title: 'Ashwagandha (Adaptogen)',
      description: 'Root or botanical illustration of ashwagandha, in dusty rose'
    },
    {
      name: 'triphala',
      title: 'Triphala (Digestive detoxifier)',
      description: 'Three fruits or a bowl representing the three-fruit blend, in burgundy'
    },
    {
      name: 'tulsi',
      title: 'Tulsi (Holy Basil)',
      description: 'Sacred basil leaves in a simple, reverent style, in sage light'
    }
  ],
  exercises: [
    {
      name: 'yoga-cobra',
      title: 'Cobra (Bhujangasana)',
      description: 'Human figure in cobra pose - lying down with chest lifted, in rose'
    },
    {
      name: 'yoga-bridge',
      title: 'Bridge (Setu Bandhasana)', 
      description: 'Human figure in bridge pose - lying with hips lifted, in sage'
    },
    {
      name: 'pranayama',
      title: 'Pranayama / Breathing Exercises',
      description: 'Stylized lungs or meditation figure with breath flow lines, in soft lavender'
    },
    {
      name: 'meditation',
      title: 'Meditation / Mindfulness Practices',
      description: 'Person in lotus position with subtle aura or peaceful energy, in burgundy'
    }
  ],
  therapies: [
    {
      name: 'abhyanga',
      title: 'Abhyanga (Oil Massage)',
      description: 'Two gentle hands with oil droplets, emphasizing healing touch, in dusty rose'
    },
    {
      name: 'steam-therapy',
      title: 'Steam Baths / Herbal Steam (Swedana)',
      description: 'Bowl or pot with gentle steam lines rising, with small leaf accent, in sage'
    },
    {
      name: 'stress-management',
      title: 'Stress Management',
      description: 'Peaceful face or calm mind symbol with gentle energy, in soft lavender'
    },
    {
      name: 'aromatherapy',
      title: 'Aromatherapy',
      description: 'Essential oil bottle with gentle aroma lines or diffuser, in rose'
    }
  ]
};

// Generate the base prompt for icon creation
function generateIconPrompt(iconDef, category) {
  const categoryColors = {
    diseases: [THEME_COLORS.dustyRose, THEME_COLORS.burgundy],
    herbs: [THEME_COLORS.sage, THEME_COLORS.sageLight], 
    exercises: [THEME_COLORS.rose, THEME_COLORS.sage],
    therapies: [THEME_COLORS.softLavender, THEME_COLORS.dustyRose]
  };

  const colors = categoryColors[category] || [THEME_COLORS.rose, THEME_COLORS.sage];
  
  return `Create a minimalist, modern icon for "${iconDef.title}" for a holistic health mobile app.

DESIGN REQUIREMENTS:
- ${iconDef.description}
- Style: Clean, friendly, rounded shapes with soft edges
- Colors: Use ONLY these Thrive app theme colors: ${colors.join(', ')}
- Background: Completely transparent 
- Format: Simple flat design with minimal details
- Size: Square format, optimized for mobile display (48px to 512px)
- Mood: Healing, peaceful, non-intimidating, welcoming
- Consistency: Match the visual weight and style of other wellness app icons

AVOID:
- Sharp edges or harsh lines
- Clinical or medical appearance
- Complex details that won't scale down
- Bright or alarming colors
- Realistic photography style
- Text or labels

The icon should feel like part of a cohesive set for an Ayurvedic wellness app, emphasizing natural healing and gentle care.`;
}

// Mock function to simulate Gemini API call
async function generateIconWithGemini(prompt, outputPath) {
  console.log(`\n🎨 Generating icon: ${path.basename(outputPath)}`);
  console.log(`📝 Prompt: ${prompt.substring(0, 100)}...`);
  
  // In a real implementation, this would call the Gemini API
  // For now, we'll create a placeholder
  const placeholder = `<!-- Generated icon for ${path.basename(outputPath)} -->\n<!-- Prompt: ${prompt.substring(0, 200)}... -->`;
  
  await fs.writeFile(outputPath, placeholder);
  console.log(`✅ Created placeholder: ${outputPath}`);
  
  return {
    success: true,
    path: outputPath,
    prompt: prompt
  };
}

// Create the sample icons for approval
async function createSampleIcons() {
  console.log('🚀 Creating 4 sample Ayurvedic icons for approval...\n');
  
  // Create output directory
  const outputDir = path.join(__dirname, '..', 'public', 'icons', 'ayurvedic');
  await fs.mkdir(outputDir, { recursive: true });
  
  // Select one icon from each category for samples
  const sampleIcons = [
    { category: 'diseases', icon: ICON_DEFINITIONS.diseases[0] },
    { category: 'herbs', icon: ICON_DEFINITIONS.herbs[0] },
    { category: 'exercises', icon: ICON_DEFINITIONS.exercises[0] },
    { category: 'therapies', icon: ICON_DEFINITIONS.therapies[0] }
  ];
  
  const results = [];
  
  for (const { category, icon } of sampleIcons) {
    const prompt = generateIconPrompt(icon, category);
    const outputPath = path.join(outputDir, `${icon.name}.svg`);
    
    try {
      const result = await generateIconWithGemini(prompt, outputPath);
      results.push({
        category,
        icon: icon.name,
        title: icon.title,
        success: result.success,
        path: result.path
      });
    } catch (error) {
      console.error(`❌ Failed to generate ${icon.name}:`, error.message);
      results.push({
        category,
        icon: icon.name,
        title: icon.title,
        success: false,
        error: error.message
      });
    }
  }
  
  // Generate summary
  console.log('\n📊 SAMPLE GENERATION SUMMARY');
  console.log('═'.repeat(50));
  
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${index + 1}. ${status} ${result.title}`);
    console.log(`   Category: ${result.category}`);
    console.log(`   File: ${result.icon}.svg`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    console.log('');
  });
  
  const successCount = results.filter(r => r.success).length;
  console.log(`\n🎯 Generated ${successCount}/4 sample icons successfully!`);
  console.log(`\n📁 Icons saved to: ${outputDir}`);
  
  if (successCount === 4) {
    console.log('\n✨ All sample icons created! Please review and approve before generating the full set.');
    console.log('\n🔄 To generate all remaining icons, run: npm run generate-icons:full');
  }
  
  return results;
}

// Generate all icons (called after approval)
async function generateAllIcons() {
  console.log('🎨 Generating complete Ayurvedic icon set...\n');
  
  const outputDir = path.join(__dirname, '..', 'public', 'icons', 'ayurvedic');
  await fs.mkdir(outputDir, { recursive: true });
  
  let totalGenerated = 0;
  let totalFailed = 0;
  
  for (const [category, icons] of Object.entries(ICON_DEFINITIONS)) {
    console.log(`\n📂 Generating ${category} icons (${icons.length} icons)...`);
    
    for (const icon of icons) {
      const prompt = generateIconPrompt(icon, category);
      const outputPath = path.join(outputDir, `${icon.name}.svg`);
      
      try {
        await generateIconWithGemini(prompt, outputPath);
        totalGenerated++;
      } catch (error) {
        console.error(`❌ Failed to generate ${icon.name}:`, error.message);
        totalFailed++;
      }
    }
  }
  
  console.log('\n🎉 GENERATION COMPLETE!');
  console.log(`✅ Successfully generated: ${totalGenerated} icons`);
  console.log(`❌ Failed: ${totalFailed} icons`);
  console.log(`📁 All icons saved to: ${outputDir}`);
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    switch (command) {
      case 'samples':
      case undefined:
        await createSampleIcons();
        break;
      case 'full':
        await generateAllIcons();
        break;
      case 'list':
        console.log('📋 COMPLETE ICON LIST');
        console.log('═'.repeat(40));
        for (const [category, icons] of Object.entries(ICON_DEFINITIONS)) {
          console.log(`\n${category.toUpperCase()} (${icons.length} icons):`);
          icons.forEach((icon, i) => {
            console.log(`  ${i + 1}. ${icon.title}`);
          });
        }
        const totalCount = Object.values(ICON_DEFINITIONS).reduce((sum, icons) => sum + icons.length, 0);
        console.log(`\n📊 Total icons to generate: ${totalCount}`);
        break;
      default:
        console.log('Usage:');
        console.log('  node generate-ayurvedic-icons.js samples  # Generate 4 sample icons');
        console.log('  node generate-ayurvedic-icons.js full     # Generate all icons');
        console.log('  node generate-ayurvedic-icons.js list     # List all planned icons');
    }
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  ICON_DEFINITIONS,
  THEME_COLORS,
  generateIconPrompt,
  createSampleIcons,
  generateAllIcons
};