import { ChatThread, ChatMessage, ChatHistoryItem } from '@/src/types/chat';

const CHAT_THREADS_KEY = 'thrive_chat_threads';
const ACTIVE_THREAD_KEY = 'thrive_active_thread';

// Get all chat threads
export const getChatThreads = (): ChatThread[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    // Try to get from IndexedDB first (async operation needs to be handled)
    const threads = localStorage.getItem(CHAT_THREADS_KEY);
    return threads ? JSON.parse(threads) : [];
  } catch (error) {
    console.error('Error loading chat threads:', error);
    return [];
  }
};

// Get a specific chat thread
export const getChatThread = (threadId: string): ChatThread | null => {
  const threads = getChatThreads();
  return threads.find(thread => thread.id === threadId) || null;
};

// Create a new chat thread
export const createChatThread = (title?: string): ChatThread => {
  const thread: ChatThread = {
    id: Date.now().toString(),
    title: title || 'New Conversation',
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true
  };
  
  const threads = getChatThreads();
  threads.unshift(thread);
  saveChatThreads(threads);
  
  return thread;
};

// Add a message to a thread (creates thread if it doesn't exist)
export const addMessageToThread = (threadId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage => {
  const threads = getChatThreads();
  let threadIndex = threads.findIndex(t => t.id === threadId);
  
  if (threadIndex === -1) {
    // Create the thread with the API thread ID
    const newThread: ChatThread = {
      id: threadId,
      title: 'New Conversation',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    };
    threads.unshift(newThread);
    threadIndex = 0;
    saveChatThreads(threads);
  }
  
  const newMessage: ChatMessage = {
    ...message,
    id: Date.now().toString(),
    timestamp: new Date().toISOString()
  };
  
  threads[threadIndex].messages.push(newMessage);
  threads[threadIndex].updatedAt = new Date().toISOString();
  
  // Update title if it's the first user message and title is default
  if (message.role === 'user' && threads[threadIndex].messages.filter(m => m.role === 'user').length === 1 && threads[threadIndex].title === 'New Conversation') {
    // Create a title from the first message (truncated)
    const title = message.content.length > 50 
      ? message.content.substring(0, 50) + '...' 
      : message.content;
    threads[threadIndex].title = title;
  }
  
  // Move updated thread to the top
  const updatedThread = threads.splice(threadIndex, 1)[0];
  threads.unshift(updatedThread);
  
  saveChatThreads(threads);
  
  return newMessage;
};

// Update thread title
export const updateThreadTitle = (threadId: string, title: string): void => {
  const threads = getChatThreads();
  const thread = threads.find(t => t.id === threadId);
  
  if (thread) {
    thread.title = title;
    thread.updatedAt = new Date().toISOString();
    saveChatThreads(threads);
  }
};

// Delete a chat thread
export const deleteChatThread = (threadId: string): void => {
  const threads = getChatThreads();
  const filteredThreads = threads.filter(t => t.id !== threadId);
  saveChatThreads(filteredThreads);
};

// Extract preview text from assistant message
const extractAssistantPreview = (content: string): string => {
  try {
    // Try to parse as JSON
    const parsed = JSON.parse(content);
    
    // Extract greeting first if available
    if (parsed.greeting) {
      return parsed.greeting;
    }
    
    // Extract first action item if available
    if (parsed.actionItems && parsed.actionItems.length > 0) {
      const firstItem = parsed.actionItems[0];
      const title = firstItem.title || '';
      const content = firstItem.content || firstItem.description || '';
      return title ? `${title}: ${content}`.substring(0, 150) : content.substring(0, 150);
    }
    
    // Extract additional information if available
    if (parsed.additionalInformation) {
      // Remove HTML tags
      return parsed.additionalInformation.replace(/<[^>]*>/g, '').substring(0, 150);
    }
    
    // Fallback to raw content
    return content.substring(0, 150);
  } catch {
    // If not JSON, check if it starts with common patterns
    if (content.includes('I\'d love to help') || content.includes('I can help')) {
      return content.substring(0, 150);
    }
    
    // Remove any HTML tags and return preview
    return content.replace(/<[^>]*>/g, '').substring(0, 150);
  }
};

// Get chat history items for display
export const getChatHistory = (): ChatHistoryItem[] => {
  const threads = getChatThreads();
  
  return threads.map(thread => {
    const lastMessage = thread.messages[thread.messages.length - 1];
    let lastMessagePreview = 'No messages yet';
    
    if (lastMessage) {
      if (lastMessage.role === 'user') {
        lastMessagePreview = lastMessage.content;
      } else {
        // For assistant messages, extract meaningful preview
        lastMessagePreview = extractAssistantPreview(lastMessage.content);
      }
    }
    
    return {
      id: thread.id,
      threadId: thread.id,
      title: thread.title,
      lastMessage: lastMessagePreview,
      messageCount: thread.messages.length,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt
    };
  });
};

// Set active thread
export const setActiveThread = (threadId: string | null): void => {
  if (typeof window === 'undefined') return;
  
  if (threadId) {
    localStorage.setItem(ACTIVE_THREAD_KEY, threadId);
  } else {
    localStorage.removeItem(ACTIVE_THREAD_KEY);
  }
};

// Get active thread
export const getActiveThread = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_THREAD_KEY);
};

// Clear all chat history
export const clearAllChatHistory = (): void => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(CHAT_THREADS_KEY);
  localStorage.removeItem(ACTIVE_THREAD_KEY);
};

// Save threads to localStorage
const saveChatThreads = (threads: ChatThread[]): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(CHAT_THREADS_KEY, JSON.stringify(threads));
  } catch (error) {
    console.error('Error saving chat threads:', error);
  }
};

// Search through chat history
export const searchChatHistory = (query: string): ChatHistoryItem[] => {
  const threads = getChatThreads();
  const lowerQuery = query.toLowerCase();
  
  return threads
    .filter(thread => {
      // Search in title
      if (thread.title.toLowerCase().includes(lowerQuery)) return true;
      
      // Search in messages
      return thread.messages.some(message => {
        // For user messages, search directly
        if (message.role === 'user') {
          return message.content.toLowerCase().includes(lowerQuery);
        }
        
        // For assistant messages, search in parsed content
        try {
          const parsed = JSON.parse(message.content);
          const searchableText = JSON.stringify(parsed).toLowerCase();
          return searchableText.includes(lowerQuery);
        } catch {
          return message.content.toLowerCase().includes(lowerQuery);
        }
      });
    })
    .map(thread => {
      const lastMessage = thread.messages[thread.messages.length - 1];
      let lastMessagePreview = 'No messages yet';
      
      if (lastMessage) {
        if (lastMessage.role === 'user') {
          lastMessagePreview = lastMessage.content;
        } else {
          // For assistant messages, extract meaningful preview
          lastMessagePreview = extractAssistantPreview(lastMessage.content);
        }
      }
      
      return {
        id: thread.id,
        threadId: thread.id,
        title: thread.title,
        lastMessage: lastMessagePreview,
        messageCount: thread.messages.length,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt
      };
    });
};