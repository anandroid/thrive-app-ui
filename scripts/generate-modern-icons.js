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

// Complete icon definitions with modern approach
const ICON_DEFINITIONS = {
  diseases: [
    { name: 'heart-disease', title: 'Heart Disease', colors: ['dusty rose (#daa0a9)', 'burgundy (#914372)'], description: 'Modern heart icon with subtle gradient and clean lines' },
    { name: 'hypertension', title: 'Hypertension', colors: ['burgundy (#914372)', 'rose (#fb7185)'], description: 'Modern blood pressure symbol with gradient flow' },
    { name: 'high-cholesterol', title: 'High Cholesterol', colors: ['sage (#87a878)', 'sage light (#a3bfa0)'], description: 'Modern heart with circulation elements in sage gradient' },
    { name: 'type2-diabetes', title: 'Type 2 Diabetes', colors: ['dusty rose (#daa0a9)', 'soft lavender (#dfbad8)'], description: 'Modern glucose drop or meter icon with soft gradient' },
    { name: 'obesity', title: 'Obesity', colors: ['sage (#87a878)', 'dusty rose (#daa0a9)'], description: 'Modern wellness scale or body silhouette with positive styling' },
    { name: 'osteoarthritis', title: 'Osteoarthritis', colors: ['burgundy (#914372)', 'sage light (#a3bfa0)'], description: 'Modern joint icon with healing gradient' },
    { name: 'rheumatoid-arthritis', title: 'Rheumatoid Arthritis', colors: ['sage (#87a878)', 'soft lavender (#dfbad8)'], description: 'Modern multiple joints icon with soothing colors' },
    { name: 'asthma', title: 'Asthma', colors: ['sage light (#a3bfa0)', 'rose (#fb7185)'], description: 'Modern lungs icon with clean airflow lines' },
    { name: 'copd', title: 'COPD', colors: ['sage (#87a878)', 'dusty rose (#daa0a9)'], description: 'Modern respiratory support icon with gradient' },
    { name: 'kidney-disease', title: 'Kidney Disease', colors: ['dusty rose (#daa0a9)', 'sage light (#a3bfa0)'], description: 'Modern kidney icon with cleansing elements' },
    { name: 'fatty-liver', title: 'Fatty Liver', colors: ['sage (#87a878)', 'burgundy (#914372)'], description: 'Modern liver icon with detox gradient' },
    { name: 'depression', title: 'Depression', colors: ['soft lavender (#dfbad8)', 'rose (#fb7185)'], description: 'Modern brain/mind icon with uplifting gradient' },
    { name: 'anxiety', title: 'Anxiety', colors: ['sage light (#a3bfa0)', 'soft lavender (#dfbad8)'], description: 'Modern calming brain icon with peaceful gradient' },
    { name: 'hypothyroidism', title: 'Hypothyroidism', colors: ['dusty rose (#daa0a9)', 'sage (#87a878)'], description: 'Modern thyroid butterfly icon with balance gradient' },
    { name: 'ibs', title: 'IBS', colors: ['sage light (#a3bfa0)', 'dusty rose (#daa0a9)'], description: 'Modern digestive system icon with soothing gradient' },
    { name: 'gerd', title: 'GERD', colors: ['sage (#87a878)', 'soft lavender (#dfbad8)'], description: 'Modern stomach icon with cooling gradient' }
  ],
  
  herbs: [
    { name: 'arjuna', title: 'Arjuna', colors: ['sage (#87a878)', 'sage light (#a3bfa0)'], description: 'Modern tree bark icon with natural sage gradient' },
    { name: 'pushkarmool', title: 'Pushkarmool', colors: ['sage (#87a878)', 'dusty rose (#daa0a9)'], description: 'Modern root icon with healing gradient' },
    { name: 'guggulu', title: 'Guggulu', colors: ['burgundy (#914372)', 'sage (#87a878)'], description: 'Modern resin droplet with rich gradient' },
    { name: 'garlic', title: 'Garlic', colors: ['sage light (#a3bfa0)', 'dusty rose (#daa0a9)'], description: 'Modern garlic bulb with fresh gradient' },
    { name: 'rauwolfia', title: 'Rauwolfia', colors: ['sage (#87a878)', 'soft lavender (#dfbad8)'], description: 'Modern root with calming gradient' },
    { name: 'ashwagandha', title: 'Ashwagandha', colors: ['dusty rose (#daa0a9)', 'sage (#87a878)'], description: 'Modern adaptogenic root with strength gradient' },
    { name: 'triphala', title: 'Triphala', colors: ['sage light (#a3bfa0)', 'burgundy (#914372)'], description: 'Modern three fruits arrangement with rich gradient' },
    { name: 'jatamansi', title: 'Jatamansi', colors: ['soft lavender (#dfbad8)', 'sage light (#a3bfa0)'], description: 'Modern calming herb with peaceful gradient' },
    { name: 'boswellia', title: 'Boswellia', colors: ['sage (#87a878)', 'dusty rose (#daa0a9)'], description: 'Modern frankincense with healing gradient' },
    { name: 'fenugreek', title: 'Fenugreek', colors: ['sage light (#a3bfa0)', 'burgundy (#914372)'], description: 'Modern fenugreek seeds with metabolic gradient' },
    { name: 'tulsi', title: 'Tulsi', colors: ['sage (#87a878)', 'soft lavender (#dfbad8)'], description: 'Modern holy basil leaves with sacred gradient' },
    { name: 'vasaka', title: 'Vasaka', colors: ['sage light (#a3bfa0)', 'dusty rose (#daa0a9)'], description: 'Modern respiratory herb with breathing gradient' },
    { name: 'gymnema', title: 'Gymnema', colors: ['sage (#87a878)', 'rose (#fb7185)'], description: 'Modern sugar-blocking herb with balance gradient' },
    { name: 'brahmi', title: 'Brahmi', colors: ['soft lavender (#dfbad8)', 'sage light (#a3bfa0)'], description: 'Modern brain herb with cognitive gradient' },
    { name: 'shatavari', title: 'Shatavari', colors: ['dusty rose (#daa0a9)', 'soft lavender (#dfbad8)'], description: 'Modern feminine wellness herb with nurturing gradient' },
    { name: 'licorice', title: 'Licorice', colors: ['sage (#87a878)', 'dusty rose (#daa0a9)'], description: 'Modern licorice root with soothing gradient' },
    { name: 'trikatu', title: 'Trikatu', colors: ['rose (#fb7185)', 'burgundy (#914372)'], description: 'Modern three spices with warming gradient' },
    { name: 'punarnava', title: 'Punarnava', colors: ['sage light (#a3bfa0)', 'dusty rose (#daa0a9)'], description: 'Modern rejuvenating herb with renewal gradient' },
    { name: 'gokshura', title: 'Gokshura', colors: ['sage (#87a878)', 'burgundy (#914372)'], description: 'Modern tribulus with vitality gradient' },
    { name: 'varuna', title: 'Varuna', colors: ['sage light (#a3bfa0)', 'sage (#87a878)'], description: 'Modern kidney support herb with cleansing gradient' },
    { name: 'chyawanprash', title: 'Chyawanprash', colors: ['burgundy (#914372)', 'dusty rose (#daa0a9)'], description: 'Modern herbal jam with immune gradient' },
    { name: 'sitopaladi', title: 'Sitopaladi', colors: ['sage light (#a3bfa0)', 'soft lavender (#dfbad8)'], description: 'Modern respiratory powder with breathing gradient' },
    { name: 'pippali', title: 'Pippali', colors: ['rose (#fb7185)', 'sage (#87a878)'], description: 'Modern long pepper with warming gradient' },
    { name: 'hing', title: 'Hing', colors: ['sage (#87a878)', 'dusty rose (#daa0a9)'], description: 'Modern asafoetida with digestive gradient' },
    { name: 'bilva', title: 'Bilva', colors: ['sage light (#a3bfa0)', 'burgundy (#914372)'], description: 'Modern bael fruit with sacred gradient' },
    { name: 'nagarmotha', title: 'Nagarmotha', colors: ['sage (#87a878)', 'soft lavender (#dfbad8)'], description: 'Modern grass root with balance gradient' },
    { name: 'mint', title: 'Mint', colors: ['sage light (#a3bfa0)', 'rose (#fb7185)'], description: 'Modern mint leaves with cooling gradient' },
    { name: 'ajwain', title: 'Ajwain', colors: ['sage (#87a878)', 'dusty rose (#daa0a9)'], description: 'Modern carom seeds with digestive gradient' },
    { name: 'amla', title: 'Amla', colors: ['sage light (#a3bfa0)', 'burgundy (#914372)'], description: 'Modern amla fruit with vitamin gradient' },
    { name: 'kanchanar', title: 'Kanchanar', colors: ['dusty rose (#daa0a9)', 'sage (#87a878)'], description: 'Modern thyroid herb with balance gradient' },
    { name: 'kutki', title: 'Kutki', colors: ['sage (#87a878)', 'burgundy (#914372)'], description: 'Modern liver herb with detox gradient' },
    { name: 'kalmegh', title: 'Kalmegh', colors: ['sage light (#a3bfa0)', 'dusty rose (#daa0a9)'], description: 'Modern immune herb with defense gradient' },
    { name: 'shilajit', title: 'Shilajit', colors: ['burgundy (#914372)', 'sage (#87a878)'], description: 'Modern mineral with vitality gradient' },
    { name: 'chamomile', title: 'Chamomile', colors: ['soft lavender (#dfbad8)', 'sage light (#a3bfa0)'], description: 'Modern chamomile flower with calming gradient' }
  ],
  
  exercises: [
    { name: 'cardio-walking', title: 'Walking', colors: ['rose (#fb7185)', 'sage (#87a878)'], description: 'Modern walking figure with movement gradient' },
    { name: 'yoga-cobra', title: 'Cobra Pose', colors: ['dusty rose (#daa0a9)', 'sage (#87a878)'], description: 'Modern cobra pose silhouette with energy gradient' },
    { name: 'yoga-bridge', title: 'Bridge Pose', colors: ['sage light (#a3bfa0)', 'rose (#fb7185)'], description: 'Modern bridge pose with grounding gradient' },
    { name: 'yoga-warrior', title: 'Warrior Pose', colors: ['burgundy (#914372)', 'sage (#87a878)'], description: 'Modern warrior pose with strength gradient' },
    { name: 'yoga-chair', title: 'Chair Pose', colors: ['sage (#87a878)', 'dusty rose (#daa0a9)'], description: 'Modern chair pose with power gradient' },
    { name: 'yoga-twist', title: 'Seated Twist', colors: ['soft lavender (#dfbad8)', 'sage light (#a3bfa0)'], description: 'Modern spinal twist with detox gradient' },
    { name: 'yoga-forward', title: 'Forward Bend', colors: ['sage (#87a878)', 'dusty rose (#daa0a9)'], description: 'Modern forward fold with calming gradient' },
    { name: 'yoga-frog', title: 'Frog Pose', colors: ['sage light (#a3bfa0)', 'rose (#fb7185)'], description: 'Modern frog pose with opening gradient' },
    { name: 'yoga-cat-cow', title: 'Cat-Cow', colors: ['dusty rose (#daa0a9)', 'sage (#87a878)'], description: 'Modern spinal movement with flow gradient' },
    { name: 'yoga-wind', title: 'Wind Pose', colors: ['sage (#87a878)', 'soft lavender (#dfbad8)'], description: 'Modern knee-to-chest with digestive gradient' },
    { name: 'yoga-shoulder', title: 'Shoulder Stand', colors: ['burgundy (#914372)', 'sage light (#a3bfa0)'], description: 'Modern inversion with circulation gradient' },
    { name: 'yoga-fish', title: 'Fish Pose', colors: ['rose (#fb7185)', 'sage (#87a878)'], description: 'Modern fish pose with heart-opening gradient' },
    { name: 'yoga-bow', title: 'Bow Pose', colors: ['dusty rose (#daa0a9)', 'burgundy (#914372)'], description: 'Modern bow pose with strength gradient' },
    { name: 'breath-kapalabhati', title: 'Skull Breath', colors: ['sage light (#a3bfa0)', 'rose (#fb7185)'], description: 'Modern breathing with energy gradient' },
    { name: 'breath-nadi', title: 'Alternate Breathing', colors: ['soft lavender (#dfbad8)', 'sage (#87a878)'], description: 'Modern nostril breathing with balance gradient' },
    { name: 'breath-ujjayi', title: 'Ocean Breath', colors: ['burgundy (#914372)', 'dusty rose (#daa0a9)'], description: 'Modern ujjayi breathing with power gradient' },
    { name: 'pranayama', title: 'Breathing Exercise', colors: ['sage (#87a878)', 'soft lavender (#dfbad8)'], description: 'Modern breathing practice with life gradient' },
    { name: 'meditation', title: 'Meditation', colors: ['soft lavender (#dfbad8)', 'sage light (#a3bfa0)'], description: 'Modern meditation pose with peace gradient' }
  ],
  
  therapies: [
    { name: 'abhyanga', title: 'Oil Massage', colors: ['dusty rose (#daa0a9)', 'soft lavender (#dfbad8)'], description: 'Modern massage hands with healing gradient' },
    { name: 'dry-massage', title: 'Dry Massage', colors: ['sage (#87a878)', 'dusty rose (#daa0a9)'], description: 'Modern exfoliation with detox gradient' },
    { name: 'steam-therapy', title: 'Steam Therapy', colors: ['sage light (#a3bfa0)', 'soft lavender (#dfbad8)'], description: 'Modern steam with cleansing gradient' },
    { name: 'shirodhara', title: 'Shirodhara', colors: ['soft lavender (#dfbad8)', 'dusty rose (#daa0a9)'], description: 'Modern oil stream with calming gradient' },
    { name: 'diet-recommendations', title: 'Diet Therapy', colors: ['sage light (#a3bfa0)', 'burgundy (#914372)'], description: 'Modern healthy foods with nourishing gradient' },
    { name: 'stress-management', title: 'Stress Management', colors: ['soft lavender (#dfbad8)', 'sage (#87a878)'], description: 'Modern calm mind with peace gradient' },
    { name: 'sleep-hygiene', title: 'Sleep Hygiene', colors: ['dusty rose (#daa0a9)', 'soft lavender (#dfbad8)'], description: 'Modern sleep with restorative gradient' },
    { name: 'lifestyle-routine', title: 'Daily Routine', colors: ['sage (#87a878)', 'dusty rose (#daa0a9)'], description: 'Modern routine cycle with balance gradient' },
    { name: 'aromatherapy', title: 'Aromatherapy', colors: ['soft lavender (#dfbad8)', 'sage light (#a3bfa0)'], description: 'Modern essential oils with healing gradient' },
    { name: 'sound-therapy', title: 'Sound Therapy', colors: ['burgundy (#914372)', 'soft lavender (#dfbad8)'], description: 'Modern sound waves with vibrational gradient' },
    { name: 'intermittent-fasting', title: 'Intermittent Fasting', colors: ['sage (#87a878)', 'dusty rose (#daa0a9)'], description: 'Modern fasting clock with metabolic gradient' },
    { name: 'sauna-therapy', title: 'Sauna Therapy', colors: ['rose (#fb7185)', 'sage (#87a878)'], description: 'Modern sauna with detox gradient' }
  ]
};

