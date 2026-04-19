/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'w-forest': '#1a1209',
        'w-parchment': '#f5e6c8',
        'w-ochre': '#c9940a',
        'w-civic': '#e8e0d0',
        'w-green': '#2d5016',
        'w-lab': '#0f1824',
        'w-lab-panel': '#e8f0f8',
        'w-blue': '#4a9eff',
      },
      fontFamily: {
        'cormorant': ['"Cormorant Garamond"', 'serif'],
        'spectral': ['Spectral', 'serif'],
        'dm-mono': ['"DM Mono"', 'monospace'],
        'inter': ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
