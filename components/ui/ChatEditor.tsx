'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Send } from 'lucide-react';

// Inline keyframe style for spinner
const spinnerStyle = `
  @keyframes chatSpinner {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

interface ChatEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (messageOverride?: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  autoFocus?: boolean;
  onFocus?: () => void;
}

export function ChatEditor({
  value,
  onChange,
  onSubmit,
  placeholder = "Ask about your wellness journey...",
  isLoading = false,
  disabled = false,
  className = "",
  autoFocus = false,
  onFocus
}: ChatEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Simple focus tracking for input visibility
  useEffect(() => {
    if (isFocused && containerRef.current) {
      // For WebView: ensure input is visible when keyboard appears
      if (window.visualViewport) {
        // Use visualViewport API for better keyboard handling
        const scrollIntoView = () => {
          containerRef.current?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest',
            inline: 'nearest' 
          });
        };
        
        // Small delay to let keyboard animation start
        setTimeout(scrollIntoView, 100);
        
        // Also listen for viewport changes
        const handleViewportChange = () => scrollIntoView();
        window.visualViewport.addEventListener('resize', handleViewportChange);
        
        return () => {
          window.visualViewport?.removeEventListener('resize', handleViewportChange);
        };
      } else {
        // Fallback for browsers without visualViewport
        setTimeout(() => {
          containerRef.current?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest',
            inline: 'nearest' 
          });
        }, 100);
      }
    }
  }, [isFocused]);

  // Auto-focus when requested
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      // Small delay to ensure component is mounted and visible
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [autoFocus]);

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
    <>
      <style dangerouslySetInnerHTML={{ __html: spinnerStyle }} />
      <div ref={containerRef} className={`chat-input-wrapper ${className} relative`}>
        <div className="px-4 py-3">
          <div className="flex items-start gap-2 bg-gray-50 rounded-2xl p-3 transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-500/20">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                setIsFocused(true);
                onFocus?.();
              }}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              disabled={isLoading || disabled}
              rows={1}
              className="flex-1 resize-none bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none text-base leading-relaxed min-h-[32px] max-h-[64px] transition-all pt-0"
              style={{ overflow: 'hidden' }}
            />
            {/* Send button */}
            <button
              onClick={() => onSubmit()}
              disabled={!value.trim() || isLoading || disabled}
              className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-sky-500 to-sky-600 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed native-transition ios-active shadow-md hover:shadow-lg transition-shadow touch-feedback touch-manipulation"
            >
              {isLoading ? (
                <div 
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  style={{
                    animation: 'chatSpinner 1s linear infinite',
                    transformOrigin: 'center'
                  }}
                />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}