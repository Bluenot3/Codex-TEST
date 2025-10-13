import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}", "./styles/**/*.{css}", "./public/**/*.svg"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        zen: {
          glass: "rgba(148, 163, 184, 0.12)",
        },
      },
      borderRadius: {
        "3xl": "var(--zen-radius-3xl)",
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        glow: "0 40px 120px -80px rgba(56, 189, 248, 0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
