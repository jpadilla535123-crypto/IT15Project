/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0B0B0E',
          800: '#121217',
          700: '#181820',
          600: '#1E1E28',
          500: '#2A2A36',
        },
        accent: {
          DEFAULT: '#FF2B66',
          hover: '#E0245A',
          light: '#FF2B6620',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
