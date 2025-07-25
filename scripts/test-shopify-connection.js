const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function testShopifyConnection() {
  const storeDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || '2g1rga-ky.myshopify.com';
  const accessToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_API_TOKEN || 'bb354fb3f681f73155f24f0c5a47abb6';
  
  console.log('🔍 Testing Shopify connection...');
  console.log(`   Store: https://${storeDomain}`);
  console.log(`   Token: ${accessToken.substring(0, 10)}...`);
  console.log('');

  const query = `
    query TestConnection {
      shop {
        name
        primaryDomain {
          url
        }
      }
      products(first: 5) {
        edges {
          node {
            title
            handle
            id
            availableForSale
            vendor
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(`https://${storeDomain}/api/2024-10/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': accessToken,
      },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();
    
    if (data.errors) {
      console.error('❌ GraphQL Errors:', JSON.stringify(data.errors, null, 2));
    } else {
      console.log('✅ Connection successful!');
      console.log('\n📦 Shop Info:');
      console.log(`   Name: ${data.data.shop.name}`);
      console.log(`   URL: ${data.data.shop.primaryDomain.url}`);
      console.log(`   Products: ${data.data.products.edges.length} found`);
      
      if (data.data.products.edges.length > 0) {
        console.log('\n📋 Sample Products:');
        data.data.products.edges.forEach(edge => {
          console.log(`   - ${edge.node.title} (${edge.node.handle})`);
          console.log(`     ID: ${edge.node.id}`);
          console.log(`     Vendor: ${edge.node.vendor}`);
          console.log(`     Available: ${edge.node.availableForSale}`);
        });
      } else {
        console.log('\n⚠️  No products found in the store.');
        console.log('   Please add products in your Shopify admin panel.');
      }
    }
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

testShopifyConnection();