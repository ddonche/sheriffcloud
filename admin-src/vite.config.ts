import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "node:path"

export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "../dist/admin",
    emptyOutDir: false,
  },
  resolve: {
    alias: {
      tslib: path.resolve(__dirname, "node_modules/tslib/tslib.es6.js"),
    },
  },
})