/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        mint: '#5FE3B3',
        'mint-dim': '#2E7A5E',
        navy: '#0B1B2B',
        'navy-soft': '#132A40',
        orange: '#FF7A3D',
        paper: '#F4F7F5',
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
