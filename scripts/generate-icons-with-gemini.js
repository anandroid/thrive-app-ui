#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const https = require('https');

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

// Complete icon definitions as specified in the requirements
const ICON_DEFINITIONS = {
  diseases: [
    { name: 'heart-disease', title: 'Heart Disease (Coronary Artery Disease)', description: 'Simple heart shape with subtle plus sign or healing glow' },
    { name: 'hypertension', title: 'Hypertension (High Blood Pressure)', description: 'Blood pressure monitor or heart with upward arrow' },
    { name: 'high-cholesterol', title: 'High Cholesterol (Hyperlipidemia)', description: 'Stylized cholesterol molecule or heart with droplet' },
    { name: 'type2-diabetes', title: 'Type 2 Diabetes (Madhumeha)', description: 'Blood glucose drop or simple glucose meter icon' },
    { name: 'obesity', title: 'Obesity (Weight Management)', description: 'Body silhouette with gentle wellness symbol' },
    { name: 'osteoarthritis', title: 'Osteoarthritis (Degenerative Joint Disease)', description: 'Joint or bone symbol with healing energy' },
    { name: 'rheumatoid-arthritis', title: 'Rheumatoid Arthritis (Aamavata)', description: 'Joint symbol with anti-inflammatory indication' },
    { name: 'asthma', title: 'Asthma (Tamaka Shvasa)', description: 'Lungs with gentle airflow lines' },
    { name: 'copd', title: 'Chronic Obstructive Pulmonary Disease (COPD)', description: 'Lungs with supportive breathing indication' },
    { name: 'kidney-disease', title: 'Chronic Kidney Disease (CKD)', description: 'Kidney shape with gentle healing glow' },
    { name: 'fatty-liver', title: 'Fatty Liver Disease (NAFLD)', description: 'Liver symbol with detox indication' },
    { name: 'depression', title: 'Depression (Chronic)', description: 'Brain or mind symbol with uplifting energy' },
    { name: 'anxiety', title: 'Anxiety (Chronic)', description: 'Calm mind symbol with soothing elements' },
    { name: 'hypothyroidism', title: 'Hypothyroidism (Underactive Thyroid)', description: 'Thyroid gland with balance symbol' },
    { name: 'ibs', title: 'Irritable Bowel Syndrome (IBS)', description: 'Digestive system with calm indication' },
    { name: 'gerd', title: 'Gastroesophageal Reflux Disease (GERD)', description: 'Stomach with soothing flame or droplet' }
  ],
  
  herbs: [
    { name: 'arjuna', title: 'Arjuna (Heart tonic)', description: 'Stylized tree or bark representing Arjuna herb' },
    { name: 'pushkarmool', title: 'Pushkarmool (Heart and lung support)', description: 'Root or botanical with heart-lung symbolism' },
    { name: 'guggulu', title: 'Guggulu (Cholesterol and fat metabolism)', description: 'Resin droplet or traditional preparation symbol' },
    { name: 'garlic', title: 'Garlic (Lashuna)', description: 'Stylized garlic bulb with healing properties' },
    { name: 'rauwolfia', title: 'Rauwolfia (Sarpagandha) (Hypertension)', description: 'Plant root with calming indication' },
    { name: 'ashwagandha', title: 'Ashwagandha (Adaptogen)', description: 'Root or botanical with strength indication' },
    { name: 'triphala', title: 'Triphala (Digestive detoxifier)', description: 'Three fruits or bowl representing the blend' },
    { name: 'jatamansi', title: 'Jatamansi (Calming herb)', description: 'Herb with peaceful, calming energy' },
    { name: 'boswellia', title: 'Boswellia (Shallaki) (Anti-inflammatory)', description: 'Frankincense resin or tree with healing properties' },
    { name: 'fenugreek', title: 'Fenugreek (Methi)', description: 'Fenugreek seeds or leaves' },
    { name: 'tulsi', title: 'Tulsi (Holy Basil)', description: 'Sacred basil leaves in reverent style' },
    { name: 'vasaka', title: 'Vasaka (Malabar Nut)', description: 'Respiratory support herb with lung indication' },
    { name: 'gymnema', title: 'Gymnema Sylvestre (Gurmar)', description: 'Leaf with sugar-blocking indication' },
    { name: 'brahmi', title: 'Brahmi (Bacopa Monnieri)', description: 'Brain-shaped leaves with cognitive enhancement' },
    { name: 'shatavari', title: 'Shatavari', description: 'Asparagus-like root with feminine wellness' },
    { name: 'licorice', title: 'Licorice (Yashtimadhu)', description: 'Root with soothing properties' },
    { name: 'trikatu', title: 'Trikatu (Spice blend)', description: 'Three spices (ginger, black pepper, long pepper)' },
    { name: 'punarnava', title: 'Punarnava', description: 'Herb with rejuvenating properties' },
    { name: 'gokshura', title: 'Gokshura', description: 'Tribulus fruit with vitality indication' },
    { name: 'varuna', title: 'Varuna', description: 'Bark or tree with kidney support' },
    { name: 'chyawanprash', title: 'Chyawanprash', description: 'Traditional herbal jam in container' },
    { name: 'sitopaladi', title: 'Sitopaladi Churna', description: 'Herbal powder with respiratory support' },
    { name: 'pippali', title: 'Pippali (Long Pepper)', description: 'Long pepper with warming properties' },
    { name: 'hing', title: 'Hing (Asafoetida)', description: 'Resin with digestive properties' },
    { name: 'bilva', title: 'Bilva (Bael Fruit)', description: 'Sacred fruit with digestive benefits' },
    { name: 'nagarmotha', title: 'Nagarmotha (Cyperus)', description: 'Grass root with digestive support' },
    { name: 'mint', title: 'Mint (Pudina)', description: 'Fresh mint leaves with cooling effect' },
    { name: 'ajwain', title: 'Ajwain (Carom Seeds)', description: 'Seeds with digestive fire indication' },
    { name: 'amla', title: 'Amla (Indian Gooseberry)', description: 'Round fruit with vitamin C glow' },
    { name: 'kanchanar', title: 'Kanchanar Guggulu (Thyroid)', description: 'Flower with thyroid balance' },
    { name: 'kutki', title: 'Kutki (Picrorhiza kurroa)', description: 'Root with liver detox properties' },
    { name: 'kalmegh', title: 'Kalmegh (Andrographis)', description: 'Bitter herb with immune support' },
    { name: 'milk-thistle', title: 'Milk Thistle', description: 'Thistle flower with liver protection' },
    { name: 'garcinia', title: 'Garcinia (Vrikshamla)', description: 'Fruit with weight management indication' },
    { name: 'bhumyamalaki', title: 'Bhumyamalaki (Phyllanthus niruri)', description: 'Small plant with liver support' },
    { name: 'shilajit', title: 'Shilajit', description: 'Mountain resin with vitality energy' },
    { name: 'chamomile', title: 'Chamomile', description: 'Gentle flower with calming properties' },
    { name: 'lavender', title: 'Lavender', description: 'Purple flowers with relaxation indication' },
    { name: 'mucuna', title: 'Mucuna Pruriens (Kapikacchu)', description: 'Bean pod with mood support' },
    { name: 'passionflower', title: 'Passionflower', description: 'Intricate flower with anxiety relief' }
  ],
  
  exercises: [
    { name: 'cardio-walking', title: 'Gentle walking, swimming, cycling', description: 'Person walking with gentle movement lines' },
    { name: 'yoga-cobra', title: 'Cobra (Bhujangasana)', description: 'Human figure in cobra pose - chest lifted' },
    { name: 'yoga-bridge', title: 'Bridge (Setu Bandhasana)', description: 'Human figure in bridge pose - hips lifted' },
    { name: 'yoga-warrior', title: 'Warrior Pose (Virabhadrasana)', description: 'Strong standing warrior pose silhouette' },
    { name: 'yoga-chair', title: 'Chair Pose', description: 'Sitting back in air pose silhouette' },
    { name: 'yoga-twist', title: 'Seated Twist (Ardha Matsyendrasana)', description: 'Seated spinal twist silhouette' },
    { name: 'yoga-forward', title: 'Paschimottanasana (Seated forward bend)', description: 'Forward bending pose silhouette' },
    { name: 'yoga-frog', title: 'Mandukasana (Frog pose)', description: 'Frog-like seated pose silhouette' },
    { name: 'yoga-cat-cow', title: 'Cat-Cow (Marjariasana)', description: 'Four-legged pose with spinal movement' },
    { name: 'yoga-wind', title: 'Pawanmuktasana (Wind relieving pose)', description: 'Knee-to-chest pose silhouette' },
    { name: 'yoga-shoulder', title: 'Sarvangasana (Shoulder Stand)', description: 'Inverted shoulder stand silhouette' },
    { name: 'yoga-fish', title: 'Matsyasana (Fish Pose)', description: 'Back-bending fish pose silhouette' },
    { name: 'yoga-bow', title: 'Dhanurasana (Bow Pose)', description: 'Bow-shaped back bend silhouette' },
    { name: 'breath-kapalabhati', title: 'Kapalabhati (Skull shining breath)', description: 'Breathing practice with energy lines' },
    { name: 'breath-nadi', title: 'Nadi Shodhana (Alternate nostril breathing)', description: 'Nostril breathing with hand position' },
    { name: 'breath-anulom', title: 'Anulom Vilom (Alternate nostril breathing)', description: 'Balanced breathing practice symbol' },
    { name: 'breath-bhramari', title: 'Bhramari (Humming bee breath)', description: 'Sound wave breathing practice' },
    { name: 'breath-sheetali', title: 'Sheetali (Cooling breath)', description: 'Cooling breath with temperature indication' },
    { name: 'breath-ujjayi', title: 'Ujjayi (Victorious breath)', description: 'Powerful breathing with strength indication' },
    { name: 'agnisar', title: 'Agnisar Kriya (Abdominal pumping)', description: 'Abdominal breathing with fire element' },
    { name: 'moola-bandha', title: 'Moola Bandha (Root lock)', description: 'Energy lock at pelvic floor' },
    { name: 'pranayama', title: 'Pranayama / Breathing Exercises', description: 'General breathing practice with energy flow' },
    { name: 'meditation', title: 'Meditation / Mindfulness Practices', description: 'Peaceful meditation figure with aura' },
    { name: 'marma-therapy', title: 'Marma Therapy (Vital energy points)', description: 'Body with energy points marked' }
  ],
  
  therapies: [
    { name: 'abhyanga', title: 'Abhyanga (Oil Massage)', description: 'Gentle hands with oil droplets for healing touch' },
    { name: 'dry-massage', title: 'Dry Powder Massage (Udwarthana)', description: 'Hands with powder particles for exfoliation' },
    { name: 'steam-therapy', title: 'Steam Baths / Herbal Steam (Swedana)', description: 'Steam bowl with herbal leaves rising' },
    { name: 'pinda-sweda', title: 'Pinda Sweda (Bolus fomentation)', description: 'Herbal bolus with warmth indication' },
    { name: 'basti', title: 'Basti (Enema Therapy)', description: 'Gentle cleansing symbol with healing flow' },
    { name: 'shirodhara', title: 'Shirodhara (Oil pouring on forehead)', description: 'Oil stream flowing to forehead area' },
    { name: 'nasya', title: 'Nasya (Nasal Oil Administration)', description: 'Nasal drops with soothing indication' },
    { name: 'chest-massage', title: 'Chest Massage and Tapotement', description: 'Chest area with therapeutic touch' },
    { name: 'postural-drainage', title: 'Postural Drainage techniques', description: 'Body position with drainage flow' },
    { name: 'diet-recommendations', title: 'Dietary Recommendations', description: 'Healthy food symbols with balance indication' },
    { name: 'stress-management', title: 'Stress Management', description: 'Calm mind with peaceful energy radiating' },
    { name: 'sleep-hygiene', title: 'Adequate Sleep Hygiene', description: 'Peaceful sleep symbol with moon and stars' },
    { name: 'lifestyle-routine', title: 'Lifestyle Routine (Dinacharya)', description: 'Daily routine cycle with wellness symbols' },
    { name: 'aromatherapy', title: 'Aromatherapy', description: 'Essential oil diffuser with gentle aroma lines' },
    { name: 'sound-therapy', title: 'Sound Therapy (Mantras, Music)', description: 'Sound waves with musical or mantra symbols' },
    { name: 'intermittent-fasting', title: 'Intermittent Fasting', description: 'Clock with eating window indication' },
    { name: 'sauna-therapy', title: 'Exercise-induced sweating and sauna', description: 'Sauna with gentle heat waves' }
  ]
};

