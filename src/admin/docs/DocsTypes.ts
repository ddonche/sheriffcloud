import type React from "react"

export type DocsSite = {
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

export type DocsFileNode = {
  name: string
  path: string
  type: "file" | "folder"
  children?: DocsFileNode[]
}

export type DocsListFilesResponse = {
  ok: boolean
  files: string[]
  stderr?: string
}

export type DocsReadFileResponse = {
  ok: boolean
  path: string
  content: string
  stderr?: string
}

export type DocsSaveFileResponse = {
  ok: boolean
  path: string
  message?: string
  stderr?: string
}

export type DocsBuildResponse = {
  ok: boolean
  code: number | null
  stdout: string
  stderr: string
}

export type DocsApiError = {
  message: string
}

export type DocsPanelProps = {
  site: DocsSite
  userId: string
  supabase: any
}

export type DocsSidebarProps = {
  nodes: DocsFileNode[]
  selectedFile: string | null
  expandedFolders: Set<string>
  loading: boolean
  onToggleFolder: (path: string) => void
  onOpenFile: (path: string) => void
  onRefresh: () => void
  onBuild: () => void
  buildLoading: boolean
}

export type DocsEditorProps = {
  siteName: string
  selectedFile: string | null
  content: string
  dirty: boolean
  loading: boolean
  saving: boolean
  onChange: (value: string) => void
  onSave: () => void
}

export type DocsStyles = Record<string, React.CSSProperties>