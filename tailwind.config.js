/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Colder brand colors (from icon)
        colder: {
          ice: '#5FD3F3',        // Primary brand color
          'ice-light': '#B8E8F5', // Light backgrounds, hover states
          'ice-deep': '#4FB3D9',  // Active states, emphasis
          frost: '#E8F7FB',       // Subtle backgrounds, cards
        },
        // LinkedIn colors (kept for reference)
        linkedin: {
          blue: '#0077B5',
          dark: '#004182'
        }
      }
    },
  },
  plugins: [],
}