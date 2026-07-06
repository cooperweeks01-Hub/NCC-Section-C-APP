import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Local-first: the app runs entirely in the browser with zero cloud dependency.
// Deploying to Azure later is a config/implementation swap behind the ProjectStore
// and Explainer interfaces — not a rewrite. Nothing here may depend on a server.
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
