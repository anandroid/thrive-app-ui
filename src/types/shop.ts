export interface Vendor {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  type: 'thrive' | 'affiliate';
  affiliateData?: {
    programName: string;
    commissionRate: number;
    trackingId?: string;
  };
  shopifyData?: {
    domain: string;
    storefrontAccessToken: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  vendorId: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  images: string[];
  price: {
    amount: number;
    currency: string;
    compareAtPrice?: number;
  };
  categories: string[];
  tags: string[];
  
  // Vendor-specific data
  vendorType: 'thrive' | 'affiliate';
  
  // For Thrive products (Shopify)
  shopifyProductId?: string;
  shopifyVariantId?: string;
  inventory?: {
    available: number;
    policy: 'deny' | 'continue';
  };
  
  // For affiliate products
  affiliateUrl?: string;
  affiliateId?: string;
  brand?: string;
  
  // Metadata
  isActive: boolean;
  isFeatured: boolean;
  searchKeywords?: string[];
  metadata?: Record<string, unknown>;
  
  // Analytics
  viewCount: number;
  clickCount: number;
  purchaseCount: number;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  image?: string;
  order: number;
  isActive: boolean;
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AffiliateClick {
  id: string;
  userId: string;
  productId: string;
  vendorId: string;
  clickedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  converted: boolean;
  conversionValue?: number;
  conversionDate?: Date;
}

export interface ShopSettings {
  id: string;
  featuredCategories: string[];
  featuredProducts: string[];
  banners: {
    id: string;
    title: string;
    subtitle?: string;
    image: string;
    link: string;
    order: number;
    isActive: boolean;
  }[];
  affiliateDisclosure: string;
  defaultCurrency: string;
  updatedAt: Date;
}

// Request/Response types for API
export interface CreateProductRequest {
  vendorId: string;
  name: string;
  description: string;
  shortDescription?: string;
  images: string[];
  price: {
    amount: number;
    currency: string;
    compareAtPrice?: number;
  };
  categories: string[];
  tags: string[];
  vendorType: 'thrive' | 'affiliate';
  shopifyProductId?: string;
  shopifyVariantId?: string;
  affiliateUrl?: string;
  affiliateId?: string;
  brand?: string;
  isFeatured?: boolean;
  searchKeywords?: string[];
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  isActive?: boolean;
}

export interface ProductFilter {
  vendorId?: string;
  categories?: string[];
  tags?: string[];
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  searchQuery?: string;
  vendorType?: 'thrive' | 'affiliate';
}

export interface ProductListResponse {
  products: Product[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

// Shopify integration types
export interface ShopifyProduct {
  id: string;
  title: string;
  description: string;
  handle: string;
  vendor: string;
  productType: string;
  tags: string[];
  images: {
    edges: Array<{
      node: {
        url: string;
        altText?: string;
      };
    }>;
  };
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  variants: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        price: {
          amount: string;
          currencyCode: string;
        };
        availableForSale: boolean;
        quantityAvailable?: number;
      };
    }>;
  };
}

// Admin UI types
export interface AdminProduct extends Product {
  syncStatus?: 'synced' | 'pending' | 'error';
  lastSyncedAt?: Date;
  syncError?: string;
}

export interface VendorStats {
  totalProducts: number;
  activeProducts: number;
  totalViews: number;
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  revenue: number;
}