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
    port: 5173,
    proxy: {
      "/api/": {
        target: "http://localhost:9000",
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on("error", (err) => {
            console.error("proxy error", err)
          })
          proxy.on("proxyReq", (proxyReq) => {
            console.log("PROXY REQ:", proxyReq.path)
          })
          proxy.on("proxyRes", (proxyRes) => {
            console.log("PROXY RES:", proxyRes.statusCode)
          })
        },
      },
    },
  },
})