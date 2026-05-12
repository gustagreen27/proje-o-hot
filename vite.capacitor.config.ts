import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

// Build SPA estático para Capacitor iOS.
// Gera obrigatoriamente `dist/index.html` e assets locais, sem SSR e sem server.url.
export default defineConfig({
  plugins: [tsconfigPaths(), react(), tailwindcss()],
  appType: "spa",
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    ssr: false,
    manifest: false,
    rollupOptions: {
      input: "index.html",
    },
  },
});