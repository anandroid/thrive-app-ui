import { adminDb, FieldValue } from '../lib/firebase-admin';

// Helper function to create a post
async function createPost(postData: any) {
  const postId = adminDb.collection('discovery_posts').doc().id;
  const post = {
    userId: postData.userId,
    userDisplayName: postData.userDisplayName,
    isAnonymous: false,
    content: {
      title: postData.title,
      body: postData.body,
      tags: postData.tags || [],
      mediaUrls: []
    },
    status: 'approved',
    approvalData: {
      approvalProgress: 100,
      approvedBy: 'discovery_assistant',
      approvalMessage: 'Content approved',
      approvedAt: FieldValue.serverTimestamp()
    },
    metadata: {
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      viewCount: Math.floor(Math.random() * 200) + 10,
      likeCount: Math.floor(Math.random() * 50) + 5,
      commentCount: 0
    },
    visibility: 'public',
    reportCount: 0,
    isDeleted: false
  };

  await adminDb.collection('discovery_posts').doc(postId).set(post);
  console.log(`Created post: ${postData.title}`);
  return postId;
}

// Posts data
const posts = [
  // Thrive Official posts
  {
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
    tags: ['welcome', 'community', 'wellness', 'motivation']
  },
  {
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
    tags: ['morning-routine', 'energy', 'wellness-tips', 'productivity']
  },
  {
    userId: 'thrive-official',
    userDisplayName: 'Thrive Official',
    title: 'The Power of Micro-Habits: Start With Just 2 Minutes',
    body: `Feeling overwhelmed by big wellness goals? Here's a secret: start ridiculously small.

Instead of "I'll meditate for 30 minutes daily," try "I'll take 3 deep breaths after waking up."

Instead of "I'll run 5 miles," try "I'll put on my running shoes."

Why this works:
✓ Builds consistency without pressure
✓ Creates positive momentum
✓ Rewires your brain for success
✓ Makes habits "sticky"

My 2-minute habit that changed everything: drinking one glass of water upon waking. That's it! This tiny habit snowballed into a full morning wellness routine.

What's ONE 2-minute habit you could start today? Drop it below and let's support each other! 👇`,
    tags: ['habits', 'micro-habits', 'behavior-change', 'wellness']
  },
  
  // Anand's posts
  {
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
    tags: ['sleep', 'transformation', 'mental-health', 'productivity']
  },
  {
    userId: 'anand-user',
    userDisplayName: 'Anand',
    title: 'Why I Quit Coffee for Matcha (And What Happened)',
    body: `After 10 years of 3-4 cups of coffee daily, I switched to matcha. Here's my honest experience:

The Good:
• No more 2pm crashes
• Steady energy all day
• Better focus without jitters
• My sleep improved within a week

The Challenging:
• First 3 days were rough (headaches)
• Miss the coffee ritual
• More expensive than coffee
• Takes time to acquire the taste

Pro tip: I add a tiny bit of honey and oat milk. Started with 1 cup, now I have 2 throughout the day.

Not saying coffee is bad - it just wasn't working for my body anymore. Anyone else made this switch? How did it go?`,
    tags: ['matcha', 'coffee', 'energy', 'wellness-journey']
  },
  {
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
    tags: ['stress-relief', 'meal-prep', 'mindfulness', 'self-care']
  },
  
  // More Thrive Official posts
  {
    userId: 'thrive-official',
    userDisplayName: 'Thrive Official',
    title: '🎯 Weekly Challenge: The Gratitude Game',
    body: `Let's play the Gratitude Game this week! Here's how:

Every day, write down:
1. One thing you're grateful for (big or small)
2. One person you appreciate (and why)
3. One thing about your body you're thankful for

Example from today:
1. Grateful for my morning tea ritual ☕
2. Appreciate my neighbor who always smiles and waves 👋
3. Thankful my legs carried me on a beautiful walk 🚶

Studies show gratitude literally rewires your brain for positivity. Plus, it takes less than 2 minutes!

Who's in? Drop your Day 1 gratitudes below! Let's flood this feed with positivity 💕`,
    tags: ['gratitude', 'challenge', 'mental-health', 'community']
  },
  {
    userId: 'thrive-official',
    userDisplayName: 'Thrive Official',
    title: 'Supplement Basics: What You Actually Need to Know',
    body: `Overwhelmed by the supplement aisle? You're not alone! Here's a simple guide:

The "Core Four" most people benefit from:
1. **Vitamin D3** - Especially if you're indoors often
2. **Magnesium** - Over 300 enzyme reactions need it
3. **Omega-3s** - Brain and heart health
4. **Quality Multivitamin** - Fills nutritional gaps

Remember:
• Supplements support, not replace, a healthy diet
• Quality matters more than quantity
• Start with bloodwork to know YOUR needs
• Introduce one at a time

Always consult your healthcare provider, especially if you take medications.

What supplements have made a real difference for you? Share your experience! 💊`,
    tags: ['supplements', 'nutrition', 'wellness-basics', 'health-tips']
  }
];

// Main function to seed posts
async function seedPosts() {
  console.log('Starting to seed discovery posts...');
  
  try {
    for (const postData of posts) {
      await createPost(postData);
      // Add a small delay between posts to spread out timestamps
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`\n✅ Successfully created ${posts.length} posts!`);
    console.log('Posts are now available in the Discover feed.');
  } catch (error) {
    console.error('Error seeding posts:', error);
  } finally {
    // Wait a moment for all writes to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    process.exit(0);
  }
}

// Run the seed function
seedPosts();