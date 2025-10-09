import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms'

export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bluebell-blue': '#01589D',
        'bluebell-mustard': '#FDCE59',
        'bluebell-white': '#FEFEFE',
        'bluebell-crimson': '#DC2A38',
        'bluebell-brown': '#4E302E',
        'senlysh-primary': '#1F2937',
        'senlysh-accent': '#F59E0B',
        'senlysh-light': '#F3F4F6'
      },
      fontFamily: {
        'serif': ['Playfair Display', 'Georgia', 'serif'],
        'sans': ['Inter', 'sans-serif']
      }
    },
  },
  plugins: [forms],
} satisfies Config
