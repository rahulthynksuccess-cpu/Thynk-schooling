import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { config } from '@/lib/config'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400','500','600','700','800'],
  style: ['normal','italic'],
  variable: '--font-serif',
  display: 'swap',
})
const inter = Inter({
  subsets: ['latin'],
  weight: ['300','400','500','600'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: `${config.app.name} — Find the Best Schools in India`, template: `%s | ${config.app.name}` },
  description: 'Search, compare and apply to 12,000+ verified schools across India. Free AI-powered recommendations and 1-on-1 counselling.',
  metadataBase: new URL(config.app.url),
}
export const viewport: Viewport = {
  themeColor: '#FAF7F2',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`}>
      <body style={{ background:'#FAF7F2', color:'#0D1117' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
