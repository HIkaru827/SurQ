import withPWA from 'next-pwa'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export configuration disabled to support API routes
  // output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  // basePath: process.env.NODE_ENV === 'production' ? '' : undefined,
  // assetPrefix: process.env.NODE_ENV === 'production' ? 'https://surq.net' : undefined,
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.gstatic.com https://www.googleapis.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://firestore.googleapis.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://www.google-analytics.com https://analytics.google.com;"
          }
        ]
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production' ? 'https://surq.net' : 'http://localhost:3007'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization'
          }
        ]
      }
    ]
  },
  eslint: {
    // Enable build error checking for production
    ignoreDuringBuilds: process.env.NODE_ENV === 'development',
  },
  typescript: {
    // Enable type checking for production
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
  images: {
    unoptimized: true,
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // PWA settings
  experimental: {
    workerThreads: false,
  },
  serverExternalPackages: [],
  // 開発時のタイムアウトを延長
  devIndicators: {
    position: 'bottom-left',
  },
  webpack: (config, { dev, isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    
    // 開発時の設定を最適化
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
      // タイムアウト設定
      config.stats = 'errors-warnings'
    }
    
    return config
  },
}

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // Enable PWA in production
  runtimeCaching: [
    // Static assets
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-cache',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
        }
      }
    },
    // Firebase auth and read operations only
    {
      urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*\?.*alt=json.*$/i,
      handler: 'NetworkFirst',
      method: 'GET',
      options: {
        cacheName: 'firestore-read-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 2 // 2 minutes only
        }
      }
    },
    // API routes - Never cache POST/PUT/DELETE requests
    {
      urlPattern: /^https:\/\/surq\.net\/api\/.*$/i,
      handler: 'NetworkOnly', // Always go to network
      method: 'POST'
    },
    {
      urlPattern: /^https:\/\/surq\.net\/api\/.*$/i,
      handler: 'NetworkOnly', // Always go to network
      method: 'PUT'
    },
    {
      urlPattern: /^https:\/\/surq\.net\/api\/.*$/i,
      handler: 'NetworkOnly', // Always go to network
      method: 'DELETE'
    },
    // API GET requests can use NetworkFirst but with very short cache
    {
      urlPattern: /^https:\/\/surq\.net\/api\/.*$/i,
      handler: 'NetworkFirst',
      method: 'GET',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 60 // 1 minute only
        }
      }
    }
  ]
})(nextConfig)
