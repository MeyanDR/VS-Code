/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js}", "./index.html"],
  theme: {
    extend: {
      colors: {
        'drum': {
          'kick': '#ef4444',
          'snare': '#3b82f6',
          'hihat': '#eab308',
          'accent': '#10b981',
          'ghost': '#6b7280',
        },
        'grid': {
          'line': '#e5e7eb',
          'beat': '#9ca3af',
          'bar': '#374151',
        }
      },
      spacing: {
        'step': '2rem',
      }
    }
  },
  plugins: [],
}