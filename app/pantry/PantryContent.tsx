'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, X, Package, 
  Search, Shield, Sparkles,
  Pill, Apple, Heart
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { PantryAddModal } from '@/components/features/PantryAddModal';
import { PantryItem, RecommendedSupplement } from '@/src/types/pantry';
import { 
  getPantryItems, savePantryItem, deletePantryItem, 
  getRecommendedSupplements, saveRecommendedSupplement
} from '@/src/utils/pantryStorage';
import { generateSupplementRecommendations } from '@/src/services/recommendations/supplementRecommendations';
import { useThreadMetadata } from '@/src/hooks/useThreadMetadata';
import { PantryNaturalInput } from '@/components/features/PantryNaturalInput';
// Removed Button components in favor of inline coral styling

const categoryIcons = {
  supplement: Sparkles,
  medicine: Pill,
  food: Apple,
  remedy: Heart,
  other: Package
};

const categoryColors = {
  supplement: 'from-purple-500/20 to-purple-600/15',
  medicine: 'from-blue-500/20 to-blue-600/15',
  food: 'from-orange-500/20 to-orange-600/15',
  remedy: 'from-orange-200/20 to-orange-300/15',
  other: 'from-gray-400/20 to-gray-500/15'
};

export function PantryContent() {
  const searchParams = useSearchParams();
  
  // Initialize with data from localStorage to prevent empty state flash
  const [pantryItems, setPantryItems] = useState<PantryItem[]>(() => {
    if (typeof window !== 'undefined') {
      return getPantryItems();
    }
    return [];
  });
  const [recommendations, setRecommendations] = useState<RecommendedSupplement[]>(() => {
    if (typeof window !== 'undefined') {
      const existingRecs = getRecommendedSupplements();
      const pantryItemNames = getPantryItems().map(item => item.name.toLowerCase());
      return existingRecs.filter(rec => 
        !pantryItemNames.includes(rec.name.toLowerCase())
      );
    }
    return [];
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [highlightedItem, setHighlightedItem] = useState<string | null>(null);
  const [prefilledData, setPrefilledData] = useState<{name?: string; dosage?: string} | null>(null);
  
  // Hook for updating thread metadata when pantry changes
  const { onPantryChange } = useThreadMetadata();

  // Handle URL parameters
  useEffect(() => {
    const action = searchParams.get('action');
    const highlight = searchParams.get('highlight');
    const name = searchParams.get('name');
    const dosage = searchParams.get('dosage');
    
    if (action === 'add') {
      if (name || dosage) {
        setPrefilledData({ name: name || '', dosage: dosage || '' });
      }
      setShowAddModal(true);
    }
    
    if (highlight) {
      setHighlightedItem(highlight);
      // Scroll to highlighted item after a short delay
      setTimeout(() => {
        const element = document.getElementById(`pantry-item-${highlight}`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [searchParams]);
  
  useEffect(() => {
    // Only generate recommendations if none exist
    if (recommendations.length === 0 && typeof window !== 'undefined') {
      const existingRecs = getRecommendedSupplements();
      
      if (existingRecs.length === 0) {
        generateSupplementRecommendations().then(newRecs => {
          // Clear any existing recommendations first to prevent duplicates
          localStorage.setItem('thrive_recommended_supplements', '[]');
          
          // Save new recommendations
          newRecs.forEach(rec => saveRecommendedSupplement(rec));
          
          // Filter out items already in pantry
          const pantryItemNames = pantryItems.map(item => item.name.toLowerCase());
          const filteredRecs = newRecs.filter(rec => 
            !pantryItemNames.includes(rec.name.toLowerCase())
          );
          setRecommendations(filteredRecs);
        });
      }
    }
  }, [recommendations.length, pantryItems]);

  const handleAddItem = async (item: PantryItem) => {
    savePantryItem(item);
    setPantryItems([...pantryItems, item]);
    
    // Refresh recommendations to filter out newly added item
    const existingRecs = getRecommendedSupplements();
    const updatedPantryItemNames = [...pantryItems, item].map(i => i.name.toLowerCase());
    const filteredRecs = existingRecs.filter(rec => 
      !updatedPantryItemNames.includes(rec.name.toLowerCase())
    );
    setRecommendations(filteredRecs);
    
    // Update thread metadata for context awareness
    await onPantryChange();
  };

  const handleAddMultipleItems = async (items: PantryItem[]) => {
    items.forEach(item => savePantryItem(item));
    setPantryItems([...pantryItems, ...items]);
    
    // Refresh recommendations
    const existingRecs = getRecommendedSupplements();
    const updatedPantryItemNames = [...pantryItems, ...items].map(i => i.name.toLowerCase());
    const filteredRecs = existingRecs.filter(rec => 
      !updatedPantryItemNames.includes(rec.name.toLowerCase())
    );
    setRecommendations(filteredRecs);
    
    // Update thread metadata
    await onPantryChange();
  };

  const handleDeleteItem = async (itemId: string) => {
    if (confirm('Are you sure you want to remove this item from your pantry?')) {
      deletePantryItem(itemId);
      const updatedPantryItems = pantryItems.filter(item => item.id !== itemId);
      setPantryItems(updatedPantryItems);
      
      // Refresh recommendations to show items that are no longer in pantry
      const existingRecs = getRecommendedSupplements();
      const pantryItemNames = updatedPantryItems.map(item => item.name.toLowerCase());
      const filteredRecs = existingRecs.filter(rec => 
        !pantryItemNames.includes(rec.name.toLowerCase())
      );
      setRecommendations(filteredRecs);
      
      // Update thread metadata for context awareness
      await onPantryChange();
    }
  };

  const filteredItems = pantryItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTag = selectedTag === 'all' || item.tags?.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  // Get all unique tags from pantry items
  const allTags = Array.from(new Set(pantryItems.flatMap(item => item.tags || [])));

  return (
    <AppLayout
      header={{
        title: "My Pantry",
        showBackButton: true,
        backHref: "/settings",
        rightElement: (
          <button
            onClick={() => setShowAddModal(true)}
            className="text-white rounded-full p-3 shadow-md transition-all active:scale-95"
            style={{background: 'linear-gradient(to right, #e16b47, #c95534)'}}
          >
            <Plus className="w-5 h-5" />
          </button>
        )
      }}
      className="bg-gray-50"
    >
        <div className="px-4 py-6 space-y-6">
          {/* Privacy Notice - Only show when no items */}
          {pantryItems.length === 0 && (
            <div className="rounded-2xl bg-gradient-to-br from-sage-300/10 to-sage-400/5 p-4 border border-sage-400/20">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-sage-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-primary-text">Your Privacy Matters</h3>
                  <p className="text-sm text-secondary-text-thin mt-1">
                    All pantry items are stored locally on your device. We never upload or share your personal health information.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Natural Language Input - Always visible for easy adding */}
          <PantryNaturalInput 
            onAddItems={handleAddMultipleItems}
            visible={true}
          />

          {/* Search and Filter */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search your pantry..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              />
            </div>

            {/* Tag Filter - Only show if there are items with tags */}
            {allTags.length > 0 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                <button
                  onClick={() => setSelectedTag('all')}
                  className={`px-4 py-2 rounded-full font-medium transition-all active:scale-95 ${
                    selectedTag === 'all' 
                      ? 'text-white shadow-md' 
                      : 'border border-gray-300 text-gray-700 bg-white'
                  }`}
                  style={selectedTag === 'all' ? {background: 'linear-gradient(to right, #e16b47, #c95534)'} : {}}
                >
                  All Items
                </button>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`px-4 py-2 rounded-full font-medium transition-all active:scale-95 text-sm whitespace-nowrap ${
                      selectedTag === tag 
                        ? 'text-white shadow-md' 
                        : 'border border-gray-300 text-gray-700 bg-white'
                    }`}
                    style={selectedTag === tag ? {background: 'linear-gradient(to right, #e16b47, #c95534)'} : {}}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pantry Items Grid */}
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              {searchQuery || selectedTag !== 'all' ? (
                <>
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">No items found</h3>
                  <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
                </>
              ) : (
                <>
                  <OptimizedImage
                    src="/illustrations/pantry.png"
                    alt="Your wellness pantry"
                    width={192}
                    height={192}
                    className="mx-auto mb-6"
                  />
                  <h3 className="text-xl font-semibold text-primary-text mb-3">Your Wellness Pantry</h3>
                  <p className="text-secondary-text-thin max-w-md mx-auto mb-2">
                    Keep track of supplements, medicines, herbs, and remedies you have at home.
                  </p>
                  <p className="text-secondary-text-thin max-w-md mx-auto mb-8">
                    Your companion will use this private inventory to personalize recommendations just for you.
                  </p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="px-6 py-3 rounded-full text-white font-medium shadow-lg transition-all active:scale-95"
                    style={{background: 'linear-gradient(to right, #e16b47, #c95534)'}}
                  >
                    Add Your First Item
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredItems.map((item) => {
                // Determine icon based on tags
                const primaryTag = item.tags?.[0]?.toLowerCase();
                const Icon = primaryTag && categoryIcons[primaryTag as keyof typeof categoryIcons] 
                  ? categoryIcons[primaryTag as keyof typeof categoryIcons] 
                  : Package;
                const gradient = primaryTag && categoryColors[primaryTag as keyof typeof categoryColors]
                  ? categoryColors[primaryTag as keyof typeof categoryColors]
                  : categoryColors.other;
                
                return (
                  <div
                    key={item.id}
                    id={`pantry-item-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                    className={`rounded-2xl bg-white border border-gray-200 overflow-hidden hover:shadow-md transition-all ${
                      highlightedItem === item.name.toLowerCase().replace(/\s+/g, '-') ? 'ring-2 ring-red-400 animate-pulse' : ''
                    }`}
                  >
                    {/* Image or Icon */}
                    <div className={`relative h-32 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                      {item.imageUrl ? (
                        <OptimizedImage
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <Icon className="w-12 h-12 text-gray-600 opacity-50" />
                      )}
                      
                      {/* Delete button */}
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="absolute top-2 right-2 bg-white/90 w-8 h-8 rounded-lg shadow-sm transition-all active:scale-95 hover:bg-white"
                      >
                        <X className="w-5 h-5 text-gray-600 mx-auto" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-medium text-primary-text truncate">{item.name}</h3>
                      {item.notes && (
                        <p className="text-xs text-secondary-text-thin mt-1 line-clamp-2">{item.notes}</p>
                      )}
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.tags.slice(0, 2).map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
                            >
                              {tag}
                            </span>
                          ))}
                          {item.tags.length > 2 && (
                            <span className="text-xs text-gray-500">+{item.tags.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Recommended Supplements Section */}
          {recommendations.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-primary-text">Recommended Supplements</h2>
                  <p className="text-sm text-secondary-text-thin mt-1">
                    Based on your wellness journey and routines
                  </p>
                </div>
                <Sparkles className="w-5 h-5" style={{color: '#e16b47'}} />
              </div>

              <div className="space-y-3">
                {recommendations.slice(0, 3).map((rec) => (
                  <div
                    key={rec.id}
                    className="rounded-2xl bg-white p-5 border border-gray-200 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-primary-text">{rec.name}</h3>
                        <p className="text-sm text-secondary-text-thin mt-1">{rec.description}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        rec.confidence === 'high' ? 'bg-green-100 text-green-700' :
                        rec.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {rec.confidence} match
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm text-secondary-text">
                        <span className="font-medium">Why recommended:</span> {rec.recommendationReason}
                      </p>
                      
                      {rec.benefits.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {rec.benefits.slice(0, 3).map((benefit, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-3 py-1 rounded-full bg-sage-300/20 text-sage-600"
                            >
                              {benefit}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={async () => {
                        const newPantryItem: PantryItem = {
                          id: Date.now().toString(),
                          name: rec.name,
                          notes: rec.description,
                          tags: ['supplement', ...rec.benefits.map(b => b.toLowerCase().replace(/\s+/g, '-'))],
                          dateAdded: new Date().toISOString()
                        };
                        savePantryItem(newPantryItem);
                        setPantryItems([...pantryItems, newPantryItem]);
                        
                        // Remove this recommendation from the displayed list
                        setRecommendations(recommendations.filter(r => r.id !== rec.id));
                        
                        // Update thread metadata for context awareness
                        await onPantryChange();
                      }}
                      className="w-full text-left p-4 rounded-xl transition-all active:scale-98 shadow-sm border border-gray-100 mt-3 font-medium text-sm"
                      style={{background: 'linear-gradient(to right, #fef6f4, #fdeae5)', color: '#c95534'}}
                    >
                      Add to Pantry
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      {/* Add Item Modal */}
      <PantryAddModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setPrefilledData(null);
        }}
        onAddItem={handleAddItem}
        initialData={prefilledData ? {
          name: prefilledData.name,
          notes: prefilledData.dosage
        } : undefined}
      />
    </AppLayout>
  );
}