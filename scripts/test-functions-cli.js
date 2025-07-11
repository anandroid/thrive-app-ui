#!/usr/bin/env node

/**
 * Command-line test script for function integration
 * Tests the API endpoints directly to verify function handling
 */

const https = require('https');
const http = require('http');

// Test configuration
const API_BASE = process.env.API_URL || 'http://localhost:3000';
const isHTTPS = API_BASE.startsWith('https');
const httpModule = isHTTPS ? https : http;

// Parse URL
const url = new URL(API_BASE);
const options = {
  hostname: url.hostname,
  port: url.port || (isHTTPS ? 443 : 80),
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
};

// Test utilities
const makeRequest = (path, data) => {
  return new Promise((resolve, reject) => {
    const reqOptions = { ...options, path };
    
    const req = httpModule.request(reqOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
};

// Color output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  test: (msg) => console.log(`\n${colors.bright}${colors.magenta}TEST:${colors.reset} ${msg}`),
  result: (msg) => console.log(`${colors.cyan}→${colors.reset} ${msg}`)
};

// Test scenarios
const tests = {
  // Test 1: Submit tool outputs with valid data
  async testValidToolOutput() {
    log.test('Valid Tool Output Submission');
    
    const payload = {
      threadId: 'thread_test123',
      runId: 'run_test456',
      toolOutputs: [
        {
          tool_call_id: 'call_abc123',
          output: JSON.stringify({
            items: [
              { id: '1', name: 'Vitamin D3', tags: ['supplement'] },
              { id: '2', name: 'Magnesium', tags: ['supplement', 'sleep'] }
            ]
          })
        }
      ]
    };
    
    try {
      const response = await makeRequest('/api/assistant/submit-tool-outputs', payload);
      log.result(`Status: ${response.status}`);
      
      if (response.status === 200) {
        log.success('Tool outputs accepted');
        
        // Parse SSE stream
        if (response.headers['content-type']?.includes('text/event-stream')) {
          const events = response.data.split('\n\n').filter(e => e.trim());
          log.info(`Received ${events.length} events`);
          
          events.forEach(event => {
            if (event.startsWith('data: ')) {
              try {
                const data = JSON.parse(event.substring(6));
                log.result(`Event type: ${data.type}`);
              } catch (e) {
                // Ignore parse errors
              }
            }
          });
        }
      } else {
        log.error(`Unexpected status: ${response.status}`);
        log.result(`Response: ${response.data}`);
      }
    } catch (error) {
      log.error(`Request failed: ${error.message}`);
    }
  },

  // Test 2: Submit tool outputs with error response
  async testErrorToolOutput() {
    log.test('Error Tool Output Submission');
    
    const payload = {
      threadId: 'thread_test123',
      runId: 'run_test456',
      toolOutputs: [
        {
          tool_call_id: 'call_error123',
          output: JSON.stringify({
            error: true,
            message: 'Routine not found'
          })
        }
      ]
    };
    
    try {
      const response = await makeRequest('/api/assistant/submit-tool-outputs', payload);
      log.result(`Status: ${response.status}`);
      
      if (response.status === 200) {
        log.success('Error output handled gracefully');
      } else {
        log.warning(`Status: ${response.status}`);
        log.result(`Response: ${response.data}`);
      }
    } catch (error) {
      log.error(`Request failed: ${error.message}`);
    }
  },

  // Test 3: Missing parameters
  async testMissingParameters() {
    log.test('Missing Parameters Handling');
    
    const payload = {
      runId: 'run_test456',
      toolOutputs: []
      // Missing threadId
    };
    
    try {
      const response = await makeRequest('/api/assistant/submit-tool-outputs', payload);
      log.result(`Status: ${response.status}`);
      
      if (response.status === 400) {
        log.success('Correctly rejected missing parameters');
        const data = JSON.parse(response.data);
        log.result(`Error: ${data.error}`);
      } else {
        log.error(`Expected 400, got ${response.status}`);
      }
    } catch (error) {
      log.error(`Request failed: ${error.message}`);
    }
  },

  // Test 4: Invalid JSON in request
  async testInvalidJSON() {
    log.test('Invalid JSON Handling');
    
    // Send raw invalid JSON
    const reqOptions = {
      ...options,
      path: '/api/assistant/submit-tool-outputs'
    };
    
    return new Promise((resolve) => {
      const req = httpModule.request(reqOptions, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          log.result(`Status: ${res.statusCode}`);
          
          if (res.statusCode === 400) {
            log.success('Correctly rejected invalid JSON');
            const response = JSON.parse(data);
            log.result(`Error: ${response.error}`);
          } else {
            log.error(`Expected 400, got ${res.statusCode}`);
          }
          resolve();
        });
      });
      
      req.on('error', (error) => {
        log.error(`Request failed: ${error.message}`);
        resolve();
      });
      
      // Send invalid JSON
      req.write('{ invalid json }');
      req.end();
    });
  },

  // Test 5: Multiple function calls
  async testMultipleFunctions() {
    log.test('Multiple Function Calls');
    
    const payload = {
      threadId: 'thread_test123',
      runId: 'run_test789',
      toolOutputs: [
        {
          tool_call_id: 'call_pantry123',
          output: JSON.stringify({
            items: [
              { id: '1', name: 'Melatonin', tags: ['sleep'] }
            ]
          })
        },
        {
          tool_call_id: 'call_routine456',
          output: JSON.stringify({
            routines: [
              { 
                id: 'r1', 
                name: 'Evening Wind-Down',
                type: 'sleep_wellness',
                isActive: true
              }
            ]
          })
        }
      ]
    };
    
    try {
      const response = await makeRequest('/api/assistant/submit-tool-outputs', payload);
      log.result(`Status: ${response.status}`);
      
      if (response.status === 200) {
        log.success('Multiple tool outputs handled');
      } else {
        log.error(`Unexpected status: ${response.status}`);
      }
    } catch (error) {
      log.error(`Request failed: ${error.message}`);
    }
  }
};

// Main test runner
async function runTests() {
  console.log(`\n${colors.bright}🧪 Thrive Function Integration Tests${colors.reset}`);
  console.log(`${colors.bright}API Base: ${API_BASE}${colors.reset}\n`);
  
  const testList = Object.entries(tests);
  
  for (const [name, testFn] of testList) {
    await testFn();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Delay between tests
  }
  
  console.log(`\n${colors.bright}${colors.green}✅ All tests completed${colors.reset}\n`);
}

// Run tests if executed directly
if (require.main === module) {
  runTests().catch(error => {
    log.error(`Test suite failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { tests, runTests };