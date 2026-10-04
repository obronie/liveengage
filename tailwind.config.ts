import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        learnblended: {
          blue: "#4682B4",           // Steel Blue (Primary)
          "blue-hover": "#3b6f9a",
          "blue-light": "#D5E3EF",   // Soft Ice Blue
          "blue-dark": "#1e3a5f",
          green: "#6DC082",          // Emerald Green (Brand Accent & Success)
          "green-hover": "#5cb372",
          "green-light": "#F1F9F3",  // Off-White Mint (Light Canvas)
          gray: "#696969",
          charcoal: "#1e293b",
        },
        // Particify functional option badges styled in LearnBlended palette
        option: {
          a: "#e65100", // Warm Amber
          b: "#4682B4", // Steel Blue
          c: "#0284c7", // Sky Blue
          d: "#6DC082", // Emerald Green
        },
        projector: {
          bg: "#0a0f1d",       // Deep navy projector venue canvas
          surface: "#121b2d",  // Presenter card background
          border: "#1e2e4a",   // Crisp projector border
          highlight: "#4682B4",
        }
      },
      fontFamily: {
        sans: ["Roboto", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
};

export default config;
