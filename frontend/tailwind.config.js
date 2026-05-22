/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0F0F11',
          sidebar: '#16161A',
          card: '#1E1E24',
          border: '#2B2B36',
          input: '#25252B',
          hover: '#2D2D35'
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow-primary': '0 0 15px rgba(99, 102, 241, 0.15)',
        'glow-success': '0 0 15px rgba(16, 185, 129, 0.15)'
      }
    },
  },
  plugins: [],
}
