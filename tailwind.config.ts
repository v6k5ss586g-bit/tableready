import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          50:  '#fdf8ee',
          100: '#f9edcc',
          200: '#f2d88a',
          300: '#eabf48',
          400: '#d4a017',
          500: '#b8860b',
          600: '#9a6e08',
          700: '#7a540a',
          800: '#654410',
          900: '#553912',
        },
        surface: {
          0:   '#0a0a0a',
          50:  '#111111',
          100: '#1a1a1a',
          200: '#242424',
          300: '#2e2e2e',
          400: '#3a3a3a',
          500: '#525252',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}

export default config
