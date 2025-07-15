#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

// Icon definitions from the main script
const ICON_DEFINITIONS = {
  diseases: [
    'heart-disease', 'hypertension', 'high-cholesterol', 'type2-diabetes', 
    'obesity', 'osteoarthritis', 'rheumatoid-arthritis', 'asthma', 
    'copd', 'kidney-disease', 'fatty-liver', 'depression', 
    'anxiety', 'hypothyroidism', 'ibs', 'gerd'
  ],
  herbs: [
    'arjuna', 'pushkarmool', 'guggulu', 'garlic', 'rauwolfia', 
    'ashwagandha', 'triphala', 'jatamansi', 'boswellia', 'fenugreek', 
    'tulsi', 'vasaka', 'gymnema', 'brahmi', 'shatavari', 
    'licorice', 'trikatu', 'punarnava', 'gokshura', 'varuna', 
    'chyawanprash', 'sitopaladi', 'pippali', 'hing', 'bilva', 
    'nagarmotha', 'mint', 'ajwain', 'amla', 'kanchanar', 
    'kutki', 'kalmegh', 'shilajit', 'chamomile'
  ],
  exercises: [
    'cardio-walking', 'yoga-cobra', 'yoga-bridge', 'yoga-warrior',
    'yoga-chair', 'yoga-twist', 'yoga-forward', 'yoga-frog',
    'yoga-cat-cow', 'yoga-wind', 'yoga-shoulder', 'yoga-fish',
    'yoga-bow', 'breath-kapalabhati', 'breath-nadi', 'breath-ujjayi',
    'pranayama', 'meditation'
  ],
  therapies: [
    'abhyanga', 'dry-massage', 'steam-therapy', 'shirodhara',
    'diet-recommendations', 'stress-management', 'sleep-hygiene',
    'lifestyle-routine', 'aromatherapy', 'sound-therapy',
    'intermittent-fasting', 'sauna-therapy'
  ]
};

async function checkProgress() {
  console.log('🎨 Ayurvedic Illustration Generation Progress');
  console.log('═'.repeat(60));
  
  const baseDir = path.join(__dirname, '..', 'public', 'icons', 'ayurvedic', 'illustrations');
  let totalGenerated = 0;
  let totalPlanned = 0;
  
  for (const [category, iconNames] of Object.entries(ICON_DEFINITIONS)) {
    console.log(`\n📂 ${category.toUpperCase()} Category:`);
    
    const categoryDir = path.join(baseDir, category);
    let categoryGenerated = 0;
    
    try {
      const files = await fs.readdir(categoryDir);
      const pngFiles = files.filter(f => f.endsWith('.png'));
      
      console.log(`   Generated: ${pngFiles.length}/${iconNames.length}`);
      
      // List generated files
      for (const iconName of iconNames) {
        const pngPath = path.join(categoryDir, `${iconName}.png`);
        try {
          await fs.access(pngPath);
          console.log(`   ✅ ${iconName}.png`);
          categoryGenerated++;
        } catch {
          console.log(`   ⏳ ${iconName}.png - pending`);
        }
      }
      
    } catch (error) {
      console.log(`   📁 Directory not found - no icons generated yet`);
    }
    
    totalGenerated += categoryGenerated;
    totalPlanned += iconNames.length;
    
    const percentage = iconNames.length > 0 ? Math.round((categoryGenerated / iconNames.length) * 100) : 0;
    console.log(`   Progress: ${percentage}% (${categoryGenerated}/${iconNames.length})`);
  }
  
  console.log('\n📊 OVERALL PROGRESS');
  console.log('═'.repeat(30));
  console.log(`Total Generated: ${totalGenerated}/${totalPlanned}`);
  console.log(`Overall Progress: ${Math.round((totalGenerated / totalPlanned) * 100)}%`);
  
  // Estimate remaining cost
  const remaining = totalPlanned - totalGenerated;
  const estimatedCost = remaining * 0.04;
  console.log(`Remaining: ${remaining} illustrations`);
  console.log(`Estimated Cost: $${estimatedCost.toFixed(2)} (DALL-E 3 HD)`);
  
  // File size summary
  console.log('\n📁 FILE SUMMARY');
  console.log('═'.repeat(20));
  
  try {
    let totalSize = 0;
    let fileCount = 0;
    
    for (const category of Object.keys(ICON_DEFINITIONS)) {
      const categoryDir = path.join(baseDir, category);
      try {
        const files = await fs.readdir(categoryDir);
        for (const file of files) {
          if (file.endsWith('.png')) {
            const filePath = path.join(categoryDir, file);
            const stats = await fs.stat(filePath);
            totalSize += stats.size;
            fileCount++;
          }
        }
      } catch (error) {
        // Directory doesn't exist yet
      }
    }
    
    const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
    const avgSizeKB = fileCount > 0 ? Math.round(totalSize / fileCount / 1024) : 0;
    
    console.log(`Generated Files: ${fileCount}`);
    console.log(`Total Size: ${totalSizeMB} MB`);
    console.log(`Average Size: ${avgSizeKB} KB per illustration`);
    
  } catch (error) {
    console.log('Could not calculate file sizes');
  }
  
  // Next steps
  console.log('\n🔄 NEXT STEPS');
  console.log('═'.repeat(15));
  
  if (totalGenerated < totalPlanned) {
    console.log('To continue generation:');
    console.log('• node scripts/generate-inline-illustrations.js diseases');
    console.log('• node scripts/generate-inline-illustrations.js herbs');
    console.log('• node scripts/generate-inline-illustrations.js exercises');
    console.log('• node scripts/generate-inline-illustrations.js therapies');
    console.log('• node scripts/generate-inline-illustrations.js all');
  } else {
    console.log('🎉 All illustrations completed!');
    console.log('Ready for integration into the Thrive app.');
  }
  
  return {
    totalGenerated,
    totalPlanned,
    percentage: Math.round((totalGenerated / totalPlanned) * 100),
    remaining: totalPlanned - totalGenerated
  };
}

async function main() {
  try {
    const progress = await checkProgress();
    
    // Create a manifest file
    const manifestPath = path.join(__dirname, '..', 'public', 'icons', 'ayurvedic', 'illustrations', 'manifest.json');
    
    const manifest = {
      generated: new Date().toISOString(),
      app: 'Thrive - Ayurvedic Wellness',
      description: 'Inline illustrations for enriched text content',
      style: 'Natural, organic illustrations with transparent backgrounds',
      generator: 'DALL-E 3',
      progress: progress,
      categories: Object.fromEntries(
        Object.entries(ICON_DEFINITIONS).map(([category, icons]) => [
          category, 
          {
            count: icons.length,
            description: getCategoryDescription(category)
          }
        ])
      ),
      themeColors: {
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
      }
    };
    
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`\n📋 Manifest created: ${manifestPath}`);
    
  } catch (error) {
    console.error('❌ Error checking progress:', error.message);
  }
}

function getCategoryDescription(category) {
  const descriptions = {
    diseases: 'Health conditions with healing-focused imagery emphasizing wellness and recovery',
    herbs: 'Botanical illustrations of Ayurvedic herbs and remedies with natural healing elements',
    exercises: 'Peaceful yoga poses and physical practices showing movement and energy',
    therapies: 'Nurturing wellness treatments and lifestyle interventions with therapeutic energy'
  };
  return descriptions[category] || 'Ayurvedic wellness illustration';
}

if (require.main === module) {
  main();
}