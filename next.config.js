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
  headers: async () => {
    return [
      {
        source: '/api/auth/:path*',
        headers: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Access-Control-Allow-Credentials', value: 'true' }, // Added
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' } // Modified
        ],
      }
    ]
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/api/auth/:path*',
          destination: '/api/auth/:path*'
        }
      ]
    }
  }
};

module.exports = nextConfig;