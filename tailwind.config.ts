import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#06262f",
        midnight: "#001f26",
        cyan: "#00d9f5",
        aqua: "#71efff",
        cloud: "#f4fbfd",
        mist: "#dff6fa",
        line: "#c7e9ef"
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Plus Jakarta Sans", "system-ui", "sans-serif"]
      },
      boxShadow: {
        glow: "0 24px 80px rgba(0, 217, 245, 0.24)",
        card: "0 20px 60px rgba(0, 31, 38, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;

