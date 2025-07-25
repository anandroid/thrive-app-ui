'use client';

import { useState, useEffect, useCallback } from 'react';
import Button from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/form-inputs';
import { Save, Plus, X, GripVertical } from 'lucide-react';
import { ShopSettings as ShopSettingsType } from '@/src/types/shop';
import { useToast } from '@/src/hooks/useToast';

export default function ShopSettings() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<ShopSettingsType>({
    id: 'settings',
    featuredCategories: [],
    featuredProducts: [],
    banners: [],
    affiliateDisclosure: '',
    defaultCurrency: 'USD',
    updatedAt: new Date(),
  });

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
      setSettings(data);
    } catch {
      showToast('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);


  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error('Failed to save settings');
      
      showToast('Settings saved successfully', 'success');
    } catch {
      showToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const addBanner = () => {
    const newBanner = {
      id: `banner_${Date.now()}`,
      title: '',
      subtitle: '',
      image: '',
      link: '',
      order: settings.banners.length,
      isActive: true,
    };
    setSettings({
      ...settings,
      banners: [...settings.banners, newBanner],
    });
  };

  const updateBanner = (index: number, field: string, value: unknown) => {
    const newBanners = [...settings.banners];
    newBanners[index] = { ...newBanners[index], [field]: value };
    setSettings({ ...settings, banners: newBanners });
  };

  const removeBanner = (index: number) => {
    const newBanners = settings.banners.filter((_, i) => i !== index);
    setSettings({ ...settings, banners: newBanners });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-[min(8vw,2rem)]">
        <div className="animate-spin rounded-full h-[min(8vw,2rem)] w-[min(8vw,2rem)] border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-[min(6vw,1.5rem)]">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-[min(5vw,1.25rem)] font-bold text-gray-900">
          Shop Settings
        </h2>
        <Button
          onClick={handleSave}
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
          disabled={saving}
        >
          <Save className="w-[min(4vw,1rem)] h-[min(4vw,1rem)]" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Banners Section */}
      <div className="bg-white rounded-[min(2vw,0.5rem)] shadow-sm p-[min(5vw,1.25rem)]">
        <div className="flex justify-between items-center mb-[min(4vw,1rem)]">
          <h3 className="text-[min(4vw,1rem)] font-semibold text-gray-900">
            Shop Banners
          </h3>
          <Button
            onClick={addBanner}
            variant="soft"
            springAnimation
            haptic="light"
            className="flex items-center gap-[min(2vw,0.5rem)]"
          >
            <Plus className="w-[min(3.5vw,0.875rem)] h-[min(3.5vw,0.875rem)]" />
            Add Banner
          </Button>
        </div>

        <div className="space-y-[min(3vw,0.75rem)]">
          {settings.banners.map((banner, index) => (
            <div
              key={banner.id}
              className="border border-gray-200 rounded-[min(2vw,0.5rem)] p-[min(4vw,1rem)]"
            >
              <div className="flex items-start gap-[min(3vw,0.75rem)]">
                <GripVertical className="w-[min(5vw,1.25rem)] h-[min(5vw,1.25rem)] text-gray-400 cursor-move" />
                
                <div className="flex-1 space-y-[min(3vw,0.75rem)]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-[min(3vw,0.75rem)]">
                    <Input
                      label="Title"
                      value={banner.title}
                      onChange={(e) => updateBanner(index, 'title', e.target.value)}
                      placeholder="Banner title"
                    />
                    <Input
                      label="Subtitle"
                      value={banner.subtitle}
                      onChange={(e) => updateBanner(index, 'subtitle', e.target.value)}
                      placeholder="Optional subtitle"
                    />
                  </div>
                  
                  <Input
                    label="Image URL"
                    value={banner.image}
                    onChange={(e) => updateBanner(index, 'image', e.target.value)}
                    placeholder="https://example.com/banner.jpg"
                  />
                  
                  <Input
                    label="Link URL"
                    value={banner.link}
                    onChange={(e) => updateBanner(index, 'link', e.target.value)}
                    placeholder="/shop/category"
                  />
                  
                  <label className="flex items-center gap-[min(2vw,0.5rem)]">
                    <input
                      type="checkbox"
                      checked={banner.isActive}
                      onChange={(e) => updateBanner(index, 'isActive', e.target.checked)}
                      className="w-[min(4vw,1rem)] h-[min(4vw,1rem)]"
                    />
                    <span className="text-[min(3.75vw,0.9375rem)]">Active</span>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => removeBanner(index)}
                  className="p-[min(2vw,0.5rem)] text-red-600 hover:bg-red-50 rounded-[min(2vw,0.5rem)]"
                >
                  <X className="w-[min(4vw,1rem)] h-[min(4vw,1rem)]" />
                </button>
              </div>
            </div>
          ))}
          
          {settings.banners.length === 0 && (
            <p className="text-center text-gray-500 text-[min(3.75vw,0.9375rem)] py-[min(4vw,1rem)]">
              No banners yet. Add your first banner!
            </p>
          )}
        </div>
      </div>

      {/* Affiliate Disclosure */}
      <div className="bg-white rounded-[min(2vw,0.5rem)] shadow-sm p-[min(5vw,1.25rem)]">
        <h3 className="text-[min(4vw,1rem)] font-semibold text-gray-900 mb-[min(3vw,0.75rem)]">
          Affiliate Disclosure
        </h3>
        <Textarea
          value={settings.affiliateDisclosure}
          onChange={(e) => setSettings({ ...settings, affiliateDisclosure: e.target.value })}
          rows={4}
          placeholder="We earn commissions from qualifying purchases through affiliate links..."
          helperText="This disclosure will be shown on product pages with affiliate links"
        />
      </div>

      {/* Featured Categories */}
      <div className="bg-white rounded-[min(2vw,0.5rem)] shadow-sm p-[min(5vw,1.25rem)]">
        <h3 className="text-[min(4vw,1rem)] font-semibold text-gray-900 mb-[min(3vw,0.75rem)]">
          Featured Categories
        </h3>
        <div className="flex flex-wrap gap-[min(2vw,0.5rem)]">
          {['sleep', 'stress', 'energy', 'pain', 'digestive', 'immune'].map((category) => (
            <label key={category} className="flex items-center gap-[min(1vw,0.25rem)]">
              <input
                type="checkbox"
                checked={settings.featuredCategories.includes(category)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSettings({
                      ...settings,
                      featuredCategories: [...settings.featuredCategories, category]
                    });
                  } else {
                    setSettings({
                      ...settings,
                      featuredCategories: settings.featuredCategories.filter(c => c !== category)
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

      {/* Default Currency */}
      <div className="bg-white rounded-[min(2vw,0.5rem)] shadow-sm p-[min(5vw,1.25rem)]">
        <h3 className="text-[min(4vw,1rem)] font-semibold text-gray-900 mb-[min(3vw,0.75rem)]">
          Default Currency
        </h3>
        <select
          value={settings.defaultCurrency}
          onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })}
          className="px-[min(4vw,1rem)] py-[min(2.5vw,0.625rem)] border border-gray-300 rounded-[min(2vw,0.5rem)] text-[min(3.75vw,0.9375rem)]"
        >
          <option value="USD">USD - US Dollar</option>
          <option value="EUR">EUR - Euro</option>
          <option value="GBP">GBP - British Pound</option>
          <option value="CAD">CAD - Canadian Dollar</option>
          <option value="AUD">AUD - Australian Dollar</option>
        </select>
      </div>
    </div>
  );
}