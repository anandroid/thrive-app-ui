import { Suspense } from 'react';
import { PantryContent } from './PantryContent';

// Loading fallback component
function PantryLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="animate-pulse">
        {/* Header skeleton */}
        <div className="h-16 bg-white border-b border-gray-200" />
        
        {/* Content skeleton */}
        <div className="p-4 space-y-4">
          <div className="h-12 bg-gray-200 rounded-xl" />
          <div className="h-32 bg-gray-200 rounded-xl" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-48 bg-gray-200 rounded-xl" />
            <div className="h-48 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PantryPage() {
  return (
    <Suspense fallback={<PantryLoading />}>
      <PantryContent />
    </Suspense>
  );
}