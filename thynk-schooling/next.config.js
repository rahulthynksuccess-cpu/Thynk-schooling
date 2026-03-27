/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'randomuser.me' },
      { protocol: 'https', hostname: '*.amazonaws.com' },
      {
        protocol: 'https',
        hostname: process.env.NEXT_PUBLIC_S3_HOSTNAME || 'thynkschooling.in',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    minimumCacheTTL: 60,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', 'recharts'],
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  // For Hostinger: set output to 'standalone' for Node.js server deployment
  output: process.env.BUILD_OUTPUT === 'standalone' ? 'standalone' : undefined,
}

module.exports = nextConfig
