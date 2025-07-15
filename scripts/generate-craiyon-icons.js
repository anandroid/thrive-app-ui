#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const { URL } = require('url');

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

// Icon definitions matching the simple, modern style from your examples
const ICON_DEFINITIONS = {
  diseases: [
    { name: 'heart-disease', title: 'Heart Disease', colors: ['dusty rose (#daa0a9)', 'burgundy (#914372)'], description: 'Simple heart shape with heartbeat line through it - exactly like your example but in dusty rose to burgundy gradient' },
    { name: 'hypertension', title: 'Hypertension', colors: ['burgundy (#914372)', 'rose (#fb7185)'], description: 'Clean blood pressure monitor with cuff and gauge - exactly like your example but in burgundy to rose gradient' },
    { name: 'high-cholesterol', title: 'High Cholesterol', colors: ['sage (#87a878)', 'sage light (#a3bfa0)'], description: 'Blood drop with simple molecule structure - exactly like your example but in sage to sage light gradient' },
    { name: 'type2-diabetes', title: 'Type 2 Diabetes', colors: ['dusty rose (#daa0a9)', 'soft lavender (#dfbad8)'], description: 'Glucose meter device with digital display - exactly like your example but in dusty rose to soft lavender gradient' },
    { name: 'obesity', title: 'Obesity', colors: ['sage (#87a878)', 'dusty rose (#daa0a9)'], description: 'Simple bathroom scale with clean design in sage to dusty rose gradient' },
    { name: 'osteoarthritis', title: 'Osteoarthritis', colors: ['burgundy (#914372)', 'sage light (#a3bfa0)'], description: 'Simple joint/knee icon with clean lines in burgundy to sage light gradient' },
    { name: 'rheumatoid-arthritis', title: 'Rheumatoid Arthritis', colors: ['sage (#87a878)', 'soft lavender (#dfbad8)'], description: 'Simple hand joints icon with clean design in sage to soft lavender gradient' },
    { name: 'asthma', title: 'Asthma', colors: ['sage light (#a3bfa0)', 'rose (#fb7185)'], description: 'Simple inhaler device with clean lines in sage light to rose gradient' },
    { name: 'copd', title: 'COPD', colors: ['sage (#87a878)', 'dusty rose (#daa0a9)'], description: 'Simple lungs shape with clean design in sage to dusty rose gradient' },
    { name: 'kidney-disease', title: 'Kidney Disease', colors: ['dusty rose (#daa0a9)', 'sage light (#a3bfa0)'], description: 'Simple kidney bean shape with clean lines in dusty rose to sage light gradient' },
    { name: 'fatty-liver', title: 'Fatty Liver', colors: ['sage (#87a878)', 'burgundy (#914372)'], description: 'Simple liver shape with clean design in sage to burgundy gradient' },
    { name: 'depression', title: 'Depression', colors: ['soft lavender (#dfbad8)', 'rose (#fb7185)'], description: 'Simple brain icon with gentle upward elements in soft lavender to rose gradient' },
    { name: 'anxiety', title: 'Anxiety', colors: ['sage light (#a3bfa0)', 'soft lavender (#dfbad8)'], description: 'Simple head silhouette with calming elements in sage light to soft lavender gradient' },
    { name: 'hypothyroidism', title: 'Hypothyroidism', colors: ['dusty rose (#daa0a9)', 'sage (#87a878)'], description: 'Simple thyroid butterfly shape with clean lines in dusty rose to sage gradient' },
    { name: 'ibs', title: 'IBS', colors: ['sage light (#a3bfa0)', 'dusty rose (#daa0a9)'], description: 'Simple intestine/stomach icon with clean design in sage light to dusty rose gradient' },
    { name: 'gerd', title: 'GERD', colors: ['sage (#87a878)', 'soft lavender (#dfbad8)'], description: 'Simple stomach icon with acid elements in sage to soft lavender gradient' }
  ],
  
  herbs: [
    { name: 'arjuna', title: 'Arjuna', colors: ['sage (#87a878)', 'sage light (#a3bfa0)'], description: 'Simple tree trunk or bark icon with clean lines in sage to sage light gradient' },
    { name: 'ashwagandha', title: 'Ashwagandha', colors: ['dusty rose (#daa0a9)', 'sage (#87a878)'], description: 'Simple root shape with clean design in dusty rose to sage gradient' },
    { name: 'triphala', title: 'Triphala', colors: ['sage light (#a3bfa0)', 'burgundy (#914372)'], description: 'Three simple fruits arranged cleanly in sage light to burgundy gradient' },
    { name: 'tulsi', title: 'Tulsi', colors: ['sage (#87a878)', 'soft lavender (#dfbad8)'], description: 'Simple basil leaf with clean lines in sage to soft lavender gradient' },
    { name: 'brahmi', title: 'Brahmi', colors: ['soft lavender (#dfbad8)', 'sage light (#a3bfa0)'], description: 'Simple brain-shaped leaf with clean design in soft lavender to sage light gradient' },
    { name: 'guggulu', title: 'Guggulu', colors: ['burgundy (#914372)', 'sage (#87a878)'], description: 'Simple resin drop with clean lines in burgundy to sage gradient' },
    { name: 'fenugreek', title: 'Fenugreek', colors: ['sage light (#a3bfa0)', 'burgundy (#914372)'], description: 'Simple fenugreek seeds with clean design in sage light to burgundy gradient' },
    { name: 'garlic', title: 'Garlic', colors: ['sage light (#a3bfa0)', 'dusty rose (#daa0a9)'], description: 'Simple garlic bulb with clean lines in sage light to dusty rose gradient' },
    { name: 'ginger', title: 'Ginger', colors: ['rose (#fb7185)', 'sage (#87a878)'], description: 'Simple ginger root with clean design in rose to sage gradient' },
    { name: 'turmeric', title: 'Turmeric', colors: ['burgundy (#914372)', 'dusty rose (#daa0a9)'], description: 'Simple turmeric root with clean lines in burgundy to dusty rose gradient' }
  ]
};

