import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  base: "/chatterbox/",
  build: {
    outDir: "../dist/chatterbox",
    emptyOutDir: false,
  },
})
