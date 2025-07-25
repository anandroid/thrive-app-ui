'use client';

import { useState, useEffect } from 'react';
import ProductGrid from './ProductGrid';
import { Product, ShopSettings as ShopSettingsType } from '@/src/types/shop';
import { ChevronRight } from 'lucide-react';

declare global {
  interface Window {
    gtag?: (
      command: string,
      action: string,
      parameters: Record<string, unknown>
    ) => void;
  }
}

interface EnhancedShopProps {
  embedded?: boolean;
}

export default function EnhancedShop({ embedded = false }: EnhancedShopProps) {
  const [settings, setSettings] = useState<ShopSettingsType | null>(null);
  const [cart, setCart] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
    loadCart();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/shop/settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load shop settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCart = () => {
    const savedCart = localStorage.getItem('thrive_cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  };

  const handleAddToCart = (product: Product) => {
    const newCart = [...cart, product];
    setCart(newCart);
    localStorage.setItem('thrive_cart', JSON.stringify(newCart));
    
    // Send message to parent if embedded
    if (embedded && window.parent !== window) {
      window.parent.postMessage({
        type: 'cart-updated',
        cartCount: newCart.length,
        product: product
      }, '*');
    }
  };

  const handleAffiliateLinkClick = (product: Product) => {
    // Track in analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'affiliate_click', {
        product_id: product.id,
        product_name: product.name,
        vendor_id: product.vendorId,
        value: product.price.amount
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-[min(8vw,2rem)]">
        <div className="animate-spin rounded-full h-[min(8vw,2rem)] w-[min(8vw,2rem)] border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <div className={embedded ? '' : 'min-h-screen bg-gray-50'}>
      {/* Banners */}
      {settings?.banners && settings.banners.filter(b => b.isActive).length > 0 && (
        <div className="mb-[min(6vw,1.5rem)]">
          <div className="relative overflow-hidden rounded-[min(2vw,0.5rem)]">
            {settings.banners.filter(b => b.isActive).map((banner, index) => (
              <a
                key={banner.id}
                href={banner.link}
                className={`block relative ${index > 0 ? 'hidden' : ''}`}
              >
                <div className="aspect-[3/1] md:aspect-[4/1] relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={banner.image}
                    alt={banner.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent flex items-center">
                    <div className="p-[min(6vw,1.5rem)] text-white">
                      <h2 className="text-[min(6vw,1.5rem)] md:text-[min(8vw,2rem)] font-bold mb-[min(2vw,0.5rem)]">
                        {banner.title}
                      </h2>
                      {banner.subtitle && (
                        <p className="text-[min(4vw,1rem)] md:text-[min(5vw,1.25rem)]">
                          {banner.subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Featured Categories */}
      {settings?.featuredCategories && settings.featuredCategories.length > 0 && (
        <div className="mb-[min(6vw,1.5rem)]">
          <h2 className="text-[min(5vw,1.25rem)] font-bold text-gray-900 mb-[min(4vw,1rem)]">
            Shop by Category
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-[min(3vw,0.75rem)]">
            {settings.featuredCategories.map((categoryId) => {
              const categoryLabels: Record<string, string> = {
                sleep: 'Sleep & Recovery',
                stress: 'Stress & Anxiety',
                energy: 'Energy & Focus',
                pain: 'Pain Relief',
                digestive: 'Digestive Health',
                immune: 'Immune Support',
              };
              
              const categoryIcons: Record<string, string> = {
                sleep: '🌙',
                stress: '🧘',
                energy: '⚡',
                pain: '💊',
                digestive: '🌿',
                immune: '🛡️',
              };

              return (
                <button
                  key={categoryId}
                  onClick={() => {
                    // Scroll to product grid and set filter
                    const gridElement = document.getElementById('product-grid');
                    gridElement?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-white rounded-[min(2vw,0.5rem)] shadow-sm hover:shadow-md transition-all p-[min(4vw,1rem)] text-center group"
                >
                  <div className="text-[min(8vw,2rem)] mb-[min(2vw,0.5rem)] group-hover:scale-110 transition-transform">
                    {categoryIcons[categoryId]}
                  </div>
                  <p className="text-[min(3.5vw,0.875rem)] font-medium text-gray-700 group-hover:text-rose-600">
                    {categoryLabels[categoryId]}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Product Grid */}
      <div id="product-grid">
        <ProductGrid
          onAddToCart={handleAddToCart}
          onAffiliateLinkClick={handleAffiliateLinkClick}
        />
      </div>

      {/* Affiliate Disclosure */}
      {settings?.affiliateDisclosure && (
        <div className="mt-[min(8vw,2rem)] bg-gray-100 rounded-[min(2vw,0.5rem)] p-[min(4vw,1rem)]">
          <p className="text-[min(3.25vw,0.8125rem)] text-gray-600 text-center">
            {settings.affiliateDisclosure}
          </p>
        </div>
      )}

      {/* Floating Cart Indicator (for embedded mode) */}
      {embedded && cart.length > 0 && (
        <div className="fixed bottom-[min(4vw,1rem)] right-[min(4vw,1rem)] bg-rose-500 text-white rounded-full px-[min(4vw,1rem)] py-[min(2vw,0.5rem)] shadow-lg flex items-center gap-[min(2vw,0.5rem)]">
          <span className="text-[min(3.75vw,0.9375rem)] font-medium">
            {cart.length} items in cart
          </span>
          <ChevronRight className="w-[min(4vw,1rem)] h-[min(4vw,1rem)]" />
        </div>
      )}
    </div>
  );
}