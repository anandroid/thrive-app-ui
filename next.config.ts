import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  
  // Disable source maps in production
  productionBrowserSourceMaps: false,
  
  // Webpack configuration to ignore certain warnings
  webpack: (config, { dev, isServer }) => {
    // Ignore Chrome DevTools requests in development
    if (dev && !isServer) {
      config.ignoreWarnings = [
        /Failed to parse source map/,
        /\.well-known/
      ];
    }
    
    return config;
  },
};

export default nextConfig;
