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
  ],
  
  exercises: [
    { name: 'yoga-cobra', title: 'Cobra Pose', colors: ['dusty rose (#daa0a9)', 'sage (#87a878)'], description: 'Simple human silhouette in cobra pose with clean lines in dusty rose to sage gradient' },
    { name: 'yoga-bridge', title: 'Bridge Pose', colors: ['sage light (#a3bfa0)', 'rose (#fb7185)'], description: 'Simple bridge pose silhouette with clean design in sage light to rose gradient' },
    { name: 'yoga-warrior', title: 'Warrior Pose', colors: ['burgundy (#914372)', 'sage (#87a878)'], description: 'Simple warrior pose silhouette with clean lines in burgundy to sage gradient' },
    { name: 'yoga-tree', title: 'Tree Pose', colors: ['sage (#87a878)', 'dusty rose (#daa0a9)'], description: 'Simple tree pose silhouette with clean design in sage to dusty rose gradient' },
    { name: 'yoga-downward-dog', title: 'Downward Dog', colors: ['rose (#fb7185)', 'sage (#87a878)'], description: 'Simple downward dog silhouette with clean lines in rose to sage gradient' },
    { name: 'meditation', title: 'Meditation', colors: ['soft lavender (#dfbad8)', 'sage light (#a3bfa0)'], description: 'Simple meditation pose silhouette with clean design in soft lavender to sage light gradient' },
    { name: 'pranayama', title: 'Breathing', colors: ['sage (#87a878)', 'soft lavender (#dfbad8)'], description: 'Simple breathing visualization with clean lines in sage to soft lavender gradient' },
    { name: 'walking', title: 'Walking', colors: ['rose (#fb7185)', 'sage (#87a878)'], description: 'Simple walking silhouette with clean design in rose to sage gradient' }
  ],
  
  therapies: [
    { name: 'abhyanga', title: 'Oil Massage', colors: ['dusty rose (#daa0a9)', 'soft lavender (#dfbad8)'], description: 'Simple massage hands with oil drops in dusty rose to soft lavender gradient' },
    { name: 'steam-therapy', title: 'Steam Therapy', colors: ['sage light (#a3bfa0)', 'soft lavender (#dfbad8)'], description: 'Simple steam bowl with clean lines in sage light to soft lavender gradient' },
    { name: 'shirodhara', title: 'Shirodhara', colors: ['soft lavender (#dfbad8)', 'dusty rose (#daa0a9)'], description: 'Simple oil pouring vessel with clean design in soft lavender to dusty rose gradient' },
    { name: 'aromatherapy', title: 'Aromatherapy', colors: ['soft lavender (#dfbad8)', 'sage light (#a3bfa0)'], description: 'Simple essential oil diffuser with clean lines in soft lavender to sage light gradient' },
    { name: 'sound-therapy', title: 'Sound Therapy', colors: ['burgundy (#914372)', 'soft lavender (#dfbad8)'], description: 'Simple singing bowl with clean design in burgundy to soft lavender gradient' },
    { name: 'diet-therapy', title: 'Diet Therapy', colors: ['sage light (#a3bfa0)', 'burgundy (#914372)'], description: 'Simple healthy plate with clean lines in sage light to burgundy gradient' }
  ]
};

class StableDiffusionIconGenerator {
  constructor() {
    // Using free Hugging Face Inference API
    this.apiUrl = 'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1';
    this.apiKey = process.env.HUGGINGFACE_API_KEY;
    
    if (!this.apiKey) {
      throw new Error('❌ HUGGINGFACE_API_KEY environment variable is required');
    }
  }

  generatePrompt(item) {
    const colorString = item.colors.join(' and ');
    
    return `${item.description}, vector icon, flat design, minimal, clean, modern, professional, ${colorString}, transparent background, high quality, simple shapes, no text, mobile app icon style, medical app iconography`;
  }

  async downloadImage(arrayBuffer, outputPath) {
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(outputPath, buffer);
    return outputPath;
  }

