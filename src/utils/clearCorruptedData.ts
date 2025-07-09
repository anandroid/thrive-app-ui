// Utility to clear corrupted chat data when errors occur
export const clearCorruptedChatData = () => {
  console.warn('Clearing corrupted chat data...');
  
  // Clear localStorage chat data
  localStorage.removeItem('thrive_chat_threads');
  localStorage.removeItem('thrive_active_thread');
  
  // Clear any other potentially corrupted keys
  const keysToCheck = Object.keys(localStorage);
  keysToCheck.forEach(key => {
    if (key.includes('chat') || key.includes('thread')) {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          JSON.parse(value);
        }
      } catch {
        console.warn(`Removing corrupted key: ${key}`);
        localStorage.removeItem(key);
      }
    }
  });
  
  // Reload the page to start fresh
  window.location.reload();
};

// Global error handler for JSON parse errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (event.error && event.error.message && event.error.message.includes('is not a function')) {
      console.error('Detected corrupted data error:', event.error);
      // Only clear if it's related to chat functionality
      const stack = event.error.stack || '';
      if (stack.includes('chat') || stack.includes('ChatThread') || stack.includes('_fromJSON')) {
        clearCorruptedChatData();
      }
    }
  });
}