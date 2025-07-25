import { POST, GET } from '@/app/api/discovery/posts/route';
import { NextRequest } from 'next/server';
import { getAuth } from '@/src/lib/auth';
import { adminDb } from '@/lib/firebase-admin';

// Mock dependencies
jest.mock('@/src/lib/auth');
jest.mock('@/lib/firebase-admin');
jest.mock('openai');

const mockGetAuth = getAuth as jest.MockedFunction<typeof getAuth>;
const mockCollection = jest.fn();
const mockDoc = jest.fn();
const mockSet = jest.fn();
const mockGet = jest.fn();
const mockWhere = jest.fn();
const mockOrderBy = jest.fn();
const mockLimit = jest.fn();
const mockStartAfter = jest.fn();

// Setup mocks
beforeEach(() => {
  jest.clearAllMocks();
  
  // Mock Firestore chain
  (adminDb.collection as jest.Mock) = mockCollection;
  mockCollection.mockReturnValue({
    doc: mockDoc,
    where: mockWhere,
    orderBy: mockOrderBy,
    limit: mockLimit,
    startAfter: mockStartAfter,
    get: mockGet
  });
  
  mockDoc.mockReturnValue({
    id: 'test-post-id',
    set: mockSet,
    get: mockGet,
    update: jest.fn()
  });

  mockWhere.mockReturnThis();
  mockOrderBy.mockReturnThis();
  mockLimit.mockReturnThis();
  mockStartAfter.mockReturnThis();
});

describe('POST /api/discovery/posts', () => {
  it('should create a post successfully when authenticated', async () => {
    mockGetAuth.mockResolvedValue({ userId: 'test-user-id' } as any);
    mockSet.mockResolvedValue({});

    const request = new NextRequest('http://localhost:3000/api/discovery/posts', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Post',
        body: 'This is a test post content',
        tags: ['wellness', 'test'],
        isAnonymous: true
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.postId).toBe('test-post-id');
    expect(data.message).toBe('Your post has been submitted for review');
    expect(mockSet).toHaveBeenCalled();
  });

  it('should return 401 when not authenticated', async () => {
    mockGetAuth.mockResolvedValue({ userId: null } as any);

    const request = new NextRequest('http://localhost:3000/api/discovery/posts', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Post',
        body: 'Content'
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 when title or body is missing', async () => {
    mockGetAuth.mockResolvedValue({ userId: 'test-user-id' } as any);

    const request = new NextRequest('http://localhost:3000/api/discovery/posts', {
      method: 'POST',
      body: JSON.stringify({
        title: '',
        body: 'Content',
        isAnonymous: true
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Title and content are required');
  });

  it('should require display name for non-anonymous posts', async () => {
    mockGetAuth.mockResolvedValue({ userId: 'test-user-id' } as any);

    const request = new NextRequest('http://localhost:3000/api/discovery/posts', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Post',
        body: 'Content',
        isAnonymous: false,
        displayName: ''
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Display name is required for non-anonymous posts');
  });

  it('should update user profile when posting with display name', async () => {
    mockGetAuth.mockResolvedValue({ userId: 'test-user-id' } as any);
    mockSet.mockResolvedValue({});

    const request = new NextRequest('http://localhost:3000/api/discovery/posts', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Post',
        body: 'Content',
        isAnonymous: false,
        displayName: 'John Doe'
      })
    });

    const response = await POST(request);
    
    expect(response.status).toBe(200);
    expect(mockCollection).toHaveBeenCalledWith('users');
    expect(mockDoc).toHaveBeenCalledWith('test-user-id');
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ displayName: 'John Doe' }),
      { merge: true }
    );
  });
});

describe('GET /api/discovery/posts', () => {
  it('should fetch approved posts by default', async () => {
    mockGetAuth.mockResolvedValue({ userId: 'test-user-id' } as any);
    mockGet.mockResolvedValue({
      docs: [
        {
          id: 'post1',
          data: () => ({
            title: 'Post 1',
            status: 'approved'
          })
        }
      ]
    });

    const request = new NextRequest('http://localhost:3000/api/discovery/posts');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockWhere).toHaveBeenCalledWith('isDeleted', '==', false);
    expect(mockWhere).toHaveBeenCalledWith('status', '==', 'approved');
    expect(mockOrderBy).toHaveBeenCalledWith('metadata.createdAt', 'desc');
    expect(data.posts).toHaveLength(1);
  });

  it('should filter by user posts when requested', async () => {
    mockGetAuth.mockResolvedValue({ userId: 'test-user-id' } as any);
    mockGet.mockResolvedValue({ docs: [] });

    const request = new NextRequest('http://localhost:3000/api/discovery/posts?userPosts=true');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockWhere).toHaveBeenCalledWith('userId', '==', 'test-user-id');
  });

  it('should handle pagination with startAfter', async () => {
    mockGetAuth.mockResolvedValue({ userId: 'test-user-id' } as any);
    mockGet.mockResolvedValue({ 
      docs: [],
      exists: true 
    });

    const request = new NextRequest('http://localhost:3000/api/discovery/posts?startAfter=last-post-id');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockDoc).toHaveBeenCalledWith('last-post-id');
    expect(mockStartAfter).toHaveBeenCalled();
  });

  it('should respect limit parameter', async () => {
    mockGetAuth.mockResolvedValue({ userId: 'test-user-id' } as any);
    mockGet.mockResolvedValue({ docs: [] });

    const request = new NextRequest('http://localhost:3000/api/discovery/posts?limit=5');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockLimit).toHaveBeenCalledWith(5);
  });
});