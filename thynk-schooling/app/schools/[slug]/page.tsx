import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { SchoolProfileClient } from '@/components/school/SchoolProfileClient'

export async function generateMetadata({ params }: { params: { slug: string } }) {
  return {
    title: `${params.slug.replace(/-/g, ' ')} — Thynk Schooling`,
    description: 'View school details, fees, facilities, reviews and apply online.',
  }
}

export default function SchoolProfilePage({ params }: { params: { slug: string } }) {
  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen">
        <SchoolProfileClient slug={params.slug} />
      </main>
      <Footer />
    </>
  )
}
