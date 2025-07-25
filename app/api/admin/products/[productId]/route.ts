import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/src/lib/auth';
import { adminDb, FieldValue } from '@/lib/firebase-admin';
import { UpdateProductRequest } from '@/src/types/shop';

// GET /api/admin/products/[productId] - Get a single product
export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const { userId } = await getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const doc = await adminDb.collection('products').doc(params.productId).get();
    
    if (!doc.exists) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: doc.id,
      ...doc.data()
    });

  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/products/[productId] - Update a product
export async function PUT(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const { userId } = await getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: UpdateProductRequest = await request.json();
    
    // Check if product exists
    const doc = await adminDb.collection('products').doc(params.productId).get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const currentProduct = doc.data();
    const oldCategories = currentProduct?.categories || [];

    // Update product
    const updateData: any = {
      ...body,
      updatedAt: FieldValue.serverTimestamp()
    };

    // Generate new slug if name changed
    if (body.name && body.name !== currentProduct?.name) {
      updateData.slug = body.name.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
    }

    await adminDb.collection('products').doc(params.productId).update(updateData);

    // Update category counts if categories changed
    if (body.categories && JSON.stringify(body.categories) !== JSON.stringify(oldCategories)) {
      const batch = adminDb.batch();
      
      // Decrement count for removed categories
      const removedCategories = oldCategories.filter(cat => !body.categories?.includes(cat));
      for (const categoryId of removedCategories) {
        const categoryRef = adminDb.collection('categories').doc(categoryId);
        batch.update(categoryRef, {
          productCount: FieldValue.increment(-1)
        });
      }
      
      // Increment count for added categories
      const addedCategories = body.categories.filter(cat => !oldCategories.includes(cat));
      for (const categoryId of addedCategories) {
        const categoryRef = adminDb.collection('categories').doc(categoryId);
        batch.update(categoryRef, {
          productCount: FieldValue.increment(1)
        });
      }
      
      await batch.commit();
    }

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully'
    });

  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/products/[productId] - Delete a product
export async function DELETE(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const { userId } = await getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get product to access its categories
    const doc = await adminDb.collection('products').doc(params.productId).get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const product = doc.data();
    const categories = product?.categories || [];

    // Soft delete - just mark as inactive
    await adminDb.collection('products').doc(params.productId).update({
      isActive: false,
      isDeleted: true,
      deletedAt: FieldValue.serverTimestamp(),
      deletedBy: userId
    });

    // Update category counts
    if (categories.length > 0) {
      const batch = adminDb.batch();
      for (const categoryId of categories) {
        const categoryRef = adminDb.collection('categories').doc(categoryId);
        batch.update(categoryRef, {
          productCount: FieldValue.increment(-1)
        });
      }
      await batch.commit();
    }

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}