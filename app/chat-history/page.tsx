'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageSquare, Search, Clock, Trash2, Plus } from 'lucide-react';
import { ActionBar } from '@/components/ui/ActionBar';
import { getChatHistory, deleteChatThread, searchChatHistory } from '@/src/utils/chatStorage';
import { ChatHistoryItem } from '@/src/types/chat';

export default function ChatHistoryPage() {
  const router = useRouter();
  // Initialize with data from localStorage to prevent empty state flash
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>(() => {
    if (typeof window !== 'undefined') {
      return getChatHistory();
    }
    return [];
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading] = useState(false);

  const loadChatHistory = () => {
    const history = getChatHistory();
    setChatHistory(history);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = searchChatHistory(query);
      setChatHistory(results);
    } else {
      loadChatHistory();
    }
  };

  const handleDeleteChat = (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this conversation?')) {
      deleteChatThread(threadId);
      loadChatHistory();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const truncateMessage = (message: string, maxLength: number = 80) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  return (
    <div className="app-screen bg-gray-50">
      {/* Header */}
      <ActionBar
        title={
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-sage-dark" />
            <span>Chat History</span>
          </div>
        }
        showBackButton={true}
        backHref="/settings"
      />

      {/* Search Bar */}
      <div className="px-4 py-4 bg-white border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-sage focus:ring-2 focus:ring-sage/20 transition-all"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full border-3 border-sage border-t-transparent animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Loading conversations...</p>
            </div>
          </div>
        ) : chatHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sage-light/30 to-sage/20 flex items-center justify-center mb-4">
              <MessageSquare className="w-10 h-10 text-sage-dark" />
            </div>
            <h2 className="text-xl font-semibold text-primary-text mb-2">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </h2>
            <p className="text-secondary-text-thin text-center max-w-xs mb-6">
              {searchQuery 
                ? 'Try searching with different keywords' 
                : 'Start a new conversation to see it here'}
            </p>
            <Link
              href="/chat/new"
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-sage to-sage-dark text-white font-medium shadow-lg hover:shadow-xl transition-all flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Start New Chat</span>
            </Link>
          </div>
        ) : (
          <div className="px-4 py-4 space-y-3">
            {chatHistory.map((chat) => (
              <button
                key={chat.id}
                onClick={() => router.push(`/chat/${chat.threadId}`)}
                className="w-full rounded-2xl bg-white border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all text-left group"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-primary-text flex-1 pr-2">
                    {chat.title}
                  </h3>
                  <button
                    onClick={(e) => handleDeleteChat(chat.threadId, e)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 transition-all touch-feedback touch-manipulation"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
                
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {truncateMessage(chat.lastMessage)}
                </p>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center">
                      <MessageSquare className="w-3 h-3 mr-1" />
                      {chat.messageCount} messages
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDate(chat.updatedAt)}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      {chatHistory.length > 0 && (
        <Link
          href="/chat/new"
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-sage to-sage-dark shadow-lg hover:shadow-xl transition-all flex items-center justify-center group touch-feedback touch-manipulation"
        >
          <Plus className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-300" />
        </Link>
      )}
    </div>
  );
}