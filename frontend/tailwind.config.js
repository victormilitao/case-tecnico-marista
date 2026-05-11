/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        app: 'var(--color-bg-app)',
        surface: {
          DEFAULT: 'var(--color-bg-surface)',
          muted: 'var(--color-bg-surface-muted)',
        },
        line: 'var(--color-border-line)',
        primary: 'var(--color-text-primary)',
        body: 'var(--color-text-body)',
        muted: 'var(--color-text-muted)',
        subtle: 'var(--color-text-subtle)',
        marista: {
          navy: '#005280',
          'navy-dark': '#003a5c',
          'navy-light': '#1a6a9c',
          'navy-soft': '#e6eef3',
          teal: '#005280',
          'teal-dark': '#003a5c',
          'teal-light': '#e6eef3',
          'teal-border': '#bcd5dd',
        },
      },
    },
  },
  plugins: [],
};
