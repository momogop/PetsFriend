/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#EEF1E7",
        surface: "#FFFFFF",
        surface2: "#E4E9DA",
        ink: "#1F3327",
        inksoft: "#4C5B4E",
        muted: "#6B7566",
        primary: "#3C6E47",
        primarydark: "#2A4E33",
        accent: "#E2A33B",
        accent2: "#C1592C",
        line: "#D8DECB",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "20px",
      },
    },
  },
  plugins: [],
};
