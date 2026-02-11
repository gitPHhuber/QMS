
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        asvo: {
          // Backgrounds
          bg:           '#080E14',
          surface:      '#0D1520',
          card:         '#111D2B',
          'card-hover': '#152436',

          // Borders
          border:       '#1A2D42',
          'border-lt':  '#1E3A54',

          // Accent
          accent:       '#2DD4A8',
          'accent-dim': 'rgba(45,212,168,0.08)',
          'accent-glow':'rgba(45,212,168,0.25)',

          // Text
          text:         '#E8EDF3',
          'text-mid':   '#8899AB',
          'text-dim':   '#4A5E72',

          // Semantic
          red:          '#F06060',
          'red-dim':    'rgba(240,96,96,0.12)',
          amber:        '#E8A830',
          'amber-dim':  'rgba(232,168,48,0.12)',
          blue:         '#4A90E8',
          'blue-dim':   'rgba(74,144,232,0.12)',
          purple:       '#A06AE8',
          'purple-dim': 'rgba(160,106,232,0.12)',
          green:        '#2DD4A8',
          'green-dim':  'rgba(45,212,168,0.12)',
          grey:         '#3A4E62',
          'grey-dim':   'rgba(58,78,98,0.15)',
          orange:       '#E87040',
        },
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-in-up': 'slideInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'card-hover': 'cardHover 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInUp: {
          '0%': { opacity: '0', transform: 'translateY(15px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        cardHover: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-2px)' },
        },
      },
    },
  },
  plugins: [],
}
