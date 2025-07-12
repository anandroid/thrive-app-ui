#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function checkAndFixIssues() {
  try {
    console.log(`[${new Date().toISOString()}] Checking for open issues...`);
    
    // Get open issues
    const { stdout } = await execAsync('gh issue list --repo anandroid/thrive-app-ui --state open --json number,title,body,url');
    const issues = JSON.parse(stdout);
    
    if (issues.length === 0) {
      console.log('No open issues found.');
      return;
    }
    
    console.log(`Found ${issues.length} open issue(s).`);
    
    for (const issue of issues) {
      console.log(`\nProcessing issue #${issue.number}: ${issue.title}`);
      console.log(`Issue body: ${issue.body}`);
      
      // Trigger Claude to fix the issue
      console.log('Analyzing and fixing the issue...');
      
      // The actual fixing will be done by Claude when this script detects an issue
      // For now, we'll just log that an issue was found
      console.log(`Issue #${issue.number} needs attention!`);
      console.log(`URL: ${issue.url}`);
    }
  } catch (error) {
    console.error('Error checking issues:', error.message);
  }
}

// Check immediately on start
checkAndFixIssues();

// Then check every 2 minutes
setInterval(checkAndFixIssues, 2 * 60 * 1000);

console.log('Issue monitor started. Checking every 2 minutes...');
console.log('Press Ctrl+C to stop.');