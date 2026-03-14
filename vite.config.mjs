import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

// In dev mode the Vite server sets COOP/COEP headers directly, so
// coi-serviceworker is unnecessary and can interfere with HMR. Strip it.
// In build mode, inline it as a classic script to avoid Vite's
// "can't bundle without type=module" warning and save a network round-trip.
function coiDevPlugin() {
  return {
    name: "coi-dev-exclude",
    transformIndexHtml: {
      order: "pre",
      handler(html, ctx) {
        if (ctx.server) {
          // Dev server sets COOP/COEP headers directly, so strip the script tag.
          return html.replace(
            /<script\s+src="[^"]*coi-serviceworker\.js"><\/script>\n?/g,
            ""
          );
        }
        // Build mode: keep the script tag as-is. Vite replaces %BASE_URL% and
        // copies coi-serviceworker.js from public/ to dist/, so
        // window.document.currentScript.src will resolve to the correct URL.
        return html;
      },
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [react(), coiDevPlugin()],
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Resource-Policy": "same-origin",
    },
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
      output: {
        entryFileNames: "static/js/[name].js",
        chunkFileNames: "static/js/[name]-[hash].js",
        assetFileNames: "static/[ext]/[name]-[hash].[ext]",
        manualChunks: {
          xterm: ["@xterm/xterm", "@xterm/addon-fit"],
        },
      },
    },
  },
});
