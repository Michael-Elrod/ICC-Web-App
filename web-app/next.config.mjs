/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
      optimizeCss: true
    },
    webpack: (config, { isServer }) => {
      if (!isServer && config.optimization.splitChunks) {
        config.optimization.splitChunks.cacheGroups = {
          ...(config.optimization.splitChunks.cacheGroups || {}),
          styles: {
            name: 'styles',
            test: /\.(css|scss)$/,
            chunks: 'all',
            enforce: true,
          },
        };
      }
      return config;
    },
  };
  
  export default nextConfig;