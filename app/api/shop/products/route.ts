import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Product } from '@/src/types/shop';

// GET /api/shop/products - Get products for shop display
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const vendorType = searchParams.get('vendorType');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '12');

    let query = adminDb.collection('products')
      .where('isActive', '==', true) as FirebaseFirestore.Query;

    // Apply filters
    if (category) {
      query = query.where('categories', 'array-contains', category);
    }
    
    if (vendorType && vendorType !== 'all') {
      query = query.where('vendorType', '==', vendorType);
    }

    // For search, we'll need to fetch all and filter in memory
    // (Firestore doesn't support full-text search natively)
    let products: Product[];
    
    if (search) {
      const snapshot = await query.get();
      const allProducts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Product));
      
      const searchLower = search.toLowerCase();
      products = allProducts.filter(product => 
        product.name.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower) ||
        product.brand?.toLowerCase().includes(searchLower) ||
        product.searchKeywords?.some(keyword => keyword.toLowerCase().includes(searchLower))
      );
      
      // Manual pagination for search results
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedProducts = products.slice(startIndex, endIndex);
      
      return NextResponse.json({
        products: paginatedProducts,
        pagination: {
          page,
          pageSize,
          totalItems: products.length,
          totalPages: Math.ceil(products.length / pageSize)
        }
      });
    } else {
      // Get total count for pagination
      const countSnapshot = await query.count().get();
      const totalItems = countSnapshot.data().count;
      
      // Get paginated results
      query = query
        .orderBy('isFeatured', 'desc')
        .orderBy('createdAt', 'desc')
        .limit(pageSize)
        .offset((page - 1) * pageSize);
      
      const snapshot = await query.get();
      products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Product));
      
      // Increment view count for displayed products
      const batch = adminDb.batch();
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          viewCount: (doc.data().viewCount || 0) + 1
        });
      });
      await batch.commit();
      
      return NextResponse.json({
        products,
        pagination: {
          page,
          pageSize,
          totalItems,
          totalPages: Math.ceil(totalItems / pageSize)
        }
      });
    }

  } catch (error) {
    console.error('Error fetching shop products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}