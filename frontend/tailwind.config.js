/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0f172a",
        sidebar: "#020617",
        card: "#1e293b",
        primaryText: "#f8fafc",
        secondaryText: "#cbd5f5",
        accent: "#facc15",
        danger: "#ef4444",
        success: "#22c55e",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(250, 204, 21, 0.2), 0 10px 30px rgba(2, 6, 23, 0.6)",
      },
      fontFamily: {
        display: ["Space Grotesk", "ui-sans-serif", "sans-serif"],
      },
    },
  },
  plugins: [],
};
