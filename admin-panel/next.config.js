/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Admin panel specific configuration
  basePath: process.env.NODE_ENV === 'production' ? '/admin' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/admin/' : '',

  // API rewrites for backend communication
  async rewrites() {
    return [
      {
        source: '/api/workflow/:path*',
        destination: `${
          process.env.API_BASE_URL || 'http://localhost:3002'
        }/api/admin/workflow/:path*`,
      },
      {
        source: '/api/agents/:path*',
        destination: `${
          process.env.AGENTS_API_URL || 'http://localhost:3003'
        }/api/agents/:path*`,
      },
    ];
  },

  // Environment variables for client-side
  env: {
    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3002',
    AGENTS_API_URL: process.env.AGENTS_API_URL || 'http://localhost:3003',
    ADMIN_PANEL_VERSION: '1.0.0',
  },

  // Performance optimizations
  experimental: {
    // optimizeCss: true, // Disabled due to critters module issue
  },

  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
