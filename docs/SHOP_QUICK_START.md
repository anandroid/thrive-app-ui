# Thrive Shop Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### 1. Access Admin Panel
```
https://your-app-url/admin
```
Login with your authenticated account.

### 2. Add Your First Vendor

1. Go to **Vendors** tab
2. Click **"Add Vendor"**
3. Choose vendor type:
   - **Thrive** (your products via Shopify)
   - **Affiliate** (partner products)

#### For Thrive/Shopify:
```javascript
Name: "Thrive Wellness"
Type: "thrive"
Shopify Domain: "your-store.myshopify.com"
Storefront Token: "your-token-here"
```

#### For Affiliate Partner:
```javascript
Name: "Nature's Best"
Type: "affiliate"
Program: "Amazon Associates"
Commission: 5.5
Tracking ID: "thrive-20"
```

### 3. Add Your First Product

1. Go to **Products** tab
2. Click **"Add Product"**
3. Fill in:
```javascript
Name: "Sleep Support Complex"
Vendor: [Select from dropdown]
Price: 29.99
Description: "Natural sleep aid..."
Category: "Sleep & Recovery"
Type: [thrive/affiliate]

// For Thrive products:
Shopify Product ID: "gid://shopify/Product/123"

// For Affiliate products:
Affiliate URL: "https://amazon.com/dp/B08..."
```

### 4. Make It Live

Products are **live immediately** after saving!
View at: `/shop`

## 📱 Mobile Admin Access

The admin panel is fully mobile-responsive:
- Swipe between tabs
- Touch-friendly buttons
- Optimized forms

## ⚡ Quick Commands

### Deploy Changes
```bash
# To development (automatic from main branch)
git push origin main

# To production (from release branch)
git checkout release
git merge main
git push origin release
```

### Manual Deployment
```bash
# Development
./scripts/deploy-dev.sh

# Production
./scripts/deploy-prod.sh
```

## 🔥 Essential Features

### Product CTAs
- **Thrive Products**: "Add to Cart" → Shopify checkout
- **Affiliate Products**: "Buy from [Brand]" → Partner site

### Analytics Tracking
Automatic tracking for:
- Product views
- Click-throughs
- Conversions
- Revenue

### Quick Actions
- **Feature a product**: Toggle "Featured" switch
- **Deactivate product**: Toggle "Active" switch
- **Bulk edit**: Select multiple → Actions menu

## 🎯 Pro Tips

1. **Image Optimization**:
   - Use 800x800px for product images
   - JPEG for photos, PNG for graphics
   - Compress before upload

2. **SEO Keywords**:
   - Add 3-5 relevant keywords per product
   - Include common misspellings
   - Use category names as keywords

3. **Pricing Strategy**:
   - Show compare price for sales
   - Round to .99 or .00
   - Update regularly

4. **Categories**:
   - Limit to 2-3 per product
   - Use existing before creating new
   - Keep names short and clear

## 🚨 Important URLs

- **Shop**: `/shop`
- **Admin**: `/admin`
- **Dev Deploy**: https://thrive-app-ui-tjb75ol4sq-uc.a.run.app
- **Prod Deploy**: https://app.thrive.health

## 📊 Quick Analytics Check

1. Go to **Analytics** tab
2. View key metrics:
   - Today's revenue
   - Top products
   - Conversion rate
   - Active users

## 🔧 Troubleshooting

**Product not showing?**
- Check: Is vendor active?
- Check: Is product active?
- Check: Valid category assigned?

**Shopify sync issues?**
- Verify Storefront API token
- Check product ID format
- Test in Shopify GraphQL playground

**Affiliate link not working?**
- Test URL in incognito
- Verify tracking parameters
- Check click tracking in Analytics

## 💡 Need Help?

1. **Detailed Guide**: See [SHOP_ADMIN_GUIDE.md](./SHOP_ADMIN_GUIDE.md)
2. **Database Schema**: See [shop-database-schema.md](./shop-database-schema.md)
3. **Console Debugging**: Add `?debug=true` to admin URL

## 🎉 You're Ready!

Start adding products and watch your shop grow! The system handles:
- Real-time updates
- Automatic caching
- Mobile optimization
- Secure transactions

Happy selling! 🛍️