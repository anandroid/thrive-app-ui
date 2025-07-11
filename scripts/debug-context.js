#!/usr/bin/env node

/**
 * Debug script to show what context is being sent with each message
 */

require('dotenv').config({ path: '.env.local' });

// Mock the context cache to see what's being stored
const { ContextCache } = {
  ContextCache: class {
    static instance = null;
    threadContexts = new Map();
    
    static getInstance() {
      if (!this.instance) {
        this.instance = new this();
      }
      return this.instance;
    }
    
    addMessage(threadId, message) {
      const messages = this.threadContexts.get(threadId) || [];
      messages.push(message);
      if (messages.length > 10) messages.shift();
      this.threadContexts.set(threadId, messages);
      
      console.log(`\n📝 Message added to cache for thread: ${threadId}`);
      console.log(`   Role: ${message.role}`);
      console.log(`   Content: ${message.content.substring(0, 100)}...`);
      console.log(`   Total messages in cache: ${messages.length}`);
    }
    
    getStructuredContext(threadId) {
      const messages = this.threadContexts.get(threadId) || [];
      if (messages.length === 0) return '';
      
      console.log(`\n🔍 Generating context for thread: ${threadId}`);
      console.log(`   Messages in cache: ${messages.length}`);
      
      let context = 'CONVERSATION CONTEXT:\n';
      messages.forEach((msg, idx) => {
        if (msg.role === 'user') {
          context += `USER SAID: "${msg.content}"\n`;
        } else {
          context += `ASSISTANT RESPONDED: "${msg.content.substring(0, 100)}..."\n`;
        }
      });
      
      console.log(`\n📋 Context being sent to assistant:`);
      console.log('-----------------------------------');
      console.log(context);
      console.log('-----------------------------------\n');
      
      return context;
    }
  }
};

// Simulate the flow
async function simulateContextFlow() {
  const cache = ContextCache.getInstance();
  const threadId = 'thread_6VIle9gnVGqN6f6SwpAnOTOi';
  
  console.log('🚀 Simulating context flow for your thread\n');
  
  // Simulate first message
  cache.addMessage(threadId, {
    role: 'user',
    content: 'I need help with sleep',
    timestamp: new Date()
  });
  
  cache.addMessage(threadId, {
    role: 'assistant',
    content: '{"greeting": "I understand you need help with sleep", "additionalInformation": "Sleep issues can be challenging..."}',
    timestamp: new Date()
  });
  
  // Simulate second message (your "No" message)
  cache.addMessage(threadId, {
    role: 'user',
    content: 'No',
    timestamp: new Date()
  });
  
  // Show what context would be generated
  const context = cache.getStructuredContext(threadId);
  
  console.log('✅ This context is added to the assistant\'s instructions');
  console.log('📌 The OpenAI thread also contains the full message history');
}

simulateContextFlow();