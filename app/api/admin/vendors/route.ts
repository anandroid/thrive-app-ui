import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/src/lib/auth';
import { adminDb, FieldValue } from '@/lib/firebase-admin';
import { Vendor } from '@/src/types/shop';

// GET /api/admin/vendors - Get all vendors
export async function GET(request: NextRequest) {
  try {
    const { userId } = await getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const isActive = searchParams.get('isActive');

    let query = adminDb.collection('vendors') as FirebaseFirestore.Query;

    if (type) query = query.where('type', '==', type);
    if (isActive !== null) query = query.where('isActive', '==', isActive === 'true');

    const snapshot = await query.orderBy('createdAt', 'desc').get();
    const vendors: Vendor[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Vendor));

    return NextResponse.json({ vendors });

  } catch (error) {
    console.error('Error fetching vendors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendors' },
      { status: 500 }
    );
  }
}

// POST /api/admin/vendors - Create a new vendor
export async function POST(request: NextRequest) {
  try {
    const { userId } = await getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      );
    }

    // Validate type-specific fields
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

    // Generate slug from name
    const slug = body.slug || body.name.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    const vendorId = adminDb.collection('vendors').doc().id;
    const vendor: Omit<Vendor, 'id'> = {
      name: body.name,
      slug,
      logo: body.logo || '',
      description: body.description || '',
      type: body.type,
      affiliateData: body.type === 'affiliate' ? body.affiliateData : undefined,
      shopifyData: body.type === 'thrive' ? body.shopifyData : undefined,
      isActive: body.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await adminDb.collection('vendors').doc(vendorId).set({
      ...vendor,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    return NextResponse.json({
      success: true,
      vendorId,
      message: 'Vendor created successfully'
    });

  } catch (error) {
    console.error('Error creating vendor:', error);
    return NextResponse.json(
      { error: 'Failed to create vendor' },
      { status: 500 }
    );
  }
}