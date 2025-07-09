'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, X, Package, 
  Search, Shield, Sparkles,
  Pill, Apple, Heart
} from 'lucide-react';
import { ActionBar } from '@/components/ui/ActionBar';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { PantryAddModal } from '@/components/features/PantryAddModal';
import { PantryItem, RecommendedSupplement } from '@/src/types/pantry';
import { 
  getPantryItems, savePantryItem, deletePantryItem, 
  getRecommendedSupplements, saveRecommendedSupplement
} from '@/src/utils/pantryStorage';
import { generateSupplementRecommendations } from '@/src/services/recommendations/supplementRecommendations';

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
  remedy: 'from-rose/20 to-burgundy/15',
  other: 'from-gray-400/20 to-gray-500/15'
};

export default function PantryPage() {
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendedSupplement[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  // Removed old state variables as they're now handled by PantryAddModal

  useEffect(() => {
    const items = getPantryItems();
    setPantryItems(items);
    
    // Load existing recommendations
    const existingRecs = getRecommendedSupplements();
    
    // Generate new recommendations if none exist
    if (existingRecs.length === 0) {
      generateSupplementRecommendations().then(newRecs => {
        // Clear any existing recommendations first to prevent duplicates
        localStorage.setItem('thrive_recommended_supplements', '[]');
        
        // Save new recommendations
        newRecs.forEach(rec => saveRecommendedSupplement(rec));
        
        // Filter out items already in pantry
        const pantryItemNames = items.map(item => item.name.toLowerCase());
        const filteredRecs = newRecs.filter(rec => 
          !pantryItemNames.includes(rec.name.toLowerCase())
        );
        setRecommendations(filteredRecs);
      });
    } else {
      // Filter out items already in pantry
      const pantryItemNames = items.map(item => item.name.toLowerCase());
      const filteredRecs = existingRecs.filter(rec => 
        !pantryItemNames.includes(rec.name.toLowerCase())
      );
      setRecommendations(filteredRecs);
    }
  }, []);

  const handleAddItem = (item: PantryItem) => {
    savePantryItem(item);
    setPantryItems([...pantryItems, item]);
    
    // Refresh recommendations to filter out newly added item
    const existingRecs = getRecommendedSupplements();
    const updatedPantryItemNames = [...pantryItems, item].map(i => i.name.toLowerCase());
    const filteredRecs = existingRecs.filter(rec => 
      !updatedPantryItemNames.includes(rec.name.toLowerCase())
    );
    setRecommendations(filteredRecs);
  };

  const handleDeleteItem = (itemId: string) => {
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
    <div className="app-screen bg-gray-50">
      {/* Header */}
      <ActionBar
        title="My Pantry"
        showBackButton={true}
        backHref="/settings"
        rightElement={
          <button
            onClick={() => setShowAddModal(true)}
            className="action-bar-button bg-gradient-to-r from-rose to-burgundy text-white touch-feedback touch-manipulation"
          >
            <Plus className="w-5 h-5" />
          </button>
        }
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-6 space-y-6">
          {/* Privacy Notice - Only show when no items */}
          {pantryItems.length === 0 && (
            <div className="rounded-2xl bg-gradient-to-br from-sage-light/10 to-sage/5 p-4 border border-sage/20">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-sage-dark mt-0.5" />
                <div>
                  <h3 className="font-medium text-primary-text">Your Privacy Matters</h3>
                  <p className="text-sm text-secondary-text-thin mt-1">
                    All pantry items are stored locally on your device. We never upload or share your personal health information.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Search and Filter */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search your pantry..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose/30"
              />
            </div>

            {/* Tag Filter - Only show if there are items with tags */}
            {allTags.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                <button
                  onClick={() => setSelectedTag('all')}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    selectedTag === 'all'
                      ? 'bg-gradient-to-r from-rose to-burgundy text-white'
                      : 'bg-white text-gray-600 border border-gray-200'
                  }`}
                >
                  All Items
                </button>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      selectedTag === tag
                        ? 'bg-gradient-to-r from-rose to-burgundy text-white'
                        : 'bg-white text-gray-600 border border-gray-200'
                    }`}
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
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-rose to-burgundy text-white font-medium shadow-lg hover:shadow-xl transition-all touch-feedback touch-manipulation"
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
                    className="rounded-2xl bg-white border border-gray-200 overflow-hidden hover:shadow-md transition-all"
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
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-all touch-feedback touch-manipulation"
                      >
                        <X className="w-4 h-4 text-gray-600" />
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
                <Sparkles className="w-5 h-5 text-rose" />
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
                              className="text-xs px-3 py-1 rounded-full bg-sage-light/20 text-sage-dark"
                            >
                              {benefit}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
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
                      }}
                      className="mt-3 w-full py-2 rounded-xl bg-gradient-to-r from-rose/10 to-burgundy/10 text-burgundy font-medium text-sm hover:from-rose/20 hover:to-burgundy/20 transition-all"
                    >
                      Add to Pantry
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Item Modal */}
      <PantryAddModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddItem={handleAddItem}
      />
    </div>
  );
}