'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/src/contexts/AuthContext';
import { Package, Store, BarChart3, Settings } from 'lucide-react';
import ProductManager from '@/components/admin/ProductManager';
import VendorManager from '@/components/admin/VendorManager';
import Analytics from '@/components/admin/Analytics';
import ShopSettings from '@/components/admin/ShopSettings';

type AdminTab = 'products' | 'vendors' | 'analytics' | 'settings';

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  
  useEffect(() => {
    if (!user) {
      router.push('/auth');
    }
  }, [user, router]);

  const tabs = [
    { id: 'products' as AdminTab, label: 'Products', icon: Package },
    { id: 'vendors' as AdminTab, label: 'Vendors', icon: Store },
    { id: 'analytics' as AdminTab, label: 'Analytics', icon: BarChart3 },
    { id: 'settings' as AdminTab, label: 'Settings', icon: Settings },
  ];

  return (
    <AppLayout
      header={{
        title: 'Shop Admin',
        showBackButton: true,
        backHref: '/',
      }}
    >
      <div className="min-h-screen bg-gray-50">
        {/* Tab Navigation */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="px-[min(4vw,1rem)]">
            <nav className="flex space-x-[min(4vw,1rem)] overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center space-x-[min(2vw,0.5rem)] 
                      py-[min(3vw,0.75rem)] px-[min(4vw,1rem)]
                      border-b-2 transition-all whitespace-nowrap
                      ${activeTab === tab.id
                        ? 'border-rose-500 text-rose-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                      }
                    `}
                  >
                    <Icon className="w-[min(4.5vw,1.125rem)] h-[min(4.5vw,1.125rem)]" />
                    <span className="text-[min(3.75vw,0.9375rem)] font-medium">
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-[min(4vw,1rem)]">
          {activeTab === 'products' && <ProductManager />}
          {activeTab === 'vendors' && <VendorManager />}
          {activeTab === 'analytics' && <Analytics />}
          {activeTab === 'settings' && <ShopSettings />}
        </div>
      </div>
    </AppLayout>
  );
}