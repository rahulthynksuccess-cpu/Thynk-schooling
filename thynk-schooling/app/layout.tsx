import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'
import { config } from '@/lib/config'

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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600;1,700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body style={{ background: '#FAF7F2', color: '#0D1117' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
