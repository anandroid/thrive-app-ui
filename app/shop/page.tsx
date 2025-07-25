'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { BottomNavLayout } from '@/components/layout/BottomNavLayout';
import Button from '@/components/ui/Button';

const EmbeddedShop = dynamic(() => import('@/components/features/EmbeddedShop'), { ssr: false });
const EnhancedShop = dynamic(() => import('@/components/shop/EnhancedShop'), { ssr: false });

export default function ShopPage() {
  const [viewMode, setViewMode] = useState<'enhanced' | 'embedded'>('enhanced');

  return (
    <BottomNavLayout
      header={{
        title: 'Shop',
        showBackButton: false,
        rightElement: (
          <Button
            onClick={() => setViewMode(viewMode === 'enhanced' ? 'embedded' : 'enhanced')}
            variant="soft"
            springAnimation
            haptic="light"
            className="text-[min(3.25vw,0.8125rem)]"
          >
            {viewMode === 'enhanced' ? 'Classic View' : 'New View'}
          </Button>
        )
      }}
    >
      {viewMode === 'enhanced' ? (
        <div className="px-[min(4vw,1rem)] py-[min(4vw,1rem)]">
          <EnhancedShop />
        </div>
      ) : (
        <EmbeddedShop />
      )}
    </BottomNavLayout>
  )
}