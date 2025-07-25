import { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function getAuth(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // For development/testing, return demo user if no auth header
      if (process.env.NODE_ENV === 'development') {
        return { userId: 'demo-user-id' };
      }
      return { userId: null };
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify the Firebase ID token
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    return {
      userId: decodedToken.uid,
      phoneNumber: decodedToken.phone_number,
      email: decodedToken.email
    };
  } catch (error) {
    console.error('Error verifying auth token:', error);
    
    // For development, fallback to demo user
    if (process.env.NODE_ENV === 'development') {
      return { userId: 'demo-user-id' };
    }
    
    return { userId: null };
  }
}