import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/src/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { VendorStats, Vendor } from '@/src/types/shop';

// GET /api/admin/analytics - Get analytics data
export async function GET(request: NextRequest) {
  try {
    const { userId } = await getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get('range') || '7d';

    // Calculate date range
    const startDate = new Date();
    
    switch (range) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
    }

    // Get all vendors
    const vendorsSnapshot = await adminDb.collection('vendors').get();
    const vendors: Vendor[] = vendorsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Vendor));

    // Get analytics for each vendor
    const stats: VendorStats[] = [];
    
    for (const vendor of vendors) {
      // Get products for this vendor
      const productsSnapshot = await adminDb.collection('products')
        .where('vendorId', '==', vendor.id)
        .get();

      let totalViews = 0;
      let totalClicks = 0;
      let totalConversions = 0;
      let revenue = 0;

      // Aggregate product stats
      for (const productDoc of productsSnapshot.docs) {
        const product = productDoc.data();
        totalViews += product.viewCount || 0;
        totalClicks += product.clickCount || 0;
        totalConversions += product.purchaseCount || 0;
      }

      // Get affiliate clicks for conversion tracking
      if (vendor.type === 'affiliate') {
        const clicksSnapshot = await adminDb.collection('affiliate_clicks')
          .where('vendorId', '==', vendor.id)
          .where('clickedAt', '>=', startDate)
          .get();

        const conversions = clicksSnapshot.docs.filter(doc => doc.data().converted);
        totalConversions = conversions.length;
        
        revenue = conversions.reduce((sum, doc) => {
          const click = doc.data();
          const vendorData = vendor as Vendor;
          const commission = (click.conversionValue || 0) * (vendorData.affiliateData?.commissionRate || 0) / 100;
          return sum + commission;
        }, 0);
      }

      const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

      stats.push({
        totalProducts: productsSnapshot.size,
        activeProducts: productsSnapshot.docs.filter(doc => doc.data().isActive).length,
        totalViews,
        totalClicks,
        totalConversions,
        conversionRate,
        revenue
      });
    }

    return NextResponse.json({ stats });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}