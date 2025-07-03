/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'groovy': {
          'purple': '#6c4f8c',
          'pink': '#ff3c6f',
          'yellow': '#ffe066',
          'blue': '#3a86ff',
          'dark': '#0a0a0a',
          'gray': '#232323',
          'light-gray': '#18111e',
          'white': '#ffffff',
        },
        'primary': '#ff3c6f',
        'secondary': '#6c4f8c',
        'background': '#0a0a0a',
        'surface': '#18111e',
        'text-main': '#ffffff',
        'text-muted': '#b0b0b0',
      },
      fontFamily: {
        'mono': ['Share Tech Mono', 'Roboto Mono', 'Consolas', 'monospace'],
        'display': ['Monoton', 'Bangers', 'cursive', 'Oswald', 'Montserrat'],
        'sans': ['Open Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 1.2s cubic-bezier(0.4,0,0.2,1)',
        'pop': 'popIn 0.7s cubic-bezier(0.4,0,0.2,1)',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        popIn: {
          '0%': { transform: 'scale(0.7)', opacity: '0' },
          '80%': { transform: 'scale(1.08)', opacity: '1' },
          '100%': { transform: 'scale(1)' }
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        }
      },
      screens: {
        'xs': '475px',
      },
      backgroundImage: {
        'vinyl-texture': "url('/images/vinyl-texture.png')",
      }
    },
  },
  plugins: [],
}