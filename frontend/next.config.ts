import type { NextConfig } from "next";
import withPWA from 'next-pwa'

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
  async rewrites() {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://buildsuite-backend-container:9000';
    return [
      {
        source: '/api/:path*',
        destination: `${apiBaseUrl}/api/:path*`,
      },
    ];
  },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@mui/material', '@mui/icons-material']
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  }
};

// 開発環境ではPWAを完全に無効化
export default process.env.NODE_ENV === 'development' 
  ? nextConfig 
  : withPWA({
      dest: 'public',
      register: true,
      skipWaiting: true,
      disable: false,
      runtimeCaching: [
        {
          urlPattern: /^https?:\/\/.*\/api\//,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-cache',
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 60 * 24
            }
          }
        }
      ]
    } as Parameters<typeof withPWA>[0])(nextConfig);
