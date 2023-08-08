/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/**/*.{js,ts,jsx,tsx,mdx}',
    './src/sections/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        styrene: ['var(--font-styrene)', 'sans-serif'],
      },
      colors: {
        primary: '#1A232E',
        secondary: '#303337',
        'landing-text-hero': '#8C8C8C',
        'button-stroke': {
          violet: '#82ACF9',
          green: '#07E78E',
        },
        panel: '#374151',
        button: '#202225',
        hedera: {
          green: '#07E78E',
          purple: '#A98DF4',
          'gradient-1': {
            blue: '#2D84EB',
            purple: '#8259EF',
          },
          'gradient-2': {
            lime: '#D4F392',
            teal: '#00BDC9',
          },
        },
      },
    },
  },
  plugins: [],
};
