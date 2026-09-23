/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        navy: {
          950: '#020c1b',
          900: '#0a1929',
          800: '#0d2137',
          700: '#102a47',
          600: '#163555',
        },
        accent: {
          blue: '#4da6ff',
          cyan: '#00d4ff',
          green: '#00e5a0',
          amber: '#ffc947',
          red: '#ff4d6d',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-up': 'fadeUp 0.4s ease-out forwards',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(77, 166, 255, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(77, 166, 255, 0.6)' },
        },
      },
    },
  },
  plugins: [],
};
