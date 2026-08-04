import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sage: {
          50:  "#f1f8f5",
          100: "#daeee5",
          200: "#b8ddcc",
          300: "#88c4aa",
          400: "#55a585",
          500: "#33896a",
          600: "#256e54",
          700: "#1e5843",
          800: "#194737",
          900: "#153b2e",
        },
      },
    },
  },
  plugins: [],
};

export default config;
