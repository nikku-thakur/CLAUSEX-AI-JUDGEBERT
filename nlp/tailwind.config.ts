import type { Config } from 'tailwindcss';

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
        background: '#08090D',
        secondary: '#101218',
        card: '#151820',
        'card-elevated': '#1A1E29',
        border: 'rgba(214, 180, 106, 0.18)',
        'border-strong': 'rgba(214, 180, 106, 0.35)',
        gold: {
          champagne: '#D6B46A',
          bright: '#F4CD7A',
          deep: '#B38E46',
          dark: '#7A5F26',
          muted: 'rgba(214, 180, 106, 0.15)',
          glow: 'rgba(244, 205, 122, 0.35)',
        },
        obsidian: {
          950: '#08090D',
          900: '#101218',
          850: '#151820',
          800: '#1A1E29',
          700: '#232836',
          600: '#32394C',
        },
        text: {
          primary: '#F4F0E7',
          secondary: '#A4A7B0',
          muted: '#6B7280',
        },
        status: {
          success: '#10B981',
          'success-muted': 'rgba(16, 185, 129, 0.15)',
          warning: '#F59E0B',
          'warning-muted': 'rgba(245, 158, 11, 0.15)',
          critical: '#F87171',
          'critical-muted': 'rgba(248, 113, 113, 0.15)',
        },
      },
      fontFamily: {
        serif: ['var(--font-cinzel)', 'Georgia', 'Cambria', 'serif'],
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'gold-sm': '0 0 15px rgba(214, 180, 106, 0.12)',
        'gold-md': '0 0 30px rgba(214, 180, 106, 0.2)',
        'gold-lg': '0 0 50px rgba(244, 205, 122, 0.25)',
        'card-glass': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-slow': 'float 6s ease-in-out infinite',
        'glow-pulse': 'glow 3s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        glow: {
          '0%': { opacity: '0.4', filter: 'drop-shadow(0 0 15px rgba(214,180,106,0.3))' },
          '100%': { opacity: '0.9', filter: 'drop-shadow(0 0 35px rgba(244,205,122,0.6))' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
