import { GET } from '@/app/api/discovery/posts/[postId]/approval/route';
import { NextRequest } from 'next/server';
import { getAuth } from '@/src/lib/auth';
import { adminDb } from '@/lib/firebase-admin';

// Mock dependencies
jest.mock('@/src/lib/auth');
jest.mock('@/lib/firebase-admin');

const mockGetAuth = getAuth as jest.MockedFunction<typeof getAuth>;
const mockCollection = jest.fn();
const mockDoc = jest.fn();
const mockGet = jest.fn();

// Setup mocks
beforeEach(() => {
  jest.clearAllMocks();
  
  (adminDb.collection as jest.Mock) = mockCollection;
  mockCollection.mockReturnValue({
    doc: mockDoc
  });
  
  mockDoc.mockReturnValue({
    get: mockGet
  });
});

describe('GET /api/discovery/posts/[postId]/approval', () => {
  const params = { postId: 'test-post-id' };

  it('should return approval status for post owner', async () => {
    mockGetAuth.mockResolvedValue({ userId: 'test-user-id' } as any);
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        userId: 'test-user-id',
        status: 'pending',
        approvalData: {
          approvalProgress: 50,
          approvalMessage: 'Reviewing content...'
        }
      })
    });

    const request = new NextRequest('http://localhost:3000/api/discovery/posts/test-post-id/approval');
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('pending');
    expect(data.approvalProgress).toBe(50);
    expect(data.approvalMessage).toBe('Reviewing content...');
  });

  it('should return 401 when not authenticated', async () => {
    mockGetAuth.mockResolvedValue({ userId: null } as any);

    const request = new NextRequest('http://localhost:3000/api/discovery/posts/test-post-id/approval');
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 404 when post not found', async () => {
    mockGetAuth.mockResolvedValue({ userId: 'test-user-id' } as any);
    mockGet.mockResolvedValue({
      exists: false
    });

    const request = new NextRequest('http://localhost:3000/api/discovery/posts/test-post-id/approval');
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Post not found');
  });

  it('should return 403 when user is not the post owner', async () => {
    mockGetAuth.mockResolvedValue({ userId: 'different-user-id' } as any);
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        userId: 'test-user-id',
        status: 'pending'
      })
    });

    const request = new NextRequest('http://localhost:3000/api/discovery/posts/test-post-id/approval');
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Forbidden');
  });

  it('should handle approved posts correctly', async () => {
    mockGetAuth.mockResolvedValue({ userId: 'test-user-id' } as any);
    const approvedAt = new Date();
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        userId: 'test-user-id',
        status: 'approved',
        approvalData: {
          approvalProgress: 100,
          approvalMessage: 'Great content for the community!',
          approvedAt
        }
      })
    });

    const request = new NextRequest('http://localhost:3000/api/discovery/posts/test-post-id/approval');
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('approved');
    expect(data.approvalProgress).toBe(100);
    expect(data.approvalMessage).toBe('Great content for the community!');
    expect(data.approvedAt).toBe(approvedAt);
  });

  it('should handle missing approval data gracefully', async () => {
    mockGetAuth.mockResolvedValue({ userId: 'test-user-id' } as any);
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        userId: 'test-user-id',
        status: 'pending'
        // No approvalData field
      })
    });

    const request = new NextRequest('http://localhost:3000/api/discovery/posts/test-post-id/approval');
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('pending');
    expect(data.approvalProgress).toBe(0);
    expect(data.approvalMessage).toBeUndefined();
  });
});