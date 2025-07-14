'use client';

import React, { ReactNode, useEffect } from 'react';
import { ModalPortal } from './ModalPortal';
import { TouchCloseButton } from './TouchCloseButton';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md', 
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-[95vw]'
};

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  className = '',
  size = 'md',
  showCloseButton = true,
  closeOnBackdrop = true,
  header,
  footer
}: ModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 z-50 animate-fade-in pointer-events-auto"
          onClick={closeOnBackdrop ? onClose : undefined}
          aria-hidden="true"
        />
        
        {/* Modal Container - Centers the modal */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          {/* Modal Content */}
          <div 
            className={`
              relative w-full ${sizeClasses[size]} 
              bg-white rounded-2xl shadow-2xl 
              animate-scale-in pointer-events-auto
              max-h-[90vh] flex flex-col
              ${className}
            `}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
          >
            {/* Header */}
            {(header || title || showCloseButton) && (
              <div className="relative flex items-center justify-between p-6 border-b border-gray-100">
                {header || (
                  title && (
                    <h2 id="modal-title" className="text-xl font-semibold text-primary-text pr-8">
                      {title}
                    </h2>
                  )
                )}
                
                {showCloseButton && (
                  <div className="absolute top-4 right-4">
                    <TouchCloseButton 
                      onClose={onClose}
                      size="md"
                      className="hover:bg-gray-100"
                    />
                  </div>
                )}
              </div>
            )}
            
            {/* Body - Scrollable */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="p-6">
                {children}
              </div>
            </div>
            
            {/* Footer */}
            {footer && (
              <div className="border-t border-gray-100 p-6">
                {footer}
              </div>
            )}
          </div>
        </div>
      </>
    </ModalPortal>
  );
}