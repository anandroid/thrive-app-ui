'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface PostApprovalModalProps {
  postId: string;
  onClose: () => void;
  onApproved?: () => void;
}

export function PostApprovalModal({ postId, onClose, onApproved }: PostApprovalModalProps) {
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [approvalProgress, setApprovalProgress] = useState(0);
  const [approvalMessage, setApprovalMessage] = useState('');
  const [error, setError] = useState('');
  const [checkInterval, setCheckInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkApprovalStatus = async () => {
      try {
        const response = await fetch(`/api/discovery/posts/${postId}/approval`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to check approval status');
        }

        setApprovalStatus(data.status);
        setApprovalProgress(data.approvalProgress || 0);
        setApprovalMessage(data.approvalMessage || '');

        if (data.status === 'approved') {
          if (checkInterval) {
            clearInterval(checkInterval);
          }
          onApproved?.();
        } else if (data.status === 'rejected') {
          if (checkInterval) {
            clearInterval(checkInterval);
          }
        }
      } catch (error) {
        console.error('Error checking approval status:', error);
        setError(error instanceof Error ? error.message : 'Failed to check status');
      }
    };

    // Initial check
    checkApprovalStatus();

    // Set up interval to check every 2 seconds
    const interval = setInterval(checkApprovalStatus, 2000);
    setCheckInterval(interval);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, onApproved]);

  const getProgressMessage = () => {
    if (approvalProgress < 20) return 'Submitting your post...';
    if (approvalProgress < 40) return 'Reviewing content...';
    if (approvalProgress < 60) return 'Checking wellness guidelines...';
    if (approvalProgress < 80) return 'Finalizing review...';
    if (approvalProgress < 100) return 'Almost done...';
    return 'Review complete!';
  };

  const handleDismiss = () => {
    onClose();
  };

  return (
    <Modal
      isOpen={true}
      onClose={handleDismiss}
      title={
        approvalStatus === 'pending' 
          ? 'Reviewing Your Post' 
          : approvalStatus === 'approved' 
          ? 'Post Approved!' 
          : 'Review Complete'
      }
      size="md"
      closeOnBackdrop={approvalStatus !== 'pending'}
    >
      <div className="space-y-[min(5vw,1.25rem)]">
        {approvalStatus === 'pending' ? (
          <>
            {/* Progress Bar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[min(3.5vw,0.875rem)] text-gray-600">
                <span>{getProgressMessage()}</span>
                <span>{approvalProgress}%</span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-rose to-burgundy transition-all duration-500 ease-out"
                  style={{ width: `${approvalProgress}%` }}
                />
              </div>
            </div>

            {/* Loading Animation */}
            <div className="flex justify-center py-8">
              <Loader2 className="w-12 h-12 text-rose animate-spin" />
            </div>

            {/* Info Message */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-[min(3.5vw,0.875rem)] text-blue-800">
                💡 While we review your post, feel free to explore other stories in the discovery feed!
              </p>
            </div>

            {/* Dismiss Button */}
            <div className="text-center">
              <Button
                variant="ghost"
                onClick={handleDismiss}
                haptic="light"
              >
                Continue Browsing
              </Button>
              <p className="text-[min(3vw,0.75rem)] text-gray-500 mt-2">
                We&apos;ll notify you when the review is complete
              </p>
            </div>
          </>
        ) : approvalStatus === 'approved' ? (
          <>
            {/* Approved State */}
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-[min(5vw,1.25rem)] font-semibold text-gray-900 mb-2">
                Your post has been approved!
              </h3>
              <p className="text-[min(3.75vw,0.9375rem)] text-gray-600">
                {approvalMessage || 'Your story is now live in the discovery feed.'}
              </p>
            </div>

            <Button
              variant="gradient"
              gradient={{ from: 'rose', to: 'burgundy' }}
              onClick={handleDismiss}
              fullWidth
              springAnimation
              gradientOverlay
              cardGlow
              haptic="medium"
            >
              View in Feed
            </Button>
          </>
        ) : (
          <>
            {/* Rejected State */}
            <div className="text-center py-8">
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-[min(5vw,1.25rem)] font-semibold text-gray-900 mb-2">
                Review Complete
              </h3>
              <p className="text-[min(3.75vw,0.9375rem)] text-gray-600 mb-4">
                {approvalMessage || 'Your post needs some adjustments before it can be published.'}
              </p>
            </div>

            <div className="space-y-3">
              <Button
                variant="ghost"
                onClick={handleDismiss}
                fullWidth
              >
                OK, I Understand
              </Button>
            </div>
          </>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-[min(3.5vw,0.875rem)]">
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
}