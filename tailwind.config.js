/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,jsx}", "./index.html"],
  theme: {
    extend: {
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fadeIn": {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fadeIn": "fadeIn 0.3s ease-in-out",
      },
      colors: {
        'drum': {
          'kick': '#ef4444',
          'snare': '#3b82f6',
          'hihat': '#eab308',
          'accent': '#10b981',
          'ghost': '#6b7280',
        },
        'grid': {
          'line': '#3a4556',
          'beat': '#4a5568',
          'bar': '#5a6578',
          'active': '#4dd0e1',
        },
        'daw': {
          'bg-primary': '#1a2332',
          'bg-secondary': '#2a3f5f',
          'bg-panel': '#243447',
          'border': '#3a4556',
          'accent': '#4dd0e1',
          'accent-hover': '#5de0f1',
          'text-primary': '#e2e8f0',
          'text-secondary': '#a0aec0',
          'text-dim': '#718096',
          'button': '#374151',
          'button-hover': '#4b5563',
          'success': '#10b981',
          'warning': '#f59e0b',
          'danger': '#ef4444',
        }
      },
      spacing: {
        'step': '2rem',
      },
      fontFamily: {
        'mono': ['SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'monospace'],
        'dancing': ['Dancing Script', 'cursive'],
      },
      boxShadow: {
        'panel': '0 2px 8px rgba(0, 0, 0, 0.3)',
        'button': '0 1px 3px rgba(0, 0, 0, 0.2)',
      },
    }
  },
  plugins: [],
}