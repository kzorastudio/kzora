import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Core Surfaces
        'surface':                  '#FAF8F5',
        'surface-dim':              '#DBDAD7',
        'surface-bright':           '#FAF8F5',
        'surface-container-lowest': '#FFFFFF',
        'surface-container-low':    '#F5F3F0',
        'surface-container':        '#EFEEEB',
        'surface-container-high':   '#EAE8E5',
        'surface-container-highest':'#E4E2DF',

        // Primary (Bronze-Gold)
        'primary':          '#785600',
        'on-primary':       '#FFFFFF',
        'primary-container':'#986D00',
        'primary-fixed':    '#FFDEA6',
        'primary-fixed-dim':'#F7BD48',
        'inverse-primary':  '#F7BD48',

        // Text
        'on-surface':         '#1A1A1A',
        'on-surface-variant': '#4F4535',
        'on-background':      '#1B1C1A',
        'secondary':          '#6B6560',
        'outline':            '#817563',
        'outline-variant':    '#D3C4AF',

        // Secondary
        'secondary-container':    '#EAE1DA',
        'on-secondary':           '#FFFFFF',
        'on-secondary-container': '#69635E',

        // Error
        'error':           '#BA1A1A',
        'error-container': '#FFDAD6',
        'on-error':        '#FFFFFF',
        'on-error-container': '#93000A',

        // Tertiary
        'tertiary':           '#4B6339',
        'on-tertiary':        '#FFFFFF',
        'tertiary-container': '#637C50',

        // Misc
        'inverse-surface':    '#30312F',
        'inverse-on-surface': '#F2F0ED',
        'background':         '#FAF8F5',
        'surface-variant':    '#E4E2DF',
        'surface-tint':       '#7B5800',
      },
      fontFamily: {
        'brand':    ['var(--font-tajawal)', 'sans-serif'],
        'arabic':   ['var(--font-noto-arabic)', 'sans-serif'],
        'body':     ['var(--font-inter)', 'sans-serif'],
        'label':    ['var(--font-inter)', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.125rem',
        'sm':  '0.25rem',
        'md':  '0.375rem',
        'lg':  '0.5rem',
        'xl':  '0.75rem',
        '2xl': '1rem',
        'full': '9999px',
      },
      boxShadow: {
        'ambient': '0 4px 20px rgba(27, 28, 26, 0.08)',
        'ambient-lg': '0 8px 40px rgba(27, 28, 26, 0.12)',
        'ambient-xl': '0 16px 60px rgba(27, 28, 26, 0.15)',
      },
      backgroundImage: {
        'bronze-gradient': 'linear-gradient(135deg, #785600 0%, #986D00 100%)',
        'bronze-gradient-hover': 'linear-gradient(135deg, #986D00 0%, #B8860B 100%)',
      },
      animation: {
        'shimmer': 'shimmer 1.5s infinite linear',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-left':  'slideInLeft 0.3s ease-out',
        'fade-in':        'fadeIn 0.2s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        slideInRight: {
          from: { transform: 'translateX(100%)' },
          to:   { transform: 'translateX(0)' },
        },
        slideInLeft: {
          from: { transform: 'translateX(-100%)' },
          to:   { transform: 'translateX(0)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
