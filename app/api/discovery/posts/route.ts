import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/src/lib/auth';
import { adminDb, FieldValue } from '@/lib/firebase-admin';
import { CreatePostRequest, DiscoveryPost } from '@/src/types/discovery';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreatePostRequest = await request.json();
    const { title, body: content, tags = [], isAnonymous, displayName } = body;

    // Validate input
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    if (!isAnonymous && !displayName) {
      return NextResponse.json(
        { error: 'Display name is required for non-anonymous posts' },
        { status: 400 }
      );
    }

    // If posting with profile, update user's display name
    if (!isAnonymous && displayName) {
      await adminDb.collection('users').doc(userId).set({
        displayName,
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
    }

    // Create the post
    const postId = adminDb.collection('discovery_posts').doc().id;
    const post: Omit<DiscoveryPost, 'id'> = {
      userId,
      userDisplayName: isAnonymous ? 'Anonymous' : displayName!,
      isAnonymous,
      content: {
        title,
        body: content,
        tags,
        mediaUrls: []
      },
      status: 'pending',
      approvalData: {
        approvalProgress: 0,
        approvedBy: 'discovery_assistant'
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        viewCount: 0,
        likeCount: 0,
        commentCount: 0
      },
      visibility: 'public',
      reportCount: 0,
      isDeleted: false
    };

    // Save to Firestore
    await adminDb.collection('discovery_posts').doc(postId).set({
      ...post,
      'metadata.createdAt': FieldValue.serverTimestamp(),
      'metadata.updatedAt': FieldValue.serverTimestamp()
    });

    // Start the approval process in the background
    startApprovalProcess(postId, post);

    return NextResponse.json({
      success: true,
      postId,
      message: 'Your post has been submitted for review'
    });

  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Make auth optional for viewing posts
    let userId: string | null = null;
    try {
      const auth = await getAuth(request);
      userId = auth.userId;
    } catch {
      // Continue without auth - allow public viewing
      userId = null;
    }
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'approved';
    const userPostsOnly = searchParams.get('userPosts') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');
    const startAfter = searchParams.get('startAfter');

    let query = adminDb.collection('discovery_posts')
      .where('isDeleted', '==', false);

    // Filter by status
    if (status !== 'all') {
      query = query.where('status', '==', status);
    }

    // Filter by user if requested
    if (userPostsOnly && userId) {
      query = query.where('userId', '==', userId);
    }

    // Order by creation date
    query = query.orderBy('metadata.createdAt', 'desc');

    // Pagination
    if (startAfter) {
      const startAfterDoc = await adminDb.collection('discovery_posts').doc(startAfter).get();
      if (startAfterDoc.exists) {
        query = query.startAfter(startAfterDoc);
      }
    }

    query = query.limit(limit);

    const snapshot = await query.get();
    
    // Fetch user profile photos for non-anonymous posts
    const userIds = new Set<string>();
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (!data.isAnonymous && data.userId && data.userId !== 'thrive-official') {
        userIds.add(data.userId);
      }
    });

    // Batch fetch user profiles
    const userPhotos = new Map<string, string>();
    if (userIds.size > 0) {
      try {
        const userDocs = await adminDb.collection('users')
          .where('uid', 'in', Array.from(userIds))
          .get();
        
        userDocs.docs.forEach(doc => {
          const userData = doc.data();
          if (userData.photoURL) {
            userPhotos.set(userData.uid, userData.photoURL);
          }
        });
      } catch (error) {
        console.warn('Error fetching user photos:', error);
      }
    }

    const posts = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        userPhotoURL: !data.isAnonymous && userPhotos.has(data.userId) 
          ? userPhotos.get(data.userId) 
          : undefined
      };
    }) as DiscoveryPost[];

    return NextResponse.json({
      posts,
      hasMore: snapshot.docs.length === limit,
      lastPostId: posts[posts.length - 1]?.id
    });

  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

// Helper function to start the approval process
async function startApprovalProcess(postId: string, post: Omit<DiscoveryPost, 'id'>) {
  try {
    // For now, simulate the approval process without OpenAI
    // TODO: Implement proper OpenAI assistant integration when SDK is updated
    
    await adminDb.collection('discovery_posts').doc(postId).update({
      'approvalData.approvalProgress': 10
    });

    // Simulate review progress
    await new Promise(resolve => setTimeout(resolve, 1000));
    await adminDb.collection('discovery_posts').doc(postId).update({
      'approvalData.approvalProgress': 30
    });

    await new Promise(resolve => setTimeout(resolve, 1000));
    await adminDb.collection('discovery_posts').doc(postId).update({
      'approvalData.approvalProgress': 50
    });

    await new Promise(resolve => setTimeout(resolve, 1000));
    await adminDb.collection('discovery_posts').doc(postId).update({
      'approvalData.approvalProgress': 80
    });

    // Final update - auto-approve for now
    await adminDb.collection('discovery_posts').doc(postId).update({
      status: 'approved',
      'approvalData.approvalProgress': 100,
      'approvalData.approvalMessage': 'Content approved',
      'approvalData.approvedAt': FieldValue.serverTimestamp(),
      'metadata.updatedAt': FieldValue.serverTimestamp()
    });

    // Update user stats
    const userRef = adminDb.collection('users').doc(post.userId);
    await userRef.update({
      'discoveryStats.totalPosts': FieldValue.increment(1),
      'discoveryStats.approvedPosts': FieldValue.increment(1),
      'discoveryStats.anonymousPosts': post.isAnonymous 
        ? FieldValue.increment(1) 
        : FieldValue.increment(0)
    });

  } catch (error) {
    console.error('Error in approval process:', error);
    await adminDb.collection('discovery_posts').doc(postId).update({
      'approvalData.approvalProgress': 100,
      'approvalData.approvalMessage': 'Approval process failed, please try again'
    });
  }
}