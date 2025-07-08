'use client';

import React from 'react';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';

export function ThrivingsSkeleton() {
  return (
    <div className="app-screen">
      {/* Header Skeleton */}
      <div className="safe-area-top" />
      <div className="app-header">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center space-x-3">
            <Skeleton variant="rounded" width={40} height={40} />
            <Skeleton variant="text" width={80} height={28} />
          </div>
          <Skeleton variant="rounded" width={44} height={44} />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-6">
          {/* Your Thrivings Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <Skeleton variant="text" width={150} height={32} />
              <Skeleton variant="text" width={60} height={20} />
            </div>
            
            {/* Horizontal Scroll Cards */}
            <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide">
              <div className="flex space-x-3 pb-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex-none w-[280px]">
                    <SkeletonCard />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Prompt Templates */}
          <div className="space-y-3">
            <Skeleton variant="text" width={200} height={24} className="mx-auto mb-8" />
            
            <div className="grid gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex items-center space-x-4 p-6 rounded-3xl bg-white shadow-lg">
                  <Skeleton variant="rounded" width={56} height={56} />
                  <Skeleton variant="text" width="60%" height={20} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Input Area Skeleton */}
      <div className="border-t border-gray-200 bg-white p-4">
        <Skeleton variant="rounded" width="100%" height={48} />
      </div>
    </div>
  );
}

export function ThrivingDetailSkeleton() {
  return (
    <div className="app-screen">
      {/* Header */}
      <div className="safe-area-top" />
      <div className="app-header">
        <div className="flex items-center justify-between px-4 h-14">
          <Skeleton variant="rounded" width={40} height={40} />
          <Skeleton variant="text" width={120} height={24} />
          <Skeleton variant="rounded" width={40} height={40} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-6 space-y-6">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <Skeleton variant="circular" width={80} height={80} className="mx-auto mb-4" />
            <Skeleton variant="text" width={200} height={32} className="mx-auto mb-2" />
            <Skeleton variant="text" width={150} height={20} className="mx-auto" />
          </div>

          {/* Steps */}
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 rounded-2xl bg-white border border-gray-200">
                <div className="flex items-start justify-between mb-2">
                  <Skeleton variant="text" width="60%" height={20} />
                  <Skeleton variant="text" width={60} height={16} />
                </div>
                <Skeleton variant="text" width="100%" height={16} />
                <Skeleton variant="text" width="80%" height={16} className="mt-2" />
              </div>
            ))}
          </div>

          {/* Journal Button */}
          <Skeleton variant="rounded" width="100%" height={48} />
        </div>
      </div>
    </div>
  );
}