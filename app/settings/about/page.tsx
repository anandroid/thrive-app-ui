'use client';

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { AboutSection } from '@/components/features/AboutSection';

export default function AboutPage() {
  return (
    <AppLayout
      header={{
        showBackButton: true,
        backHref: '/settings',
        title: 'About'
      }}
    >
      <div className="px-4 py-6">
        <AboutSection />
      </div>
    </AppLayout>
  );
}