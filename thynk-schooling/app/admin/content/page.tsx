'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useCallback, useRef } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Globe, Loader2, ChevronDown, ChevronRight, Plus, Trash2, GripVertical } from 'lucide-react'
import toast from 'react-hot-toast'
import { refreshContent } from '@/hooks/useContent'

type FieldType = 'text' | 'textarea' | 'color' | 'size'
interface Field { id: string; label: string; type: FieldType; cssVar?: string; default: string; min?: number; max?: number }
interface Section { id: string; label: string; fields: Field[] }
interface PageGroup { label: string; icon: string; contentKey: string; previewUrl?: string; sections: Section[] }

const PAGES: PageGroup[] = [
  {
    label: 'Homepage', icon: '🏠', contentKey: 'home', previewUrl: '/',
    sections: [
      {
        id: 'hero-text', label: 'Hero Section - Text',
        fields: [
          { id:'eyebrow',          label:'Eyebrow text',           type:'text',    default:'AI-Powered School Matching - Free for Parents' },
          { id:'h1Line1',          label:'H1 Line 1',              type:'text',    default:'Find the' },
          { id:'h1Italic',         label:'H1 Italic word',         type:'text',    default:'Perfect School' },
          { id:'h1Line3',          label:'H1 Line 3',              type:'text',    default:'for Your Child' },
          { id:'subtext',          label:'Hero subtitle',          type:'textarea',default:'Search, compare & apply to 12,000+ verified schools across 350+ Indian cities.' },
          { id:'searchPlaceholder',label:'Search box placeholder', type:'text',    default:'School name, board, or keyword...' },
          { id:'ctaPrimary',       label:'Search button text',     type:'text',    default:'Search' },
          { id:'heroImage',        label:'Hero Image URL (right side)', type:'text', default:'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=900&q=85&auto=format&fit=crop' },
        ],
      },
      {
        id: 'hero-style', label: 'Hero Section - Colours & Sizes',
        fields: [
          { id:'heroBg',           label:'Background colour',      type:'color', cssVar:'--hero-bg',             default:'#FAF7F2' },
          { id:'heroH1Color',      label:'H1 colour',              type:'color', cssVar:'--hero-h1-color',       default:'#0D1117' },
          { id:'heroH1Size',       label:'H1 font size',           type:'size',  cssVar:'--hero-h1-size',        default:'96', min:40, max:160 },
          { id:'heroItalicColor',  label:'Italic accent colour',   type:'color', cssVar:'--hero-italic-color',   default:'#B8860B' },
          { id:'heroSubColor',     label:'Subtitle colour',        type:'color', cssVar:'--hero-sub-color',      default:'#4A5568' },
          { id:'heroSubSize',      label:'Subtitle font size',     type:'size',  cssVar:'--hero-sub-size',       default:'17', min:12, max:28 },
          { id:'heroEyebrowColor', label:'Eyebrow colour',         type:'color', cssVar:'--hero-eyebrow-color',  default:'#B8860B' },
          { id:'btnGoldBg',        label:'Search button background',type:'color',cssVar:'--btn-gold-bg',         default:'#B8860B' },
          { id:'btnGoldColor',     label:'Search button text',     type:'color', cssVar:'--btn-gold-color',      default:'#ffffff' },
        ],
      },
      {
        id: 'stats', label: 'Stats Bar',
        fields: [
          { id:'stat1Num',   label:'Stat 1 - Number', type:'text',  default:'12,000+' },
          { id:'stat1Label', label:'Stat 1 - Label',  type:'text',  default:'Verified Schools' },
          { id:'stat2Num',   label:'Stat 2 - Number', type:'text',  default:'1 Lakh+' },
          { id:'stat2Label', label:'Stat 2 - Label',  type:'text',  default:'Happy Parents' },
          { id:'stat3Num',   label:'Stat 3 - Number', type:'text',  default:'350+' },
          { id:'stat3Label', label:'Stat 3 - Label',  type:'text',  default:'Indian Cities' },
          { id:'stat4Num',   label:'Stat 4 - Number', type:'text',  default:'98%' },
          { id:'stat4Label', label:'Stat 4 - Label',  type:'text',  default:'Satisfaction Rate' },
          { id:'stat5Num',   label:'Stat 5 - Number', type:'text',  default:'4.8★' },
          { id:'stat5Label', label:'Stat 5 - Label',  type:'text',  default:'Average Rating' },
          { id:'statsBg',    label:'Background',      type:'color', cssVar:'--stats-bg',        default:'#F5F0E8' },
          { id:'statNumColor',label:'Number colour',  type:'color', cssVar:'--stat-num-color',  default:'#0D1117' },
          { id:'statNumSize', label:'Number size',    type:'size',  cssVar:'--stat-num-size',   default:'38', min:20, max:72 },
          { id:'statLabelColor',label:'Label colour', type:'color', cssVar:'--stat-label-color',default:'#718096' },
        ],
      },
      {
        id: 'why', label: 'Why Choose Us Section',
        fields: [
          { id:'whyTitle',      label:'Section title',          type:'text',  default:"Everything You Need, Nothing You Don't" },
          { id:'whyBg',         label:'Background',             type:'color', cssVar:'--why-bg',          default:'#F5F0E8' },
          { id:'whyTitleColor', label:'Title colour',           type:'color', cssVar:'--why-title-color', default:'#0D1117' },
          { id:'whyTitleSize',  label:'Title size',             type:'size',  cssVar:'--why-title-size',  default:'56', min:24, max:80 },
        ],
      },
      {
        id: 'how', label: 'How It Works Section',
        fields: [
          { id:'howTitle',      label:'Section title',          type:'text',  default:'Admission Made Simple' },
          { id:'howBg',         label:'Background',             type:'color', cssVar:'--how-bg',          default:'#FAF7F2' },
          { id:'howTitleColor', label:'Title colour',           type:'color', cssVar:'--how-title-color', default:'#0D1117' },
          { id:'howTitleSize',  label:'Title size',             type:'size',  cssVar:'--how-title-size',  default:'56', min:24, max:80 },
        ],
      },
    ],
  },
  {
    label: 'Homepage', icon: '🏠', contentKey: 'home_images', previewUrl: '/',
    sections: [
      {
        id: 'home-images', label: 'Homepage Images (Editable)',
        fields: [
          { id:'heroImage',        label:'Hero right-side image URL',   type:'text',    default:'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=900&q=85&auto=format&fit=crop' },
          { id:'featuredBg',       label:'Featured Schools section BG', type:'text',    default:'' },
          { id:'counsellingImage', label:'Counselling section image',   type:'text',    default:'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80&auto=format&fit=crop' },
          { id:'aboutImage',       label:'About page hero image',       type:'text',    default:'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=900&q=80&auto=format&fit=crop' },
        ],
      },
    ],
  },
  {
    label: 'Navbar', icon: '📌', contentKey: 'navbar', previewUrl: '/',
    sections: [
      {
        id: 'navbar', label: 'Navigation Bar',
        fields: [
          { id:'link1Label',  label:'Nav link 1 text',    type:'text',  default:'Find Schools' },
          { id:'link2Label',  label:'Nav link 2 text',    type:'text',  default:'Compare' },
          { id:'link3Label',  label:'Nav link 3 text',    type:'text',  default:'Counselling' },
          { id:'link4Label',  label:'Nav link 4 text',    type:'text',  default:'Blog' },
          { id:'nav.ctaLabel',    label:'CTA button text',    type:'text',  default:'List Your School' },
          { id:'navBg',       label:'Navbar background',  type:'color', cssVar:'--nav-bg',    default:'rgba(250,247,242,0.95)' },
          { id:'navColor',    label:'Link colour',        type:'color', cssVar:'--nav-color', default:'#4A5568' },
          { id:'navSize',     label:'Link font size',     type:'size',  cssVar:'--nav-size',  default:'13', min:10, max:18 },
        ],
      },
    ],
  },
  {
    label: 'Footer', icon: '🦶', contentKey: 'footer', previewUrl: '/',
    sections: [
      {
        id: 'footer', label: 'Footer',
        fields: [
          { id:'tagline',       label:'Tagline',           type:'textarea',default:"India's most trusted school discovery platform." },
          { id:'copyright',     label:'Copyright text',    type:'text',    default:'© 2025 Thynk Schooling. All rights reserved.' },
          { id:'footerBg',      label:'Background',        type:'color',   cssVar:'--footer-bg',         default:'#0D1117' },
          { id:'footerTextColor',label:'Text colour',      type:'color',   cssVar:'--footer-text-color', default:'rgba(250,247,242,0.4)' },
          { id:'footerTextSize', label:'Text font size',   type:'size',    cssVar:'--footer-text-size',  default:'14', min:10, max:18 },
        ],
      },
    ],
  },
  {
    label: 'Schools Page', icon: '🏫', contentKey: 'schools', previewUrl: '/schools',
    sections: [
      {
        id: 'schools', label: 'School Listing Page',
        fields: [
          { id:'heroTitle',   label:'Page title',          type:'text',  default:'Find Your School' },
          { id:'heroSub',     label:'Page subtitle',       type:'text',  default:'Search 12,000+ verified schools across India' },
          { id:'pageBg',      label:'Page background',     type:'color', cssVar:'--schools-page-bg',  default:'#FAF7F2' },
          { id:'cardBg',      label:'Card background',     type:'color', cssVar:'--schools-card-bg',  default:'#ffffff' },
          { id:'nameColor',   label:'School name colour',  type:'color', cssVar:'--schools-name-color',default:'#0D1117' },
          { id:'nameSize',    label:'School name size',    type:'size',  cssVar:'--schools-name-size', default:'19', min:13, max:28 },
          { id:'metaColor',   label:'Meta text colour',    type:'color', cssVar:'--schools-meta-color',default:'#718096' },
        ],
      },
    ],
  },
  {
    label: 'Login / Register', icon: '🔐', contentKey: 'auth', previewUrl: '/login',
    sections: [
      {
        id: 'auth', label: 'Auth Pages',
        fields: [
          { id:'loginTitle',   label:'Login page title',   type:'text',  default:'Welcome Back' },
          { id:'loginSub',     label:'Login subtitle',     type:'text',  default:'Sign in to your Thynk Schooling account' },
          { id:'regTitle',     label:'Register page title',type:'text',  default:'Create Account' },
          { id:'loginBg',      label:'Page background',    type:'color', cssVar:'--login-bg',           default:'#FAF7F2' },
          { id:'loginCardBg',  label:'Card background',    type:'color', cssVar:'--login-card-bg',      default:'#ffffff' },
          { id:'loginH1Color', label:'Heading colour',     type:'color', cssVar:'--login-h1-color',     default:'#0D1117' },
          { id:'loginH1Size',  label:'Heading size',       type:'size',  cssVar:'--login-h1-size',      default:'32', min:20, max:48 },
          { id:'loginInputBorder',label:'Input border',    type:'color', cssVar:'--login-input-border', default:'rgba(13,17,23,0.12)' },
        ],
      },
    ],
  },
  {
    label: 'Counselling Page', icon: '🎓', contentKey: 'counselling', previewUrl: '/counselling',
    sections: [
      {
        id: 'counselling-hero', label: 'Hero Section',
        fields: [
          { id:'eyebrow',       label:'Eyebrow badge text',         type:'text',     default:'100% Free Service' },
          { id:'h1Line1',       label:'H1 line 1',                  type:'text',     default:'Talk to an Expert' },
          { id:'h1Italic',      label:'H1 italic line',             type:'text',     default:'Education Counsellor' },
          { id:'subtext',       label:'Hero subtitle',              type:'textarea', default:'Our experts have helped 500+ families every month find the right school. Free, with zero pressure.' },
        ],
      },
      {
        id: 'counselling-form', label: 'Booking Form',
        fields: [
          { id:'formTitle',     label:'Form card title',            type:'text',     default:'Book a Free Session' },
          { id:'formSubtitle',  label:'Form subtitle / hours',      type:'text',     default:'Mon–Sat · 9 AM – 7 PM · Hindi & English' },
          { id:'ctaBtn',        label:'Submit button text',         type:'text',     default:'Book My Free Session' },
          { id:'formDisclaimer',label:'Disclaimer below button',    type:'text',     default:'No sales calls · No obligation · 100% free' },
        ],
      },
      {
        id: 'counselling-benefits', label: 'Benefit Cards',
        fields: [
          { id:'benefit1Title', label:'Benefit 1 title',            type:'text',     default:'Board Selection' },
          { id:'benefit1Desc',  label:'Benefit 1 description',      type:'textarea', default:'CBSE vs ICSE vs IB — our experts help you pick what suits your child' },
          { id:'benefit2Title', label:'Benefit 2 title',            type:'text',     default:'School Shortlisting' },
          { id:'benefit2Desc',  label:'Benefit 2 description',      type:'textarea', default:'Personalised shortlist of 5–10 schools based on budget, location and values' },
          { id:'benefit3Title', label:'Benefit 3 title',            type:'text',     default:'Admission Roadmap' },
          { id:'benefit3Desc',  label:'Benefit 3 description',      type:'textarea', default:'Step-by-step checklist with deadlines for every school you apply to' },
          { id:'benefit4Title', label:'Benefit 4 title',            type:'text',     default:'Fee & Scholarship' },
          { id:'benefit4Desc',  label:'Benefit 4 description',      type:'textarea', default:'Navigate fee structures, hidden costs and scholarship opportunities' },
        ],
      },
      {
        id: 'counselling-testimonials', label: 'Testimonials',
        fields: [
          { id:'test1Name',  label:'Testimonial 1 – Name',          type:'text',     default:'Priya Sharma' },
          { id:'test1City',  label:'Testimonial 1 – City',          type:'text',     default:'Delhi' },
          { id:'test1Text',  label:'Testimonial 1 – Quote',         type:'textarea', default:'The counsellor understood our exact needs and shortlisted 6 perfect schools. My daughter got admission in her first choice!' },
          { id:'test2Name',  label:'Testimonial 2 – Name',          type:'text',     default:'Rahul Mehta' },
          { id:'test2City',  label:'Testimonial 2 – City',          type:'text',     default:'Mumbai' },
          { id:'test2Text',  label:'Testimonial 2 – Quote',         type:'textarea', default:'Amazing service. Cleared all my doubts about IB vs CBSE in one 45-minute call. Totally free and no pressure at all.' },
          { id:'test3Name',  label:'Testimonial 3 – Name',          type:'text',     default:'Anita Singh' },
          { id:'test3City',  label:'Testimonial 3 – City',          type:'text',     default:'Bangalore' },
          { id:'test3Text',  label:'Testimonial 3 – Quote',         type:'textarea', default:'Helped us understand the admission timeline perfectly. Got our son into a top ICSE school with their guidance.' },
        ],
      },
      {
        id: 'counselling-style', label: 'Colours & Style',
        fields: [
          { id:'counsellingBg',      label:'Page background',       type:'color', default:'#FAF7F2', cssVar:'--counselling-bg' },
          { id:'counsellingH1Color', label:'H1 colour',             type:'color', default:'#FAF7F2', cssVar:'--counselling-h1-color' },
          { id:'counsellingH1Size',  label:'H1 size',               type:'size',  default:'56', min:24, max:80, cssVar:'--counselling-h1-size' },
        ],
      },
    ],
  },
  {
    label: 'Cities Section', icon: '🏙️', contentKey: 'cities', previewUrl: '/',
    sections: [
      { id: 'cities', label: 'Top Cities Section',
        fields: [
          { id:'citiesTitle',   label:'Section title',      type:'text',     default:'Schools in Your City' },
          { id:'citiesSub',     label:'Subtitle',           type:'textarea', default:'Find top schools in 35+ Indian cities - all verified, all real.' },
          { id:'citiesCtaText', label:'View all link text', type:'text',     default:'View all 35+ cities' },
          { id:'citiesBg',      label:'Background',         type:'color',    default:'#F5F0E8', cssVar:'--cities-bg' },
        ],
      },
    ],
  },
  {
    label: 'Counselling CTA', icon: '📞', contentKey: 'counselling-cta', previewUrl: '/',
    sections: [
      { id: 'counsel-cta', label: 'Counselling CTA Section',
        fields: [
          { id:'ctaH2Line1',   label:'Headline line 1',      type:'text',     default:'Talk to an Expert' },
          { id:'ctaH2Line2',   label:'Headline italic',       type:'text',     default:'Education Counsellor' },
          { id:'ctaDesc',      label:'Description',           type:'textarea', default:'Confused about which board to choose? Our experts help 500+ families every month at absolutely zero cost.' },
          { id:'ctaBenefit1',  label:'Benefit 1',             type:'text',     default:'CBSE vs ICSE vs IB - which board suits your child' },
          { id:'ctaBenefit2',  label:'Benefit 2',             type:'text',     default:'School shortlisting by budget, location & values' },
          { id:'ctaBenefit3',  label:'Benefit 3',             type:'text',     default:'Admission documents checklist & timelines' },
          { id:'ctaBookBtn',   label:'Book button text',      type:'text',     default:"Book Now - It's Free" },
          { id:'ctaBg',        label:'Section background',    type:'color',    default:'#FAF7F2', cssVar:'--counsel-bg' },
        ],
      },
    ],
  },
  {
    label: 'For Schools CTA', icon: '🏫', contentKey: 'for-schools', previewUrl: '/',
    sections: [
      { id: 'schools-cta', label: 'For Schools Section',
        fields: [
          { id:'fsTitle',   label:'Headline',            type:'text',     default:'List Free. Buy Only What You Want.' },
          { id:'fsDesc',    label:'Description',         type:'textarea', default:'Parents applying through Thynk Schooling become leads. See masked info first.' },
          { id:'fsBtn1',    label:'Primary button text', type:'text',     default:'List Your School Free' },
          { id:'fsBtn2',    label:'Secondary button',    type:'text',     default:'View Pricing Plans' },
          { id:'fsBg',      label:'Background',          type:'color',    default:'#FAF7F2', cssVar:'--for-schools-bg' },
        ],
      },
    ],
  },
  {
    label: 'Testimonials', icon: '⭐', contentKey: 'testimonials', previewUrl: '/',
    sections: [
      { id: 'testimonials', label: 'Testimonials Section',
        fields: [
          { id:'testTitle',    label:'Section title',        type:'text',     default:'Trusted by 1 Lakh+ Parents' },
          { id:'testBg',       label:'Background',           type:'color',    default:'#F5F0E8', cssVar:'--testimonials-bg' },
          { id:'test1Name',    label:'Testimonial 1 - Name', type:'text',     default:'Priya Sharma' },
          { id:'test1Role',    label:'Testimonial 1 - Role', type:'text',     default:'Parent, Delhi' },
          { id:'test1Quote',   label:'Testimonial 1 - Quote',type:'textarea', default:'Found the perfect CBSE school in 3 days. The AI recommendations were spot on!' },
          { id:'test2Name',    label:'Testimonial 2 - Name', type:'text',     default:'Rahul Mehta' },
          { id:'test2Role',    label:'Testimonial 2 - Role', type:'text',     default:'Parent, Mumbai' },
          { id:'test2Quote',   label:'Testimonial 2 - Quote',type:'textarea', default:'The counsellor saved us months of research. Got our daughter into her dream school.' },
          { id:'test3Name',    label:'Testimonial 3 - Name', type:'text',     default:'Anita Desai' },
          { id:'test3Role',    label:'Testimonial 3 - Role', type:'text',     default:'Parent, Pune' },
          { id:'test3Quote',   label:'Testimonial 3 - Quote',type:'textarea', default:'Compared 12 schools side by side. Never thought finding a school could be this simple.' },
        ],
      },
    ],
  },
  {
    label: 'Blog Preview', icon: '📝', contentKey: 'blog-preview', previewUrl: '/',
    sections: [
      { id: 'blog', label: 'Blog Preview Section',
        fields: [
          { id:'blogTitle',   label:'Section title',   type:'text',  default:'Admission Insights' },
          { id:'blogCtaText', label:'View all button', type:'text',  default:'Read All Articles' },
          { id:'blogBg',      label:'Background',      type:'color', default:'#FAF7F2', cssVar:'--blog-preview-bg' },
          { id:'blog1Title',  label:'Article 1 title', type:'text',  default:'CBSE vs ICSE vs IB: Which Board is Right for Your Child?' },
          { id:'blog2Title',  label:'Article 2 title', type:'text',  default:'How to Choose the Right School: 10 Questions to Ask' },
          { id:'blog3Title',  label:'Article 3 title', type:'text',  default:'Top 10 Boarding Schools in India 2026' },
        ],
      },
    ],
  },
  {
    label: 'School Profile Page', icon: '📋', contentKey: 'school-profile', previewUrl: '/schools',
    sections: [
      { id: 'school-profile', label: 'School Profile Page',
        fields: [
          { id:'spBg',        label:'Page background',    type:'color', default:'#FAF7F2', cssVar:'--profile-page-bg' },
          { id:'spCardBg',    label:'Card background',    type:'color', default:'#ffffff', cssVar:'--profile-card-bg' },
          { id:'spNameColor', label:'School name colour', type:'color', default:'#0D1117', cssVar:'--profile-name-color' },
          { id:'spNameSize',  label:'School name size',   type:'size',  default:'36', cssVar:'--profile-name-size', min:20, max:56 },
          { id:'spMetaColor', label:'Meta text colour',   type:'color', default:'#718096', cssVar:'--profile-meta-color' },
        ],
      },
    ],
  },
  {
    label: 'Dashboard', icon: '📊', contentKey: 'dashboard', previewUrl: '/dashboard/parent',
    sections: [
      { id: 'dashboard', label: 'Dashboard Pages',
        fields: [
          { id:'dashBg',       label:'Background',          type:'color', default:'#FAF7F2', cssVar:'--dashboard-bg' },
          { id:'dashCardBg',   label:'Card background',     type:'color', default:'#ffffff', cssVar:'--dashboard-card-bg' },
          { id:'dashHeadingColor',label:'Heading colour',   type:'color', default:'#0D1117', cssVar:'--dashboard-heading-color' },
          { id:'dashHeadingSize', label:'Heading size',     type:'size',  default:'28', cssVar:'--dashboard-heading-size', min:18, max:48 },
        ],
      },
    ],
  },
  {
    label: 'Compare Page', icon: '⇌', contentKey: 'compare', previewUrl: '/compare',
    sections: [
      { id:'compare', label:'Compare Page',
        fields: [
          { id:'compareTitle', label:'Page title',     type:'text',     default:'Compare Schools Side by Side' },
          { id:'compareSub',   label:'Subtitle',       type:'textarea', default:'Select up to 4 schools and compare fees, board, facilities and more.' },
          { id:'compareBg',    label:'Background',     type:'color',    default:'#FAF7F2', cssVar:'--compare-page-bg' },
        ],
      },
    ],
  },
  {
    label: 'Pricing Page', icon: '💰', contentKey: 'pricing', previewUrl: '/pricing',
    sections: [
      { id:'pricing', label:'Pricing Page',
        fields: [
          { id:'pricingTitle', label:'Page title',       type:'text',     default:'Simple, Transparent Pricing' },
          { id:'pricingSub',   label:'Subtitle',         type:'textarea', default:'Subscribe to a plan and get leads included every month. No wastage, no lock-in.' },
          { id:'pricingBadge', label:'Badge text',       type:'text',     default:'Schools Only' },
          { id:'pricingBg',    label:'Background',       type:'color',    default:'#FAF7F2', cssVar:'--pricing-page-bg' },
          { id:'pricingCardBg',label:'Card background',  type:'color',    default:'#ffffff', cssVar:'--pricing-card-bg' },
        ],
      },
      { id:'pricing-faq', label:'FAQ Section',
        fields: [
          { id:'faq1q', label:'FAQ 1 - Question', type:'text',     default:'What is a lead credit?' },
          { id:'faq1a', label:'FAQ 1 - Answer',   type:'textarea', default:'One lead credit = one parent enquiry. When a parent fills an admission form for your school, you use a credit to unlock their full contact details.' },
          { id:'faq2q', label:'FAQ 2 - Question', type:'text',     default:'Can I try before I pay?' },
          { id:'faq2a', label:'FAQ 2 - Answer',   type:'textarea', default:'Yes! Our Free subscription plan lets you list your school and receive lead credits every month, forever. No credit card required.' },
          { id:'faq3q', label:'FAQ 3 - Question', type:'text',     default:'Do credits roll over?' },
          { id:'faq3a', label:'FAQ 3 - Answer',   type:'textarea', default:'Monthly plan credits do not roll over. Credits refresh each month with your active subscription plan.' },
          { id:'faq4q', label:'FAQ 4 - Question', type:'text',     default:'Can I change plans anytime?' },
          { id:'faq4a', label:'FAQ 4 - Answer',   type:'textarea', default:'Yes. Upgrade or downgrade instantly from your school dashboard. Unused credits from the old plan carry over for 30 days.' },
          { id:'faq5q', label:'FAQ 5 - Question', type:'text',     default:'Is there a setup fee?' },
          { id:'faq5a', label:'FAQ 5 - Answer',   type:'textarea', default:'Never. Listing is free, plans are monthly with no lock-in, and you can cancel anytime.' },
        ],
      },
    ],
  },
  {
    label: 'Blog Page', icon: '📰', contentKey: 'blog', previewUrl: '/blog',
    sections: [
      { id:'blog', label:'Blog / Articles Page',
        fields: [
          { id:'blogPageTitle', label:'Page title',    type:'text',     default:'Admission Insights & Guides' },
          { id:'blogPageSub',   label:'Subtitle',      type:'textarea', default:'Expert advice on school selection, boards, admissions and more.' },
          { id:'blogPageBg',    label:'Background',    type:'color',    default:'#FAF7F2', cssVar:'--blog-page-bg' },
          { id:'blogCardBg',    label:'Card background',type:'color',   default:'#ffffff', cssVar:'--blog-card-bg' },
        ],
      },
    ],
  },
  {
    label: 'About Page', icon: 'ℹ️', contentKey: 'about', previewUrl: '/about',
    sections: [
      { id:'about-hero', label:'Hero Section',
        fields: [
          { id:'eyebrow',   label:'Eyebrow text',                   type:'text',     default:'Our Story' },
          { id:'h1Line1',   label:'H1 line 1',                      type:'text',     default:'Every Child Deserves the' },
          { id:'h1Italic',  label:'H1 italic line',                 type:'text',     default:' Right School' },
          { id:'subtext',   label:'Hero subtitle',                  type:'textarea', default:'Thynk Schooling was born from a simple frustration — finding the right school in India is unnecessarily hard. We changed that.' },
          { id:'ctaText',   label:'CTA button text',                type:'text',     default:'Talk to Us Free' },
        ],
      },
      { id:'about-mission', label:'Mission & Vision',
        fields: [
          { id:'mission',   label:'Mission quote',                  type:'textarea', default:'To make school discovery radically transparent, fast, and free — for every parent in India.' },
          { id:'ctaH2',     label:'Bottom CTA headline',            type:'text',     default:'Ready to Find the Perfect School?' },
          { id:'ctaDesc',   label:'Bottom CTA description',         type:'textarea', default:"Join 1 lakh+ parents who found their child's school with Thynk Schooling. Free forever." },
        ],
      },
      { id:'about-stats', label:'Hero Stats',
        fields: [
          { id:'stat1Val',  label:'Stat 1 value',                   type:'text',  default:'12,000+' },
          { id:'stat1Lbl',  label:'Stat 1 label',                   type:'text',  default:'Verified Schools' },
          { id:'stat2Val',  label:'Stat 2 value',                   type:'text',  default:'1 Lakh+' },
          { id:'stat2Lbl',  label:'Stat 2 label',                   type:'text',  default:'Parents Helped' },
          { id:'stat3Val',  label:'Stat 3 value',                   type:'text',  default:'35+' },
          { id:'stat3Lbl',  label:'Stat 3 label',                   type:'text',  default:'Indian Cities' },
          { id:'stat4Val',  label:'Stat 4 value',                   type:'text',  default:'2021' },
          { id:'stat4Lbl',  label:'Stat 4 label',                   type:'text',  default:'Founded' },
        ],
      },
      { id:'about-values', label:'Values Cards',
        fields: [
          { id:'val1Icon',  label:'Value 1 icon',                   type:'text',  default:'🎯' },
          { id:'val1Title', label:'Value 1 title',                  type:'text',  default:'Parent First' },
          { id:'val1Desc',  label:'Value 1 description',            type:'textarea', default:'Every decision starts with — does this make life easier for parents?' },
          { id:'val2Icon',  label:'Value 2 icon',                   type:'text',  default:'✅' },
          { id:'val2Title', label:'Value 2 title',                  type:'text',  default:'Radical Honesty' },
          { id:'val2Desc',  label:'Value 2 description',            type:'textarea', default:'No paid rankings, no hidden promotions, no fake reviews. Only verified data.' },
          { id:'val3Icon',  label:'Value 3 icon',                   type:'text',  default:'🤝' },
          { id:'val3Title', label:'Value 3 title',                  type:'text',  default:'Fairness' },
          { id:'val3Desc',  label:'Value 3 description',            type:'textarea', default:'Free for parents always. Fair pricing for schools. No pay-to-win discovery.' },
          { id:'val4Icon',  label:'Value 4 icon',                   type:'text',  default:'🌍' },
          { id:'val4Title', label:'Value 4 title',                  type:'text',  default:'Access for All' },
          { id:'val4Desc',  label:'Value 4 description',            type:'textarea', default:'Premium guidance should not be only for families who can afford counsellors.' },
        ],
      },
      { id:'about-team', label:'Team Members',
        fields: [
          { id:'team1Name',  label:'Team 1 – Name',                 type:'text',     default:'Arjun Mehra' },
          { id:'team1Role',  label:'Team 1 – Role',                 type:'text',     default:'Co-Founder & CEO' },
          { id:'team1Desc',  label:'Team 1 – Bio',                  type:'textarea', default:'Former IIT Delhi, 10 years in EdTech across India and Southeast Asia.' },
          { id:'team2Name',  label:'Team 2 – Name',                 type:'text',     default:'Priya Nair' },
          { id:'team2Role',  label:'Team 2 – Role',                 type:'text',     default:'Co-Founder & CPO' },
          { id:'team2Desc',  label:'Team 2 – Bio',                  type:'textarea', default:"Ex-BYJU'S product lead. Passionate about making education accessible." },
          { id:'team3Name',  label:'Team 3 – Name',                 type:'text',     default:'Rahul Agarwal' },
          { id:'team3Role',  label:'Team 3 – Role',                 type:'text',     default:'Head of School Ops' },
          { id:'team3Desc',  label:'Team 3 – Bio',                  type:'textarea', default:'Built partnerships with 8,000+ schools across 20 Indian cities.' },
          { id:'team4Name',  label:'Team 4 – Name',                 type:'text',     default:'Sneha Krishnan' },
          { id:'team4Role',  label:'Team 4 – Role',                 type:'text',     default:'Head of Counselling' },
          { id:'team4Desc',  label:'Team 4 – Bio',                  type:'textarea', default:'Certified education counsellor with 12 years of parent advisory experience.' },
        ],
      },
      { id:'about-style', label:'Colours & Style',
        fields: [
          { id:'aboutBg',   label:'Page background',                type:'color', default:'#FAF7F2', cssVar:'--about-bg' },
        ],
      },
    ],
  },
  {
    label: 'Admin Panel', icon: '⚙️', contentKey: 'admin-panel', previewUrl: '/admin',
    sections: [
      { id:'admin-overview', label:'Overview / Dashboard',
        fields: [
          { id:'adminWelcomeTitle', label:'Welcome message',      type:'text',     default:'Welcome back, Admin' },
          { id:'adminWelcomeSub',   label:'Welcome subtitle',     type:'text',     default:'Here is what is happening today.' },
        ],
      },
      { id:'admin-schools', label:'Schools Admin Page',
        fields: [
          { id:'adminSchoolsTitle', label:'Page title',           type:'text',     default:'Manage Schools' },
          { id:'adminSchoolsSub',   label:'Subtitle',             type:'text',     default:'Review, approve and manage school listings.' },
        ],
      },
      { id:'admin-leads', label:'Leads Admin Page',
        fields: [
          { id:'adminLeadsTitle',   label:'Page title',           type:'text',     default:'Manage Leads' },
          { id:'adminLeadsSub',     label:'Subtitle',             type:'text',     default:'View and assign parent leads to schools.' },
        ],
      },
      { id:'admin-style', label:'Admin Panel Styling',
        fields: [
          { id:'adminBg',           label:'Page background',      type:'color', cssVar:'--admin-bg',                  default:'#FAF7F2' },
          { id:'adminSidebarBg',    label:'Sidebar background',   type:'color', cssVar:'--admin-sidebar-bg',          default:'#0D1117' },
          { id:'adminSidebarActive',label:'Sidebar active item',  type:'color', cssVar:'--admin-sidebar-active',      default:'rgba(184,134,11,0.12)' },
          { id:'adminSidebarColor', label:'Sidebar active colour', type:'color', cssVar:'--admin-sidebar-active-color',default:'#B8860B' },
          { id:'adminCardBg',       label:'Card background',      type:'color', cssVar:'--admin-card-bg',             default:'#ffffff' },
          { id:'adminHeadingColor', label:'Heading colour',       type:'color', cssVar:'--admin-heading-color',       default:'#0D1117' },
          { id:'adminHeadingSize',  label:'Heading size',         type:'size',  cssVar:'--admin-heading-size',        default:'24', min:16, max:40 },
        ],
      },
    ],
  },
  {
    label: 'Careers', icon: '💼', contentKey: 'careers', previewUrl: '/careers',
    sections: [
      { id:'careers-hero', label:'Hero Section',
        fields: [
          { id:'eyebrow',    label:'Eyebrow text',                  type:'text',     default:'Join our mission to transform school admissions in India' },
          { id:'h1',         label:'Page headline',                 type:'text',     default:'Careers at Thynk Schooling' },
          { id:'intro',      label:'Intro paragraph',              type:'textarea', default:"We're building the future of school admissions in India. If you're passionate about EdTech and want to make a real difference, we'd love to meet you." },
        ],
      },
      { id:'careers-jobs', label:'Open Positions',
        fields: [
          { id:'job1Title',  label:'Job 1 – Title',                 type:'text',     default:'Senior Full Stack Developer' },
          { id:'job1Meta',   label:'Job 1 – Location / Type',       type:'text',     default:'Remote • Full-time • 4+ years experience' },
          { id:'job1Desc',   label:'Job 1 – Description',           type:'textarea', default:'Build and scale our Next.js + PostgreSQL platform serving lakhs of Indian parents.' },
          { id:'job2Title',  label:'Job 2 – Title',                 type:'text',     default:'School Admission Counsellor' },
          { id:'job2Meta',   label:'Job 2 – Location / Type',       type:'text',     default:'Delhi / Mumbai / Bangalore • Full-time' },
          { id:'job2Desc',   label:'Job 2 – Description',           type:'textarea', default:'Guide parents through the school selection and admission process with empathy and expertise.' },
          { id:'job3Title',  label:'Job 3 – Title',                 type:'text',     default:'Business Development Manager — Schools' },
          { id:'job3Meta',   label:'Job 3 – Location / Type',       type:'text',     default:'Pan India • Full-time' },
          { id:'job3Desc',   label:'Job 3 – Description',           type:'textarea', default:'Onboard and manage relationships with premium schools across India.' },
        ],
      },
      { id:'careers-apply', label:'How to Apply',
        fields: [
          { id:'howToApply', label:'How to apply text',             type:'textarea', default:'Send your CV and a brief note about why you want to join us to careers@thynkschooling.in. We reply to every application within 5 business days.' },
        ],
      },
      { id:'careers-style', label:'Colours & Style',
        fields: [
          { id:'careersBg',      label:'Page background',           type:'color', default:'#FAF7F2', cssVar:'--careers-bg' },
          { id:'careersH1Color', label:'H1 colour',                 type:'color', default:'#0D1117', cssVar:'--careers-h1-color' },
          { id:'careersH1Size',  label:'H1 size',                   type:'size',  default:'40', min:24, max:72, cssVar:'--careers-h1-size' },
        ],
      },
    ],
  },
  {
    label: 'Press', icon: '📰', contentKey: 'press', previewUrl: '/press',
    sections: [
      { id:'press-hero', label:'Hero Section',
        fields: [
          { id:'eyebrow',      label:'Eyebrow text',                type:'text',     default:'Thynk Schooling in the news' },
          { id:'h1',           label:'Page headline',               type:'text',     default:'Press & Media' },
          { id:'intro',        label:'Intro paragraph',             type:'textarea', default:'For press enquiries, interviews, or media kit requests, please contact us.' },
        ],
      },
      { id:'press-about', label:'About Section',
        fields: [
          { id:'about',        label:'About paragraph',             type:'textarea', default:"Thynk Schooling is India's fastest-growing school discovery and admission platform, connecting over 1 lakh parents with 12,000+ verified schools across 35+ cities." },
        ],
      },
      { id:'press-stats', label:'Key Stats',
        fields: [
          { id:'stat1Value',   label:'Stat 1 value',                type:'text',     default:'12,000+' },
          { id:'stat1Label',   label:'Stat 1 label',                type:'text',     default:'Verified Schools' },
          { id:'stat2Value',   label:'Stat 2 value',                type:'text',     default:'1 Lakh+' },
          { id:'stat2Label',   label:'Stat 2 label',                type:'text',     default:'Parents Served' },
          { id:'stat3Value',   label:'Stat 3 value',                type:'text',     default:'35+' },
          { id:'stat3Label',   label:'Stat 3 label',                type:'text',     default:'Cities Covered' },
        ],
      },
      { id:'press-contact', label:'Press Contact',
        fields: [
          { id:'pressContact', label:'Press contact line',          type:'text',     default:'📧 press@thynkschooling.in | 📞 +91 88000 00000' },
        ],
      },
      { id:'press-style', label:'Colours & Style',
        fields: [
          { id:'pressBg',      label:'Background',                  type:'color', default:'#FAF7F2', cssVar:'--press-bg' },
          { id:'pressH1Color', label:'H1 colour',                   type:'color', default:'#0D1117', cssVar:'--press-h1-color' },
          { id:'pressH1Size',  label:'H1 size',                     type:'size',  default:'48', min:24, max:72, cssVar:'--press-h1-size' },
        ],
      },
    ],
  },
  {
    label: 'Terms of Service', icon: '⚖️', contentKey: 'terms', previewUrl: '/terms',
    sections: [
      { id:'terms', label:'Terms Page',
        fields: [
          { id:'termsTitle',   label:'Page title',      type:'text',     default:'Terms of Service' },
          { id:'termsUpdated', label:'Last updated',    type:'text',     default:'January 2025' },
          { id:'termsBg',      label:'Background',      type:'color',    default:'#FAF7F2', cssVar:'--terms-bg' },
          { id:'termsH1Color', label:'H1 colour',       type:'color',    default:'#0D1117', cssVar:'--terms-h1-color' },
          { id:'termsH1Size',  label:'H1 size',         type:'size',     default:'40', min:24, max:72, cssVar:'--terms-h1-size' },
        ],
      },
    ],
  },
  {
    label: 'Grievance', icon: '😤', contentKey: 'grievance', previewUrl: '/grievance',
    sections: [
      { id:'grievance', label:'Grievance Page',
        fields: [
          { id:'grievanceTitle',   label:'Page title',      type:'text',     default:'Grievance Redressal' },
          { id:'grievanceSub',     label:'Subtitle',        type:'textarea', default:'We take all complaints seriously. Please reach out and we\'ll respond within 48 hours.' },
          { id:'grievanceEmail',   label:'Grievance email', type:'text',     default:'grievance@thynkschooling.com' },
          { id:'grievanceBg',      label:'Background',      type:'color',    default:'#FAF7F2', cssVar:'--grievance-bg' },
          { id:'grievanceH1Color', label:'H1 colour',       type:'color',    default:'#0D1117', cssVar:'--grievance-h1-color' },
          { id:'grievanceH1Size',  label:'H1 size',         type:'size',     default:'40', min:24, max:72, cssVar:'--grievance-h1-size' },
        ],
      },
    ],
  },
  {
    label: 'Refund Policy', icon: '💸', contentKey: 'refund', previewUrl: '/refund',
    sections: [
      { id:'refund', label:'Refund Policy Page',
        fields: [
          { id:'refundTitle',   label:'Page title',      type:'text',     default:'Refund Policy' },
          { id:'refundUpdated', label:'Last updated',    type:'text',     default:'January 2025' },
          { id:'refundContact', label:'Contact email',   type:'text',     default:'billing@thynkschooling.com' },
          { id:'refundBg',      label:'Background',      type:'color',    default:'#FAF7F2', cssVar:'--refund-bg' },
          { id:'refundH1Color', label:'H1 colour',       type:'color',    default:'#0D1117', cssVar:'--refund-h1-color' },
          { id:'refundH1Size',  label:'H1 size',         type:'size',     default:'40', min:24, max:72, cssVar:'--refund-h1-size' },
        ],
      },
    ],
  },
  {
    label: 'Recommendations', icon: '🎯', contentKey: 'recommendations', previewUrl: '/recommendations',
    sections: [
      { id:'recommendations-hero', label:'Hero Section',
        fields: [
          { id:'eyebrow',              label:'Eyebrow text',                type:'text',     default:'Personalised For Your Child' },
          { id:'h1',                   label:'Page headline',               type:'text',     default:'AI-Powered School Recommendations' },
          { id:'subtext',              label:'Subtitle paragraph',          type:'textarea', default:"Our AI analyses your child's needs, budget, location preferences, and academic goals to recommend the best-fit schools." },
        ],
      },
      { id:'recommendations-steps', label:'How It Works Steps',
        fields: [
          { id:'step1Icon',            label:'Step 1 icon',                 type:'text',     default:'📋' },
          { id:'step1Title',           label:'Step 1 title',                type:'text',     default:'Share Preferences' },
          { id:'step1Desc',            label:'Step 1 description',          type:'textarea', default:"Tell us about your child — board preference, budget, location, activities, class level." },
          { id:'step2Icon',            label:'Step 2 icon',                 type:'text',     default:'⚡' },
          { id:'step2Title',           label:'Step 2 title',                type:'text',     default:'AI Analyses' },
          { id:'step2Desc',            label:'Step 2 description',          type:'textarea', default:'Our algorithm matches your requirements against 12,000+ verified schools in real time.' },
          { id:'step3Icon',            label:'Step 3 icon',                 type:'text',     default:'🎯' },
          { id:'step3Title',           label:'Step 3 title',                type:'text',     default:'Get Matches' },
          { id:'step3Desc',            label:'Step 3 description',          type:'textarea', default:'Receive your top 10 personalised school recommendations with detailed comparisons.' },
        ],
      },
      { id:'recommendations-cta', label:'CTA Button',
        fields: [
          { id:'ctaBtn',               label:'CTA button text',             type:'text',     default:'Find My Schools →' },
        ],
      },
      { id:'recommendations-style', label:'Colours & Style',
        fields: [
          { id:'recommendationsBg',    label:'Background',                  type:'color', default:'#FAF7F2', cssVar:'--recommendations-bg' },
          { id:'recommendationsH1Color',label:'H1 colour',                  type:'color', default:'#0D1117', cssVar:'--recommendations-h1-color' },
          { id:'recommendationsH1Size', label:'H1 size',                    type:'size',  default:'40', min:24, max:64, cssVar:'--recommendations-h1-size' },
        ],
      },
    ],
  },
  {
    label: 'User Profile', icon: '👤', contentKey: 'profile', previewUrl: '/profile',
    sections: [
      { id:'profile-user', label:'User Profile Page',
        fields: [
          { id:'profileUserTitle',   label:'Page title',         type:'text',  default:'My Profile' },
          { id:'profileUserBg',      label:'Background',         type:'color', default:'#FAF7F2', cssVar:'--profile-user-bg' },
          { id:'profileUserCardBg',  label:'Card background',    type:'color', default:'#FFFFFF', cssVar:'--profile-user-card-bg' },
          { id:'profileUserH1Color', label:'Heading colour',     type:'color', default:'#0D1117', cssVar:'--profile-user-h1-color' },
          { id:'profileUserH1Size',  label:'Heading size',       type:'size',  default:'28', min:20, max:48, cssVar:'--profile-user-h1-size' },
        ],
      },
    ],
  },
  {
    label: 'Apply Page', icon: '📝', contentKey: 'apply', previewUrl: '/apply/school',
    sections: [
      { id:'apply', label:'Application Form Page',
        fields: [
          { id:'applyTitle',    label:'Page title',        type:'text',     default:'Apply for Admission' },
          { id:'applySub',      label:'Subtitle',          type:'textarea', default:'Fill in the details below and the school will contact you directly.' },
          { id:'applyBtnText',  label:'Submit button',     type:'text',     default:'Submit Application' },
          { id:'applyBg',       label:'Background',        type:'color',    default:'#FAF7F2', cssVar:'--apply-bg' },
          { id:'applyCardBg',   label:'Card background',   type:'color',    default:'#FFFFFF', cssVar:'--apply-card-bg' },
          { id:'applyH1Color',  label:'H1 colour',         type:'color',    default:'#0D1117', cssVar:'--apply-h1-color' },
          { id:'applyH1Size',   label:'H1 size',           type:'size',     default:'32', min:20, max:56, cssVar:'--apply-h1-size' },
        ],
      },
    ],
  },
  {
    label: 'Blog — Post', icon: '📰', contentKey: 'blog-post', previewUrl: '/blog',
    sections: [
      { id:'blog-post', label:'Blog Single Post',
        fields: [
          { id:'blogSlugBg',         label:'Page background',    type:'color', default:'#FAF7F2', cssVar:'--blog-slug-bg' },
          { id:'blogSlugTitleColor', label:'Post title colour',  type:'color', default:'#0D1117', cssVar:'--blog-slug-title-color' },
          { id:'blogSlugTitleSize',  label:'Post title size',    type:'size',  default:'40', min:24, max:72, cssVar:'--blog-slug-title-size' },
          { id:'blogSlugBodyColor',  label:'Body text colour',   type:'color', default:'#4A5568', cssVar:'--blog-slug-body-color' },
          { id:'blogSlugBodySize',   label:'Body text size',     type:'size',  default:'16', min:13, max:24, cssVar:'--blog-slug-body-size' },
          { id:'blogReadMoreText',   label:'"Read more" text',   type:'text',  default:'Read More Articles' },
        ],
      },
    ],
  },
  {
    label: 'Forgot / Reset Password', icon: '🔑', contentKey: 'forgot-password', previewUrl: '/forgot-password',
    sections: [
      { id:'forgot-password', label:'Forgot & Reset Password',
        fields: [
          { id:'forgotTitle',        label:'Forgot password title',  type:'text',  default:'Forgot Password?' },
          { id:'forgotSub',          label:'Forgot subtitle',        type:'text',  default:'Enter your email and we\'ll send you a reset link.' },
          { id:'resetTitle',         label:'Reset password title',   type:'text',  default:'Set New Password' },
          { id:'resetSub',           label:'Reset subtitle',         type:'text',  default:'Choose a strong password for your account.' },
          { id:'forgotBtnText',      label:'Send link button',       type:'text',  default:'Send Reset Link' },
          { id:'forgotPasswordBg',   label:'Background',             type:'color', default:'#FAF7F2', cssVar:'--forgot-password-bg' },
          { id:'forgotPasswordCardBg',label:'Card background',       type:'color', default:'#FFFFFF', cssVar:'--forgot-password-card-bg' },
        ],
      },
    ],
  },
  {
    label: 'Admin — Blog', icon: '📝', contentKey: 'admin-blog', previewUrl: '/admin/blog',
    sections: [
      { id:'admin-blog', label:'Blog Manager',
        fields: [
          { id:'adminBlogTitle',   label:'Page title',    type:'text', default:'Blog Manager' },
          { id:'adminBlogSub',     label:'Subtitle',      type:'text', default:'Create, edit and publish blog articles.' },
          { id:'adminBlogNewBtn',  label:'New post button', type:'text', default:'New Article' },
        ],
      },
    ],
  },
  {
    label: 'Admin — Featured Schools', icon: '🏆', contentKey: 'admin-featured', previewUrl: '/admin/featured-schools',
    sections: [
      { id:'admin-featured', label:'Featured Schools Manager',
        fields: [
          { id:'adminFeaturedTitle', label:'Page title',  type:'text', default:'Featured Schools' },
          { id:'adminFeaturedSub',   label:'Subtitle',    type:'text', default:'Control which schools appear in the Featured section on the homepage.' },
        ],
      },
    ],
  },
  {
    label: 'Admin — Menu', icon: '📋', contentKey: 'admin-menu', previewUrl: '/admin/menu',
    sections: [
      { id:'admin-menu', label:'Menu / Navigation Manager',
        fields: [
          { id:'adminMenuTitle',    label:'Page title',   type:'text', default:'Menu Manager' },
          { id:'adminMenuSub',      label:'Subtitle',     type:'text', default:'Edit the navigation links shown to visitors.' },
        ],
      },
    ],
  },
  {
    label: 'Admin — School Report', icon: '📊', contentKey: 'admin-school-report', previewUrl: '/admin/school-report',
    sections: [
      { id:'admin-school-report', label:'School Report',
        fields: [
          { id:'adminSchoolReportTitle', label:'Page title', type:'text', default:'School Report' },
          { id:'adminSchoolReportSub',   label:'Subtitle',   type:'text', default:'Detailed analytics and performance data per school.' },
        ],
      },
    ],
  },
  {
    label: 'Admin — Email Triggers', icon: '📧', contentKey: 'admin-email-triggers', previewUrl: '/admin/email-triggers',
    sections: [
      { id:'admin-email-triggers', label:'Email Triggers',
        fields: [
          { id:'adminEmailTitle',       label:'Page title',          type:'text',     default:'Email Triggers' },
          { id:'adminEmailSub',         label:'Subtitle',            type:'text',     default:'Configure automated emails sent to parents and schools.' },
          { id:'adminEmailFooterSig',   label:'Email footer signature', type:'textarea', default:'The Thynk Schooling Team' },
          { id:'adminEmailFromName',    label:'Sender name',         type:'text',     default:'Thynk Schooling' },
        ],
      },
    ],
  },
  {
    label: 'Admin — Chatbot', icon: '🤖', contentKey: 'admin-chatbot', previewUrl: '/admin/chatbot',
    sections: [
      { id:'admin-chatbot', label:'Chatbot Settings',
        fields: [
          { id:'adminChatbotTitle',        label:'Page title',          type:'text',     default:'Chatbot Manager' },
          { id:'adminChatbotSub',          label:'Subtitle',            type:'text',     default:'Manage the AI assistant shown to parents on the site.' },
          { id:'chatbotGreeting',          label:'Chatbot greeting',    type:'text',     default:'Hi! I\'m your school finder. What are you looking for?' },
          { id:'chatbotPlaceholder',       label:'Input placeholder',   type:'text',     default:'Ask me anything about schools...' },
          { id:'chatbotBubbleColor',       label:'Bubble colour',       type:'color',    default:'#B8860B', cssVar:'--chatbot-bubble-color' },
        ],
      },
    ],
  },
  {
    label: 'Global Buttons', icon: '🔘', contentKey: 'buttons', previewUrl: '/',
    sections: [
      {
        id: 'buttons', label: 'Button Styles',
        fields: [
          { id:'btnPrimaryBg',    label:'Primary button background', type:'color', cssVar:'--btn-primary-bg',    default:'#0D1117' },
          { id:'btnPrimaryColor', label:'Primary button text',       type:'color', cssVar:'--btn-primary-color', default:'#FAF7F2' },
          { id:'global.btnGoldBg',       label:'Gold button background',    type:'color', cssVar:'--btn-gold-bg',       default:'#B8860B' },
          { id:'global.btnGoldColor',    label:'Gold button text',          type:'color', cssVar:'--btn-gold-color',    default:'#ffffff' },
          { id:'btnSize',         label:'Button font size',          type:'size',  cssVar:'--btn-size',          default:'14', min:11, max:20 },
          { id:'radius',          label:'Border radius',             type:'size',  cssVar:'--radius',            default:'12', min:0, max:32 },
        ],
      },
    ],
  },
  {
    label: 'Contact Page', icon: '📞', contentKey: 'contact', previewUrl: '/contact',
    sections: [
      { id:'contact-hero', label:'Hero Section',
        fields: [
          { id:'eyebrow',      label:'Eyebrow text',                type:'text', default:"We'd love to hear from you" },
          { id:'h1',           label:'Page headline',               type:'text', default:'Contact Us' },
        ],
      },
      { id:'contact-cards', label:'Contact Cards',
        fields: [
          { id:'genEmail',     label:'General enquiries email',     type:'text', default:'hello@thynkschooling.in' },
          { id:'genPhone',     label:'General phone',               type:'text', default:'+91 88000 00000' },
          { id:'genHours',     label:'Office hours',                type:'text', default:'Mon–Fri, 10 AM – 7 PM IST' },
          { id:'schoolEmail',  label:'Schools partnerships email',  type:'text', default:'schools@thynkschooling.in' },
          { id:'schoolPhone',  label:'Schools phone',               type:'text', default:'+91 88000 00001' },
          { id:'pressEmail',   label:'Press email',                 type:'text', default:'press@thynkschooling.in' },
          { id:'officeName',   label:'Company name',                type:'text', default:'Thynk Schooling Pvt. Ltd.' },
          { id:'officeAddress',label:'Office address',              type:'text', default:'New Delhi, India — 110001' },
        ],
      },
      { id:'contact-style', label:'Colours & Style',
        fields: [
          { id:'contactBg',    label:'Page background',             type:'color', default:'#FAF7F2', cssVar:'--contact-bg' },
          { id:'contactH1Color',label:'H1 colour',                  type:'color', default:'#0D1117', cssVar:'--contact-h1-color' },
          { id:'contactH1Size', label:'H1 size',                    type:'size',  default:'40', min:24, max:72, cssVar:'--contact-h1-size' },
        ],
      },
    ],
  },
  {
    label: 'School Dashboard — Packages', icon: '📦', contentKey: 'school-packages', previewUrl: '/dashboard/school/packages',
    sections: [
      { id:'school-packages-hero', label:'Page Hero',
        fields: [
          { id:'pkgEyebrow',   label:'Eyebrow badge text',          type:'text',     default:'Subscription Plans' },
          { id:'pkgH1Line1',   label:'H1 line 1',                   type:'text',     default:'Choose Your Plan' },
          { id:'pkgH1Italic',  label:'H1 italic line',              type:'text',     default:'& Grow Admissions' },
          { id:'pkgSubtext',   label:'Subtitle',                    type:'textarea', default:'Get leads included every month. Upgrade or cancel anytime.' },
        ],
      },
      { id:'school-packages-cta', label:'Checkout & CTA',
        fields: [
          { id:'pkgPopularBadge',label:'Popular badge text',        type:'text',     default:'⭐ Most Popular' },
          { id:'pkgSecureNote', label:'Security note below button', type:'text',     default:'🔒 Secure payment · Cancel anytime · No hidden fees' },
          { id:'pkgPayPerLead', label:'Pay-per-lead note',          type:'textarea', default:'Pay-per-lead also available — unlock individual leads directly from your dashboard.' },
        ],
      },
      { id:'school-packages-style', label:'Colours & Style',
        fields: [
          { id:'pkgBg',         label:'Page background',            type:'color', default:'#FDFAF5', cssVar:'--school-packages-bg' },
          { id:'pkgCardBg',     label:'Card background (regular)',  type:'color', default:'#FFFFFF', cssVar:'--school-packages-card-bg' },
          { id:'pkgCardDarkBg', label:'Card background (featured)', type:'color', default:'#0D1117', cssVar:'--school-packages-card-dark-bg' },
          { id:'pkgAccentColor',label:'Accent / gold colour',       type:'color', default:'#B8860B', cssVar:'--school-packages-accent' },
        ],
      },
    ],
  },
  {
    label: 'School Dashboard — Analytics', icon: '📊', contentKey: 'school-analytics', previewUrl: '/dashboard/school/analytics',
    sections: [
      { id:'school-analytics', label:'Analytics Page',
        fields: [
          { id:'analyticsTitle',   label:'Page title',              type:'text', default:'School Analytics' },
          { id:'analyticsLeads',   label:'"Total Leads" label',     type:'text', default:'Total Leads' },
          { id:'analyticsApps',    label:'"Applications" label',    type:'text', default:'Applications' },
          { id:'analyticsConv',    label:'"Conversion" label',      type:'text', default:'Conversion' },
          { id:'analyticsViews',   label:'"Profile Views" label',   type:'text', default:'Profile Views' },
          { id:'analyticsRating',  label:'"Avg Rating" label',      type:'text', default:'Avg Rating' },
        ],
      },
    ],
  },
  {
    label: 'School Dashboard — Applications', icon: '📋', contentKey: 'school-applications', previewUrl: '/dashboard/school/applications',
    sections: [
      { id:'school-apps', label:'Applications Page',
        fields: [
          { id:'schoolAppsTitle',  label:'Page title',              type:'text', default:'Applications' },
          { id:'schoolAppsSub',    label:'Subtitle',                type:'text', default:'Review and respond to parent applications' },
          { id:'schoolAppsEmpty',  label:'Empty state message',     type:'text', default:'No applications yet. Your profile is live — leads will appear here.' },
        ],
      },
    ],
  },
  {
    label: 'School Dashboard — Leads', icon: '📈', contentKey: 'school-leads', previewUrl: '/dashboard/school/leads',
    sections: [
      { id:'school-leads', label:'Leads Page',
        fields: [
          { id:'schoolLeadsTitle', label:'Page title',              type:'text', default:'My Leads' },
          { id:'schoolLeadsSub',   label:'Subtitle',                type:'text', default:'Parent leads who enquired about your school' },
          { id:'schoolLeadsEmpty', label:'Empty state message',     type:'text', default:'No leads yet. Make sure your school profile is complete to attract parents.' },
        ],
      },
    ],
  },
  {
    label: 'School Dashboard — Reviews', icon: '⭐', contentKey: 'school-reviews', previewUrl: '/dashboard/school/reviews',
    sections: [
      { id:'school-reviews', label:'Reviews Page',
        fields: [
          { id:'schoolReviewsTitle',label:'Page title',             type:'text', default:'School Reviews' },
          { id:'schoolReviewsSub',  label:'Subtitle',               type:'text', default:'What parents say about your school' },
          { id:'schoolReviewsEmpty',label:'Empty state message',    type:'text', default:'No reviews yet. Encourage parents to leave a review after visiting.' },
        ],
      },
    ],
  },
  {
    label: 'Parent Dashboard', icon: '👨‍👩‍👧', contentKey: 'parent-dashboard', previewUrl: '/dashboard/parent',
    sections: [
      { id:'parent-dash-labels', label:'Section Labels & Titles',
        fields: [
          { id:'parentDashTitle',      label:'Dashboard title',     type:'text', default:'Your School Journey' },
          { id:'parentDashSub',        label:'Dashboard subtitle',  type:'text', default:'Your school admission journey at a glance' },
          { id:'parentChildrenTitle',  label:'Children section',    type:'text', default:'My Children' },
          { id:'parentAppsTitle',      label:'Applications section',type:'text', default:'My Applications' },
          { id:'parentSavedTitle',     label:'Saved schools section',type:'text',default:'Saved Schools' },
          { id:'parentRecsTitle',      label:'Recommendations section',type:'text',default:'AI School Matches' },
          { id:'parentSessionsTitle',  label:'Sessions section',    type:'text', default:'Free Counselling' },
          { id:'parentNotifsTitle',    label:'Notifications section',type:'text',default:'Notifications' },
        ],
      },
      { id:'parent-dash-empty', label:'Empty State Messages',
        fields: [
          { id:'parentNoChildren',  label:'No children added text', type:'text', default:'Add your child\'s profile to get personalised school matches.' },
          { id:'parentNoApps',      label:'No applications text',   type:'text', default:'You haven\'t applied to any schools yet. Browse schools to get started.' },
          { id:'parentNoSaved',     label:'No saved schools text',  type:'text', default:'Save schools you\'re interested in to compare them later.' },
          { id:'parentNoRecs',      label:'No recommendations text',type:'text', default:'Add a child profile so we can recommend the best matching schools.' },
        ],
      },
    ],
  },
  {
    label: 'Marquee Items', icon: '📢', contentKey: '__marquee__', previewUrl: '/',
    sections: [],
  },
]

