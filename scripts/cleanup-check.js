#!/usr/bin/env node

/**
 * Code Cleanup Checker
 * Identifies deprecated code, unused exports, and orphaned files
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const { execSync } = require('child_process');

console.log('🧹 Running cleanup check...\n');

const issues = {
  deprecated: [],
  unused: [],
  orphaned: [],
  duplicates: []
};

// Check for deprecated code past removal date
function checkDeprecatedCode() {
  const files = glob.sync('**/*.{ts,tsx,js,jsx}', {
    ignore: ['node_modules/**', '.next/**', 'dist/**']
  });
  
  const today = new Date();
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const deprecatedMatches = content.matchAll(/@deprecated.*?@removeBy\s+(\d{4}-\d{2}-\d{2})/g);
    
    for (const match of deprecatedMatches) {
      const removeByDate = new Date(match[1]);
      if (removeByDate < today) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        issues.deprecated.push({
          file,
          line: lineNumber,
          removeBy: match[1],
          overdue: Math.floor((today - removeByDate) / (1000 * 60 * 60 * 24))
        });
      }
    }
  });
}

// Check for unused exports using TypeScript compiler
function checkUnusedExports() {
  try {
    // Run TypeScript compiler to find unused exports
    const result = execSync('npx tsc --noEmit --listFiles 2>&1', { encoding: 'utf8' });
    
    // Parse for unused export warnings
    const unusedPattern = /export .+ is declared but never used/g;
    const matches = result.match(unusedPattern) || [];
    
    matches.forEach(match => {
      issues.unused.push(match);
    });
  } catch (error) {
    // TypeScript errors are expected, we're looking for specific warnings
    const output = error.stdout || error.message;
    const unusedExports = output.match(/(\S+\.tsx?).+?export '(.+?)' is declared but never used/g) || [];
    
    unusedExports.forEach(match => {
      const [, file, exportName] = match.match(/(\S+\.tsx?).+?export '(.+?)' is declared but never used/);
      issues.unused.push({ file, exportName });
    });
  }
}

// Find orphaned test files
function checkOrphanedTests() {
  const testFiles = glob.sync('**/*.{test,spec}.{ts,tsx,js,jsx}', {
    ignore: ['node_modules/**', '.next/**', 'dist/**']
  });
  
  testFiles.forEach(testFile => {
    // Derive the source file path
    const sourceFile = testFile
      .replace(/\.(test|spec)/, '')
      .replace(/__tests__\//, '');
    
    if (!fs.existsSync(sourceFile)) {
      issues.orphaned.push({
        testFile,
        expectedSource: sourceFile
      });
    }
  });
}

// Find duplicate implementations
function checkDuplicates() {
  const files = glob.sync('**/*.{ts,tsx}', {
    ignore: ['node_modules/**', '.next/**', 'dist/**', '**/*.test.ts', '**/*.spec.ts']
  });
  
  const functionSignatures = new Map();
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    // Extract function signatures
    const functionMatches = content.matchAll(/(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\([^)]*\)/g);
    
    for (const match of functionMatches) {
      const funcName = match[1];
      if (!functionSignatures.has(funcName)) {
        functionSignatures.set(funcName, []);
      }
      functionSignatures.get(funcName).push(file);
    }
  });
  
  // Find functions defined in multiple files
  functionSignatures.forEach((files, funcName) => {
    if (files.length > 1) {
      issues.duplicates.push({
        function: funcName,
        files
      });
    }
  });
}

// Generate deprecation log
function updateDeprecationLog() {
  const logPath = './docs/deprecations.md';
  let content = '# Deprecation Log\n\n';
  content += `Last updated: ${new Date().toISOString()}\n\n`;
  
  if (issues.deprecated.length > 0) {
    content += '## Overdue Deprecations\n\n';
    issues.deprecated.forEach(item => {
      content += `- **${item.file}:${item.line}** - Overdue by ${item.overdue} days (remove by ${item.removeBy})\n`;
    });
  }
  
  fs.writeFileSync(logPath, content);
}

// Run all checks
checkDeprecatedCode();
checkUnusedExports();
checkOrphanedTests();
checkDuplicates();
updateDeprecationLog();

// Report results
console.log('📊 Cleanup Report\n');

if (issues.deprecated.length > 0) {
  console.log(`❌ ${issues.deprecated.length} deprecated items past removal date:`);
  issues.deprecated.forEach(item => {
    console.log(`   - ${item.file}:${item.line} (${item.overdue} days overdue)`);
  });
  console.log('');
}

if (issues.unused.length > 0) {
  console.log(`⚠️  ${issues.unused.length} unused exports found`);
  console.log('   Run "npm run cleanup:analyze" for details\n');
}

if (issues.orphaned.length > 0) {
  console.log(`🗑️  ${issues.orphaned.length} orphaned test files:`);
  issues.orphaned.forEach(item => {
    console.log(`   - ${item.testFile}`);
  });
  console.log('');
}

if (issues.duplicates.length > 0) {
  console.log(`🔄 ${issues.duplicates.length} potentially duplicate functions:`);
  issues.duplicates.forEach(item => {
    console.log(`   - ${item.function} found in ${item.files.length} files`);
  });
  console.log('');
}

const totalIssues = 
  issues.deprecated.length + 
  issues.unused.length + 
  issues.orphaned.length + 
  issues.duplicates.length;

if (totalIssues === 0) {
  console.log('✅ No cleanup issues found!');
} else {
  console.log(`\n📋 Total issues: ${totalIssues}`);
  console.log('Run "npm run cleanup:fix" to address these automatically where possible');
}

// Exit with error code if issues found
process.exit(totalIssues > 0 ? 1 : 0);