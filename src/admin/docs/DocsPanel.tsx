import { useEffect, useMemo, useRef, useState } from "react"
import {
  listDocsFiles,
  readDocsFile,
  saveDocsFile,
  deleteDocsFile,
  buildDocsSite,
  startUpload,
  getUploadStatus,
  initPortal,
} from "./docsApi"

type Site = {
  id: string
  name: string
  subdomain: string
  custom_domain: string | null
  owner_id: string
  site_type: "cloud" | "static"
  site_origin: string
  created_at: string
  logo_url: string | null
  bio: string | null
  tagline: string | null
}

type DocsPanelProps = {
  sites: Site[]
  initialSiteId: string | null
  userId: string
  supabase: any
}

type DocsTab = "files" | "build" | "settings"

type FileNode = {
  name: string
  path: string
  type: "file" | "folder"
  children?: FileNode[]
}

const FONT = `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
const MONO = `"Geist Mono", "Fira Code", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`

const C = {
  bg: "#f9fafb",
  panel: "#ffffff",
  panelAlt: "#f3f4f6",
  border: "#e5e7eb",
  borderStrong: "#d1d5db",
  text: "#111827",
  muted: "#6b7280",
  dim: "#9ca3af",
  accent: "#0e7490",
  accentSoft: "#ecfeff",
  accentBorder: "#67e8f9",
  success: "#166534",
  successBg: "#dcfce7",
  error: "#dc2626",
  errorBg: "#fef2f2",
  warn: "#92400e",
  warnBg: "#fef3c7",
  dark: "#0f172a",
  dark2: "#1e293b",
  darkText: "#e2e8f0",
}

function siteUrl(site: Site) {
  if (site.custom_domain) return `https://${site.custom_domain}`
  return `https://${site.subdomain}.sheriffcloud.com`
}

function siteInitial(name: string) {
  return (name || "?").trim().charAt(0).toUpperCase()
}

function niceDate(value: string) {
  try { return new Date(value).toLocaleDateString() } catch { return value }
}

function buildFileTree(paths: string[]): FileNode[] {
  const root: FileNode = { name: "root", path: "", type: "folder", children: [] }

  for (const fullPath of paths) {
    const parts = fullPath.split("/").filter(Boolean)
    let current = root
    let running = ""

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      running = running ? `${running}/${part}` : part
      const isFile = i === parts.length - 1
      if (!current.children) current.children = []
      let found = current.children.find(c => c.name === part)
      if (!found) {
        found = { name: part, path: running, type: isFile ? "file" : "folder", children: isFile ? undefined : [] }
        current.children.push(found)
      }
      current = found
    }
  }

  function sort(nodes: FileNode[]): FileNode[] {
    return [...nodes]
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === "folder" ? -1 : 1
        return a.name.localeCompare(b.name)
      })
      .map(n => ({ ...n, children: n.children ? sort(n.children) : undefined }))
  }

  return sort(root.children ?? [])
}

// ── File Tree ─────────────────────────────────────────────────────────────────

function FileTree({
  nodes, selectedFile, expandedFolders, onToggleFolder, onOpenFile, depth = 0,
}: {
  nodes: FileNode[]
  selectedFile: string | null
  expandedFolders: Set<string>
  onToggleFolder: (path: string) => void
  onOpenFile: (path: string) => void
  depth?: number
}) {
  return (
    <div>
      {nodes.map(node => {
        const isOpen = expandedFolders.has(node.path)
        const isSelected = selectedFile === node.path

        if (node.type === "folder") {
          return (
            <div key={node.path}>
              <button type="button" onClick={() => onToggleFolder(node.path)}
                style={{ width: "100%", border: "none", background: isOpen ? C.panelAlt : "transparent", color: C.text, textAlign: "left", padding: `8px 12px 8px ${16 + depth * 14}px`, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}
              >
                <span style={{ width: 12, flexShrink: 0 }}>{isOpen ? "▾" : "▸"}</span>
                <span style={{ fontWeight: 600, color: C.muted }}>📁</span>
                <span style={{ fontWeight: 600 }}>{node.name}</span>
              </button>
              {isOpen && node.children && (
                <FileTree nodes={node.children} selectedFile={selectedFile} expandedFolders={expandedFolders} onToggleFolder={onToggleFolder} onOpenFile={onOpenFile} depth={depth + 1} />
              )}
            </div>
          )
        }

        return (
          <button key={node.path} type="button" onClick={() => onOpenFile(node.path)}
            style={{ width: "100%", border: "none", background: isSelected ? C.accent : "transparent", color: isSelected ? "#fff" : C.text, textAlign: "left", padding: `8px 12px 8px ${28 + depth * 14}px`, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}
          >
            <span style={{ color: isSelected ? "#fff" : C.dim }}>📄</span>
            <span>{node.name}</span>
          </button>
        )
      })}
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div style={{ flex: 1, display: "grid", placeItems: "center", padding: 32, background: C.bg, fontFamily: FONT }}>
      <div style={{ width: "100%", maxWidth: 620, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, boxShadow: "0 8px 24px rgba(0,0,0,0.04)" }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: C.accent, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Docs</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: C.text, lineHeight: 1.15, marginBottom: 10 }}>No docs sites yet.</div>
        <div style={{ fontSize: 15, color: C.muted, lineHeight: 1.7, marginBottom: 18 }}>Create a new site with Docs enabled from the sidebar.</div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: C.warnBg, color: C.warn, fontSize: 13, fontWeight: 600 }}>
          Docs lives in Admin. Spur is the streamlined writing surface.
        </div>
      </div>
    </div>
  )
}

// ── Site Switcher ─────────────────────────────────────────────────────────────

