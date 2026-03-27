import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#04071A',
          900: '#0A0F2E',
          800: '#0F1640',
          700: '#151D52',
          600: '#1E2A6E',
          500: '#2A3A8F',
          400: '#3D52B0',
          300: '#6B7FCC',
          200: '#A3AEDD',
          100: '#D6DBEF',
          50:  '#EEF0F8',
        },
        orange: {
          950: '#3D1400',
          900: '#7A2800',
          800: '#B33A00',
          700: '#CC4200',
          600: '#E34A00',
          500: '#FF5C00',
          400: '#FF7A2E',
          300: '#FF9A61',
          200: '#FFBF99',
          100: '#FFE0CC',
          50:  '#FFF4EE',
        },
        surface: {
          dark:   '#0A0F2E',
          card:   '#111830',
          hover:  '#161F3D',
          border: '#1E2A52',
        },
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body:    ['DM Sans', 'sans-serif'],
      },
      backgroundImage: {
        'hero-mesh':     'radial-gradient(ellipse 80% 60% at 50% -10%, #1E2A6E 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 60%, rgba(255,92,0,0.08) 0%, transparent 60%)',
        'card-shine':    'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 60%)',
        'grid-pattern':  'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
        'orange-radial': 'radial-gradient(ellipse 60% 80% at 50% 50%, rgba(255,92,0,0.15) 0%, transparent 70%)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      boxShadow: {
        'card':       '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,92,0,0.25)',
        'orange':     '0 0 30px rgba(255,92,0,0.4)',
        'orange-sm':  '0 0 12px rgba(255,92,0,0.3)',
        'glow-lg':    '0 0 80px rgba(255,92,0,0.12)',
      },
      animation: {
        'fade-up':      'fadeUp 0.6s ease forwards',
        'fade-in':      'fadeIn 0.4s ease forwards',
        'float':        'float 6s ease-in-out infinite',
        'pulse-dot':    'pulseDot 2s ease-in-out infinite',
        'shimmer':      'shimmer 1.5s infinite',
        'spin-slow':    'spin 8s linear infinite',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':      { opacity: '0.5', transform: 'scale(0.8)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}

export default config
