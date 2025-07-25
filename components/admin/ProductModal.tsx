'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/form-inputs';
import { X, Upload, Plus } from 'lucide-react';
import { Product, CreateProductRequest, Vendor } from '@/src/types/shop';
import { useToast } from '@/src/hooks/useToast';

interface ProductModalProps {
  product?: Product | null;
  onClose: () => void;
  onSave: () => void;
}

export default function ProductModal({ product, onClose, onSave }: ProductModalProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [formData, setFormData] = useState<CreateProductRequest>({
    vendorId: product?.vendorId || '',
    name: product?.name || '',
    description: product?.description || '',
    shortDescription: product?.shortDescription || '',
    images: product?.images || [],
    price: product?.price || { amount: 0, currency: 'USD' },
    categories: product?.categories || [],
    tags: product?.tags || [],
    vendorType: product?.vendorType || 'thrive',
    shopifyProductId: product?.shopifyProductId || '',
    shopifyVariantId: product?.shopifyVariantId || '',
    affiliateUrl: product?.affiliateUrl || '',
    brand: product?.brand || '',
    isFeatured: product?.isFeatured || false,
    searchKeywords: product?.searchKeywords || [],
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await fetch('/api/admin/vendors');
      if (!response.ok) throw new Error('Failed to fetch vendors');
      const data = await response.json();
      setVendors(data.vendors);
    } catch (error) {
      showToast('Failed to load vendors', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const url = product 
        ? `/api/admin/products/${product.id}`
        : '/api/admin/products';
      
      const response = await fetch(url, {
        method: product ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save product');
      }

      showToast(
        product ? 'Product updated successfully' : 'Product created successfully',
        'success'
      );
      onSave();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to save product', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // TODO: Implement image upload to storage
    showToast('Image upload not implemented yet', 'info');
  };

  const selectedVendor = vendors.find(v => v.id === formData.vendorId);

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      className="w-[90vw] max-w-[800px] max-h-[90vh] overflow-y-auto"
    >
      <form onSubmit={handleSubmit} className="p-[min(5vw,1.25rem)]">
        <h2 className="text-[min(5vw,1.25rem)] font-bold mb-[min(4vw,1rem)]">
          {product ? 'Edit Product' : 'Add New Product'}
        </h2>

        <div className="space-y-[min(4vw,1rem)]">
          {/* Vendor Selection */}
          <div>
            <label className="block text-[min(3.75vw,0.9375rem)] font-medium text-gray-700 mb-[min(1vw,0.25rem)]">
              Vendor
            </label>
            <select
              value={formData.vendorId}
              onChange={(e) => {
                const vendor = vendors.find(v => v.id === e.target.value);
                setFormData({
                  ...formData,
                  vendorId: e.target.value,
                  vendorType: vendor?.type || 'thrive'
                });
              }}
              className="w-full px-[min(3vw,0.75rem)] py-[min(2.5vw,0.625rem)] border border-gray-300 rounded-[min(2vw,0.5rem)] text-[min(3.75vw,0.9375rem)]"
              required
            >
              <option value="">Select a vendor</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name} ({vendor.type})
                </option>
              ))}
            </select>
          </div>

          {/* Product Name */}
          <Input
            label="Product Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          {/* Short Description */}
          <Input
            label="Short Description"
            value={formData.shortDescription}
            onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
            placeholder="Brief product description for listings"
          />

          {/* Description */}
          <Textarea
            label="Full Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            required
          />

          {/* Images */}
          <div>
            <label className="block text-[min(3.75vw,0.9375rem)] font-medium text-gray-700 mb-[min(2vw,0.5rem)]">
              Product Images
            </label>
            <div className="grid grid-cols-3 gap-[min(2vw,0.5rem)]">
              {formData.images.map((image, index) => (
                <div key={index} className="relative aspect-square bg-gray-100 rounded-[min(2vw,0.5rem)]">
                  <img src={image} alt="" className="w-full h-full object-cover rounded-[min(2vw,0.5rem)]" />
                  <button
                    type="button"
                    onClick={() => {
                      const newImages = [...formData.images];
                      newImages.splice(index, 1);
                      setFormData({ ...formData, images: newImages });
                    }}
                    className="absolute top-[min(1vw,0.25rem)] right-[min(1vw,0.25rem)] bg-red-500 text-white rounded-full p-[min(1vw,0.25rem)]"
                  >
                    <X className="w-[min(3vw,0.75rem)] h-[min(3vw,0.75rem)]" />
                  </button>
                </div>
              ))}
              
              <label className="aspect-square bg-gray-100 rounded-[min(2vw,0.5rem)] border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-50">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Upload className="w-[min(6vw,1.5rem)] h-[min(6vw,1.5rem)] text-gray-400" />
              </label>
            </div>
          </div>

          {/* Price */}
          <div className="grid grid-cols-2 gap-[min(3vw,0.75rem)]">
            <Input
              label="Price"
              type="number"
              step="0.01"
              value={formData.price.amount}
              onChange={(e) => setFormData({
                ...formData,
                price: { ...formData.price, amount: parseFloat(e.target.value) }
              })}
              required
            />
            <Input
              label="Compare at Price"
              type="number"
              step="0.01"
              value={formData.price.compareAtPrice || ''}
              onChange={(e) => setFormData({
                ...formData,
                price: { ...formData.price, compareAtPrice: e.target.value ? parseFloat(e.target.value) : undefined }
              })}
            />
          </div>

          {/* Categories */}
          <div>
            <label className="block text-[min(3.75vw,0.9375rem)] font-medium text-gray-700 mb-[min(1vw,0.25rem)]">
              Categories
            </label>
            <div className="flex flex-wrap gap-[min(2vw,0.5rem)]">
              {['sleep', 'stress', 'energy', 'pain', 'digestive', 'immune'].map((category) => (
                <label key={category} className="flex items-center gap-[min(1vw,0.25rem)]">
                  <input
                    type="checkbox"
                    checked={formData.categories.includes(category)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, categories: [...formData.categories, category] });
                      } else {
                        setFormData({ 
                          ...formData, 
                          categories: formData.categories.filter(c => c !== category) 
                        });
                      }
                    }}
                    className="w-[min(4vw,1rem)] h-[min(4vw,1rem)]"
                  />
                  <span className="text-[min(3.75vw,0.9375rem)] capitalize">{category}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Vendor-specific fields */}
          {selectedVendor?.type === 'thrive' ? (
            <>
              <Input
                label="Shopify Product ID"
                value={formData.shopifyProductId}
                onChange={(e) => setFormData({ ...formData, shopifyProductId: e.target.value })}
                placeholder="gid://shopify/Product/123"
              />
              <Input
                label="Shopify Variant ID"
                value={formData.shopifyVariantId}
                onChange={(e) => setFormData({ ...formData, shopifyVariantId: e.target.value })}
                placeholder="gid://shopify/ProductVariant/456"
              />
            </>
          ) : (
            <>
              <Input
                label="Affiliate URL"
                value={formData.affiliateUrl}
                onChange={(e) => setFormData({ ...formData, affiliateUrl: e.target.value })}
                placeholder="https://amazon.com/dp/..."
                required
              />
              <Input
                label="Brand"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />
            </>
          )}

          {/* Featured */}
          <label className="flex items-center gap-[min(2vw,0.5rem)]">
            <input
              type="checkbox"
              checked={formData.isFeatured}
              onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
              className="w-[min(4vw,1rem)] h-[min(4vw,1rem)]"
            />
            <span className="text-[min(3.75vw,0.9375rem)]">Featured Product</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-[min(3vw,0.75rem)] mt-[min(6vw,1.5rem)]">
          <Button
            type="button"
            onClick={onClose}
            variant="soft"
            springAnimation
            haptic="light"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
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
            className="flex-1"
            disabled={loading}
          >
            {loading ? 'Saving...' : (product ? 'Update Product' : 'Create Product')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}