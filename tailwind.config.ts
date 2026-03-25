import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          300: '#fcd68a',
          400: '#f5c842',
          500: '#e8b520',
          600: '#c99200',
        },
        gov: {
          900: '#050810',
          800: '#080c18',
          700: '#0d1228',
          600: '#121830',
          500: '#1a2240',
          400: '#243059',
        },
      },
      fontFamily: {
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-fira)', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backgroundImage: {
        'gov-gradient': 'linear-gradient(135deg, #050810 0%, #0d1228 50%, #050810 100%)',
        'gold-gradient': 'linear-gradient(90deg, #c99200 0%, #f5c842 50%, #c99200 100%)',
      },
    },
  },
  plugins: [],
}

export default config
