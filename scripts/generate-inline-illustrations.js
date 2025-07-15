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

// Complete icon definitions organized by category
const ICON_DEFINITIONS = {
  diseases: [
    { name: 'heart-disease', title: 'Heart Disease (Coronary Artery Disease)', colors: ['dusty rose (#daa0a9)', 'burgundy (#914372)'], description: 'A warm, healing heart symbol with gentle energy radiating from it, emphasizing wellness and recovery' },
    { name: 'hypertension', title: 'Hypertension (High Blood Pressure)', colors: ['burgundy (#914372)', 'rose (#fb7185)'], description: 'A calm heart with gentle flowing lines showing balanced circulation and peaceful energy' },
    { name: 'high-cholesterol', title: 'High Cholesterol (Hyperlipidemia)', colors: ['sage (#87a878)', 'sage light (#a3bfa0)'], description: 'A heart with natural flowing elements suggesting healthy circulation and balance' },
    { name: 'type2-diabetes', title: 'Type 2 Diabetes (Madhumeha)', colors: ['dusty rose (#daa0a9)', 'soft lavender (#dfbad8)'], description: 'A gentle droplet with healing energy, representing balanced blood sugar and wellness' },
    { name: 'obesity', title: 'Obesity (Weight Management)', colors: ['sage (#87a878)', 'dusty rose (#daa0a9)'], description: 'A human silhouette with positive energy and wellness symbols, emphasizing health and vitality' },
    { name: 'osteoarthritis', title: 'Osteoarthritis (Degenerative Joint Disease)', colors: ['burgundy (#914372)', 'sage light (#a3bfa0)'], description: 'A joint symbol with healing energy and natural movement lines showing flexibility and wellness' },
    { name: 'rheumatoid-arthritis', title: 'Rheumatoid Arthritis (Aamavata)', colors: ['sage (#87a878)', 'soft lavender (#dfbad8)'], description: 'Peaceful joint representation with anti-inflammatory energy and natural healing elements' },
    { name: 'asthma', title: 'Asthma (Tamaka Shvasa)', colors: ['sage light (#a3bfa0)', 'rose (#fb7185)'], description: 'Lungs with gentle airflow and peaceful breathing patterns showing respiratory wellness' },
    { name: 'copd', title: 'Chronic Obstructive Pulmonary Disease (COPD)', colors: ['sage (#87a878)', 'dusty rose (#daa0a9)'], description: 'Lungs with supportive breathing energy and natural healing elements' },
    { name: 'kidney-disease', title: 'Chronic Kidney Disease (CKD)', colors: ['dusty rose (#daa0a9)', 'sage light (#a3bfa0)'], description: 'Kidney shape with gentle cleansing energy and natural detox elements' },
    { name: 'fatty-liver', title: 'Fatty Liver Disease (NAFLD)', colors: ['sage (#87a878)', 'burgundy (#914372)'], description: 'Liver symbol with detoxifying energy and natural cleansing elements' },
    { name: 'depression', title: 'Depression (Chronic)', colors: ['soft lavender (#dfbad8)', 'rose (#fb7185)'], description: 'A peaceful mind with uplifting energy and rays of hope and positivity' },
    { name: 'anxiety', title: 'Anxiety (Chronic)', colors: ['sage light (#a3bfa0)', 'soft lavender (#dfbad8)'], description: 'A calm mind with soothing energy and peaceful, flowing elements' },
    { name: 'hypothyroidism', title: 'Hypothyroidism (Underactive Thyroid)', colors: ['dusty rose (#daa0a9)', 'sage (#87a878)'], description: 'Thyroid gland with balanced energy and natural harmony symbols' },
    { name: 'ibs', title: 'Irritable Bowel Syndrome (IBS)', colors: ['sage light (#a3bfa0)', 'dusty rose (#daa0a9)'], description: 'Digestive system with calming energy and natural soothing elements' },
    { name: 'gerd', title: 'Gastroesophageal Reflux Disease (GERD)', colors: ['sage (#87a878)', 'soft lavender (#dfbad8)'], description: 'Stomach with cooling energy and natural soothing elements' }
  ],
  
  herbs: [
    { name: 'arjuna', title: 'Arjuna (Heart tonic)', colors: ['sage (#87a878)', 'sage light (#a3bfa0)'], description: 'Elegant tree bark with heart-supporting energy and natural healing elements' },
    { name: 'pushkarmool', title: 'Pushkarmool (Heart and lung support)', colors: ['sage (#87a878)', 'dusty rose (#daa0a9)'], description: 'Root with heart and lung supporting energy, natural botanical elements' },
    { name: 'guggulu', title: 'Guggulu (Cholesterol and fat metabolism)', colors: ['burgundy (#914372)', 'sage (#87a878)'], description: 'Natural resin droplet with metabolic energy and cleansing properties' },
    { name: 'garlic', title: 'Garlic (Lashuna)', colors: ['sage light (#a3bfa0)', 'dusty rose (#daa0a9)'], description: 'Stylized garlic bulb with cardiovascular healing energy' },
    { name: 'rauwolfia', title: 'Rauwolfia (Sarpagandha) (Hypertension)', colors: ['sage (#87a878)', 'soft lavender (#dfbad8)'], description: 'Plant root with calming energy for blood pressure balance' },
    { name: 'ashwagandha', title: 'Ashwagandha (Adaptogen)', colors: ['dusty rose (#daa0a9)', 'sage (#87a878)'], description: 'Powerful root with adaptogenic energy and stress-relief properties' },
    { name: 'triphala', title: 'Triphala (Digestive detoxifier)', colors: ['sage light (#a3bfa0)', 'burgundy (#914372)'], description: 'Three sacred fruits with digestive healing and detox energy' },
    { name: 'jatamansi', title: 'Jatamansi (Calming herb)', colors: ['soft lavender (#dfbad8)', 'sage light (#a3bfa0)'], description: 'Peaceful herb with calming energy and mental wellness properties' },
    { name: 'boswellia', title: 'Boswellia (Shallaki) (Anti-inflammatory)', colors: ['sage (#87a878)', 'dusty rose (#daa0a9)'], description: 'Frankincense with anti-inflammatory energy and joint healing properties' },
    { name: 'fenugreek', title: 'Fenugreek (Methi)', colors: ['sage light (#a3bfa0)', 'burgundy (#914372)'], description: 'Fenugreek seeds with metabolic energy and natural healing' },
    { name: 'tulsi', title: 'Tulsi (Holy Basil)', colors: ['sage (#87a878)', 'soft lavender (#dfbad8)'], description: 'Sacred basil leaves with respiratory healing and spiritual energy' },
    { name: 'vasaka', title: 'Vasaka (Malabar Nut)', colors: ['sage light (#a3bfa0)', 'dusty rose (#daa0a9)'], description: 'Respiratory herb with lung-supporting energy and breathing wellness' },
    { name: 'gymnema', title: 'Gymnema Sylvestre (Gurmar)', colors: ['sage (#87a878)', 'rose (#fb7185)'], description: 'Sugar-destroyer herb with metabolic balance and natural sweetness control' },
    { name: 'brahmi', title: 'Brahmi (Bacopa Monnieri)', colors: ['soft lavender (#dfbad8)', 'sage light (#a3bfa0)'], description: 'Brain herb with cognitive energy and memory enhancement properties' },
    { name: 'shatavari', title: 'Shatavari', colors: ['dusty rose (#daa0a9)', 'soft lavender (#dfbad8)'], description: 'Feminine wellness herb with nourishing energy and hormonal balance' },
    { name: 'licorice', title: 'Licorice (Yashtimadhu)', colors: ['sage (#87a878)', 'dusty rose (#daa0a9)'], description: 'Sweet root with soothing energy and respiratory wellness' },
    { name: 'trikatu', title: 'Trikatu (Blend of three peppers)', colors: ['rose (#fb7185)', 'burgundy (#914372)'], description: 'Three warming spices with digestive fire and metabolic energy' },
    { name: 'punarnava', title: 'Punarnava', colors: ['sage light (#a3bfa0)', 'dusty rose (#daa0a9)'], description: 'Rejuvenating herb with kidney support and natural detox energy' },
    { name: 'gokshura', title: 'Gokshura', colors: ['sage (#87a878)', 'burgundy (#914372)'], description: 'Tribulus fruit with vitality energy and natural strength' },
    { name: 'varuna', title: 'Varuna', colors: ['sage light (#a3bfa0)', 'sage (#87a878)'], description: 'Bark with kidney support and urinary wellness energy' },
    { name: 'chyawanprash', title: 'Chyawanprash', colors: ['burgundy (#914372)', 'dusty rose (#daa0a9)'], description: 'Traditional herbal jam with immune energy and overall wellness' },
    { name: 'sitopaladi', title: 'Sitopaladi Churna', colors: ['sage light (#a3bfa0)', 'soft lavender (#dfbad8)'], description: 'Respiratory powder with lung support and breathing wellness' },
    { name: 'pippali', title: 'Pippali (Long Pepper)', colors: ['rose (#fb7185)', 'sage (#87a878)'], description: 'Long pepper with warming energy and respiratory support' },
    { name: 'hing', title: 'Hing (Asafoetida)', colors: ['sage (#87a878)', 'dusty rose (#daa0a9)'], description: 'Digestive resin with carminative energy and gut healing' },
    { name: 'bilva', title: 'Bilva (Bael Fruit)', colors: ['sage light (#a3bfa0)', 'burgundy (#914372)'], description: 'Sacred fruit with digestive energy and natural healing' },
    { name: 'nagarmotha', title: 'Nagarmotha (Cyperus)', colors: ['sage (#87a878)', 'soft lavender (#dfbad8)'], description: 'Grass root with digestive energy and natural balance' },
    { name: 'mint', title: 'Mint (Pudina)', colors: ['sage light (#a3bfa0)', 'rose (#fb7185)'], description: 'Fresh mint with cooling energy and digestive wellness' },
    { name: 'ajwain', title: 'Ajwain (Carom Seeds)', colors: ['sage (#87a878)', 'dusty rose (#daa0a9)'], description: 'Carom seeds with digestive fire and warming energy' },
    { name: 'amla', title: 'Amla (Indian Gooseberry)', colors: ['sage light (#a3bfa0)', 'burgundy (#914372)'], description: 'Vitamin C rich fruit with antioxidant energy and immune support' },
    { name: 'kanchanar', title: 'Kanchanar Guggulu (Thyroid)', colors: ['dusty rose (#daa0a9)', 'sage (#87a878)'], description: 'Thyroid-supporting herb with metabolic balance energy' },
    { name: 'kutki', title: 'Kutki (Picrorhiza kurroa)', colors: ['sage (#87a878)', 'burgundy (#914372)'], description: 'Liver herb with detox energy and natural cleansing' },
    { name: 'kalmegh', title: 'Kalmegh (Andrographis)', colors: ['sage light (#a3bfa0)', 'dusty rose (#daa0a9)'], description: 'Bitter herb with immune energy and natural defense' },
    { name: 'shilajit', title: 'Shilajit', colors: ['burgundy (#914372)', 'sage (#87a878)'], description: 'Mountain mineral with vitality energy and natural strength' },
    { name: 'chamomile', title: 'Chamomile', colors: ['soft lavender (#dfbad8)', 'sage light (#a3bfa0)'], description: 'Gentle flower with calming energy and sleep wellness' }
  ],
  
  exercises: [
    { name: 'cardio-walking', title: 'Gentle walking, swimming, cycling', colors: ['rose (#fb7185)', 'sage (#87a878)'], description: 'Person in gentle movement with flowing energy and cardiovascular wellness' },
    { name: 'yoga-cobra', title: 'Cobra (Bhujangasana)', colors: ['dusty rose (#daa0a9)', 'sage (#87a878)'], description: 'Graceful cobra pose with spinal energy and heart opening' },
    { name: 'yoga-bridge', title: 'Bridge (Setu Bandhasana)', colors: ['sage light (#a3bfa0)', 'rose (#fb7185)'], description: 'Bridge pose with grounding energy and heart opening' },
    { name: 'yoga-warrior', title: 'Warrior Pose (Virabhadrasana)', colors: ['burgundy (#914372)', 'sage (#87a878)'], description: 'Strong warrior pose with grounding energy and inner strength' },
    { name: 'yoga-chair', title: 'Chair Pose', colors: ['sage (#87a878)', 'dusty rose (#daa0a9)'], description: 'Chair pose with strength energy and leg empowerment' },
    { name: 'yoga-twist', title: 'Seated Twist (Ardha Matsyendrasana)', colors: ['soft lavender (#dfbad8)', 'sage light (#a3bfa0)'], description: 'Spinal twist with detox energy and digestive wellness' },
    { name: 'yoga-forward', title: 'Paschimottanasana (Seated forward bend)', colors: ['sage (#87a878)', 'dusty rose (#daa0a9)'], description: 'Forward fold with calming energy and introspection' },
    { name: 'yoga-frog', title: 'Mandukasana (Frog pose)', colors: ['sage light (#a3bfa0)', 'rose (#fb7185)'], description: 'Frog pose with hip opening energy and flexibility' },
    { name: 'yoga-cat-cow', title: 'Cat-Cow (Marjariasana)', colors: ['dusty rose (#daa0a9)', 'sage (#87a878)'], description: 'Spinal movement with flexibility energy and back wellness' },
    { name: 'yoga-wind', title: 'Pawanmuktasana (Wind relieving pose)', colors: ['sage (#87a878)', 'soft lavender (#dfbad8)'], description: 'Knee-to-chest pose with digestive energy and gas relief' },
    { name: 'yoga-shoulder', title: 'Sarvangasana (Shoulder Stand)', colors: ['burgundy (#914372)', 'sage light (#a3bfa0)'], description: 'Inversion with circulation energy and thyroid support' },
    { name: 'yoga-fish', title: 'Matsyasana (Fish Pose)', colors: ['rose (#fb7185)', 'sage (#87a878)'], description: 'Fish pose with heart opening energy and throat wellness' },
    { name: 'yoga-bow', title: 'Dhanurasana (Bow Pose)', colors: ['dusty rose (#daa0a9)', 'burgundy (#914372)'], description: 'Bow pose with back strength energy and spinal wellness' },
    { name: 'breath-kapalabhati', title: 'Kapalabhati (Skull shining breath)', colors: ['sage light (#a3bfa0)', 'rose (#fb7185)'], description: 'Energizing breath with cleansing energy and mental clarity' },
    { name: 'breath-nadi', title: 'Nadi Shodhana (Alternate nostril breathing)', colors: ['soft lavender (#dfbad8)', 'sage (#87a878)'], description: 'Balancing breath with harmony energy and nervous system wellness' },
    { name: 'breath-ujjayi', title: 'Ujjayi (Victorious breath)', colors: ['burgundy (#914372)', 'dusty rose (#daa0a9)'], description: 'Victorious breath with strength energy and focus' },
    { name: 'pranayama', title: 'Pranayama / Breathing Exercises', colors: ['sage (#87a878)', 'soft lavender (#dfbad8)'], description: 'Breathing practice with life energy and respiratory wellness' },
    { name: 'meditation', title: 'Meditation / Mindfulness Practices', colors: ['soft lavender (#dfbad8)', 'sage light (#a3bfa0)'], description: 'Peaceful meditation with inner calm energy and mental wellness' }
  ],
  
  therapies: [
    { name: 'abhyanga', title: 'Abhyanga (Oil Massage)', colors: ['dusty rose (#daa0a9)', 'soft lavender (#dfbad8)'], description: 'Gentle hands with healing oil and nurturing touch energy' },
    { name: 'dry-massage', title: 'Dry Powder Massage (Udwarthana)', colors: ['sage (#87a878)', 'dusty rose (#daa0a9)'], description: 'Exfoliating massage with detox energy and skin wellness' },
    { name: 'steam-therapy', title: 'Steam Baths / Herbal Steam (Swedana)', colors: ['sage light (#a3bfa0)', 'soft lavender (#dfbad8)'], description: 'Herbal steam with cleansing energy and detox wellness' },
    { name: 'shirodhara', title: 'Shirodhara (Oil pouring on forehead)', colors: ['soft lavender (#dfbad8)', 'dusty rose (#daa0a9)'], description: 'Oil stream with calming energy and mental relaxation' },
    { name: 'diet-recommendations', title: 'Dietary Recommendations', colors: ['sage light (#a3bfa0)', 'burgundy (#914372)'], description: 'Healthy foods with nourishing energy and digestive wellness' },
    { name: 'stress-management', title: 'Stress Management', colors: ['soft lavender (#dfbad8)', 'sage (#87a878)'], description: 'Peaceful mind with calming energy and mental balance' },
    { name: 'sleep-hygiene', title: 'Adequate Sleep Hygiene', colors: ['dusty rose (#daa0a9)', 'soft lavender (#dfbad8)'], description: 'Peaceful sleep with restorative energy and rest wellness' },
    { name: 'lifestyle-routine', title: 'Lifestyle Routine (Dinacharya)', colors: ['sage (#87a878)', 'dusty rose (#daa0a9)'], description: 'Daily routine with balanced energy and natural rhythm' },
    { name: 'aromatherapy', title: 'Aromatherapy', colors: ['soft lavender (#dfbad8)', 'sage light (#a3bfa0)'], description: 'Essential oils with healing energy and sensory wellness' },
    { name: 'sound-therapy', title: 'Sound Therapy (Mantras, Music)', colors: ['burgundy (#914372)', 'soft lavender (#dfbad8)'], description: 'Sound waves with healing energy and vibrational wellness' },
    { name: 'intermittent-fasting', title: 'Intermittent Fasting', colors: ['sage (#87a878)', 'dusty rose (#daa0a9)'], description: 'Fasting clock with metabolic energy and digestive rest' },
    { name: 'sauna-therapy', title: 'Exercise-induced sweating and sauna', colors: ['rose (#fb7185)', 'sage (#87a878)'], description: 'Sauna with detox energy and natural cleansing' }
  ]
};

