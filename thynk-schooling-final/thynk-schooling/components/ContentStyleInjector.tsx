'use client'
import { useEffect } from 'react'

export function ContentStyleInjector() {
  useEffect(() => {
    async function inject() {
      try {
        // Fetch all content (returns flat merged object)
        const res = await fetch('/api/admin/content', { cache: 'no-store' })
        const data = await res.json()

        // Inject content CSS vars (saved as content.css key)
        const css = data?.['content.css']
        if (css && typeof css === 'string') {
          let el = document.getElementById('ts-content-styles')
          if (!el) { el = document.createElement('style'); el.id = 'ts-content-styles'; document.head.appendChild(el) }
          el.textContent = css
        }

        // Fetch and inject theme CSS vars
        const tres = await fetch('/api/admin/theme', { cache: 'no-store' })
        const tdata = await tres.json()
        if (tdata?.theme) {
          const t = tdata.theme
          const px = (v: any, d: number) => `${v ?? d}px`
          const co = (v: any, d: string) => v ?? d
          const themeCss = `:root {
  --ivory: ${co(t.ivory,'#FAF7F2')};
  --ivory-2: ${co(t.ivory2,'#F5F0E8')};
  --ivory-3: ${co(t.ivory3,'#EDE5D8')};
  --ink: ${co(t.ink,'#0D1117')};
  --ink-2: ${co(t.ink2,'#1C2333')};
  --ink-muted: ${co(t.inkMuted,'#4A5568')};
  --ink-faint: ${co(t.inkFaint,'#A0ADB8')};
  --gold: ${co(t.gold,'#B8860B')};
  --gold-2: ${co(t.gold2,'#C9960D')};
  --gold-light: ${co(t.goldLight,'#E8C547')};
  --gold-wash: ${co(t.goldWash,'#FEF7E0')};
  --border: ${co(t.border,'rgba(13,17,23,0.09)')};
  --font-serif: '${co(t.fontSerif,'Cormorant Garamond')}', Georgia, serif;
  --font-sans: '${co(t.fontSans,'Inter')}', system-ui, sans-serif;
  --radius: ${px(t.radius,12)};
  --radius-sm: ${px(t.btnRadius,6)};
  --nav-bg: ${co(t.navBg,'rgba(250,247,242,0.95)')};
  --nav-size: ${px(t.navSize,14)};
  --nav-color: ${co(t.navColor,'#4A5568')};
  --hero-bg: ${co(t.heroBg,'#FAF7F2')};
  --hero-bg-grad: ${co(t.heroBgGrad,'#F0EAD6')};
  --hero-h1-size: ${px(t.heroH1Size,96)};
  --hero-h1-color: ${co(t.heroH1Color,'#0D1117')};
  --hero-italic-color: ${co(t.heroItalicColor,'#B8860B')};
  --hero-sub-size: ${px(t.heroSubSize,17)};
  --hero-sub-color: ${co(t.heroSubColor,'#4A5568')};
  --hero-eyebrow-color: ${co(t.heroEyebrowColor,'#B8860B')};
  --hero-eyebrow-size: ${px(t.heroEyebrowSize,11)};
  --stats-bg: ${co(t.statsBg,'#F5F0E8')};
  --stat-num-size: ${px(t.statNumSize,38)};
  --stat-num-color: ${co(t.statNumColor,'#0D1117')};
  --stat-label-size: ${px(t.statLabelSize,12)};
  --stat-label-color: ${co(t.statLabelColor,'#718096')};
  --school-card-bg: ${co(t.schoolCardBg,'#ffffff')};
  --school-name-size: ${px(t.schoolNameSize,17)};
  --school-name-color: ${co(t.schoolNameColor,'#0D1117')};
  --why-bg: ${co(t.whyBg,'#F5F0E8')};
  --why-title-size: ${px(t.whyTitleSize,56)};
  --why-title-color: ${co(t.whyTitleColor,'#0D1117')};
  --how-bg: ${co(t.howBg,'#FAF7F2')};
  --how-title-size: ${px(t.howTitleSize,56)};
  --how-title-color: ${co(t.howTitleColor,'#0D1117')};
  --footer-bg: ${co(t.footerBg,'#0D1117')};
  --footer-text-color: ${co(t.footerTextColor,'rgba(250,247,242,0.4)')};
  --footer-link-hover: ${co(t.footerLinkHover,'#B8860B')};
  --footer-text-size: ${px(t.footerTextSize,14)};
  --login-bg: ${co(t.loginBg,'#FAF7F2')};
  --login-card-bg: ${co(t.loginCardBg,'#ffffff')};
  --login-h1-size: ${px(t.loginH1Size,32)};
  --login-h1-color: ${co(t.loginH1Color,'#0D1117')};
  --login-input-border: ${co(t.loginInputBorder,'rgba(13,17,23,0.12)')};
  --schools-page-bg: ${co(t.schoolsPageBg,'#FAF7F2')};
  --schools-card-bg: ${co(t.schoolsCardBg,'#ffffff')};
  --schools-name-size: ${px(t.schoolsNameSize,19)};
  --schools-name-color: ${co(t.schoolsNameColor,'#0D1117')};
  --btn-primary-bg: ${co(t.btnPrimaryBg,'#0D1117')};
  --btn-primary-color: ${co(t.btnPrimaryColor,'#FAF7F2')};
  --btn-gold-bg: ${co(t.btnGoldBg,'#B8860B')};
  --btn-gold-color: ${co(t.btnGoldColor,'#ffffff')};
  --btn-size: ${px(t.btnSize,14)};
}`
          let tel = document.getElementById('ts-live-theme')
          if (!tel) { tel = document.createElement('style'); tel.id = 'ts-live-theme'; document.head.appendChild(tel) }
          tel.textContent = themeCss
        }
      } catch(e) { console.error('Style inject error:', e) }
    }
    inject()
  }, [])
  return null
}
