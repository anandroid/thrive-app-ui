import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { ShopSettings } from '@/src/types/shop';

// GET /api/shop/settings - Get shop settings for display
export async function GET() {
  try {
    const doc = await adminDb.collection('shop_settings').doc('settings').get();
    
    if (!doc.exists) {
      // Return default settings if none exist
      const defaultSettings: ShopSettings = {
        id: 'settings',
        featuredCategories: ['sleep', 'stress', 'energy'],
        featuredProducts: [],
        banners: [],
        affiliateDisclosure: 'As an Amazon Associate and affiliate partner, we earn from qualifying purchases. This helps support our mission to provide quality wellness recommendations.',
        defaultCurrency: 'USD',
        updatedAt: new Date()
      };
      
      return NextResponse.json(defaultSettings);
    }

    const settings = {
      id: doc.id,
      ...doc.data()
    } as ShopSettings;

    // Filter out inactive banners for public display
    if (settings.banners) {
      settings.banners = settings.banners.filter(banner => banner.isActive);
    }

    return NextResponse.json(settings);

  } catch (error) {
    console.error('Error fetching shop settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}