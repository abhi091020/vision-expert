/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0085D4",
          dark: "#0F345E",
          mid: "#024167",
        },
        surface: "#F8FAFC",
      },
      backgroundImage: {
        "tab-gradient": "linear-gradient(180deg, #0085D4 0%, #024167 100%)",
        "title-gradient": "linear-gradient(90deg, #0F345E 0%, #0085D4 100%)",
      },
      animation: {
        blink: "blink 1s step-start infinite",
      },
      keyframes: {
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};
