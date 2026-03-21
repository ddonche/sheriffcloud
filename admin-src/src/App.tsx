import { useEffect, useMemo, useState, type CSSProperties } from "react"
import { getSupabase } from "./supabase"
import CodeMirror, { EditorView } from "@uiw/react-codemirror"
import { markdown } from "@codemirror/lang-markdown"
import { languages } from "@codemirror/language-data"
import { githubLight } from "@uiw/codemirror-theme-github"

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

type DeleteFileResponse = {
  ok: boolean
  path?: string
  stderr?: string
}

type BuildResponse = {
  ok: boolean
  code: number | null
  stdout: string
  stderr: string
}

type NavSection = "files" | "domains" | "settings"

type FileTreeNode = {
  name: string
  path: string
  type: "file" | "folder"
  children?: FileTreeNode[]
}

const API_BASE = `${window.location.origin}/api`

const ICON_PATHS = {
  folder:
    "M128 512L512 512C547.3 512 576 483.3 576 448L576 208C576 172.7 547.3 144 512 144L362.7 144C355.8 144 349 141.8 343.5 137.6L305.1 108.8C294 100.5 280.5 96 266.7 96L128 96C92.7 96 64 124.7 64 160L64 448C64 483.3 92.7 512 128 512z",
  file:
    "M192 64C156.7 64 128 92.7 128 128L128 512C128 547.3 156.7 576 192 576L448 576C483.3 576 512 547.3 512 512L512 234.5C512 217.5 505.3 201.2 493.3 189.2L386.7 82.7C374.7 70.7 358.5 64 341.5 64L192 64zM453.5 240L360 240C346.7 240 336 229.3 336 216L336 122.5L453.5 240z",
  domains:
    "M415.9 344L225 344C227.9 408.5 242.2 467.9 262.5 511.4C273.9 535.9 286.2 553.2 297.6 563.8C308.8 574.3 316.5 576 320.5 576C324.5 576 332.2 574.3 343.4 563.8C354.8 553.2 367.1 535.8 378.5 511.4C398.8 467.9 413.1 408.5 416 344zM224.9 296L415.8 296C413 231.5 398.7 172.1 378.4 128.6C367 104.2 354.7 86.8 343.3 76.2C332.1 65.7 324.4 64 320.4 64C316.4 64 308.7 65.7 297.5 76.2C286.1 86.8 273.8 104.2 262.4 128.6C242.1 172.1 227.8 231.5 224.9 296zM176.9 296C180.4 210.4 202.5 130.9 234.8 78.7C142.7 111.3 74.9 195.2 65.5 296L176.9 296zM65.5 344C74.9 444.8 142.7 528.7 234.8 561.3C202.5 509.1 180.4 429.6 176.9 344L65.5 344zM463.9 344C460.4 429.6 438.3 509.1 406 561.3C498.1 528.6 565.9 444.8 575.3 344L463.9 344zM575.3 296C565.9 195.2 498.1 111.3 406 78.7C438.3 130.9 460.4 210.4 463.9 296L575.3 296z",
  settings:
    "M259.1 73.5C262.1 58.7 275.2 48 290.4 48L350.2 48C365.4 48 378.5 58.7 381.5 73.5L396 143.5C410.1 149.5 423.3 157.2 435.3 166.3L503.1 143.8C517.5 139 533.3 145 540.9 158.2L570.8 210C578.4 223.2 575.7 239.8 564.3 249.9L511 297.3C511.9 304.7 512.3 312.3 512.3 320C512.3 327.7 511.8 335.3 511 342.7L564.4 390.2C575.8 400.3 578.4 417 570.9 430.1L541 481.9C533.4 495 517.6 501.1 503.2 496.3L435.4 473.8C423.3 482.9 410.1 490.5 396.1 496.6L381.7 566.5C378.6 581.4 365.5 592 350.4 592L290.6 592C275.4 592 262.3 581.3 259.3 566.5L244.9 496.6C230.8 490.6 217.7 482.9 205.6 473.8L137.5 496.3C123.1 501.1 107.3 495.1 99.7 481.9L69.8 430.1C62.2 416.9 64.9 400.3 76.3 390.2L129.7 342.7C128.8 335.3 128.4 327.7 128.4 320C128.4 312.3 128.9 304.7 129.7 297.3L76.3 249.8C64.9 239.7 62.3 223 69.8 209.9L99.7 158.1C107.3 144.9 123.1 138.9 137.5 143.7L205.3 166.2C217.4 157.1 230.6 149.5 244.6 143.4L259.1 73.5zM320.3 400C364.5 399.8 400.2 363.9 400 319.7C399.8 275.5 363.9 239.8 319.7 240C275.5 240.2 239.8 276.1 240 320.3C240.2 364.5 276.1 400.2 320.3 400z",
  logs:
    "M160 96C124.7 96 96 124.7 96 160L96 480C96 515.3 124.7 544 160 544L480 544C515.3 544 544 515.3 544 480L544 160C544 124.7 515.3 96 480 96L160 96zM216 288C229.3 288 240 298.7 240 312L240 424C240 437.3 229.3 448 216 448C202.7 448 192 437.3 192 424L192 312C192 298.7 202.7 288 216 288zM400 376C400 362.7 410.7 352 424 352C437.3 352 448 362.7 448 376L448 424C448 437.3 437.3 448 424 448C410.7 448 400 437.3 400 424L400 376zM320 192C333.3 192 344 202.7 344 216L344 424C344 437.3 333.3 448 320 448C306.7 448 296 437.3 296 424L296 216C296 202.7 306.7 192 320 192z",
} as const

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

