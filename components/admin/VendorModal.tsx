'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/form-inputs';
import { Vendor } from '@/src/types/shop';
import { useToast } from '@/src/hooks/useToast';

interface VendorModalProps {
  vendor?: Vendor | null;
  onClose: () => void;
  onSave: () => void;
}

export default function VendorModal({ vendor, onClose, onSave }: VendorModalProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: vendor?.name || '',
    slug: vendor?.slug || '',
    logo: vendor?.logo || '',
    description: vendor?.description || '',
    type: vendor?.type || 'thrive' as 'thrive' | 'affiliate',
    isActive: vendor?.isActive ?? true,
    affiliateData: {
      programName: vendor?.affiliateData?.programName || '',
      commissionRate: vendor?.affiliateData?.commissionRate || 0,
      trackingId: vendor?.affiliateData?.trackingId || '',
    },
    shopifyData: {
      domain: vendor?.shopifyData?.domain || '',
      storefrontAccessToken: vendor?.shopifyData?.storefrontAccessToken || '',
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Generate slug from name if not provided
      const slug = formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      
      const payload = {
        ...formData,
        slug,
        affiliateData: formData.type === 'affiliate' ? formData.affiliateData : undefined,
        shopifyData: formData.type === 'thrive' ? formData.shopifyData : undefined,
      };
      
      const url = vendor 
        ? `/api/admin/vendors/${vendor.id}`
        : '/api/admin/vendors';
      
      const response = await fetch(url, {
        method: vendor ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save vendor');
      }

      showToast(
        vendor ? 'Vendor updated successfully' : 'Vendor created successfully',
        'success'
      );
      onSave();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to save vendor', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      className="w-[90vw] max-w-[600px] max-h-[90vh] overflow-y-auto"
    >
      <form onSubmit={handleSubmit} className="p-[min(5vw,1.25rem)]">
        <h2 className="text-[min(5vw,1.25rem)] font-bold mb-[min(4vw,1rem)]">
          {vendor ? 'Edit Vendor' : 'Add New Vendor'}
        </h2>

        <div className="space-y-[min(4vw,1rem)]">
          {/* Vendor Type */}
          <div>
            <label className="block text-[min(3.75vw,0.9375rem)] font-medium text-gray-700 mb-[min(1vw,0.25rem)]">
              Vendor Type
            </label>
            <div className="flex gap-[min(4vw,1rem)]">
              <label className="flex items-center gap-[min(2vw,0.5rem)]">
                <input
                  type="radio"
                  name="type"
                  value="thrive"
                  checked={formData.type === 'thrive'}
                  onChange={(e) => setFormData({ ...formData, type: 'thrive' })}
                  className="w-[min(4vw,1rem)] h-[min(4vw,1rem)]"
                />
                <span className="text-[min(3.75vw,0.9375rem)]">Thrive (Shopify)</span>
              </label>
              <label className="flex items-center gap-[min(2vw,0.5rem)]">
                <input
                  type="radio"
                  name="type"
                  value="affiliate"
                  checked={formData.type === 'affiliate'}
                  onChange={(e) => setFormData({ ...formData, type: 'affiliate' })}
                  className="w-[min(4vw,1rem)] h-[min(4vw,1rem)]"
                />
                <span className="text-[min(3.75vw,0.9375rem)]">Affiliate Partner</span>
              </label>
            </div>
          </div>

          {/* Basic Info */}
          <Input
            label="Vendor Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="URL Slug"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            placeholder="auto-generated-from-name"
            helperText="Leave empty to auto-generate from name"
          />

          <Input
            label="Logo URL"
            value={formData.logo}
            onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
            placeholder="https://example.com/logo.png"
          />

          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />

          {/* Conditional Fields based on Type */}
          {formData.type === 'affiliate' ? (
            <>
              <h3 className="text-[min(4vw,1rem)] font-semibold mt-[min(4vw,1rem)]">
                Affiliate Information
              </h3>
              
              <Input
                label="Affiliate Program Name"
                value={formData.affiliateData.programName}
                onChange={(e) => setFormData({
                  ...formData,
                  affiliateData: { ...formData.affiliateData, programName: e.target.value }
                })}
                placeholder="e.g., Amazon Associates"
                required
              />

              <Input
                label="Commission Rate (%)"
                type="number"
                step="0.1"
                value={formData.affiliateData.commissionRate}
                onChange={(e) => setFormData({
                  ...formData,
                  affiliateData: { ...formData.affiliateData, commissionRate: parseFloat(e.target.value) }
                })}
                required
              />

              <Input
                label="Tracking ID"
                value={formData.affiliateData.trackingId}
                onChange={(e) => setFormData({
                  ...formData,
                  affiliateData: { ...formData.affiliateData, trackingId: e.target.value }
                })}
                placeholder="e.g., thrive-20"
              />
            </>
          ) : (
            <>
              <h3 className="text-[min(4vw,1rem)] font-semibold mt-[min(4vw,1rem)]">
                Shopify Configuration
              </h3>
              
              <Input
                label="Shopify Domain"
                value={formData.shopifyData.domain}
                onChange={(e) => setFormData({
                  ...formData,
                  shopifyData: { ...formData.shopifyData, domain: e.target.value }
                })}
                placeholder="your-store.myshopify.com"
                required
              />

              <Input
                label="Storefront Access Token"
                type="password"
                value={formData.shopifyData.storefrontAccessToken}
                onChange={(e) => setFormData({
                  ...formData,
                  shopifyData: { ...formData.shopifyData, storefrontAccessToken: e.target.value }
                })}
                required
              />
            </>
          )}

          {/* Active Status */}
          <label className="flex items-center gap-[min(2vw,0.5rem)]">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-[min(4vw,1rem)] h-[min(4vw,1rem)]"
            />
            <span className="text-[min(3.75vw,0.9375rem)]">Active Vendor</span>
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
            {loading ? 'Saving...' : (vendor ? 'Update Vendor' : 'Create Vendor')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}