'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import Button from '@/components/ui/Button';
import { useAuth, useRequireAuth } from '@/src/contexts/AuthContext';
import toast from 'react-hot-toast';
import { Hash } from 'lucide-react';

export default function CreatePostPage() {
  const router = useRouter();
  const { user } = useAuth();
  useRequireAuth('/discover'); // Redirect to discover if not authenticated
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const handleSubmit = async () => {
    if (!user) return;

    if (!title.trim() || !content.trim()) {
      toast.error('Please add both a title and content for your post');
      return;
    }

    if (title.length < 5) {
      toast.error('Title should be at least 5 characters');
      return;
    }

    if (content.length < 20) {
      toast.error('Content should be at least 20 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      const postData = {
        title: title.trim(),
        body: content.trim(),
        tags: tags
          .split(',')
          .map(tag => tag.trim().toLowerCase())
          .filter(tag => tag.length > 0),
        isAnonymous
      };

      const response = await fetch('/api/discovery/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user!.getIdToken()}`
        },
        body: JSON.stringify(postData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create post');
      }

      const { postId } = await response.json();
      
      // Store the pending post ID for tracking
      if (typeof window !== 'undefined') {
        localStorage.setItem('pendingPostId', postId);
      }

      // Navigate back to discover page
      router.push('/discover');
      
      // Show toast after navigation
      setTimeout(() => {
        toast.success('Your post is being reviewed...', {
          duration: 4000,
        });
      }, 100);

    } catch (error) {
      console.error('Error creating post:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout
      header={{
        title: "Share Your Story",
        showBackButton: true,
        backHref: "/discover",
        rightElement: (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !title.trim() || !content.trim()}
            variant="gradient"
            gradient={{ 
              from: 'purple-500', 
              to: 'pink-500',
              activeFrom: 'purple-600',
              activeTo: 'pink-600'
            }}
            size="sm"
            springAnimation
            gradientOverlay
            cardGlow
            haptic="medium"
            className="min-w-[min(20vw,5rem)]"
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </Button>
        )
      }}
    >
      <div className="p-[min(5vw,1.25rem)] max-w-[min(100vw,800px)] mx-auto">
        {/* Title Input */}
        <div className="mb-[min(6vw,1.5rem)]">
          <input
            type="text"
            placeholder="Give your post a title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-[min(5vw,1.25rem)] font-semibold placeholder-gray-400 border-none outline-none focus:outline-none"
            style={{ fontSize: 'min(6vw,1.5rem)' }}
            maxLength={100}
          />
          <div className="text-[min(3vw,0.75rem)] text-gray-500 mt-[min(1vw,0.25rem)]">
            {title.length}/100 characters
          </div>
        </div>

        {/* Content Textarea */}
        <div className="mb-[min(6vw,1.5rem)]">
          <textarea
            placeholder="Share your wellness journey, tips, or questions with the community..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full min-h-[40vh] p-0 border-none outline-none focus:outline-none resize-none text-[min(4vw,1rem)] leading-relaxed placeholder-gray-400"
            style={{ fontSize: 'min(4vw,1rem)' }}
          />
          <div className="text-[min(3vw,0.75rem)] text-gray-500 mt-[min(2vw,0.5rem)]">
            {content.length} characters
          </div>
        </div>

        {/* Tags Input */}
        <div className="mb-[min(6vw,1.5rem)]">
          <div className="flex items-center mb-[min(2vw,0.5rem)]">
            <Hash className="w-[min(4vw,1rem)] h-[min(4vw,1rem)] text-gray-400 mr-[min(2vw,0.5rem)]" />
            <span className="text-[min(3.5vw,0.875rem)] text-gray-600">Add tags (optional)</span>
          </div>
          <input
            type="text"
            placeholder="wellness, sleep, nutrition (comma separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full p-[min(3vw,0.75rem)] border border-gray-200 rounded-xl text-[min(3.5vw,0.875rem)] focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Anonymous Toggle */}
        <div className="mb-[min(8vw,2rem)] bg-gray-50 rounded-xl p-[min(4vw,1rem)]">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-[min(4vw,1rem)] font-medium text-gray-900">Post Anonymously</p>
              <p className="text-[min(3.5vw,0.875rem)] text-gray-600 mt-[min(1vw,0.25rem)]">
                Your name won&apos;t be shown, perfect for sensitive topics
              </p>
            </div>
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="sr-only"
            />
            <div className={`relative w-[min(12vw,3rem)] h-[min(7vw,1.75rem)] rounded-full transition-colors ${
              isAnonymous ? 'bg-purple-500' : 'bg-gray-300'
            }`}>
              <div className={`absolute top-[min(1vw,0.25rem)] w-[min(5vw,1.25rem)] h-[min(5vw,1.25rem)] bg-white rounded-full shadow-md transition-transform ${
                isAnonymous ? 'translate-x-[min(6vw,1.5rem)]' : 'translate-x-[min(1vw,0.25rem)]'
              }`} />
            </div>
          </label>
        </div>

        {/* Guidelines */}
        <div className="bg-purple-50 rounded-xl p-[min(4vw,1rem)] border border-purple-100">
          <h3 className="text-[min(4vw,1rem)] font-semibold text-purple-900 mb-[min(2vw,0.5rem)]">
            Community Guidelines
          </h3>
          <ul className="space-y-[min(1.5vw,0.375rem)] text-[min(3.5vw,0.875rem)] text-purple-700">
            <li>• Be respectful and supportive of others</li>
            <li>• Share your genuine experiences and insights</li>
            <li>• No medical advice - share what works for you</li>
            <li>• Keep it positive and constructive</li>
          </ul>
        </div>
      </div>
    </AppLayout>
  );
}