function siteFaviconUrl(site: string) {
  return `${siteUrlForPortal(site).replace(/\/$/, "")}/public/favicon.ico`
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

function buildFileTree(paths: string[]): FileTreeNode[] {
  const root: FileTreeNode = {
    name: "root",
    path: "",
    type: "folder",
    children: [],
  }

  for (const fullPath of paths) {
    const parts = fullPath.split("/").filter(Boolean)
    let current = root
    let runningPath = ""

    for (let i = 0; i < parts.length; i += 1) {
      const part = parts[i]
      runningPath = runningPath ? `${runningPath}/${part}` : part
      const isFile = i === parts.length - 1

      if (!current.children) current.children = []

      let found = current.children.find((child) => child.name === part)
      if (!found) {
        found = {
          name: part,
          path: runningPath,
          type: isFile ? "file" : "folder",
          children: isFile ? undefined : [],
        }
        current.children.push(found)
      }

      current = found
    }
  }

  function sortNodes(nodes: FileTreeNode[]): FileTreeNode[] {
    return [...nodes]
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === "folder" ? -1 : 1
        return a.name.localeCompare(b.name)
      })
      .map((node) => ({
        ...node,
        children: node.children ? sortNodes(node.children) : undefined,
      }))
  }

  return sortNodes(root.children ?? [])
}

function pathDepth(path: string) {
  return path.split("/").filter(Boolean).length - 1
}

function siteInitial(site: string) {
  return site.charAt(0).toUpperCase()
}

function SvgIcon({
  path,
  size = 16,
  color = "currentColor",
}: {
  path: string
  size?: number
  color?: string
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 640 640"
      width={size}
      height={size}
      aria-hidden="true"
      style={{ display: "block", flexShrink: 0 }}
    >
      <path d={path} fill={color} />
    </svg>
  )
}

function SheriffLogo({ size = 40 }: { size?: number }) {
  const [failed, setFailed] = useState(false)

  if (!failed) {
    return (
      <img
        src="./sheriff-logo.png"
        alt="Sheriff Cloud"
        width={size}
        height={size}
        style={{ ...styles.logoImage, width: size, height: size }}
        onError={() => setFailed(true)}
      />
    )
  }

  return <div style={{ ...styles.logoBadge, width: size, height: size }}>SC</div>
}

function SiteBadge({ site, size = 22 }: { site: string; size?: number }) {
  const [failed, setFailed] = useState(false)

  if (!failed) {
    return (
      <img
        src={siteFaviconUrl(site)}
        alt={`${site} favicon`}
        width={size}
        height={size}
        style={{ ...styles.siteFavicon, width: size, height: size }}
        onError={() => setFailed(true)}
      />
    )
  }

  return <span style={{ ...styles.siteBadge, width: size, height: size }}>{siteInitial(site)}</span>
}

function LoginScreen({
  email,
  password,
  setEmail,
  setPassword,
  signIn,
}: {
  email: string
  password: string
  setEmail: (value: string) => void
  setPassword: (value: string) => void
  signIn: () => Promise<void>
}) {
  return (
    <div style={styles.loginShell}>
      <div style={styles.loginCard}>
        <div style={styles.brandRow}>
          <SheriffLogo size={44} />
          <div>
            <h1 style={styles.loginTitle}>Sheriff Cloud</h1>
            <p style={styles.loginSubtitle}>Sign in to manage your sites.</p>
          </div>
        </div>

        <div style={styles.formStack}>
          <label style={styles.label}>Email</label>
          <input
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />

          <label style={styles.label}>Password</label>
          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />

          <button onClick={signIn} style={styles.primaryButton}>
            Login
          </button>
        </div>
      </div>
    </div>
  )
}