function SiteSwitcher({ sites, activeSiteId, onChange }: { sites: Site[]; activeSiteId: string | null; onChange: (siteId: string) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: C.dim, letterSpacing: "0.08em", textTransform: "uppercase" }}>Docs Sites</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sites.map(site => {
          const active = site.id === activeSiteId
          return (
            <button key={site.id} type="button" onClick={() => onChange(site.id)}
              style={{ width: "100%", border: `1px solid ${active ? C.accentBorder : C.border}`, background: active ? C.accentSoft : C.panel, borderRadius: 12, padding: 12, textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}
            >
              <div style={{ width: 34, height: 34, borderRadius: 10, background: active ? C.accent : C.dark2, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, flexShrink: 0 }}>
                {siteInitial(site.name)}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{site.name}</div>
                <div style={{ fontSize: 12, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>{site.subdomain}.sheriffcloud.com</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

function DocsTabs({ tab, onChange }: { tab: DocsTab; onChange: (tab: DocsTab) => void }) {
  const tabs: DocsTab[] = ["files", "build", "settings"]
  return (
    <div style={{ display: "inline-flex", gap: 6, padding: 4, borderRadius: 12, background: C.panelAlt, border: `1px solid ${C.border}` }}>
      {tabs.map(item => {
        const active = item === tab
        return (
          <button key={item} type="button" onClick={() => onChange(item)}
            style={{ border: "none", background: active ? C.panel : "transparent", color: active ? C.text : C.muted, padding: "8px 12px", borderRadius: 8, fontSize: 13, fontWeight: 700, textTransform: "capitalize", cursor: "pointer", boxShadow: active ? "0 1px 2px rgba(0,0,0,0.05)" : "none" }}
          >
            {item}
          </button>
        )
      })}
    </div>
  )
}

// ── Toolbar components ────────────────────────────────────────────────────────

function TBtn({ onClick, active, title, children }: { onClick?: () => void; active?: boolean; title: string; children: React.ReactNode }) {
  const [hov, setHov] = useState(false)
  return (
    <button type="button" onClick={onClick} title={title}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ flex: "0 0 auto", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", border: "none", borderRadius: 0, cursor: "pointer", background: active ? C.accentSoft : hov ? "rgba(0,0,0,0.04)" : "transparent", color: active ? C.accent : hov ? C.text : C.muted, transition: "background 0.1s, color 0.1s" }}>
      {children}
    </button>
  )
}

function TSep({ border }: { border: string }) {
  return <div style={{ width: 1, height: 18, background: border, flexShrink: 0, alignSelf: "center", margin: "0 1px" }} />
}

// ── Frontmatter helpers ───────────────────────────────────────────────────────

type FrontmatterFields = {
  title: string
  author: string
  layout: string
  meta_kind: string
  meta_type: string
  summary: string
  gloss: string
}

const META_KIND_OPTIONS = ["docs", "wiki", "blog", "article"]

const META_TYPE_OPTIONS = [
  "reference", "tutorial", "guide", "how-to", "overview", "quickstart",
  "api", "changelog", "faq", "entry", "portal", "index", "post", "editorial",
  "review", "announcement", "opinion", "case-study", "interview", "news",
  "definition", "concept", "walkthrough", "comparison", "landing",
]

function parseFrontmatter(content: string): { fm: FrontmatterFields; body: string } | null {
  const firstDelim = content.indexOf("^^^^")
  if (firstDelim === -1 || content.slice(0, firstDelim).trim() !== "") return null
  const afterFirst = content.indexOf("\n", firstDelim) + 1
  const closeDelim = content.indexOf("^^^^", afterFirst)
  if (closeDelim === -1) return null
  const fmBlock = content.slice(afterFirst, closeDelim)
  const body = content.slice(closeDelim + 4)
  const fields: FrontmatterFields = { title: "", author: "", layout: "docs", meta_kind: "", meta_type: "", summary: "", gloss: "" }
  for (const line of fmBlock.split("\n")) {
    const colon = line.indexOf(": ")
    if (colon === -1) continue
    const key = line.slice(0, colon).trim() as keyof FrontmatterFields
    const val = line.slice(colon + 2)
    if (key in fields) fields[key] = val
  }
  return { fm: fields, body }
}

function serializeFrontmatter(fm: FrontmatterFields, body: string): string {
  return [
    "^^^^",
    `title: ${fm.title}`,
    `author: ${fm.author}`,
    `layout: ${fm.layout}`,
    `meta_kind: ${fm.meta_kind}`,
    `meta_type: ${fm.meta_type}`,
    `summary: ${fm.summary}`,
    `gloss: ${fm.gloss}`,
    "^^^^",
  ].join("\n") + body
}

// ── Files View ────────────────────────────────────────────────────────────────

function FilesView({ activeSite, supabase }: { activeSite: Site; supabase: any }) {
  const [files, setFiles] = useState<string[]>([])
  const [loadingFiles, setLoadingFiles] = useState(false)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [content, setContent] = useState("")
  const [savedContent, setSavedContent] = useState("")
  const [frontmatter, setFrontmatter] = useState<FrontmatterFields | null>(null)
  const [bodyContent, setBodyContent] = useState("")
  const [showFrontmatter, setShowFrontmatter] = useState(false)
  const [loadingFile, setLoadingFile] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  // Image panel
  const [showImagePanel, setShowImagePanel] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageCaption, setImageCaption] = useState("")
  const [imageSize, setImageSize] = useState("full")
  const [imageAlign, setImageAlign] = useState("center")
  const [uploadingImage, setUploadingImage] = useState(false)

  // Wikilink modal
  const [showWikilinkModal, setShowWikilinkModal] = useState(false)
  const [wikilinkDisplay, setWikilinkDisplay] = useState("")
  const [wikilinkTarget, setWikilinkTarget] = useState("")

  const taRef = useRef<HTMLTextAreaElement>(null)

  // New page modal
  const [showNewPage, setShowNewPage] = useState(false)
  const [newPageName, setNewPageName] = useState("")
  const [newPageFolder, setNewPageFolder] = useState("content")
  const [creatingPage, setCreatingPage] = useState(false)

  const fileTree = useMemo(() => buildFileTree(files), [files])
  const dirty = frontmatter
    ? serializeFrontmatter(frontmatter, bodyContent) !== savedContent
    : content !== savedContent

  const newPageFolders = useMemo(() => {
    const folders = new Set<string>(["content"])
    for (const f of files) {
      const parts = f.split("/")
      let running = ""
      for (let i = 0; i < parts.length - 1; i++) {
        running = running ? `${running}/${parts[i]}` : parts[i]
        if (running.startsWith("content")) folders.add(running)
      }
    }
    return [...folders].sort()
  }, [files])

  function cleanSlug(value: string) {
    return value.toLowerCase().replace(/[^a-z0-9-_]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")
  }

  async function createPage() {
    const slug = cleanSlug(newPageName)
    if (!slug) return
    setCreatingPage(true)
    try {
      const folder = newPageFolder || "content"
      const path = `${folder}/${slug}.md`
      const title = slug.replace(/-/g, " ").replace(/^./, c => c.toUpperCase())
      await fetch(`/api/create_file?${activeSite.subdomain}&${path}&${title}`)
      setFiles(prev => prev.includes(path) ? prev : [...prev, path].sort())
      const parts = path.split("/")
      let running = ""
      const folders = new Set(expandedFolders)
      for (let i = 0; i < parts.length - 1; i++) {
        running = running ? `${running}/${parts[i]}` : parts[i]
        folders.add(running)
      }
      setExpandedFolders(folders)
      setShowNewPage(false)
      setNewPageName("")
      await openFile(path)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setCreatingPage(false)
    }
  }

  async function loadFiles() {
    setLoadingFiles(true)
    setError(null)
    try {
      const res = await listDocsFiles(supabase, activeSite.id, activeSite.subdomain)
      setFiles(res.files ?? [])
      const topFolders = new Set<string>()
      for (const f of res.files ?? []) {
        const top = f.split("/")[0]
        if (top && f.includes("/")) topFolders.add(top)
      }
      setExpandedFolders(topFolders)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoadingFiles(false)
    }
  }

  async function openFile(path: string) {
    if (dirty && !confirm("You have unsaved changes. Discard them?")) return
    setLoadingFile(true)
    setError(null)
    try {
      const res = await readDocsFile(supabase, activeSite.id, activeSite.subdomain, path)
      setSelectedFile(path)
      const raw = res.content
      const parsed = parseFrontmatter(raw)
      if (parsed) {
        setFrontmatter(parsed.fm)
        setBodyContent(parsed.body)
      } else {
        setFrontmatter(null)
        setBodyContent("")
      }
      setContent(raw)
      setSavedContent(raw)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoadingFile(false)
    }
  }

  async function saveFile() {
    if (!selectedFile) return
    setSaving(true)
    setError(null)
    try {
      const toSave = frontmatter ? serializeFrontmatter(frontmatter, bodyContent) : content
      await saveDocsFile(supabase, activeSite.id, activeSite.subdomain, selectedFile, toSave)
      setSavedContent(toSave)
      setContent(toSave)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function deleteFile() {
    if (!selectedFile) return
    if (!confirm(`Delete "${selectedFile}"? This cannot be undone.`)) return
    setDeleting(true)
    setError(null)
    try {
      await deleteDocsFile(supabase, activeSite.id, activeSite.subdomain, selectedFile)
      setFiles(prev => prev.filter(f => f !== selectedFile))
      setSelectedFile(null)
      setFrontmatter(null)
      setBodyContent("")
      setContent("")
      setSavedContent("")
    } catch (e: any) {
      setError(e.message)
    } finally {
      setDeleting(false)
    }
  }

  function getEditorValue() { return frontmatter ? bodyContent : content }
  function setEditorValue(val: string) { frontmatter ? setBodyContent(val) : setContent(val) }

  function taInsert(text: string) {
    const ta = taRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const cur = getEditorValue()
    const next = cur.slice(0, start) + text + cur.slice(end)
    setEditorValue(next)
    requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = start + text.length; ta.focus() })
  }

  function taWrap(before: string, after: string, placeholder: string) {
    const ta = taRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const cur = getEditorValue()
    const selected = cur.slice(start, end)
    const beforeCursor = cur.slice(Math.max(0, start - before.length), start)
    const afterCursor = cur.slice(end, end + after.length)
    if (beforeCursor === before && afterCursor === after) {
      const next = cur.slice(0, start - before.length) + selected + cur.slice(end + after.length)
      setEditorValue(next)
      requestAnimationFrame(() => { ta.selectionStart = start - before.length; ta.selectionEnd = end - before.length; ta.focus() })
    } else {
      const text = selected || placeholder
      const next = cur.slice(0, start) + before + text + after + cur.slice(end)
      setEditorValue(next)
      requestAnimationFrame(() => { ta.selectionStart = start + before.length; ta.selectionEnd = start + before.length + text.length; ta.focus() })
    }
  }

  function taHeading() {
    const ta = taRef.current
    if (!ta) return
    const cur = getEditorValue()
    const start = ta.selectionStart
    const lineStart = cur.lastIndexOf("\n", start - 1) + 1
    const lineEnd = cur.indexOf("\n", start)
    const end = lineEnd === -1 ? cur.length : lineEnd
    const line = cur.slice(lineStart, end)
    const match = line.match(/^(#{1,3})\s/)
    const currentLevel = match ? match[1].length : 0
    const nextLevel = currentLevel >= 3 ? 0 : currentLevel + 1
    const stripped = line.replace(/^#{1,3}\s*/, "")
    const insert = nextLevel === 0 ? stripped : "#".repeat(nextLevel) + " " + stripped
    const next = cur.slice(0, lineStart) + insert + cur.slice(end)
    setEditorValue(next)
    requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = lineStart + insert.length; ta.focus() })
  }

  function taBlockquote() {
    const ta = taRef.current
    if (!ta) return
    const cur = getEditorValue()
    const start = ta.selectionStart
    const lineStart = cur.lastIndexOf("\n", start - 1) + 1
    const lineEnd = cur.indexOf("\n", start)
    const end = lineEnd === -1 ? cur.length : lineEnd
    const line = cur.slice(lineStart, end)
    const isQuoted = /^>\s*/.test(line)
    const insert = isQuoted ? line.replace(/^>\s*/, "") : "> " + line
    const next = cur.slice(0, lineStart) + insert + cur.slice(end)
    setEditorValue(next)
    requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = lineStart + insert.length; ta.focus() })
  }

  function handleWikilink() {
    const ta = taRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const cur = getEditorValue()
    const beforeCursor = cur.slice(Math.max(0, start - 2), start)
    const afterCursor = cur.slice(end, end + 2)
    // Toggle off: cursor is inside [[...]] — remove the brackets
    if (beforeCursor === "[[" && afterCursor === "]]") {
      const selected = cur.slice(start, end)
      const next = cur.slice(0, start - 2) + selected + cur.slice(end + 2)
      setEditorValue(next)
      requestAnimationFrame(() => { ta.selectionStart = start - 2; ta.selectionEnd = end - 2; ta.focus() })
      return
    }
    // Open modal with current selection pre-filled
    const selected = cur.slice(start, end)
    setWikilinkDisplay(selected)
    setWikilinkTarget("")
    setShowWikilinkModal(true)
  }

  function insertWikilink() {
    const display = wikilinkDisplay.trim()
    if (!display) return
    const target = wikilinkTarget.trim()
    const markup = target ? `[[${display}|${target}]]` : `[[${display}]]`
    taInsert(markup)
    setShowWikilinkModal(false)
    setWikilinkDisplay("")
    setWikilinkTarget("")
  }

  async function handleImageInsert() {
    if (!imageFile) return
    setUploadingImage(true)
    try {
      const query = new URLSearchParams({ portal: activeSite.subdomain, path: `public/images/${imageFile.name}` })
      const res = await fetch(`/api/write_file?${query.toString()}`, {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: imageFile,
      })
      const text = await res.text()
      let data: any = { ok: true }
      try { data = JSON.parse(text) } catch {}
      if (data.ok === false) { setError(`Image upload failed: ${data.stderr ?? text}`); return }
      const markup = `[[image:${imageFile.name}|${imageSize}|${imageAlign}|${imageCaption}]]`
      taInsert(markup)
      setShowImagePanel(false)
      setImageFile(null)
      setImageCaption("")
      setImageSize("full")
      setImageAlign("center")
    } catch (e: any) {
      setError(e.message)
    } finally {
      setUploadingImage(false)
    }
  }

  function toggleFolder(path: string) {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      next.has(path) ? next.delete(path) : next.add(path)
      return next
    })
  }

  useEffect(() => {
    setSelectedFile(null)
    setFrontmatter(null)
    setBodyContent("")
    setContent("")
    setSavedContent("")
    setFiles([])
    setError(null)
    loadFiles()
  }, [activeSite.id])

  return (
    <>
    <div style={{ display: "grid", gridTemplateColumns: "300px minmax(0, 1fr)", gap: 16, minHeight: 0, flex: 1 }}>
      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: C.dim, letterSpacing: "0.08em", textTransform: "uppercase" }}>Files</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" onClick={() => { setNewPageName(""); setNewPageFolder(newPageFolders[0] ?? "content"); setShowNewPage(true) }}
              style={{ border: "none", background: C.accent, color: "#fff", borderRadius: 8, padding: "6px 10px", fontSize: 12, fontWeight: 800, cursor: "pointer" }}
            >+ New</button>
            <button type="button" onClick={loadFiles} disabled={loadingFiles}
              style={{ border: `1px solid ${C.borderStrong}`, background: C.panel, color: C.text, borderRadius: 8, padding: "6px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: loadingFiles ? 0.5 : 1 }}
            >{loadingFiles ? "Loading…" : "Refresh"}</button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {error && <div style={{ padding: "12px 16px", fontSize: 13, color: C.error, background: C.errorBg, borderBottom: `1px solid #fecaca` }}>{error}</div>}
          {!loadingFiles && files.length === 0 && !error && <div style={{ padding: 16, fontSize: 13, color: C.muted }}>No files found.</div>}
          {fileTree.length > 0 && <FileTree nodes={fileTree} selectedFile={selectedFile} expandedFolders={expandedFolders} onToggleFolder={toggleFolder} onOpenFile={openFile} />}
        </div>
      </div>

      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.dim, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Editor</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {loadingFile ? "Loading…" : selectedFile ?? "Select a file"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <button type="button" onClick={deleteFile} disabled={!selectedFile || deleting}
              style={{ border: `1px solid #fecaca`, background: C.panel, color: C.error, borderRadius: 8, padding: "8px 12px", fontSize: 12, fontWeight: 700, cursor: !selectedFile ? "default" : "pointer", opacity: !selectedFile || deleting ? 0.4 : 1 }}
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
            <button type="button" onClick={saveFile} disabled={!dirty || saving || !selectedFile}
              style={{ border: "none", background: dirty ? C.accent : C.borderStrong, color: "#fff", borderRadius: 8, padding: "8px 12px", fontSize: 12, fontWeight: 800, cursor: dirty ? "pointer" : "default", opacity: !selectedFile ? 0.4 : 1 }}
            >
              {saving ? "Saving…" : dirty ? "Save" : "Saved"}
            </button>
          </div>
        </div>

        {frontmatter && (
          <div style={{ borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
            <button type="button" onClick={() => setShowFrontmatter(v => !v)}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", border: 0, background: showFrontmatter ? "#f1f3f5" : C.accent, color: showFrontmatter ? "#52525b" : "#fff", padding: "8px 12px", cursor: "pointer", fontFamily: FONT, marginBottom: 0 }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Page Metadata</span>
              <span style={{ fontSize: 12 }}>{showFrontmatter ? "▴ Hide" : "▾ Show"}</span>
            </button>
            {showFrontmatter && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px", padding: "12px 14px", background: C.panelAlt }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>title <span style={{ color: C.error }}>*</span></label>
                  <input value={frontmatter.title} onChange={e => setFrontmatter({ ...frontmatter, title: e.target.value })}
                    style={{ border: `1px solid ${C.borderStrong}`, borderRadius: 4, padding: "6px 8px", fontSize: 13, color: C.text, background: "#fff", fontFamily: FONT }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>author <span style={{ color: C.error }}>*</span></label>
                  <input value={frontmatter.author} onChange={e => setFrontmatter({ ...frontmatter, author: e.target.value })} placeholder="Author or site name"
                    style={{ border: `1px solid ${C.borderStrong}`, borderRadius: 4, padding: "6px 8px", fontSize: 13, color: C.text, background: "#fff", fontFamily: FONT }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>layout</label>
                  <input value={frontmatter.layout} onChange={e => setFrontmatter({ ...frontmatter, layout: e.target.value })}
                    style={{ border: `1px solid ${C.borderStrong}`, borderRadius: 4, padding: "6px 8px", fontSize: 13, color: C.text, background: "#fff", fontFamily: FONT }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>meta_kind <span style={{ color: C.error }}>*</span></label>
                  <select value={frontmatter.meta_kind} onChange={e => setFrontmatter({ ...frontmatter, meta_kind: e.target.value })}
                    style={{ border: `1px solid ${C.borderStrong}`, borderRadius: 4, padding: "6px 8px", fontSize: 13, color: C.text, background: "#fff", fontFamily: FONT }}>
                    <option value="">— select —</option>
                    {META_KIND_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>meta_type <span style={{ color: C.error }}>*</span></label>
                  <select value={frontmatter.meta_type} onChange={e => setFrontmatter({ ...frontmatter, meta_type: e.target.value })}
                    style={{ border: `1px solid ${C.borderStrong}`, borderRadius: 4, padding: "6px 8px", fontSize: 13, color: C.text, background: "#fff", fontFamily: FONT }}>
                    <option value="">— select —</option>
                    {META_TYPE_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, gridColumn: "1 / -1" }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>summary <span style={{ color: C.error }}>*</span></label>
                  <textarea value={frontmatter.summary} onChange={e => setFrontmatter({ ...frontmatter, summary: e.target.value })} placeholder="One-sentence summary of this page"
                    style={{ border: `1px solid ${C.borderStrong}`, borderRadius: 4, padding: "6px 8px", fontSize: 13, color: C.text, background: "#fff", fontFamily: FONT, resize: "vertical", minHeight: 48, lineHeight: 1.5 }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, gridColumn: "1 / -1" }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>gloss <span style={{ fontSize: 11, fontWeight: 400, color: C.dim }}>(optional)</span></label>
                  <textarea value={frontmatter.gloss} onChange={e => setFrontmatter({ ...frontmatter, gloss: e.target.value })} placeholder="Brief definition, if the page warrants it"
                    style={{ border: `1px solid ${C.borderStrong}`, borderRadius: 4, padding: "6px 8px", fontSize: 13, color: C.text, background: "#fff", fontFamily: FONT, resize: "vertical", minHeight: 48, lineHeight: 1.5 }} />
                </div>
              </div>
            )}
          </div>
        )}

        {selectedFile && (
          <div style={{ borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "stretch", background: C.panelAlt, flexShrink: 0 }}>
            <TBtn title="Bold" onClick={() => taWrap("**", "**", "bold text")}><svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h8a4 4 0 010 8H6z"/><path d="M6 12h9a4 4 0 010 8H6z"/></svg></TBtn>
            <TBtn title="Italic" onClick={() => taWrap("*", "*", "italic text")}><svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg></TBtn>
            <TBtn title="Heading" onClick={taHeading}><span style={{ fontSize: 11, fontWeight: 800, fontFamily: FONT, letterSpacing: "-0.03em", lineHeight: 1 }}>H</span></TBtn>
            <TSep border={C.border} />
            <TBtn title="Bullet list" onClick={() => taInsert("\n- ")}><svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.2" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1.2" fill="currentColor" stroke="none"/></svg></TBtn>
            <TBtn title="Blockquote" onClick={taBlockquote}><svg viewBox="0 0 24 24" width={15} height={15} fill="currentColor"><path d="M3 3h7v7H6a3 3 0 003 3v2a5 5 0 01-5-5V3zm11 0h7v7h-4a3 3 0 003 3v2a5 5 0 01-5-5V3z" opacity={0.9}/></svg></TBtn>
            <TBtn title="Code block" onClick={() => taWrap("```\n", "\n```", "code")}><svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg></TBtn>
            <TBtn title="Inline code" onClick={() => taWrap("`", "`", "code")}><svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M8 9l-3 3 3 3"/><path d="M16 9l3 3-3 3"/></svg></TBtn>
            <TSep border={C.border} />
            <TBtn title="Wikilink" onClick={handleWikilink}><svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg></TBtn>
            <TBtn title="HR" onClick={() => taInsert("\n\n---\n\n")}><svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12"/></svg></TBtn>
            <TSep border={C.border} />
            <TBtn title="Insert image" onClick={() => setShowImagePanel(v => !v)} active={showImagePanel}><svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></TBtn>
          </div>
        )}

        {showImagePanel && (
          <div style={{ borderBottom: `1px solid ${C.border}`, background: "#f8f9fa", padding: "12px 14px", display: "grid", gap: 10, flexShrink: 0 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>Image file</label>
                <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] ?? null)}
                  style={{ border: `1px solid ${C.borderStrong}`, borderRadius: 4, padding: "4px 8px", fontSize: 12, background: "#fff", fontFamily: FONT }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>Size</label>
                <select value={imageSize} onChange={e => setImageSize(e.target.value)}
                  style={{ border: `1px solid ${C.borderStrong}`, borderRadius: 4, padding: "6px 8px", fontSize: 13, background: "#fff", fontFamily: FONT }}>
                  <option value="full">Full</option>
                  <option value="half">Half</option>
                  <option value="thumb">Thumb</option>
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>Align</label>
                <select value={imageAlign} onChange={e => setImageAlign(e.target.value)}
                  style={{ border: `1px solid ${C.borderStrong}`, borderRadius: 4, padding: "6px 8px", fontSize: 13, background: "#fff", fontFamily: FONT }}>
                  <option value="center">Center</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>Caption (optional)</label>
              <input placeholder="A description of the image" value={imageCaption} onChange={e => setImageCaption(e.target.value)}
                style={{ border: `1px solid ${C.borderStrong}`, borderRadius: 4, padding: "6px 8px", fontSize: 13, color: C.text, background: "#fff", fontFamily: FONT }} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={handleImageInsert} disabled={!imageFile || uploadingImage}
                style={{ border: "none", background: !imageFile || uploadingImage ? C.dim : C.accent, color: "#fff", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 800, cursor: !imageFile || uploadingImage ? "default" : "pointer" }}
              >{uploadingImage ? "Uploading…" : "Insert Image"}</button>
              <button type="button" onClick={() => { setShowImagePanel(false); setImageFile(null); setImageCaption("") }}
                style={{ border: `1px solid ${C.borderStrong}`, background: C.panel, color: C.text, borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
              >Cancel</button>
            </div>
            {imageFile && (
              <div style={{ fontSize: 12, color: C.muted }}>
                Will insert: <code style={{ background: "#e5e7eb", padding: "2px 6px", borderRadius: 3, fontFamily: MONO }}>{`[[image:${imageFile.name}|${imageSize}|${imageAlign}|${imageCaption || ""}]]`}</code>
              </div>
            )}
          </div>
        )}

        <div style={{ flex: 1, minHeight: 0, padding: 0 }}>
          {!selectedFile ? (
            <div style={{ height: "100%", display: "grid", placeItems: "center", color: C.muted, fontSize: 14 }}>Select a file from the left to edit it.</div>
          ) : (
            <textarea ref={taRef} value={frontmatter ? bodyContent : content} onChange={e => frontmatter ? setBodyContent(e.target.value) : setContent(e.target.value)} spellCheck={false}
              style={{ width: "100%", height: "100%", resize: "none", border: "none", borderRadius: 0, background: "#fff", color: C.text, padding: 14, boxSizing: "border-box", fontSize: 13, lineHeight: 1.65, fontFamily: MONO, outline: "none" }}
            />
          )}
        </div>
      </div>
    </div>

    {showWikilinkModal && (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24 }}>
        <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 14, width: "100%", maxWidth: 400, boxShadow: "0 8px 32px rgba(0,0,0,0.18)", fontFamily: FONT }}>
          <div style={{ padding: "16px 18px 12px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: C.text }}>Insert Wikilink</span>
            <button type="button" onClick={() => setShowWikilinkModal(false)} style={{ border: 0, background: "transparent", fontSize: 16, cursor: "pointer", color: C.muted }}>✕</button>
          </div>
          <div style={{ padding: "16px 18px", display: "grid", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>Display text <span style={{ color: C.error }}>*</span></label>
              <input autoFocus value={wikilinkDisplay} onChange={e => setWikilinkDisplay(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") insertWikilink(); if (e.key === "Escape") setShowWikilinkModal(false) }}
                placeholder="The text shown in the link"
                style={{ border: `1px solid ${C.borderStrong}`, borderRadius: 8, padding: "10px 12px", fontSize: 14, color: C.text, background: "#fff", fontFamily: FONT }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>Target <span style={{ fontSize: 11, fontWeight: 400, color: C.dim }}>(optional — page name or URL)</span></label>
              <input value={wikilinkTarget} onChange={e => setWikilinkTarget(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") insertWikilink(); if (e.key === "Escape") setShowWikilinkModal(false) }}
                placeholder="Page name or https://..."
                style={{ border: `1px solid ${C.borderStrong}`, borderRadius: 8, padding: "10px 12px", fontSize: 14, color: C.text, background: "#fff", fontFamily: FONT }} />
            </div>
            <div style={{ fontSize: 12, color: C.muted, background: C.panelAlt, border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 10px", lineHeight: 1.5 }}>
              Use the target field for external links (e.g. <code style={{ fontFamily: MONO, fontSize: 11 }}>https://example.com</code>) or to link to a page with a different name than the display text.
            </div>
            {wikilinkDisplay && (
              <div style={{ fontSize: 12, color: C.accent, fontFamily: MONO, padding: "6px 10px", background: C.accentSoft, border: `1px solid ${C.accentBorder}`, borderRadius: 6 }}>
                {wikilinkTarget ? `[[${wikilinkDisplay}|${wikilinkTarget}]]` : `[[${wikilinkDisplay}]]`}
              </div>
            )}
          </div>
          <div style={{ padding: "12px 18px 16px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button type="button" onClick={() => setShowWikilinkModal(false)}
              style={{ border: `1px solid ${C.borderStrong}`, background: "#fff", color: C.text, borderRadius: 8, padding: "9px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >Cancel</button>
            <button type="button" onClick={insertWikilink} disabled={!wikilinkDisplay.trim()}
              style={{ border: "none", background: !wikilinkDisplay.trim() ? C.dim : C.accent, color: "#fff", borderRadius: 8, padding: "9px 14px", fontSize: 13, fontWeight: 800, cursor: !wikilinkDisplay.trim() ? "default" : "pointer" }}
            >Insert</button>
          </div>
        </div>
      </div>
    )}

    {showNewPage && (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24 }}>
        <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 14, width: "100%", maxWidth: 420, boxShadow: "0 8px 32px rgba(0,0,0,0.18)", fontFamily: FONT }}>
          <div style={{ padding: "16px 18px 12px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: C.text }}>New Page</span>
            <button type="button" onClick={() => setShowNewPage(false)} style={{ border: 0, background: "transparent", fontSize: 16, cursor: "pointer", color: C.muted }}>✕</button>
          </div>
          <div style={{ padding: "16px 18px", display: "grid", gap: 10 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>Page name</label>
              <input autoFocus placeholder="e.g. getting-started" value={newPageName}
                onChange={e => setNewPageName(e.target.value)}
                onBlur={e => setNewPageName(cleanSlug(e.target.value))}
                onKeyDown={e => { if (e.key === "Enter") { setNewPageName(n => cleanSlug(n)); createPage() } if (e.key === "Escape") setShowNewPage(false) }}
                style={{ border: `1px solid ${C.borderStrong}`, borderRadius: 8, padding: "10px 12px", fontSize: 14, color: C.text, background: "#fff", fontFamily: FONT }} />
            </div>
            {newPageName && (
              <div style={{ fontSize: 12, color: C.accent, fontFamily: MONO, padding: "6px 10px", background: C.accentSoft, border: `1px solid ${C.accentBorder}`, borderRadius: 6 }}>
                {newPageFolder}/{newPageName}.md
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>Folder</label>
              <select value={newPageFolder} onChange={e => setNewPageFolder(e.target.value)}
                style={{ border: `1px solid ${C.borderStrong}`, borderRadius: 8, padding: "10px 12px", fontSize: 14, color: C.text, background: "#fff", fontFamily: FONT }}>
                {newPageFolders.map(f => <option key={f} value={f}>{f}/</option>)}
              </select>
            </div>
          </div>
          <div style={{ padding: "12px 18px 16px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button type="button" onClick={() => setShowNewPage(false)} disabled={creatingPage}
              style={{ border: `1px solid ${C.borderStrong}`, background: "#fff", color: C.text, borderRadius: 8, padding: "9px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >Cancel</button>
            <button type="button" onClick={createPage} disabled={creatingPage || !newPageName.trim()}
              style={{ border: "none", background: creatingPage || !newPageName.trim() ? C.dim : C.accent, color: "#fff", borderRadius: 8, padding: "9px 14px", fontSize: 13, fontWeight: 800, cursor: creatingPage || !newPageName.trim() ? "default" : "pointer" }}
            >{creatingPage ? "Creating…" : "Create Page"}</button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}

// ── Build View ────────────────────────────────────────────────────────────────

function BuildView({ activeSite, supabase }: { activeSite: Site; supabase: any }) {
  const [building, setBuilding] = useState(false)
  const [buildOutput, setBuildOutput] = useState<string | null>(null)
  const [buildOk, setBuildOk] = useState<boolean | null>(null)
  const [uploadState, setUploadState] = useState<"idle" | "starting" | "uploading" | "success" | "failed">("idle")
  const [uploadMessage, setUploadMessage] = useState("")
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function clearPoll() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }

  useEffect(() => () => clearPoll(), [])

  async function pollUpload() {
    try {
      const status = await getUploadStatus(supabase, activeSite.subdomain)
      setUploadState(status.state ?? "idle")
      setUploadMessage(status.error || status.message || "")
      if (status.state === "success" || status.state === "failed") clearPoll()
    } catch {
      clearPoll()
    }
  }

  async function runBuild() {
    setBuilding(true)
    setBuildOutput(null)
    setBuildOk(null)
    setUploadState("idle")
    setUploadMessage("")
    clearPoll()
 
    try {
      // Pre-flight: scaffold the portal directory if it doesn't exist yet.
      // The server returns { ok: true, already_exists: true } if it was already
      // there, so this is always safe to call before a build.
      const init = await initPortal(supabase, activeSite.subdomain)
      if (!init.ok) {
        setBuildOk(false)
        setBuildOutput(`BUILD FAILED — ${activeSite.name}\n\nPortal init failed: ${init.message ?? "unknown error"}`)
        return
      }
 
      const initNote = init.already_exists ? "" : `Portal scaffolded — ${activeSite.subdomain}\n\n`
 
      const res = await buildDocsSite(supabase, activeSite.subdomain)
      const ok = res.ok && res.code === 0
      setBuildOk(ok)
 
      const lines = [
        ok ? `BUILD SUCCESS — ${activeSite.name}` : `BUILD FAILED — ${activeSite.name}`,
        "=".repeat(40),
        `Site: ${activeSite.name}`,
        `Exit Code: ${res.code ?? "n/a"}`,
        "",
        "STDOUT",
        "------",
        res.stdout || "(none)",
        "",
        "STDERR",
        "------",
        res.stderr || "(none)",
      ]
      setBuildOutput(initNote + lines.join("\n"))
 
      if (ok) {
        setUploadState("starting")
        try {
          await startUpload(supabase, activeSite.subdomain)
          pollRef.current = setInterval(pollUpload, 2000)
        } catch (e: any) {
          setUploadState("failed")
          setUploadMessage(e.message)
        }
      }
    } catch (e: any) {
      setBuildOk(false)
      setBuildOutput(`BUILD FAILED — ${activeSite.name}\n\n${e.message}\n\nStack: ${e.stack ?? "none"}`)
    } finally {
      setBuilding(false)
    }
  }

  const uploadStatusColor = uploadState === "success" ? C.success : uploadState === "failed" ? C.error : C.accent
  const uploadStatusBg = uploadState === "success" ? C.successBg : uploadState === "failed" ? C.errorBg : C.accentSoft

  return (
    <div style={{ display: "grid", gridTemplateColumns: "300px minmax(0, 1fr)", gap: 16, minHeight: 0, flex: 1 }}>
      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, display: "flex", flexDirection: "column", gap: 14, alignSelf: "start" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: C.dim, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Build Controls</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{activeSite.name}</div>
        </div>
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>Build this site from source and push the output to R2.</div>
        <button type="button" onClick={runBuild} disabled={building}
          style={{ border: "none", background: building ? C.dim : C.accent, color: "#fff", borderRadius: 10, padding: "12px 14px", fontSize: 13, fontWeight: 800, cursor: building ? "default" : "pointer" }}
        >
          {building ? "Building…" : "Build Site"}
        </button>

        {buildOk !== null && (
          <div style={{ padding: "10px 12px", borderRadius: 10, background: buildOk ? C.successBg : C.errorBg, color: buildOk ? C.success : C.error, fontSize: 12, fontWeight: 700 }}>
            {buildOk ? "✓ Build succeeded" : "✗ Build failed"}
          </div>
        )}

        {uploadState !== "idle" && (
          <div style={{ padding: "10px 12px", borderRadius: 10, background: uploadStatusBg, color: uploadStatusColor, fontSize: 12, fontWeight: 700 }}>
            {uploadState === "starting"  && "⟳ Publishing…"}
            {uploadState === "uploading" && "⟳ Publishing…"}
            {uploadState === "success"   && "✓ Site published"}
            {uploadState === "failed"    && `✗ Publish failed${uploadMessage ? `: ${uploadMessage}` : ""}`}
          </div>
        )}
      </div>

      <div style={{ background: C.dark, border: `1px solid ${C.dark2}`, borderRadius: 14, padding: 16, minHeight: 420, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Build Output</div>
        <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", overflowWrap: "break-word", overflowX: "hidden", color: C.darkText, fontSize: 12, lineHeight: 1.6, fontFamily: MONO, flex: 1 }}>
          {buildOutput ?? "No build run yet."}
        </pre>
      </div>
    </div>
  )
}

// ── Settings View ─────────────────────────────────────────────────────────────

function SettingsView({ activeSite, supabase }: { activeSite: Site; supabase: any }) {
  const [zipFile, setZipFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function uploadZip(file: File) {
    setUploading(true)
    setUploadResult(null)
    try {
      const { data } = await supabase.auth.getSession()
      const token = data?.session?.access_token
      const res = await fetch(`/api/upload_portal?portal=${encodeURIComponent(activeSite.subdomain)}`, {
        method: "POST",
        headers: { "Content-Type": "application/zip", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: file,
      })
      const json = await res.json()
      setUploadResult({ ok: json.ok, message: json.message || json.error || "Unknown result" })
    } catch (e: any) {
      setUploadResult({ ok: false, message: e.message })
    } finally {
      setUploading(false)
      setZipFile(null)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.name.endsWith(".zip")) setZipFile(file)
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 320px", gap: 16, minHeight: 0, flex: 1, alignItems: "start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.dim, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Docs Settings</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>{activeSite.name}</div>
          </div>
          <div style={{ display: "grid", gap: 16, maxWidth: 720 }}>
            {[
              { label: "Public URL", value: siteUrl(activeSite) },
              { label: "Subdomain", value: activeSite.subdomain },
              { label: "Created", value: niceDate(activeSite.created_at) },
              { label: "Site Origin", value: activeSite.site_origin },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 6 }}>{label}</div>
                <input value={value} readOnly style={{ width: "100%", border: `1px solid ${C.borderStrong}`, borderRadius: 10, padding: "11px 12px", fontSize: 13, color: C.text, background: "#fff", boxSizing: "border-box" as const }} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.dim, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Upload Source Files</div>
            <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>Upload a zip of your local Sheriff site source to replace the current source files on the server.</div>
          </div>
          <div
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
            style={{ border: `2px dashed ${dragOver ? C.accent : zipFile ? C.accentBorder : C.borderStrong}`, borderRadius: 12, padding: 24, textAlign: "center", cursor: "pointer", background: dragOver ? C.accentSoft : zipFile ? "#f0fdff" : C.bg, transition: "all 0.15s" }}
          >
            <input ref={fileInputRef} type="file" accept=".zip" style={{ display: "none" }} onChange={e => { const file = e.target.files?.[0]; if (file) setZipFile(file) }} />
            {zipFile ? (
              <div style={{ fontSize: 14, fontWeight: 700, color: C.accent }}>📦 {zipFile.name}</div>
            ) : (
              <div style={{ fontSize: 14, color: C.muted }}>Drop a <strong>.zip</strong> here or click to browse</div>
            )}
          </div>
          {zipFile && (
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={() => uploadZip(zipFile)} disabled={uploading}
                style={{ flex: 1, border: "none", background: uploading ? C.dim : C.accent, color: "#fff", borderRadius: 10, padding: "12px 14px", fontSize: 13, fontWeight: 800, cursor: uploading ? "default" : "pointer" }}
              >
                {uploading ? "Uploading…" : "Upload & Extract"}
              </button>
              <button type="button" onClick={() => { setZipFile(null); setUploadResult(null) }} disabled={uploading}
                style={{ border: `1px solid ${C.borderStrong}`, background: C.panel, color: C.text, borderRadius: 10, padding: "12px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          )}
          {uploadResult && (
            <div style={{ padding: "12px 14px", borderRadius: 10, background: uploadResult.ok ? C.successBg : C.errorBg, color: uploadResult.ok ? C.success : C.error, fontSize: 13, fontWeight: 700 }}>
              {uploadResult.ok ? "✓ " : "✗ "}{uploadResult.message}
            </div>
          )}
        </div>
      </div>

      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: C.dim, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Status</div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 10, background: C.successBg, color: C.success, fontSize: 12, fontWeight: 800 }}>
          Docs enabled
        </div>
      </div>
    </div>
  )
}

// ── Main Panel ────────────────────────────────────────────────────────────────

export function DocsPanel({ sites, initialSiteId, supabase }: DocsPanelProps) {
  const [activeSiteId, setActiveSiteId] = useState<string | null>(initialSiteId ?? sites[0]?.id ?? null)
  const [tab, setTab] = useState<DocsTab>("files")

  useEffect(() => {
    if (!activeSiteId && sites.length > 0) setActiveSiteId(sites[0].id)
  }, [sites])

  const activeSite = useMemo(() => sites.find(s => s.id === activeSiteId) ?? null, [sites, activeSiteId])

  if (!sites.length || !activeSite) return <EmptyState />

  return (
    <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "260px minmax(0, 1fr)", background: C.bg, fontFamily: FONT }}>
      <div style={{ borderRight: `1px solid ${C.border}`, background: "#f8fafc", padding: 16, overflowY: "auto", minHeight: 0 }}>
        <SiteSwitcher sites={sites} activeSiteId={activeSiteId} onChange={id => { setActiveSiteId(id); setTab("files") }} />
      </div>

      <div style={{ minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "18px 20px", borderBottom: `1px solid ${C.border}`, background: C.panel, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", flexShrink: 0 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.dim, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Docs Workspace</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.text, lineHeight: 1.1 }}>{activeSite.name}</div>
            <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{siteUrl(activeSite)}</div>
          </div>
          <DocsTabs tab={tab} onChange={setTab} />
        </div>

        <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: 16, display: "flex", flexDirection: "column" }}>
          {tab === "files"    && <FilesView    activeSite={activeSite} supabase={supabase} />}
          {tab === "build"    && <BuildView    activeSite={activeSite} supabase={supabase} />}
          {tab === "settings" && <SettingsView activeSite={activeSite} supabase={supabase} />}
        </div>
      </div>
    </div>
  )
}
