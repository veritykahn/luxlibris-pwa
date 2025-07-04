// tailwind.config.mjs
export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./contexts/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'avenir': ['Avenir', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        'didot': ['Didot', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}