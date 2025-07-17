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

// Updated icon definitions with clear, recognizable descriptions
const ICON_DEFINITIONS = {
  diseases: [
    { name: 'heart-disease', title: 'Heart Disease', colors: ['dusty rose (#daa0a9)', 'burgundy (#914372)'], description: 'Clear heart symbol with subtle healing cross or plus sign - instantly recognizable as heart health' },
    { name: 'hypertension', title: 'Hypertension', colors: ['burgundy (#914372)', 'rose (#fb7185)'], description: 'Blood pressure cuff or heart with upward arrow - clearly showing blood pressure concept' },
    { name: 'high-cholesterol', title: 'High Cholesterol', colors: ['sage (#87a878)', 'sage light (#a3bfa0)'], description: 'Heart with droplet or circulation arrows - clearly showing cholesterol/circulation concept' },
    { name: 'type2-diabetes', title: 'Type 2 Diabetes', colors: ['dusty rose (#daa0a9)', 'soft lavender (#dfbad8)'], description: 'Blood glucose drop or simple glucose meter - clearly identifiable as diabetes monitoring' },
    { name: 'obesity', title: 'Obesity', colors: ['sage (#87a878)', 'dusty rose (#daa0a9)'], description: 'Scale or body silhouette with wellness symbols - clearly showing weight management' },
    { name: 'osteoarthritis', title: 'Osteoarthritis', colors: ['burgundy (#914372)', 'sage light (#a3bfa0)'], description: 'Joint/knee symbol with healing glow - clearly showing joint health' },
    { name: 'rheumatoid-arthritis', title: 'Rheumatoid Arthritis', colors: ['sage (#87a878)', 'soft lavender (#dfbad8)'], description: 'Multiple joints with anti-inflammatory symbols - clearly showing arthritis concept' },
    { name: 'asthma', title: 'Asthma', colors: ['sage light (#a3bfa0)', 'rose (#fb7185)'], description: 'Lungs with inhaler or breathing lines - clearly identifiable as respiratory/asthma' },
    { name: 'copd', title: 'COPD', colors: ['sage (#87a878)', 'dusty rose (#daa0a9)'], description: 'Lungs with supportive breathing device - clearly showing lung support' },
    { name: 'kidney-disease', title: 'Kidney Disease', colors: ['dusty rose (#daa0a9)', 'sage light (#a3bfa0)'], description: 'Kidney bean shape with cleansing symbols - clearly identifiable as kidney health' },
    { name: 'fatty-liver', title: 'Fatty Liver', colors: ['sage (#87a878)', 'burgundy (#914372)'], description: 'Liver shape with detox symbols - clearly showing liver health' },
    { name: 'depression', title: 'Depression', colors: ['soft lavender (#dfbad8)', 'rose (#fb7185)'], description: 'Brain/head with uplifting rays or positive symbols - clearly showing mental health' },
    { name: 'anxiety', title: 'Anxiety', colors: ['sage light (#a3bfa0)', 'soft lavender (#dfbad8)'], description: 'Brain/head with calming waves or zen symbols - clearly showing anxiety relief' },
    { name: 'hypothyroidism', title: 'Hypothyroidism', colors: ['dusty rose (#daa0a9)', 'sage (#87a878)'], description: 'Thyroid butterfly shape with balance symbols - clearly identifiable as thyroid health' },
    { name: 'ibs', title: 'IBS', colors: ['sage light (#a3bfa0)', 'dusty rose (#daa0a9)'], description: 'Stomach/intestines with soothing symbols - clearly showing digestive health' },
    { name: 'gerd', title: 'GERD', colors: ['sage (#87a878)', 'soft lavender (#dfbad8)'], description: 'Stomach with flame being cooled/soothed - clearly showing acid reflux relief' }
  ],
  
  herbs: [
    { name: 'arjuna', title: 'Arjuna', colors: ['sage (#87a878)', 'sage light (#a3bfa0)'], description: 'Tree bark or sturdy tree trunk - clearly recognizable as tree-based medicine' },
    { name: 'ashwagandha', title: 'Ashwagandha', colors: ['dusty rose (#daa0a9)', 'sage (#87a878)'], description: 'Ginseng-like root with strength symbols - clearly showing adaptogenic root' },
    { name: 'triphala', title: 'Triphala', colors: ['sage light (#a3bfa0)', 'burgundy (#914372)'], description: 'Three distinct fruits grouped together - clearly showing the three-fruit combination' },
    { name: 'tulsi', title: 'Tulsi', colors: ['sage (#87a878)', 'soft lavender (#dfbad8)'], description: 'Basil leaves with sacred/spiritual glow - clearly identifiable as holy basil' },
    { name: 'brahmi', title: 'Brahmi', colors: ['soft lavender (#dfbad8)', 'sage light (#a3bfa0)'], description: 'Brain-shaped leaves or plant with cognitive symbols - clearly showing brain herb' },
    { name: 'guggulu', title: 'Guggulu', colors: ['burgundy (#914372)', 'sage (#87a878)'], description: 'Resin droplet or amber-like substance - clearly showing natural resin medicine' },
    { name: 'fenugreek', title: 'Fenugreek', colors: ['sage light (#a3bfa0)', 'burgundy (#914372)'], description: 'Distinctive fenugreek seeds - clearly identifiable seed shape' },
    { name: 'garlic', title: 'Garlic', colors: ['sage light (#a3bfa0)', 'dusty rose (#daa0a9)'], description: 'Garlic bulb with cloves - universally recognizable garlic shape' },
    { name: 'ginger', title: 'Ginger', colors: ['rose (#fb7185)', 'sage (#87a878)'], description: 'Ginger root with distinctive knobby shape - clearly identifiable as ginger' },
    { name: 'turmeric', title: 'Turmeric', colors: ['burgundy (#914372)', 'dusty rose (#daa0a9)'], description: 'Turmeric root with golden glow - clearly showing the golden spice root' }
  ],
  
  exercises: [
    { name: 'yoga-cobra', title: 'Cobra Pose', colors: ['dusty rose (#daa0a9)', 'sage (#87a878)'], description: 'Person lying face down, lifting chest and head up - clearly identifiable cobra yoga pose' },
    { name: 'yoga-bridge', title: 'Bridge Pose', colors: ['sage light (#a3bfa0)', 'rose (#fb7185)'], description: 'Person lying on back, hips lifted up forming bridge - clearly recognizable bridge pose' },
    { name: 'yoga-warrior', title: 'Warrior Pose', colors: ['burgundy (#914372)', 'sage (#87a878)'], description: 'Person in strong standing lunge with arms extended - clearly identifiable warrior pose' },
    { name: 'yoga-tree', title: 'Tree Pose', colors: ['sage (#87a878)', 'dusty rose (#daa0a9)'], description: 'Person standing on one leg, other foot on thigh, arms up - clearly recognizable tree pose' },
    { name: 'yoga-downward-dog', title: 'Downward Dog', colors: ['rose (#fb7185)', 'sage (#87a878)'], description: 'Person in inverted V shape, hands and feet on ground - clearly identifiable downward dog' },
    { name: 'yoga-child', title: 'Child Pose', colors: ['soft lavender (#dfbad8)', 'sage light (#a3bfa0)'], description: 'Person kneeling, sitting back on heels, forehead to ground - clearly recognizable child pose' },
    { name: 'meditation', title: 'Meditation', colors: ['soft lavender (#dfbad8)', 'sage light (#a3bfa0)'], description: 'Person sitting cross-legged with straight spine - universally recognizable meditation pose' },
    { name: 'pranayama', title: 'Breathing Exercise', colors: ['sage (#87a878)', 'soft lavender (#dfbad8)'], description: 'Person in meditation pose with breath flow visualization - clearly showing breathing practice' },
    { name: 'walking', title: 'Walking', colors: ['rose (#fb7185)', 'sage (#87a878)'], description: 'Person in walking stride with movement lines - clearly identifiable walking exercise' },
    { name: 'stretching', title: 'Stretching', colors: ['dusty rose (#daa0a9)', 'sage light (#a3bfa0)'], description: 'Person in gentle stretch pose - clearly showing flexibility exercise' }
  ],
  
  therapies: [
    { name: 'abhyanga', title: 'Oil Massage', colors: ['dusty rose (#daa0a9)', 'soft lavender (#dfbad8)'], description: 'Hands applying oil with massage motions - clearly showing massage therapy' },
    { name: 'steam-therapy', title: 'Steam Therapy', colors: ['sage light (#a3bfa0)', 'soft lavender (#dfbad8)'], description: 'Person with steam/vapor around them - clearly identifiable steam treatment' },
    { name: 'shirodhara', title: 'Shirodhara', colors: ['soft lavender (#dfbad8)', 'dusty rose (#daa0a9)'], description: 'Oil stream pouring onto forehead - clearly showing the specific oil therapy' },
    { name: 'aromatherapy', title: 'Aromatherapy', colors: ['soft lavender (#dfbad8)', 'sage light (#a3bfa0)'], description: 'Essential oil diffuser with aroma waves - clearly identifiable aromatherapy' },
    { name: 'sound-therapy', title: 'Sound Therapy', colors: ['burgundy (#914372)', 'soft lavender (#dfbad8)'], description: 'Singing bowl or sound waves - clearly showing sound healing' },
    { name: 'diet-therapy', title: 'Diet Therapy', colors: ['sage light (#a3bfa0)', 'burgundy (#914372)'], description: 'Healthy foods arranged therapeutically - clearly showing nutritional therapy' },
    { name: 'sleep-hygiene', title: 'Sleep Hygiene', colors: ['dusty rose (#daa0a9)', 'soft lavender (#dfbad8)'], description: 'Person sleeping peacefully with moon/stars - clearly identifiable sleep wellness' },
    { name: 'stress-management', title: 'Stress Management', colors: ['soft lavender (#dfbad8)', 'sage (#87a878)'], description: 'Person in calm state with stress symbols dissipating - clearly showing stress relief' }
  ]
};

