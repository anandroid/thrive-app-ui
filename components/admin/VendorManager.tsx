'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { Plus, Edit, Trash2, Store } from 'lucide-react';
import { Vendor } from '@/src/types/shop';
import VendorModal from './VendorModal';
import { useToast } from '@/src/hooks/useToast';

export default function VendorManager() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/vendors');
      if (!response.ok) throw new Error('Failed to fetch vendors');
      const data = await response.json();
      setVendors(data.vendors);
    } catch (error) {
      showToast('Failed to load vendors', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVendor = async (vendorId: string) => {
    if (!confirm('Are you sure you want to delete this vendor? All associated products will be affected.')) return;

    try {
      const response = await fetch(`/api/admin/vendors/${vendorId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete vendor');
      
      showToast('Vendor deleted successfully', 'success');
      fetchVendors();
    } catch (error) {
      showToast('Failed to delete vendor', 'error');
    }
  };

  return (
    <div className="space-y-[min(4vw,1rem)]">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-[min(5vw,1.25rem)] font-bold text-gray-900">
          Vendors ({vendors.length})
        </h2>
        <Button
          onClick={() => {
            setSelectedVendor(null);
            setShowVendorModal(true);
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
          Add Vendor
        </Button>
      </div>

      {/* Vendors List */}
      {loading ? (
        <div className="flex justify-center py-[min(8vw,2rem)]">
          <div className="animate-spin rounded-full h-[min(8vw,2rem)] w-[min(8vw,2rem)] border-b-2 border-rose-500"></div>
        </div>
      ) : vendors.length === 0 ? (
        <div className="bg-white rounded-[min(2vw,0.5rem)] shadow-sm p-[min(8vw,2rem)] text-center">
          <p className="text-gray-500 text-[min(3.75vw,0.9375rem)]">
            No vendors yet. Add your first vendor!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[min(4vw,1rem)]">
          {vendors.map((vendor) => (
            <div
              key={vendor.id}
              className="bg-white rounded-[min(2vw,0.5rem)] shadow-sm p-[min(5vw,1.25rem)] hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-[min(3vw,0.75rem)]">
                <div className="flex items-center gap-[min(3vw,0.75rem)]">
                  {vendor.logo ? (
                    <img
                      src={vendor.logo}
                      alt={vendor.name}
                      className="w-[min(12vw,3rem)] h-[min(12vw,3rem)] rounded-[min(2vw,0.5rem)] object-cover"
                    />
                  ) : (
                    <div className="w-[min(12vw,3rem)] h-[min(12vw,3rem)] bg-gray-100 rounded-[min(2vw,0.5rem)] flex items-center justify-center">
                      <Store className="w-[min(6vw,1.5rem)] h-[min(6vw,1.5rem)] text-gray-400" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-[min(4vw,1rem)] text-gray-900">
                      {vendor.name}
                    </h3>
                    <span className={`
                      inline-block mt-[min(1vw,0.25rem)]
                      px-[min(2vw,0.5rem)] py-[min(0.5vw,0.125rem)]
                      rounded-full text-[min(3vw,0.75rem)] font-medium
                      ${vendor.type === 'thrive' 
                        ? 'bg-rose-100 text-rose-700' 
                        : 'bg-blue-100 text-blue-700'
                      }
                    `}>
                      {vendor.type === 'thrive' ? 'Thrive' : 'Affiliate'}
                    </span>
                  </div>
                </div>
                
                <span className={`
                  px-[min(2vw,0.5rem)] py-[min(1vw,0.25rem)]
                  rounded-full text-[min(3vw,0.75rem)]
                  ${vendor.isActive 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
                  }
                `}>
                  {vendor.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {vendor.description && (
                <p className="text-gray-600 text-[min(3.5vw,0.875rem)] mb-[min(3vw,0.75rem)]">
                  {vendor.description}
                </p>
              )}

              {/* Vendor Details */}
              <div className="space-y-[min(1vw,0.25rem)] mb-[min(3vw,0.75rem)]">
                {vendor.type === 'affiliate' && vendor.affiliateData && (
                  <>
                    <p className="text-[min(3.25vw,0.8125rem)] text-gray-600">
                      <span className="font-medium">Program:</span> {vendor.affiliateData.programName}
                    </p>
                    <p className="text-[min(3.25vw,0.8125rem)] text-gray-600">
                      <span className="font-medium">Commission:</span> {vendor.affiliateData.commissionRate}%
                    </p>
                  </>
                )}
                {vendor.type === 'thrive' && vendor.shopifyData && (
                  <p className="text-[min(3.25vw,0.8125rem)] text-gray-600">
                    <span className="font-medium">Shopify Domain:</span> {vendor.shopifyData.domain}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-[min(2vw,0.5rem)]">
                <Button
                  onClick={() => {
                    setSelectedVendor(vendor);
                    setShowVendorModal(true);
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
                  onClick={() => handleDeleteVendor(vendor.id)}
                  variant="soft"
                  springAnimation
                  haptic="light"
                  className="flex items-center justify-center gap-[min(2vw,0.5rem)] text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-[min(3.5vw,0.875rem)] h-[min(3.5vw,0.875rem)]" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vendor Modal */}
      {showVendorModal && (
        <VendorModal
          vendor={selectedVendor}
          onClose={() => {
            setShowVendorModal(false);
            setSelectedVendor(null);
          }}
          onSave={() => {
            setShowVendorModal(false);
            setSelectedVendor(null);
            fetchVendors();
          }}
        />
      )}
    </div>
  );
}