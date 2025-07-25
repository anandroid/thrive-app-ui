export interface DiscoveryPost {
  id: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL?: string;
  isAnonymous: boolean;
  content: {
    title: string;
    body: string;
    tags: string[];
    mediaUrls?: string[];
  };
  status: 'pending' | 'approved' | 'rejected';
  approvalData: {
    assistantThreadId?: string;
    approvalProgress: number;
    approvalMessage?: string;
    approvedAt?: Date;
    approvedBy: string;
  };
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    viewCount: number;
    likeCount: number;
    commentCount: number;
  };
  visibility: 'public' | 'private' | 'followers';
  reportCount: number;
  isDeleted: boolean;
}

export interface CreatePostRequest {
  title: string;
  body: string;
  tags?: string[];
  isAnonymous: boolean;
  displayName?: string; // Required if not anonymous
}

export interface PostApprovalResponse {
  decision: 'approved' | 'rejected';
  reason: string;
  tags?: string[];
  contentWarning?: string;
  suggestion?: string;
}

export interface DiscoveryInteraction {
  id: string;
  userId: string;
  postId: string;
  type: 'like' | 'view' | 'share';
  createdAt: Date;
}