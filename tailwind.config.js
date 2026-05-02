/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0B0E14',
        surface: '#17111b',
        'surface-low': '#1F1924',
        'surface-high': '#2e2832',
        border: '#1F2937',
        'text-primary': '#eadfee',
        'text-secondary': '#cfc2d7',
        'text-muted': '#6B7280',
        primary: '#9333EA',
        'primary-light': '#ddb8ff',
        cat: {
          dsa: '#9333EA',
          sysdesign: '#3B82F6',
          networking: '#14B8A6',
          ml: '#F59E0B',
          books: '#10B981',
          jobs: '#F97316',
          cv: '#EC4899',
          contests: '#EF4444',
          office: '#6B7280',
        },
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

