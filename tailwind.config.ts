import type { Config } from "tailwindcss";

// Borg group identity (Crossmuller sits under Borg — one system covers both).
// Clean, industrial-corporate: white/light base, a strong Borg red accent used
// deliberately (actions, active states, flags — not a flood), charcoal text.
//
// NOTE: these hex values are PLACEHOLDERS pending confirmation of the exact
// brand palette from borgs.com.au. Marked here so they are swapped, not trusted.
const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // TODO(brand): confirm exact Borg red + neutrals from borgs.com.au.
        borg: {
          red: "#C8102E", // PLACEHOLDER — confirm against borgs.com.au
          charcoal: "#1F2328", // PLACEHOLDER — near-black text
          slate: "#3A4149", // PLACEHOLDER — secondary text
          mist: "#F5F6F7", // PLACEHOLDER — light panel base
          line: "#E2E5E9", // PLACEHOLDER — hairline borders
        },
        // Semantic states for compliance results.
        status: {
          complies: "#1B7F4B",
          fails: "#B4231F",
          advisory: "#8A6D1A",
          flag: "#B4231F",
          insufficient: "#5A626B",
          draft: "#B4231F", // the unverified-data banner accent
        },
      },
      fontFamily: {
        // Technical sans-serif per the brief; system stack until brand font confirmed.
        sans: [
          "Inter",
          "Segoe UI",
          "system-ui",
          "-apple-system",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
