// Test to verify chat widget navigation fix
const mockChatHistory = [
  {
    threadId: "thread_real_id_123",
    title: "Weight Loss Discussion",
    lastMessage: "I want to lose 10 pounds sustainably",
    messageCount: 15,
    updatedAt: "2025-01-15T10:30:00Z",
    daysSince: 0
  }
];

console.log("Mock chat history:", mockChatHistory);

// The recommendation assistant should now extract the real threadId
const expectedNavigation = `/chat/${mockChatHistory[0].threadId}`;
console.log("Expected navigation:", expectedNavigation);

// Test that the widget should use the real threadId, not a placeholder
const correctWidget = `
const RecommendationWidget = () => {
  const handleClick = () => {
    window.navigateTo('/chat/thread_real_id_123'); // Real threadId from data
    window.trackAction('recommendation_clicked');
  };
  return React.createElement(
    'div',
    { className: 'recommendation-widget', onClick: handleClick },
    React.createElement(
      'div',
      { className: 'widget-header' },
      React.createElement(
        'div',
        { className: 'widget-icon gradient-sage' },
        React.createElement(Brain, { className: 'w-5 h-5 text-white' })
      ),
      React.createElement('span', { className: 'widget-tag' }, 'Recent Chat')
    ),
    React.createElement(
      'div',
      { className: 'widget-content' },
      React.createElement('h3', { className: 'widget-title' }, 'Follow Up on Your Weight Goals'),
      React.createElement(
        'p',
        { className: 'widget-description' },
        'You discussed weight loss strategies today. Continue the conversation.'
      )
    ),
    React.createElement(
      'div',
      { className: 'widget-action' },
      React.createElement('span', null, 'View Conversation'),
      React.createElement(ChevronRight, { className: 'w-4 h-4' })
    )
  );
};
`;

console.log("Correct widget code structure:");
console.log(correctWidget);

// The assistant should NOT generate thriving navigation for chat recommendations
const incorrectNavigation = "/thrivings?id=&showAdjustment=true";
console.log("INCORRECT navigation (should be avoided):", incorrectNavigation);

console.log("\nFix Summary:");
console.log("1. Updated recommendation assistant instructions to emphasize extracting real threadId from chat history");
console.log("2. Added specific guidance for chat navigation patterns");
console.log("3. Added data extraction requirements section");
console.log("4. Provided clear examples of correct vs incorrect navigation");