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
        line: "#c7e9ef",
        muted: "#5a8b93",
        cyanDeep: "#00b8cf",
        brandBlue: "#0B49B7",
        brandTeal: "#09C3BE",
        error: "#BA1A1A",
        surface: "#FFFFFF",
        onSurface: "#1A1F36",
        onSurfaceVariant: "#44495E",
        outline: "#C4C7D4",
        brandInk: "#061131"
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Hanken Grotesk", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "Geist", "ui-monospace", "monospace"]
      },
      fontSize: {
        "display-lg": ["28px", { lineHeight: "34px", letterSpacing: "-0.56px", fontWeight: "700" }],
        "headline-md": ["21px", { lineHeight: "28px", letterSpacing: "-0.21px", fontWeight: "600" }],
        "title-sm": ["16px", { lineHeight: "22px", letterSpacing: "0px", fontWeight: "600" }],
        "body-md": ["14px", { lineHeight: "21px", letterSpacing: "0.14px", fontWeight: "400" }],
        "body-sm": ["12.5px", { lineHeight: "18px", letterSpacing: "0.12px", fontWeight: "400" }],
        "label-caps": ["11px", { lineHeight: "14px", letterSpacing: "0.88px", fontWeight: "600" }],
        "mono-data": ["12.5px", { lineHeight: "18px", letterSpacing: "-0.25px", fontWeight: "500" }]
      },
      boxShadow: {
        glow: "0 24px 80px rgba(0, 217, 245, 0.24)",
        card: "0 20px 60px rgba(0, 31, 38, 0.12)",
        brandGlow: "0 24px 80px rgba(11, 73, 183, 0.16)",
        brandCard: "0 20px 60px rgba(6, 17, 49, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;

