/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Apple-inspired Palette
        'apple': {
          'bg': '#F5F5F7',           // Light background
          'surface': '#FFFFFF',      // White surfaces
          'card': '#FFFFFF',         // Card backgrounds
          'border': '#E5E5E7',       // Subtle borders
          'text': '#1D1D1F',         // Primary text (nearly black)
          'secondary': '#6E6E73',    // Secondary text (gray)
          'accent': '#0071E3',       // Apple Blue
          'success': '#34C759',      // Success green
          'danger': '#FF3B30',       // Danger red
        }
      },
      fontFamily: {
        'sans': ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'Helvetica Neue', 'Inter', 'system-ui', 'sans-serif'],
        'mono': ['SF Mono', 'Monaco', 'Courier New', 'monospace'],
      },
      fontSize: {
        'h1': ['56px', { lineHeight: '1.1', fontWeight: '600' }],
        'h2': ['40px', { lineHeight: '1.2', fontWeight: '600' }],
        'h3': ['32px', { lineHeight: '1.2', fontWeight: '600' }],
        'h4': ['24px', { lineHeight: '1.3', fontWeight: '500' }],
        'h5': ['18px', { lineHeight: '1.4', fontWeight: '500' }],
        'body': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'caption': ['13px', { lineHeight: '1.5', fontWeight: '400' }],
      },
      boxShadow: {
        'sm': '0 1px 3px rgba(0, 0, 0, 0.08)',
        'md': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'lg': '0 12px 28px rgba(0, 0, 0, 0.12)',
        'xl': '0 20px 40px rgba(0, 0, 0, 0.15)',
        'elevation': '0 8px 24px rgba(0, 0, 0, 0.1)',
      },
      borderRadius: {
        'xs': '8px',
        'sm': '12px',
        'md': '16px',
        'lg': '20px',
        'xl': '28px',
        '2xl': '32px',
      },
      spacing: {
        'gutter': '2rem',
        'safe': '1.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'slide-up': 'slideUp 0.3s ease-out',
        'typing': 'typing 1.4s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        typing: {
          '0%, 60%, 100%': { transform: 'translateY(0)' },
          '30%': { transform: 'translateY(-6px)' },
        },
      },
      transitionTimingFunction: {
        'apple': 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}
