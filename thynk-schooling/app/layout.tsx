import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'
import { config } from '@/lib/config'

export const metadata: Metadata = {
  title: { default: `${config.app.name} — Find the Best Schools in India`, template: `%s | ${config.app.name}` },
  description: 'Search, compare and apply to 12,000+ verified schools across India. Free AI-powered recommendations and 1-on-1 counselling.',
  metadataBase: new URL(config.app.url),
}
export const viewport: Viewport = {
  themeColor: '#FAF7F2',
  width: 'device-width',
  initialScale: 1,
}

async function getThemeVars(): Promise<string> {
  try {
    const { default: db } = await import('@/lib/db')
    const res = await db.query("SELECT value FROM site_settings WHERE key = 'theme'")
    if (!res.rows.length) return ''
    const t = JSON.parse(res.rows[0].value)
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
  --nav-bg:                   ${t.navBg              || 'rgba(250,247,242,0.95)'};
  --nav-size:                 ${t.navSize             || 13}px;
  --nav-color:                ${t.navColor            || '#4A5568'};
  --nav-weight:               ${t.navWeight           || 400};
  --hero-bg:                  ${t.heroBg              || '#FAF7F2'};
  --hero-bg-grad:             ${t.heroBgGrad          || '#F0EAD6'};
  --hero-h1-size:             ${t.heroH1Size          || 80}px;
  --hero-h1-color:            ${t.heroH1Color         || '#0D1117'};
  --hero-italic-color:        ${t.heroItalicColor     || '#B8860B'};
  --hero-sub-size:            ${t.heroSubSize         || 15}px;
  --hero-sub-color:           ${t.heroSubColor        || '#4A5568'};
  --hero-sub-weight:          ${t.heroSubWeight       || 300};
  --hero-eyebrow-size:        ${t.heroEyebrowSize     || 10}px;
  --hero-eyebrow-color:       ${t.heroEyebrowColor    || '#B8860B'};
  --stats-bg:                 ${t.statsBg             || '#F5F0E8'};
  --stat-num-size:            ${t.statNumSize         || 38}px;
  --stat-num-color:           ${t.statNumColor        || '#0D1117'};
  --stat-label-size:          ${t.statLabelSize       || 12}px;
  --stat-label-color:         ${t.statLabelColor      || '#718096'};
  --school-card-bg:           ${t.schoolCardBg        || '#ffffff'};
  --school-name-size:         ${t.schoolNameSize      || 17}px;
  --school-name-color:        ${t.schoolNameColor     || '#0D1117'};
  --school-meta-size:         ${t.schoolMetaSize      || 12}px;
  --school-meta-color:        ${t.schoolMetaColor     || '#718096'};
  --why-bg:                   ${t.whyBg               || '#F5F0E8'};
  --why-card-bg:              ${t.whyCardBg           || '#ffffff'};
  --why-title-size:           ${t.whyTitleSize        || 56}px;
  --why-title-color:          ${t.whyTitleColor       || '#0D1117'};
  --why-card-title-size:      ${t.whyCardTitleSize    || 16}px;
  --why-card-title-color:     ${t.whyCardTitleColor   || '#0D1117'};
  --why-card-desc-size:       ${t.whyCardDescSize     || 13}px;
  --why-card-desc-color:      ${t.whyCardDescColor    || '#4A5568'};
  --how-bg:                   ${t.howBg               || '#FAF7F2'};
  --how-title-size:           ${t.howTitleSize        || 56}px;
  --how-title-color:          ${t.howTitleColor       || '#0D1117'};
  --how-step-title-size:      ${t.howStepTitleSize    || 17}px;
  --how-step-title-color:     ${t.howStepTitleColor   || '#0D1117'};
  --how-step-desc-size:       ${t.howStepDescSize     || 13}px;
  --how-step-desc-color:      ${t.howStepDescColor    || '#4A5568'};
  --footer-bg:                ${t.footerBg            || '#0D1117'};
  --footer-text-color:        ${t.footerTextColor     || 'rgba(250,247,242,0.4)'};
  --footer-link-hover:        ${t.footerLinkHover     || '#B8860B'};
  --footer-heading-color:     ${t.footerHeadingColor  || 'rgba(250,247,242,0.55)'};
  --footer-text-size:         ${t.footerTextSize      || 13}px;
  --footer-heading-size:      ${t.footerHeadingSize   || 11}px;
  --login-bg:                 ${t.loginBg             || '#FAF7F2'};
  --login-card-bg:            ${t.loginCardBg         || '#ffffff'};
  --login-h1-size:            ${t.loginH1Size         || 28}px;
  --login-h1-color:           ${t.loginH1Color        || '#0D1117'};
  --login-input-bg:           ${t.loginInputBg        || '#ffffff'};
  --login-input-border:       ${t.loginInputBorder    || 'rgba(13,17,23,0.12)'};
  --schools-page-bg:          ${t.schoolsPageBg       || '#FAF7F2'};
  --schools-card-bg:          ${t.schoolsCardBg       || '#ffffff'};
  --schools-name-size:        ${t.schoolsNameSize     || 18}px;
  --schools-name-color:       ${t.schoolsNameColor    || '#0D1117'};
  --schools-meta-size:        ${t.schoolsMetaSize     || 13}px;
  --schools-meta-color:       ${t.schoolsMetaColor    || '#718096'};
  --profile-page-bg:          ${t.profilePageBg       || '#FAF7F2'};
  --profile-name-size:        ${t.profileNameSize     || 40}px;
  --profile-name-color:       ${t.profileNameColor    || '#0D1117'};
  --dashboard-bg:             ${t.dashboardBg         || '#FAF7F2'};
  --dashboard-card-bg:        ${t.dashboardCardBg     || '#ffffff'};
  --pricing-bg:               ${t.pricingBg           || '#FAF7F2'};
  --pricing-card-bg:          ${t.pricingCardBg       || '#ffffff'};
  --blog-bg:                  ${t.blogBg              || '#FAF7F2'};
  --blog-title-size:          ${t.blogTitleSize       || 20}px;
  --blog-title-color:         ${t.blogTitleColor      || '#0D1117'};
  --btn-primary-bg:           ${t.btnPrimaryBg        || '#0D1117'};
  --btn-primary-color:        ${t.btnPrimaryColor     || '#FAF7F2'};
  --btn-gold-bg:              ${t.btnGoldBg           || '#B8860B'};
  --btn-gold-color:           ${t.btnGoldColor        || '#ffffff'};
  --btn-size:                 ${t.btnSize             || 13}px;
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
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600;1,700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
        {themeVars && <style id="ts-live-theme" dangerouslySetInnerHTML={{ __html: themeVars }} />}
      </head>
      <body style={{ background: '#FAF7F2', color: '#0D1117' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
