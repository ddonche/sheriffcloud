import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import RodeoApp from "./RodeoApp"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RodeoApp />
  </StrictMode>
)
