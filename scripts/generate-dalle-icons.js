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

// Sample icons for approval
const SAMPLE_ICONS = [
  {
    name: 'heart-disease',
    title: 'Heart Disease (Coronary Artery Disease)',
    category: 'diseases',
    colors: ['dusty rose (#daa0a9)', 'burgundy (#914372)'],
    description: 'A gentle heart shape with a subtle healing plus sign, using soft rounded edges and a warm glow to emphasize wellness and hope rather than illness'
  },
  {
    name: 'arjuna',
    title: 'Arjuna (Heart Tonic)',
    category: 'herbs',
    colors: ['sage green (#87a878)', 'sage light (#a3bfa0)'],
    description: 'A stylized tree bark or elegant leaf representing the Arjuna herb, with natural healing energy and botanical elements'
  },
  {
    name: 'yoga-cobra',
    title: 'Cobra Pose (Bhujangasana)',
    category: 'exercises',
    colors: ['rose (#fb7185)', 'sage (#87a878)'],
    description: 'A peaceful human silhouette in cobra yoga pose - lying down with chest gracefully lifted, showing serene movement and spiritual energy'
  },
  {
    name: 'abhyanga',
    title: 'Abhyanga (Oil Massage)',
    category: 'therapies',
    colors: ['soft lavender (#dfbad8)', 'dusty rose (#daa0a9)'],
    description: 'Two gentle, cupped hands with golden oil droplets falling between them, emphasizing healing touch and nurturing wellness therapy'
  }
];

