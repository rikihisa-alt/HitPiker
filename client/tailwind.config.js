/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './hooks/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        'surface-1': 'var(--surface-1)',
        'surface-2': 'var(--surface-2)',
        'surface-raised': 'var(--surface-raised)',
        border: 'var(--border)',
        'border-subtle': 'var(--border-subtle)',
        'border-hover': 'var(--border-hover)',
        text: 'var(--text)',
        'text-sub': 'var(--text-sub)',
        'text-muted': 'var(--text-muted)',
        primary: 'var(--primary)',
        'primary-fg': 'var(--primary-fg)',
        'primary-soft': 'var(--primary-soft)',
        positive: 'var(--positive)',
        'positive-fg': 'var(--positive-fg)',
        'positive-soft': 'var(--positive-soft)',
        caution: 'var(--caution)',
        'caution-fg': 'var(--caution-fg)',
        'caution-soft': 'var(--caution-soft)',
        danger: 'var(--danger)',
        'danger-fg': 'var(--danger-fg)',
        'danger-soft': 'var(--danger-soft)',
        felt: 'var(--felt)',
        'felt-deep': 'var(--felt-deep)',
        'felt-line': 'var(--felt-line)',
      },
      borderRadius: {
        sm: 'var(--r-sm)',
        md: 'var(--r-md)',
        lg: 'var(--r-lg)',
        pill: 'var(--r-pill)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        card: 'var(--shadow-card)',
      },
      keyframes: {
        'turn-glow': {
          '0%, 100%': { boxShadow: '0 0 0 2px var(--primary), 0 0 12px rgba(74, 142, 255, 0.15)' },
          '50%': { boxShadow: '0 0 0 2px var(--primary), 0 0 20px rgba(74, 142, 255, 0.3)' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'chip-float': {
          '0%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(-24px)' },
        },
        'card-flip': {
          '0%': { transform: 'rotateY(180deg) scale(0.8)', opacity: '0' },
          '50%': { transform: 'rotateY(90deg) scale(0.9)', opacity: '0.5' },
          '100%': { transform: 'rotateY(0deg) scale(1)', opacity: '1' },
        },
      },
      animation: {
        'turn-glow': 'turn-glow 2s ease-in-out infinite',
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.25s ease-out',
        'chip-float': 'chip-float 1.5s ease-out forwards',
        'card-flip': 'card-flip 0.4s ease-out both',
      },
    },
  },
  plugins: [],
};