function FileTree({
  nodes,
  selectedFile,
  expandedFolders,
  onToggleFolder,
  onOpenFile,
}: {
  nodes: FileTreeNode[]
  selectedFile: string | null
  expandedFolders: Set<string>
  onToggleFolder: (path: string) => void
  onOpenFile: (path: string) => void
}) {
  return (
    <div>
      {nodes.map((node) => {
        const depth = pathDepth(node.path)
        const isOpen = expandedFolders.has(node.path)
        const isSelected = selectedFile === node.path

        if (node.type === "folder") {
          return (
            <div key={node.path}>
              <button
                type="button"
                onClick={() => onToggleFolder(node.path)}
                style={{
                  ...styles.fileRow,
                  paddingLeft: 16 + depth * 18,
                  background: isOpen ? "#f3f4f6" : "#fff",
                }}
              >
                <span style={styles.fileRowLeft}>
                  <span style={styles.fileIcon}>{isOpen ? "▾" : "▸"}</span>
                  <span style={styles.fileIcon}><SvgIcon path={ICON_PATHS.folder} size={14} /></span>
                  <span>{node.name}</span>
                </span>
              </button>

              {isOpen && node.children && (
                <FileTree
                  nodes={node.children}
                  selectedFile={selectedFile}
                  expandedFolders={expandedFolders}
                  onToggleFolder={onToggleFolder}
                  onOpenFile={onOpenFile}
                />
              )}
            </div>
          )
        }

        return (
          <button
            key={node.path}
            type="button"
            onClick={() => onOpenFile(node.path)}
            style={{
              ...styles.fileRow,
              paddingLeft: 16 + depth * 18,
              background: isSelected ? "#3296ab" : "#fff",
              color: isSelected ? "#fff" : "#111827",
            }}
          >
            <span style={styles.fileRowLeft}>
              <span style={styles.fileIcon}>•</span>
              <span style={styles.fileIcon}><SvgIcon path={ICON_PATHS.file} size={14} color={isSelected ? "#fff" : "currentColor"} /></span>
              <span>{node.name}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

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
  const [deleteConfirmName, setDeleteConfirmName] = useState("")

  const [selectedPortal, setSelectedPortal] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [logOpen, setLogOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<NavSection>("files")
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [fileBrowserWidth, setFileBrowserWidth] = useState(320)
  const [isResizingFiles, setIsResizingFiles] = useState(false)
  const [showDeleteSite, setShowDeleteSite] = useState(false)

  useEffect(() => {
    // ensure admin favicon is set
    const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null
    if (link) link.href = "./favicon.ico"

    const client = getSupabase()
    if (!client) return

    setSupabase(client)

    client.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const { data: listener } = client.auth.onAuthStateChange((_e, nextSession) => {
      setSession(nextSession)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return
    void loadPortals()
  }, [session])

  useEffect(() => {
    if (!isResizingFiles) return

    function onMouseMove(e: MouseEvent) {
      const appMain = document.getElementById("sc-files-layout")
      if (!appMain) return

      const rect = appMain.getBoundingClientRect()
      const next = Math.max(220, Math.min(640, e.clientX - rect.left))
      setFileBrowserWidth(next)
    }

    function onMouseUp() {
      setIsResizingFiles(false)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }

    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"

    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)

    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
  }, [isResizingFiles])

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

  useEffect(() => {
    if (!selectedPortal) return

    if (!selectedFile && portalFiles.length > 0) {
      const next = pickDefaultFile(portalFiles)
      if (next) {
        void loadFile(selectedPortal, next)
      }
      return
    }

    if (selectedFile && !portalFiles.includes(selectedFile)) {
      const next = pickDefaultFile(portalFiles)

      if (next) {
        void loadFile(selectedPortal, next)
      } else {
        setSelectedFile(null)
        setFileContent("")
      }
    }
  }, [portalFiles, selectedFile, selectedPortal])

  const fileTree = useMemo(() => buildFileTree(portalFiles), [portalFiles])

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
      setPortalFiles([...files])
      setExpandedFolders(new Set())

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
      setActiveSection("files")
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
      alert("Enter a site name")
      return
    }

    setCreatingPortal(true)
    setBuildOutput("")

    try {
      const res = await fetch(`${API_BASE}/create_portal?${encodeURIComponent(portalName)}`)
      const data: CreatePortalResponse = await res.json()

      if (!data.ok) {
        alert(data.stderr || "Failed to create site")
        return
      }

      setBuildOutput(`CREATED SITE — ${portalName}\n\nAuto-building...`)
      setNewPortal("")

      await loadPortals()
      setSelectedPortal(portalName)
      await loadFiles(portalName)
      await runBuild(portalName)
    } catch (err: any) {
      alert(err.message || "Failed to create site")
    } finally {
      setCreatingPortal(false)
    }
  }

  async function buildPortal(portal: string) {
    await runBuild(portal)
  }

  async function deletePortal(portal: string) {
    const confirmed = window.confirm(
      `Are you sure you want to delete the site "${portal}"? This will remove its source files.`
    )

    if (!confirmed) return

    setDeletingPortal(portal)

    try {
      const res = await fetch(`${API_BASE}/delete_portal?${encodeURIComponent(portal)}`)
      const data: DeletePortalResponse = await res.json()

      if (!data.ok) {
        alert(data.stderr || "Failed to delete site")
        return
      }

      await loadPortals()
      setShowDeleteSite(false)
      setDeleteConfirmName("")
      setBuildOutput(`DELETED SITE — ${portal}`)

      if (selectedPortal === portal) {
        setPortalFiles([])
        setSelectedFile(null)
        setFileContent("")
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete site")
    } finally {
      setDeletingPortal(null)
    }
  }

  function openPortal(portal: string) {
    window.open(siteUrlForPortal(portal), "_blank", "noopener,noreferrer")
  }

  function selectPortal(portal: string) {
    setSelectedPortal(portal)
    setActiveSection("files")
    void loadFiles(portal)
  }

  function toggleFolder(path: string) {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  function handleNewPage() {
    if (!selectedPortal) {
      alert("Select a site first")
      return
    }

    const path = window.prompt("New page path", "content/new-page.md")?.trim()
    if (!path) return

    setSelectedFile(path)
    setFileContent("---\ntitle: New Page\nlayout: docs\n---\n\n# New Page\n")

    setPortalFiles((prev) => {
      if (prev.includes(path)) return prev
      return [...prev, path].sort((a, b) => a.localeCompare(b))
    })

    const parts = path.split("/")
    let running = ""
    const folders = new Set(expandedFolders)
    for (let i = 0; i < parts.length - 1; i += 1) {
      running = running ? `${running}/${parts[i]}` : parts[i]
      folders.add(running)
    }
    setExpandedFolders(folders)
  }

  async function handleDeleteFile() {
    if (!selectedPortal || !selectedFile) {
      alert("No file selected")
      return
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete the file "${selectedFile}"?`
    )

    if (!confirmed) return

    try {
      const deletedFile = selectedFile

      const res = await fetch(`${API_BASE}/delete_file?${selectedPortal}&${selectedFile}`)
      const raw = await res.text()

      let data: DeleteFileResponse
      try {
        data = JSON.parse(raw)
      } catch {
        alert(raw)
        return
      }

      if (!data.ok) {
        alert(data.stderr || "Failed to delete file")
        return
      }

      // remove file from list (THIS is what actually updates UI)
      setPortalFiles((prev) => prev.filter((f) => f !== deletedFile))

      // clear selection if needed
      if (selectedFile === deletedFile) {
        setSelectedFile(null)
        setFileContent("")
      }

      // log like portal delete
      setBuildOutput(`DELETED FILE — ${deletedFile}`)

    } catch (err: any) {
      alert(err.message || "Failed to delete file")
    }
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
      <div style={styles.missingShell}>
        <div style={styles.missingCard}>
          <h1 style={styles.missingTitle}>Sheriff Cloud</h1>
          <p>Supabase configuration missing.</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <LoginScreen
        email={email}
        password={password}
        setEmail={setEmail}
        setPassword={setPassword}
        signIn={signIn}
      />
    )
  }

  const currentSiteUrl = selectedPortal ? siteUrlForPortal(selectedPortal) : ""
  const buildStatusText = !buildOutput
    ? "No build yet"
    : buildOutput.includes("BUILD FAILED")
      ? "Failed"
      : "Success"

  return (
    <div style={styles.appShell}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.headerLeft}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <SheriffLogo size={40} />
              <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "0.14em" }}>
                SHERIFF CLOUD
              </span>
            </div>

            <nav style={styles.mainNav}>
              <button style={styles.topNavButtonActive}>Home</button>
              <button style={styles.topNavButton}>Features</button>
              <button style={styles.topNavButton}>Docs</button>
              <button style={styles.topNavButton}>Forum</button>
            </nav>
          </div>

          <div style={styles.headerRight}>
            <button style={styles.upgradeButton}>Upgrade</button>

            <div style={styles.newSiteRow}>
              <input
                placeholder="new site"
                value={newPortal}
                onChange={(e) => setNewPortal(cleanPortalName(e.target.value))}
                style={styles.headerInput}
              />
              <button
                onClick={createPortal}
                disabled={creatingPortal || !newPortal.trim()}
                style={{
                  ...styles.outlineButton,
                  opacity: creatingPortal || !newPortal.trim() ? 0.6 : 1,
                  cursor: creatingPortal || !newPortal.trim() ? "not-allowed" : "pointer",
                }}
              >
                {creatingPortal ? "Creating..." : "New Site"}
              </button>
            </div>

            <button style={styles.iconButton} title="Settings">
              <SvgIcon path={ICON_PATHS.settings} size={16} />
            </button>
            <button onClick={signOut} style={styles.outlineButton}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <div style={styles.workspace}>
        <aside
          style={{
            ...styles.sidebar,
            width: sidebarOpen ? 272 : 72,
          }}
        >
          <div style={styles.sidebarTopRow}>
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              style={styles.outlineButtonSmall}
              title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {sidebarOpen ? "←" : "→"}
            </button>
          </div>

          <div style={styles.sidebarSection}>
            {sidebarOpen && <div style={styles.sidebarLabel}>Sites</div>}
            <div style={styles.sidebarList}>
              {portals.map((portal) => {
                const isSelected = selectedPortal === portal
                const isBuilding = buildingPortal === portal
                const isDeleting = deletingPortal === portal

                return (
                  <button
                    key={portal}
                    onClick={() => selectPortal(portal)}
                    style={{
                      ...styles.sidebarItem,
                      ...(isSelected ? styles.sidebarItemActive : null),
                    }}
                    title={portal}
                    disabled={isDeleting}
                  >
                    <SiteBadge site={portal} />
                    {sidebarOpen && (
                      <span style={styles.sidebarItemTextWrap}>
                        <span>{portal}</span>
                        <span style={styles.sidebarItemMeta}>
                          {isDeleting ? "Deleting..." : isBuilding ? "Building..." : "Ready"}
                        </span>
                      </span>
                    )}
                  </button>
                )
              })}

              {loadingPortals && sidebarOpen && <div style={styles.smallMuted}>Refreshing sites...</div>}
            </div>
          </div>

          <div style={styles.sidebarDivider} />

          <div style={styles.sidebarSection}>
            {sidebarOpen && <div style={styles.sidebarLabel}>Navigation</div>}
            <div style={styles.sidebarList}>
              {[
                [<SvgIcon path={ICON_PATHS.folder} size={16} />, "Files", "files"],
                [<SvgIcon path={ICON_PATHS.domains} size={16} />, "Domains", "domains"],
                [<SvgIcon path={ICON_PATHS.settings} size={16} />, "Settings", "settings"],
              ].map(([icon, label, key]) => {
                const active = activeSection === key
                return (
                  <button
                    key={key as string}
                    onClick={() => setActiveSection(key as NavSection)}
                    style={{
                      ...styles.sidebarItem,
                      ...(active ? styles.sidebarNavActive : null),
                    }}
                    title={label as string}
                  >
                    <span style={styles.navIcon}>{icon}</span>
                    {sidebarOpen && <span>{label}</span>}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={styles.sidebarDivider} />

          <div style={styles.sidebarSection}>
            {sidebarOpen && <div style={styles.sidebarLabel}>Logs</div>}
            <div style={styles.sidebarList}>
              <button
                onClick={() => setLogOpen((prev) => !prev)}
                style={styles.sidebarItem}
                title="Logs"
              >
                <span style={styles.navIcon}><SvgIcon path={ICON_PATHS.logs} size={16} /></span>
                {sidebarOpen && <span>Logs</span>}
              </button>

              {sidebarOpen && (
                <div style={styles.logPanel}>
                  {!logOpen ? (
                    <div style={styles.logStatusOnly}>Status: {buildStatusText}</div>
                  ) : (
                    <pre style={styles.logPre}>{buildOutput || "No build run yet."}</pre>
                  )}
                </div>
              )}
            </div>
          </div>
        </aside>

        <main style={styles.main}>
          <div style={styles.siteActionBar}>
            <div>
              <div style={styles.siteName}>{selectedPortal || "No site selected"}</div>
              <div style={styles.siteUrl}>{currentSiteUrl || "Select a site to begin"}</div>
            </div>

            <div style={styles.siteActionButtons}>
              <button
                onClick={() => selectedPortal && openPortal(selectedPortal)}
                style={styles.outlineButton}
                disabled={!selectedPortal}
              >
                Open Site
              </button>
              <button
                onClick={() => selectedPortal && buildPortal(selectedPortal)}
                style={styles.primaryButton}
                disabled={!selectedPortal || buildingPortal === selectedPortal}
              >
                {buildingPortal === selectedPortal ? "Building..." : "Build Site"}
              </button>
              {!showDeleteSite ? (
                <button
                  onClick={() => setShowDeleteSite(true)}
                  style={styles.iconButton}
                  title="Delete site"
                  disabled={!selectedPortal || deletingPortal === selectedPortal}
                >
                  <SvgIcon
                    path="M232.7 69.9L224 96L128 96C110.3 96 96 110.3 96 128C96 145.7 110.3 160 128 160L512 160C529.7 160 544 145.7 544 128C544 110.3 529.7 96 512 96L416 96L407.3 69.9C402.9 56.8 390.7 48 376.9 48L263.1 48C249.3 48 237.1 56.8 232.7 69.9zM512 208L128 208L149.1 531.1C150.7 556.4 171.7 576 197 576L443 576C468.3 576 489.3 556.4 490.9 531.1L512 208z"
                    size={16}
                  />
                </button>
              ) : (
                <div style={styles.deleteSiteReveal}>
                  <div style={styles.deleteSiteWarning}>
                    This will permanently delete the entire site.
                  </div>

                  <div style={styles.deleteSiteWarning}>
                    Type <strong>{selectedPortal}</strong> to confirm deletion.
                  </div>

                  <input
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="Enter site name"
                    style={styles.input}
                  />

                  <div style={styles.deleteSiteActions}>
                    <button
                      onClick={() => {
                        setShowDeleteSite(false)
                        setDeleteConfirmName("")
                      }}
                      style={styles.outlineButton}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => selectedPortal && deletePortal(selectedPortal)}
                      style={styles.deleteButton}
                      disabled={
                        !selectedPortal ||
                        deletingPortal === selectedPortal ||
                        deleteConfirmName !== selectedPortal
                      }
                    >
                      {deletingPortal === selectedPortal ? "Deleting..." : "Delete Site"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {activeSection === "files" && (
            <div
              id="sc-files-layout"
              style={{
                ...styles.editorLayout,
                gridTemplateColumns: `${fileBrowserWidth}px 8px minmax(0, 1fr)`,
              }}
            >
              <section style={styles.fileBrowserPane}>
                <div style={{ ...styles.paneHeader, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span>Files</span>
                  {portalFiles.length > 0 && (() => {
                    const allFolderPaths = new Set<string>()
                    for (const f of portalFiles) {
                      const parts = f.split("/")
                      let running = ""
                      for (let i = 0; i < parts.length - 1; i += 1) {
                        running = running ? `${running}/${parts[i]}` : parts[i]
                        allFolderPaths.add(running)
                      }
                    }
                    const allOpen = allFolderPaths.size > 0 && [...allFolderPaths].every(f => expandedFolders.has(f))
                    return (
                      <button
                        onClick={() => setExpandedFolders(allOpen ? new Set() : allFolderPaths)}
                        style={styles.toolbarButton}
                        title={allOpen ? "Collapse all" : "Expand all"}
                      >
                        {allOpen ? "↕ Collapse" : "↕ Expand"}
                      </button>
                    )
                  })()}
                </div>

                {loadingFiles ? (
                  <div style={styles.emptyPane}>Loading files...</div>
                ) : !selectedPortal ? (
                  <div style={styles.emptyPane}>Select a site to view files.</div>
                ) : portalFiles.length === 0 ? (
                  <div style={styles.emptyPane}>No editable files found for this site.</div>
                ) : (
                  <div style={styles.fileTreeWrap}>
                    <FileTree
                      nodes={fileTree}
                      selectedFile={selectedFile}
                      expandedFolders={expandedFolders}
                      onToggleFolder={toggleFolder}
                      onOpenFile={(path) => selectedPortal && loadFile(selectedPortal, path)}
                    />
                  </div>
                )}
              </section>

              <div
                style={{
                  ...styles.resizeHandle,
                  ...(isResizingFiles ? styles.resizeHandleActive : null),
                }}
                onMouseDown={(e) => {
                  e.preventDefault()
                  setIsResizingFiles(true)
                }}
                title="Drag to resize file browser"
              />

              <section style={styles.editorPane}>
                <div style={styles.editorHeader}>
                  <div>
                    <div style={styles.editorTitle}>{selectedFile || "No file selected"}</div>
                    <div style={styles.editorMeta}>
                      {loadingFileContent ? "Loading..." : savingFile ? "Saving..." : selectedFile ? "Ready" : "Choose a file from the browser"}
                    </div>
                  </div>

                  <div style={styles.editorActions}>
                    <button
                      onClick={saveFile}
                      disabled={savingFile || loadingFileContent || !selectedFile}
                      style={styles.outlineButton}
                    >
                      {savingFile ? "Saving..." : "Save"}
                    </button>
                    <button onClick={handleNewPage} style={styles.outlineButton}>
                      New Page
                    </button>
                    <button
                      onClick={handleDeleteFile}
                      disabled={!selectedFile}
                      style={styles.deleteButtonLight}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div style={styles.markdownToolbar}>
                  <button style={styles.toolbarButton}>B</button>
                  <button style={styles.toolbarButton}>I</button>
                  <button style={styles.toolbarButton}>#</button>
                  <button style={styles.toolbarButton}>Link</button>
                </div>

                <CodeMirror
                  value={fileContent}
                  onChange={(val) => setFileContent(val)}
                  extensions={[
                    markdown({ codeLanguages: languages }),
                    githubLight,
                    EditorView.lineWrapping,
                  ]}
                  basicSetup={{
                    lineNumbers: true,
                    highlightActiveLine: true,
                    highlightActiveLineGutter: true,
                    foldGutter: false,
                    dropCursor: false,
                    allowMultipleSelections: false,
                    indentOnInput: true,
                    syntaxHighlighting: true,
                    bracketMatching: false,
                    closeBrackets: false,
                    autocompletion: false,
                    crosshairCursor: false,
                    highlightSelectionMatches: false,
                  }}
                  placeholder="Select a file to start editing"
                  editable={!!selectedFile && !loadingFileContent}
                />
              </section>
            </div>
          )}

          {activeSection === "domains" && (
            <div style={styles.contentCard}>
              <h2 style={styles.sectionTitle}>Domains</h2>
              <div style={styles.contentStack}>
                <div style={styles.infoCard}>
                  <div style={styles.infoLabel}>Default domain</div>
                  <div style={styles.infoValue}>{currentSiteUrl || "No site selected"}</div>
                </div>

                <div style={styles.infoCard}>
                  <div style={styles.infoLabel}>Custom domain</div>
                  <div style={styles.infoValue}>Premium feature</div>
                  <p style={styles.paragraph}>
                    Add your domain here, then show dead-simple DNS instructions.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSection === "settings" && (
            <div style={styles.contentCard}>
              <h2 style={styles.sectionTitle}>Site Settings</h2>
              <div style={styles.contentStack}>
                <div style={styles.infoCard}>
                  <div style={styles.infoLabel}>Current site</div>
                  <div style={styles.infoValue}>{selectedPortal || "None selected"}</div>
                </div>
                <div style={styles.infoCard}>
                  <div style={styles.infoLabel}>Plan</div>
                  <div style={styles.infoValue}>Free</div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

const styles: Record<string, CSSProperties> = {
  appShell: {
    minHeight: "100vh",
    background: "#fafafa",
    color: "#18181b",
    fontFamily: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
  },
  header: {
    borderBottom: "1px solid #d4d4d8",
    background: "#fff",
  },
  headerInner: {
    maxWidth: 1320,
    margin: "0 auto",
    padding: "16px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 24,
    flexWrap: "wrap",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  logoBadge: {
    width: 40,
    height: 40,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#3296ab",
    color: "#fff",
    fontSize: 14,
    fontWeight: 700,
    borderRadius: 8,
    overflow: "hidden",
  },
  logoImage: {
    display: "block",
    objectFit: "contain",
    borderRadius: 0,
    overflow: "hidden",
    background: "transparent",
  },
  mainNav: {
    display: "flex",
    gap: 20,
    alignItems: "center",
    flexWrap: "wrap",
  },
  topNavButton: {
    border: 0,
    background: "transparent",
    fontSize: 14,
    color: "#52525b",
    cursor: "pointer",
    padding: 0,
  },
  topNavButtonActive: {
    border: 0,
    background: "transparent",
    fontSize: 14,
    color: "#3296ab",
    fontWeight: 700,
    cursor: "pointer",
    padding: 0,
  },
  upgradeButton: {
    border: "1px solid #3296ab",
    background: "transparent",
    color: "#3296ab",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    borderRadius: 999,
    padding: "6px 14px",
    letterSpacing: "0.04em",
  },
  headerInput: {
    border: "1px solid #d4d4d8",
    background: "#fff",
    padding: "10px 12px",
    fontSize: 14,
    minWidth: 140,
    borderRadius: 4,
  },
  newSiteRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  workspace: {
    maxWidth: 1320,
    margin: "0 auto",
    padding: 24,
    display: "flex",
    gap: 0,
  },
  sidebar: {
    borderRight: "1px solid #d4d4d8",
    background: "#f1f3f5",
    transition: "width 160ms ease",
    overflow: "hidden",
    flexShrink: 0,
  },
  sidebarTopRow: {
    padding: 12,
  },
  sidebarSection: {
    padding: "0 8px 8px",
  },
  sidebarLabel: {
    padding: "0 8px 8px",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#71717a",
  },
  sidebarList: {
    display: "grid",
    gap: 8,
  },
  sidebarDivider: {
    borderTop: "1px solid #d4d4d8",
    margin: "8px 12px 16px",
  },
  sidebarItem: {
    width: "100%",
    border: "1px solid transparent",
    background: "transparent",
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 10px",
    fontSize: 14,
    cursor: "pointer",
    textAlign: "left",
    color: "#111827",
  },
  sidebarItemActive: {
    background: "#3296ab",
    color: "#fff",
  },
  sidebarNavActive: {
    borderLeft: "4px solid #3296ab",
    background: "#fff",
    fontWeight: 700,
  },
  sidebarItemTextWrap: {
    display: "flex",
    flexDirection: "column",
    lineHeight: 1.2,
  },
  sidebarItemMeta: {
    fontSize: 11,
    opacity: 0.75,
  },
  siteBadge: {
    width: 22,
    height: 22,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    background: "#e5e7eb",
    color: "#111827",
    fontSize: 12,
    fontWeight: 700,
    flexShrink: 0,
    overflow: "hidden",
  },
  siteFavicon: {
    display: "block",
    borderRadius: 999,
    objectFit: "cover",
    flexShrink: 0,
    background: "transparent",
    border: "0",
  },
  navIcon: {
    width: 22,
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  smallMuted: {
    fontSize: 12,
    color: "#71717a",
    padding: "0 8px",
  },
  logPanel: {
    border: "1px solid #d4d4d8",
    background: "#fff",
    borderRadius: 4,
    overflow: "hidden",
  },
  logStatusOnly: {
    padding: "10px 12px",
    fontSize: 13,
    color: "#047857",
  },
  logPre: {
    margin: 0,
    padding: 12,
    background: "#09090b",
    color: "#34d399",
    fontSize: 12,
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
    overflowX: "auto",
  },
  main: {
    minWidth: 0,
    flex: 1,
    background: "#fff",
  },
  siteActionBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
    padding: "16px 24px",
    borderBottom: "1px solid #d4d4d8",
    background: "#f1f3f5",
  },
  siteName: {
    fontSize: 14,
    fontWeight: 700,
    color: "#111827",
  },
  siteUrl: {
    fontSize: 12,
    color: "#71717a",
    marginTop: 2,
  },
  siteActionButtons: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
  },
  deleteSiteReveal: {
    display: "grid",
    gap: 8,
    padding: 10,
    border: "1px solid #fecaca",
    background: "#fff5f5",
  },
  deleteSiteWarning: {
    fontSize: 12,
    color: "#b91c1c",
  },
  deleteSiteActions: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  editorLayout: {
    display: "grid",
    minHeight: "calc(100vh - 180px)",
  },
  fileBrowserPane: {
    minWidth: 0,
    overflow: "auto",
  },
  editorPane: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    overflow: "auto",
  },
  paneHeader: {
    padding: "14px 16px",
    borderBottom: "1px solid #d4d4d8",
    fontSize: 14,
    fontWeight: 700,
  },
  fileTreeWrap: {
    overflow: "auto",
  },
  fileRow: {
    width: "100%",
    border: 0,
    borderBottom: "1px solid #e5e7eb",
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 14,
    cursor: "pointer",
    textAlign: "left",
  },
  fileRowLeft: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  },
  fileIcon: {
    width: 16,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyPane: {
    padding: 20,
    color: "#71717a",
    fontSize: 14,
  },
  editorHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
    padding: "14px 16px",
    borderBottom: "1px solid #d4d4d8",
  },
  editorTitle: {
    fontSize: 14,
    fontWeight: 700,
  },
  editorMeta: {
    fontSize: 12,
    color: "#71717a",
    marginTop: 2,
  },
  editorActions: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  markdownToolbar: {
    display: "flex",
    gap: 8,
    padding: "10px 16px",
    borderBottom: "1px solid #d4d4d8",
  },
  toolbarButton: {
    border: "1px solid #d4d4d8",
    background: "#fff",
    padding: "6px 10px",
    fontSize: 13,
    cursor: "pointer",
    borderRadius: 4,
  },
  editorTextarea: {
    width: "100%",
    minHeight: "calc(100vh - 320px)",
    border: 0,
    outline: "none",
    resize: "none",
    padding: 16,
    boxSizing: "border-box",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    fontSize: 14,
    lineHeight: 1.6,
    overflow: "visible",
  },
  resizeHandle: {
    width: 8,
    cursor: "col-resize",
    background: "#f4f4f5",
    borderLeft: "1px solid #e5e7eb",
    borderRight: "1px solid #e5e7eb",
  },
  resizeHandleActive: {
    background: "#e4e4e7",
  },
  contentCard: {
    padding: 24,
  },
  sectionTitle: {
    margin: "0 0 20px 0",
    fontSize: 22,
  },
  contentStack: {
    display: "grid",
    gap: 16,
  },
  infoCard: {
    border: "1px solid #d4d4d8",
    padding: 16,
    background: "#fff",
    borderRadius: 4,
  },
  infoLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#71717a",
    marginBottom: 8,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 600,
    color: "#111827",
  },
  paragraph: {
    margin: "8px 0 0 0",
    color: "#52525b",
    fontSize: 14,
  },
  outlineButton: {
    border: "1px solid #d4d4d8",
    background: "#fff",
    padding: "10px 14px",
    fontSize: 14,
    cursor: "pointer",
    borderRadius: 4,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
  outlineButtonSmall: {
    border: "1px solid #d4d4d8",
    background: "#fff",
    padding: "8px 10px",
    fontSize: 14,
    cursor: "pointer",
    width: "100%",
    borderRadius: 4,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
  primaryButton: {
    border: "1px solid #3296ab",
    background: "#3296ab",
    color: "#fff",
    padding: "10px 14px",
    fontSize: 14,
    cursor: "pointer",
    borderRadius: 4,
    boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
  },
  deleteButton: {
    border: "1px solid #fecaca",
    background: "#fff",
    color: "#dc2626",
    padding: "10px 14px",
    fontSize: 14,
    cursor: "pointer",
    borderRadius: 4,
  },
  deleteButtonLight: {
    border: "1px solid #fecaca",
    background: "#fff",
    color: "#dc2626",
    padding: "10px 14px",
    fontSize: 14,
    cursor: "pointer",
    borderRadius: 4,
  },
  iconButton: {
    border: "1px solid #d4d4d8",
    background: "#fff",
    padding: "10px 12px",
    fontSize: 14,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
  loginShell: {
    minHeight: "100vh",
    background: "#f4f4f5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    fontFamily: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
  },
  loginCard: {
    width: "100%",
    maxWidth: 460,
    background: "#fff",
    border: "1px solid #d4d4d8",
    padding: 28,
    borderRadius: 6,
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
  brandRow: {
    display: "flex",
    gap: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  loginTitle: {
    margin: 0,
    fontSize: 28,
  },
  loginSubtitle: {
    margin: "6px 0 0 0",
    fontSize: 14,
    color: "#71717a",
  },
  formStack: {
    display: "grid",
    gap: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
  },
  input: {
    border: "1px solid #d4d4d8",
    background: "#fff",
    padding: "12px 14px",
    fontSize: 14,
    borderRadius: 4,
  },
  missingShell: {
    minHeight: "100vh",
    background: "#f4f4f5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    fontFamily: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
  },
  missingCard: {
    background: "#fff",
    border: "1px solid #d4d4d8",
    padding: 28,
    borderRadius: 6,
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
  missingTitle: {
    marginTop: 0,
  },
}
