export const dynamic = 'force-dynamic'
import { Suspense } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { HeroSection }     from '@/components/home/HeroSection'
import { StatsBar }        from '@/components/home/StatsBar'
import { HowItWorks }      from '@/components/home/HowItWorks'
import { FeaturedSchools } from '@/components/home/FeaturedSchools'
import { WhyChooseUs }     from '@/components/home/WhyChooseUs'
import { Marquee } from '@/components/ui/Marquee'
import {
  TopCitiesGrid,
  BoardComparison,
  CounsellingCTA,
  TestimonialsSection,
  ForSchoolsCTA,
  BlogPreview,
} from '@/components/home/HomeExtraSections'

export const metadata = {
  title: 'Thynk Schooling — Find the Best Schools in India',
  description: 'Search, compare and apply to 12,000+ verified schools across India. Free AI-powered recommendations and 1-on-1 counselling.',
}

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <StatsBar />
        <Marquee variant="light" speed={36} />
        <HowItWorks />
        <Suspense fallback={<div style={{ height: '400px' }} />}>
          <FeaturedSchools />
        </Suspense>
        <WhyChooseUs />
        <Marquee variant="dark" speed={42} />
        <TopCitiesGrid />
        <BoardComparison />
        <TestimonialsSection />
        <CounsellingCTA />
        <ForSchoolsCTA />
        <BlogPreview />
      </main>
      <Footer />
    </>
  )
}
