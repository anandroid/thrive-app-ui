const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Initialize Firebase Admin
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'thrive-465618';

if (serviceAccountKey && serviceAccountKey !== '{}') {
  try {
    const serviceAccount = JSON.parse(serviceAccountKey);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
  } catch (error) {
    console.error('Failed to parse Firebase service account key:', error);
    admin.initializeApp({ projectId });
  }
} else {
  admin.initializeApp({ projectId });
}

const db = admin.firestore();

async function setupDefaultShopifyVendor() {
  try {
    const vendorId = 'thrive_shopify';
    const storeDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || '2g1rga-ky.myshopify.com';
    const storefrontToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_API_TOKEN || 'bb354fb3f681f73155f24f0c5a47abb6';

    const vendor = {
      name: 'Thrive Supplements',
      slug: 'thrive-supplements',
      logo: '/logo.png',
      description: 'Premium wellness supplements curated for your health journey',
      type: 'thrive',
      shopifyData: {
        domain: storeDomain,
        storefrontAccessToken: storefrontToken
      },
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Check if vendor already exists
    const vendorRef = db.collection('vendors').doc(vendorId);
    const existingVendor = await vendorRef.get();
    
    if (existingVendor.exists) {
      console.log('Updating existing Thrive Shopify vendor...');
      await vendorRef.update({
        shopifyData: vendor.shopifyData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      console.log('Creating default Thrive Shopify vendor...');
      await vendorRef.set(vendor);
    }

    console.log('✅ Default Shopify vendor setup complete');
    console.log(`   Store Domain: ${storeDomain}`);
    console.log(`   Storefront Token: ${storefrontToken.substring(0, 10)}...`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error setting up default Shopify vendor:', error);
    process.exit(1);
  }
}

// Run the setup
setupDefaultShopifyVendor();