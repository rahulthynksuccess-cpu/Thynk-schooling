import type { Metadata, Viewport } from 'next'
import { Syne, DM_Sans } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { config } from '@/lib/config'

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: `${config.app.name} — Find the Best Schools in India`,
    template: `%s | ${config.app.name}`,
  },
  description:
    'Search, compare and apply to 12,000+ verified schools across India. Free AI-powered recommendations and 1-on-1 counselling. CBSE, ICSE, IB, Cambridge schools.',
  keywords: ['school admission India', 'best schools', 'CBSE schools', 'school search', 'school counselling'],
  authors: [{ name: 'Thynk Schooling' }],
  creator: 'Thynk Schooling',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: config.app.url,
    title: `${config.app.name} — Find the Best Schools in India`,
    description: 'Search, compare and apply to 12,000+ verified schools across India.',
    siteName: config.app.name,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${config.app.name} — Find the Best Schools in India`,
  },
  robots: {
    index: config.app.env === 'production',
    follow: config.app.env === 'production',
  },
  metadataBase: new URL(config.app.url),
}

export const viewport: Viewport = {
  themeColor: '#0A0F2E',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable}`}>
      <body className="font-body bg-navy-900 text-white antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
