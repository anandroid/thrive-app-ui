# Thrive Shop Admin Guide

## Overview

The Thrive Shop Admin interface is a comprehensive system for managing products, vendors, and analytics for the wellness e-commerce platform. It supports both direct sales (via Shopify) and affiliate partnerships.

## Access

- **URL**: `/admin`
- **Authentication**: Requires user authentication (redirects to `/auth` if not logged in)
- **Permissions**: Currently all authenticated users have admin access (implement role-based access for production)

## Admin Interface Sections

### 1. Products Management

**Location**: `/admin` → Products tab

**Features**:
- Add/Edit/Delete products
- Manage product details (name, price, description, images)
- Set product type (Thrive or Affiliate)
- Configure Shopify integration for Thrive products
- Set affiliate URLs and tracking for partner products
- Manage inventory levels
- Toggle product active/inactive status
- Assign products to categories
- Add search keywords for better discovery

**Key Actions**:
```
- Create Product: Click "Add Product" button
- Edit Product: Click product row in table
- Delete Product: Click trash icon (with confirmation)
- Toggle Status: Use active/inactive switch
```

### 2. Vendors Management

**Location**: `/admin` → Vendors tab

**Features**:
- Add/Edit vendors (Thrive or affiliate partners)
- Configure vendor types:
  - **Thrive**: Direct sales via Shopify
  - **Affiliate**: Partner products with commission tracking
- Set vendor details (name, logo, description)
- Configure Shopify credentials for Thrive vendors
- Set affiliate program details (commission rates, tracking IDs)
- Activate/deactivate vendors

**Vendor Configuration**:
```javascript
// Thrive Vendor
{
  type: "thrive",
  shopifyData: {
    domain: "thrive-shop.myshopify.com",
    storefrontAccessToken: "xxx"
  }
}

// Affiliate Vendor
{
  type: "affiliate",
  affiliateData: {
    programName: "Amazon Associates",
    commissionRate: 5.5,
    trackingId: "thrive-20"
  }
}
```

### 3. Analytics

**Location**: `/admin` → Analytics tab

**Metrics Tracked**:
- Product views
- Click-through rates
- Conversion rates
- Revenue by product/vendor
- Affiliate click tracking
- User engagement patterns

**Reports Available**:
- Daily/Weekly/Monthly summaries
- Top performing products
- Vendor performance comparison
- Category performance
- User behavior analytics

### 4. Shop Settings

**Location**: `/admin` → Settings tab

**Configurable Options**:
- Featured products selection
- Featured categories
- Homepage banners
- Affiliate disclosure text
- Default currency
- Shop-wide announcements

## Publishing & Deployment

### Development Workflow

1. **Local Development**:
   ```bash
   npm run dev
   # Access admin at http://localhost:3000/admin
   ```

2. **Testing Changes**:
   - Make changes in admin interface
   - Changes are saved to Firestore in real-time
   - Test product display at `/shop`

3. **Deployment**:
   ```bash
   # Deploy to development
   git push origin main
   # Triggers automatic deployment to dev environment

   # Deploy to production
   git checkout release
   git merge main
   git push origin release
   # Triggers automatic deployment to production
   ```

### Database Management

**Firestore Collections**:
- `vendors` - Vendor configurations
- `products` - Product catalog
- `categories` - Product categories
- `affiliate_clicks` - Click tracking
- `shop_settings` - Global settings
- `user_favorites` - User saved products

**Security Rules**:
- Only authenticated users with admin role can write
- All users can read products/vendors/categories
- User-specific data requires authentication

## Product Management Workflow

### Adding a Thrive Product

1. **Create/Update in Shopify Admin**:
   - Add product in Shopify dashboard
   - Set pricing, variants, inventory
   - Add product images

2. **Sync to Thrive Admin**:
   - Go to Products tab
   - Click "Add Product"
   - Select vendor: "Thrive Supplements"
   - Enter Shopify Product ID
   - Fill in additional metadata
   - Save

3. **Configure Display**:
   - Set categories
   - Add search keywords
   - Mark as featured (if applicable)
   - Set active status

### Adding an Affiliate Product

1. **Get Affiliate Details**:
   - Obtain affiliate link from partner program
   - Note commission rate and tracking requirements

2. **Create in Admin**:
   - Go to Products tab
   - Click "Add Product"
   - Select affiliate vendor
   - Enter product details
   - Add affiliate URL
   - Configure tracking parameters

3. **Test Tracking**:
   - Click product in shop
   - Verify click tracking in Analytics
   - Confirm redirect works properly

## Data Management

### Import/Export

Currently manual, but you can:

1. **Export Data**:
   ```javascript
   // In browser console
   const products = await db.collection('products').get();
   const data = products.docs.map(doc => ({ id: doc.id, ...doc.data() }));
   console.log(JSON.stringify(data));
   ```

2. **Bulk Import**:
   - Prepare JSON file with products
   - Use Firestore import tools
   - Or create import script

### Backup Strategy

1. **Automated Backups**:
   - Firestore automatic daily backups
   - Configured in Google Cloud Console

2. **Manual Backups**:
   - Export collections via Firebase Admin SDK
   - Store in Cloud Storage

## Best Practices

### Product Management
- Keep product descriptions concise and benefit-focused
- Use high-quality images (optimize for web)
- Maintain consistent naming conventions
- Regular inventory updates for Thrive products
- Test all affiliate links monthly

### SEO Optimization
- Use descriptive product slugs
- Add relevant search keywords
- Write unique meta descriptions
- Include category assignments

### Performance
- Limit featured products to 6-8
- Optimize images before upload
- Use pagination for large catalogs
- Cache settings for 5 minutes

## Troubleshooting

### Common Issues

1. **Products Not Showing**:
   - Check active status
   - Verify vendor is active
   - Confirm category assignment
   - Check browser console for errors

2. **Shopify Sync Issues**:
   - Verify API credentials
   - Check Shopify product ID format
   - Ensure inventory tracking is enabled

3. **Affiliate Links Not Tracking**:
   - Verify tracking ID is correct
   - Check click recording in database
   - Test in incognito mode

### Debug Mode

Add `?debug=true` to admin URL for:
- Verbose console logging
- Network request monitoring
- Database query inspection

## Security Considerations

1. **Admin Access**:
   - Implement role-based access control
   - Add admin user verification
   - Log all admin actions

2. **API Security**:
   - Validate all inputs
   - Sanitize user data
   - Rate limit API endpoints

3. **Sensitive Data**:
   - Never expose Shopify API keys
   - Encrypt affiliate tracking IDs
   - Secure webhook endpoints

## Future Enhancements

### Planned Features
- Bulk product import/export
- Automated Shopify webhook sync
- Advanced analytics dashboard
- A/B testing for product displays
- Email notification system
- Inventory alerts
- Multi-language support

### Integration Possibilities
- CRM integration
- Email marketing platforms
- Advanced analytics (GA4, Mixpanel)
- Customer support systems
- Shipping providers

## Support & Maintenance

### Regular Tasks
- Weekly: Review analytics, update featured products
- Monthly: Audit affiliate links, check inventory
- Quarterly: Performance review, SEO audit

### Monitoring
- Set up uptime monitoring
- Configure error alerts
- Track conversion rates
- Monitor API usage

### Updates
- Keep Shopify SDK updated
- Update Firebase Admin SDK
- Review security patches
- Test after deployments