class ModernIconGenerator {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  generatePrompt(item) {
    const colorString = item.colors.join(' and ');
    
    return `Create a modern, sleek icon for "${item.title}" for the Thrive Ayurvedic wellness app.

DESIGN: ${item.description}

MODERN STYLE REQUIREMENTS:
• Contemporary, clean design with smooth gradients
• Professional and polished appearance
• Minimalist but recognizable iconography
• Soft, rounded edges and modern typography influence
• Colors: Use ONLY ${colorString} from the Thrive app palette
• Background: Completely transparent
• Size: 512x512 pixels, perfect for mobile and web

MODERN DESIGN ELEMENTS:
• Subtle gradients using the specified colors
• Clean lines with contemporary styling
• Slightly rounded corners for modern feel
• Professional wellness/medical iconography
• iOS/Material Design influence
• Sophisticated color transitions
• Modern vector graphics style

QUALITY STANDARDS:
• Instantly recognizable and clear
• Professional medical/wellness standards
• Scales beautifully from large to small sizes
• Suitable for modern app interfaces
• Cultural sensitivity for Ayurvedic concepts
• Premium quality execution

AVOID:
• Outdated or overly decorative elements
• Harsh edges or old-style graphics
• Colors outside the Thrive palette
• Overly complex details
• Photorealistic elements
• Text or labels

Create a modern, professional icon that would fit perfectly in today's premium wellness apps with sophisticated color gradients and contemporary styling.`;
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
          style: 'modern-gradient'
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
    console.log(`\n🎨 Generating modern ${categoryName} icons (${items.length} items)...`);
    
