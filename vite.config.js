import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  publicDir: false,
  build: {
    rollupOptions: {
      input: {
        init: resolve(__dirname, "src/init.js"),
      },
      output: {
        format: "iife",
        entryFileNames: "[name].js",
        dir: resolve(__dirname, "public/static/js"),
      },
    },
    outDir: "public/static/js",
    emptyOutDir: false,
    minify: "esbuild",
  },
});
