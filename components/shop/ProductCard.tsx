'use client';

import { useState } from 'react';
import { Product } from '@/src/types/shop';
import Button from '@/components/ui/Button';
import { ShoppingCart, ExternalLink, Package } from 'lucide-react';
import { useToast } from '@/src/hooks/useToast';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onAffiliateLinkClick?: (product: Product) => void;
}

export default function ProductCard({ product, onAddToCart, onAffiliateLinkClick }: ProductCardProps) {
  const { showToast } = useToast();
  const [imageError, setImageError] = useState(false);

  const handleCTAClick = async () => {
    if (product.vendorType === 'thrive') {
      // Add to cart for Thrive products
      if (onAddToCart) {
        onAddToCart(product);
        showToast(`${product.name} added to cart!`, 'success');
      }
    } else {
      // Track affiliate click and open link
      if (onAffiliateLinkClick) {
        onAffiliateLinkClick(product);
      }
      
      // Track click analytics
      try {
        await fetch('/api/shop/track-click', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: product.id,
            vendorId: product.vendorId,
            type: 'affiliate'
          })
        });
      } catch (error) {
        console.error('Failed to track click:', error);
      }

      // Open affiliate link in new tab
      if (product.affiliateUrl) {
        window.open(product.affiliateUrl, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const discountPercentage = product.price.compareAtPrice
    ? Math.round(((product.price.compareAtPrice - product.price.amount) / product.price.compareAtPrice) * 100)
    : 0;

  return (
    <div className="bg-white rounded-[min(2vw,0.5rem)] shadow-sm hover:shadow-md transition-all duration-200">
      {/* Product Image */}
      <div className="aspect-square bg-gray-100 relative overflow-hidden rounded-t-[min(2vw,0.5rem)]">
        {product.images[0] && !imageError ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-[min(12vw,3rem)] h-[min(12vw,3rem)] text-gray-300" />
          </div>
        )}
        
        {/* Discount Badge */}
        {discountPercentage > 0 && (
          <span className="absolute top-[min(2vw,0.5rem)] left-[min(2vw,0.5rem)] bg-red-500 text-white px-[min(2vw,0.5rem)] py-[min(1vw,0.25rem)] rounded-full text-[min(3vw,0.75rem)] font-medium">
            -{discountPercentage}%
          </span>
        )}

        {/* Featured Badge */}
        {product.isFeatured && (
          <span className="absolute top-[min(2vw,0.5rem)] right-[min(2vw,0.5rem)] bg-yellow-400 text-gray-900 px-[min(2vw,0.5rem)] py-[min(1vw,0.25rem)] rounded-full text-[min(3vw,0.75rem)] font-medium">
            Featured
          </span>
        )}
      </div>

      {/* Product Info */}
      <div className="p-[min(4vw,1rem)]">
        {/* Brand (for affiliate products) */}
        {product.brand && (
          <p className="text-[min(3vw,0.75rem)] text-gray-500 uppercase tracking-wide mb-[min(1vw,0.25rem)]">
            {product.brand}
          </p>
        )}

        {/* Product Name */}
        <h3 className="font-semibold text-[min(4vw,1rem)] text-gray-900 mb-[min(2vw,0.5rem)] line-clamp-2">
          {product.name}
        </h3>

        {/* Short Description */}
        {product.shortDescription && (
          <p className="text-[min(3.5vw,0.875rem)] text-gray-600 mb-[min(3vw,0.75rem)] line-clamp-2">
            {product.shortDescription}
          </p>
        )}

        {/* Price */}
        <div className="flex items-center gap-[min(2vw,0.5rem)] mb-[min(4vw,1rem)]">
          <span className="text-[min(5vw,1.25rem)] font-bold text-gray-900">
            ${product.price.amount.toFixed(2)}
          </span>
          {product.price.compareAtPrice && (
            <span className="text-[min(3.5vw,0.875rem)] text-gray-400 line-through">
              ${product.price.compareAtPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* CTA Button */}
        <Button
          onClick={handleCTAClick}
          variant="gradient"
          springAnimation
          gradientOverlay
          cardGlow
          haptic="medium"
          gradient={product.vendorType === 'thrive' ? {
            from: 'rose',
            to: 'burgundy',
            activeFrom: 'rose/40',
            activeTo: 'burgundy/30'
          } : {
            from: 'blue',
            to: 'indigo',
            activeFrom: 'blue/40',
            activeTo: 'indigo/30'
          }}
          className="w-full flex items-center justify-center gap-[min(2vw,0.5rem)]"
        >
          {product.vendorType === 'thrive' ? (
            <>
              <ShoppingCart className="w-[min(4vw,1rem)] h-[min(4vw,1rem)]" />
              Add to Cart
            </>
          ) : (
            <>
              Buy from {product.brand || 'Partner'}
              <ExternalLink className="w-[min(3.5vw,0.875rem)] h-[min(3.5vw,0.875rem)]" />
            </>
          )}
        </Button>

        {/* Affiliate Disclaimer */}
        {product.vendorType === 'affiliate' && (
          <p className="text-[min(2.75vw,0.6875rem)] text-gray-500 mt-[min(2vw,0.5rem)] text-center">
            Affiliate link - We earn a commission
          </p>
        )}
      </div>
    </div>
  );
}