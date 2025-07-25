'use client';

import { BottomNavLayout } from '@/components/layout/BottomNavLayout';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/contexts/AuthContext';
import { DiscoveryPost } from '@/src/types/discovery';
import { Plus, Heart, Eye, Share2, UserCircle } from 'lucide-react';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import { FAB } from '@/components/ui/Button';
import { PhoneAuthModal } from '@/components/auth/PhoneAuthModal';
// import { CreatePostModal } from '@/components/discovery/CreatePostModal'; // Removed - using dedicated page
// import { PostApprovalModal } from '@/components/discovery/PostApprovalModal'; // Removed - using progress bar
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

// Mock posts for demonstration
const mockPosts: DiscoveryPost[] = [
  {
    id: 'thrive-1',
    userId: 'thrive-official',
    userDisplayName: 'Thrive Official',
    isAnonymous: false,
    content: {
      title: 'Welcome to the Thrive Community! 🌱',
      body: `We're so excited to have you join our wellness community! This is a safe space where you can share your journey, celebrate wins (big and small), and support others on their path to better health.\n\nHere are some tips to get started:\n• Share your wellness goals and what brought you here\n• Connect with others who have similar health interests\n• Ask questions - no question is too small\n• Celebrate your progress, no matter how small\n\nRemember, every journey starts with a single step. We're here to support you every step of the way! 💪\n\nWhat wellness goal are you working on today?`,
      tags: ['welcome', 'community', 'wellness', 'motivation'],
      mediaUrls: []
    },
    status: 'approved',
    approvalData: {
      approvalProgress: 100,
      approvedBy: 'discovery_assistant'
    },
    metadata: {
      createdAt: new Date(Date.now() - 3600000),
      updatedAt: new Date(Date.now() - 3600000),
      viewCount: 245,
      likeCount: 89,
      commentCount: 0
    },
    visibility: 'public',
    reportCount: 0,
    isDeleted: false
  },
  {
    id: 'anand-1',
    userId: 'anand-user',
    userDisplayName: 'Anand',
    isAnonymous: false,
    content: {
      title: 'My 30-Day Sleep Transformation Journey',
      body: `For years, I thought 5 hours of sleep was enough. "I'll sleep when I'm dead," right? Wrong. Here's what happened when I committed to 8 hours for 30 days:\n\nWeek 1: Honestly, it was hard. My mind raced at bedtime.\nWeek 2: Started using blue light filters. Game changer!\nWeek 3: Energy levels I haven't felt since college\nWeek 4: My focus at work improved dramatically\n\nThe biggest surprise? My anxiety decreased by what feels like 50%. I had no idea poor sleep was fueling my stress.\n\nMy sleep stack:\n• Magnesium glycinate before bed\n• Phone charging outside bedroom\n• Blackout curtains\n• 65°F room temperature\n\nAnyone else prioritizing sleep? What's worked for you?`,
      tags: ['sleep', 'transformation', 'mental-health', 'productivity'],
      mediaUrls: []
    },
    status: 'approved',
    approvalData: {
      approvalProgress: 100,
      approvedBy: 'discovery_assistant'
    },
    metadata: {
      createdAt: new Date(Date.now() - 7200000),
      updatedAt: new Date(Date.now() - 7200000),
      viewCount: 156,
      likeCount: 45,
      commentCount: 0
    },
    visibility: 'public',
    reportCount: 0,
    isDeleted: false
  },
  {
    id: 'thrive-2',
    userId: 'thrive-official',
    userDisplayName: 'Thrive Official',
    isAnonymous: false,
    content: {
      title: '5 Simple Morning Rituals That Changed My Energy Levels',
      body: `After struggling with afternoon crashes for years, I discovered these 5 morning rituals that completely transformed my energy:\n\n1. 🌅 **Sunlight First Thing** - 10 minutes of morning sun helps regulate circadian rhythm\n2. 💧 **Hydrate Before Coffee** - 16oz of water with lemon kickstarts metabolism\n3. 🧘 **5-Minute Breathwork** - Simple box breathing reduces cortisol\n4. 🥗 **Protein-Rich Breakfast** - Stabilizes blood sugar for hours\n5. 📱 **Phone-Free First Hour** - Protects dopamine for sustained focus\n\nThe best part? This entire routine takes less than 30 minutes!\n\nWhich morning ritual resonates most with you? Have you tried any of these?`,
      tags: ['morning-routine', 'energy', 'wellness-tips', 'productivity'],
      mediaUrls: []
    },
    status: 'approved',
    approvalData: {
      approvalProgress: 100,
      approvedBy: 'discovery_assistant'
    },
    metadata: {
      createdAt: new Date(Date.now() - 10800000),
      updatedAt: new Date(Date.now() - 10800000),
      viewCount: 187,
      likeCount: 67,
      commentCount: 0
    },
    visibility: 'public',
    reportCount: 0,
    isDeleted: false
  },
  {
    id: 'anand-2',
    userId: 'anand-user',
    userDisplayName: 'Anand',
    isAnonymous: false,
    content: {
      title: 'Found My Perfect Stress-Relief Routine (It\'s Not What You Think)',
      body: `After trying everything - meditation apps, yoga, journaling - I finally found what works for me: cooking.\n\nSpecifically, Sunday meal prep has become my meditation. There's something about chopping vegetables, following recipes, and creating nourishing food that completely calms my mind.\n\nMy routine:\n• Put on a podcast or music\n• Prep 5 meals for the week\n• Try one new recipe\n• No phone calls or multitasking\n\nThe bonus? I eat healthier all week and save money. Win-win!\n\nSometimes the best wellness practices are hiding in plain sight. What unexpected activity helps you de-stress?`,
      tags: ['stress-relief', 'meal-prep', 'mindfulness', 'self-care'],
      mediaUrls: []
    },
    status: 'approved',
    approvalData: {
      approvalProgress: 100,
      approvedBy: 'discovery_assistant'
    },
    metadata: {
      createdAt: new Date(Date.now() - 14400000),
      updatedAt: new Date(Date.now() - 14400000),
      viewCount: 98,
      likeCount: 32,
      commentCount: 0
    },
    visibility: 'public',
    reportCount: 0,
    isDeleted: false
  },
  {
    id: 'thrive-3',
    userId: 'thrive-official',
    userDisplayName: 'Thrive Official',
    isAnonymous: false,
    content: {
      title: '🎯 Weekly Challenge: The Gratitude Game',
      body: `Let's play the Gratitude Game this week! Here's how:\n\nEvery day, write down:\n1. One thing you're grateful for (big or small)\n2. One person you appreciate (and why)\n3. One thing about your body you're thankful for\n\nExample from today:\n1. Grateful for my morning tea ritual ☕\n2. Appreciate my neighbor who always smiles and waves 👋\n3. Thankful my legs carried me on a beautiful walk 🚶\n\nStudies show gratitude literally rewires your brain for positivity. Plus, it takes less than 2 minutes!\n\nWho's in? Drop your Day 1 gratitudes below! Let's flood this feed with positivity 💕`,
      tags: ['gratitude', 'challenge', 'mental-health', 'community'],
      mediaUrls: []
    },
    status: 'approved',
    approvalData: {
      approvalProgress: 100,
      approvedBy: 'discovery_assistant'
    },
    metadata: {
      createdAt: new Date(Date.now() - 18000000),
      updatedAt: new Date(Date.now() - 18000000),
      viewCount: 312,
      likeCount: 124,
      commentCount: 0
    },
    visibility: 'public',
    reportCount: 0,
    isDeleted: false
  },
  {
    id: 'anand-3',
    userId: 'anand-user',
    userDisplayName: 'Anand',
    isAnonymous: false,
    content: {
      title: 'Why I Quit Coffee for Matcha (And What Happened)',
      body: `After 10 years of 3-4 cups of coffee daily, I switched to matcha. Here's my honest experience:\n\nThe Good:\n• No more 2pm crashes\n• Steady energy all day\n• Better focus without jitters\n• My sleep improved within a week\n\nThe Challenging:\n• First 3 days were rough (headaches)\n• Miss the coffee ritual\n• More expensive than coffee\n• Takes time to acquire the taste\n\nPro tip: I add a tiny bit of honey and oat milk. Started with 1 cup, now I have 2 throughout the day.\n\nNot saying coffee is bad - it just wasn't working for my body anymore. Anyone else made this switch? How did it go?`,
      tags: ['matcha', 'coffee', 'energy', 'wellness-journey'],
      mediaUrls: []
    },
    status: 'approved',
    approvalData: {
      approvalProgress: 100,
      approvedBy: 'discovery_assistant'
    },
    metadata: {
      createdAt: new Date(Date.now() - 21600000),
      updatedAt: new Date(Date.now() - 21600000),
      viewCount: 203,
      likeCount: 78,
      commentCount: 0
    },
    visibility: 'public',
    reportCount: 0,
    isDeleted: false
  },
  {
    id: 'thrive-4',
    userId: 'thrive-official',
    userDisplayName: 'Thrive Official',
    isAnonymous: false,
    content: {
      title: 'Supplement Basics: What You Actually Need to Know',
      body: `Overwhelmed by the supplement aisle? You're not alone! Here's a simple guide:\n\nThe "Core Four" most people benefit from:\n1. **Vitamin D3** - Especially if you're indoors often\n2. **Magnesium** - Over 300 enzyme reactions need it\n3. **Omega-3s** - Brain and heart health\n4. **Quality Multivitamin** - Fills nutritional gaps\n\nRemember:\n• Supplements support, not replace, a healthy diet\n• Quality matters more than quantity\n• Start with bloodwork to know YOUR needs\n• Introduce one at a time\n\nAlways consult your healthcare provider, especially if you take medications.\n\nWhat supplements have made a real difference for you? Share your experience! 💊`,
      tags: ['supplements', 'nutrition', 'wellness-basics', 'health-tips'],
      mediaUrls: []
    },
    status: 'approved',
    approvalData: {
      approvalProgress: 100,
      approvedBy: 'discovery_assistant'
    },
    metadata: {
      createdAt: new Date(Date.now() - 25200000),
      updatedAt: new Date(Date.now() - 25200000),
      viewCount: 421,
      likeCount: 156,
      commentCount: 0
    },
    visibility: 'public',
    reportCount: 0,
    isDeleted: false
  }
];

