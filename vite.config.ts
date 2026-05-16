import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves this repo at /ChrisGramlyMortgage/
const BASE = process.env.VITE_BASE ?? "/ChrisGramlyMortgage/";

export default defineConfig({
  base: BASE,
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ["three"],
          r3f: ["@react-three/fiber", "@react-three/drei", "@react-three/postprocessing"],
          gsap: ["gsap", "@gsap/react"]
        }
      }
    }
  },
  server: {
    host: "127.0.0.1",
    port: 5173
  }
});
