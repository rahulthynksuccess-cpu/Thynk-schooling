import { Suspense } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { SchoolListingClient } from '@/components/school/SchoolListingClient'

export const metadata = {
  title: 'Find Schools in India',
  description: 'Search and filter 12,000+ verified schools across India by city, board, fees, class and more.',
}

export default function SchoolsPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen">
        <Suspense fallback={<div className="h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>}>
          <SchoolListingClient />
        </Suspense>
      </main>
      <Footer />
    </>
  )
}
