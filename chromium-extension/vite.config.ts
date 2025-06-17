import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

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
        // Ensure service-worker files have no hash in the name after [transpiled, bundled, minified, etc]
        // Why? CRX's manifest points to the service-worker by name
        // Other files will have a hash to ensure cache busting
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === "service-worker" ? "assets/[name].js" : "assets/[name]-[hash].js";
        },
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name].[ext]",
        format: "es",
      },
    },
    // CRX expect a 'dist' folder
    outDir: "dist",
  },
});
