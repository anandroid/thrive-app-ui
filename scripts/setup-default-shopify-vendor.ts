import { adminDb, FieldValue } from '../lib/firebase-admin';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

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
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };

    // Check if vendor already exists
    const existingVendor = await adminDb.collection('vendors').doc(vendorId).get();
    
    if (existingVendor.exists) {
      console.log('Updating existing Thrive Shopify vendor...');
      await adminDb.collection('vendors').doc(vendorId).update({
        shopifyData: vendor.shopifyData,
        updatedAt: FieldValue.serverTimestamp()
      });
    } else {
      console.log('Creating default Thrive Shopify vendor...');
      await adminDb.collection('vendors').doc(vendorId).set(vendor);
    }

    console.log('✅ Default Shopify vendor setup complete');
    console.log(`   Store Domain: ${storeDomain}`);
    console.log(`   Storefront Token: ${storefrontToken.substring(0, 10)}...`);

  } catch (error) {
    console.error('Error setting up default Shopify vendor:', error);
    process.exit(1);
  }
}

// Run the setup
setupDefaultShopifyVendor();