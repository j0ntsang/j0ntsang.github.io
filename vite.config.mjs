import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { extname, resolve, sep } from "path";
import { existsSync, readFileSync, statSync } from "fs";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};

// In dev, /fredericton/ would otherwise resolve to the app's *source* index.html
// (fredericton/index.html sits under this project's root), whose /src/main.tsx is
// this site's src. Serve the built copy in public/fredericton/ instead, the way
// GitHub Pages does: real files as-is, any other path its route's index.html.
function frederictonDevPlugin() {
  const builtDir = resolve(__dirname, "public/fredericton");
  return {
    name: "fredericton-dev",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = decodeURIComponent((req.url ?? "").split("?")[0]);
        // GitHub Pages redirects a folder without its slash; without this, Vite's SPA
        // fallback would answer /fredericton with the terminal.
        if (path === "/fredericton") {
          const query = (req.url ?? "").slice(path.length);
          res.writeHead(301, { Location: `/fredericton/${query}` });
          return res.end();
        }
        if (!path.startsWith("/fredericton/")) return next();
        if (!existsSync(builtDir)) {
          res.statusCode = 404;
          res.setHeader("Content-Type", "text/plain");
          return res.end("Fredericton isn't built yet: run npm run build:fredericton");
        }
        const file = resolve(builtDir, `.${path.slice("/fredericton".length)}`);
        if (file !== builtDir && !file.startsWith(builtDir + sep)) return next();
        const target =
          existsSync(file) && statSync(file).isFile()
            ? file
            : [resolve(file, "index.html"), resolve(builtDir, "index.html")].find(existsSync);
        for (const [name, value] of Object.entries(server.config.server.headers ?? {})) res.setHeader(name, value);
        res.setHeader("Content-Type", MIME[extname(target)] ?? "application/octet-stream");
        res.end(readFileSync(target));
      });
    },
  };
}

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
  plugins: [react(), coiDevPlugin(), frederictonDevPlugin()],
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Resource-Policy": "same-origin",
    },
  },
  // Preview inherits server.headers by default, which would isolate the page
  // without the service worker. GitHub Pages sends none, so preview sends none.
  preview: {
    headers: {},
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