class CraiyonIconGenerator {
  constructor() {
    this.apiUrl = 'https://api.craiyon.com/v3';
  }

  generatePrompt(item) {
    const colorString = item.colors.join(' and ');
    
    return `${item.description}, simple flat design icon, minimal, clean, modern, ${colorString}, transparent background, vector style, mobile app icon, medical iconography, no text, professional`;
  }

  async generateIcon(item, outputPath) {
    console.log(`🎨 Generating: ${item.title}`);
    console.log(`🎯 Colors: ${item.colors.join(', ')}`);
    
    const prompt = this.generatePrompt(item);
    
    try {
      console.log(`🔄 Sending request to Craiyon API...`);
      console.log(`💡 Prompt: ${prompt}`);
      
      // For now, let's create a placeholder and show the user how to proceed
      const outputDir = path.dirname(outputPath);
      await fs.mkdir(outputDir, { recursive: true });
      
      // Create a text file with the prompt for manual generation
      const promptPath = path.join(outputDir, `${item.name}-prompt.txt`);
      await fs.writeFile(promptPath, `Icon: ${item.title}\nPrompt: ${prompt}\n\nInstructions:\n1. Go to https://craiyon.com/\n2. Paste the prompt above\n3. Generate the image\n4. Download and save as ${item.name}.png\n5. Place in ${outputDir}`);
      
      console.log(`📝 Saved prompt to: ${promptPath}`);
      console.log(`🌐 Next: Visit https://craiyon.com/ and use the prompt`);
      
      return {
        success: true,
        name: item.name,
        title: item.title,
        promptPath: promptPath,
        instructions: 'Manual generation required using Craiyon web interface'
      };
      
    } catch (error) {
      console.error(`❌ Failed to generate ${item.name}:`, error.message);
      return {
        success: false,
        name: item.name,
        title: item.title,
        error: error.message
      };
    }
  }

  async generateCategorySet(categoryName, items) {
    console.log(`\n🎨 Generating ${categoryName} icon prompts (${items.length} items)...`);
    
    const outputDir = path.join(__dirname, '..', 'public', 'icons', 'ayurvedic', 'craiyon', categoryName);
    await fs.mkdir(outputDir, { recursive: true });
    
    const results = [];
    
    for (let i = 0; i < items.length; i++) {
      const item = { ...items[i], category: categoryName };
      const outputPath = path.join(outputDir, `${item.name}.png`);
      
      const result = await this.generateIcon(item, outputPath);
      results.push(result);
    }
    
    // Create a batch file with all prompts
    const batchPath = path.join(outputDir, '_batch_prompts.txt');
    const batchContent = results.map(r => {
      if (r.success) {
        return `${r.title}: ${this.generatePrompt({ ...items.find(i => i.name === r.name) })}`;
      }
      return `${r.title}: ERROR - ${r.error}`;
    }).join('\n\n');
    
    await fs.writeFile(batchPath, batchContent);
    console.log(`📋 Batch prompts saved to: ${batchPath}`);
    
    return results;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const generator = new CraiyonIconGenerator();
  
  try {
    console.log('🎯 Craiyon Icon Generator');
    console.log('═'.repeat(40));
    console.log('🆓 Free web-based generation\n');
    
    switch (command) {
      case 'sample':
        const samples = [
          { ...ICON_DEFINITIONS.diseases[0], category: 'diseases' },
          { ...ICON_DEFINITIONS.diseases[1], category: 'diseases' },
          { ...ICON_DEFINITIONS.diseases[2], category: 'diseases' },
          { ...ICON_DEFINITIONS.diseases[3], category: 'diseases' }
        ];
        
        const outputDir = path.join(__dirname, '..', 'public', 'icons', 'ayurvedic', 'craiyon', 'samples');
        await fs.mkdir(outputDir, { recursive: true });
        
        for (const sample of samples) {
          const outputPath = path.join(outputDir, `${sample.name}.png`);
          await generator.generateIcon(sample, outputPath);
        }
        
        console.log('\n🎯 Next Steps:');
        console.log('1. Visit https://craiyon.com/');
        console.log('2. Use the prompts generated above');
        console.log('3. Download images and place in the appropriate folders');
        console.log('4. Run the script again to generate more prompts');
        break;
      case 'diseases':
        await generator.generateCategorySet('diseases', ICON_DEFINITIONS.diseases);
        break;
      case 'herbs':
        await generator.generateCategorySet('herbs', ICON_DEFINITIONS.herbs);
        break;
      case 'all':
        for (const [category, items] of Object.entries(ICON_DEFINITIONS)) {
          await generator.generateCategorySet(category, items);
        }
        break;
      default:
        console.log('Usage:');
        console.log('  node generate-craiyon-icons.js sample    # Generate 4 disease sample prompts');
        console.log('  node generate-craiyon-icons.js diseases # Generate all disease prompts');
        console.log('  node generate-craiyon-icons.js herbs    # Generate herb prompts');
        console.log('  node generate-craiyon-icons.js all      # Generate all category prompts');
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { CraiyonIconGenerator, ICON_DEFINITIONS, THEME_COLORS };