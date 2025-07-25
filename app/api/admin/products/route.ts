import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/src/lib/auth';
import { adminDb, FieldValue } from '@/lib/firebase-admin';
import { Product, CreateProductRequest } from '@/src/types/shop';

// GET /api/admin/products - Get all products with filters
export async function GET(request: NextRequest) {
  try {
    const { userId } = await getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Check if user is admin
    // For now, we'll allow any authenticated user

    const searchParams = request.nextUrl.searchParams;
    const vendorId = searchParams.get('vendorId');
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');
    const isFeatured = searchParams.get('isFeatured');
    const vendorType = searchParams.get('vendorType');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    let query = adminDb.collection('products') as FirebaseFirestore.Query;

    if (vendorId) query = query.where('vendorId', '==', vendorId);
    if (category) query = query.where('categories', 'array-contains', category);
    if (isActive !== null) query = query.where('isActive', '==', isActive === 'true');
    if (isFeatured !== null) query = query.where('isFeatured', '==', isFeatured === 'true');
    if (vendorType) query = query.where('vendorType', '==', vendorType);

    // Get total count
    const countSnapshot = await query.count().get();
    const totalItems = countSnapshot.data().count;

    // Get paginated results
    query = query.orderBy('createdAt', 'desc')
                 .limit(pageSize)
                 .offset((page - 1) * pageSize);

    const snapshot = await query.get();
    const products: Product[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Product));

    return NextResponse.json({
      products,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize)
      }
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST /api/admin/products - Create a new product
export async function POST(request: NextRequest) {
  try {
    const { userId } = await getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateProductRequest = await request.json();
    
    // Validate required fields
    if (!body.vendorId || !body.name || !body.description || !body.price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate slug from name
    const slug = body.name.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    const productId = adminDb.collection('products').doc().id;
    const product: Omit<Product, 'id'> = {
      vendorId: body.vendorId,
      name: body.name,
      slug,
      description: body.description,
      shortDescription: body.shortDescription || '',
      images: body.images || [],
      price: body.price,
      categories: body.categories || [],
      tags: body.tags || [],
      vendorType: body.vendorType,
      shopifyProductId: body.shopifyProductId,
      shopifyVariantId: body.shopifyVariantId,
      affiliateUrl: body.affiliateUrl,
      affiliateId: body.affiliateId,
      brand: body.brand,
      isActive: true,
      isFeatured: body.isFeatured || false,
      searchKeywords: body.searchKeywords || [],
      viewCount: 0,
      clickCount: 0,
      purchaseCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await adminDb.collection('products').doc(productId).set({
      ...product,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    // Update category product counts
    if (body.categories && body.categories.length > 0) {
      const batch = adminDb.batch();
      for (const categoryId of body.categories) {
        const categoryRef = adminDb.collection('categories').doc(categoryId);
        batch.update(categoryRef, {
          productCount: FieldValue.increment(1)
        });
      }
      await batch.commit();
    }

    return NextResponse.json({
      success: true,
      productId,
      message: 'Product created successfully'
    });

  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}