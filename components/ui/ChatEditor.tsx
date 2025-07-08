'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Send } from 'lucide-react';

interface ChatEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function ChatEditor({
  value,
  onChange,
  onSubmit,
  placeholder = "Ask about your wellness journey...",
  isLoading = false,
  disabled = false,
  className = ""
}: ChatEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Auto-resize textarea based on content and focus state
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      
      if (isFocused || value.trim()) {
        // When focused or has content, allow natural height up to 2 lines
        const scrollHeight = textareaRef.current.scrollHeight;
        textareaRef.current.style.height = `${Math.min(scrollHeight, 64)}px`;
      } else {
        // When not focused and empty, stay single line
        textareaRef.current.style.height = '32px';
      }
    }
  }, [value, isFocused]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter, but allow Shift+Enter for new lines
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isLoading && !disabled) {
        onSubmit();
      }
    }
  };

  return (
    <div className={`border-t border-gray-100 bg-white safe-area-bottom ${className}`}>
      <div className="px-4 pb-4 pt-2">
        <div className="flex items-start gap-3 bg-gray-50 rounded-2xl p-3 transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-rose/20">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={isLoading || disabled}
            rows={1}
            className="flex-1 resize-none bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none text-base leading-relaxed min-h-[32px] max-h-[64px] transition-all pt-0"
            style={{ overflow: 'hidden' }}
          />
          <button
            onClick={onSubmit}
            disabled={!value.trim() || isLoading || disabled}
            className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-rose to-burgundy text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed native-transition ios-active shadow-md hover:shadow-lg transition-shadow"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}