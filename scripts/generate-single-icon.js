#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const { URL } = require('url');

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

const ABHYANGA_ICON = {
  name: 'abhyanga',
  title: 'Abhyanga (Oil Massage)',
  category: 'therapies',
  colors: ['soft lavender (#dfbad8)', 'dusty rose (#daa0a9)'],
  description: 'Two gentle, cupped hands with golden oil droplets falling between them, emphasizing healing touch and nurturing wellness therapy'
};

class DallEIconGenerator {
  constructor(apiKey) {
    this.apiKey = apiKey;
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
    console.log(`🎨 Generating: ${icon.title}`);
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
}

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.log('❌ OpenAI API key is required');
    return;
  }
  
  const generator = new DallEIconGenerator(apiKey);
  
  const outputDir = path.join(__dirname, '..', 'public', 'icons', 'ayurvedic', 'dalle-generated');
  await fs.mkdir(outputDir, { recursive: true });
  
  const outputPath = path.join(outputDir, `${ABHYANGA_ICON.name}.png`);
  
  const result = await generator.generateIcon(ABHYANGA_ICON, outputPath);
  
  if (result.success) {
    console.log('\n✅ Successfully generated abhyanga icon!');
    console.log(`📁 Saved to: ${result.filePath}`);
    
    // Now create the complete index
    const indexData = {
      generated: new Date().toISOString(),
      app: 'Thrive - Ayurvedic Wellness',
      description: 'Sample PNG icons generated with DALL-E 3 using Thrive app colors',
      generator: 'DALL-E 3',
      themeColors: THEME_COLORS,
      totalGenerated: 4,
      categories: {
        diseases: 'Health conditions with healing-focused symbols',
        herbs: 'Ayurvedic herbs and remedies with natural elements',
        exercises: 'Yoga poses and physical practices',
        therapies: 'External treatments and lifestyle interventions'
      }
    };
    
    const indexPath = path.join(outputDir, 'index.json');
    await fs.writeFile(indexPath, JSON.stringify(indexData, null, 2));
    
    console.log('\n🎉 All 4 sample icons completed!');
    console.log('📋 Index file created');
    
  } else {
    console.error('❌ Failed to generate icon:', result.error);
  }
}

if (require.main === module) {
  main().catch(console.error);
}