// Build ALL_FIELDS flat map
// ── URL map for live preview per page group ──────────────────────────
const PAGE_URLS: Record<string, string> = {
  'Homepage':                        '/',
  'Navbar':                          '/',
  'Footer':                          '/',
  'Schools Page':                    '/schools',
  'Login / Register':                '/login',
  'Counselling Page':                '/counselling',
  'Cities Section':                  '/',
  'Counselling CTA':                 '/',
  'For Schools CTA':                 '/',
  'Testimonials':                    '/',
  'Blog Preview':                    '/',
  'Compare Page':                    '/compare',
  'Pricing Page':                    '/pricing',
  'Blog Page':                       '/blog',
  'About Page':                      '/about',
  'Admin Panel':                     '/admin',
  'Global Buttons':                  '/',
  'School Dashboard':                '/dashboard/school',
  'Parent Dashboard':                '/dashboard/parent',
  'Cities Page':                     '/cities',
  'Privacy / Terms':                 '/privacy',
  'Contact Page':                    '/contact',
  'Careers':                         '/careers',
  'Press':                           '/press',
  'Terms of Service':                '/terms',
  'Grievance':                       '/grievance',
  'Refund Policy':                   '/refund',
  'Recommendations':                 '/recommendations',
  'User Profile':                    '/profile',
  'Apply Page':                      '/apply/school',
  'Blog — Post':                     '/blog',
  'Forgot / Reset Password':         '/forgot-password',
  'Admin — Blog':                    '/admin/blog',
  'Admin — Featured Schools':        '/admin/featured-schools',
  'Admin — Menu':                    '/admin/menu',
  'Admin — School Report':           '/admin/school-report',
  'Admin — Email Triggers':          '/admin/email-triggers',
  'Admin — Chatbot':                 '/admin/chatbot',
  'School Dashboard — Packages':     '/dashboard/school/packages',
  'School Dashboard — Analytics':    '/dashboard/school/analytics',
  'School Dashboard — Applications': '/dashboard/school/applications',
  'School Dashboard — Leads':        '/dashboard/school/leads',
  'School Dashboard — Reviews':      '/dashboard/school/reviews',
  'Parent Dashboard':                '/dashboard/parent',
}

