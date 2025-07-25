# Fix Firestore 400 Bad Request Error

The authentication is working correctly, but Firestore database access is failing with 400 Bad Request errors. Here's how to fix it:

## Step 1: Enable Firestore in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `thrive-dev-465922`
3. In the left sidebar, click **Firestore Database**
4. If you see "Create Database" button:
   - Click **Create Database**
   - Choose **Start in test mode** (for now)
   - Select your preferred location (e.g., us-central1)
   - Click **Enable**

## Step 2: Check Firestore Security Rules

1. In Firebase Console > Firestore Database > Rules
2. For testing, use these permissive rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all documents for authenticated users
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. Click **Publish** to save the rules

## Step 3: Verify Project Configuration

Check that your `.env.local` has the correct project ID:
```
NEXT_PUBLIC_FIREBASE_PROJECT_ID=thrive-dev-465922
```

## Step 4: Check Firestore in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Go to **Firestore** in the left menu
4. Verify that Firestore is enabled and in the correct mode (Native mode)

## Step 5: Clear Browser Cache

1. Open Chrome DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

## Step 6: Test Firestore Connection

After completing the above steps:
1. Refresh the page
2. Sign in again
3. Check the console - the 400 errors should be gone

## Expected Behavior

Once Firestore is properly set up:
- User data will be stored in the `users` collection
- Discovery posts will be stored in `discovery_posts`
- The app will be able to read/write user preferences

## Still Having Issues?

If you still see 400 errors:
1. Double-check the project ID matches exactly
2. Ensure Firestore is in Native mode (not Datastore mode)
3. Try creating a test document manually in Firebase Console to ensure the database exists
4. Check if there are any API quotas or billing issues in Google Cloud Console

## Note on Security

The permissive rules above are for testing only. For production, use more restrictive rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Discovery posts - authenticated users can read all, write their own
    match /discovery_posts/{postId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
  }
}
```