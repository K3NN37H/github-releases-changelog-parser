import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [react()],
  root: 'src',
  base: './',
  build: {
    outDir: '../docs',
    emptyOutDir: true
  }
}));
