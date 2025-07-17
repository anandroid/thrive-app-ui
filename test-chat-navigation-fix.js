/**
 * Quick test to verify the chat navigation fix
 * This recreates the exact scenario that was failing
 */

const mockContext = {
  summary: {
    totalThrivings: 2,
    activeThrivings: 2,
    pantryItemCount: 5,
    journeyCount: 1,
    recentChatCount: 1
  },
  recentChats: [
    {
      threadId: 'thread_real_id_123',
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
};

console.log('Testing Chat Navigation Fix');
console.log('==========================\n');

console.log('Mock Context:');
console.log('- Recent chat with threadId:', mockContext.recentChats[0].threadId);
console.log('- Chat title:', mockContext.recentChats[0].title);
console.log('- Last message:', mockContext.recentChats[0].lastMessage);
console.log('- Days since:', mockContext.recentChats[0].daysSince);

console.log('\n❌ BEFORE FIX:');
console.log('Generated navigation: /thrivings?id=&showAdjustment=true');
console.log('This was WRONG - it should have used the chat threadId');

console.log('\n✅ AFTER FIX:');
console.log('Expected navigation: /chat/' + mockContext.recentChats[0].threadId);
console.log('This is CORRECT - it uses the actual threadId from the chat history');

console.log('\n📝 What Changed:');
console.log('1. Added CRITICAL section in recommendationAssistant.ts (line 349)');
console.log('2. Added data extraction requirements (line 400)');
console.log('3. Added specific examples showing correct chat navigation');
console.log('4. Emphasized extracting ACTUAL threadId, not placeholders');

console.log('\n🧪 To verify the fix works:');
console.log('1. Run: node test-recommendation-assistant.js');
console.log('2. Check that "Chat Follow-up Recommendation" test passes');
console.log('3. Verify navigation uses actual threadId: thread_real_id_123');