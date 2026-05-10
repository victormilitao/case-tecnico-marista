/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
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
