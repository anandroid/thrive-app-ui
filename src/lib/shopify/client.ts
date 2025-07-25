import { createStorefrontApiClient } from '@shopify/storefront-api-client';

// Initialize Shopify Storefront API client
export const shopifyClient = createStorefrontApiClient({
  storeDomain: process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || '2g1rga-ky.myshopify.com',
  apiVersion: '2024-10',
  publicAccessToken: process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_API_TOKEN || 'bb354fb3f681f73155f24f0c5a47abb6',
});

// GraphQL queries for products
export const PRODUCTS_QUERY = `
  query Products($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      edges {
        cursor
        node {
          id
          title
          description
          handle
          vendor
          productType
          tags
          availableForSale
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
            maxVariantPrice {
              amount
              currencyCode
            }
          }
          compareAtPriceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          images(first: 5) {
            edges {
              node {
                url
                altText
                width
                height
              }
            }
          }
          variants(first: 10) {
            edges {
              node {
                id
                title
                availableForSale
                quantityAvailable
                price {
                  amount
                  currencyCode
                }
                compareAtPrice {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;

export const PRODUCT_BY_HANDLE_QUERY = `
  query ProductByHandle($handle: String!) {
    productByHandle(handle: $handle) {
      id
      title
      description
      handle
      vendor
      productType
      tags
      availableForSale
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
      compareAtPriceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
      images(first: 10) {
        edges {
          node {
            url
            altText
            width
            height
          }
        }
      }
      variants(first: 20) {
        edges {
          node {
            id
            title
            availableForSale
            quantityAvailable
            price {
              amount
              currencyCode
            }
            compareAtPrice {
              amount
              currencyCode
            }
            selectedOptions {
              name
              value
            }
          }
        }
      }
    }
  }
`;

// Cart mutations
export const CREATE_CART_MUTATION = `
  mutation CreateCart($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
        totalQuantity
        cost {
          subtotalAmount {
            amount
            currencyCode
          }
          totalAmount {
            amount
            currencyCode
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const ADD_TO_CART_MUTATION = `
  mutation AddToCart($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        id
        checkoutUrl
        totalQuantity
        cost {
          subtotalAmount {
            amount
            currencyCode
          }
          totalAmount {
            amount
            currencyCode
          }
        }
        lines(first: 50) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  price {
                    amount
                    currencyCode
                  }
                  product {
                    title
                    handle
                  }
                }
              }
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// Helper functions
export async function fetchProducts(first = 20, after?: string) {
  try {
    const { data, errors } = await shopifyClient.request(PRODUCTS_QUERY, {
      variables: { first, after }
    });

    if (errors) {
      console.error('Shopify API errors:', errors);
      throw new Error('Failed to fetch products');
    }

    return data.products;
  } catch (error) {
    console.error('Error fetching Shopify products:', error);
    throw error;
  }
}

export async function fetchProductByHandle(handle: string) {
  try {
    const { data, errors } = await shopifyClient.request(PRODUCT_BY_HANDLE_QUERY, {
      variables: { handle }
    });

    if (errors) {
      console.error('Shopify API errors:', errors);
      throw new Error('Failed to fetch product');
    }

    return data.productByHandle;
  } catch (error) {
    console.error('Error fetching Shopify product:', error);
    throw error;
  }
}

export async function createCart(lines?: { merchandiseId: string; quantity: number }[]) {
  try {
    const { data, errors } = await shopifyClient.request(CREATE_CART_MUTATION, {
      variables: {
        input: {
          lines: lines || []
        }
      }
    });

    if (errors || data.cartCreate.userErrors.length > 0) {
      console.error('Shopify API errors:', errors || data.cartCreate.userErrors);
      throw new Error('Failed to create cart');
    }

    return data.cartCreate.cart;
  } catch (error) {
    console.error('Error creating Shopify cart:', error);
    throw error;
  }
}

export async function addToCart(cartId: string, lines: { merchandiseId: string; quantity: number }[]) {
  try {
    const { data, errors } = await shopifyClient.request(ADD_TO_CART_MUTATION, {
      variables: { cartId, lines }
    });

    if (errors || data.cartLinesAdd.userErrors.length > 0) {
      console.error('Shopify API errors:', errors || data.cartLinesAdd.userErrors);
      throw new Error('Failed to add to cart');
    }

    return data.cartLinesAdd.cart;
  } catch (error) {
    console.error('Error adding to Shopify cart:', error);
    throw error;
  }
}