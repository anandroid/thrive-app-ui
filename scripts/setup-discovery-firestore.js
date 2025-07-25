#!/usr/bin/env node

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS 
    ? require(process.env.GOOGLE_APPLICATION_CREDENTIALS)
    : null;

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
    });
  } else {
    admin.initializeApp();
  }
}

const db = admin.firestore();

async function setupDiscoveryCollections() {
  console.log('Setting up Discovery collections and indices...');

  try {
    // Create discovery_posts collection with sample structure
    const postsRef = db.collection('discovery_posts');
    
    // Sample post document structure
    const samplePost = {
      id: 'sample_post_id',
      userId: 'user123',
      userDisplayName: 'Anonymous', // or actual name
      isAnonymous: true,
      content: {
        title: 'My Wellness Journey',
        body: 'This is my story about finding balance...',
        tags: ['wellness', 'mindfulness', 'journey'],
        mediaUrls: [] // for future image/video support
      },
      status: 'pending', // pending, approved, rejected
      approvalData: {
        assistantThreadId: null,
        approvalProgress: 0, // 0-100
        approvalMessage: null,
        approvedAt: null,
        approvedBy: 'discovery_assistant'
      },
      metadata: {
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        viewCount: 0,
        likeCount: 0,
        commentCount: 0
      },
      visibility: 'public', // public, private, followers
      reportCount: 0,
      isDeleted: false
    };

    // Create sample document
    await postsRef.doc('sample_post_id').set(samplePost);
    console.log('✓ Created discovery_posts collection with sample document');

    // Create user_profiles updates structure
    const profilesRef = db.collection('users');
    const sampleProfileUpdate = {
      displayName: null, // will be set when user posts with profile
      discoveryStats: {
        totalPosts: 0,
        approvedPosts: 0,
        anonymousPosts: 0
      }
    };

    console.log('✓ User profile structure ready for discovery features');

    // Create discovery_interactions collection for likes, views, etc.
    const interactionsRef = db.collection('discovery_interactions');
    const sampleInteraction = {
      userId: 'user123',
      postId: 'post123',
      type: 'like', // like, view, share
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await interactionsRef.doc('sample_interaction').set(sampleInteraction);
    console.log('✓ Created discovery_interactions collection');

    // Create indices info (these need to be created in Firebase Console or via CLI)
    console.log('\n📋 Required Firestore Indices:');
    console.log('1. discovery_posts:');
    console.log('   - status (ASC) + metadata.createdAt (DESC)');
    console.log('   - userId (ASC) + metadata.createdAt (DESC)');
    console.log('   - isAnonymous (ASC) + status (ASC) + metadata.createdAt (DESC)');
    console.log('\n2. discovery_interactions:');
    console.log('   - userId (ASC) + type (ASC) + createdAt (DESC)');
    console.log('   - postId (ASC) + type (ASC)');

    console.log('\n✅ Firestore setup complete!');
    console.log('Note: You may need to create the indices manually in Firebase Console.');

  } catch (error) {
    console.error('Error setting up Firestore:', error);
    process.exit(1);
  }
}

// Run setup
setupDiscoveryCollections().then(() => {
  console.log('Setup completed successfully');
  process.exit(0);
}).catch(error => {
  console.error('Setup failed:', error);
  process.exit(1);
});