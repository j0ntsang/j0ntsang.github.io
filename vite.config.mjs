import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

// In dev mode the Vite server sets COOP/COEP headers directly, so
// coi-serviceworker is unnecessary and can interfere with HMR. Strip it.
// In build mode, inline the script content to save a network round-trip, but
// patch the service worker registration URL to use document.baseURI instead of
// currentScript.src (which is null for inline scripts).
function coiDevPlugin() {
  return {
    name: "coi-dev-exclude",
    transformIndexHtml: {
      order: "pre",
      handler(html, ctx) {
        if (ctx.server) {
          return html.replace(
            /<script\s+src="[^"]*coi-serviceworker\.js"><\/script>\n?/g,
            ""
          );
        }
        const content = readFileSync(
          new URL("node_modules/coi-serviceworker/coi-serviceworker.js", import.meta.url),
          "utf8"
        );
        // currentScript.src is null for inline scripts; use document.baseURI
        // so the browser can still fetch coi-serviceworker.js from dist/.
        const patched = content.replace(
          "n.serviceWorker.register(window.document.currentScript.src)",
          "n.serviceWorker.register(new URL('./coi-serviceworker.js', document.baseURI).href)"
        );
        return html.replace(
          /<script\s+src="[^"]*coi-serviceworker\.js"><\/script>/g,
          `<script>${patched}</script>`
        );
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
