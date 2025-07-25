import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/src/lib/auth';
import { adminDb, FieldValue } from '@/lib/firebase-admin';

// GET /api/admin/vendors/[vendorId] - Get a single vendor
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vendorId: string }> }
) {
  try {
    const { vendorId } = await params;
    const { userId } = await getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const doc = await adminDb.collection('vendors').doc(vendorId).get();
    
    if (!doc.exists) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: doc.id,
      ...doc.data()
    });

  } catch (error) {
    console.error('Error fetching vendor:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendor' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/vendors/[vendorId] - Update a vendor
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ vendorId: string }> }
) {
  try {
    const { vendorId } = await params;
    const { userId } = await getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Check if vendor exists
    const doc = await adminDb.collection('vendors').doc(vendorId).get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Validate type-specific fields if type is being changed
    if (body.type) {
      if (body.type === 'affiliate' && (!body.affiliateData?.programName || !body.affiliateData?.commissionRate)) {
        return NextResponse.json(
          { error: 'Affiliate vendors require program name and commission rate' },
          { status: 400 }
        );
      }

      if (body.type === 'thrive' && (!body.shopifyData?.domain || !body.shopifyData?.storefrontAccessToken)) {
        return NextResponse.json(
          { error: 'Thrive vendors require Shopify domain and access token' },
          { status: 400 }
        );
      }
    }

    // Update vendor
    const updateData: Record<string, unknown> = {
      ...body,
      updatedAt: FieldValue.serverTimestamp()
    };

    // Generate new slug if name changed
    if (body.name && body.name !== doc.data()?.name) {
      updateData.slug = body.slug || body.name.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
    }

    // Clear type-specific data if type changed
    const currentType = doc.data()?.type;
    if (body.type && body.type !== currentType) {
      if (body.type === 'thrive') {
        updateData.affiliateData = FieldValue.delete();
      } else {
        updateData.shopifyData = FieldValue.delete();
      }
    }

    await adminDb.collection('vendors').doc(vendorId).update(updateData);

    return NextResponse.json({
      success: true,
      message: 'Vendor updated successfully'
    });

  } catch (error) {
    console.error('Error updating vendor:', error);
    return NextResponse.json(
      { error: 'Failed to update vendor' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/vendors/[vendorId] - Delete a vendor
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ vendorId: string }> }
) {
  try {
    const { vendorId } = await params;
    const { userId } = await getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if vendor exists
    const doc = await adminDb.collection('vendors').doc(vendorId).get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Check if vendor has products
    const productsSnapshot = await adminDb.collection('products')
      .where('vendorId', '==', vendorId)
      .limit(1)
      .get();

    if (!productsSnapshot.empty) {
      return NextResponse.json(
        { error: 'Cannot delete vendor with existing products. Please delete or reassign products first.' },
        { status: 400 }
      );
    }

    // Delete vendor
    await adminDb.collection('vendors').doc(vendorId).delete();

    return NextResponse.json({
      success: true,
      message: 'Vendor deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting vendor:', error);
    return NextResponse.json(
      { error: 'Failed to delete vendor' },
      { status: 500 }
    );
  }
}