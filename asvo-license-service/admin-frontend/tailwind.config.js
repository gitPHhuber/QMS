/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#080E14',
        card: '#0F1A2E',
        'card-border': '#1E2D45',
        accent: '#2DD4A8',
        'accent-hover': '#26B892',
        'text-primary': '#E2E8F0',
        'text-secondary': '#94A3B8',
        danger: '#EF4444',
        warning: '#F59E0B',
        success: '#22C55E',
      },
    },
  },
  plugins: [],
};