    const outputDir = path.join(__dirname, '..', 'public', 'icons', 'ayurvedic', 'modern', categoryName);
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
  
  const generator = new ModernIconGenerator(apiKey);
  
  try {
    console.log('✨ Modern Icon Generator for Thrive App');
    console.log('═'.repeat(50));
    console.log('🎨 Creating modern icons with Thrive theme colors\n');
    
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
          const outputDir = path.join(__dirname, '..', 'public', 'icons', 'ayurvedic', 'modern', 'samples');
          await fs.mkdir(outputDir, { recursive: true });
          const outputPath = path.join(outputDir, `${sample.name}.png`);
          await generator.generateIcon(sample, outputPath);
          if (sample !== samples[samples.length - 1]) {
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        }
        break;
      case 'all':
        for (const [category, items] of Object.entries(ICON_DEFINITIONS)) {
          await generator.generateCategorySet(category, items);
        }
        break;
      default:
        console.log('Usage:');
        console.log('  node generate-modern-icons.js sample     # Generate 4 modern samples');
        console.log('  node generate-modern-icons.js diseases  # Generate disease icons');
        console.log('  node generate-modern-icons.js herbs     # Generate herb icons');
        console.log('  node generate-modern-icons.js exercises # Generate exercise icons');
        console.log('  node generate-modern-icons.js therapies # Generate therapy icons');
        console.log('  node generate-modern-icons.js all       # Generate all categories');
        console.log('');
        console.log('💰 Estimated costs (DALL-E 3 HD):');
        const total = Object.values(ICON_DEFINITIONS).reduce((sum, items) => sum + items.length, 0);
        console.log(`• Total: ${total} icons × $0.04 = $${(total * 0.04).toFixed(2)}`);
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { ModernIconGenerator, ICON_DEFINITIONS, THEME_COLORS };