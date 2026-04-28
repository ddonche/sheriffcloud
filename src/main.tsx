import React from "react"
import ReactDOM from "react-dom/client"
import App from "./app/App"
import { getSupabase } from "./shared/supabase"

async function consumeCrossDomainSession() {
  const hash = window.location.hash
  // nothing to do
  if (!hash || !hash.includes("access_token=")) return
  const params = new URLSearchParams(hash.slice(1))
  const access_token = params.get("access_token")
  const refresh_token = params.get("refresh_token")
  if (!access_token || !refresh_token) return
  // SET SESSION BEFORE APP LOADS
  const { error } = await getSupabase().auth.setSession({
    access_token,
    refresh_token,
  })
  if (error) alert("setSession error: " + error.message)
  // CLEAN URL AFTER
  window.history.replaceState(
    null,
    "",
    window.location.pathname + window.location.search
  )
}

async function init() {
  // THIS MUST RUN FIRST
  await consumeCrossDomainSession()
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}

init()