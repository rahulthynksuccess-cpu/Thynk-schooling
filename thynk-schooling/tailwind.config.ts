import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          950: '#030D08', 900: '#071A0F', 800: '#0F2918', 700: '#163820',
          600: '#1E4D2B', 500: '#276338', 400: '#347A47', 300: '#4DA060',
          200: '#7DC28F', 100: '#B8DFC3', 50:  '#EBF5EE',
        },
        gold: {
          900: '#3D2800', 800: '#6B4500', 700: '#9A6400', 600: '#C48200',
          500: '#D4AF37', 400: '#E0C55A', 300: '#EBDA8A', 200: '#F3EBBE',
          100: '#FAF5E0', 50:  '#FFFDF2',
        },
        cream: { DEFAULT: '#FDFAF4', 2: '#F7F2E8', 3: '#EDE6D6' },
        surface: {
          dark: '#0A1F12', card: '#0F2919', hover: '#133220', border: '#1E4D2B',
        },
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans:  ['DM Sans', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
      },
      fontSize: {
        '7xl': ['4.5rem',  { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        '8xl': ['6rem',    { lineHeight: '1.0',  letterSpacing: '-0.025em' }],
        '9xl': ['8rem',    { lineHeight: '0.95', letterSpacing: '-0.03em' }],
      },
      backgroundImage: {
        'hero-radial':  'radial-gradient(ellipse 80% 60% at 50% -5%, rgba(39,99,56,0.6) 0%, transparent 60%)',
        'gold-radial':  'radial-gradient(ellipse 60% 40% at 80% 60%, rgba(212,175,55,0.08) 0%, transparent 60%)',
        'card-shine':   'linear-gradient(135deg, rgba(212,175,55,0.06) 0%, transparent 60%)',
        'grid-pattern': 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
      },
      backgroundSize: { grid: '48px 48px' },
      boxShadow: {
        'gold':    '0 0 30px rgba(212,175,55,0.25)',
        'gold-sm': '0 0 12px rgba(212,175,55,0.2)',
        'card':    '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)',
        'card-hover': '0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(212,175,55,0.2)',
      },
      animation: {
        'fade-up':   'fadeUp 0.6s ease forwards',
        'fade-in':   'fadeIn 0.4s ease forwards',
        'float':     'float 6s ease-in-out infinite',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
        'shimmer':   'shimmer 1.6s infinite',
      },
      keyframes: {
        fadeUp:    { '0%': { opacity: '0', transform: 'translateY(24px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        fadeIn:    { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        float:     { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        pulseDot:  { '0%, 100%': { opacity: '1', transform: 'scale(1)' }, '50%': { opacity: '0.4', transform: 'scale(0.7)' } },
        shimmer:   { '0%': { backgroundPosition: '200% 0' }, '100%': { backgroundPosition: '-200% 0' } },
      },
    },
  },
  plugins: [],
}
export default config