  async generateIcon(item, outputPath) {
    console.log(`🎨 Generating: ${item.title}`);
    console.log(`🎯 Colors: ${item.colors.join(', ')}`);
    
    const prompt = this.generatePrompt(item);
    
    try {
      console.log(`🔄 Sending request to Stable Diffusion...`);
      
      const response = await this.makeApiRequest(prompt);
      
      if (response) {
        console.log(`📥 Downloading image...`);
        
        const downloadPath = await this.downloadImage(response, outputPath);
        console.log(`✅ Saved: ${path.basename(downloadPath)}`);
        
        return {
          success: true,
          name: item.name,
          title: item.title,
          filePath: downloadPath
        };
      } else {
        throw new Error('No image data in response');
      }
      
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

  async makeApiRequest(prompt) {
    return new Promise((resolve, reject) => {
      const requestBody = JSON.stringify({
        inputs: prompt,
        parameters: {
          negative_prompt: "text, letters, numbers, watermark, signature, blurry, low quality, pixelated, 3d, realistic, photograph, complex, detailed, shadows"
        }
      });

      const options = {
        hostname: 'api-inference.huggingface.co',
        port: 443,
        path: '/models/stabilityai/stable-diffusion-2-1',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Length': Buffer.byteLength(requestBody)
        }
      };

      const req = https.request(options, (res) => {
        const chunks = [];
        
        res.on('data', (chunk) => {
          chunks.push(chunk);
        });
        
        res.on('end', () => {
          const buffer = Buffer.concat(chunks);
          
          if (res.statusCode === 200) {
            // Check if response is JSON (error) or binary (image)
            if (res.headers['content-type']?.includes('application/json')) {
              try {
                const errorResponse = JSON.parse(buffer.toString());
                reject(new Error(`API Error: ${errorResponse.error || 'Unknown error'}`));
              } catch (parseError) {
                reject(new Error(`Failed to parse error response: ${parseError.message}`));
              }
            } else {
              // Binary image data
              resolve(buffer);
            }
          } else {
            try {
              const errorResponse = JSON.parse(buffer.toString());
              reject(new Error(`API Error ${res.statusCode}: ${errorResponse.error || buffer.toString()}`));
            } catch (parseError) {
              reject(new Error(`API Error ${res.statusCode}: ${buffer.toString()}`));
            }
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Request failed: ${error.message}`));
      });

      req.write(requestBody);
      req.end();
    });
  }

  async generateCategorySet(categoryName, items) {
    console.log(`\n🎨 Generating Stable Diffusion ${categoryName} icons (${items.length} items)...`);
    
    const outputDir = path.join(__dirname, '..', 'public', 'icons', 'ayurvedic', 'stable-diffusion', categoryName);
    await fs.mkdir(outputDir, { recursive: true });
    
    const results = [];
    
    for (let i = 0; i < items.length; i++) {
      const item = { ...items[i], category: categoryName };
      const outputPath = path.join(outputDir, `${item.name}.png`);
      
      const result = await this.generateIcon(item, outputPath);
      results.push(result);
      
      if (i < items.length - 1) {
        console.log(`⏳ Waiting 5 seconds for API rate limit...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    return results;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const generator = new StableDiffusionIconGenerator();
  
  try {
    console.log('🎯 Stable Diffusion Icon Generator');
    console.log('═'.repeat(40));
    console.log('🆓 Using free Hugging Face API\n');
    
    switch (command) {
      case 'sample':
        const samples = [
          { ...ICON_DEFINITIONS.diseases[0], category: 'diseases' },
          { ...ICON_DEFINITIONS.diseases[1], category: 'diseases' },
          { ...ICON_DEFINITIONS.diseases[2], category: 'diseases' },
          { ...ICON_DEFINITIONS.diseases[3], category: 'diseases' }
        ];
        
        const outputDir = path.join(__dirname, '..', 'public', 'icons', 'ayurvedic', 'stable-diffusion', 'samples');
        await fs.mkdir(outputDir, { recursive: true });
        
        for (const sample of samples) {
          const outputPath = path.join(outputDir, `${sample.name}.png`);
          await generator.generateIcon(sample, outputPath);
          if (sample !== samples[samples.length - 1]) {
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
        }
        break;
      case 'diseases':
        await generator.generateCategorySet('diseases', ICON_DEFINITIONS.diseases);
        break;
      case 'herbs':
        await generator.generateCategorySet('herbs', ICON_DEFINITIONS.herbs);
        break;
      case 'exercises':
        await generator.generateCategorySet('exercises', ICON_DEFINITIONS.exercises);
        break;
      case 'therapies':
        await generator.generateCategorySet('therapies', ICON_DEFINITIONS.therapies);
        break;
      case 'all':
        for (const [category, items] of Object.entries(ICON_DEFINITIONS)) {
          await generator.generateCategorySet(category, items);
        }
        break;
      default:
        console.log('Usage:');
        console.log('  node generate-stable-diffusion-icons.js sample    # Generate 4 disease samples');
        console.log('  node generate-stable-diffusion-icons.js diseases # Generate all disease icons');
        console.log('  node generate-stable-diffusion-icons.js herbs    # Generate herb icons');
        console.log('  node generate-stable-diffusion-icons.js exercises # Generate exercise icons');
        console.log('  node generate-stable-diffusion-icons.js therapies # Generate therapy icons');
        console.log('  node generate-stable-diffusion-icons.js all      # Generate all categories');
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { StableDiffusionIconGenerator, ICON_DEFINITIONS, THEME_COLORS };