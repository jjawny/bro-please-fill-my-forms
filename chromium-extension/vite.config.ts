import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        popup: "index.html",
        "service-worker": "src/lib/service-workers/service-worker.ts",
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === "service-worker" ? "assets/[name].js" : "assets/[name]-[hash].js";
        },
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name].[ext]",
        format: "es",
      },
    },
    // Chromium Extensions expect a 'dist' folder
    outDir: "dist",
  },
});
