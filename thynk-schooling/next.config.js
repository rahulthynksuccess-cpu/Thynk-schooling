/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    missingSuspenseWithCSRBailout: false,
    serverComponentsExternalPackages: ['pg', 'jsonwebtoken', 'bcryptjs'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'randomuser.me' },
      { protocol: 'https', hostname: '*.amazonaws.com' },
      { protocol: 'https', hostname: '*.cloudfront.net' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  compress:        true,
  poweredByHeader: false,
  reactStrictMode: true,
  eslint:          { ignoreDuringBuilds: true },
  typescript:      { ignoreBuildErrors: true },
}
module.exports = nextConfig