class DallEIconGenerator {
  constructor(apiKey) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY;
    if (!this.apiKey) {
      throw new Error('OpenAI API key is required. Set OPENAI_API_KEY environment variable or pass as parameter.');
    }
    this.baseUrl = 'https://api.openai.com/v1/images/generations';
  }

  generatePrompt(icon) {
    const colorString = icon.colors.join(' and ');
    
    return `Create a minimalist mobile app icon for "${icon.title}" in the Ayurvedic holistic health style.

DESIGN: ${icon.description}

SPECIFICATIONS:
• Style: Clean vector icon with rounded shapes and soft edges
• Colors: Use ONLY ${colorString} from the Thrive wellness app palette
• Background: Completely transparent/white (will be made transparent)
• Format: High-quality icon suitable for mobile apps
• Size: Square format, optimized for 512x512 pixels
• Mood: Healing, peaceful, warm, and inviting - NOT clinical

DESIGN PRINCIPLES:
• Rounded corners throughout, no sharp edges
• Single focal element for clarity at small sizes
• Flat design with subtle gradients using only specified colors
• No text, labels, or written elements
• Cultural sensitivity for Ayurvedic traditions
• Emphasizes wellness and natural healing

AVOID:
• Sharp edges or aggressive shapes
• Clinical or harsh medical appearance
• Complex details that disappear when scaled down
• Colors outside the specified palette
• Photorealistic style
• Text or numbers

Create a cohesive, premium icon for a wellness app that guides users on their Ayurvedic healing journey.`;
  }

  async downloadImage(imageUrl, outputPath) {
    return new Promise((resolve, reject) => {
      const url = new URL(imageUrl);
      
      const options = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: 'GET'
      };

      const req = https.request(options, (res) => {
        if (res.statusCode === 200) {
          const chunks = [];
          
          res.on('data', (chunk) => {
            chunks.push(chunk);
          });
          
          res.on('end', async () => {
            const buffer = Buffer.concat(chunks);
            try {
              await fs.writeFile(outputPath, buffer);
              resolve(outputPath);
            } catch (error) {
              reject(error);
            }
          });
        } else {
          reject(new Error(`Failed to download image: ${res.statusCode}`));
        }
      });

      req.on('error', reject);
      req.end();
    });
  }

  async generateIcon(icon, outputPath) {
    console.log(`\n🎨 Generating: ${icon.title}`);
    console.log(`🎯 Colors: ${icon.colors.join(', ')}`);
    
    const prompt = this.generatePrompt(icon);
    
    try {
      console.log(`🔄 Sending request to DALL-E 3...`);
      
      const postData = JSON.stringify({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "hd",
        style: "natural"
      });

      const response = await this.makeApiRequest(postData);
      
      if (response.data && response.data[0] && response.data[0].url) {
        const imageUrl = response.data[0].url;
        console.log(`📥 Downloading image...`);
        
        const downloadPath = await this.downloadImage(imageUrl, outputPath);
        console.log(`✅ Saved: ${path.basename(downloadPath)}`);
        
        // Save the prompt for reference
        const promptPath = outputPath.replace('.png', '.prompt.txt');
        await fs.writeFile(promptPath, prompt);
        
        // Save metadata
        const metadata = {
          name: icon.name,
          title: icon.title,
          category: icon.category,
          colors: icon.colors,
          imageUrl: imageUrl,
          filePath: downloadPath,
          promptPath: promptPath,
          generated: new Date().toISOString()
        };
        
        const metadataPath = outputPath.replace('.png', '.json');
        await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
        
        return {
          success: true,
          name: icon.name,
          title: icon.title,
          filePath: downloadPath,
          imageUrl: imageUrl,
          metadata: metadata
        };
      } else {
        throw new Error('No image URL in response');
      }
      
    } catch (error) {
      console.error(`❌ Failed to generate ${icon.name}:`, error.message);
      return {
        success: false,
        name: icon.name,
        title: icon.title,
        error: error.message
      };
    }
  }

  async makeApiRequest(postData) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.openai.com',
        port: 443,
        path: '/v1/images/generations',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (res.statusCode === 200) {
              resolve(response);
            } else {
              reject(new Error(`API Error ${res.statusCode}: ${response.error?.message || data}`));
            }
          } catch (error) {
            reject(new Error(`Failed to parse API response: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Request failed: ${error.message}`));
      });

      req.write(postData);
      req.end();
    });
  }

  async generateSampleIcons() {
    console.log('🚀 Generating 4 sample Ayurvedic PNG icons with DALL-E 3...\n');
    console.log('🎨 Using Thrive app color palette for consistency\n');
    
    const outputDir = path.join(__dirname, '..', 'public', 'icons', 'ayurvedic', 'dalle-generated');
    await fs.mkdir(outputDir, { recursive: true });
    
    const results = [];
    
    for (let i = 0; i < SAMPLE_ICONS.length; i++) {
      const icon = SAMPLE_ICONS[i];
      const outputPath = path.join(outputDir, `${icon.name}.png`);
      
      const result = await this.generateIcon(icon, outputPath);
      results.push({ category: icon.category, ...result });
      
      // Delay between requests to respect rate limits
      if (i < SAMPLE_ICONS.length - 1) {
        console.log(`⏳ Waiting 5 seconds before next generation...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    // Generate summary
    console.log('\n📊 GENERATION SUMMARY');
    console.log('═'.repeat(60));
    
    results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${result.title}`);
      console.log(`   Category: ${result.category}`);
      console.log(`   File: ${result.name}.png`);
      if (result.imageUrl) {
        console.log(`   Source: ${result.imageUrl.substring(0, 50)}...`);
      }
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      console.log('');
    });
    
    const successCount = results.filter(r => r.success).length;
    console.log(`\n🎯 Successfully generated: ${successCount}/4 icons`);
    console.log(`📁 Files saved to: ${outputDir}`);
    
    // Create comprehensive index
    const indexData = {
      generated: new Date().toISOString(),
      app: 'Thrive - Ayurvedic Wellness',
      description: 'Sample PNG icons generated with DALL-E 3 using Thrive app colors',
      generator: 'DALL-E 3',
      themeColors: THEME_COLORS,
      totalGenerated: successCount,
      results: results,
      categories: {
        diseases: 'Health conditions with healing-focused symbols',
        herbs: 'Ayurvedic herbs and remedies with natural elements',
        exercises: 'Yoga poses and physical practices',
        therapies: 'External treatments and lifestyle interventions'
      }
    };
    
    const indexPath = path.join(outputDir, 'index.json');
    await fs.writeFile(indexPath, JSON.stringify(indexData, null, 2));
    
    console.log(`\n📋 Index created: ${path.basename(indexPath)}`);
    
    if (successCount === 4) {
      console.log('\n✨ All 4 sample icons generated successfully!');
      console.log('\n🔄 NEXT STEPS:');
      console.log('1. 👀 Review the generated PNG icons');
      console.log('2. 🧪 Test icons at mobile sizes (48px) for clarity');
      console.log('3. ✅ Approve the style and quality');
      console.log('4. 🚀 Run full generation for all 89+ icons');
      console.log('\n💡 To generate all icons: node generate-dalle-icons.js full');
    } else {
      console.log('\n⚠️  Some icons failed to generate. Check the errors above.');
      console.log('💡 You can retry individual icons or adjust prompts as needed.');
    }
    
    return results;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const apiKey = args[1] || process.env.OPENAI_API_KEY;
  
  try {
    console.log('🎨 DALL-E 3 Icon Generator for Thrive App');
    console.log('═'.repeat(45));
    
    if (!apiKey) {
      console.log('❌ OpenAI API key is required');
      console.log('💡 Set OPENAI_API_KEY environment variable or pass as argument');
      console.log('🔗 Get your API key from: https://platform.openai.com/api-keys');
      return;
    }
    
    const generator = new DallEIconGenerator(apiKey);
    
    switch (command) {
      case 'samples':
      case undefined:
        await generator.generateSampleIcons();
        break;
      case 'full':
        console.log('🚧 Full generation not implemented yet');
        console.log('📝 Generate samples first for approval');
        break;
      default:
        console.log('Usage:');
        console.log('  node generate-dalle-icons.js samples [api-key]  # Generate 4 sample icons');
        console.log('  node generate-dalle-icons.js full [api-key]     # Generate all icons (coming soon)');
        console.log('');
        console.log('Environment Variables:');
        console.log('  OPENAI_API_KEY    # Your OpenAI API key');
        console.log('');
        console.log('💰 Cost estimate: ~$0.04 per icon (DALL-E 3 HD quality)');
        console.log('📊 Sample generation cost: ~$0.16 for 4 icons');
        console.log('🎯 Full set cost: ~$3.56 for 89 icons');
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { DallEIconGenerator, SAMPLE_ICONS, THEME_COLORS };