class InlineIllustrationGenerator {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  generatePrompt(item) {
    const colorString = item.colors.join(' and ');
    
    return `Create a beautiful, natural illustration for "${item.title}" suitable for inline text content in an Ayurvedic wellness app.

DESIGN: ${item.description}

STYLE SPECIFICATIONS:
• NOT an icon or app icon - this is an inline illustration for text content
• Natural, organic illustration style - NOT contained in frames or circles
• Colors: Use ONLY ${colorString} from the Thrive wellness app palette
• Background: Completely transparent
• Format: Illustration that flows naturally with text content
• Size: Optimized for inline use (256x256 to 512x512 pixels)
• Mood: Healing, peaceful, warm, and inviting

DESIGN PRINCIPLES:
• Organic, flowing shapes that feel natural and alive
• Soft, rounded edges with no harsh lines
• Single focal element that's clear and meaningful
• Watercolor or soft vector illustration style
• No frames, borders, or icon-like containers
• Cultural sensitivity for Ayurvedic traditions
• Emphasizes wellness, healing, and natural health

AVOID:
• App icon appearance or circular frames
• Sharp edges or geometric containers
• Clinical or medical device appearance
• Complex details that are hard to understand
• Colors outside the specified Thrive palette
• Photorealistic style
• Text or labels within the illustration

Create a beautiful, natural illustration that enhances text content about Ayurvedic wellness, flowing organically with the content rather than standing apart as an icon.`;
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

