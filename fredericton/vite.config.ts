import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";
import { pagePaths } from "./src/ia/sections";

/**
 * Where the app is served from. "/fredericton/" inside the portfolio (jontsang.ca/fredericton/);
 * "/" when it gets its own domain (npm run build:standalone).
 */
const base = process.env.FREDERICTON_BASE ?? "/fredericton/";
/** Inside the portfolio, build into its public/ so the portfolio's own build ships it. */
const outDir = resolve(process.env.FREDERICTON_OUT ?? "../public/fredericton");

/**
 * GitHub Pages has no rewrites, so a deep link like /fredericton/news/ needs a real file.
 * Every route gets a copy of index.html; the client router takes it from there.
 */
function routePages(paths: string[]): Plugin {
  return {
    name: "route-pages",
    apply: "build",
    async closeBundle() {
      for (const path of paths.filter((p) => p !== "/")) {
        await mkdir(resolve(outDir, `.${path}`), { recursive: true });
        await copyFile(resolve(outDir, "index.html"), resolve(outDir, `.${path}/index.html`));
      }
    },
  };
}

export default defineConfig({
  base,
  plugins: [react(), tailwindcss(), routePages(pagePaths)],
  // An inline config stops Vite from finding the portfolio's Tailwind 3 PostCSS config one folder up.
  css: { postcss: {} },
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  server: { port: 5180 },
  build: { outDir, emptyOutDir: true },
  test: { include: ["src/**/*.test.{ts,tsx}"] },
});
