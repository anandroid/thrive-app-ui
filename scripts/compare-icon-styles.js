#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

async function compareStyles() {
  console.log('🎨 Icon Style Comparison');
  console.log('═'.repeat(50));
  
  const baseDir = path.join(__dirname, '..', 'public', 'icons', 'ayurvedic');
  
  // Check original DALL-E icons
  const originalDir = path.join(baseDir, 'dalle-generated');
  const illustrationDir = path.join(baseDir, 'illustrations');
  const clearIconDir = path.join(baseDir, 'clear-icons');
  
  console.log('\n📊 STYLE COMPARISON:');
  console.log('');
  
  // Original DALL-E icons
  try {
    const originalFiles = await fs.readdir(originalDir);
    const originalPngs = originalFiles.filter(f => f.endsWith('.png'));
    console.log(`✅ Original DALL-E Icons: ${originalPngs.length} files`);
    console.log('   Style: Clean app icons with clear iconography');
    console.log('   Quality: High, recognizable, professional');
    console.log('   Best for: App icons, clear recognition');
  } catch (error) {
    console.log('❌ Original DALL-E Icons: Not found');
  }
  
  // Illustration style
  try {
    const illDirs = await fs.readdir(illustrationDir);
    let totalIllustrations = 0;
    for (const dir of illDirs) {
      if (dir !== 'manifest.json') {
        const files = await fs.readdir(path.join(illustrationDir, dir));
        totalIllustrations += files.filter(f => f.endsWith('.png')).length;
      }
    }
    console.log(`⚠️  Illustration Style: ${totalIllustrations} files`);
    console.log('   Style: Artistic, flowing, organic');
    console.log('   Quality: Beautiful but sometimes unclear');
    console.log('   Issue: Too abstract, meaning not immediately clear');
  } catch (error) {
    console.log('❌ Illustration Style: Not found');
  }
  
  // Clear icons
  try {
    const clearDirs = await fs.readdir(clearIconDir);
    let totalClear = 0;
    for (const dir of clearDirs) {
      try {
        const files = await fs.readdir(path.join(clearIconDir, dir));
        totalClear += files.filter(f => f.endsWith('.png')).length;
      } catch (error) {
        // Skip if directory doesn't exist
      }
    }
    console.log(`✅ Clear Iconography: ${totalClear} files`);
    console.log('   Style: Clear, recognizable, professional');
    console.log('   Quality: High clarity, immediately understandable');
    console.log('   Best for: Inline content, instant recognition');
  } catch (error) {
    console.log('❌ Clear Iconography: Not found');
  }
  
  console.log('\n🎯 RECOMMENDATION:');
  console.log('Use Clear Iconography approach for final generation');
  console.log('- Immediately recognizable (yoga pose = specific pose)');
  console.log('- Professional medical/wellness iconography');
  console.log('- Perfect for inline text content');
  console.log('- Maintains Thrive app color consistency');
  
  console.log('\n🔄 NEXT STEPS:');
  console.log('1. Approve the clear iconography samples');
  console.log('2. Generate full set with: node scripts/generate-clear-icons.js [category]');
  console.log('3. Categories: diseases, herbs, exercises, therapies');
  
  return {
    originalCount: 0,
    illustrationCount: 0,
    clearIconCount: 0
  };
}

if (require.main === module) {
  compareStyles().catch(console.error);
}