/**
 * Manual browser tests for assistant coordination
 * This script should be copied and pasted into the browser console
 * 
 * Make sure you're on http://localhost:3000 or http://localhost:3001
 */

console.log('🧪 Thrive Assistant Coordination Tests');
console.log('=====================================\n');

// Test 1: Function Calls Test
async function testFunctionCalls() {
  console.log('📋 Test 1: Function Calls');
  
  // Navigate to test page
  window.location.href = '/test-functions';
  
  console.log('Instructions:');
  console.log('1. Click "Setup Test Data"');
  console.log('2. Test each function button');
  console.log('3. Verify results appear below');
  console.log('4. Note: All functions should return data\n');
}

// Test 2: Supplement-First Protocol
async function testSupplementFirst() {
  console.log('📋 Test 2: Supplement-First Protocol');
  console.log('Instructions:');
  console.log('1. Go to chat (/)');
  console.log('2. Send: "I have trouble sleeping at night"');
  console.log('3. EXPECTED: Supplements (Magnesium, Melatonin) appear BEFORE routine suggestion');
  console.log('4. VERIFY: Check the order in the response\n');
  
  // Helper to check response
  window.checkSupplementOrder = (container) => {
    const elements = container.querySelectorAll('[class*="actionable"], button');
    let firstSupplement = -1;
    let firstRoutine = -1;
    
    elements.forEach((el, index) => {
      const text = el.textContent.toLowerCase();
      if ((text.includes('magnesium') || text.includes('melatonin')) && firstSupplement === -1) {
        firstSupplement = index;
        console.log(`✓ Found supplement at position ${index}: ${el.textContent}`);
      }
      if ((text.includes('routine') || text.includes('create')) && firstRoutine === -1) {
        firstRoutine = index;
        console.log(`✓ Found routine at position ${index}: ${el.textContent}`);
      }
    });
    
    if (firstSupplement !== -1 && firstRoutine !== -1 && firstSupplement < firstRoutine) {
      console.log('✅ PASS: Supplements appear before routine!');
      return true;
    } else {
      console.log('❌ FAIL: Supplements not before routine');
      return false;
    }
  };
}

// Test 3: Pain Intensity Slider
async function testPainSlider() {
  console.log('📋 Test 3: Pain Intensity Slider');
  console.log('Instructions:');
  console.log('1. Go to chat (/)');
  console.log('2. Send: "I want to track my chronic back pain"');
  console.log('3. Click the journey creation button when it appears');
  console.log('4. EXPECTED: Modal shows pain intensity slider (0-10)');
  console.log('5. VERIFY: Slider has gradient from green to red\n');
  
  // Helper to check for slider
  window.checkPainSlider = () => {
    const slider = document.querySelector('input[type="range"]');
    const painText = Array.from(document.querySelectorAll('*')).find(el => 
      el.textContent.includes('Current Pain Intensity')
    );
    
    if (slider && painText) {
      console.log('✅ PASS: Pain intensity slider found!');
      console.log(`   Current value: ${slider.value}`);
      console.log(`   Range: ${slider.min}-${slider.max}`);
      return true;
    } else {
      console.log('❌ FAIL: Pain intensity slider not found');
      return false;
    }
  };
}

// Test 4: Context Sharing
async function testContextSharing() {
  console.log('📋 Test 4: Context Sharing');
  console.log('Instructions:');
  console.log('1. Go to chat (/)');
  console.log('2. Send: "I take magnesium glycinate 400mg and have shoulder pain from desk work"');
  console.log('3. Then send: "Create a routine for my shoulder pain"');
  console.log('4. EXPECTED: Routine should reference magnesium and desk work');
  console.log('5. Click routine creation button');
  console.log('6. VERIFY: Context is passed (check browser network tab)\n');
}

// Test 5: No Generic Routines
async function testNoGeneric() {
  console.log('📋 Test 5: No Generic Routines');
  console.log('Instructions:');
  console.log('1. Go to chat (/)');
  console.log('2. Send: "I have fibromyalgia and need a gentle morning routine"');
  console.log('3. EXPECTED: Response should be specific to fibromyalgia');
  console.log('4. Should NOT see generic terms like "standard routine"');
  console.log('5. Should see condition-specific language\n');
}

// Helper functions
window.assistantTests = {
  // Run all test instructions
  showAll: () => {
    testFunctionCalls();
    testSupplementFirst();
    testPainSlider();
    testContextSharing();
    testNoGeneric();
    console.log('\n✅ Follow the instructions above to test each feature');
    console.log('💡 Use the helper functions like checkSupplementOrder() after getting responses');
  },
  
  // Individual tests
  test1: testFunctionCalls,
  test2: testSupplementFirst,
  test3: testPainSlider,
  test4: testContextSharing,
  test5: testNoGeneric,
  
  // Quick checks
  checkLastResponse: () => {
    const messages = document.querySelectorAll('[class*="message"]');
    const lastMessage = messages[messages.length - 1];
    if (lastMessage) {
      console.log('Last message:', lastMessage.textContent.substring(0, 200) + '...');
      return lastMessage;
    }
    return null;
  },
  
  // Check for actionable items
  checkActionables: () => {
    const actionables = document.querySelectorAll('[class*="actionable"], button[class*="rounded"]');
    console.log(`Found ${actionables.length} actionable items:`);
    actionables.forEach((el, i) => {
      console.log(`${i + 1}. ${el.textContent.trim().substring(0, 50)}...`);
    });
    return actionables;
  }
};

console.log('✅ Test suite loaded!');
console.log('Commands:');
console.log('- assistantTests.showAll() - Show all test instructions');
console.log('- assistantTests.test1() through test5() - Individual tests');
console.log('- checkSupplementOrder(container) - Check supplement order');
console.log('- checkPainSlider() - Check for pain slider');
console.log('- assistantTests.checkActionables() - List all actionable items\n');

// Auto-run if on test page
if (window.location.pathname === '/test-functions') {
  console.log('📍 You are on the test functions page');
  console.log('Click "Setup Test Data" to begin testing');
}