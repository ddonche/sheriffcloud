import { useEffect, useState } from "react"
import { getSupabase } from "./supabase"

type PortalResponse = {
  portals: string[]
}

type ListFilesResponse = {
  ok: boolean
  files: string[]
  stderr?: string
}

type ReadFileResponse = {
  ok: boolean
  path: string
  content: string
  stderr?: string
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

  const [portalFiles, setPortalFiles] = useState<string[]>([])
  const [loadingFiles, setLoadingFiles] = useState(false)

  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState("")
  const [loadingFileContent, setLoadingFileContent] = useState(false)
  const [savingFile, setSavingFile] = useState(false)

  const [newPortal, setNewPortal] = useState("")
  const [creatingPortal, setCreatingPortal] = useState(false)

  const [buildingPortal, setBuildingPortal] = useState<string | null>(null)
  const [deletingPortal, setDeletingPortal] = useState<string | null>(null)
  const [buildOutput, setBuildOutput] = useState("")

  const [selectedPortal, setSelectedPortal] = useState<string | null>(null)

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

  useEffect(() => {
    if (!selectedPortal && portals.length > 0) {
      const next = portals[0]
      setSelectedPortal(next)
      void loadFiles(next)
      return
    }

    if (selectedPortal && !portals.includes(selectedPortal)) {
      const next = portals[0] ?? null
      setSelectedPortal(next)

      if (next) {
        void loadFiles(next)
      } else {
        setPortalFiles([])
        setSelectedFile(null)
        setFileContent("")
      }
    }
  }, [portals, selectedPortal])

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

  function pickDefaultFile(files: string[]) {
    if (files.includes("content/index.md")) return "content/index.md"
    return files[0] ?? null
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

  async function loadFiles(portal: string) {
    setLoadingFiles(true)
    setPortalFiles([])
    setSelectedFile(null)
    setFileContent("")

    try {
      const res = await fetch(`${API_BASE}/list_files?${encodeURIComponent(portal)}`)
      const data: ListFilesResponse = await res.json()

      if (!data.ok) {
        setPortalFiles([])
        alert(data.stderr || "Failed to load files")
        return
      }

      const files = data.files || []
      setPortalFiles(files)

      const defaultFile = pickDefaultFile(files)
      if (defaultFile) {
        await loadFile(portal, defaultFile)
      }
    } catch (err: any) {
      setPortalFiles([])
      alert(err.message || "Failed to load files")
    } finally {
      setLoadingFiles(false)
    }
  }

  async function loadFile(portal: string, path: string) {
    setLoadingFileContent(true)

    try {
      const query = new URLSearchParams({
        portal,
        path,
      })

      const res = await fetch(`${API_BASE}/read_file?${query.toString()}`)
      const data: ReadFileResponse = await res.json()

      if (!data.ok) {
        alert(data.stderr || "Failed to read file")
        return
      }

      setSelectedFile(data.path)
      setFileContent(data.content || "")
    } catch (err: any) {
      alert(err.message || "Failed to read file")
    } finally {
      setLoadingFileContent(false)
    }
  }

  async function saveFile() {
    if (!selectedPortal || !selectedFile) {
      alert("No file selected")
      return
    }

    setSavingFile(true)

    try {
      const query = new URLSearchParams({
        portal: selectedPortal,
        path: selectedFile,
      })

      const res = await fetch(`${API_BASE}/write_file?${query.toString()}`, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
        },
        body: fileContent,
      })

      const data: BuildResponse = await res.json()

      setBuildOutput(formatBuildOutput(selectedPortal, data))

      if (!data.ok || data.code !== 0) {
        alert(data.stderr || "Failed to save/build file")
        return
      }
    } catch (err: any) {
      alert(err.message || "Failed to save file")
    } finally {
      setSavingFile(false)
    }
  }

  async function runBuild(portal: string) {
    setBuildingPortal(portal)

    try {
      const res = await fetch(`${API_BASE}/build?${encodeURIComponent(portal)}`)
      const data: BuildResponse = await res.json()

      setBuildOutput(formatBuildOutput(portal, data))
      return data
    } catch (err: any) {
      const message = err.message || "Build failed"
      setBuildOutput(`BUILD FAILED — ${portal}\n\n${message}`)
      return {
        ok: false,
        code: null,
        stdout: "",
        stderr: message,
      } as BuildResponse
    } finally {
      setBuildingPortal(null)
    }
  }

  async function createPortal() {
    const portalName = cleanPortalName(newPortal)

    if (!portalName) {
      alert("Enter a portal name")
      return
    }

    setCreatingPortal(true)
    setBuildOutput("")

    try {
      const res = await fetch(`${API_BASE}/create_portal?${encodeURIComponent(portalName)}`)
      const data: CreatePortalResponse = await res.json()

      if (!data.ok) {
        alert(data.stderr || "Failed to create portal")
        return
      }

      setBuildOutput(`CREATED PORTAL — ${portalName}\n\nAuto-building...`)
      setNewPortal("")

      await loadPortals()
      setSelectedPortal(portalName)
      await loadFiles(portalName)

      await runBuild(portalName)
    } catch (err: any) {
      alert(err.message || "Failed to create portal")
    } finally {
      setCreatingPortal(false)
    }
  }

  async function buildPortal(portal: string) {
    await runBuild(portal)
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

      if (selectedPortal === portal) {
        setPortalFiles([])
        setSelectedFile(null)
        setFileContent("")
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete portal")
    } finally {
      setDeletingPortal(null)
    }
  }

  function openPortal(portal: string) {
    window.open(siteUrlForPortal(portal), "_blank", "noopener,noreferrer")
  }

  function selectPortal(portal: string) {
    setSelectedPortal(portal)
    void loadFiles(portal)
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
    setPortalFiles([])
    setSelectedFile(null)
    setFileContent("")
    setBuildOutput("")
    setSelectedPortal(null)
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
    <div style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1>Sheriff Cloud</h1>

      <div style={{ marginBottom: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button onClick={signOut}>Logout</button>
        <button onClick={loadPortals}>
          {loadingPortals ? "Refreshing..." : "Refresh Portals"}
        </button>
        {selectedPortal && (
          <button onClick={() => openPortal(selectedPortal)}>Open Selected Site</button>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "420px minmax(0, 1fr)",
          gap: 20,
          alignItems: "start",
        }}
      >
        <div>
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
              {portals.map((portal) => {
                const isSelected = selectedPortal === portal
                const isBuilding = buildingPortal === portal
                const isDeleting = deletingPortal === portal

                return (
                  <div
                    key={portal}
                    style={{
                      border: isSelected ? "2px solid #4b8cff" : "1px solid #ccc",
                      borderRadius: 8,
                      padding: 12,
                      display: "grid",
                      gap: 10,
                      background: isSelected ? "#f7faff" : "#fff",
                    }}
                  >
                    <div
                      style={{ cursor: "pointer" }}
                      onClick={() => selectPortal(portal)}
                    >
                      <strong>{portal}</strong>
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        onClick={() => buildPortal(portal)}
                        disabled={isBuilding || isDeleting}
                      >
                        {isBuilding ? "Building..." : "Build"}
                      </button>

                      <button
                        onClick={() => openPortal(portal)}
                        disabled={isBuilding || isDeleting}
                      >
                        Open Site
                      </button>

                      <button
                        onClick={() => deletePortal(portal)}
                        disabled={isBuilding || isDeleting}
                      >
                        {isDeleting ? "Deleting..." : "Delete"}
                      </button>
                    </div>

                    <div style={{ fontSize: 13, opacity: 0.8 }}>
                      {isBuilding
                        ? "Status: Building..."
                        : isDeleting
                          ? "Status: Deleting..."
                          : "Status: Ready"}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <h2>Edit Files</h2>

          {!selectedPortal ? (
            <p>Select a portal to view editable files.</p>
          ) : loadingFiles ? (
            <p>Loading files...</p>
          ) : portalFiles.length === 0 ? (
            <p>No editable files found for this portal.</p>
          ) : (
            <div
              style={{
                border: "1px solid #ccc",
                borderRadius: 8,
                padding: 12,
                background: "#fff",
                marginBottom: 24,
                maxHeight: 320,
                overflowY: "auto",
              }}
            >
              <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 10 }}>
                {selectedPortal}
              </div>

              <div style={{ display: "grid", gap: 8 }}>
                {portalFiles.map((file) => {
                  const isSelected = selectedFile === file

                  return (
                    <button
                      key={file}
                      type="button"
                      onClick={() => selectedPortal && loadFile(selectedPortal, file)}
                      style={{
                        padding: "8px 10px",
                        border: isSelected ? "2px solid #4b8cff" : "1px solid #e3e3e3",
                        borderRadius: 6,
                        fontFamily: "monospace",
                        fontSize: 13,
                        background: isSelected ? "#eef5ff" : "#fafafa",
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                    >
                      {file}
                    </button>
                  )
                })}
              </div>
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
              minHeight: 280,
            }}
          >
            {buildOutput || "No build run yet."}
          </pre>
        </div>

        <div>
          <h2>File Editor</h2>

          {!selectedPortal ? (
            <div
              style={{
                border: "1px solid #ccc",
                borderRadius: 8,
                padding: 20,
                minHeight: 320,
                background: "#fff",
              }}
            >
              Select a portal to load files.
            </div>
          ) : !selectedFile ? (
            <div
              style={{
                border: "1px solid #ccc",
                borderRadius: 8,
                padding: 20,
                minHeight: 320,
                background: "#fff",
              }}
            >
              Select a file to load it into the editor.
            </div>
          ) : (
            <div
              style={{
                border: "1px solid #ccc",
                borderRadius: 8,
                overflow: "hidden",
                background: "#fff",
              }}
            >
              <div
                style={{
                  padding: 12,
                  borderBottom: "1px solid #ddd",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <strong>{selectedFile}</strong>
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ fontSize: 13, opacity: 0.7 }}>
                    {loadingFileContent ? "Loading..." : savingFile ? "Saving..." : "Loaded"}
                  </div>

                  <button
                    type="button"
                    onClick={saveFile}
                    disabled={savingFile || loadingFileContent}
                  >
                    {savingFile ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>

              <textarea
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
                spellCheck={false}
                style={{
                  width: "100%",
                  minHeight: 720,
                  border: "0",
                  outline: "none",
                  resize: "vertical",
                  padding: 16,
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
                  fontSize: 14,
                  lineHeight: 1.5,
                  boxSizing: "border-box",
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}