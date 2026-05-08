/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        marista: {
          navy: '#1c3d7a',
          'navy-dark': '#152d5e',
          'navy-light': '#234a93',
          'navy-soft': '#e8eef8',
          teal: '#1aabbc',
          'teal-dark': '#148898',
          'teal-light': '#e8f8fa',
          'teal-border': '#b8e6ec',
        },
      },
    },
  },
  plugins: [],
};