const ALL_CSS_FIELDS: Record<string, Field> = {}
PAGES.forEach(p => p.sections.forEach(s => s.fields.forEach(f => {
  if (f.cssVar) ALL_CSS_FIELDS[f.id] = f
})))

function buildCSSVars(values: Record<string, string>): string {
  const lines: string[] = []
  Object.entries(ALL_CSS_FIELDS).forEach(([id, field]) => {
    const val = values[id]
    if (val && val !== field.default) {
      const cssVal = field.type === 'size' ? `${val}px` : val
      lines.push(`  ${field.cssVar}: ${cssVal};`)
    }
  })
  return lines.length ? `:root {\n${lines.join('\n')}\n}` : ''
}

// ── UI Components ──────────────────────────────────────────────
const inp: React.CSSProperties = { width:'100%', padding:'9px 12px', background:'#fff', border:'1.5px solid #EDE5D8', borderRadius:'8px', fontSize:'13px', fontFamily:'Inter,sans-serif', color:'#0D1117', outline:'none', boxSizing:'border-box' as const, colorScheme:'light' as any }
const lbl: React.CSSProperties = { display:'block', fontSize:'10px', fontWeight:600, letterSpacing:'1.2px', textTransform:'uppercase' as const, color:'#718096', fontFamily:'Inter,sans-serif', marginBottom:'5px' }

