'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { Textarea, Input } from '@/components/ui/form-inputs';
import { UserCircle, EyeOff } from 'lucide-react';
import { CreatePostRequest } from '@/src/types/discovery';
import { useAuth } from '@/src/contexts/AuthContext';
import { LoadingButton } from '@/components/ui/LoadingButton';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (postId: string) => void;
}

export function CreatePostModal({ isOpen, onClose, onPostCreated }: CreatePostModalProps) {
  const { user } = useAuth();
  const userId = user?.uid;
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!userId) {
      setError('You must be logged in to create a post');
      return;
    }

    if (!title.trim() || !body.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    if (!isAnonymous && !displayName.trim()) {
      setError('Please enter your display name');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const postData: CreatePostRequest = {
        title: title.trim(),
        body: body.trim(),
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        isAnonymous,
        displayName: isAnonymous ? undefined : displayName.trim()
      };

      const response = await fetch('/api/discovery/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': user ? `Bearer ${await user.getIdToken()}` : ''
        },
        body: JSON.stringify(postData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create post');
      }

      onPostCreated(data.postId);
    } catch (error) {
      console.error('Error creating post:', error);
      setError(error instanceof Error ? error.message : 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAnonymous = () => {
    if (!isAnonymous) {
      // Switching to anonymous
      setIsAnonymous(true);
      setShowNameInput(false);
      setDisplayName('');
    } else {
      // Switching to profile
      setIsAnonymous(false);
      setShowNameInput(true);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share Your Story"
      size="lg"
    >
      <div className="space-y-[min(5vw,1.25rem)]">
        {/* Anonymous Toggle */}
        <div className="bg-gray-50 rounded-xl p-[min(4vw,1rem)]">
          <button
            onClick={toggleAnonymous}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isAnonymous ? 'bg-gray-300' : 'bg-gradient-to-br from-rose-500 to-burgundy-700'
              }`}>
                {isAnonymous ? <EyeOff className="w-5 h-5 text-gray-600" /> : <UserCircle className="w-5 h-5 text-white" />}
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">
                  {isAnonymous ? 'Post Anonymously' : 'Post with Profile'}
                </p>
                <p className="text-[min(3.5vw,0.875rem)] text-gray-600">
                  {isAnonymous ? 'Your identity will be hidden' : 'Show your name on the post'}
                </p>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full transition-colors ${
              isAnonymous ? 'bg-gray-300' : 'bg-rose-500'
            }`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                isAnonymous ? 'translate-x-0.5' : 'translate-x-6'
              }`} />
            </div>
          </button>
        </div>

        {/* Display Name Input */}
        {showNameInput && (
          <div>
            <Input
              label="Your Display Name"
              placeholder="How would you like to be known?"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mb-2"
            />
            <p className="text-[min(3vw,0.75rem)] text-gray-600">
              This will update your profile name across the app
            </p>
          </div>
        )}

        {/* Title Input */}
        <Input
          label="Title"
          placeholder="Give your story a title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        {/* Body Input */}
        <div>
          <label className="block text-[min(3.5vw,0.875rem)] font-medium text-gray-700 mb-2">
            Your Story
          </label>
          <Textarea
            placeholder="Share your wellness journey, tips, or experiences..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            className="w-full"
            required
          />
        </div>

        {/* Tags Input */}
        <div>
          <Input
            label="Tags (optional)"
            placeholder="wellness, mindfulness, journey (comma-separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
          <p className="text-[min(3vw,0.75rem)] text-gray-600 mt-1">
            Add tags to help others discover your post
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-[min(3.5vw,0.875rem)]">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-2">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <LoadingButton
            onClick={handleSubmit}
            isLoading={isSubmitting}
            className="flex-1"
            variant="gradient"
            gradient={{ from: 'rose', to: 'burgundy' }}
            springAnimation
            gradientOverlay
            cardGlow
            haptic="medium"
            loadingMessages={[
              'Sharing your story...',
              'Reviewing content...',
              'Almost there...'
            ]}
          >
            Share Story
          </LoadingButton>
        </div>
      </div>
    </Modal>
  );
}