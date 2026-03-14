import { useEffect, useState } from "react"
import { getSupabase } from "./supabase"

type PortalResponse = {
  portals: string[]
}

type CreatePortalResponse = {
  ok: boolean
  portal?: string
  stderr?: string
}

type DeletePortalResponse = {
  ok: boolean
  stderr?: string
}

type BuildResponse = {
  ok: boolean
  code: number | null
  stdout: string
  stderr: string
}

const API_BASE = `${window.location.origin}/api`

export default function App() {
  const [supabase, setSupabase] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const [portals, setPortals] = useState<string[]>([])
  const [loadingPortals, setLoadingPortals] = useState(false)

  const [newPortal, setNewPortal] = useState("")
  const [creatingPortal, setCreatingPortal] = useState(false)

  const [buildingPortal, setBuildingPortal] = useState<string | null>(null)
  const [deletingPortal, setDeletingPortal] = useState<string | null>(null)
  const [buildOutput, setBuildOutput] = useState("")

  useEffect(() => {
    const client = getSupabase()
    if (!client) return

    setSupabase(client)

    client.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const { data: listener } = client.auth.onAuthStateChange((_e, session) => {
      setSession(session)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return
    loadPortals()
  }, [session])

  function cleanPortalName(value: string) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
  }

  function siteUrlForPortal(portal: string) {
    const url = new URL(window.location.origin)

    if (url.hostname === "admin.localhost") {
      url.hostname = `${portal}.localhost`
    } else if (url.hostname.endsWith(".sheriffcloud.com")) {
      url.hostname = `${portal}.sheriffcloud.com`
    } else {
      url.hostname = `${portal}.${url.hostname}`
    }

    url.pathname = "/"
    url.search = ""
    url.hash = ""

    return url.toString()
  }

  function formatBuildOutput(portal: string, data: BuildResponse) {
    const statusLine =
      data.ok && data.code === 0
        ? `BUILD SUCCESS — ${portal}`
        : `BUILD FAILED — ${portal}`

    return [
      statusLine,
      "=".repeat(statusLine.length),
      `Portal: ${portal}`,
      `Exit Code: ${data.code ?? "n/a"}`,
      "",
      "STDOUT",
      "------",
      data.stdout || "(none)",
      "",
      "STDERR",
      "------",
      data.stderr || "(none)",
    ].join("\n")
  }

  async function loadPortals() {
    setLoadingPortals(true)
    try {
      const res = await fetch(`${API_BASE}/portals`)
      const data: PortalResponse = await res.json()
      setPortals(data.portals || [])
    } catch (err: any) {
      alert(err.message || "Failed to load portals")
    } finally {
      setLoadingPortals(false)
    }
  }

  async function createPortal() {
    const portalName = cleanPortalName(newPortal)

    if (!portalName) {
      alert("Enter a portal name")
      return
    }

    setCreatingPortal(true)

    try {
      const res = await fetch(`${API_BASE}/create_portal?${encodeURIComponent(portalName)}`)
      const data: CreatePortalResponse = await res.json()

      if (!data.ok) {
        alert(data.stderr || "Failed to create portal")
        return
      }

      setNewPortal("")
      await loadPortals()
      setBuildOutput(`CREATED PORTAL — ${portalName}`)
    } catch (err: any) {
      alert(err.message || "Failed to create portal")
    } finally {
      setCreatingPortal(false)
    }
  }

  async function buildPortal(portal: string) {
    setBuildingPortal(portal)
    setBuildOutput("")

    try {
      const res = await fetch(`${API_BASE}/build?${encodeURIComponent(portal)}`)
      const data: BuildResponse = await res.json()
      setBuildOutput(formatBuildOutput(portal, data))
    } catch (err: any) {
      setBuildOutput(`BUILD FAILED — ${portal}\n\n${err.message || "Build failed"}`)
    } finally {
      setBuildingPortal(null)
    }
  }

  async function deletePortal(portal: string) {
    const confirmed = window.confirm(
      `Are you sure you want to delete the portal "${portal}"? This will remove its source files.`
    )

    if (!confirmed) return

    setDeletingPortal(portal)

    try {
      const res = await fetch(`${API_BASE}/delete_portal?${encodeURIComponent(portal)}`)
      const data: DeletePortalResponse = await res.json()

      if (!data.ok) {
        alert(data.stderr || "Failed to delete portal")
        return
      }

      await loadPortals()
      setBuildOutput(`DELETED PORTAL — ${portal}`)
    } catch (err: any) {
      alert(err.message || "Failed to delete portal")
    } finally {
      setDeletingPortal(null)
    }
  }

  function openPortal(portal: string) {
    window.open(siteUrlForPortal(portal), "_blank", "noopener,noreferrer")
  }

  async function signIn() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) alert(error.message)
  }

  async function signOut() {
    await supabase.auth.signOut()
    setPortals([])
    setBuildOutput("")
  }

  if (!supabase) {
    return (
      <div style={{ padding: 40 }}>
        <h1>Sheriff Cloud</h1>
        <p>Supabase configuration missing.</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div style={{ padding: 40 }}>
        <h1>Sheriff Cloud Login</h1>

        <input
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <br />
        <br />

        <input
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <br />
        <br />

        <button onClick={signIn}>Login</button>
      </div>
    )
  }

  return (
    <div style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h1>Sheriff Cloud</h1>

      <div style={{ marginBottom: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button onClick={signOut}>Logout</button>
        <button onClick={loadPortals}>
          {loadingPortals ? "Refreshing..." : "Refresh Portals"}
        </button>
      </div>

      <h2>Create Portal</h2>

      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        <input
          placeholder="new portal name"
          value={newPortal}
          onChange={(e) => setNewPortal(cleanPortalName(e.target.value))}
        />
        <button onClick={createPortal} disabled={creatingPortal || !newPortal.trim()}>
          {creatingPortal ? "Creating..." : "Create Portal"}
        </button>
      </div>

      <h2>Portals</h2>

      {loadingPortals ? (
        <p>Loading...</p>
      ) : portals.length === 0 ? (
        <p>No portals found.</p>
      ) : (
        <div style={{ display: "grid", gap: 12, marginBottom: 24 }}>
          {portals.map((portal) => (
            <div
              key={portal}
              style={{
                border: "1px solid #ccc",
                borderRadius: 8,
                padding: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div>
                <strong>{portal}</strong>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  onClick={() => buildPortal(portal)}
                  disabled={buildingPortal === portal || deletingPortal === portal}
                >
                  {buildingPortal === portal ? "Building..." : "Build"}
                </button>

                <button
                  onClick={() => openPortal(portal)}
                  disabled={buildingPortal === portal || deletingPortal === portal}
                >
                  Open Site
                </button>

                <button
                  onClick={() => deletePortal(portal)}
                  disabled={buildingPortal === portal || deletingPortal === portal}
                >
                  {deletingPortal === portal ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2>Build Output</h2>
      <pre
        style={{
          background: "#111",
          color: "#0f0",
          padding: 16,
          borderRadius: 8,
          overflowX: "auto",
          whiteSpace: "pre-wrap",
        }}
      >
        {buildOutput || "No build run yet."}
      </pre>
    </div>
  )
}