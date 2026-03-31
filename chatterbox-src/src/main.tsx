import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import ChatterboxApp from "./ChatterboxApp"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ChatterboxApp />
  </StrictMode>
)
