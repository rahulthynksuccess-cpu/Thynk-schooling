export const dynamic = 'force-dynamic'

import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { HeroSection }         from '@/components/home/HeroSection'
import { StatsBar }            from '@/components/home/StatsBar'
import { FeaturedSchools }     from '@/components/home/FeaturedSchools'
import { HowItWorks }          from '@/components/home/HowItWorks'
import { WhyChooseUs }         from '@/components/home/WhyChooseUs'
import { TopCitiesGrid, CounsellingCTA, TestimonialsSection, ForSchoolsCTA, BlogPreview } from '@/components/home/HomeExtraSections'

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <StatsBar />
        <FeaturedSchools />
        <HowItWorks />
        <WhyChooseUs />
        <TopCitiesGrid />
        <CounsellingCTA />
        <TestimonialsSection />
        <ForSchoolsCTA />
        <BlogPreview />
      </main>
      <Footer />
    </>
  )
}
