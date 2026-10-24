// Memory-light build config for LOCAL VERIFICATION ONLY.
// The full `npm run build` (Tailwind plugin + minify) OOMs in this environment,
// so this config skips the Tailwind plugin and minification. The real build
// remains the source of truth for deploys.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  base: "/",
  plugins: [
    react({
      jsxRuntime: "automatic",
      babel: { babelrc: false, configFile: false },
    }),
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
  build: {
    minify: false,
    cssCodeSplit: false,
    target: "es2020",
    chunkSizeWarningLimit: 100000,
  },
});
