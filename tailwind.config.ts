import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./pages/**/*.{js,ts,jsx,tsx,mdx}','./components/**/*.{js,ts,jsx,tsx,mdx}','./app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        gold: { 300:'#fcd68a',400:'#f5c842',500:'#e8b520',600:'#c99200' },
        gov: { 900:'#050810',800:'#080c18',700:'#0d1228',600:'#121830',500:'#1a2240',400:'#243059' },
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4,0,0.6,1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        shimmer: { '0%':{ backgroundPosition:'-200% 0' },'100%':{ backgroundPosition:'200% 0' } },
        float: { '0%,100%':{ transform:'translateY(0px)' },'50%':{ transform:'translateY(-10px)' } },
      },
    },
  },
  plugins: [],
}
export default config
