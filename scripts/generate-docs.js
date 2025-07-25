#!/usr/bin/env node

/**
 * Documentation Generator
 * Automatically generates documentation from code annotations
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Feature manifest location
const MANIFEST_PATH = './docs/features/manifest.json';
const FEATURES_DIR = './docs/features/';

// Ensure directories exist
if (!fs.existsSync(FEATURES_DIR)) {
  fs.mkdirSync(FEATURES_DIR, { recursive: true });
}

// Initialize or load manifest
let manifest = { features: [], lastUpdated: new Date().toISOString() };
if (fs.existsSync(MANIFEST_PATH)) {
  manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
}

// Extract annotations from source files
function extractAnnotations(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const annotations = {};
  
  // Extract @feature, @description, @assistant, @endpoint
  const featureMatch = content.match(/@feature\s+(.+)/);
  const descriptionMatch = content.match(/@description\s+(.+)/);
  const assistantMatch = content.match(/@assistant\s+(.+)/);
  const endpointMatch = content.match(/@endpoint\s+(.+)/);
  
  if (featureMatch) annotations.feature = featureMatch[1].trim();
  if (descriptionMatch) annotations.description = descriptionMatch[1].trim();
  if (assistantMatch) annotations.assistant = assistantMatch[1].trim();
  if (endpointMatch) annotations.endpoint = endpointMatch[1].trim();
  
  return annotations;
}

// Scan all TypeScript files
const files = glob.sync('**/*.{ts,tsx}', {
  ignore: ['node_modules/**', '.next/**', 'dist/**', '**/*.test.ts', '**/*.spec.ts']
});

const featureMap = new Map();

files.forEach(file => {
  const annotations = extractAnnotations(file);
  if (annotations.feature) {
    if (!featureMap.has(annotations.feature)) {
      featureMap.set(annotations.feature, {
        name: annotations.feature,
        description: annotations.description || '',
        files: [],
        assistants: new Set(),
        endpoints: new Set(),
        implemented: new Date().toISOString().split('T')[0]
      });
    }
    
    const feature = featureMap.get(annotations.feature);
    feature.files.push(file);
    if (annotations.assistant) feature.assistants.add(annotations.assistant);
    if (annotations.endpoint) feature.endpoints.add(annotations.endpoint);
  }
});

// Update manifest
manifest.features = Array.from(featureMap.values()).map(feature => ({
  ...feature,
  assistants: Array.from(feature.assistants),
  endpoints: Array.from(feature.endpoints)
}));

// Save manifest
fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

// Generate feature documentation
featureMap.forEach((feature, name) => {
  const docPath = path.join(FEATURES_DIR, `${name.toLowerCase().replace(/\s+/g, '-')}.md`);
  const docContent = `# ${name}

${feature.description}

## Implementation Details

### Files
${feature.files.map(f => `- \`${f}\``).join('\n')}

### Assistants
${Array.from(feature.assistants).map(a => `- ${a}`).join('\n') || 'None'}

### API Endpoints
${Array.from(feature.endpoints).map(e => `- \`${e}\``).join('\n') || 'None'}

### Added
${feature.implemented}

## Usage Examples

\`\`\`typescript
// TODO: Add usage examples
\`\`\`
`;
  
  fs.writeFileSync(docPath, docContent);
});

console.log(`✅ Documentation generated for ${featureMap.size} features`);
console.log(`📁 Manifest saved to ${MANIFEST_PATH}`);