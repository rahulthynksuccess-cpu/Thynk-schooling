import type { Metadata, Viewport } from 'next'
import { ContentStyleInjector } from '@/components/ContentStyleInjector'
import './globals.css'
import { Providers } from './providers'
import { config } from '@/lib/config'
import ChatbotWidget from '@/components/chatbot/ChatbotWidget'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: { default: `${config.app.name} — Find the Best Schools in India`, template: `%s | ${config.app.name}` },
  description: 'Search, compare and apply to 12,000+ verified schools across India. Free AI-powered recommendations and 1-on-1 counselling.',
  metadataBase: new URL(config.app.url),
}
export const viewport: Viewport = {
  themeColor: '#FAF7F2',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

async function getThemeVars(): Promise<string> {
  try {
    const { default: db } = await import('@/lib/db')
    const res = await db.query("SELECT value FROM site_settings WHERE key = 'theme'")
    if (!res.rows.length) return ''
    const t = JSON.parse(res.rows[0].value)
    const px = (v: any, fallback: number) => `${v ?? fallback}px`
    return `:root {
  --ivory:       ${t.ivory      || '#FAF7F2'};
  --ivory-2:     ${t.ivory2     || '#F5F0E8'};
  --ivory-3:     ${t.ivory3     || '#EDE5D8'};
  --ink:         ${t.ink        || '#0D1117'};
  --ink-2:       ${t.ink2       || '#1C2333'};
  --ink-muted:   ${t.inkMuted   || '#4A5568'};
  --ink-faint:   ${t.inkFaint   || '#A0ADB8'};
  --gold:        ${t.gold       || '#B8860B'};
  --gold-2:      ${t.gold2      || '#C9960D'};
  --gold-light:  ${t.goldLight  || '#E8C547'};
  --gold-wash:   ${t.goldWash   || '#FEF7E0'};
  --border:      ${t.border     || 'rgba(13,17,23,0.09)'};
  --font-serif:  '${t.fontSerif || 'Cormorant Garamond'}', Georgia, serif;
  --font-sans:   '${t.fontSans  || 'Inter'}', system-ui, sans-serif;
  --radius:      ${px(t.radius, 12)};
  --radius-sm:   ${px(t.btnRadius, 6)};
  --container-width: ${t.containerWidth || 1600}px;
  --nav-bg:                   ${t.navBg              || 'rgba(250,247,242,0.95)'};
  --nav-size:                 ${px(t.navSize, 14)};
  --nav-color:                ${t.navColor            || '#4A5568'};
  --nav-weight:               ${t.navWeight           || 400};
  --hero-bg:                  ${t.heroBg              || '#FAF7F2'};
  --hero-bg-grad:             ${t.heroBgGrad          || '#F0EAD6'};
  --hero-h1-size:             ${px(t.heroH1Size, 96)};
  --hero-h1-color:            ${t.heroH1Color         || '#0D1117'};
  --hero-italic-color:        ${t.heroItalicColor     || '#B8860B'};
  --hero-sub-size:            ${px(t.heroSubSize, 17)};
  --hero-sub-color:           ${t.heroSubColor        || '#4A5568'};
  --hero-sub-weight:          ${t.heroSubWeight       || 300};
  --hero-eyebrow-size:        ${px(t.heroEyebrowSize, 11)};
  --hero-eyebrow-color:       ${t.heroEyebrowColor    || '#B8860B'};
  --stats-bg:                 ${t.statsBg             || '#F5F0E8'};
  --stat-num-size:            ${px(t.statNumSize, 42)};
  --stat-num-color:           ${t.statNumColor        || '#0D1117'};
  --stat-label-size:          ${px(t.statLabelSize, 13)};
  --stat-label-color:         ${t.statLabelColor      || '#718096'};
  --school-card-bg:           ${t.schoolCardBg        || '#ffffff'};
  --school-name-size:         ${px(t.schoolNameSize, 18)};
  --school-name-color:        ${t.schoolNameColor     || '#0D1117'};
  --school-meta-size:         ${px(t.schoolMetaSize, 13)};
  --school-meta-color:        ${t.schoolMetaColor     || '#718096'};
  --why-bg:                   ${t.whyBg               || '#F5F0E8'};
  --why-card-bg:              ${t.whyCardBg           || '#ffffff'};
  --why-title-size:           ${px(t.whyTitleSize, 60)};
  --why-title-color:          ${t.whyTitleColor       || '#0D1117'};
  --why-card-title-size:      ${px(t.whyCardTitleSize, 17)};
  --why-card-title-color:     ${t.whyCardTitleColor   || '#0D1117'};
  --why-card-desc-size:       ${px(t.whyCardDescSize, 14)};
  --why-card-desc-color:      ${t.whyCardDescColor    || '#4A5568'};
  --how-bg:                   ${t.howBg               || '#FAF7F2'};
  --how-title-size:           ${px(t.howTitleSize, 60)};
  --how-title-color:          ${t.howTitleColor       || '#0D1117'};
  --how-step-title-size:      ${px(t.howStepTitleSize, 18)};
  --how-step-title-color:     ${t.howStepTitleColor   || '#0D1117'};
  --how-step-desc-size:       ${px(t.howStepDescSize, 14)};
  --how-step-desc-color:      ${t.howStepDescColor    || '#4A5568'};
  --footer-bg:                ${t.footerBg            || '#0D1117'};
  --footer-text-color:        ${t.footerTextColor     || 'rgba(250,247,242,0.4)'};
  --footer-link-hover:        ${t.footerLinkHover     || '#B8860B'};
  --footer-heading-color:     ${t.footerHeadingColor  || 'rgba(250,247,242,0.55)'};
  --footer-text-size:         ${px(t.footerTextSize, 14)};
  --footer-heading-size:      ${px(t.footerHeadingSize, 12)};
  --login-bg:                 ${t.loginBg             || '#FAF7F2'};
  --login-card-bg:            ${t.loginCardBg         || '#ffffff'};
  --login-h1-size:            ${px(t.loginH1Size, 32)};
  --login-h1-color:           ${t.loginH1Color        || '#0D1117'};
  --login-input-bg:           ${t.loginInputBg        || '#ffffff'};
  --login-input-border:       ${t.loginInputBorder    || 'rgba(13,17,23,0.12)'};
  --schools-page-bg:          ${t.schoolsPageBg       || '#FAF7F2'};
  --schools-card-bg:          ${t.schoolsCardBg       || '#ffffff'};
  --schools-name-size:        ${px(t.schoolsNameSize, 19)};
  --schools-name-color:       ${t.schoolsNameColor    || '#0D1117'};
  --schools-meta-size:        ${px(t.schoolsMetaSize, 14)};
  --schools-meta-color:       ${t.schoolsMetaColor    || '#718096'};
  --profile-page-bg:          ${t.profilePageBg       || '#FAF7F2'};
  --profile-name-size:        ${px(t.profileNameSize, 42)};
  --profile-name-color:       ${t.profileNameColor    || '#0D1117'};
  --dashboard-bg:             ${t.dashboardBg         || '#FAF7F2'};
  --dashboard-card-bg:        ${t.dashboardCardBg     || '#ffffff'};
  --dashboard-heading-size:   ${px(t.dashboardHeadingSize, 28)};
  --dashboard-heading-color:  ${t.dashboardHeadingColor || '#0D1117'};
  --pricing-bg:               ${t.pricingBg           || '#FAF7F2'};
  --pricing-card-bg:          ${t.pricingCardBg       || '#ffffff'};
  --blog-bg:                  ${t.blogBg              || '#FAF7F2'};
  --blog-title-size:          ${px(t.blogTitleSize, 22)};
  --blog-title-color:         ${t.blogTitleColor      || '#0D1117'};
  --blog-excerpt-size:        ${px(t.blogExcerptSize, 14)};
  --blog-excerpt-color:       ${t.blogExcerptColor    || '#4A5568'};
  --btn-primary-bg:           ${t.btnPrimaryBg        || '#0D1117'};
  --btn-primary-color:        ${t.btnPrimaryColor     || '#FAF7F2'};
  --btn-gold-bg:              ${t.btnGoldBg           || '#B8860B'};
  --btn-gold-color:           ${t.btnGoldColor        || '#ffffff'};
  --btn-size:                 ${px(t.btnSize, 14)};
  --admin-bg:                 ${t.adminBg             || '#0A0F1A'};
  --admin-sidebar-bg:         ${t.adminSidebarBg      || 'linear-gradient(180deg,#0D1117 0%,#111820 100%)'};
  --admin-header-bg:          ${t.adminHeaderBg       || 'rgba(13,17,23,0.95)'};
  --admin-card-bg:            ${t.adminCardBg         || 'rgba(255,255,255,0.04)'};
  --admin-border:             ${t.adminBorder         || 'rgba(255,255,255,0.07)'};
  --admin-accent:             ${t.adminAccent         || '#B8860B'};
  --admin-text:               ${t.adminText           || 'rgba(255,255,255,0.9)'};
  --admin-text-muted:         ${t.adminTextMuted      || 'rgba(255,255,255,0.45)'};
  --admin-text-faint:         ${t.adminTextFaint      || 'rgba(255,255,255,0.25)'};
  --a-bg:                     ${t.adminBg             || '#060D1F'};
  --a-sidebar:                ${t.adminSidebarBg      || '#07101F'};
  --a-header:                 ${t.adminHeaderBg       || 'rgba(6,13,31,0.97)'};
  --a-card:                   ${t.adminCardBg         || '#0C1428'};
  --a-border:                 ${t.adminBorder         || 'rgba(255,255,255,0.07)'};
  --a-t1:                     ${t.adminText           || 'rgba(255,255,255,0.95)'};
  --a-t2:                     ${t.adminTextMuted      || 'rgba(255,255,255,0.55)'};
  --a-t3:                     ${t.adminTextFaint      || 'rgba(255,255,255,0.25)'};
  --a-gold:                   ${t.adminAccent         || '#B8860B'};
}`
  } catch { return '' }
}

// ── WhatsApp floating button ──────────────────────────────────────────────────
const WA_PHONE   = '917669483757'
const WA_MESSAGE = 'Hi%2C%20I%20have%20an%20enquiry'
const waStyle    = `
  .wa-float-btn {
    position: fixed;
    bottom: 90px;
    right: 24px;
    z-index: 9999;
    display: flex;
    align-items: center;
    gap: 10px;
    background: #25D366;
    border-radius: 50px;
    padding: 12px 20px 12px 14px;
    text-decoration: none;
    box-shadow: 0 4px 16px rgba(37,211,102,0.35);
    transition: transform .15s, box-shadow .15s;
  }
  .wa-float-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(37,211,102,0.45);
  }
  .wa-float-btn svg { width: 22px; height: 22px; fill: #fff; flex-shrink: 0; }
  .wa-float-btn span {
    font-size: 14px;
    font-weight: 500;
    color: #fff;
    font-family: Inter, system-ui, sans-serif;
    white-space: nowrap;
  }
  /* Hide label on very small screens, keep icon only */
  @media (max-width: 400px) {
    .wa-float-btn span { display: none; }
    .wa-float-btn { padding: 14px; border-radius: 50%; }
  }
`
// ─────────────────────────────────────────────────────────────────────────────

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const themeVars = await getThemeVars()
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600;1,700&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
        {themeVars && <style id="ts-live-theme" dangerouslySetInnerHTML={{ __html: themeVars }} />}
        <style dangerouslySetInnerHTML={{ __html: waStyle }} />
      </head>
      <body>
        <ContentStyleInjector />
        <Providers>{children}</Providers>
        <ChatbotWidget />

        {/* WhatsApp floating button — appears on every page */}
        <a
          className="wa-float-btn"
          href={`https://wa.me/${WA_PHONE}?text=${WA_MESSAGE}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with us on WhatsApp"
        >
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          <span>Chat with us</span>
        </a>
      </body>
    </html>
  )
}
