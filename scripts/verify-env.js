#!/usr/bin/env node

/**
 * Environment Variable Verifier
 * Ensures all required environment variables are properly set
 */

const fs = require('fs');
const { execSync } = require('child_process');

// Required environment variables by category
const REQUIRED_VARS = {
  'Core API Keys': [
    'THRIVE_OPENAI_API_KEY',
    'OPENAI_API_KEY',
    'THRIVE_GEMINI_API_KEY'
  ],
  'Shopify': [
    'THRIVE_SHOPIFY_API_KEY',
    'THRIVE_SHOPIFY_API_SECRET_KEY',
    'THRIVE_SHOPIFY_STOREFRONT_API_TOKEN',
    'THRIVE_SHOPIFY_STORE_DOMAIN'
  ],
  'Assistant IDs': [
    'THRIVE_CHAT_ASSISTANT_ID',
    'THRIVE_ROUTINE_ASSISTANT_ID',
    'THRIVE_PANTRY_ASSISTANT_ID',
    'THRIVE_RECOMMENDATION_ASSISTANT_ID'
  ],
  'Feed Assistant': {
    dev: 'THRIVE_DEV_FEED_ASSISTANT_ID',
    prod: 'THRIVE_FEED_ASSISTANT_ID'
  },
  'Public URLs': [
    'NEXT_PUBLIC_APP_URL',
    'NEXT_PUBLIC_SHOP_URL'
  ]
};

// Firebase vars (production only)
const FIREBASE_VARS = [
  'FIREBASE_ADMIN_CLIENT_EMAIL',
  'FIREBASE_ADMIN_PRIVATE_KEY',
  'FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'
];

console.log('🔍 Verifying environment configuration...\n');

// Detect current environment
let currentProject = 'unknown';
try {
  currentProject = execSync('gcloud config get-value project', { encoding: 'utf8' }).trim();
} catch (error) {
  console.error('⚠️  Could not detect current GCloud project');
}

const isDev = currentProject === 'thrive-dev-465922';
const isProd = currentProject === 'thrive-465618';

console.log(`📍 Current project: ${currentProject}`);
console.log(`📍 Environment: ${isDev ? 'Development' : isProd ? 'Production' : 'Unknown'}\n`);

// Check local .env.local file
const envPath = '.env.local';
const envVars = {};
let missingVars = [];
let warnings = [];

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      envVars[match[1].trim()] = match[2].trim();
    }
  });
}

// Check required variables
Object.entries(REQUIRED_VARS).forEach(([category, vars]) => {
  console.log(`\n${category}:`);
  
  if (category === 'Feed Assistant') {
    const varName = isDev ? vars.dev : vars.prod;
    const exists = envVars[varName] || process.env[varName];
    
    if (!exists) {
      missingVars.push(varName);
      console.log(`  ❌ ${varName} - MISSING`);
    } else {
      console.log(`  ✅ ${varName}`);
    }
  } else {
    vars.forEach(varName => {
      const exists = envVars[varName] || process.env[varName];
      
      if (!exists) {
        missingVars.push(varName);
        console.log(`  ❌ ${varName} - MISSING`);
      } else {
        console.log(`  ✅ ${varName}`);
      }
    });
  }
});

// Check Firebase vars in production
if (isProd) {
  console.log('\nFirebase (Production Only):');
  FIREBASE_VARS.forEach(varName => {
    const exists = envVars[varName] || process.env[varName];
    
    if (!exists) {
      missingVars.push(varName);
      console.log(`  ❌ ${varName} - MISSING`);
    } else {
      console.log(`  ✅ ${varName}`);
    }
  });
}

// Check for common issues
console.log('\n🔎 Checking for common issues...');

// Check if assistant IDs are the same (they should be different)
const assistantIds = [
  'THRIVE_CHAT_ASSISTANT_ID',
  'THRIVE_ROUTINE_ASSISTANT_ID',
  'THRIVE_PANTRY_ASSISTANT_ID',
  'THRIVE_RECOMMENDATION_ASSISTANT_ID'
];

const idValues = new Set();
assistantIds.forEach(id => {
  const value = envVars[id] || process.env[id];
  if (value && idValues.has(value)) {
    warnings.push(`⚠️  Duplicate assistant ID found: ${id} has same value as another assistant`);
  }
  if (value) idValues.add(value);
});

// Check if using correct feed assistant var
if (isDev && (envVars['THRIVE_FEED_ASSISTANT_ID'] || process.env['THRIVE_FEED_ASSISTANT_ID'])) {
  warnings.push('⚠️  Using THRIVE_FEED_ASSISTANT_ID in dev environment (should use THRIVE_DEV_FEED_ASSISTANT_ID)');
}
if (isProd && (envVars['THRIVE_DEV_FEED_ASSISTANT_ID'] || process.env['THRIVE_DEV_FEED_ASSISTANT_ID'])) {
  warnings.push('⚠️  Using THRIVE_DEV_FEED_ASSISTANT_ID in prod environment (should use THRIVE_FEED_ASSISTANT_ID)');
}

// Check secrets in GCloud
if (isDev || isProd) {
  console.log('\n☁️  Checking Google Cloud Secrets...');
  
  try {
    const secrets = execSync(`gcloud secrets list --project=${currentProject} --format="value(name)"`, { encoding: 'utf8' })
      .trim()
      .split('\n')
      .filter(Boolean);
    
    missingVars.forEach(varName => {
      if (secrets.includes(varName)) {
        console.log(`  ℹ️  ${varName} exists in GCloud secrets (not in local env)`);
      }
    });
  } catch (error) {
    console.error('  ⚠️  Could not check GCloud secrets');
  }
}

// Summary
console.log('\n📊 Summary:');
console.log(`  Total variables checked: ${Object.values(REQUIRED_VARS).flat().length + (isProd ? FIREBASE_VARS.length : 0)}`);
console.log(`  Missing locally: ${missingVars.length}`);
console.log(`  Warnings: ${warnings.length}`);

if (warnings.length > 0) {
  console.log('\n⚠️  Warnings:');
  warnings.forEach(w => console.log(`  ${w}`));
}

if (missingVars.length > 0) {
  console.log('\n❌ Missing variables detected!');
  console.log('Run "./scripts/upload-secrets.sh" to sync from GCloud secrets');
  process.exit(1);
} else {
  console.log('\n✅ All required environment variables are configured!');
}