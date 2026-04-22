import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  base: "/",
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: false,
    assetsDir: "assets-home",
  },
  server: {
    proxy: {
      "/api": {
        target: "https://admin.sheriffcloud.com",
        changeOrigin: true,
        secure: true,
        configure: (proxy) => {
          proxy.on("error", (err) => {
            console.error("proxy error", err)
          })
        },
      },
    },
  },
})