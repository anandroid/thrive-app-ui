'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export function PantrySkeleton() {
  return (
    <div className="app-screen">
      {/* Header */}
      <div className="safe-area-top" />
      <div className="app-header">
        <div className="flex items-center justify-between px-4 h-14">
          <Skeleton variant="rounded" width={40} height={40} />
          <Skeleton variant="text" width={100} height={24} />
          <Skeleton variant="rounded" width={40} height={40} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-6 space-y-6">
          {/* Search */}
          <Skeleton variant="rounded" width="100%" height={48} />

          {/* Tag Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} variant="rounded" width={80} height={32} />
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-gray-200">
                <Skeleton variant="rectangular" width="100%" height={120} className="rounded-xl mb-3" />
                <Skeleton variant="text" width="80%" height={18} className="mb-2" />
                <div className="flex gap-2">
                  <Skeleton variant="rounded" width={60} height={20} />
                  <Skeleton variant="rounded" width={40} height={20} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PantryItemSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-200">
      <Skeleton variant="rectangular" width="100%" height={120} className="rounded-xl mb-3" />
      <Skeleton variant="text" width="80%" height={18} className="mb-2" />
      <div className="flex gap-2">
        <Skeleton variant="rounded" width={60} height={20} />
        <Skeleton variant="rounded" width={40} height={20} />
      </div>
    </div>
  );
}