export default function DiscoverPage() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.uid;
  const router = useRouter();
  const [posts, setPosts] = useState<DiscoveryPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [lastPostId, setLastPostId] = useState<string | null>(null);
  // const [showCreateModal, setShowCreateModal] = useState(false); // Removed - using dedicated page
  const [pendingPostId, setPendingPostId] = useState<string | null>(null);
  const [approvalProgress, setApprovalProgress] = useState<number | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [showAuthModal, setShowAuthModal] = useState(false);


  const fetchPosts = useCallback(async (startAfter?: string) => {
    try {
      // Try to fetch from API first
      const params = new URLSearchParams({
        status: 'approved',
        limit: '10'
      });
      
      if (startAfter) {
        params.append('startAfter', startAfter);
      }

      const headers: HeadersInit = {};
      if (user) {
        headers['Authorization'] = `Bearer ${await user.getIdToken()}`;
      }
      
      const response = await fetch(`/api/discovery/posts?${params}`, {
        headers
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
      
      const data = await response.json();

      if (data.posts) {
        if (startAfter) {
          setPosts(prev => [...prev, ...data.posts]);
        } else {
          setPosts(data.posts);
        }
        
        setHasMore(data.hasMore || false);
        setLastPostId(data.lastPostId || null);
      } else {
        // Handle case where no posts are returned
        setPosts([]);
        setHasMore(false);
        setLastPostId(null);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      // Fallback to mock data on error
      setPosts(mockPosts);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const checkPostApproval = useCallback(async (postId: string) => {
    if (!user) return;
    
    try {
      const token = await user.getIdToken();
      const checkInterval = setInterval(async () => {
        try {
          const response = await fetch(`/api/discovery/posts/${postId}/approval`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) throw new Error('Failed to check approval status');

          const data = await response.json();
          
          if (data.status === 'approved') {
            clearInterval(checkInterval);
            setApprovalProgress(100);
            setTimeout(() => {
              setApprovalProgress(null);
              setPendingPostId(null);
              localStorage.removeItem('pendingPostId');
              fetchPosts(); // Refresh feed
              toast.success('Your post has been approved and is now live! 🎉');
            }, 1000);
          } else if (data.status === 'rejected') {
            clearInterval(checkInterval);
            setApprovalProgress(null);
            setPendingPostId(null);
            localStorage.removeItem('pendingPostId');
            toast.error(data.feedback || 'Your post was not approved due to community guideline violations.');
          } else if (data.approvalProgress) {
            setApprovalProgress(data.approvalProgress);
          }
        } catch (error) {
          console.error('Error checking approval:', error);
        }
      }, 2000); // Check every 2 seconds

      // Stop checking after 5 minutes
      setTimeout(() => {
        clearInterval(checkInterval);
        if (pendingPostId === postId) {
          setApprovalProgress(null);
          setPendingPostId(null);
          localStorage.removeItem('pendingPostId');
          toast.error('Post approval is taking longer than expected. Please check back later.');
        }
      }, 300000);
    } catch (error) {
      console.error('Error setting up approval check:', error);
    }
  }, [user, pendingPostId, fetchPosts]);

  useEffect(() => {
    // Allow non-authenticated users to view discover page
    // They just won't be able to create posts or like
    if (!authLoading) {
      fetchPosts();
    }
  }, [authLoading, fetchPosts]);

  // Check for pending post on mount and start tracking
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pendingId = localStorage.getItem('pendingPostId');
      if (pendingId) {
        setPendingPostId(pendingId);
        checkPostApproval(pendingId);
      }
    }
  }, [checkPostApproval]);

  const handleLike = async (postId: string) => {
    if (!userId) {
      // Show sign in modal
      setShowAuthModal(true);
      return;
    }

    const isLiked = likedPosts.has(postId);
    
    // Optimistic update
    setLikedPosts(prev => {
      const newSet = new Set(prev);
      if (isLiked) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });

    // Update like count optimistically
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            metadata: { 
              ...post.metadata, 
              likeCount: post.metadata.likeCount + (isLiked ? -1 : 1) 
            }
          }
        : post
    ));

    // TODO: Call API to persist like
  };

  const handleLoadMore = () => {
    if (hasMore && lastPostId) {
      fetchPosts(lastPostId);
    }
  };

  return (
    <BottomNavLayout
      header={{
        title: "Discover",
        showBackButton: false,
        rightElement: !user && !authLoading && (
          <Button
            onClick={() => setShowAuthModal(true)}
            variant="gradient"
            gradient={{ 
              from: 'slate-600', 
              to: 'blue-600',
              direction: 'to-br'
            }}
            size="sm"
            rounded="full"
            shadow="lg"
            springAnimation
            gradientOverlay
            cardGlow
            haptic="medium"
            className="min-w-[min(20vw,5rem)]"
          >
            Sign In
          </Button>
        )
      }}
      className="discover-layout"
    >
      <div className="p-[min(4vw,1rem)] space-y-[min(4vw,1rem)]">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-[min(5vw,1.25rem)] animate-pulse">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : posts && posts.length === 0 ? (
          <div className="min-h-[70vh] flex items-center justify-center px-[min(5vw,1.25rem)]">
            <div className="max-w-[min(90vw,400px)] w-full">
              {/* Animated gradient background */}
              <div className="relative mb-[min(8vw,2rem)]">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-blue-500/20 blur-3xl animate-pulse" />
                <div className="relative bg-gradient-to-br from-purple-50 to-pink-50 rounded-[min(8vw,2rem)] p-[min(10vw,2.5rem)] border border-purple-100/50">
                  {/* Floating elements */}
                  <div className="absolute -top-[min(4vw,1rem)] -left-[min(4vw,1rem)] w-[min(12vw,3rem)] h-[min(12vw,3rem)] bg-gradient-to-br from-purple-400 to-pink-400 rounded-full opacity-20 animate-bounce" />
                  <div className="absolute -bottom-[min(3vw,0.75rem)] -right-[min(3vw,0.75rem)] w-[min(8vw,2rem)] h-[min(8vw,2rem)] bg-gradient-to-br from-blue-400 to-purple-400 rounded-full opacity-20 animate-bounce" style={{ animationDelay: '0.5s' }} />
                  
                  {/* Icon */}
                  <div className="w-[min(20vw,5rem)] h-[min(20vw,5rem)] mx-auto mb-[min(6vw,1.5rem)] relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full animate-pulse opacity-20" />
                    <div className="relative w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                      <UserCircle className="w-[min(12vw,3rem)] h-[min(12vw,3rem)] text-white" strokeWidth={1.5} />
                    </div>
                  </div>
                  
                  {/* Text content */}
                  <h3 className="text-[min(6vw,1.5rem)] font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-[min(2vw,0.5rem)]">
                    Your Community Awaits
                  </h3>
                  <p className="text-[min(4vw,1rem)] text-gray-700 leading-relaxed">
                    {user 
                      ? 'Share your wellness wins, challenges, and insights with others on their journey' 
                      : 'Join a supportive community sharing their wellness journeys'}
                  </p>
                </div>
              </div>
              
              {/* Features list */}
              <div className="space-y-[min(3vw,0.75rem)] mb-[min(8vw,2rem)]">
                <div className="flex items-center gap-[min(3vw,0.75rem)]">
                  <div className="w-[min(10vw,2.5rem)] h-[min(10vw,2.5rem)] rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-md">
                    <Heart className="w-[min(5vw,1.25rem)] h-[min(5vw,1.25rem)] text-white" fill="white" />
                  </div>
                  <p className="text-[min(3.5vw,0.875rem)] text-gray-700">
                    Connect with people who understand your journey
                  </p>
                </div>
                
                <div className="flex items-center gap-[min(3vw,0.75rem)]">
                  <div className="w-[min(10vw,2.5rem)] h-[min(10vw,2.5rem)] rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-md">
                    <Share2 className="w-[min(5vw,1.25rem)] h-[min(5vw,1.25rem)] text-white" />
                  </div>
                  <p className="text-[min(3.5vw,0.875rem)] text-gray-700">
                    Share tips, routines, and breakthroughs
                  </p>
                </div>
                
                <div className="flex items-center gap-[min(3vw,0.75rem)]">
                  <div className="w-[min(10vw,2.5rem)] h-[min(10vw,2.5rem)] rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-md">
                    <Eye className="w-[min(5vw,1.25rem)] h-[min(5vw,1.25rem)] text-white" />
                  </div>
                  <p className="text-[min(3.5vw,0.875rem)] text-gray-700">
                    Get inspired by real wellness stories
                  </p>
                </div>
              </div>
              
              {/* CTA Button */}
              <div className="text-center">
                {user ? (
                  <Button
                    variant="gradient"
                    gradient={{ from: 'purple-500', to: 'pink-500' }}
                    onClick={() => router.push('/discover/create')}
                    springAnimation
                    gradientOverlay
                    cardGlow
                    haptic="medium"
                    size="lg"
                    className="shadow-xl"
                  >
                    <Plus className="w-[min(5vw,1.25rem)] h-[min(5vw,1.25rem)] mr-[min(2vw,0.5rem)]" />
                    Share Your First Story
                  </Button>
                ) : (
                  <Button
                    variant="gradient"
                    gradient={{ from: 'purple-500', to: 'pink-500' }}
                    onClick={() => setShowAuthModal(true)}
                    springAnimation
                    gradientOverlay
                    cardGlow
                    haptic="medium"
                    size="lg"
                    className="shadow-xl"
                  >
                    Sign In to Join Community
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            {posts.map(post => (
              <div key={post.id} className="bg-white rounded-2xl p-[min(5vw,1.25rem)] shadow-sm">
                {/* Author info */}
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-rose to-burgundy rounded-full flex items-center justify-center overflow-hidden">
                    {post.userId === 'thrive-official' ? (
                      <Image 
                        src="/leaf_wireframe.png" 
                        alt="Thrive Official" 
                        width={40} 
                        height={40}
                        className="object-cover"
                      />
                    ) : post.userPhotoURL ? (
                      <Image 
                        src={post.userPhotoURL} 
                        alt={post.userDisplayName} 
                        width={40} 
                        height={40}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <UserCircle className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {post.userDisplayName}
                    </p>
                    <p className="text-[min(3.5vw,0.875rem)] text-gray-500">
                      {formatDistanceToNow(post.metadata.createdAt instanceof Date ? post.metadata.createdAt : new Date(post.metadata.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-[min(4.5vw,1.125rem)] font-semibold text-gray-900 mb-2">
                  {post.content.title}
                </h3>
                <p className="text-[min(3.75vw,0.9375rem)] text-gray-700 mb-4 whitespace-pre-wrap">
                  {post.content.body}
                </p>

                {/* Tags */}
                {post.content.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.content.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-gray-100 text-gray-700 text-[min(3.5vw,0.875rem)] rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center space-x-6 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center space-x-2 transition-colors ${
                      likedPosts.has(post.id) ? 'text-rose-500' : 'text-gray-500'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${likedPosts.has(post.id) ? 'fill-current' : ''}`} />
                    <span className="text-[min(3.5vw,0.875rem)]">{post.metadata.likeCount}</span>
                  </button>

                  <div className="flex items-center space-x-2 text-gray-500">
                    <Eye className="w-5 h-5" />
                    <span className="text-[min(3.5vw,0.875rem)]">{post.metadata.viewCount}</span>
                  </div>

                  <button className="flex items-center space-x-2 text-gray-500">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}

            {/* Load more button */}
            {hasMore && (
              <div className="text-center py-4">
                <Button
                  variant="ghost"
                  onClick={handleLoadMore}
                  haptic="light"
                >
                  Load More
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Progress Bar for Post Approval */}
      {approvalProgress !== null && (
        <div className="fixed top-[min(14vw,3.5rem)] left-0 right-0 bg-white border-b border-gray-200 p-[min(3vw,0.75rem)] z-50" style={{ marginTop: 'env(safe-area-inset-top, 0)' }}>
          <div className="max-w-[min(100vw,800px)] mx-auto">
            <div className="flex items-center justify-between mb-[min(2vw,0.5rem)]">
              <span className="text-[min(3.5vw,0.875rem)] text-gray-700 font-medium">
                Reviewing your post...
              </span>
              <span className="text-[min(3vw,0.75rem)] text-gray-500">
                {approvalProgress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-[min(1.5vw,0.375rem)] overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 ease-out"
                style={{ width: `${approvalProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button - Only show for authenticated users */}
      {user && (
        <FAB
          onClick={() => router.push('/discover/create')}
          haptic="medium"
        >
          <Plus className="w-6 h-6" />
        </FAB>
      )}

      {/* Phone Auth Modal */}
      {showAuthModal && (
        <PhoneAuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
            // Refresh the page to load user data
            window.location.reload();
          }}
        />
      )}
    </BottomNavLayout>
  );
}