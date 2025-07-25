#!/usr/bin/env node

/**
 * Assistant Configuration Verifier
 * Ensures assistant IDs are properly configured and different between environments
 */

const { execSync } = require('child_process');

const ASSISTANT_VARS = [
  'THRIVE_CHAT_ASSISTANT_ID',
  'THRIVE_ROUTINE_ASSISTANT_ID',
  'THRIVE_PANTRY_ASSISTANT_ID',
  'THRIVE_RECOMMENDATION_ASSISTANT_ID'
];

const FEED_ASSISTANT_VARS = {
  dev: 'THRIVE_DEV_FEED_ASSISTANT_ID',
  prod: 'THRIVE_FEED_ASSISTANT_ID'
};

console.log('🤖 Verifying Assistant Configurations\n');

// Get assistant IDs from both environments
async function getAssistantIds() {
  const devIds = {};
  const prodIds = {};
  
  console.log('📥 Fetching assistant IDs from both environments...\n');
  
  // Fetch from dev
  console.log('Development (thrive-dev-465922):');
  for (const varName of ASSISTANT_VARS) {
    try {
      const value = execSync(
        `gcloud secrets versions access latest --secret=${varName} --project=thrive-dev-465922 2>/dev/null`,
        { encoding: 'utf8' }
      ).trim();
      devIds[varName] = value.substring(0, 20) + '...';
      console.log(`  ✅ ${varName}: ${devIds[varName]}`);
    } catch (error) {
      devIds[varName] = null;
      console.log(`  ❌ ${varName}: Not found`);
    }
  }
  
  // Dev feed assistant
  try {
    const value = execSync(
      `gcloud secrets versions access latest --secret=${FEED_ASSISTANT_VARS.dev} --project=thrive-dev-465922 2>/dev/null`,
      { encoding: 'utf8' }
    ).trim();
    devIds[FEED_ASSISTANT_VARS.dev] = value.substring(0, 20) + '...';
    console.log(`  ✅ ${FEED_ASSISTANT_VARS.dev}: ${devIds[FEED_ASSISTANT_VARS.dev]}`);
  } catch (error) {
    devIds[FEED_ASSISTANT_VARS.dev] = null;
    console.log(`  ❌ ${FEED_ASSISTANT_VARS.dev}: Not found`);
  }
  
  console.log('\nProduction (thrive-465618):');
  // Fetch from prod
  for (const varName of ASSISTANT_VARS) {
    try {
      const value = execSync(
        `gcloud secrets versions access latest --secret=${varName} --project=thrive-465618 2>/dev/null`,
        { encoding: 'utf8' }
      ).trim();
      prodIds[varName] = value.substring(0, 20) + '...';
      console.log(`  ✅ ${varName}: ${prodIds[varName]}`);
    } catch (error) {
      prodIds[varName] = null;
      console.log(`  ❌ ${varName}: Not found`);
    }
  }
  
  // Prod feed assistant
  try {
    const value = execSync(
      `gcloud secrets versions access latest --secret=${FEED_ASSISTANT_VARS.prod} --project=thrive-465618 2>/dev/null`,
      { encoding: 'utf8' }
    ).trim();
    prodIds[FEED_ASSISTANT_VARS.prod] = value.substring(0, 20) + '...';
    console.log(`  ✅ ${FEED_ASSISTANT_VARS.prod}: ${prodIds[FEED_ASSISTANT_VARS.prod]}`);
  } catch (error) {
    prodIds[FEED_ASSISTANT_VARS.prod] = null;
    console.log(`  ❌ ${FEED_ASSISTANT_VARS.prod}: Not found`);
  }
  
  return { devIds, prodIds };
}

// Verify configurations
async function verifyAssistants() {
  const { devIds, prodIds } = await getAssistantIds();
  
  console.log('\n🔍 Verification Results:\n');
  
  let issues = [];
  
  // Check that all assistants exist
  ASSISTANT_VARS.forEach(varName => {
    if (!devIds[varName]) {
      issues.push(`❌ ${varName} missing in development`);
    }
    if (!prodIds[varName]) {
      issues.push(`❌ ${varName} missing in production`);
    }
  });
  
  // Check feed assistants
  if (!devIds[FEED_ASSISTANT_VARS.dev]) {
    issues.push(`❌ ${FEED_ASSISTANT_VARS.dev} missing in development`);
  }
  if (!prodIds[FEED_ASSISTANT_VARS.prod]) {
    issues.push(`❌ ${FEED_ASSISTANT_VARS.prod} missing in production`);
  }
  
  // Check that dev and prod IDs are different
  ASSISTANT_VARS.forEach(varName => {
    if (devIds[varName] && prodIds[varName] && devIds[varName] === prodIds[varName]) {
      issues.push(`⚠️  ${varName} has SAME ID in both environments (should be different!)`);
    }
  });
  
  // Check for duplicate IDs within each environment
  const checkDuplicates = (ids, env) => {
    const values = Object.entries(ids)
      .filter(([_, value]) => value)
      .map(([key, value]) => ({ key, value }));
    
    for (let i = 0; i < values.length; i++) {
      for (let j = i + 1; j < values.length; j++) {
        if (values[i].value === values[j].value) {
          issues.push(`⚠️  ${env}: ${values[i].key} and ${values[j].key} have the SAME ID`);
        }
      }
    }
  };
  
  checkDuplicates(devIds, 'Development');
  checkDuplicates(prodIds, 'Production');
  
  // Report results
  if (issues.length === 0) {
    console.log('✅ All assistant configurations are correct!');
    console.log('  - All required assistants exist');
    console.log('  - Dev and prod use different IDs');
    console.log('  - No duplicate IDs within environments');
  } else {
    console.log('❌ Configuration issues found:\n');
    issues.forEach(issue => console.log(`  ${issue}`));
    
    console.log('\n📝 To fix:');
    console.log('  1. Create missing assistants: npm run create-assistants');
    console.log('  2. Ensure dev/prod use different OpenAI projects');
    console.log('  3. Update secret values in Google Cloud');
    
    process.exit(1);
  }
}

// Run verification
verifyAssistants().catch(error => {
  console.error('❌ Error verifying assistants:', error.message);
  process.exit(1);
});