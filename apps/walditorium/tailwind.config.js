/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'wald-forest': '#0e1f0e',
        'wald-parchment': '#f5f0e8',
        'wald-ochre': '#c9940a',
        'wald-amber': '#d4820a',
        'verdict-grounded': '#1a5c1a',
        'verdict-conditional': '#d4820a',
        'verdict-contested': '#a67c00',
        'verdict-ungrounded': '#8b0000',
      },
      fontFamily: {
        'cormorant': ['"Cormorant Garamond"', 'serif'],
        'mono': ['"DM Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
