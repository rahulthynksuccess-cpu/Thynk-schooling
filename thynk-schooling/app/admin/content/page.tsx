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
        id: 'counselling', label: 'Counselling Page',
        fields: [
          { id:'h1',       label:'Page headline',          type:'text',     default:'Free 1-on-1 School Counselling' },
          { id:'counsel.subtext',  label:'Subtitle',               type:'textarea', default:'Our expert counsellors help you find the right school for your child.' },
          { id:'counsel.ctaLabel', label:'CTA button text',        type:'text',     default:'Book Free Session' },
          { id:'benefit1', label:'Benefit 1',              type:'text',     default:'Personalised school shortlist' },
          { id:'benefit2', label:'Benefit 2',              type:'text',     default:'Application guidance' },
          { id:'benefit3', label:'Benefit 3',              type:'text',     default:'100% free service' },
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
      { id:'about', label:'About Page',
        fields: [
          { id:'aboutTitle',   label:'Page title',      type:'text',     default:'About Thynk Schooling' },
          { id:'aboutMission', label:'Mission statement',type:'textarea', default:"India's most trusted school discovery platform - connecting parents with the right schools." },
          { id:'aboutVision',  label:'Vision statement', type:'textarea', default:'A world where every child finds the school that helps them thrive.' },
          { id:'aboutBg',      label:'Background',       type:'color',    default:'#FAF7F2', cssVar:'--about-bg' },
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
    label: 'Marquee Items', icon: '📢', contentKey: '__marquee__', previewUrl: '/',
    sections: [],
  },
]

// Build ALL_FIELDS flat map
// ── URL map for live preview per page group ──────────────────────────
const PAGE_URLS: Record<string, string> = {
  'Homepage':           '/',
  'Navbar':             '/',
  'Footer':             '/',
  'Schools Page':       '/schools',
  'Login / Register':   '/login',
  'Counselling Page':   '/counselling',
  'Cities Section':     '/',
  'Counselling CTA':    '/',
  'For Schools CTA':    '/',
  'Testimonials':       '/',
  'Blog Preview':       '/',
  'Compare Page':       '/compare',
  'Pricing Page':       '/pricing',
  'Blog Page':          '/blog',
  'About Page':         '/about',
  'Admin Panel':        '/admin',
  'Global Buttons':     '/',
  'School Dashboard':   '/dashboard/school',
  'Parent Dashboard':   '/dashboard/parent',
  'Cities Page':        '/cities',
  'Privacy / Terms':    '/privacy',
  'Contact Page':       '/contact',
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
