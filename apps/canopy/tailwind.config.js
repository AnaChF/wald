/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0A1A0E',
        'bg-panel': '#F5F0E8',
        'accent-ochre': '#C17E3A',
        'accent-amber': '#D4A843',
        positive: '#2D6048',
        sky: '#6B9FC4',
        dusk: '#8B6B9E',
        ink: '#1C1C1C',
        'parchment-text': '#F5F0E8',
        moss: '#2D6048',
        'moss-light': '#3D6B3A',
      },
      fontFamily: {
        cormorant: ['Cormorant Garamond', 'serif'],
        mono: ['DM Mono', 'monospace'],
        spectral: ['Spectral', 'serif'],
      },
      animation: {
        'scatter-settle': 'scatterSettle 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'cone-unfold': 'coneUnfold 1.8s ease-out forwards',
        'cla-reveal': 'claReveal 0.9s ease-out forwards',
        'arc-fill': 'arcFill 1.4s ease-out forwards',
        crystallise: 'crystallise 2.2s ease-in-out forwards',
      },
      keyframes: {
        scatterSettle: {
          '0%': { opacity: '0', transform: 'scale(0.3) translateY(-40px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        coneUnfold: {
          '0%': { clipPath: 'polygon(50% 0%, 50% 0%, 50% 0%)' },
          '100%': { clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' },
        },
        claReveal: {
          '0%': { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        arcFill: {
          '0%': { strokeDashoffset: '100' },
          '100%': { strokeDashoffset: '0' },
        },
        crystallise: {
          '0%': { filter: 'blur(8px)', opacity: '0.2' },
          '60%': { filter: 'blur(2px)', opacity: '0.7' },
          '100%': { filter: 'blur(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
