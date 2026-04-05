// In components/admin/AdminLayout.tsx
// Add this import at the top (with the other lucide imports):
//   import { BookOpen } from 'lucide-react'  ← add BookOpen to existing import
//
// Then replace the NAV_GROUPS constant with this updated version:

const NAV_GROUPS = [
  { label:'Overview', items:[
    { icon:LayoutDashboard, label:'Dashboard',   href:'/admin' },
    { icon:BarChart3,       label:'Analytics',   href:'/admin/analytics' },
  ]},
  { label:'Management', items:[
    { icon:School,     label:'Schools',          href:'/admin/schools' },
    { icon:Star,       label:'Featured Schools',  href:'/admin/featured-schools' },
    { icon:Users,      label:'Users',            href:'/admin/users' },
    { icon:FileCheck,  label:'Applications',     href:'/admin/applications' },
    { icon:TrendingUp, label:'Leads',            href:'/admin/leads' },
    { icon:Star,       label:'Reviews',          href:'/admin/reviews' },
    { icon:PhoneCall,  label:'Counselling',      href:'/admin/counselling' },
    { icon:BookOpen,   label:'Blog',             href:'/admin/blog' },   // ← NEW
  ]},
  { label:'Monetisation', items:[
    { icon:DollarSign,   label:'Lead Pricing',         href:'/admin/lead-pricing' },
    { icon:LayoutGrid,   label:'Subscription Plans',   href:'/admin/subscription-plans' },
    { icon:FileText,     label:'Payments',             href:'/admin/payments' },
  ]},
  { label:'Platform', items:[
    { icon:Settings,   label:'Settings',     href:'/admin/settings' },
    { icon:Palette,    label:'Theme',        href:'/admin/theme' },
    { icon:Mail,       label:'Integrations', href:'/admin/integrations' },
    { icon:FileText,   label:'Page Content', href:'/admin/content' },
    { icon:Bell,       label:'Notifications',    href:'/admin/notifications' },
    { icon:Zap,        label:'Message Triggers',   href:'/admin/email-triggers' },
    { icon:BarChart3,  label:'SEO Manager',  href:'/admin/seo' },
    { icon:ImageIcon,  label:'Media & Brand',href:'/admin/media' },
    { icon:MapPin,     label:'SEO Cities',   href:'/admin/cities' },
  ]},
]
