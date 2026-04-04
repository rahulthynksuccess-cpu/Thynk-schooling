/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    missingSuspenseWithCSRBailout: false,
    serverComponentsExternalPackages: ['pg', 'jsonwebtoken', 'bcryptjs'],
  },

  // ── iOS Safari cookie fix ────────────────────────────────────────────────
  // Proxy all /api/* requests through Next.js so the frontend and API share
  // the same origin. This allows the ts_refresh httpOnly cookie to be set with
  // SameSite=Lax (changed in register/login routes) instead of SameSite=Strict,
  // which iOS Safari blocks on cross-origin requests.
  //
  // HOW IT WORKS:
  //   Browser  →  thynkschooling.in/api/*
  //   Next.js  →  forwards to http://localhost:5000/api/*  (your Express backend)
  //
  // This means the browser always talks to the SAME origin for both the UI
  // and the API, so Safari's ITP and SameSite restrictions are never triggered.
  //
  // UPDATE NEXT_PUBLIC_API_URL in .env to point to the same origin:
  //   NEXT_PUBLIC_API_URL=https://thynkschooling.in/api  (production)
  //   NEXT_PUBLIC_API_URL=http://localhost:3000/api       (local dev)
  //
  async rewrites() {
    const backendUrl = process.env.BACKEND_INTERNAL_URL || 'http://localhost:5000'
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ]
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
