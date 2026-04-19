/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'ht-cream': '#faf7f0',
        'ht-ochre': '#c9940a',
        'ht-brown': '#2c1a00',
        'ht-root': '#3d2b00',
        'ht-trunk': '#5c3d00',
        'ht-branch': '#4a6741',
        'ht-leaf': '#d2e6c8',
        'ht-fruit': '#c9940a',
      },
      fontFamily: {
        cormorant: ['"Cormorant Garamond"', 'serif'],
        spectral: ['Spectral', 'serif'],
      },
    },
  },
  plugins: [],
};