class GeminiIconGenerator {
  constructor(apiKey) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY;
    if (!this.apiKey) {
      throw new Error('Gemini API key is required. Set GEMINI_API_KEY environment variable or pass as parameter.');
    }
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent';
  }

  generateIconPrompt(iconDef, category) {
    const categoryColors = {
      diseases: [THEME_COLORS.dustyRose, THEME_COLORS.burgundy, THEME_COLORS.rose],
      herbs: [THEME_COLORS.sage, THEME_COLORS.sageLight, THEME_COLORS.sageDark], 
      exercises: [THEME_COLORS.rose, THEME_COLORS.sage, THEME_COLORS.softLavender],
      therapies: [THEME_COLORS.softLavender, THEME_COLORS.dustyRose, THEME_COLORS.softBlush]
    };

    const colors = categoryColors[category] || [THEME_COLORS.rose, THEME_COLORS.sage];
    
    return `Create a minimalist, modern mobile app icon for "${iconDef.title}" in the Ayurvedic holistic health domain.

VISUAL DESIGN:
- ${iconDef.description}
- Style: Clean vector icon with rounded shapes and soft edges, similar to modern iOS/Android app icons
- Colors: Use ONLY these exact colors from the Thrive app palette: ${colors.join(', ')}
- Background: Completely transparent (PNG format)
- Dimensions: 512x512 pixels, optimized for mobile display down to 48px
- Visual weight: Consistent with other wellness app icons - not too light, not too heavy

DESIGN PRINCIPLES:
- Friendly and approachable: Rounded corners, soft shapes, no sharp edges
- Non-clinical appearance: Avoid harsh medical symbols or alarming imagery
- Cultural sensitivity: Respectful representation of Ayurvedic concepts
- Scalability: Clear and recognizable even at small sizes (48px)
- Cohesive set: Should feel like part of a unified icon family

AYURVEDIC THEME:
- Emphasize natural healing and gentle care
- Use symbols that convey hope and wellness, not illness
- Incorporate subtle healing energy or gentle glow where appropriate
- Maintain reverent approach to traditional Ayurvedic practices

TECHNICAL REQUIREMENTS:
- Format: PNG with transparent background
- No text or labels within the icon
- Single focal element (avoid complex compositions)
- Flat design with minimal gradients or shadows
- Optimized for both light and dark app backgrounds

The icon should feel warm, inviting, and trustworthy - perfect for a holistic wellness mobile application that helps users on their healing journey.`;
  }

  async makeApiRequest(prompt) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 4096,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH", 
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
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

  async generateIcon(iconDef, category, outputPath) {
    console.log(`\n🎨 Generating: ${iconDef.title}`);
    
    const prompt = this.generateIconPrompt(iconDef, category);
    
    try {
      // Note: Gemini API doesn't generate images directly yet
      // This is a conceptual implementation
      // In practice, you'd use Gemini to generate SVG code or use a different image generation service
      
      console.log(`📝 Prompt generated for: ${iconDef.name}`);
      console.log(`🎯 Colors: ${category} category palette`);
      
      // For now, create a detailed prompt file that can be used with other image generation tools
      const promptPath = outputPath.replace('.png', '.prompt.txt');
      await fs.writeFile(promptPath, prompt);
      
      console.log(`✅ Prompt saved: ${promptPath}`);
      
      return {
        success: true,
        path: outputPath,
        promptPath: promptPath,
        name: iconDef.name,
        title: iconDef.title
      };
      
    } catch (error) {
      console.error(`❌ Failed to generate ${iconDef.name}:`, error.message);
      return {
        success: false,
        error: error.message,
        name: iconDef.name,
        title: iconDef.title
      };
    }
  }

  async generateSampleIcons() {
    console.log('🚀 Creating 4 sample Ayurvedic icons for approval...\n');
    
    const outputDir = path.join(__dirname, '..', 'public', 'icons', 'ayurvedic');
    await fs.mkdir(outputDir, { recursive: true });
    
    // Select one representative icon from each category
    const sampleIcons = [
      { category: 'diseases', icon: ICON_DEFINITIONS.diseases[0] }, // Heart Disease
      { category: 'herbs', icon: ICON_DEFINITIONS.herbs[0] },       // Arjuna
      { category: 'exercises', icon: ICON_DEFINITIONS.exercises[1] }, // Yoga Cobra
      { category: 'therapies', icon: ICON_DEFINITIONS.therapies[0] }  // Abhyanga
    ];
    
    const results = [];
    
    for (const { category, icon } of sampleIcons) {
      const outputPath = path.join(outputDir, `${icon.name}.png`);
      const result = await this.generateIcon(icon, category, outputPath);
      results.push({ category, ...result });
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
        console.log(`   Prompt: ${result.promptPath}`);
      }
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      console.log('');
    });
    
    const successCount = results.filter(r => r.success).length;
    console.log(`\n🎯 Generated ${successCount}/4 sample icon prompts successfully!`);
    console.log(`\n📁 Files saved to: ${outputDir}`);
    
    if (successCount === 4) {
      console.log('\n✨ All sample prompts created!');
      console.log('\n📋 NEXT STEPS:');
      console.log('1. Review the generated prompts in the .prompt.txt files');
      console.log('2. Use these prompts with DALL-E, Midjourney, or other image generators');
      console.log('3. Save the generated icons as PNG files in the same directory');
      console.log('4. Once approved, run: node generate-icons-with-gemini.js full');
    }
    
    return results;
  }

  async generateAllIcons() {
    console.log('🎨 Generating complete Ayurvedic icon set...\n');
    
    const outputDir = path.join(__dirname, '..', 'public', 'icons', 'ayurvedic');
    await fs.mkdir(outputDir, { recursive: true });
    
    let totalGenerated = 0;
    let totalFailed = 0;
    
    for (const [category, icons] of Object.entries(ICON_DEFINITIONS)) {
      console.log(`\n📂 Processing ${category} icons (${icons.length} icons)...`);
      
      for (const icon of icons) {
        const outputPath = path.join(outputDir, `${icon.name}.png`);
        const result = await this.generateIcon(icon, category, outputPath);
        
        if (result.success) {
          totalGenerated++;
        } else {
          totalFailed++;
        }
        
        // Small delay to be respectful to API
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log('\n🎉 GENERATION COMPLETE!');
    console.log(`✅ Successfully generated: ${totalGenerated} icon prompts`);
    console.log(`❌ Failed: ${totalFailed} icons`);
    console.log(`📁 All prompts saved to: ${outputDir}`);
    
    // Generate index file
    await this.generateIconIndex(outputDir);
  }

  async generateIconIndex(outputDir) {
    const indexData = {
      generated: new Date().toISOString(),
      categories: {},
      themeColors: THEME_COLORS,
      totalIcons: 0
    };

    for (const [category, icons] of Object.entries(ICON_DEFINITIONS)) {
      indexData.categories[category] = {
        count: icons.length,
        icons: icons.map(icon => ({
          name: icon.name,
          title: icon.title,
          description: icon.description,
          filename: `${icon.name}.png`,
          promptFile: `${icon.name}.prompt.txt`
        }))
      };
      indexData.totalIcons += icons.length;
    }

    const indexPath = path.join(outputDir, 'icon-index.json');
    await fs.writeFile(indexPath, JSON.stringify(indexData, null, 2));
    
    console.log(`\n📋 Icon index created: ${indexPath}`);
    console.log(`📊 Total icons catalogued: ${indexData.totalIcons}`);
  }

  listAllIcons() {
    console.log('📋 COMPLETE AYURVEDIC ICON SET');
    console.log('═'.repeat(50));
    
    let totalCount = 0;
    
    for (const [category, icons] of Object.entries(ICON_DEFINITIONS)) {
      console.log(`\n${category.toUpperCase()} (${icons.length} icons):`);
      icons.forEach((icon, i) => {
        console.log(`  ${i + 1}. ${icon.title}`);
      });
      totalCount += icons.length;
    }
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`Total icons planned: ${totalCount}`);
    console.log(`Categories: ${Object.keys(ICON_DEFINITIONS).length}`);
    console.log(`Theme colors: ${Object.keys(THEME_COLORS).length}`);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    // You can provide API key as second argument or via environment variable
    const apiKey = args[1] || process.env.GEMINI_API_KEY;
    
    const generator = new GeminiIconGenerator(apiKey);
    
    switch (command) {
      case 'samples':
      case undefined:
        await generator.generateSampleIcons();
        break;
        
      case 'full':
        await generator.generateAllIcons();
        break;
        
      case 'list':
        generator.listAllIcons();
        break;
        
      default:
        console.log('📱 Ayurvedic Icon Generator for Thrive App');
        console.log('═'.repeat(40));
        console.log('Usage:');
        console.log('  node generate-icons-with-gemini.js samples [api-key]  # Generate 4 sample icons');
        console.log('  node generate-icons-with-gemini.js full [api-key]     # Generate all icons');
        console.log('  node generate-icons-with-gemini.js list              # List all planned icons');
        console.log('');
        console.log('Environment Variables:');
        console.log('  GEMINI_API_KEY  # Your Google Gemini API key');
        console.log('');
        console.log('Note: This generates detailed prompts for image generation.');
        console.log('Use the prompts with DALL-E, Midjourney, or other image generators.');
    }
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    if (error.message.includes('API key')) {
      console.log('\n💡 Get your Gemini API key from: https://makersuite.google.com/app/apikey');
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  GeminiIconGenerator,
  ICON_DEFINITIONS,
  THEME_COLORS
};