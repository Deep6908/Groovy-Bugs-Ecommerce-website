/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'retro-yellow': '#fff',
        'retro-teal': '#6c4f8c',
        'retro-pink': '#6c4f8c',
        'retro-blue': '#23243a',
        'retro-offwhite': '#fff',
        'main-bg': '#0a0a0a',
        'main-purple': '#6c4f8c',
        'groovy-purple': '#6c4f8c',
        'main-white': '#fff',
        'card-bg': '#18111e',
        'accent-pink': '#ff3c6f',
      },
      fontFamily: {
        'mono': ['Share Tech Mono', 'Roboto Mono', 'Consolas', 'monospace'],
        'display': ['Monoton', 'Bangers', 'cursive'],
      },
      boxShadow: {
        'retro': '0 8px 32px rgba(44, 20, 60, 0.18)',
        'glow': '0 0 8px #6c4f8c44',
        'card': '0 4px 24px rgba(0,0,0,0.10)',
      },
      animation: {
        'fade-in': 'fadeIn 1.2s cubic-bezier(0.4,0,0.2,1)',
        'pop': 'popIn 0.7s cubic-bezier(0.4,0,0.2,1)',
      },
      keyframes: {
        fadeIn: {
          'from': { opacity: '0', transform: 'translateY(30px)' },
          'to': { opacity: '1', transform: 'none' }
        },
        popIn: {
          '0%': { transform: 'scale(0.7)', opacity: '0' },
          '80%': { transform: 'scale(1.08)', opacity: '1' },
          '100%': { transform: 'scale(1)' }
        }
      }
    },
  },
  plugins: [],
}