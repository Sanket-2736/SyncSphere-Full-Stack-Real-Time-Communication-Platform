/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark Luxury Palette
        'luxury': {
          'bg': '#0f0f0f',      // Deep charcoal background
          'surface': '#1a1a1a', // Slightly lighter surface
          'card': '#242424',    // Card background
          'border': '#333333',  // Border color
          'text': '#e8e8e8',    // Main text
          'muted': '#888888',   // Muted text
          'accent': '#d4af37',  // Gold accent
          'accent-light': '#e8c547', // Light gold
          'accent-dark': '#b8941f', // Dark gold
        }
      },
      fontFamily: {
        'serif': ['Playfair Display', 'Georgia', 'serif'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(212, 175, 55, 0.2), 0 0 40px rgba(212, 175, 55, 0.08), inset 0 1px 0 rgba(232, 197, 71, 0.1)',
        'glow-lg': '0 0 40px rgba(212, 175, 55, 0.3), 0 0 80px rgba(212, 175, 55, 0.15), inset 0 1px 0 rgba(232, 197, 71, 0.15)',
        'glow-sm': '0 0 12px rgba(212, 175, 55, 0.15), inset 0 1px 0 rgba(232, 197, 71, 0.08)',
        'luxury': '0 8px 32px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(212, 175, 55, 0.08)',
        'luxury-lg': '0 16px 48px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(212, 175, 55, 0.1)',
        'luxury-xl': '0 24px 64px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(212, 175, 55, 0.12)',
      },
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '8px',
      },
      spacing: {
        'gutter': '1.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-glow': 'pulseGlow 2.5s ease-in-out infinite',
        'scale-in': 'scaleIn 0.4s cubic-bezier(0.23, 1, 0.320, 1)',
        'typing-bounce': 'typingBounce 1.4s infinite',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(212, 175, 55, 0.12)' },
          '50%': { boxShadow: '0 0 30px rgba(212, 175, 55, 0.25)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.92)', opacity: '0', filter: 'blur(2px)' },
          '100%': { transform: 'scale(1)', opacity: '1', filter: 'blur(0)' },
        },
        typingBounce: {
          '0%, 60%, 100%': { transform: 'translateY(0)' },
          '30%': { transform: 'translateY(-8px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}
