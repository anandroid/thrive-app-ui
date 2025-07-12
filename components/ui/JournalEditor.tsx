'use client';

import React, { useRef, useEffect } from 'react';

interface JournalEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
}

export function JournalEditor({
  value,
  onChange,
  placeholder = "Write your thoughts...",
  className = "",
  rows = 4
}: JournalEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <div className={`relative ${className}`}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 focus:border-rose/30 focus:ring-2 focus:ring-rose/20 focus:outline-none resize-none transition-all text-gray-900 placeholder:text-gray-500"
      />
    </div>
  );
}