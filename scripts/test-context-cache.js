#!/usr/bin/env node

/**
 * Unit test for context cache and sliding window
 */

const { ContextCache } = require('../src/services/openai/context/contextCache');
const { SlidingWindowManager } = require('../src/services/openai/context/slidingWindowManager');

console.log('🧪 Testing Context Cache and Sliding Window\n');

// Test Context Cache
console.log('1️⃣ Testing Context Cache:');
const cache = ContextCache.getInstance();
const threadId = 'test-thread-123';

// Add messages
const testMessages = [
  { role: 'user', content: 'Message 1', timestamp: new Date() },
  { role: 'assistant', content: 'Response 1', timestamp: new Date(), assistantRole: 'chat' },
  { role: 'user', content: 'Message 2', timestamp: new Date() },
  { role: 'assistant', content: 'Response 2', timestamp: new Date(), assistantRole: 'chat' },
  { role: 'user', content: 'Message 3', timestamp: new Date() },
  { role: 'assistant', content: 'Response 3', timestamp: new Date(), assistantRole: 'routine' },
  { role: 'user', content: 'Message 4', timestamp: new Date() },
  { role: 'assistant', content: 'Response 4', timestamp: new Date(), assistantRole: 'pantry' },
  { role: 'user', content: 'Message 5', timestamp: new Date() },
  { role: 'assistant', content: 'Response 5', timestamp: new Date(), assistantRole: 'pantry' },
  { role: 'user', content: 'Message 6', timestamp: new Date() },
  { role: 'assistant', content: 'Response 6', timestamp: new Date(), assistantRole: 'chat' },
];

// Add all messages
testMessages.forEach(msg => {
  cache.addMessage(threadId, msg);
});

// Get context
const contextMessages = cache.getThreadContext(threadId);
console.log(`✅ Added ${testMessages.length} messages, cache contains: ${contextMessages.length} messages`);
console.log(`   (Should be limited to 10 messages)`);

// Get context summary
const summary = cache.getContextSummary(threadId);
console.log('\n📝 Context Summary:');
console.log(summary);

// Test Sliding Window Manager
console.log('\n\n2️⃣ Testing Sliding Window Manager:');
const slidingWindow = new SlidingWindowManager({ maxMessages: 5 });

// Create a longer conversation
const longConversation = [];
for (let i = 1; i <= 15; i++) {
  longConversation.push({
    role: i % 2 === 1 ? 'user' : 'assistant',
    content: `Message ${i}: This is a test message about health topic ${i}`,
    timestamp: new Date()
  });
}

console.log(`📊 Full conversation: ${longConversation.length} messages`);

// Get sliding window
const windowedMessages = slidingWindow.getContextWindow(longConversation);
console.log(`✅ Sliding window: ${windowedMessages.length} messages`);
console.log('   Messages in window:');
windowedMessages.forEach((msg, idx) => {
  console.log(`   ${idx + 1}. ${msg.role}: ${msg.content.substring(0, 40)}...`);
});

// Test context summary generation
const contextSummary = slidingWindow.getContextSummary(longConversation);
console.log('\n📝 Generated Context Summary:');
console.log(contextSummary);

// Test edge cases
console.log('\n\n3️⃣ Testing Edge Cases:');

// Empty thread
const emptyContext = cache.getThreadContext('non-existent-thread');
console.log(`✅ Empty thread returns: ${emptyContext.length} messages`);

// Clear thread
cache.clearThread(threadId);
const clearedContext = cache.getThreadContext(threadId);
console.log(`✅ Cleared thread returns: ${clearedContext.length} messages`);

console.log('\n🎉 All tests completed!');