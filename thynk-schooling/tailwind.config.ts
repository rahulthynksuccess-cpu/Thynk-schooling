import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}','./components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ivory:  { DEFAULT:'#FAF7F2', 2:'#F5F0E8', 3:'#EDE5D8', 4:'#E4D9C8' },
        cream:  '#FDF9F4',
        ink:    { DEFAULT:'#0D1117', 2:'#1C2333', 3:'#2D3748', light:'#4A5568', muted:'#718096', faint:'#A0ADB8' },
        gold:   { DEFAULT:'#B8860B', 2:'#C9960D', 3:'#D4A520', light:'#E8C547', pale:'#F5E090', wash:'#FEF7E0', tint:'#FDFAF0' },
      },
      fontFamily: {
        serif:   ['Cormorant Garamond','EB Garamond','Georgia','serif'],
        sans:    ['Inter','system-ui','sans-serif'],
        display: ['Cormorant Garamond','Georgia','serif'],
      },
      fontSize: {
        '7xl': ['4.5rem',{lineHeight:'1.04',letterSpacing:'-0.025em'}],
        '8xl': ['6rem',  {lineHeight:'1.0', letterSpacing:'-0.03em'}],
        '9xl': ['8rem',  {lineHeight:'0.96',letterSpacing:'-0.035em'}],
      },
      boxShadow: {
        'sm-soft': '0 1px 4px rgba(13,17,23,0.06), 0 4px 16px rgba(13,17,23,0.04)',
        'md-soft': '0 4px 20px rgba(13,17,23,0.08), 0 1px 4px rgba(13,17,23,0.05)',
        'lg-soft': '0 12px 48px rgba(13,17,23,0.12), 0 4px 16px rgba(13,17,23,0.06)',
        'gold':    '0 4px 20px rgba(184,134,11,0.2), 0 1px 4px rgba(184,134,11,0.15)',
        'gold-lg': '0 6px 28px rgba(184,134,11,0.3)',
      },
      animation: {
        'fade-up':   'fadeUp .6s ease forwards',
        'float':     'float 5s ease-in-out infinite',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
        'shimmer':   'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeUp:    { '0%':{opacity:'0',transform:'translateY(20px)'},'100%':{opacity:'1',transform:'translateY(0)'} },
        float:     { '0%,100%':{transform:'translateY(0)'},'50%':{transform:'translateY(-8px)'} },
        pulseDot:  { '0%,100%':{opacity:'1',transform:'scale(1)'},'50%':{opacity:'.3',transform:'scale(.65)'} },
        shimmer:   { '0%':{backgroundPosition:'200% 0'},'100%':{backgroundPosition:'-200% 0'} },
      },
    },
  },
  plugins: [],
}
export default config
