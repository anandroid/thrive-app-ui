'use client';

import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { AboutSection } from '@/components/features/AboutSection';

export default function AboutPage() {
  return (
    <PageLayout
      header={{
        showBackButton: true,
        backHref: '/settings',
        title: 'About'
      }}
    >
      <div className="px-4 py-6">
        <AboutSection />
      </div>
    </PageLayout>
  );
}