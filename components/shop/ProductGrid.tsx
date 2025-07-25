'use client';

import { useState, useEffect, useCallback } from 'react';
import { Product, ProductFilter } from '@/src/types/shop';
import ProductCard from './ProductCard';
import { Search, Filter, X } from 'lucide-react';
import Button from '@/components/ui/Button';

interface ProductGridProps {
  initialFilter?: ProductFilter;
  onAddToCart?: (product: Product) => void;
  onAffiliateLinkClick?: (product: Product) => void;
}

export default function ProductGrid({ 
  onAddToCart, 
  onAffiliateLinkClick 
}: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [vendorTypeFilter, setVendorTypeFilter] = useState<'all' | 'thrive' | 'affiliate'>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-low' | 'price-high' | 'newest'>('featured');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const categories = [
    { id: 'sleep', label: 'Sleep & Recovery' },
    { id: 'stress', label: 'Stress & Anxiety' },
    { id: 'energy', label: 'Energy & Focus' },
    { id: 'pain', label: 'Pain Relief' },
    { id: 'digestive', label: 'Digestive Health' },
    { id: 'immune', label: 'Immune Support' },
  ];

  const fetchProducts = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: reset ? '1' : page.toString(),
        pageSize: '12',
        isActive: 'true',
      });
      
      if (selectedCategory) params.append('category', selectedCategory);
      if (vendorTypeFilter !== 'all') params.append('vendorType', vendorTypeFilter);
      if (searchQuery) params.append('search', searchQuery);
      
      // Apply sort
      switch (sortBy) {
        case 'price-low':
          params.append('sortBy', 'price');
          params.append('sortOrder', 'asc');
          break;
        case 'price-high':
          params.append('sortBy', 'price');
          params.append('sortOrder', 'desc');
          break;
        case 'newest':
          params.append('sortBy', 'createdAt');
          params.append('sortOrder', 'desc');
          break;
        case 'featured':
        default:
          params.append('sortBy', 'featured');
          break;
      }
      
      const response = await fetch(`/api/shop/products?${params}`);
      if (!response.ok) throw new Error('Failed to fetch products');
      
      const data = await response.json();
      
      if (reset) {
        setProducts(data.products);
        setPage(1);
      } else {
        setProducts(prev => [...prev, ...data.products]);
      }
      
      setHasMore(data.hasMore || false);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  }, [page, selectedCategory, vendorTypeFilter, sortBy, searchQuery]);

  useEffect(() => {
    fetchProducts(true);
  }, [fetchProducts]);


  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts(true);
  }, [fetchProducts]);

  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price.amount - b.price.amount;
      case 'price-high':
        return b.price.amount - a.price.amount;
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'featured':
      default:
        return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
    }
  });

  const filteredProducts = sortedProducts.filter(product => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return product.name.toLowerCase().includes(query) ||
             product.description.toLowerCase().includes(query) ||
             product.brand?.toLowerCase().includes(query);
    }
    return true;
  });

  return (
    <div className="space-y-[min(4vw,1rem)]">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-[min(3vw,0.75rem)] top-1/2 transform -translate-y-1/2 text-gray-400 w-[min(4vw,1rem)] h-[min(4vw,1rem)]" />
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-[min(10vw,2.5rem)] pr-[min(3vw,0.75rem)] py-[min(3vw,0.75rem)] border border-gray-300 rounded-[min(2vw,0.5rem)] text-[min(3.75vw,0.9375rem)]"
        />
      </form>

      {/* Filters Toggle (Mobile) */}
      <div className="md:hidden">
        <Button
          onClick={() => setShowFilters(!showFilters)}
          variant="soft"
          springAnimation
          haptic="light"
          className="flex items-center gap-[min(2vw,0.5rem)]"
        >
          <Filter className="w-[min(4vw,1rem)] h-[min(4vw,1rem)]" />
          Filters {selectedCategory || vendorTypeFilter !== 'all' ? '(Active)' : ''}
        </Button>
      </div>

      {/* Filters Section */}
      <div className={`${showFilters ? 'block' : 'hidden'} md:block bg-white rounded-[min(2vw,0.5rem)] shadow-sm p-[min(4vw,1rem)] space-y-[min(3vw,0.75rem)]`}>
        <div className="flex flex-col md:flex-row gap-[min(3vw,0.75rem)]">
          {/* Category Filter */}
          <div className="flex-1">
            <label className="block text-[min(3.5vw,0.875rem)] font-medium text-gray-700 mb-[min(2vw,0.5rem)]">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-[min(3vw,0.75rem)] py-[min(2.5vw,0.625rem)] border border-gray-300 rounded-[min(2vw,0.5rem)] text-[min(3.75vw,0.9375rem)]"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Vendor Type Filter */}
          <div className="flex-1">
            <label className="block text-[min(3.5vw,0.875rem)] font-medium text-gray-700 mb-[min(2vw,0.5rem)]">
              Product Type
            </label>
            <select
              value={vendorTypeFilter}
              onChange={(e) => setVendorTypeFilter(e.target.value as 'all' | 'thrive' | 'affiliate')}
              className="w-full px-[min(3vw,0.75rem)] py-[min(2.5vw,0.625rem)] border border-gray-300 rounded-[min(2vw,0.5rem)] text-[min(3.75vw,0.9375rem)]"
            >
              <option value="all">All Products</option>
              <option value="thrive">Thrive Products</option>
              <option value="affiliate">Partner Products</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex-1">
            <label className="block text-[min(3.5vw,0.875rem)] font-medium text-gray-700 mb-[min(2vw,0.5rem)]">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'featured' | 'price-low' | 'price-high' | 'newest')}
              className="w-full px-[min(3vw,0.75rem)] py-[min(2.5vw,0.625rem)] border border-gray-300 rounded-[min(2vw,0.5rem)] text-[min(3.75vw,0.9375rem)]"
            >
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Active Filters */}
        {(selectedCategory || vendorTypeFilter !== 'all') && (
          <div className="flex flex-wrap gap-[min(2vw,0.5rem)] pt-[min(2vw,0.5rem)] border-t">
            {selectedCategory && (
              <span className="inline-flex items-center gap-[min(1vw,0.25rem)] bg-gray-100 px-[min(3vw,0.75rem)] py-[min(1.5vw,0.375rem)] rounded-full text-[min(3.25vw,0.8125rem)]">
                {categories.find(c => c.id === selectedCategory)?.label}
                <button
                  onClick={() => setSelectedCategory('')}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-[min(3vw,0.75rem)] h-[min(3vw,0.75rem)]" />
                </button>
              </span>
            )}
            {vendorTypeFilter !== 'all' && (
              <span className="inline-flex items-center gap-[min(1vw,0.25rem)] bg-gray-100 px-[min(3vw,0.75rem)] py-[min(1.5vw,0.375rem)] rounded-full text-[min(3.25vw,0.8125rem)]">
                {vendorTypeFilter === 'thrive' ? 'Thrive Only' : 'Partners Only'}
                <button
                  onClick={() => setVendorTypeFilter('all')}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-[min(3vw,0.75rem)] h-[min(3vw,0.75rem)]" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Products Grid */}
      {loading && products.length === 0 ? (
        <div className="flex justify-center py-[min(8vw,2rem)]">
          <div className="animate-spin rounded-full h-[min(8vw,2rem)] w-[min(8vw,2rem)] border-b-2 border-rose-500"></div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-[min(8vw,2rem)]">
          <p className="text-gray-500 text-[min(4vw,1rem)]">
            No products found matching your criteria.
          </p>
          <Button
            onClick={() => {
              setSelectedCategory('');
              setVendorTypeFilter('all');
              setSearchQuery('');
            }}
            variant="soft"
            springAnimation
            haptic="light"
            className="mt-[min(4vw,1rem)]"
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[min(4vw,1rem)]">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
                onAffiliateLinkClick={onAffiliateLinkClick}
              />
            ))}
          </div>

          {/* Load More */}
          {hasMore && !loading && (
            <div className="text-center pt-[min(4vw,1rem)]">
              <Button
                onClick={() => {
                  setPage(page + 1);
                  fetchProducts();
                }}
                variant="soft"
                springAnimation
                haptic="light"
              >
                Load More Products
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}