/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // PWAとService Workerを無効化
  experimental: {
    workerThreads: false,
  },
  serverExternalPackages: [],
  // 開発時のタイムアウトを延長
  devIndicators: {
    buildActivity: false,
    buildActivityPosition: 'bottom-right',
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

export default nextConfig
