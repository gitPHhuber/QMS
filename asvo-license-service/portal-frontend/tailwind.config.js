/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#080E14',
          card: '#0F1A2E',
          border: '#1E2D45',
        },
        accent: '#2DD4A8',
        txt: {
          primary: '#E2E8F0',
          secondary: '#94A3B8',
        },
        status: {
          red: '#EF4444',
          yellow: '#F59E0B',
          green: '#22C55E',
        },
      },
    },
  },
  plugins: [],
};
