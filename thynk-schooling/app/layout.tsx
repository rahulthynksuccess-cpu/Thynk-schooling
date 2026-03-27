import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, DM_Sans, Syne } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { config } from '@/lib/config'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
})
const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-sans',
  display: 'swap',
})
const syne = Syne({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: `${config.app.name} — Find the Best Schools in India`,
    template: `%s | ${config.app.name}`,
  },
  description: 'Search, compare and apply to 12,000+ verified schools across India. Free AI-powered recommendations and 1-on-1 counselling.',
  keywords: ['school admission India', 'best schools', 'CBSE schools', 'school search', 'school counselling'],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: config.app.url,
    siteName: config.app.name,
  },
  metadataBase: new URL(config.app.url),
}

export const viewport: Viewport = {
  themeColor: '#071A0F',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${dmSans.variable} ${syne.variable}`}>
      <body className="font-sans antialiased" style={{ background: 'var(--forest-900)', color: '#F0EDD8' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
