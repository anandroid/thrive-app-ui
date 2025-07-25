'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, ShoppingCart, Eye, MousePointerClick } from 'lucide-react';
import { VendorStats } from '@/src/types/shop';

export default function Analytics() {
  const [stats, setStats] = useState<VendorStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/analytics?range=${timeRange}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalStats = stats.reduce((acc, vendor) => ({
    totalViews: acc.totalViews + vendor.totalViews,
    totalClicks: acc.totalClicks + vendor.totalClicks,
    totalConversions: acc.totalConversions + vendor.totalConversions,
    revenue: acc.revenue + vendor.revenue,
  }), { totalViews: 0, totalClicks: 0, totalConversions: 0, revenue: 0 });

  const overallConversionRate = totalStats.totalClicks > 0 
    ? ((totalStats.totalConversions / totalStats.totalClicks) * 100).toFixed(2)
    : '0';

  return (
    <div className="space-y-[min(4vw,1rem)]">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-[min(5vw,1.25rem)] font-bold text-gray-900">
          Shop Analytics
        </h2>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-[min(4vw,1rem)] py-[min(2.5vw,0.625rem)] border border-gray-300 rounded-[min(2vw,0.5rem)] text-[min(3.75vw,0.9375rem)]"
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-[min(8vw,2rem)]">
          <div className="animate-spin rounded-full h-[min(8vw,2rem)] w-[min(8vw,2rem)] border-b-2 border-rose-500"></div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-[min(4vw,1rem)]">
            <div className="bg-white rounded-[min(2vw,0.5rem)] shadow-sm p-[min(4vw,1rem)]">
              <div className="flex items-center justify-between mb-[min(2vw,0.5rem)]">
                <Eye className="w-[min(5vw,1.25rem)] h-[min(5vw,1.25rem)] text-gray-400" />
                <span className="text-[min(3vw,0.75rem)] text-green-600 font-medium">+12%</span>
              </div>
              <p className="text-[min(6vw,1.5rem)] font-bold text-gray-900">
                {totalStats.totalViews.toLocaleString()}
              </p>
              <p className="text-[min(3.25vw,0.8125rem)] text-gray-600">Total Views</p>
            </div>

            <div className="bg-white rounded-[min(2vw,0.5rem)] shadow-sm p-[min(4vw,1rem)]">
              <div className="flex items-center justify-between mb-[min(2vw,0.5rem)]">
                <MousePointerClick className="w-[min(5vw,1.25rem)] h-[min(5vw,1.25rem)] text-gray-400" />
                <span className="text-[min(3vw,0.75rem)] text-green-600 font-medium">+8%</span>
              </div>
              <p className="text-[min(6vw,1.5rem)] font-bold text-gray-900">
                {totalStats.totalClicks.toLocaleString()}
              </p>
              <p className="text-[min(3.25vw,0.8125rem)] text-gray-600">Total Clicks</p>
            </div>

            <div className="bg-white rounded-[min(2vw,0.5rem)] shadow-sm p-[min(4vw,1rem)]">
              <div className="flex items-center justify-between mb-[min(2vw,0.5rem)]">
                <ShoppingCart className="w-[min(5vw,1.25rem)] h-[min(5vw,1.25rem)] text-gray-400" />
                <span className="text-[min(3vw,0.75rem)] text-green-600 font-medium">+15%</span>
              </div>
              <p className="text-[min(6vw,1.5rem)] font-bold text-gray-900">
                {totalStats.totalConversions}
              </p>
              <p className="text-[min(3.25vw,0.8125rem)] text-gray-600">Conversions</p>
            </div>

            <div className="bg-white rounded-[min(2vw,0.5rem)] shadow-sm p-[min(4vw,1rem)]">
              <div className="flex items-center justify-between mb-[min(2vw,0.5rem)]">
                <TrendingUp className="w-[min(5vw,1.25rem)] h-[min(5vw,1.25rem)] text-gray-400" />
                <span className="text-[min(3vw,0.75rem)] text-green-600 font-medium">{overallConversionRate}%</span>
              </div>
              <p className="text-[min(6vw,1.5rem)] font-bold text-gray-900">
                ${totalStats.revenue.toFixed(2)}
              </p>
              <p className="text-[min(3.25vw,0.8125rem)] text-gray-600">Revenue</p>
            </div>
          </div>

          {/* Vendor Performance Table */}
          <div className="bg-white rounded-[min(2vw,0.5rem)] shadow-sm overflow-hidden">
            <div className="px-[min(4vw,1rem)] py-[min(3vw,0.75rem)] border-b border-gray-200">
              <h3 className="text-[min(4vw,1rem)] font-semibold text-gray-900">
                Vendor Performance
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-[min(4vw,1rem)] py-[min(3vw,0.75rem)] text-left text-[min(3.25vw,0.8125rem)] font-medium text-gray-700">
                      Vendor
                    </th>
                    <th className="px-[min(4vw,1rem)] py-[min(3vw,0.75rem)] text-right text-[min(3.25vw,0.8125rem)] font-medium text-gray-700">
                      Products
                    </th>
                    <th className="px-[min(4vw,1rem)] py-[min(3vw,0.75rem)] text-right text-[min(3.25vw,0.8125rem)] font-medium text-gray-700">
                      Views
                    </th>
                    <th className="px-[min(4vw,1rem)] py-[min(3vw,0.75rem)] text-right text-[min(3.25vw,0.8125rem)] font-medium text-gray-700">
                      Clicks
                    </th>
                    <th className="px-[min(4vw,1rem)] py-[min(3vw,0.75rem)] text-right text-[min(3.25vw,0.8125rem)] font-medium text-gray-700">
                      Conv. Rate
                    </th>
                    <th className="px-[min(4vw,1rem)] py-[min(3vw,0.75rem)] text-right text-[min(3.25vw,0.8125rem)] font-medium text-gray-700">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-[min(4vw,1rem)] py-[min(4vw,1rem)] text-[min(3.5vw,0.875rem)] text-gray-900">
                      Thrive Supplements
                    </td>
                    <td className="px-[min(4vw,1rem)] py-[min(4vw,1rem)] text-[min(3.5vw,0.875rem)] text-gray-600 text-right">
                      24
                    </td>
                    <td className="px-[min(4vw,1rem)] py-[min(4vw,1rem)] text-[min(3.5vw,0.875rem)] text-gray-600 text-right">
                      1,234
                    </td>
                    <td className="px-[min(4vw,1rem)] py-[min(4vw,1rem)] text-[min(3.5vw,0.875rem)] text-gray-600 text-right">
                      89
                    </td>
                    <td className="px-[min(4vw,1rem)] py-[min(4vw,1rem)] text-[min(3.5vw,0.875rem)] text-gray-600 text-right">
                      5.2%
                    </td>
                    <td className="px-[min(4vw,1rem)] py-[min(4vw,1rem)] text-[min(3.5vw,0.875rem)] text-gray-900 text-right font-medium">
                      $456.78
                    </td>
                  </tr>
                  <tr>
                    <td className="px-[min(4vw,1rem)] py-[min(4vw,1rem)] text-[min(3.5vw,0.875rem)] text-gray-900">
                      Amazon Associates
                    </td>
                    <td className="px-[min(4vw,1rem)] py-[min(4vw,1rem)] text-[min(3.5vw,0.875rem)] text-gray-600 text-right">
                      156
                    </td>
                    <td className="px-[min(4vw,1rem)] py-[min(4vw,1rem)] text-[min(3.5vw,0.875rem)] text-gray-600 text-right">
                      3,456
                    </td>
                    <td className="px-[min(4vw,1rem)] py-[min(4vw,1rem)] text-[min(3.5vw,0.875rem)] text-gray-600 text-right">
                      234
                    </td>
                    <td className="px-[min(4vw,1rem)] py-[min(4vw,1rem)] text-[min(3.5vw,0.875rem)] text-gray-600 text-right">
                      3.8%
                    </td>
                    <td className="px-[min(4vw,1rem)] py-[min(4vw,1rem)] text-[min(3.5vw,0.875rem)] text-gray-900 text-right font-medium">
                      $123.45
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}