function FieldRow({ field, value, onChange }: { field: Field; value: string; onChange: (v: string) => void }) {
  const v = value  // value is always pre-populated with default; never empty
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px 0', borderBottom:'1px solid rgba(13,17,23,0.05)' }}>
      <label style={{ ...lbl, marginBottom:0, minWidth:'180px', flexShrink:0 }}>{field.label}</label>
      <div style={{ flex:1 }}>
        {field.type === 'color' && (
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <input type="color" value={v.startsWith('#') ? v : '#000000'}
              onChange={e => onChange(e.target.value)}
              style={{ width:36, height:32, border:'1.5px solid #EDE5D8', borderRadius:'7px', padding:'2px', cursor:'pointer', background:'none', flexShrink:0 }} />
            <input type="text" value={v}
              onChange={e => onChange(e.target.value)}
              style={{ ...inp, fontFamily:'monospace', fontSize:'12px', maxWidth:'160px' }} />
          </div>
        )}
        {field.type === 'size' && (
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <input type="range" min={field.min || 8} max={field.max || 100} value={Number(v) || field.min || 8}
              onChange={e => onChange(e.target.value)}
              style={{ flex:1, accentColor:'#B8860B', cursor:'pointer' }} />
            <span style={{ fontFamily:'monospace', fontSize:'12px', fontWeight:700, color:'#B8860B', minWidth:'52px', textAlign:'right' as const }}>
              {v}px
            </span>
          </div>
        )}
        {field.type === 'text' && (
          <input type="text" value={v}
            onChange={e => onChange(e.target.value)} style={inp} />
        )}
        {field.type === 'textarea' && (
          <textarea value={v}
            onChange={e => onChange(e.target.value)}
            style={{ ...inp, resize:'vertical' as const, lineHeight:1.6 }} rows={2} />
        )}
      </div>
      <button onClick={() => onChange(field.default)} title="Reset to default"
        style={{ padding:'4px 8px', borderRadius:'6px', border:'1px solid #EDE5D8', background:'transparent', color:'#A0ADB8', cursor:'pointer', fontSize:'11px', flexShrink:0 }}>
        Reset
      </button>
    </div>
  )
}