class ClearIconGenerator {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  generatePrompt(item) {
    const colorString = item.colors.join(' and ');
    
    return `Create a clear, recognizable icon for "${item.title}" for an Ayurvedic wellness app.

DESIGN REQUIREMENT: ${item.description}

CRITICAL REQUIREMENTS:
• MUST be immediately recognizable and understandable
• Clean, simple iconography that communicates the concept clearly
• NOT abstract or artistic - users must instantly understand what it represents
• Vector-style icon with clear, defined shapes
• Colors: Use ONLY ${colorString} from the Thrive app palette
• Background: Transparent
• Size: 512x512 pixels, scalable for mobile use

DESIGN PRINCIPLES:
• Iconic clarity - the shape/symbol should be universally understood
• Simple, clean lines with rounded edges for friendliness
• Single focal element that tells the story immediately
• Minimal details that remain clear when scaled down
• Professional medical/wellness iconography standards
• Cultural sensitivity for Ayurvedic concepts

EXAMPLES OF GOOD ICONOGRAPHY:
• Heart symbol = heart health (everyone recognizes this)
• Lungs shape = respiratory health (clear medical symbol)
• Yoga pose = specific recognizable pose (not abstract figure)
• Plant/herb = clearly identifiable botanical element
• Massage hands = obvious therapeutic touch

AVOID:
• Abstract or artistic interpretations
• Complex details that blur when small
• Ambiguous shapes that could mean multiple things
• Photorealistic style
• Colors outside the specified palette
• Text or labels

Create an icon that a user would immediately understand without explanation - clear, professional, and recognizable iconography.`;
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

