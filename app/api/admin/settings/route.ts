import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/src/lib/auth';
import { adminDb, FieldValue } from '@/lib/firebase-admin';
import { ShopSettings } from '@/src/types/shop';

// GET /api/admin/settings - Get shop settings
export async function GET(request: NextRequest) {
  try {
    const { userId } = await getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const doc = await adminDb.collection('shop_settings').doc('settings').get();
    
    if (!doc.exists) {
      // Return default settings if none exist
      const defaultSettings: ShopSettings = {
        id: 'settings',
        featuredCategories: [],
        featuredProducts: [],
        banners: [],
        affiliateDisclosure: 'As an Amazon Associate and affiliate partner, we earn from qualifying purchases. This helps support our mission to provide quality wellness recommendations.',
        defaultCurrency: 'USD',
        updatedAt: new Date()
      };
      
      return NextResponse.json(defaultSettings);
    }

    return NextResponse.json({
      id: doc.id,
      ...doc.data()
    });

  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/settings - Update shop settings
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate banners
    if (body.banners) {
      for (const banner of body.banners) {
        if (!banner.title || !banner.image || !banner.link) {
          return NextResponse.json(
            { error: 'Banner requires title, image, and link' },
            { status: 400 }
          );
        }
      }
    }

    // Update settings
    await adminDb.collection('shop_settings').doc('settings').set({
      ...body,
      id: 'settings',
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: userId
    }, { merge: true });

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully'
    });

  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}