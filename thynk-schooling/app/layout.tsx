import type { Metadata, Viewport } from 'next'
import { ContentStyleInjector } from '@/components/ContentStyleInjector'
import './globals.css'
import { Providers } from './providers'
import { config } from '@/lib/config'

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
}`
  } catch { return '' }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const themeVars = await getThemeVars()
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600;1,700&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
        {themeVars && <style id="ts-live-theme" dangerouslySetInnerHTML={{ __html: themeVars }} />}
      </head>
      <body>
        <ContentStyleInjector />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
