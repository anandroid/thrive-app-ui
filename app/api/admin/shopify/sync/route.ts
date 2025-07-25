import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/src/lib/auth';
import { adminDb, FieldValue } from '@/lib/firebase-admin';
import { fetchProducts } from '@/src/lib/shopify/client';
import { Product } from '@/src/types/shop';

// POST /api/admin/shopify/sync - Sync products from Shopify
export async function POST(request: NextRequest) {
  try {
    const { userId } = await getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Check if user is admin
    
    // Get the default Thrive vendor
    const vendorDoc = await adminDb.collection('vendors').doc('thrive_shopify').get();
    if (!vendorDoc.exists) {
      return NextResponse.json(
        { error: 'Default Thrive vendor not found. Please set up the vendor first.' },
        { status: 404 }
      );
    }

    // Vendor exists check is sufficient
    
    // Fetch products from Shopify
    const shopifyProducts = await fetchProducts(50); // Fetch up to 50 products
    
    let syncedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    
    // Process each Shopify product
    for (const edge of shopifyProducts.edges) {
      const shopifyProduct = edge.node;
      
      try {
        // Extract product data
        const productData: Omit<Product, 'id'> = {
          vendorId: 'thrive_shopify',
          name: shopifyProduct.title,
          slug: shopifyProduct.handle,
          description: shopifyProduct.description || '',
          shortDescription: shopifyProduct.description ? 
            shopifyProduct.description.substring(0, 150) + '...' : '',
          images: shopifyProduct.images.edges.map((img: { node: { url: string } }) => img.node.url),
          price: {
            amount: parseFloat(shopifyProduct.priceRange.minVariantPrice.amount),
            currency: shopifyProduct.priceRange.minVariantPrice.currencyCode,
            compareAtPrice: shopifyProduct.compareAtPriceRange?.minVariantPrice?.amount ? 
              parseFloat(shopifyProduct.compareAtPriceRange.minVariantPrice.amount) : undefined
          },
          categories: mapShopifyTagsToCategories(shopifyProduct.tags),
          tags: shopifyProduct.tags,
          vendorType: 'thrive',
          shopifyProductId: shopifyProduct.id,
          shopifyVariantId: shopifyProduct.variants.edges[0]?.node.id,
          inventory: {
            available: shopifyProduct.variants.edges[0]?.node.quantityAvailable || 0,
            policy: 'deny'
          },
          isActive: shopifyProduct.availableForSale,
          isFeatured: shopifyProduct.tags.includes('featured'),
          searchKeywords: [...shopifyProduct.tags, shopifyProduct.productType, shopifyProduct.vendor]
            .filter(Boolean).map(k => k.toLowerCase()),
          viewCount: 0,
          clickCount: 0,
          purchaseCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Check if product already exists
        const existingProductQuery = await adminDb.collection('products')
          .where('shopifyProductId', '==', shopifyProduct.id)
          .limit(1)
          .get();
        
        if (!existingProductQuery.empty) {
          // Update existing product
          const existingDoc = existingProductQuery.docs[0];
          await adminDb.collection('products').doc(existingDoc.id).update({
            ...productData,
            updatedAt: FieldValue.serverTimestamp()
          });
        } else {
          // Create new product
          const productId = adminDb.collection('products').doc().id;
          await adminDb.collection('products').doc(productId).set({
            ...productData,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
          });
        }
        
        syncedCount++;
      } catch (error) {
        errorCount++;
        errors.push(`Failed to sync ${shopifyProduct.title}: ${error}`);
        console.error('Error syncing product:', shopifyProduct.title, error);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Sync completed. ${syncedCount} products synced, ${errorCount} errors.`,
      syncedCount,
      errorCount,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error syncing Shopify products:', error);
    return NextResponse.json(
      { error: 'Failed to sync products', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Helper function to map Shopify tags to our categories
function mapShopifyTagsToCategories(tags: string[]): string[] {
  const categoryMap: Record<string, string> = {
    'sleep': 'sleep',
    'stress': 'stress',
    'anxiety': 'stress',
    'energy': 'energy',
    'focus': 'energy',
    'pain': 'pain',
    'digestive': 'digestive',
    'gut': 'digestive',
    'immune': 'immune',
    'immunity': 'immune'
  };
  
  const categories = new Set<string>();
  
  for (const tag of tags) {
    const lowercaseTag = tag.toLowerCase();
    for (const [keyword, category] of Object.entries(categoryMap)) {
      if (lowercaseTag.includes(keyword)) {
        categories.add(category);
      }
    }
  }
  
  return Array.from(categories);
}