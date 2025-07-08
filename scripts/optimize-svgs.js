#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Install required package if not already installed
try {
  require.resolve('svgo');
} catch (e) {
  console.log('Installing SVGO for SVG optimization...');
  execSync('npm install --save-dev svgo', { stdio: 'inherit' });
}

const { optimize } = require('svgo');

const ILLUSTRATIONS_DIR = path.join(__dirname, '../public/illustrations');

// SVGO configuration optimized for mobile
const svgoConfig = {
  multipass: true,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          // Disable removing viewBox (needed for responsive SVGs)
          removeViewBox: false,
          // Keep IDs if they're used for gradients/masks
          cleanupIds: {
            minify: false
          },
          // More aggressive path simplification
          convertPathData: {
            floatPrecision: 1,
            transformPrecision: 1,
            makeArcs: {
              threshold: 2.5,
              tolerance: 0.5
            }
          },
          // Merge paths when possible
          mergePaths: {
            force: true
          },
          // Convert shapes to paths for better compression
          convertShapeToPath: true,
          // Remove unnecessary attributes
          removeUnknownsAndDefaults: {
            keepDataAttrs: false,
            keepAriaAttrs: false
          }
        }
      }
    },
    // Remove comments
    'removeComments',
    // Remove metadata
    'removeMetadata',
    // Remove editor-specific attributes
    'removeEditorsNSData',
    // Remove empty attributes
    'removeEmptyAttrs',
    // Remove hidden elements
    'removeHiddenElems',
    // Remove empty text elements
    'removeEmptyText',
    // Remove empty containers
    'removeEmptyContainers',
    // Remove unused definitions
    'removeUnusedNS',
    // Minify styles
    'minifyStyles',
    // Remove unnecessary whitespace
    'cleanupEnableBackground',
    // Sort attributes
    'sortAttrs',
    // Remove title
    'removeTitle',
    // Remove desc
    'removeDesc',
    // Remove dimensions if viewBox exists
    'removeDimensions',
    // Remove style elements if possible
    'removeStyleElement',
    // Remove script elements
    'removeScriptElement',
    // Optimize transformations
    {
      name: 'convertTransform',
      params: {
        convertToShorts: true,
        floatPrecision: 1,
        transformPrecision: 1,
        matrixToTransform: true,
        shortTranslate: true,
        shortScale: true,
        shortRotate: true,
        removeUseless: true
      }
    }
  ]
};

async function optimizeSVG(filePath) {
  const fileName = path.basename(filePath);
  console.log(`Optimizing ${fileName}...`);
  
  const originalContent = fs.readFileSync(filePath, 'utf8');
  const originalSize = Buffer.byteLength(originalContent, 'utf8');
  
  try {
    const result = optimize(originalContent, {
      ...svgoConfig,
      path: filePath
    });
    
    const optimizedSize = Buffer.byteLength(result.data, 'utf8');
    const reduction = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
    
    // Write optimized SVG
    fs.writeFileSync(filePath, result.data);
    
    console.log(`✓ ${fileName}: ${(originalSize / 1024).toFixed(1)}KB → ${(optimizedSize / 1024).toFixed(1)}KB (${reduction}% reduction)`);
    
    return { originalSize, optimizedSize };
  } catch (error) {
    console.error(`✗ Error optimizing ${fileName}:`, error.message);
    return { originalSize, optimizedSize: originalSize };
  }
}

async function main() {
  console.log('Starting SVG optimization for mobile...\n');
  
  // Get all SVG files
  const svgFiles = fs.readdirSync(ILLUSTRATIONS_DIR)
    .filter(file => file.endsWith('.svg'))
    .map(file => path.join(ILLUSTRATIONS_DIR, file));
  
  if (svgFiles.length === 0) {
    console.log('No SVG files found in illustrations directory.');
    return;
  }
  
  let totalOriginal = 0;
  let totalOptimized = 0;
  
  // Optimize each SVG
  for (const file of svgFiles) {
    const { originalSize, optimizedSize } = await optimizeSVG(file);
    totalOriginal += originalSize;
    totalOptimized += optimizedSize;
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('Optimization complete!');
  console.log(`Total: ${(totalOriginal / 1024 / 1024).toFixed(1)}MB → ${(totalOptimized / 1024 / 1024).toFixed(1)}MB`);
  console.log(`Overall reduction: ${((totalOriginal - totalOptimized) / totalOriginal * 100).toFixed(1)}%`);
  
  if (totalOptimized > 500 * 1024) { // If still over 500KB total
    console.log('\n⚠️  Warning: Total SVG size is still large for mobile.');
    console.log('Consider additional optimization strategies:');
    console.log('- Simplify illustrations in design software');
    console.log('- Use lazy loading for non-critical images');
    console.log('- Convert to WebP or AVIF format');
    console.log('- Use CSS illustrations for simple graphics');
  }
}

main().catch(console.error);