/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gh: {
          bg: '#0d1117',
          card: '#161b22',
          border: '#30363d',
          header: '#010409',
          btnBg: '#21262d',
          btnBorder: '#363b42',
          blue: '#58a6ff',
          blueActive: '#2f81f7',
          text: '#f0f6fc',
          muted: '#8b949e',
          green: '#2ea043',
        },
      },
    },
  },
  plugins: [],
};
