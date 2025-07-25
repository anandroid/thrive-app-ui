const admin = require('firebase-admin');
const serviceAccount = require('../thrive-465618-firebase-adminsdk-fbsvc-57bc407cdc.json');

// Initialize with the service account directly
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const db = admin.firestore();

// Helper to create timestamp
const now = new Date();

// Posts data
const posts = [
  // Thrive Official posts
  {
    postId: 'thrive-1',
    userId: 'thrive-official',
    userDisplayName: 'Thrive Official',
    title: 'Welcome to the Thrive Community! 🌱',
    body: `We're so excited to have you join our wellness community! This is a safe space where you can share your journey, celebrate wins (big and small), and support others on their path to better health.

Here are some tips to get started:
• Share your wellness goals and what brought you here
• Connect with others who have similar health interests
• Ask questions - no question is too small
• Celebrate your progress, no matter how small

Remember, every journey starts with a single step. We're here to support you every step of the way! 💪

What wellness goal are you working on today?`,
    tags: ['welcome', 'community', 'wellness', 'motivation'],
    viewCount: 245,
    likeCount: 89
  },
  {
    postId: 'thrive-2',
    userId: 'thrive-official',
    userDisplayName: 'Thrive Official',
    title: '5 Simple Morning Rituals That Changed My Energy Levels',
    body: `After struggling with afternoon crashes for years, I discovered these 5 morning rituals that completely transformed my energy:

1. 🌅 **Sunlight First Thing** - 10 minutes of morning sun helps regulate circadian rhythm
2. 💧 **Hydrate Before Coffee** - 16oz of water with lemon kickstarts metabolism
3. 🧘 **5-Minute Breathwork** - Simple box breathing reduces cortisol
4. 🥗 **Protein-Rich Breakfast** - Stabilizes blood sugar for hours
5. 📱 **Phone-Free First Hour** - Protects dopamine for sustained focus

The best part? This entire routine takes less than 30 minutes!

Which morning ritual resonates most with you? Have you tried any of these?`,
    tags: ['morning-routine', 'energy', 'wellness-tips', 'productivity'],
    viewCount: 187,
    likeCount: 67
  },
  
  // Anand's posts
  {
    postId: 'anand-1',
    userId: 'anand-user',
    userDisplayName: 'Anand',
    title: 'My 30-Day Sleep Transformation Journey',
    body: `For years, I thought 5 hours of sleep was enough. "I'll sleep when I'm dead," right? Wrong. Here's what happened when I committed to 8 hours for 30 days:

Week 1: Honestly, it was hard. My mind raced at bedtime.
Week 2: Started using blue light filters. Game changer!
Week 3: Energy levels I haven't felt since college
Week 4: My focus at work improved dramatically

The biggest surprise? My anxiety decreased by what feels like 50%. I had no idea poor sleep was fueling my stress.

My sleep stack:
• Magnesium glycinate before bed
• Phone charging outside bedroom
• Blackout curtains
• 65°F room temperature

Anyone else prioritizing sleep? What's worked for you?`,
    tags: ['sleep', 'transformation', 'mental-health', 'productivity'],
    viewCount: 156,
    likeCount: 45
  },
  {
    postId: 'anand-2',
    userId: 'anand-user',
    userDisplayName: 'Anand',
    title: 'Found My Perfect Stress-Relief Routine (It\'s Not What You Think)',
    body: `After trying everything - meditation apps, yoga, journaling - I finally found what works for me: cooking.

Specifically, Sunday meal prep has become my meditation. There's something about chopping vegetables, following recipes, and creating nourishing food that completely calms my mind.

My routine:
• Put on a podcast or music
• Prep 5 meals for the week
• Try one new recipe
• No phone calls or multitasking

The bonus? I eat healthier all week and save money. Win-win!

Sometimes the best wellness practices are hiding in plain sight. What unexpected activity helps you de-stress?`,
    tags: ['stress-relief', 'meal-prep', 'mindfulness', 'self-care'],
    viewCount: 98,
    likeCount: 32
  }
];

// Create posts
async function seedPosts() {
  console.log('Starting to seed discovery posts...');
  console.log(`Using project: ${serviceAccount.project_id}`);
  
  try {
    for (let i = 0; i < posts.length; i++) {
      const postData = posts[i];
      
      // Create timestamp for each post (stagger by hours)
      const createdAt = new Date(now.getTime() - (i * 3600000));
      
      const post = {
        userId: postData.userId,
        userDisplayName: postData.userDisplayName,
        isAnonymous: false,
        content: {
          title: postData.title,
          body: postData.body,
          tags: postData.tags,
          mediaUrls: []
        },
        status: 'approved',
        approvalData: {
          approvalProgress: 100,
          approvedBy: 'discovery_assistant',
          approvalMessage: 'Content approved',
          approvedAt: createdAt
        },
        metadata: {
          createdAt: createdAt,
          updatedAt: createdAt,
          viewCount: postData.viewCount,
          likeCount: postData.likeCount,
          commentCount: 0
        },
        visibility: 'public',
        reportCount: 0,
        isDeleted: false
      };

      await db.collection('discovery_posts').doc(postData.postId).set(post);
      console.log(`✅ Created post: ${postData.title}`);
    }
    
    console.log(`\n🎉 Successfully created ${posts.length} posts!`);
    console.log('Posts are now available in the Discover feed.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding posts:', error);
    process.exit(1);
  }
}

// Run
seedPosts();