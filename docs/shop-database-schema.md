# Shop Database Schema (Firestore)

## Collections

### 1. `vendors`
Stores information about vendors (both Thrive and affiliate partners).

```javascript
{
  id: "vendor_123",
  name: "Thrive Supplements",
  slug: "thrive-supplements",
  logo: "https://...",
  description: "Premium wellness supplements",
  type: "thrive", // or "affiliate"
  affiliateData: {
    programName: "Amazon Associates",
    commissionRate: 5.5,
    trackingId: "thrive-20"
  },
  shopifyData: {
    domain: "thrive-shop.myshopify.com",
    storefrontAccessToken: "xxx"
  },
  isActive: true,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 2. `products`
Main product catalog with support for both Thrive and affiliate products.

```javascript
{
  id: "prod_456",
  vendorId: "vendor_123",
  name: "Sleep Support Complex",
  slug: "sleep-support-complex",
  description: "Natural sleep aid...",
  shortDescription: "Promotes restful sleep",
  images: ["url1", "url2"],
  price: {
    amount: 29.99,
    currency: "USD",
    compareAtPrice: 39.99
  },
  categories: ["sleep", "supplements"],
  tags: ["melatonin", "natural", "non-habit-forming"],
  
  // Vendor-specific
  vendorType: "thrive", // or "affiliate"
  
  // For Thrive products
  shopifyProductId: "gid://shopify/Product/123",
  shopifyVariantId: "gid://shopify/ProductVariant/456",
  inventory: {
    available: 150,
    policy: "deny"
  },
  
  // For affiliate products
  affiliateUrl: "https://amazon.com/dp/...",
  affiliateId: "B08XYZ123",
  brand: "Nature's Way",
  
  // Metadata
  isActive: true,
  isFeatured: false,
  searchKeywords: ["sleep", "insomnia", "rest"],
  
  // Analytics
  viewCount: 1250,
  clickCount: 89,
  purchaseCount: 23,
  
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 3. `categories`
Product categories hierarchy.

```javascript
{
  id: "cat_sleep",
  name: "Sleep & Recovery",
  slug: "sleep-recovery",
  description: "Products for better sleep",
  parentId: null, // or "cat_wellness"
  image: "https://...",
  order: 1,
  isActive: true,
  productCount: 24,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 4. `affiliate_clicks`
Track affiliate link clicks for analytics and commission tracking.

```javascript
{
  id: "click_789",
  userId: "user_123",
  productId: "prod_456",
  vendorId: "vendor_123",
  clickedAt: Timestamp,
  ipAddress: "192.168.1.1", // hashed for privacy
  userAgent: "Mozilla/5.0...",
  referrer: "/discover",
  converted: false,
  conversionValue: null,
  conversionDate: null
}
```

### 5. `shop_settings`
Global shop configuration.

```javascript
{
  id: "settings",
  featuredCategories: ["cat_sleep", "cat_stress"],
  featuredProducts: ["prod_123", "prod_456"],
  banners: [
    {
      id: "banner_1",
      title: "New Year Sale",
      subtitle: "20% off all supplements",
      image: "https://...",
      link: "/shop/sale",
      order: 1,
      isActive: true
    }
  ],
  affiliateDisclosure: "We earn commissions from qualifying purchases...",
  defaultCurrency: "USD",
  updatedAt: Timestamp
}
```

### 6. `user_favorites`
User's saved/favorite products.

```javascript
{
  id: "user_123",
  products: ["prod_456", "prod_789"],
  updatedAt: Timestamp
}
```

### 7. `product_reviews` (Future)
Product reviews and ratings.

```javascript
{
  id: "review_123",
  productId: "prod_456",
  userId: "user_123",
  rating: 5,
  title: "Great for sleep!",
  comment: "This really helped...",
  isVerifiedPurchase: true,
  helpful: 12,
  notHelpful: 2,
  createdAt: Timestamp
}
```

## Indexes

### Required Composite Indexes

1. **Products by vendor and status**
   - Collection: `products`
   - Fields: `vendorId` (ASC), `isActive` (ASC), `createdAt` (DESC)

2. **Products by category**
   - Collection: `products`
   - Fields: `categories` (ARRAY_CONTAINS), `isActive` (ASC), `createdAt` (DESC)

3. **Featured products**
   - Collection: `products`
   - Fields: `isFeatured` (ASC), `isActive` (ASC), `order` (ASC)

4. **Affiliate clicks by user**
   - Collection: `affiliate_clicks`
   - Fields: `userId` (ASC), `clickedAt` (DESC)

5. **Product search**
   - Collection: `products`
   - Fields: `searchKeywords` (ARRAY_CONTAINS), `isActive` (ASC)

## Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Products - read only for users
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null && 
        request.auth.token.admin == true;
    }
    
    // Vendors - read only for users
    match /vendors/{vendorId} {
      allow read: if true;
      allow write: if request.auth != null && 
        request.auth.token.admin == true;
    }
    
    // Categories - read only for users
    match /categories/{categoryId} {
      allow read: if true;
      allow write: if request.auth != null && 
        request.auth.token.admin == true;
    }
    
    // Affiliate clicks - authenticated users only
    match /affiliate_clicks/{clickId} {
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         request.auth.token.admin == true);
      allow create: if request.auth != null &&
        request.auth.uid == request.resource.data.userId;
    }
    
    // User favorites
    match /user_favorites/{userId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId;
    }
    
    // Shop settings - read only
    match /shop_settings/{doc} {
      allow read: if true;
      allow write: if request.auth != null && 
        request.auth.token.admin == true;
    }
  }
}
```

## Data Flow

1. **Product Sync (Shopify → Firestore)**
   - Webhook triggers on product update
   - Cloud Function syncs to Firestore
   - Updates inventory in real-time

2. **Affiliate Click Tracking**
   - User clicks affiliate link
   - Create click record
   - Redirect to affiliate URL
   - Track conversion via pixel/API

3. **Search & Discovery**
   - Full-text search on product names/descriptions
   - Filter by category, price, vendor
   - Sort by popularity, price, newest

## Performance Considerations

1. **Caching**
   - Cache product listings for 5 minutes
   - Cache category tree for 1 hour
   - Real-time inventory updates bypass cache

2. **Pagination**
   - Default page size: 20 products
   - Use cursor-based pagination
   - Limit filters to indexed fields

3. **Denormalization**
   - Store vendor name in product doc
   - Store category names in product doc
   - Update via Cloud Functions