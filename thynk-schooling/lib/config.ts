/**
 * THYNK SCHOOLING — Central Config
 * All environment variables are read here.
 * Never import process.env directly elsewhere in the app.
 * On Hostinger: set these in the Node.js app environment settings panel.
 */

export const config = {
  app: {
    name:    process.env.NEXT_PUBLIC_APP_NAME    || 'Thynk Schooling',
    url:     process.env.NEXT_PUBLIC_APP_URL     || 'http://localhost:3000',
    env:     process.env.NEXT_PUBLIC_APP_ENV     || 'development',
    isDev:   process.env.NEXT_PUBLIC_APP_ENV !== 'production',
  },
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
    timeout: 15000,
  },
  cdn: {
    url:       process.env.NEXT_PUBLIC_CDN_URL || '',
    s3Host:    process.env.NEXT_PUBLIC_S3_HOSTNAME || '',
  },
  razorpay: {
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
  },
  maps: {
    // Google Maps API key (public — only Maps JS API, no secrets)
    googleApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '',
  },
  lead: {
    defaultPricePaise: Number(process.env.DEFAULT_LEAD_PRICE_PAISE) || 29900,
    maskBlurMeters:    Number(process.env.LEAD_MASK_BLUR_METERS)    || 1000,
  },
  otp: {
    maxAttempts:    Number(process.env.OTP_MAX_ATTEMPTS)    || 5,
    lockoutMinutes: Number(process.env.OTP_LOCKOUT_MINUTES) || 60,
  },
} as const

export type AppConfig = typeof config
