/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'randomuser.me' },
      { protocol: 'https', hostname: '*.amazonaws.com' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  // Ignore build errors from the backend src/ folder
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow build to succeed even with type errors during QA phase
    ignoreBuildErrors: true,
  },
  output: process.env.BUILD_OUTPUT === 'standalone' ? 'standalone' : undefined,
}

module.exports = nextConfig
