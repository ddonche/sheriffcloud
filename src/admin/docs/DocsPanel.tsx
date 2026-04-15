import { useEffect, useMemo, useState } from "react"
import { DocsSidebar } from "./DocsSidebar"
import { DocsEditor } from "./DocsEditor"
import {
  buildDocsSite,
  listDocsFiles,
  readDocsFile,
  saveDocsFile,
} from "./docsApi"
import type {
  DocsBuildResponse,
  DocsFileNode,
  DocsPanelProps,
} from "./DocsTypes"

function pickDefaultFile(files: string[]) {
  if (files.includes("content/index.md")) return "content/index.md"
  return files[0] ?? null
}

function buildFileTree(paths: string[]): DocsFileNode[] {
  const root: DocsFileNode = {
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

  function sortNodes(nodes: DocsFileNode[]): DocsFileNode[] {
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

function parentFoldersFor(path: string) {
  const parts = path.split("/").filter(Boolean)
  const folders: string[] = []
  let running = ""

  for (let i = 0; i < parts.length - 1; i += 1) {
    running = running ? `${running}/${parts[i]}` : parts[i]
    folders.push(running)
  }

  return folders
}

function formatBuildOutput(siteName: string, data: DocsBuildResponse) {
  const statusLine =
    data.ok && data.code === 0
      ? `BUILD SUCCESS — ${siteName}`
      : `BUILD FAILED — ${siteName}`

  return [
    statusLine,
    "=".repeat(statusLine.length),
    `Site: ${siteName}`,
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

export function DocsPanel({ site, supabase }: DocsPanelProps) {
  const [files, setFiles] = useState<string[]>([])
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [content, setContent] = useState("")
  const [savedContent, setSavedContent] = useState("")
  const [loadingFiles, setLoadingFiles] = useState(false)
  const [loadingFile, setLoadingFile] = useState(false)
  const [saving, setSaving] = useState(false)
  const [buildLoading, setBuildLoading] = useState(false)
  const [buildOutput, setBuildOutput] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  const dirty = content !== savedContent

  const tree = useMemo(() => buildFileTree(files), [files])

  async function loadFiles(preserveSelection = true) {
    setLoadingFiles(true)
    setError(null)

    try {
      const data = await listDocsFiles(supabase, site.id)
      const nextFiles = data.files ?? []
      setFiles(nextFiles)

      const defaultFile = preserveSelection && selectedFile && nextFiles.includes(selectedFile)
        ? selectedFile
        : pickDefaultFile(nextFiles)

      if (defaultFile) {
        await openFile(defaultFile, nextFiles)
      } else {
        setSelectedFile(null)
        setContent("")
        setSavedContent("")
      }
    } catch (err: any) {
      setError(err.message || "Failed to load docs files.")
    } finally {
      setLoadingFiles(false)
    }
  }

  async function openFile(path: string, knownFiles?: string[]) {
    setLoadingFile(true)
    setError(null)

    try {
      const data = await readDocsFile(supabase, site.id, path)
      setSelectedFile(path)
      setContent(data.content ?? "")
      setSavedContent(data.content ?? "")

      const sourceFiles = knownFiles ?? files
      const folders = parentFoldersFor(path)
      if (sourceFiles.length > 0) {
        setExpandedFolders((prev) => {
          const next = new Set(prev)
          for (const folder of folders) next.add(folder)
          return next
        })
      }
    } catch (err: any) {
      setError(err.message || "Failed to open file.")
    } finally {
      setLoadingFile(false)
    }
  }

  async function handleSave() {
    if (!selectedFile) return

    setSaving(true)
    setError(null)

    try {
      await saveDocsFile(supabase, site.id, selectedFile, content)
      setSavedContent(content)
    } catch (err: any) {
      setError(err.message || "Failed to save file.")
    } finally {
      setSaving(false)
    }
  }

  async function handleBuild() {
    setBuildLoading(true)
    setError(null)

    try {
      const data = await buildDocsSite(supabase, site.id)
      setBuildOutput(formatBuildOutput(site.name, data))
    } catch (err: any) {
      setError(err.message || "Failed to build docs site.")
    } finally {
      setBuildLoading(false)
    }
  }

  function toggleFolder(path: string) {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  useEffect(() => {
    void loadFiles(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [site.id])

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        background: "#f9fafb",
      }}
    >
      <DocsSidebar
        nodes={tree}
        selectedFile={selectedFile}
        expandedFolders={expandedFolders}
        loading={loadingFiles}
        onToggleFolder={toggleFolder}
        onOpenFile={(path) => void openFile(path)}
        onRefresh={() => void loadFiles(false)}
        onBuild={() => void handleBuild()}
        buildLoading={buildLoading}
      />

      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {error && (
          <div
            style={{
              margin: "12px 16px 0",
              padding: "10px 12px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 6,
              color: "#dc2626",
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        <DocsEditor
          siteName={site.name}
          selectedFile={selectedFile}
          content={content}
          dirty={dirty}
          loading={loadingFile}
          saving={saving}
          onChange={setContent}
          onSave={() => void handleSave()}
        />

        <div
          style={{
            borderTop: "1px solid #e5e7eb",
            background: "#fff",
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            minHeight: 180,
            maxHeight: 240,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#71717a",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Build Output
          </div>

          <pre
            style={{
              margin: 0,
              flex: 1,
              overflow: "auto",
              background: "#0f172a",
              color: "#e2e8f0",
              borderRadius: 8,
              padding: 12,
              fontSize: 12,
              lineHeight: 1.5,
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
            }}
          >
            {buildOutput || "No build output yet."}
          </pre>
        </div>
      </div>
    </div>
  )
}