// ── Marquee Admin Component ──────────────────────────────────────────────────
interface MItem { id: string; text: string; emoji: string }
function MarqueeAdmin() {
  const [items, setItems] = useState<MItem[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin?action=marquee-items')
      .then(r => r.json())
      .then(d => { setItems(d.items || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      await fetch('/api/admin?action=marquee-items', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      toast.success('Marquee items saved!')
    } catch { toast.error('Save failed') }
    setSaving(false)
  }

  const add = () => setItems(p => [...p, { id: Date.now().toString(), emoji: '✨', text: 'New item' }])
  const remove = (id: string) => setItems(p => p.filter(x => x.id !== id))
  const update = (id: string, key: keyof MItem, val: string) =>
    setItems(p => p.map(x => x.id === id ? { ...x, [key]: val } : x))

  const S = {
    card: { background:'#fff', border:'1px solid rgba(13,17,23,0.09)', borderRadius:12, overflow:'hidden' as const, color:'#0D1117' },
    head: { padding:'12px 16px', borderBottom:'1px solid rgba(13,17,23,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 },
    row: { display:'flex', alignItems:'center', gap:10, padding:'10px 16px', borderBottom:'1px solid rgba(13,17,23,0.05)' },
    inp: { flex:1, padding:'8px 12px', background:'#FAF7F2', border:'1.5px solid #EDE5D8', borderRadius:8, fontSize:13, fontFamily:'Inter,sans-serif', color:'#0D1117', outline:'none' },
    emojiInp: { width:52, padding:'8px', background:'#FAF7F2', border:'1.5px solid #EDE5D8', borderRadius:8, fontSize:14, textAlign:'center' as const, outline:'none' },
    btn: (bg: string, color: string) => ({ padding:'7px 16px', borderRadius:8, background:bg, border:'none', color, fontSize:12, fontWeight:700, fontFamily:'Inter,sans-serif', cursor:'pointer', display:'flex', alignItems:'center', gap:6 }),
  }

  if (loading) return <div style={S.card}><div style={{ padding:24, textAlign:'center', color:'#A0ADB8', fontFamily:'Inter,sans-serif', fontSize:13 }}>Loading...</div></div>

  return (
    <div style={S.card}>
      <div style={S.head}>
        <div>
          <span style={{ fontFamily:'Inter,sans-serif', fontSize:12, fontWeight:700, color:'#B8860B', textTransform:'uppercase', letterSpacing:'1px' }}>📢 Marquee Items</span>
          <p style={{ fontFamily:'Inter,sans-serif', fontSize:11, color:'#A0ADB8', margin:'2px 0 0' }}>Text scrolling left-to-right on homepage</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={add} style={S.btn('#FEF7E0','#B8860B')}>
            <Plus style={{ width:11, height:11 }} />Add Item
          </button>
          <button onClick={save} disabled={saving} style={S.btn('#B8860B','#fff')}>
            {saving ? <><Loader2 style={{ width:11, height:11, animation:'spin 1s linear infinite' }} />Saving...</> : '✓ Save'}
          </button>
        </div>
      </div>

      {/* Preview strip */}
      <div style={{ background:'#0D1117', padding:'10px 0', overflow:'hidden', position:'relative' }}>
        <div style={{ display:'flex', gap:32, padding:'0 20px', whiteSpace:'nowrap', overflow:'hidden' }}>
          {items.slice(0, 5).map(it => (
            <span key={it.id} style={{ fontFamily:'Inter,sans-serif', fontSize:12, color:'rgba(250,247,242,0.6)', display:'inline-flex', alignItems:'center', gap:6 }}>
              {it.emoji} {it.text} <span style={{ width:4, height:4, borderRadius:'50%', background:'#B8860B', opacity:.6, display:'inline-block' }} />
            </span>
          ))}
        </div>
      </div>

      {/* Items list */}
      {items.map((item, i) => (
        <div key={item.id} style={S.row}>
          <GripVertical style={{ width:14, height:14, color:'#D4D4D4', flexShrink:0 }} />
          <span style={{ fontFamily:'Inter,sans-serif', fontSize:11, color:'#A0ADB8', minWidth:20, textAlign:'center' }}>{i + 1}</span>
          <input value={item.emoji} onChange={e => update(item.id, 'emoji', e.target.value)}
            style={S.emojiInp} placeholder="🎓" />
          <input value={item.text} onChange={e => update(item.id, 'text', e.target.value)}
            style={S.inp} placeholder="Enter marquee text..." />
          <button onClick={() => remove(item.id)}
            style={{ background:'transparent', border:'none', cursor:'pointer', padding:6, color:'#FCA5A5', borderRadius:6 }}>
            <Trash2 style={{ width:13, height:13 }} />
          </button>
        </div>
      ))}

      {items.length === 0 && (
        <div style={{ padding:24, textAlign:'center', color:'#A0ADB8', fontFamily:'Inter,sans-serif', fontSize:13 }}>
          No items yet. <button onClick={add} style={{ background:'none', border:'none', color:'#B8860B', cursor:'pointer', fontWeight:700 }}>Add one</button>
        </div>
      )}
    </div>
  )
}

export default function AdminContentPage() {
  const [values,       setValues]      = useState<Record<string,string>>({})
  const [activeGroup,  setActiveGroup] = useState('Homepage')
  const [openSections, setOpenSections]= useState<Record<string,boolean>>({ 'hero-text':true })
  const [savedGroups,  setSavedGroups] = useState<Record<string,boolean>>({})
  const [dirtyGroups,  setDirtyGroups] = useState<Record<string,boolean>>({})
  const [pushing,      setPushing]     = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Load saved values on mount
  const loadedRef = useRef(false)
  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    // Pre-populate every field with its default value first
    const defaults: Record<string,string> = {}
    PAGES.forEach(p => p.sections.forEach(s => s.fields.forEach(f => { defaults[f.id] = f.default })))
    // Then fetch DB values and override defaults
    fetch('/api/admin/content', { cache:'no-store' })
      .then(r => r.json())
      .then(data => {
        const fromDB: Record<string,string> = {}
        if (data) {
          Object.entries(data).forEach(([, val]: [string, any]) => {
            if (val && typeof val === 'object' && !Array.isArray(val)) {
              Object.entries(val).forEach(([k, v]) => { if (typeof v === 'string') fromDB[k] = v })
            }
          })
          if (data['content.styles']) Object.assign(fromDB, data['content.styles'])
        }
        setValues({ ...defaults, ...fromDB })
      })
      .catch(() => setValues(defaults))
  }, [])

  const set = useCallback((id: string, v: string) => {
    setValues(p => ({ ...p, [id]: v }))
    setDirtyGroups(p => ({ ...p, [activeGroup]: true }))
    setSavedGroups(p => ({ ...p, [activeGroup]: false }))
    // Live preview
    const field = ALL_CSS_FIELDS[id]
    if (field?.cssVar) {
      const cssVal = field.type === 'size' ? `${v}px` : v
      document.documentElement.style.setProperty(field.cssVar, cssVal)
    }
  }, [activeGroup])

  const saveGroup = async () => {
    if (!dirtyGroups[activeGroup]) return
    setPushing(true)
    try {
      const saveToDB = async (key: string, value: any) => {
        const res = await fetch('/api/admin/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, value }),
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(json.error || `Save failed for ${key}`)
      }

      // Save CSS vars
      const css = buildCSSVars(values)
      if (css) await saveToDB('content.css', css)

      // Save content fields for active group only
      const activePage = PAGES.find(p => p.label === activeGroup)
      if (activePage) {
        const pageValues: Record<string,string> = {}
        activePage.sections.forEach(s => s.fields.forEach(f => {
          if (values[f.id] !== undefined && values[f.id] !== '') pageValues[f.id] = values[f.id]
        }))
        if (Object.keys(pageValues).length > 0) await saveToDB(activePage.contentKey, pageValues)
      }

      setSavedGroups(p => ({ ...p, [activeGroup]: true }))
      setDirtyGroups(p => ({ ...p, [activeGroup]: false }))
      toast.success(`✅ "${activeGroup}" saved to site!`)
      // Bust the content cache so live pages re-fetch immediately
      refreshContent()
      // Reload the preview iframe to show updated content
      setTimeout(() => {
        if (iframeRef.current) iframeRef.current.src = iframeRef.current.src
      }, 400)
    } catch (e: any) {
      toast.error(e.message || 'Save failed')
    }
    setPushing(false)
  }

  const pushAll = async () => {
    setPushing(true)
    try {
      const saveToDB = async (key: string, value: any) => {
        const res = await fetch('/api/admin/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, value }),
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(json.error || `Save failed for ${key}`)
      }
      const css = buildCSSVars(values)
      if (css) await saveToDB('content.css', css)
      for (const page of PAGES) {
        const pageValues: Record<string,string> = {}
        page.sections.forEach(s => s.fields.forEach(f => {
          if (values[f.id] !== undefined && values[f.id] !== '') pageValues[f.id] = values[f.id]
        }))
        if (Object.keys(pageValues).length > 0) await saveToDB(page.contentKey, pageValues)
      }
      setSavedGroups({})
      setDirtyGroups({})
      toast.success('🚀 All changes saved to site!')
      refreshContent()
      setTimeout(() => {
        if (iframeRef.current) iframeRef.current.src = iframeRef.current.src
      }, 400)
    } catch (e: any) { toast.error(e.message || 'Push failed') }
    setPushing(false)
  }

  const activePage = PAGES.find(p => p.label === activeGroup)
  const readyCount = Object.values(savedGroups).filter(Boolean).length

  return (
    <AdminLayout pageClass="admin-page-settings" title="Content & Style Manager" subtitle="Edit text, colours and sizes - changes apply live">

      {/* Top bar */}
      <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'16px', padding:'12px 16px', background:'#fff', border:'1px solid rgba(13,17,23,0.09)', borderRadius:'12px', color:'#0D1117' }}>
        <span style={{ fontSize:'12px', color:'#718096', flex:1, fontFamily:'Inter,sans-serif' }}>
          {dirtyGroups[activeGroup] ? `Unsaved changes in "${activeGroup}" - click Save to apply` : 'Make changes below then click Save. Use "Save All Pages" to save everything at once.'}
        </span>
        <button onClick={saveGroup} disabled={pushing || !dirtyGroups[activeGroup]}
          style={{ padding:'8px 18px', borderRadius:'8px', background: dirtyGroups[activeGroup] ? '#FEF7E0' : '#f3f4f6', border:`1px solid ${dirtyGroups[activeGroup] ? '#B8860B' : '#e5e7eb'}`, color: dirtyGroups[activeGroup] ? '#B8860B' : '#9ca3af', cursor: (pushing || !dirtyGroups[activeGroup]) ? 'not-allowed' : 'pointer', fontSize:'13px', fontWeight:700, fontFamily:'Inter,sans-serif', display:'flex', alignItems:'center', gap:'6px' }}>
          {pushing ? <><Loader2 style={{width:12,height:12,animation:'spin 1s linear infinite'}}/>Saving...</> : <>✓ Save {activeGroup}</>}
        </button>
        <button onClick={pushAll} disabled={pushing}
          style={{ display:'flex', alignItems:'center', gap:'7px', padding:'9px 22px', borderRadius:'9px', background:'#B8860B', border:'none', color:'#fff', cursor:pushing?'not-allowed':'pointer', fontSize:'13px', fontWeight:700, fontFamily:'Inter,sans-serif', opacity:pushing?0.5:1 }}>
          {pushing ? <><Loader2 style={{width:13,height:13,animation:'spin 1s linear infinite'}}/>Saving...</> : <><Globe style={{width:13,height:13}}/>Save All Pages</>}
        </button>
      </div>

      {/* 3-col layout */}
      <div style={{ display:'grid', gridTemplateColumns:'200px 1fr 280px', gap:'14px', alignItems:'start' }}>

        {/* Left sidebar */}
        <div style={{ background:'#fff', border:'1px solid rgba(13,17,23,0.09)', borderRadius:'12px', overflow:'hidden', position:'sticky', top:'80px', color:'#0D1117' }}>
          {PAGES.map(page => (
            <button key={page.label} onClick={() => setActiveGroup(page.label)}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:'10px', padding:'11px 14px', border:'none', borderBottom:'1px solid rgba(13,17,23,0.05)', cursor:'pointer', textAlign:'left' as const,
                background: activeGroup===page.label ? 'rgba(184,134,11,0.07)' : '#fff',
                borderLeft: activeGroup===page.label ? '3px solid #B8860B' : '3px solid transparent' }}>
              <span style={{ fontSize:'16px' }}>{page.icon}</span>
              <span style={{ fontFamily:'Inter,sans-serif', fontSize:'12px', fontWeight: activeGroup===page.label ? 700 : 500, color: activeGroup===page.label ? '#B8860B' : '#0D1117' }}>{page.label}</span>
              {savedGroups[page.label] && <span style={{ marginLeft:'auto', width:6, height:6, borderRadius:'50%', background:'#22c55e', flexShrink:0 }} />}
              {dirtyGroups[page.label] && !savedGroups[page.label] && <span style={{ marginLeft:'auto', width:6, height:6, borderRadius:'50%', background:'#f59e0b', flexShrink:0 }} />}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
          {activePage?.contentKey === '__marquee__' ? (
            <MarqueeAdmin />
          ) : (
            activePage?.sections.map(section => (
              <div key={section.id} style={{ background:'#fff', border:'1px solid rgba(13,17,23,0.09)', borderRadius:'12px', overflow:'hidden', color:'#0D1117' }}>
                <button onClick={() => setOpenSections(p => ({ ...p, [section.id]: !p[section.id] }))}
                  style={{ width:'100%', display:'flex', alignItems:'center', gap:'10px', padding:'12px 16px', border:'none', background: openSections[section.id] ? 'rgba(184,134,11,0.03)' : '#fff', cursor:'pointer', textAlign:'left' as const }}>
                  <span style={{ fontFamily:'Inter,sans-serif', fontSize:'12px', fontWeight:700, color:'#B8860B', flex:1, textTransform:'uppercase' as const, letterSpacing:'1px' }}>{section.label}</span>
                  {openSections[section.id] ? <ChevronDown style={{width:14,height:14,color:'#A0ADB8'}}/> : <ChevronRight style={{width:14,height:14,color:'#A0ADB8'}}/>}
                </button>
                {openSections[section.id] && (
                  <div style={{ padding:'0 16px 8px' }}>
                    {section.fields.map(field => (
                      <FieldRow key={field.id} field={field} value={values[field.id] ?? field.default} onChange={v => set(field.id, v)} />
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Live Preview */}
        <div style={{ position:'sticky', top:'80px' }}>
          <div style={{ background:'#fff', border:'1px solid rgba(13,17,23,0.09)', borderRadius:'12px', overflow:'hidden', color:'#0D1117' }}>
            <div style={{ padding:'10px 14px', borderBottom:'1px solid rgba(13,17,23,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontSize:'10px', fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase' as const, color:'#A0ADB8', fontFamily:'Inter,sans-serif' }}>Live Preview</span>
              <a href={activePage?.previewUrl || '/'} target="_blank" rel="noreferrer" style={{ fontSize:'11px', color:'#B8860B', textDecoration:'none', fontFamily:'Inter,sans-serif', fontWeight:600 }}>Open</a>
            </div>
            <div style={{ background:'#f0f0f0', padding:'6px 10px', display:'flex', gap:'5px', borderBottom:'1px solid rgba(13,17,23,0.07)', alignItems:'center' }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:'#FF5F56' }} />
              <div style={{ width:7, height:7, borderRadius:'50%', background:'#FFBD2E' }} />
              <div style={{ width:7, height:7, borderRadius:'50%', background:'#27C93F' }} />
              <div style={{ flex:1, background:'#fff', borderRadius:'3px', padding:'2px 8px', fontSize:'10px', color:'#999', fontFamily:'monospace', marginLeft:'4px' }}>{activePage?.previewUrl || '/'}</div>
            </div>
            <iframe
              ref={iframeRef}
              key={`content-preview-${activeGroup}`}
              src={activePage?.previewUrl || '/'}
              style={{ width:'100%', height:'540px', border:'none', display:'block' }}
              title="Site Preview"
            />
          </div>
          <p style={{ fontSize:'11px', color:'#A0ADB8', fontFamily:'Inter,sans-serif', textAlign:'center' as const, marginTop:'8px', lineHeight:1.5 }}>
            Preview reloads automatically after save
          </p>
        </div>
      </div>
    </AdminLayout>
  )
}