  async generateIllustration(item, outputPath) {
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
          imageUrl: imageUrl,
          filePath: downloadPath,
          generated: new Date().toISOString(),
          style: 'inline-illustration'
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
    console.log(`\n🎨 Generating ${categoryName} illustrations (${items.length} items)...`);
    
    const outputDir = path.join(__dirname, '..', 'public', 'icons', 'ayurvedic', 'illustrations', categoryName);
    await fs.mkdir(outputDir, { recursive: true });
    
    const results = [];
    
    for (let i = 0; i < items.length; i++) {
      const item = { ...items[i], category: categoryName };
      const outputPath = path.join(outputDir, `${item.name}.png`);
      
      const result = await this.generateIllustration(item, outputPath);
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
  
  const generator = new InlineIllustrationGenerator(apiKey);
  
  try {
    console.log('🎨 Inline Illustration Generator for Thrive App');
    console.log('═'.repeat(50));
    console.log('🌿 Creating natural illustrations for text content\n');
    
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
      case 'all':
        for (const [category, items] of Object.entries(ICON_DEFINITIONS)) {
          await generator.generateCategorySet(category, items);
        }
        break;
      default:
        console.log('Usage:');
        console.log('  node generate-inline-illustrations.js diseases   # Generate disease illustrations');
        console.log('  node generate-inline-illustrations.js herbs      # Generate herb illustrations');
        console.log('  node generate-inline-illustrations.js exercises  # Generate exercise illustrations');
        console.log('  node generate-inline-illustrations.js therapies  # Generate therapy illustrations');
        console.log('  node generate-inline-illustrations.js all        # Generate all illustrations');
        console.log('');
        console.log('💰 Estimated costs (DALL-E 3 HD):');
        console.log(`• Diseases: ${ICON_DEFINITIONS.diseases.length} × $0.04 = $${(ICON_DEFINITIONS.diseases.length * 0.04).toFixed(2)}`);
        console.log(`• Herbs: ${ICON_DEFINITIONS.herbs.length} × $0.04 = $${(ICON_DEFINITIONS.herbs.length * 0.04).toFixed(2)}`);
        console.log(`• Exercises: ${ICON_DEFINITIONS.exercises.length} × $0.04 = $${(ICON_DEFINITIONS.exercises.length * 0.04).toFixed(2)}`);
        console.log(`• Therapies: ${ICON_DEFINITIONS.therapies.length} × $0.04 = $${(ICON_DEFINITIONS.therapies.length * 0.04).toFixed(2)}`);
        const total = Object.values(ICON_DEFINITIONS).reduce((sum, items) => sum + items.length, 0);
        console.log(`• Total: ${total} × $0.04 = $${(total * 0.04).toFixed(2)}`);
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { InlineIllustrationGenerator, ICON_DEFINITIONS, THEME_COLORS };