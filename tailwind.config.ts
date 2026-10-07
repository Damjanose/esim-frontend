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
        brandInk: "#061131",
        // velocity-eSim marketplace.textMuted / marketplace.tabInactive (BottomTabBar)
        dockMuted: "#5C6B8A",
        dockCenterInactive: "#9FB4DA",
        // velocity-eSim lightPalette.surfaceBright: soft page/section tint
        surfaceBright: "#F5F7FA",
        // velocity-eSim `button` tokens (lit pill): top stop of each vertical fill + flat states
        litTop: "#1D5ED6",
        dangerTop: "#D23131",
        moonBottom: "#E4EEFF",
        onDarkLabel: "#EAF4FF",
        orbitCore: "#5CE6F0",
        disabledFill: "#E6EAF1",
        disabledLabel: "#8A96B0"
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
        brandCard: "0 20px 60px rgba(6, 17, 49, 0.08)",
        // velocity-eSim BOTTOM_TAB_STYLE: capsule (ink, 0.28, y10 r20) + center ring (teal, 0.42, y5 r10)
        dock: "0 10px 20px rgba(6, 17, 49, 0.28)",
        dockCenter: "0 5px 10px rgba(9, 195, 190, 0.42)",
        // Lit pill (velocity-eSim Button): 1px top highlight, 3px lip, coloured glow; pressed = 1px lip, tight glow
        lit: "inset 0 1px 0 rgba(255, 255, 255, 0.30), inset 0 -3px 0 rgba(4, 26, 80, 0.35), 0 8px 18px -6px rgba(11, 73, 183, 0.55), 0 1px 2px rgba(6, 17, 49, 0.15)",
        litPressed: "inset 0 1px 0 rgba(255, 255, 255, 0.22), inset 0 -1px 0 rgba(4, 26, 80, 0.35), 0 3px 8px -4px rgba(11, 73, 183, 0.55)",
        litDanger: "inset 0 1px 0 rgba(255, 255, 255, 0.28), inset 0 -3px 0 rgba(90, 0, 0, 0.30), 0 8px 18px -6px rgba(186, 26, 26, 0.50)",
        litDangerPressed: "inset 0 1px 0 rgba(255, 255, 255, 0.22), inset 0 -1px 0 rgba(90, 0, 0, 0.30), 0 3px 8px -4px rgba(186, 26, 26, 0.50)",
        moon: "inset 0 -3px 0 rgba(11, 73, 183, 0.18), 0 0 0 1px rgba(255, 255, 255, 0.4), 0 8px 24px -6px rgba(92, 200, 255, 0.60)",
        moonPressed: "inset 0 -1px 0 rgba(11, 73, 183, 0.18), 0 3px 12px -4px rgba(92, 200, 255, 0.60)",
        glassEdge: "inset 0 0 0 1px rgba(255, 255, 255, 0.14)",
        orbit: "0 0 0 3px rgba(92, 230, 240, 0.25), 0 0 10px #5CE6F0"
      }
    }
  },
  plugins: []
};

export default config;

