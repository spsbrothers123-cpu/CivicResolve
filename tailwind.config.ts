import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: {
            DEFAULT: "#102C35",
            dark: "#0B1E24",
            light: "#183D49",
            hover: "#153843",
          },
          lime: {
            DEFAULT: "#D6F36A",
            hover: "#C4E654",
            light: "#F3FBD9",
            dark: "#89A71B",
          },
          warm: {
            DEFAULT: "#F5F5EF",
            muted: "#ECECE5",
            card: "#FFFFFF",
          },
          muted: "#71838A",
          critical: {
            DEFAULT: "#D65B52",
            light: "#FDEDED",
            border: "#F8B4AF",
          },
          warning: {
            DEFAULT: "#E7A23B",
            light: "#FEF7EC",
            border: "#FBD69F",
          },
          resolved: {
            DEFAULT: "#24876B",
            light: "#E9F6F2",
            border: "#9DE0CB",
          },
          info: {
            DEFAULT: "#2D7FF9",
            light: "#EEF5FE",
            border: "#B2D2FD",
          },
        },
      },
      fontFamily: {
        heading: ["var(--font-manrope)", "Manrope", "sans-serif"],
        body: ["var(--font-inter)", "Inter", "sans-serif"],
        mono: ["var(--font-jetbrains)", "JetBrains Mono", "monospace"],
      },
      borderRadius: {
        card: "14px",
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(16, 44, 53, 0.05), 0 1px 2px -1px rgba(16, 44, 53, 0.05)",
        card: "0 4px 12px 0 rgba(16, 44, 53, 0.04), 0 2px 4px -2px rgba(16, 44, 53, 0.04)",
        floating: "0 10px 25px -5px rgba(16, 44, 53, 0.1), 0 8px 10px -6px rgba(16, 44, 53, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
