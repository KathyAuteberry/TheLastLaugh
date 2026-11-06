/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Near-neutral darks with only a hint of violet, so the accents carry the colour.
        ink: { 950: "#0b0a0f", 900: "#131219", 800: "#1b1a23", 700: "#262430", 600: "#363341" },
        jester: { violet: "#8b5cf6", crimson: "#e0314f", gold: "#e8b84a" },
        role: { tank: "#4f7fe0", healer: "#3fae5f", dps: "#d9534f" },
      },
      fontFamily: {
        display: ['"Cinzel"', "Georgia", "serif"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
