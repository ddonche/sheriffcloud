import React from "react"
import ReactDOM from "react-dom/client"
import HolsterApp from "./HolsterApp"
import "./index.css"

const root = document.getElementById("root")

if (!root) {
  throw new Error("Root element not found")
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <HolsterApp />
  </React.StrictMode>
)