  async generateIcon(item, outputPath) {
    console.log(`🎨 Generating: ${item.title}`);
    console.log(`🎯 Colors: ${item.colors.join(', ')}`);
    
    const prompt = this.generatePrompt(item);
    
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
        
        // Save metadata
        const metadata = {
          name: item.name,
          title: item.title,
          category: item.category || 'unknown',
          colors: item.colors,
          description: item.description,
          imageUrl: imageUrl,
          filePath: downloadPath,
          generated: new Date().toISOString(),
          style: 'clear-iconography'
        };
        
        const metadataPath = outputPath.replace('.png', '.json');
        await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
        
        return {
          success: true,
          name: item.name,
          title: item.title,
          filePath: downloadPath,
          imageUrl: imageUrl,
          metadata: metadata
        };
      } else {
        throw new Error('No image URL in response');
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

  async generateCategorySet(categoryName, items) {
    console.log(`\n🎨 Generating ${categoryName} clear icons (${items.length} items)...`);
    
    const outputDir = path.join(__dirname, '..', 'public', 'icons', 'ayurvedic', 'clear-icons', categoryName);
    await fs.mkdir(outputDir, { recursive: true });
    
    const results = [];
    
    for (let i = 0; i < items.length; i++) {
      const item = { ...items[i], category: categoryName };
      const outputPath = path.join(outputDir, `${item.name}.png`);
      
      const result = await this.generateIcon(item, outputPath);
      results.push(result);
      
      // Delay between requests to respect rate limits
      if (i < items.length - 1) {
        console.log(`⏳ Waiting 3 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    return results;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.log('❌ OpenAI API key is required');
    return;
  }
  
  const generator = new ClearIconGenerator(apiKey);
  
  try {
    console.log('🎯 Clear Icon Generator for Thrive App');
    console.log('═'.repeat(50));
    console.log('🎨 Creating clear, recognizable iconography\n');
    
    switch (command) {
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
      case 'sample':
        // Generate one from each category as samples
        const samples = [
          { ...ICON_DEFINITIONS.diseases[0], category: 'diseases' },
          { ...ICON_DEFINITIONS.herbs[0], category: 'herbs' },
          { ...ICON_DEFINITIONS.exercises[0], category: 'exercises' },
          { ...ICON_DEFINITIONS.therapies[0], category: 'therapies' }
        ];
        
        for (const sample of samples) {
          const outputDir = path.join(__dirname, '..', 'public', 'icons', 'ayurvedic', 'clear-icons', 'samples');
          await fs.mkdir(outputDir, { recursive: true });
          const outputPath = path.join(outputDir, `${sample.name}.png`);
          await generator.generateIcon(sample, outputPath);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        break;
      default:
        console.log('Usage:');
        console.log('  node generate-clear-icons.js sample     # Generate 4 clear samples');
        console.log('  node generate-clear-icons.js diseases  # Generate disease icons');
        console.log('  node generate-clear-icons.js herbs     # Generate herb icons');
        console.log('  node generate-clear-icons.js exercises # Generate exercise icons');
        console.log('  node generate-clear-icons.js therapies # Generate therapy icons');
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { ClearIconGenerator, ICON_DEFINITIONS, THEME_COLORS };