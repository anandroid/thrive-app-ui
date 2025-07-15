#!/usr/bin/env node

/**
 * Comprehensive test suite for recommendation assistant
 * Tests various scenarios to ensure correct navigation generation
 */

const OpenAI = require('openai');
const { RECOMMENDATION_ASSISTANT_CONFIG } = require('./src/services/openai/assistant/team/recommendationAssistant');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.THRIVE_OPENAI_API_KEY
});

// Color codes for terminal output
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

// Test scenarios with expected navigation patterns
const testScenarios = [
  {
    name: 'Chat Follow-up Recommendation',
    description: 'Should generate /chat/{threadId} navigation for chat recommendations',
    context: {
      summary: {
        totalThrivings: 2,
        activeThrivings: 2,
        pantryItemCount: 5,
        journeyCount: 1,
        recentChatCount: 1
      },
      recentChats: [
        {
          threadId: 'thread_abc123xyz',
          title: 'Weight Loss Discussion',
          lastMessage: 'I want to lose 10 pounds sustainably',
          messageCount: 15,
          daysSince: 0
        }
      ],
      upcomingSteps: [],
      lowSupplies: [],
      recentJournalEntries: [],
      currentTime: new Date().toISOString(),
      timeOfDay: 'afternoon'
    },
    expectedNavigation: '/chat/thread_abc123xyz',
    expectedNotNavigation: '/thrivings?id=&showAdjustment=true',
    expectedWidgetType: 'action',
    expectedActionText: ['View Conversation', 'Continue Chat', 'Resume Chat']
  },
  {
    name: 'Multiple Chat Threads',
    description: 'Should pick the most recent chat thread',
    context: {
      summary: {
        totalThrivings: 3,
        activeThrivings: 2,
        pantryItemCount: 8,
        journeyCount: 2,
        recentChatCount: 3
      },
      recentChats: [
        {
          threadId: 'thread_latest_456',
          title: 'Sleep Issues Discussion',
          lastMessage: 'I have trouble falling asleep',
          messageCount: 8,
          daysSince: 0
        },
        {
          threadId: 'thread_older_789',
          title: 'Stress Management',
          lastMessage: 'Work has been overwhelming',
          messageCount: 12,
          daysSince: 2
        },
        {
          threadId: 'thread_oldest_101',
          title: 'Diet Questions',
          lastMessage: 'What foods help with energy?',
          messageCount: 5,
          daysSince: 5
        }
      ],
      upcomingSteps: [],
      lowSupplies: [],
      recentJournalEntries: [],
      currentTime: new Date().toISOString(),
      timeOfDay: 'evening'
    },
    expectedNavigation: '/chat/thread_latest_456',
    expectedNotNavigation: '/chat/thread_older_789',
    expectedWidgetType: 'action',
    expectedActionText: ['View Conversation', 'Continue Chat']
  },
  {
    name: 'Thriving Routine Reminder',
    description: 'Should generate /thrivings navigation for routine-based recommendations',
    context: {
      summary: {
        totalThrivings: 3,
        activeThrivings: 3,
        pantryItemCount: 10,
        journeyCount: 0,
        recentChatCount: 0
      },
      upcomingSteps: [
        {
          thrivingId: 'thriving_sleep_123',
          thrivingName: 'Evening Wind-Down',
          step: 'Take magnesium supplement',
          time: '21:00',
          isOverdue: false,
          minutesUntil: 30
        }
      ],
      recentChats: [],
      lowSupplies: [],
      recentJournalEntries: [],
      currentTime: new Date().toISOString(),
      timeOfDay: 'evening'
    },
    expectedNavigation: '/thrivings?id=thriving_sleep_123',
    expectedNotNavigation: '/chat/',
    expectedWidgetType: 'action',
    expectedActionText: ['Start Routine', 'Begin', 'Take']
  },
  {
    name: 'Pantry Restock Recommendation',
    description: 'Should generate pantry navigation for low supplies',
    context: {
      summary: {
        totalThrivings: 2,
        activeThrivings: 2,
        pantryItemCount: 5,
        journeyCount: 1,
        recentChatCount: 0
      },
      lowSupplies: [
        {
          id: 'item_123',
          name: 'Magnesium Glycinate',
          dosage: '400mg',
          timing: 'bedtime',
          dateAdded: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      upcomingSteps: [],
      recentChats: [],
      recentJournalEntries: [],
      currentTime: new Date().toISOString(),
      timeOfDay: 'morning'
    },
    expectedNavigation: '/pantry?action=add&name=Magnesium',
    expectedNotNavigation: '/chat/',
    expectedWidgetType: 'purchase',
    expectedActionText: ['Order Now', 'Restock', 'Add to Pantry']
  },
  {
    name: 'Journal Entry Suggestion',
    description: 'Should generate journal navigation for tracking',
    context: {
      summary: {
        totalThrivings: 2,
        activeThrivings: 2,
        pantryItemCount: 8,
        journeyCount: 1,
        recentChatCount: 0
      },
      recentJournalEntries: [
        {
          journeyType: 'pain',
          journeyTitle: 'Back Pain Tracking',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          content: 'Lower back pain was intense today'
        }
      ],
      upcomingSteps: [],
      lowSupplies: [],
      recentChats: [],
      currentTime: new Date().toISOString(),
      timeOfDay: 'evening'
    },
    expectedNavigation: '/thrivings/',
    expectedNotNavigation: '/chat/',
    expectedWidgetType: 'action',
    expectedActionText: ['Log', 'Track', 'Journal', 'Record']
  },
  {
    name: 'Empty Context - New User',
    description: 'Should suggest starting chat for new users',
    context: {
      summary: {
        totalThrivings: 0,
        activeThrivings: 0,
        pantryItemCount: 0,
        journeyCount: 0,
        recentChatCount: 0
      },
      upcomingSteps: [],
      lowSupplies: [],
      recentJournalEntries: [],
      recentChats: [],
      currentTime: new Date().toISOString(),
      timeOfDay: 'morning'
    },
    expectedNavigation: '/chat/new',
    expectedNotNavigation: '/thrivings',
    expectedWidgetType: 'action',
    expectedActionText: ['Get Started', 'Start', 'Begin', 'Chat']
  },
  {
    name: 'Health Connect Suggestion',
    description: 'Should suggest health data connection',
    context: {
      summary: {
        totalThrivings: 3,
        activeThrivings: 3,
        pantryItemCount: 10,
        journeyCount: 2,
        recentChatCount: 1
      },
      recentJournalEntries: [
        {
          journeyType: 'sleep',
          journeyTitle: 'Sleep Quality Tracking',
          timestamp: new Date().toISOString(),
          content: 'Want to track sleep automatically'
        }
      ],
      upcomingSteps: [],
      lowSupplies: [],
      recentChats: [],
      currentTime: new Date().toISOString(),
      timeOfDay: 'morning'
    },
    expectedNavigation: '/settings/health',
    expectedNotNavigation: '/chat/',
    expectedWidgetType: 'action',
    expectedActionText: ['Connect', 'Enable', 'Sync']
  },
  {
    name: 'Routine Adjustment Needed',
    description: 'Should suggest routine adjustment based on journal feedback',
    context: {
      summary: {
        totalThrivings: 2,
        activeThrivings: 2,
        pantryItemCount: 5,
        journeyCount: 1,
        recentChatCount: 0
      },
      recentJournalEntries: [
        {
          journeyType: 'routine',
          journeyTitle: 'Morning Energy Routine',
          timestamp: new Date().toISOString(),
          content: 'The routine is too long, I cannot complete it before work'
        }
      ],
      upcomingSteps: [],
      lowSupplies: [],
      recentChats: [],
      currentTime: new Date().toISOString(),
      timeOfDay: 'afternoon'
    },
    expectedNavigation: '/thrivings?',
    expectedNotNavigation: '/chat/new',
    expectedWidgetType: 'action',
    expectedActionText: ['Adjust', 'Modify', 'Update', 'Optimize']
  }
];

// Test execution function
async function runTest(scenario) {
  console.log(`\n${colors.cyan}Testing: ${scenario.name}${colors.reset}`);
  console.log(`${colors.bright}Description:${colors.reset} ${scenario.description}`);
  
  try {
    // Prepare the prompt
    const systemPrompt = RECOMMENDATION_ASSISTANT_CONFIG.instructions;
    const userPrompt = `
Given this user context, generate a personalized widget recommendation:

${JSON.stringify(scenario.context, null, 2)}

Additional context from request:
{
  "timeOfDay": "${scenario.context.timeOfDay}",
  "dayOfWeek": "${new Date().toLocaleDateString('en-US', { weekday: 'long' })}"
}

Generate a React component that provides a timely, actionable recommendation.
Focus on what's most relevant RIGHT NOW based on the time of day and user's data.

Remember to follow the response format with componentCode, widgetType, priority, etc.`;

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: RECOMMENDATION_ASSISTANT_CONFIG.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: RECOMMENDATION_ASSISTANT_CONFIG.temperature,
      response_format: { type: 'json_object' }
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error('No response from AI');
    }

    const widgetData = JSON.parse(response);
    
    // Extract navigation from component code
    const navigateMatch = widgetData.componentCode.match(/window\.navigateTo\(['"]([^'"]+)['"]\)/);
    const navigationPath = navigateMatch ? navigateMatch[1] : 'NOT_FOUND';
    
    console.log(`\n${colors.bright}Generated Widget:${colors.reset}`);
    console.log(`- Type: ${widgetData.widgetType}`);
    console.log(`- Priority: ${widgetData.priority}`);
    console.log(`- Navigation: ${colors.yellow}${navigationPath}${colors.reset}`);
    console.log(`- Reasoning: ${widgetData.reasoning}`);
    
    // Run assertions
    let passed = true;
    const results = [];
    
    // Check expected navigation
    if (navigationPath.includes(scenario.expectedNavigation)) {
      results.push(`${colors.green}✓${colors.reset} Correct navigation pattern: ${scenario.expectedNavigation}`);
    } else {
      results.push(`${colors.red}✗${colors.reset} Expected navigation containing: ${scenario.expectedNavigation}, got: ${navigationPath}`);
      passed = false;
    }
    
    // Check NOT expected navigation
    if (scenario.expectedNotNavigation && navigationPath.includes(scenario.expectedNotNavigation)) {
      results.push(`${colors.red}✗${colors.reset} Should NOT contain: ${scenario.expectedNotNavigation}`);
      passed = false;
    } else if (scenario.expectedNotNavigation) {
      results.push(`${colors.green}✓${colors.reset} Correctly avoided: ${scenario.expectedNotNavigation}`);
    }
    
    // Check widget type
    if (widgetData.widgetType === scenario.expectedWidgetType) {
      results.push(`${colors.green}✓${colors.reset} Correct widget type: ${scenario.expectedWidgetType}`);
    } else {
      results.push(`${colors.red}✗${colors.reset} Expected widget type: ${scenario.expectedWidgetType}, got: ${widgetData.widgetType}`);
      passed = false;
    }
    
    // Check action text
    const hasExpectedActionText = scenario.expectedActionText.some(text => 
      widgetData.componentCode.toLowerCase().includes(text.toLowerCase())
    );
    if (hasExpectedActionText) {
      results.push(`${colors.green}✓${colors.reset} Contains expected action text`);
    } else {
      results.push(`${colors.yellow}⚠${colors.reset} Missing expected action text: ${scenario.expectedActionText.join(' or ')}`);
    }
    
    // Print results
    console.log(`\n${colors.bright}Test Results:${colors.reset}`);
    results.forEach(result => console.log(`  ${result}`));
    
    // Show component code snippet
    if (!passed) {
      console.log(`\n${colors.bright}Component Code Snippet:${colors.reset}`);
      const codeSnippet = widgetData.componentCode
        .split('\n')
        .filter(line => line.includes('navigateTo') || line.includes('widget-title') || line.includes('widget-action'))
        .join('\n  ');
      console.log(`  ${colors.magenta}${codeSnippet}${colors.reset}`);
    }
    
    return passed;
    
  } catch (error) {
    console.error(`${colors.red}Error in test:${colors.reset}`, error.message);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log(`${colors.bright}${colors.blue}
╔════════════════════════════════════════════════════════╗
║     Recommendation Assistant Navigation Test Suite      ║
╚════════════════════════════════════════════════════════╝
${colors.reset}`);
  
  console.log(`Running ${testScenarios.length} test scenarios...\n`);
  
  const results = [];
  
  for (const scenario of testScenarios) {
    const passed = await runTest(scenario);
    results.push({ name: scenario.name, passed });
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Print summary
  console.log(`\n${colors.bright}${colors.blue}
╔════════════════════════════════════════════════════════╗
║                    Test Summary                         ║
╚════════════════════════════════════════════════════════╝
${colors.reset}`);
  
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;
  
  results.forEach(result => {
    const icon = result.passed ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
    console.log(`${icon} ${result.name}`);
  });
  
  console.log(`\n${colors.bright}Total:${colors.reset} ${passedCount} passed, ${failedCount} failed`);
  
  if (failedCount > 0) {
    console.log(`\n${colors.red}${colors.bright}Some tests failed! Review the recommendation assistant instructions.${colors.reset}`);
    process.exit(1);
  } else {
    console.log(`\n${colors.green}${colors.bright}All tests passed! The recommendation assistant is generating correct navigation.${colors.reset}`);
    process.exit(0);
  }
}

// Check for API key
if (!process.env.OPENAI_API_KEY && !process.env.THRIVE_OPENAI_API_KEY) {
  console.error(`${colors.red}Error: OpenAI API key not found in environment variables${colors.reset}`);
  console.log('Please set OPENAI_API_KEY or THRIVE_OPENAI_API_KEY');
  process.exit(1);
}

// Run tests
runAllTests().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});