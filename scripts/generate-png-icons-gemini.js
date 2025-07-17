#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const https = require('https');

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
    colors: [THEME_COLORS.dustyRose, THEME_COLORS.burgundy],
    description: 'Simple heart shape with subtle plus sign or healing glow, emphasizing wellness and hope rather than illness'
  },
  {
    name: 'arjuna',
    title: 'Arjuna (Heart Tonic)',
    category: 'herbs',
    colors: [THEME_COLORS.sage, THEME_COLORS.sageLight],
    description: 'Stylized tree bark or leaf representing the Arjuna herb, with natural healing energy'
  },
  {
    name: 'yoga-cobra',
    title: 'Cobra Pose (Bhujangasana)',
    category: 'exercises',
    colors: [THEME_COLORS.rose, THEME_COLORS.sage],
    description: 'Human silhouette in cobra yoga pose - lying down with chest lifted, showing peaceful movement'
  },
  {
    name: 'abhyanga',
    title: 'Abhyanga (Oil Massage)',
    category: 'therapies',
    colors: [THEME_COLORS.softLavender, THEME_COLORS.dustyRose],
    description: 'Two gentle hands with oil droplets, emphasizing healing touch and wellness therapy'
  }
];

class GeminiImageGenerator {
  constructor(apiKey) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY;
    if (!this.apiKey) {
      throw new Error('Gemini API key is required. Set GEMINI_API_KEY environment variable or pass as parameter.');
    }
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent';
  }

  generateImagePrompt(icon) {
    const colorString = icon.colors.map(color => `${color}`).join(', ');
    
    return `Generate a mobile app icon for "${icon.title}" in the Ayurvedic holistic health domain.

DESIGN SPECIFICATIONS:
- ${icon.description}
- Style: Clean, minimalist vector icon with rounded shapes and soft edges
- Colors: Use ONLY these exact Thrive app theme colors: ${colorString}
- Background: Completely transparent (PNG format)
- Size: 512x512 pixels, optimized for mobile display (scalable to 48px)
- Format: PNG with transparent background

DESIGN PRINCIPLES:
- Friendly and approachable with rounded corners throughout
- Single focal element for clarity at small sizes
- Flat design with subtle gradients allowed (using only specified colors)
- No text, labels, or written elements
- Cultural sensitivity for Ayurvedic traditions
- Conveys wellness, healing, and natural health

MOOD & STYLE:
- Healing, peaceful, non-intimidating
- Warm and inviting, not clinical
- Emphasizes hope and wellness rather than illness
- Premium mobile app aesthetic
- Consistent with modern wellness applications

TECHNICAL REQUIREMENTS:
- PNG format with full transparency
- 512x512 pixel dimensions
- Vector-style artwork (clean lines, no photorealistic details)
- Readable at both 512px and 48px sizes  
- Optimized for both light and dark app backgrounds
- No drop shadows or 3D effects

AVOID:
- Sharp edges or aggressive shapes
- Clinical or medical appearance
- Complex details that disappear when scaled down
- Colors outside the specified Thrive app palette
- Photorealistic style
- Text, numbers, or written labels
- Harsh or alarming visual elements

Create a cohesive icon that feels like part of a premium wellness app guiding users on their Ayurvedic healing journey.`;
  }

  async makeImageRequest(prompt) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        contents: [{
          parts: [{
            text: `Generate an image based on this prompt: ${prompt}

Please create a PNG image with transparent background, 512x512 pixels, following all the specifications exactly.`
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 32,
          topP: 0.8,
          maxOutputTokens: 1024,
        }
      });

      const url = new URL(`${this.baseUrl}?key=${this.apiKey}`);
      
      const options = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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

  async generateIconImage(icon, outputPath) {
    console.log(`\n🎨 Generating PNG icon: ${icon.title}`);
    console.log(`📁 Output: ${path.basename(outputPath)}`);
    
    const prompt = this.generateImagePrompt(icon);
    
    try {
      console.log(`🔄 Sending request to Gemini API...`);
      const response = await this.makeImageRequest(prompt);
      
      // Note: The actual Gemini API doesn't generate images directly yet
      // This is a placeholder implementation
      // In practice, you would need to use a different image generation API
      
      console.log(`❌ Gemini API doesn't support image generation yet`);
      console.log(`💡 Creating detailed prompt file instead...`);
      
      // Save the detailed prompt for use with other image generation services
      const promptPath = outputPath.replace('.png', '.prompt.txt');
      await fs.writeFile(promptPath, prompt);
      
      // Create a placeholder PNG info file
      const info = {
        name: icon.name,
        title: icon.title,
        category: icon.category,
        colors: icon.colors,
        prompt: prompt,
        note: 'Use this prompt with DALL-E 3, Midjourney, or other image generation services',
        specifications: {
          format: 'PNG',
          size: '512x512',
          background: 'transparent',
          style: 'vector icon'
        },
        generated: new Date().toISOString()
      };
      
      const infoPath = outputPath.replace('.png', '.json');
      await fs.writeFile(infoPath, JSON.stringify(info, null, 2));
      
      console.log(`✅ Prompt saved: ${promptPath}`);
      console.log(`📋 Info saved: ${infoPath}`);
      
      return {
        success: true,
        name: icon.name,
        title: icon.title,
        promptPath: promptPath,
        infoPath: infoPath,
        needsImageGeneration: true
      };
      
    } catch (error) {
      console.error(`❌ Failed to process ${icon.name}:`, error.message);
      return {
        success: false,
        error: error.message,
        name: icon.name,
        title: icon.title
      };
    }
  }

  async generateSampleIcons() {
    console.log('🚀 Creating 4 sample Ayurvedic PNG icons using Gemini API...\n');
    
    const outputDir = path.join(__dirname, '..', 'public', 'icons', 'ayurvedic', 'png-samples');
    await fs.mkdir(outputDir, { recursive: true });
    
    const results = [];
    
    for (let i = 0; i < SAMPLE_ICONS.length; i++) {
      const icon = SAMPLE_ICONS[i];
      const outputPath = path.join(outputDir, `${icon.name}.png`);
      
      const result = await this.generateIconImage(icon, outputPath);
      results.push({ category: icon.category, ...result });
      
      // Small delay to be respectful to API
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Generate summary
    console.log('\n📊 SAMPLE GENERATION SUMMARY');
    console.log('═'.repeat(60));
    
    results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${result.title}`);
      console.log(`   Category: ${result.category}`);
      console.log(`   Icon: ${result.name}`);
      if (result.promptPath) {
        console.log(`   Prompt: ${path.basename(result.promptPath)}`);
      }
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      console.log('');
    });
    
    const successCount = results.filter(r => r.success).length;
    console.log(`\n🎯 Processed ${successCount}/4 sample icons successfully!`);
    console.log(`📁 Files saved to: ${outputDir}`);
    
    // Create index file
    const indexData = {
      generated: new Date().toISOString(),
      app: 'Thrive - Ayurvedic Wellness',
      description: 'PNG icon generation prompts for Gemini/DALL-E/Midjourney',
      themeColors: THEME_COLORS,
      results: results,
      instructions: {
        step1: 'Use the .prompt.txt files with DALL-E 3, Midjourney, or other image generators',
        step2: 'Request PNG format with transparent background, 512x512 pixels',
        step3: 'Ensure icons use only the specified Thrive app colors',
        step4: 'Save generated images as .png files in this directory',
        step5: 'Test icons at both 512px and 48px sizes for mobile optimization'
      }
    };
    
    const indexPath = path.join(outputDir, 'index.json');
    await fs.writeFile(indexPath, JSON.stringify(indexData, null, 2));
    
    console.log('\n🔄 NEXT STEPS:');
    console.log('1. 📝 Review the generated .prompt.txt files');
    console.log('2. 🎨 Use prompts with DALL-E 3, Midjourney, or other image generators');
    console.log('3. 💾 Save generated PNG images (512x512, transparent background)');
    console.log('4. ✅ Test icons at mobile sizes (48px) for clarity');
    console.log('5. 🚀 Once approved, generate the full set of 89+ icons');
    
    console.log('\n💡 RECOMMENDED IMAGE GENERATION SERVICES:');
    console.log('• DALL-E 3 (OpenAI) - Best for precise specifications');
    console.log('• Midjourney - Great for artistic style');
    console.log('• Stable Diffusion - Open source option');
    console.log('• Adobe Firefly - Good for commercial use');
    
    return results;
  }
}

// Alternative: Use DALL-E API directly for actual image generation
class DallEIconGenerator {
  constructor(apiKey) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY;
    if (!this.apiKey) {
      throw new Error('OpenAI API key is required for DALL-E image generation.');
    }
    this.baseUrl = 'https://api.openai.com/v1/images/generations';
  }

  async generateIconWithDallE(icon, outputPath) {
    const prompt = `A minimalist mobile app icon for "${icon.title}" in Ayurvedic wellness style. ${icon.description}. Use only colors ${icon.colors.join(', ')}. Transparent background, 512x512 pixels, clean vector style with rounded shapes. No text. Premium wellness app aesthetic.`;
    
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "hd",
        style: "natural"
      });

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
        
        res.on('end', async () => {
          try {
            const response = JSON.parse(data);
            if (res.statusCode === 200) {
              const imageUrl = response.data[0].url;
              console.log(`🎨 Generated image for ${icon.name}: ${imageUrl}`);
              
              // Download and save the image
              // (Implementation would require additional HTTP client for downloading)
              
              resolve({
                success: true,
                name: icon.name,
                imageUrl: imageUrl,
                prompt: prompt
              });
            } else {
              reject(new Error(`DALL-E API Error ${res.statusCode}: ${response.error?.message || data}`));
            }
          } catch (error) {
            reject(new Error(`Failed to parse DALL-E response: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`DALL-E request failed: ${error.message}`));
      });

      req.write(postData);
      req.end();
    });
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const apiKey = args[1] || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
  
  try {
    console.log('🎨 PNG Icon Generator for Thrive App');
    console.log('═'.repeat(40));
    
    if (command === 'dalle' && process.env.OPENAI_API_KEY) {
      console.log('Using DALL-E 3 for direct image generation...\n');
      const generator = new DallEIconGenerator(apiKey);
      // Implementation would continue here
      console.log('DALL-E integration ready but requires additional download logic');
    } else {
      console.log('Using Gemini API for detailed prompt generation...\n');
      const generator = new GeminiImageGenerator(apiKey);
      
      switch (command) {
        case 'samples':
        case undefined:
          await generator.generateSampleIcons();
          break;
        default:
          console.log('Usage:');
          console.log('  node generate-png-icons-gemini.js samples [api-key]');
          console.log('  node generate-png-icons-gemini.js dalle [openai-api-key]');
          console.log('');
          console.log('Environment Variables:');
          console.log('  GEMINI_API_KEY    # Google Gemini API key');
          console.log('  OPENAI_API_KEY    # OpenAI API key for DALL-E');
      }
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    if (error.message.includes('API key')) {
      console.log('\n💡 Get API keys from:');
      console.log('• Gemini: https://makersuite.google.com/app/apikey');
      console.log('• OpenAI: https://platform.openai.com/api-keys');
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { GeminiImageGenerator, DallEIconGenerator, SAMPLE_ICONS, THEME_COLORS };