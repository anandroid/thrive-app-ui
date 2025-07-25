'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, db, isFirebaseConfigured } from '@/src/lib/firebase/config';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface AuthUser extends User {
  displayName: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signOutUser: () => Promise<void>;
  updateDisplayName: (displayName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOutUser: async () => {},
  updateDisplayName: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined' || !auth || !isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        // Get or create user profile in Firestore
        let userData = null;
        if (db) {
          try {
            const userRef = doc(db, 'users', firebaseUser.uid);
            const userDoc = await getDoc(userRef);
            
            if (!userDoc.exists()) {
              // Create new user profile
              const newUserData = {
                uid: firebaseUser.uid,
                displayName: firebaseUser.displayName || 'Anonymous',
                email: firebaseUser.email || null,
                phoneNumber: firebaseUser.phoneNumber || null,
                photoURL: firebaseUser.photoURL || null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              await setDoc(userRef, newUserData);
              userData = newUserData;
            } else {
              userData = userDoc.data();
            }
          } catch (error) {
            console.warn('Error fetching/creating user data:', error);
          }
        }
        
        // Merge Firebase user with Firestore data
        const authUser: AuthUser = {
          ...firebaseUser,
          displayName: userData?.displayName || firebaseUser.displayName,
        };
        
        setUser(authUser);
        
        // Get ID token for API authentication
        const token = await firebaseUser.getIdToken();
        
        // Store token in memory (not localStorage for security)
        if (typeof window !== 'undefined') {
          // You could also store in httpOnly cookie via API call
          sessionStorage.setItem('authToken', token);
        }
      } else {
        // User is signed out
        setUser(null);
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('authToken');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOutUser = async () => {
    if (!auth) {
      toast.error('Authentication not configured');
      return;
    }
    
    try {
      await signOut(auth);
      sessionStorage.removeItem('authToken');
      toast.success('Signed out successfully');
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  const updateDisplayName = async (displayName: string) => {
    if (!user) throw new Error('No user logged in');
    if (!db) {
      toast.error('Database not configured');
      throw new Error('Database not configured');
    }

    try {
      // Update in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        displayName,
        updatedAt: new Date(),
      }, { merge: true });

      // Update local state
      setUser(prev => prev ? { ...prev, displayName } : null);
      
      toast.success('Display name updated');
    } catch (error) {
      console.error('Error updating display name:', error);
      toast.error('Failed to update display name');
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOutUser, updateDisplayName }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// Hook to require authentication
export function useRequireAuth(redirectUrl = '/') {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectUrl);
    }
  }, [user, loading, router, redirectUrl]);

  return { user, loading };
}

// Utility to get auth token for API calls
export async function getAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  
  const token = sessionStorage.getItem('authToken');
  if (!token && auth?.currentUser) {
    // Refresh token if needed
    const newToken = await auth.currentUser.getIdToken();
    sessionStorage.setItem('authToken', newToken);
    return newToken;
  }
  
  return token;
}