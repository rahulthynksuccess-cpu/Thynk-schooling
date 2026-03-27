/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  env: {
    NEXT_PUBLIC_APP_NAME:        process.env.NEXT_PUBLIC_APP_NAME        || 'Thynk Schooling',
    NEXT_PUBLIC_APP_URL:         process.env.NEXT_PUBLIC_APP_URL         || 'http://localhost:3000',
    NEXT_PUBLIC_APP_ENV:         process.env.NEXT_PUBLIC_APP_ENV         || 'development',
    NEXT_PUBLIC_API_URL:         process.env.NEXT_PUBLIC_API_URL         || 'http://localhost:5000/api',
    NEXT_PUBLIC_TEST_OTP:        process.env.NEXT_PUBLIC_TEST_OTP        || '',
    NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
    NEXT_PUBLIC_CDN_URL:         process.env.NEXT_PUBLIC_CDN_URL         || '',
    NEXT_PUBLIC_S3_HOSTNAME:     process.env.NEXT_PUBLIC_S3_HOSTNAME     || '',
    NEXT_PUBLIC_GOOGLE_MAPS_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '',
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
  output: process.env.BUILD_OUTPUT === 'standalone' ? 'standalone' : undefined,
}
module.exports = nextConfig
