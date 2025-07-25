import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/src/lib/auth';
import { adminDb, FieldValue } from '@/lib/firebase-admin';

// POST /api/shop/track-click - Track product clicks (especially for affiliate links)
export async function POST(request: NextRequest) {
  try {
    // Auth is optional for click tracking
    let userId: string | null = null;
    try {
      const auth = await getAuth(request);
      userId = auth.userId;
    } catch {
      // Continue without auth
    }

    const body = await request.json();
    const { productId, vendorId, type } = body;

    if (!productId || !vendorId) {
      return NextResponse.json(
        { error: 'Product ID and Vendor ID are required' },
        { status: 400 }
      );
    }

    // Update product click count
    await adminDb.collection('products').doc(productId).update({
      clickCount: FieldValue.increment(1),
      lastClickedAt: FieldValue.serverTimestamp()
    });

    // For affiliate products, create a click record
    if (type === 'affiliate') {
      const clickId = adminDb.collection('affiliate_clicks').doc().id;
      
      const clickData = {
        id: clickId,
        userId: userId || 'anonymous',
        productId,
        vendorId,
        clickedAt: new Date(),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        referrer: request.headers.get('referer') || 'direct',
        converted: false,
        conversionValue: null,
        conversionDate: null
      };

      await adminDb.collection('affiliate_clicks').doc(clickId).set({
        ...clickData,
        clickedAt: FieldValue.serverTimestamp()
      });

      // Set a cookie to track potential conversions
      const response = NextResponse.json({ 
        success: true, 
        clickId 
      });

      response.cookies.set({
        name: `affiliate_click_${vendorId}`,
        value: clickId,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 // 30 days
      });

      return response;
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error tracking click:', error);
    return NextResponse.json(
      { error: 'Failed to track click' },
      { status: 500 }
    );
  }
}