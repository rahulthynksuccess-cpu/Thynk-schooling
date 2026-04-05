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
    return [
      // ── Auth ────────────────────────────────────────────────────────────────
      { source: '/api/auth/login-mobile',    destination: '/api/auth?action=login-mobile' },
      { source: '/api/auth/login-otp',       destination: '/api/auth?action=login-otp' },
      { source: '/api/auth/logout',          destination: '/api/auth?action=logout' },
      { source: '/api/auth/register',        destination: '/api/auth?action=register' },
      { source: '/api/auth/refresh',         destination: '/api/auth?action=refresh' },
      { source: '/api/auth/send-otp',        destination: '/api/auth?action=send-otp' },
      { source: '/api/auth/forgot-password', destination: '/api/auth?action=forgot-password' },
      { source: '/api/auth/reset-password',  destination: '/api/auth?action=reset-password' },
      { source: '/api/auth/complete-profile',destination: '/api/auth?action=complete-profile' },

      // ── Schools ─────────────────────────────────────────────────────────────
      { source: '/api/schools/profile',            destination: '/api/schools?action=profile' },
      { source: '/api/schools/me/analytics',        destination: '/api/schools?action=analytics' },
      { source: '/api/schools/me/dashboard-stats',  destination: '/api/schools?action=dashboard-stats' },
      // /api/schools/[slug] and /api/schools/[slug]/reviews stay as-is (dynamic route file handles them)

      // ── Parent / user-facing ─────────────────────────────────────────────────
      { source: '/api/applications',    destination: '/api/parent?action=applications' },
      { source: '/api/students',        destination: '/api/parent?action=students' },
      { source: '/api/parent-profiles', destination: '/api/parent?action=profile' },
      { source: '/api/saved-schools',   destination: '/api/parent?action=saved-schools' },
      { source: '/api/recommendations', destination: '/api/parent?action=recommendations' },
      { source: '/api/counselling/book',destination: '/api/parent?action=book-counselling' },
      { source: '/api/lead-credits',    destination: '/api/parent?action=lead-credits' },

      // ── School portal ────────────────────────────────────────────────────────
      { source: '/api/leads',         destination: '/api/school-portal?action=leads' },

      // ── Settings / dropdowns ─────────────────────────────────────────────────
      { source: '/api/settings/dropdown/seed', destination: '/api/settings?action=seed' },
      { source: '/api/settings/dropdown',      destination: '/api/settings?action=dropdown' },

      // ── Admin ────────────────────────────────────────────────────────────────
      { source: '/api/admin/overview',              destination: '/api/admin?action=overview' },
      { source: '/api/admin/analytics',             destination: '/api/admin?action=analytics' },
      { source: '/api/admin/schools',               destination: '/api/admin?action=schools' },
      { source: '/api/admin/users',                 destination: '/api/admin?action=users' },
      { source: '/api/admin/users/:id/activity',    destination: '/api/admin?action=users-activity&id=:id' },
      { source: '/api/admin/users/:id',             destination: '/api/admin?action=users&id=:id' },
      { source: '/api/admin/applications',          destination: '/api/admin?action=applications' },
      { source: '/api/admin/reviews',               destination: '/api/admin?action=reviews' },
      { source: '/api/admin/leads',                 destination: '/api/admin?action=leads' },
      { source: '/api/admin/payments',              destination: '/api/admin?action=payments' },
      { source: '/api/admin/counselling',           destination: '/api/admin?action=counselling' },
      { source: '/api/admin/content',               destination: '/api/admin?action=content' },
      { source: '/api/admin/theme',                 destination: '/api/admin?action=theme' },
      { source: '/api/admin/seo',                   destination: '/api/admin?action=seo' },
      { source: '/api/admin/settings',              destination: '/api/admin?action=settings' },
      { source: '/api/admin/media',                 destination: '/api/admin?action=media' },
      { source: '/api/admin/cities',                destination: '/api/admin?action=cities' },
      { source: '/api/admin/lead-pricing-defaults', destination: '/api/admin?action=lead-pricing-defaults' },
      { source: '/api/admin/notifications',         destination: '/api/admin?action=notifications' },
      { source: '/api/admin/seed-demo',             destination: '/api/admin?action=seed-demo' },
      { source: '/api/admin/health',                destination: '/api/admin?action=health' },
      { source: '/api/admin/subscription-plans',    destination: '/api/admin?action=subscription-plans' },
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
