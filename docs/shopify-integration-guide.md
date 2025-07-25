# Shopify Integration Guide

## Overview
The Thrive app integrates with Shopify using the Storefront API to manage and sell Thrive's own products. This guide covers the setup and usage of the Shopify integration.

## Configuration

### Environment Variables
The following environment variables are required for Shopify integration:

```env
# Shopify Storefront API Configuration
NEXT_PUBLIC_SHOPIFY_STOREFRONT_API_TOKEN=bb354fb3f681f73155f24f0c5a47abb6
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=2g1rga-ky.myshopify.com
```

These values are stored in Google Cloud Secret Manager and automatically injected during deployment.

### Google Cloud Secrets
The Shopify credentials are stored as secrets in Google Cloud:
- `THRIVE_SHOPIFY_API_KEY`
- `THRIVE_SHOPIFY_API_SECRET_KEY`
- `THRIVE_SHOPIFY_STOREFRONT_API_TOKEN`
- `THRIVE_SHOPIFY_STORE_DOMAIN`

To copy these secrets to another project (e.g., thrive-dev):
```bash
./scripts/copy-secrets-to-dev.sh
```

## Setting Up the Default Vendor

Run the setup script to create the default Thrive Shopify vendor in Firestore:

```bash
node scripts/setup-default-shopify-vendor.js
```

This creates a vendor with ID `thrive_shopify` that will be used for all Shopify products.

## Syncing Products from Shopify

### Manual Sync
1. Navigate to Settings → Shop Admin
2. Go to the Products tab
3. Click "Sync Shopify" button

### API Endpoint
```
POST /api/admin/shopify/sync
```

This endpoint:
- Fetches up to 50 products from Shopify
- Creates or updates products in Firestore
- Maps Shopify tags to Thrive categories
- Preserves view/click analytics for existing products

## Product Features

### Automatic Mapping
- **Categories**: Shopify tags are automatically mapped to Thrive categories (sleep, stress, energy, etc.)
- **Featured Products**: Products with "featured" tag are marked as featured
- **Pricing**: Includes regular price and compare-at price for discounts
- **Inventory**: Real-time stock levels from Shopify

### Shopify Cart Integration
When a user clicks "Add to Cart" on a Thrive product:
1. Product is added to local cart state
2. If product has `shopifyVariantId`, it's also added to Shopify cart
3. Shopify cart ID and checkout URL are stored in localStorage
4. User can complete checkout on Shopify

## API Client Usage

```typescript
import { fetchProducts, createCart, addToCart } from '@/src/lib/shopify/client';

// Fetch products
const products = await fetchProducts(20); // Get 20 products

// Create a cart
const cart = await createCart([
  { merchandiseId: 'variant-id', quantity: 1 }
]);

// Add to existing cart
const updatedCart = await addToCart(cart.id, [
  { merchandiseId: 'another-variant-id', quantity: 2 }
]);
```

## Category Mapping
The sync process automatically maps Shopify tags to Thrive categories:

| Shopify Tag Keywords | Thrive Category |
|---------------------|-----------------|
| sleep               | sleep           |
| stress, anxiety     | stress          |
| energy, focus       | energy          |
| pain                | pain            |
| digestive, gut      | digestive       |
| immune, immunity    | immune          |

## Webhooks (Future Implementation)
The system is ready for webhook integration for real-time updates:
- Product updates
- Inventory changes
- Order notifications

## Troubleshooting

### Products Not Syncing
1. Verify the Shopify vendor exists: Check Firestore `vendors` collection for `thrive_shopify`
2. Check API credentials: Ensure environment variables are set correctly
3. Verify Storefront API access: Token should have `unauthenticated_read_product_listings` scope

### Cart Issues
1. Clear localStorage: `localStorage.removeItem('shopify_cart_id')`
2. Check browser console for API errors
3. Verify product has valid `shopifyVariantId`

## Security Considerations
- Storefront API token is public (safe for client-side use)
- Admin API credentials should never be exposed to client
- All admin operations require authentication
- Webhook endpoints should verify Shopify HMAC signatures