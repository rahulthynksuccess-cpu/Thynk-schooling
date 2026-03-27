import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { HeroSection }        from '@/components/home/HeroSection'
import { StatsBar }           from '@/components/home/StatsBar'
import { FeaturedSchools }    from '@/components/home/FeaturedSchools'
import { HowItWorks }         from '@/components/home/HowItWorks'
import { WhyChooseUs }        from '@/components/home/WhyChooseUs'
import { CounsellingCTA }     from '@/components/home/CounsellingCTA'
import { TopCitiesGrid }      from '@/components/home/TopCitiesGrid'
import { TestimonialsSection } from '@/components/home/TestimonialsSection'
import { ForSchoolsCTA }      from '@/components/home/ForSchoolsCTA'
import { BlogPreview }        from '@/components/home/BlogPreview'

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
