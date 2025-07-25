import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/src/lib/auth';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { userId } = await getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId } = await params;

    const postDoc = await adminDb.collection('discovery_posts').doc(postId).get();
    
    if (!postDoc.exists) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const post = postDoc.data();

    // Only allow the post creator or admins to view approval status
    if (!post || post.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      status: post.status,
      approvalProgress: post.approvalData?.approvalProgress || 0,
      feedback: post.status === 'rejected' ? post.approvalData?.approvalMessage : undefined,
      suggestions: post.status === 'rejected' ? post.approvalData?.suggestions : undefined
    });

  } catch (error) {
    console.error('Error fetching approval status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch approval status' },
      { status: 500 }
    );
  }
}