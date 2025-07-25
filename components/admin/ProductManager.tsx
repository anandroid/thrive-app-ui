'use client';

import { useState, useEffect, useCallback } from 'react';
import Button from '@/components/ui/Button';
import { Plus, Search, Edit, Trash2, ExternalLink, Package } from 'lucide-react';
import { Product } from '@/src/types/shop';
import ProductModal from './ProductModal';
import { useToast } from '@/src/hooks/useToast';

export default function ProductManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [filterVendorType, setFilterVendorType] = useState<'all' | 'thrive' | 'affiliate'>('all');
  const { showToast } = useToast();

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data.products);
    } catch {
      showToast('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);


  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete product');
      
      showToast('Product deleted successfully', 'success');
      fetchProducts();
    } catch {
      showToast('Failed to delete product', 'error');
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterVendorType === 'all' || product.vendorType === filterVendorType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-[min(4vw,1rem)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-[min(4vw,1rem)]">
        <h2 className="text-[min(5vw,1.25rem)] font-bold text-gray-900">
          Products ({filteredProducts.length})
        </h2>
        <div className="flex gap-[min(3vw,0.75rem)]">
          <Button
            onClick={async () => {
              try {
                const response = await fetch('/api/admin/shopify/sync', {
                  method: 'POST',
                });
                const data = await response.json();
                if (data.success) {
                  showToast(`${data.syncedCount} products synced from Shopify`, 'success');
                  fetchProducts();
                } else {
                  showToast(data.error || 'Failed to sync products', 'error');
                }
              } catch {
                showToast('Failed to sync products', 'error');
              }
            }}
            variant="soft"
            springAnimation
            haptic="light"
            className="flex items-center gap-[min(2vw,0.5rem)]"
          >
            <svg className="w-[min(4vw,1rem)] h-[min(4vw,1rem)]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Sync Shopify
          </Button>
          <Button
            onClick={() => {
              setSelectedProduct(null);
              setShowProductModal(true);
            }}
            variant="gradient"
            springAnimation
            gradientOverlay
            cardGlow
            haptic="medium"
            gradient={{
              from: 'rose',
              to: 'burgundy',
              activeFrom: 'rose/40',
              activeTo: 'burgundy/30'
            }}
            className="flex items-center gap-[min(2vw,0.5rem)]"
          >
            <Plus className="w-[min(4vw,1rem)] h-[min(4vw,1rem)]" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-[min(2vw,0.5rem)] shadow-sm p-[min(4vw,1rem)] space-y-[min(3vw,0.75rem)]">
        <div className="flex flex-col md:flex-row gap-[min(3vw,0.75rem)]">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-[min(3vw,0.75rem)] top-1/2 transform -translate-y-1/2 text-gray-400 w-[min(4vw,1rem)] h-[min(4vw,1rem)]" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-[min(10vw,2.5rem)] pr-[min(3vw,0.75rem)] py-[min(2.5vw,0.625rem)] border border-gray-300 rounded-[min(2vw,0.5rem)] text-[min(3.75vw,0.9375rem)]"
            />
          </div>

          {/* Filter by type */}
          <select
            value={filterVendorType}
            onChange={(e) => setFilterVendorType(e.target.value as 'all' | 'thrive' | 'affiliate')}
            className="px-[min(4vw,1rem)] py-[min(2.5vw,0.625rem)] border border-gray-300 rounded-[min(2vw,0.5rem)] text-[min(3.75vw,0.9375rem)]"
          >
            <option value="all">All Products</option>
            <option value="thrive">Thrive Products</option>
            <option value="affiliate">Affiliate Products</option>
          </select>
        </div>
      </div>

      {/* Products List */}
      {loading ? (
        <div className="flex justify-center py-[min(8vw,2rem)]">
          <div className="animate-spin rounded-full h-[min(8vw,2rem)] w-[min(8vw,2rem)] border-b-2 border-rose-500"></div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-[min(2vw,0.5rem)] shadow-sm p-[min(8vw,2rem)] text-center">
          <p className="text-gray-500 text-[min(3.75vw,0.9375rem)]">
            {searchQuery ? 'No products found matching your search.' : 'No products yet. Add your first product!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[min(4vw,1rem)]">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-[min(2vw,0.5rem)] shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Product Image */}
              <div className="aspect-square bg-gray-100 relative">
                {product.images[0] ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-[min(12vw,3rem)] h-[min(12vw,3rem)] text-gray-300" />
                  </div>
                )}
                
                {/* Vendor Type Badge */}
                <span className={`
                  absolute top-[min(2vw,0.5rem)] right-[min(2vw,0.5rem)]
                  px-[min(2vw,0.5rem)] py-[min(1vw,0.25rem)]
                  rounded-full text-[min(3vw,0.75rem)] font-medium
                  ${product.vendorType === 'thrive' 
                    ? 'bg-rose-100 text-rose-700' 
                    : 'bg-blue-100 text-blue-700'
                  }
                `}>
                  {product.vendorType === 'thrive' ? 'Thrive' : 'Affiliate'}
                </span>
              </div>

              {/* Product Info */}
              <div className="p-[min(4vw,1rem)]">
                <h3 className="font-semibold text-[min(4vw,1rem)] text-gray-900 mb-[min(1vw,0.25rem)]">
                  {product.name}
                </h3>
                <p className="text-gray-600 text-[min(3.5vw,0.875rem)] mb-[min(2vw,0.5rem)] line-clamp-2">
                  {product.shortDescription || product.description}
                </p>
                
                {/* Price */}
                <div className="flex items-center gap-[min(2vw,0.5rem)] mb-[min(3vw,0.75rem)]">
                  <span className="text-[min(4.5vw,1.125rem)] font-bold text-gray-900">
                    ${product.price.amount}
                  </span>
                  {product.price.compareAtPrice && (
                    <span className="text-[min(3.5vw,0.875rem)] text-gray-400 line-through">
                      ${product.price.compareAtPrice}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-[min(2vw,0.5rem)]">
                  <Button
                    onClick={() => {
                      setSelectedProduct(product);
                      setShowProductModal(true);
                    }}
                    variant="soft"
                    springAnimation
                    haptic="light"
                    className="flex-1 flex items-center justify-center gap-[min(2vw,0.5rem)]"
                  >
                    <Edit className="w-[min(3.5vw,0.875rem)] h-[min(3.5vw,0.875rem)]" />
                    Edit
                  </Button>
                  
                  <Button
                    onClick={() => handleDeleteProduct(product.id)}
                    variant="soft"
                    springAnimation
                    haptic="light"
                    className="flex items-center justify-center gap-[min(2vw,0.5rem)] text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-[min(3.5vw,0.875rem)] h-[min(3.5vw,0.875rem)]" />
                  </Button>

                  {product.affiliateUrl && (
                    <a
                      href={product.affiliateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center p-[min(2vw,0.5rem)] text-gray-600 hover:text-gray-900"
                    >
                      <ExternalLink className="w-[min(3.5vw,0.875rem)] h-[min(3.5vw,0.875rem)]" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <ProductModal
          product={selectedProduct}
          onClose={() => {
            setShowProductModal(false);
            setSelectedProduct(null);
          }}
          onSave={() => {
            setShowProductModal(false);
            setSelectedProduct(null);
            fetchProducts();
          }}
        />
      )}
    </div>
  );
}