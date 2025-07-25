import * as admin from 'firebase-admin';
import { getApps, App } from 'firebase-admin/app';

// Initialize Firebase Admin
let adminApp: App;

if (!getApps().length) {
  // Check if we have a service account key in environment
  // In Cloud Run, this might be injected from Secret Manager
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  
  if (serviceAccountKey && serviceAccountKey !== '{}') {
    try {
      const serviceAccount = JSON.parse(serviceAccountKey);
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
    } catch (error) {
      console.error('Failed to parse Firebase service account key:', error);
      // Try individual environment variables
      const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
      
      if (projectId && clientEmail && privateKey) {
        adminApp = admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
          projectId,
        });
      } else if (projectId) {
        // Fallback to just project ID for development
        adminApp = admin.initializeApp({
          projectId,
        });
      } else {
        // Last resort: use application default credentials (for Google Cloud environments)
        adminApp = admin.initializeApp();
      }
    }
  } else {
    // Try individual environment variables first
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
    
    if (projectId && clientEmail && privateKey) {
      adminApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
    } else if (projectId) {
      // Fallback to just project ID for development
      console.warn('Firebase Admin SDK: Running without service account credentials. Some features may not work.');
      adminApp = admin.initializeApp({
        projectId,
      });
    } else {
      // Last resort: use application default credentials (for Google Cloud environments)
      adminApp = admin.initializeApp();
    }
  }
} else {
  adminApp = getApps()[0];
}

// Export Firestore instance
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const adminDb = admin.firestore(adminApp as any);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const adminAuth = admin.auth(adminApp as any);
export const FieldValue = admin.firestore.FieldValue;

// Type exports for convenience
export type DocumentReference = admin.firestore.DocumentReference;
export type CollectionReference = admin.firestore.CollectionReference;
export type Query = admin.firestore.Query;
export type QuerySnapshot = admin.firestore.QuerySnapshot;
export type DocumentSnapshot = admin.firestore.DocumentSnapshot;