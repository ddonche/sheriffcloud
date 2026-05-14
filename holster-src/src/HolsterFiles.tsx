import React, { useEffect, useMemo, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "./supabase"
import type { HolsterCollection } from "./HolsterPanel"
import { CollectionPicker } from "./HolsterCollectionPicker"
import { getHolsterEntitlements } from "./getHolsterEntitlements"

const FONT        = `"Inter", system-ui, -apple-system, sans-serif`
const CONTENT_BG  = "#f8fafc"
const CONTENT_BDR = "#e2e8f0"
const CARD_BG     = "#ffffff"
const TEAL        = "#5b95a7"
const RED         = "#c14141"
const TEXT        = "#0f172a"
const MUTED       = "#475569"
const DIM         = "#94a3b8"

const BUCKET = "holster-files"

type HolsterFolder = {
  id: string
  name: string
  created_at: string
  file_count: number
}

type HolsterFile = {
  id: string
  title: string
  file_path: string
  mime_type: string | null
  size_bytes: number
  collection: string | null
  folder_id: string | null
  created_at: string
  updated_at: string
}

type HolsterFileWithUrl = HolsterFile & {
  signedUrl: string | null
  signedUrlFetchedAt: number | null
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B"
  const units = ["B", "KB", "MB", "GB", "TB"]
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_")
}

function timeAgo(value: string) {
  const then = new Date(value).getTime()
  const now = Date.now()
  const diff = Math.max(0, now - then)
  const minutes = Math.floor(diff / 60000)

  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)

  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)

  if (days < 30) return `${days}d ago`

  return new Date(value).toLocaleDateString()
}

function IconFolderSmall() {
  return (
    <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function IconChevronRight() {
  return (
    <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function FileIcon() {
  return (
    <svg viewBox="0 0 640 640" width={28} height={28} fill="currentColor">
      <path d="M192 64C156.7 64 128 92.7 128 128L128 512C128 547.3 156.7 576 192 576L448 576C483.3 576 512 547.3 512 512L512 234.5C512 217.5 505.3 201.2 493.3 189.2L386.7 82.7C374.7 70.7 358.5 64 341.5 64L192 64zM453.5 240L360 240C346.7 240 336 229.3 336 216L336 122.5L453.5 240z" />
    </svg>
  )
}

function IconUpload() {
  return (
    <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

function IconUploadLarge() {
  return (
    <svg viewBox="0 0 24 24" width={36} height={36} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

function IconDownload() {
  return (
    <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v13M7 11l5 5 5-5" />
      <path d="M5 20h14" />
    </svg>
  )
}

function IconEdit() {
  return (
    <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function IconTrash() {
  return (
    <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IconX() {
  return (
    <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function audioLabel(type?: string | null) {
  if (!type) return "AUDIO"
  if (type.includes("mp3") || type.includes("mpeg")) return "MP3"
  if (type.includes("wav")) return "WAV"
  if (type.includes("ogg")) return "OGG"
  if (type.includes("flac")) return "FLAC"
  if (type.includes("aac")) return "AAC"
  if (type.includes("m4a")) return "M4A"
  if (type.includes("webm")) return "WEBM"
  return "AUDIO"
}

function IconMusic() {
  return (
    <svg viewBox="0 0 24 24" width={28} height={28} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  )
}

function IconPlay() {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor">
      <polygon points="5,3 19,12 5,21" />
    </svg>
  )
}

function IconPause() {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  )
}


function isImage(type?: string | null) {
  return !!type?.startsWith("image/")
}

function isAudio(type?: string | null) {
  return !!type?.startsWith("audio/")
}

function isVideo(type?: string | null) {
  return !!type?.startsWith("video/")
}

function isPdf(type?: string | null) {
  return type === "application/pdf"
}

function fileLabel(type?: string | null) {
  if (isPdf(type)) return "PDF"
  if (type?.includes("word") || type?.includes("document")) return "DOC"
  if (type?.includes("spreadsheet") || type?.includes("excel")) return "XLS"
  if (type?.includes("presentation") || type?.includes("powerpoint")) return "PPT"
  if (type?.startsWith("text/")) return "TXT"
  return "FILE"
}

function collectionColor(collection: HolsterCollection | undefined) {
  if (!collection) return null

  const loose = collection as any

  return loose.color ?? loose.color_hex ?? loose.hex_color ?? loose.accent_color ?? TEAL
}

function FilePreview({
  file,
}: {
  file: HolsterFileWithUrl
}) {
  if (isImage(file.mime_type) && file.signedUrl) {
    return (
      <img
        src={file.signedUrl}
        alt={file.title}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />
    )
  }

  if (isVideo(file.mime_type) && file.signedUrl) {
    return (
      <video
        src={file.signedUrl}
        controls
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          background: "#000",
        }}
      />
    )
  }

  if (isAudio(file.mime_type)) {
    return (
      <div
        style={{
          height: "100%",
          display: "grid",
          placeItems: "center",
          background: `${TEAL}10`,
          color: TEAL,
        }}
      >
        <div style={{ display: "grid", gap: 8, justifyItems: "center" }}>
          <IconMusic />
          <div
            style={{
              fontSize: 12,
              fontWeight: 900,
              color: MUTED,
              letterSpacing: 0.4,
              fontFamily: FONT,
            }}
          >
            {audioLabel(file.mime_type)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        height: "100%",
        display: "grid",
        placeItems: "center",
        background: `${TEAL}10`,
        color: TEAL,
      }}
    >
      <div style={{ display: "grid", gap: 8, justifyItems: "center" }}>
        <FileIcon />

        <div
          style={{
            fontSize: 12,
            fontWeight: 900,
            color: MUTED,
            letterSpacing: 0.4,
            fontFamily: FONT,
          }}
        >
          {fileLabel(file.mime_type)}
        </div>
      </div>
    </div>
  )
}

export default function HolsterFiles({
  user,
  collections,
  onCollectionCreated,
  onStorageChanged,
}: {
  user: User
  collections: HolsterCollection[]
  onCollectionCreated: (col: HolsterCollection) => void
  onStorageChanged?: () => void
}) {
  const [files, setFiles] = useState<HolsterFileWithUrl[]>([])
  const [folders, setFolders] = useState<HolsterFolder[]>([])
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [currentFolderName, setCurrentFolderName] = useState<string | null>(null)
  const [newFolderName, setNewFolderName] = useState("")
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null)
  const [editingFolderName, setEditingFolderName] = useState("")
  const [confirmDeleteFolderId, setConfirmDeleteFolderId] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [collection, setCollection] = useState<string | null>(null)
  const [previewFile, setPreviewFile] = useState<HolsterFileWithUrl | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState("")
  const [editingCollection, setEditingCollection] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [draggingOver, setDraggingOver] = useState(false)
  const [draggingFileId, setDraggingFileId] = useState<string | null>(null)
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const audioRefs = React.useRef<Record<string, HTMLAudioElement | null>>({})

  async function createSignedUrl(path: string) {
    const { data } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, 60 * 10)

    return data?.signedUrl ?? null
  }

  async function getFreshUrl(file: HolsterFileWithUrl): Promise<string | null> {
    const AGE_LIMIT = 9 * 60 * 1000 // refresh after 9 minutes
    if (
      file.signedUrl &&
      file.signedUrlFetchedAt &&
      Date.now() - file.signedUrlFetchedAt < AGE_LIMIT
    ) {
      return file.signedUrl
    }
    const fresh = await createSignedUrl(file.file_path)
    if (fresh) {
      setFiles(prev =>
        prev.map(f =>
          f.id === file.id ? { ...f, signedUrl: fresh, signedUrlFetchedAt: Date.now() } : f
        )
      )
    }
    return fresh
  }

  async function loadFolders() {
    const { data: folderData } = await supabase
      .from("holster_folders")
      .select("id, name, created_at")
      .eq("user_id", user.id)
      .eq("section", "files")
      .order("name", { ascending: true })

    if (!folderData) return

    // Fetch file counts per folder in one query
    const { data: countData } = await supabase
      .from("holster_files")
      .select("folder_id")
      .eq("user_id", user.id)
      .not("folder_id", "is", null)

    const counts: Record<string, number> = {}
    for (const row of (countData ?? [])) {
      if (row.folder_id) counts[row.folder_id] = (counts[row.folder_id] ?? 0) + 1
    }

    setFolders(
      folderData.map(f => ({ ...f, file_count: counts[f.id] ?? 0 })) as HolsterFolder[]
    )
  }

  async function loadFiles(folderId: string | null = null) {
    setLoading(true)
    setError(null)

    let query = supabase
      .from("holster_files")
      .select("id, title, file_path, mime_type, size_bytes, collection, folder_id, created_at, updated_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (folderId) {
      query = query.eq("folder_id", folderId)
    } else {
      query = query.is("folder_id", null)
    }

    const { data, error } = await query

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const rows = (data ?? []) as HolsterFile[]

    const withUrls = await Promise.all(
      rows.map(async file => ({
        ...file,
        signedUrl: await createSignedUrl(file.file_path),
        signedUrlFetchedAt: Date.now(),
      }))
    )

    setFiles(withUrls)
    setLoading(false)
  }

  useEffect(() => {
    void loadFolders()
    void loadFiles(null)
  }, [user.id])

  const usedBytes = useMemo(
    () => files.reduce((sum, file) => sum + Number(file.size_bytes ?? 0), 0),
    [files]
  )

  async function handleUpload() {
    if (!selectedFile) {
      setError("Choose a file first.")
      return
    }

    setUploading(true)
    setError(null)

    try {
      const entitlements = await getHolsterEntitlements(user.id)

      const maxUploadMb = entitlements?.holster_max_upload_size_mb ?? 10
      const storageLimitMb = entitlements?.holster_storage_limit_mb ?? 250

      const maxUploadBytes = maxUploadMb * 1024 * 1024
      const storageLimitBytes = storageLimitMb * 1024 * 1024
      const projectedUsage = usedBytes + selectedFile.size

      if (selectedFile.size > maxUploadBytes) {
        setError(`This file is ${formatBytes(selectedFile.size)}. Your current plan allows uploads up to ${maxUploadMb} MB.`)
        setUploading(false)
        return
      }

      if (projectedUsage > storageLimitBytes) {
        setError(`This upload would put you over your ${storageLimitMb} MB Holster storage limit. Upgrade to Pro for more storage.`)
        setUploading(false)
        return
      }

      const fileId = crypto.randomUUID()
      const cleanName = safeFileName(selectedFile.name)
      const filePath = `${user.id}/${fileId}-${cleanName}`
      const finalTitle = title.trim() || selectedFile.name

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, selectedFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: selectedFile.type || "application/octet-stream",
        })

      if (uploadError) {
        setError(uploadError.message)
        setUploading(false)
        return
      }

      const { data, error: insertError } = await supabase
        .from("holster_files")
        .insert({
          id: fileId,
          user_id: user.id,
          title: finalTitle,
          file_path: filePath,
          mime_type: selectedFile.type || null,
          size_bytes: selectedFile.size,
          collection,
          folder_id: currentFolderId,
        })
        .select("id, title, file_path, mime_type, size_bytes, collection, folder_id, created_at, updated_at")
        .single()

      if (insertError || !data) {
        await supabase.storage.from(BUCKET).remove([filePath])
        setError(insertError?.message ?? "Could not save file record.")
        setUploading(false)
        return
      }

      const signedUrl = await createSignedUrl(filePath)

      setFiles(prev => [
        {
          ...(data as HolsterFile),
          signedUrl,
          signedUrlFetchedAt: Date.now(),
        },
        ...prev,
      ])

      setSelectedFile(null)
      setTitle("")
      setCollection(null)
      setUploadOpen(false)
      onStorageChanged?.()
    } catch (e: any) {
      setError(e?.message ?? "Upload failed.")
    } finally {
      setUploading(false)
    }
  }

  async function handleOpen(file: HolsterFileWithUrl) {
    if (isAudio(file.mime_type) || isVideo(file.mime_type)) return

    if (isImage(file.mime_type)) {
      const url = await getFreshUrl(file)
      setPreviewFile(url ? { ...file, signedUrl: url } : file)
      return
    }

    const url = await getFreshUrl(file)

    if (!url) {
      setError("Could not create file link.")
      return
    }

    window.open(url, "_blank", "noopener,noreferrer")
  }

  async function handleDownload(file: HolsterFileWithUrl) {
    const url = await getFreshUrl(file)

    if (!url) {
      setError("Could not create download link.")
      return
    }

    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = blobUrl
      a.download = file.title || file.file_path.split("/").pop() || "file"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch {
      setError("Download failed.")
    }
  }

  function startEdit(file: HolsterFileWithUrl) {
    setEditingId(file.id)
    setEditingTitle(file.title)
    setEditingCollection(file.collection)
    setConfirmDeleteId(null)
  }

  async function commitEdit(file: HolsterFileWithUrl) {
    const newTitle = editingTitle.trim()
    if (!newTitle) {
      setEditingId(null)
      return
    }

    const titleChanged = newTitle !== file.title
    const collectionChanged = editingCollection !== file.collection

    if (!titleChanged && !collectionChanged) {
      setEditingId(null)
      return
    }

    const { error: updateError } = await supabase
      .from("holster_files")
      .update({
        title: newTitle,
        collection: editingCollection,
        updated_at: new Date().toISOString(),
      })
      .eq("id", file.id)
      .eq("user_id", user.id)

    if (updateError) {
      setError(updateError.message)
    } else {
      setFiles(prev =>
        prev.map(f =>
          f.id === file.id
            ? { ...f, title: newTitle, collection: editingCollection }
            : f
        )
      )
    }

    setEditingId(null)
  }

  async function handleDelete(file: HolsterFileWithUrl) {
    setError(null)

    const { error: storageError } = await supabase.storage
      .from(BUCKET)
      .remove([file.file_path])

    if (storageError) {
      setError(storageError.message)
      setConfirmDeleteId(null)
      return
    }

    const { error: dbError } = await supabase
      .from("holster_files")
      .delete()
      .eq("id", file.id)
      .eq("user_id", user.id)

    if (dbError) {
      setError(dbError.message)
      setConfirmDeleteId(null)
      return
    }

    setFiles(prev => prev.filter(row => row.id !== file.id))
    setConfirmDeleteId(null)
    onStorageChanged?.()
  }

  function resetUploadForm() {
    setSelectedFile(null)
    setTitle("")
    setCollection(null)
    setError(null)
    setUploadOpen(false)
  }

  function handleDragOver(e: React.DragEvent) {
    if (!e.dataTransfer.types.includes("Files")) return
    e.preventDefault()
    setDraggingOver(true)
    setUploadOpen(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDraggingOver(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    if (!e.dataTransfer.types.includes("Files")) return
    e.preventDefault()
    setDraggingOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      setSelectedFile(file)
      if (!title) setTitle(file.name.replace(/\.[^.]+$/, ""))
    }
  }

  function handlePlayPause(file: HolsterFileWithUrl) {
    const audio = audioRefs.current[file.id]
    if (!audio) return

    if (playingId === file.id) {
      audio.pause()
      setPlayingId(null)
    } else {
      // pause any currently playing
      if (playingId && audioRefs.current[playingId]) {
        audioRefs.current[playingId]!.pause()
      }
      audio.play().catch(() => {})
      setPlayingId(file.id)
    }
  }

  async function handleCreateFolder() {
    const name = newFolderName.trim()
    if (!name) return

    const { data, error } = await supabase
      .from("holster_folders")
      .insert({ user_id: user.id, section: "files", name })
      .select("id, name, created_at")
      .single()

    if (error) {
      setError(error.message)
      return
    }

    setFolders(prev => [...prev, { ...data, file_count: 0 } as HolsterFolder].sort((a, b) => a.name.localeCompare(b.name)))
    setNewFolderName("")
    setCreatingFolder(false)
  }

  async function handleRenameFolder(folder: HolsterFolder) {
    const name = editingFolderName.trim()
    if (!name || name === folder.name) {
      setEditingFolderId(null)
      return
    }

    const { error } = await supabase
      .from("holster_folders")
      .update({ name })
      .eq("id", folder.id)
      .eq("user_id", user.id)

    if (error) {
      setError(error.message)
    } else {
      setFolders(prev =>
        prev.map(f => f.id === folder.id ? { ...f, name } : f)
          .sort((a, b) => a.name.localeCompare(b.name))
      )
      if (currentFolderId === folder.id) setCurrentFolderName(name)
    }

    setEditingFolderId(null)
  }

  async function handleDeleteFolder(folder: HolsterFolder) {
    const { error } = await supabase
      .from("holster_folders")
      .delete()
      .eq("id", folder.id)
      .eq("user_id", user.id)

    if (error) {
      setError(error.message)
      setConfirmDeleteFolderId(null)
      return
    }

    setFolders(prev => prev.filter(f => f.id !== folder.id))
    setConfirmDeleteFolderId(null)

    // If we're inside the deleted folder, go back to root
    if (currentFolderId === folder.id) {
      setCurrentFolderId(null)
      setCurrentFolderName(null)
    }
    // Always reload files — deleted folder's contents float back to root
    void loadFiles(currentFolderId === folder.id ? null : currentFolderId)
  }

  function navigateIntoFolder(folder: HolsterFolder) {
    setCurrentFolderId(folder.id)
    setCurrentFolderName(folder.name)
    setEditingId(null)
    setConfirmDeleteId(null)
    void loadFiles(folder.id)
  }

  function navigateToRoot() {
    setCurrentFolderId(null)
    setCurrentFolderName(null)
    setEditingId(null)
    setConfirmDeleteId(null)
    void loadFiles(null)
  }

  async function handleFileDrop(folderId: string | null) {
    if (!draggingFileId) return
    if (folderId === currentFolderId) return // dropping onto current location, no-op

    setDragOverFolderId(null)
    setDraggingFileId(null)

    const { error } = await supabase
      .from("holster_files")
      .update({ folder_id: folderId, updated_at: new Date().toISOString() })
      .eq("id", draggingFileId)
      .eq("user_id", user.id)

    if (error) {
      setError(error.message)
      return
    }

    // Remove from current view
    setFiles(prev => prev.filter(f => f.id !== draggingFileId))

    // Update folder counts
    if (folderId) {
      setFolders(prev => prev.map(f => f.id === folderId ? { ...f, file_count: f.file_count + 1 } : f))
    }
    if (currentFolderId) {
      setFolders(prev => prev.map(f => f.id === currentFolderId ? { ...f, file_count: Math.max(0, f.file_count - 1) } : f))
    }
  }

  function iconBtnStyle(color: string): React.CSSProperties {
    return {
      width: 28,
      height: 28,
      borderRadius: 7,
      border: `1px solid ${color}30`,
      background: `${color}0d`,
      color,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      flexShrink: 0,
    }
  }

  const inputStyle: React.CSSProperties = {
    height: 38,
    padding: "0 12px",
    borderRadius: 7,
    border: `1px solid ${CONTENT_BDR}`,
    background: CARD_BG,
    fontSize: 14,
    fontFamily: FONT,
    color: TEXT,
    outline: "none",
    boxSizing: "border-box",
    width: "100%",
  }

  return (
    <div
      style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", background: CONTENT_BG, overflow: "hidden" }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <style>{`.folder-row:hover .folder-actions { opacity: 1 !important; }`}</style>
      {/* Header */}
      <div style={{ borderBottom: `1px solid ${CONTENT_BDR}`, padding: "18px 24px", flexShrink: 0, background: CARD_BG, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "grid", gap: 4 }}>
          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: FONT }}>
            <button
              type="button"
              onClick={navigateToRoot}
              style={{
                background: "none", border: "none", cursor: currentFolderId ? "pointer" : "default",
                fontSize: 20, fontWeight: 900, color: currentFolderId ? TEAL : TEXT,
                padding: 0, fontFamily: FONT,
              }}
            >
              Files
            </button>
            {currentFolderName && (
              <>
                <IconChevronRight />
                <span style={{ fontSize: 20, fontWeight: 900, color: TEXT, fontFamily: FONT }}>
                  {currentFolderName}
                </span>
              </>
            )}
          </div>
          <div style={{ fontSize: 13, color: DIM, fontFamily: FONT }}>
            {currentFolderId ? "Inside folder — click Files to go back." : "Upload PDFs, images, audio, video, and more."}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", borderRadius: 999, background: "#f1f5f9", color: MUTED, fontSize: 13, fontWeight: 800, fontFamily: FONT }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: loading ? DIM : TEAL, display: "inline-block" }} />
            {loading ? "Loading…" : `${files.length.toLocaleString()} files · ${formatBytes(usedBytes)}`}
          </div>
          {!currentFolderId && (
            creatingFolder ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  autoFocus
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") void handleCreateFolder()
                    if (e.key === "Escape") { setCreatingFolder(false); setNewFolderName("") }
                  }}
                  placeholder="Folder name"
                  style={{
                    height: 36, padding: "0 12px", borderRadius: 8,
                    border: `1px solid ${TEAL}`, fontSize: 13, fontFamily: FONT,
                    color: TEXT, outline: "none", background: CARD_BG, width: 150,
                  }}
                />
                <button type="button" onClick={() => void handleCreateFolder()} style={iconBtnStyle(TEAL)} title="Create"><IconCheck /></button>
                <button type="button" onClick={() => { setCreatingFolder(false); setNewFolderName("") }} style={iconBtnStyle(MUTED)} title="Cancel"><IconX /></button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCreatingFolder(true)}
                style={{
                  height: 36, padding: "0 14px", borderRadius: 8,
                  border: `1px solid ${CONTENT_BDR}`, background: "transparent",
                  color: MUTED, fontSize: 13, fontWeight: 700, fontFamily: FONT,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                }}
              >
                <IconFolderSmall /> New folder
              </button>
            )
          )}
          <button
            type="button"
            onClick={() => { setUploadOpen(o => !o); setError(null) }}
            style={{
              height: 36, padding: "0 16px", borderRadius: 8, border: "none",
              background: uploadOpen ? "#e2e8f0" : TEAL,
              color: uploadOpen ? MUTED : "#fff",
              fontSize: 13, fontWeight: 800, fontFamily: FONT, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            {uploadOpen ? <><IconX /> Cancel</> : <><IconUpload /> Upload</>}
          </button>
        </div>
      </div>

      {/* Upload panel */}
      {uploadOpen && (
        <div style={{ borderBottom: `1px solid ${CONTENT_BDR}`, padding: 20, background: CARD_BG, flexShrink: 0 }}>
          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDraggingOver(true) }}
            onDragLeave={e => { e.stopPropagation(); setDraggingOver(false) }}
            onDrop={e => { e.preventDefault(); e.stopPropagation(); setDraggingOver(false); const f = e.dataTransfer.files?.[0]; if (f) { setSelectedFile(f); if (!title) setTitle(f.name.replace(/\.[^.]+$/, "")) } }}
            style={{
              border: `2px dashed ${draggingOver ? TEAL : CONTENT_BDR}`,
              borderRadius: 12,
              padding: "28px 20px",
              background: draggingOver ? `${TEAL}08` : "#fafbfc",
              display: "grid",
              gap: 10,
              justifyItems: "center",
              transition: "border-color 0.15s, background 0.15s",
              cursor: "pointer",
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <div style={{ color: draggingOver ? TEAL : DIM, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <IconUploadLarge />
              {selectedFile ? (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: TEXT, fontFamily: FONT }}>{selectedFile.name}</div>
                  <div style={{ fontSize: 12, color: MUTED, fontFamily: FONT, marginTop: 2 }}>{formatBytes(selectedFile.size)}</div>
                </div>
              ) : (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: MUTED, fontFamily: FONT }}>
                    {draggingOver ? "Drop it!" : "Drag a file here"}
                  </div>
                  <div style={{ fontSize: 12, color: DIM, fontFamily: FONT, marginTop: 2 }}>or click to browse</div>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: "none" }}
              onChange={e => {
                const f = e.target.files?.[0]
                if (f) { setSelectedFile(f); if (!title) setTitle(f.name.replace(/\.[^.]+$/, "")) }
              }}
            />
          </div>

          {/* Meta fields — only show once a file is chosen */}
          {selectedFile && (
            <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Title (optional)"
                style={inputStyle}
              />
              <CollectionPicker
                collections={collections}
                value={collection}
                onChange={setCollection}
                onCreateNew={onCollectionCreated}
              />
              {error && (
                <div style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(193,65,65,0.08)", border: "1px solid rgba(193,65,65,0.18)", color: RED, fontSize: 13, fontFamily: FONT }}>
                  {error}
                </div>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => void handleUpload()}
                  disabled={uploading}
                  style={{
                    height: 36,
                    padding: "0 20px",
                    borderRadius: 8,
                    border: "none",
                    background: TEAL,
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 800,
                    fontFamily: FONT,
                    cursor: uploading ? "not-allowed" : "pointer",
                    opacity: uploading ? 0.7 : 1,
                  }}
                >
                  {uploading ? "Uploading…" : "Upload"}
                </button>
                <button
                  type="button"
                  onClick={resetUploadForm}
                  style={{
                    height: 36,
                    padding: "0 14px",
                    borderRadius: 8,
                    border: `1px solid ${CONTENT_BDR}`,
                    background: "transparent",
                    color: MUTED,
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: FONT,
                    cursor: "pointer",
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main content: side panel + file grid */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", overflow: "hidden" }}>

        {/* Side panel */}
        <div style={{
          width: 240,
          flexShrink: 0,
          borderRight: `1px solid ${CONTENT_BDR}`,
          background: CARD_BG,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}>
          {/* Panel header */}
          <div style={{ padding: "16px 16px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${CONTENT_BDR}`, flexShrink: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 900, color: MUTED, letterSpacing: 0.8, fontFamily: FONT, textTransform: "uppercase" }}>Folders</span>
            {creatingFolder ? (
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <input
                  autoFocus
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") void handleCreateFolder()
                    if (e.key === "Escape") { setCreatingFolder(false); setNewFolderName("") }
                  }}
                  placeholder="Name…"
                  style={{
                    height: 30, width: 110, padding: "0 9px", borderRadius: 6,
                    border: `1px solid ${TEAL}`, fontSize: 13, fontFamily: FONT,
                    color: TEXT, outline: "none", background: CONTENT_BG,
                  }}
                />
                <button type="button" onClick={() => void handleCreateFolder()} style={{ ...iconBtnStyle(TEAL), width: 28, height: 28 }}><IconCheck /></button>
                <button type="button" onClick={() => { setCreatingFolder(false); setNewFolderName("") }} style={{ ...iconBtnStyle(MUTED), width: 28, height: 28 }}><IconX /></button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCreatingFolder(true)}
                style={{ ...iconBtnStyle(TEAL), width: 28, height: 28 }}
                title="New folder"
              >
                <IconFolderSmall />
              </button>
            )}
          </div>

          {/* Folder list */}
          <div style={{ flex: 1, overflowY: "auto", padding: "10px 10px" }}>

            {/* Root row */}
            <div
              onDragOver={e => { if (draggingFileId && currentFolderId) { e.preventDefault(); setDragOverFolderId("root") } }}
              onDragLeave={() => setDragOverFolderId(null)}
              onDrop={e => { e.preventDefault(); void handleFileDrop(null) }}
              onClick={navigateToRoot}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 10px", borderRadius: 8, cursor: "pointer",
                background: dragOverFolderId === "root"
                  ? `${TEAL}18`
                  : !currentFolderId ? `${TEAL}12` : "transparent",
                border: dragOverFolderId === "root" ? `1px solid ${TEAL}` : "1px solid transparent",
                marginBottom: 3,
                transition: "background 0.1s",
              }}
            >
              <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke={!currentFolderId ? TEAL : MUTED} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span style={{ fontSize: 14, fontWeight: !currentFolderId ? 800 : 600, color: !currentFolderId ? TEAL : MUTED, fontFamily: FONT, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                Root
              </span>
              {dragOverFolderId === "root" && (
                <span style={{ fontSize: 11, fontWeight: 800, color: TEAL, fontFamily: FONT }}>Drop</span>
              )}
            </div>

            {/* Folder rows */}
            {folders.map(folder => (
              <div key={folder.id} style={{ marginBottom: 2 }}>
                {editingFolderId === folder.id ? (
                  <div style={{ display: "flex", gap: 4, alignItems: "center", padding: "4px 6px" }}>
                    <input
                      autoFocus
                      value={editingFolderName}
                      onChange={e => setEditingFolderName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") void handleRenameFolder(folder)
                        if (e.key === "Escape") setEditingFolderId(null)
                      }}
                      style={{
                        flex: 1, height: 32, padding: "0 9px", borderRadius: 6,
                        border: `1px solid ${TEAL}`, fontSize: 13, fontFamily: FONT,
                        color: TEXT, outline: "none", background: CONTENT_BG,
                      }}
                    />
                    <button type="button" onClick={() => void handleRenameFolder(folder)} style={{ ...iconBtnStyle(TEAL), width: 28, height: 28 }}><IconCheck /></button>
                    <button type="button" onClick={() => setEditingFolderId(null)} style={{ ...iconBtnStyle(MUTED), width: 28, height: 28 }}><IconX /></button>
                  </div>
                ) : confirmDeleteFolderId === folder.id ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px" }}>
                    <span style={{ fontSize: 13, color: RED, fontWeight: 700, fontFamily: FONT, flex: 1 }}>Delete?</span>
                    <button type="button" onClick={() => void handleDeleteFolder(folder)} style={{ ...iconBtnStyle(RED), width: 28, height: 28 }}><IconCheck /></button>
                    <button type="button" onClick={() => setConfirmDeleteFolderId(null)} style={{ ...iconBtnStyle(MUTED), width: 28, height: 28 }}><IconX /></button>
                  </div>
                ) : (
                  <div
                    onDragOver={e => { if (draggingFileId && currentFolderId !== folder.id) { e.preventDefault(); setDragOverFolderId(folder.id) } }}
                    onDragLeave={() => setDragOverFolderId(null)}
                    onDrop={e => { e.preventDefault(); void handleFileDrop(folder.id) }}
                    className="folder-row"
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "9px 10px", borderRadius: 8, cursor: "pointer",
                      background: dragOverFolderId === folder.id
                        ? `${TEAL}18`
                        : currentFolderId === folder.id ? `${TEAL}12` : "transparent",
                      border: dragOverFolderId === folder.id ? `1px solid ${TEAL}` : "1px solid transparent",
                      transition: "background 0.1s",
                    }}
                  >
                    <div style={{ flexShrink: 0, color: currentFolderId === folder.id ? TEAL : MUTED }} onClick={() => navigateIntoFolder(folder)}>
                      <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => navigateIntoFolder(folder)}>
                      <div style={{ fontSize: 14, fontWeight: currentFolderId === folder.id ? 800 : 600, color: currentFolderId === folder.id ? TEAL : MUTED, fontFamily: FONT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {folder.name}
                      </div>
                      <div style={{ fontSize: 12, color: DIM, fontFamily: FONT, fontWeight: 600, marginTop: 1 }}>
                        {folder.file_count === 1 ? "1 file" : `${folder.file_count} files`}
                      </div>
                    </div>
                    {dragOverFolderId === folder.id ? (
                      <span style={{ fontSize: 11, fontWeight: 800, color: TEAL, fontFamily: FONT, flexShrink: 0 }}>Drop</span>
                    ) : (
                      <div style={{ display: "flex", gap: 2, flexShrink: 0, opacity: 0 }} className="folder-actions">
                        <button type="button" onClick={e => { e.stopPropagation(); setEditingFolderId(folder.id); setEditingFolderName(folder.name) }} style={{ ...iconBtnStyle(MUTED), width: 26, height: 26 }} title="Rename"><IconEdit /></button>
                        <button type="button" onClick={e => { e.stopPropagation(); setConfirmDeleteFolderId(folder.id) }} style={{ ...iconBtnStyle(RED), width: 26, height: 26 }} title="Delete"><IconTrash /></button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* File grid */}
        <div style={{ flex: 1, minWidth: 0, minHeight: 0, overflowY: "auto", padding: 24, display: "grid", gap: 16, alignContent: "start" }}>
          {loading ? (
            <div style={{ background: CARD_BG, border: `1px solid ${CONTENT_BDR}`, borderRadius: 16, padding: 24, color: DIM, fontSize: 14, fontFamily: FONT }}>
              Loading files…
            </div>
          ) : files.length === 0 ? (
            <div style={{ background: CARD_BG, border: `1px solid ${CONTENT_BDR}`, borderRadius: 16, padding: 24, color: DIM, fontSize: 14, fontFamily: FONT }}>
              {currentFolderId ? "This folder is empty." : "No files yet."}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14, alignItems: "start" }}>
              {/* File cards */}
            {files.map(file => {
              const col = collections.find(c => c.id === file.collection)
              const colColor = collectionColor(col)

              return (
                <div
                  key={file.id}
                  draggable
                  onDragStart={() => setDraggingFileId(file.id)}
                  onDragEnd={() => { setDraggingFileId(null); setDragOverFolderId(null) }}
                  style={{
                    background: CARD_BG,
                    border: `1px solid ${CONTENT_BDR}`,
                    borderRadius: 14,
                    overflow: "hidden",
                    fontFamily: FONT,
                    boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
                    opacity: draggingFileId === file.id ? 0.45 : 1,
                    transform: draggingFileId === file.id ? "scale(0.97)" : "scale(1)",
                    transition: "opacity 0.15s, transform 0.15s",
                    cursor: "grab",
                  }}
                >
                  <div
                    onClick={() => isAudio(file.mime_type) ? handlePlayPause(file) : void handleOpen(file)}
                    style={{
                      height: 150,
                      background: "#f1f5f9",
                      cursor: isVideo(file.mime_type) ? "default" : "pointer",
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    <FilePreview file={file} />
                    {isAudio(file.mime_type) && file.signedUrl && (
                      <>
                        <audio
                          ref={el => { audioRefs.current[file.id] = el }}
                          src={file.signedUrl}
                          onEnded={() => setPlayingId(null)}
                          style={{ display: "none" }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            alignItems: "flex-end",
                            justifyContent: "flex-start",
                            padding: 10,
                            background: "rgba(0,0,0,0)",
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,0.06)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,0,0,0)")}
                        >
                          <div
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: "50%",
                              background: TEAL,
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: "0 2px 12px rgba(91,149,167,0.45)",
                              opacity: playingId === file.id ? 1 : 0.88,
                              transform: playingId === file.id ? "scale(1.08)" : "scale(1)",
                              transition: "opacity 0.15s, transform 0.15s",
                            }}
                          >
                            {playingId === file.id ? <IconPause /> : <IconPlay />}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div style={{ padding: 12, display: "grid", gap: 8 }}>
                    {editingId === file.id ? (
                      <div style={{ display: "grid", gap: 6 }}>
                        <input
                          autoFocus
                          value={editingTitle}
                          onChange={e => setEditingTitle(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter") void commitEdit(file)
                            if (e.key === "Escape") setEditingId(null)
                          }}
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            height: 28,
                            padding: "0 8px",
                            borderRadius: 6,
                            border: `1px solid ${TEAL}`,
                            fontSize: 13,
                            fontFamily: FONT,
                            color: TEXT,
                            outline: "none",
                            background: CARD_BG,
                          }}
                        />
                        <CollectionPicker
                          collections={collections}
                          value={editingCollection}
                          onChange={setEditingCollection}
                          onCreateNew={onCollectionCreated}
                        />
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => void commitEdit(file)}
                            style={{ ...iconBtnStyle(TEAL), flex: 1, width: "auto" }}
                            title="Save"
                          >
                            <IconCheck />
                            <span style={{ fontSize: 11, fontWeight: 700, fontFamily: FONT, marginLeft: 4 }}>Save</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            style={{ ...iconBtnStyle(MUTED), flex: 1, width: "auto" }}
                            title="Cancel"
                          >
                            <IconX />
                            <span style={{ fontSize: 11, fontWeight: 700, fontFamily: FONT, marginLeft: 4 }}>Cancel</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        title={file.title}
                        style={{
                          fontSize: 13,
                          fontWeight: 850,
                          color: TEXT,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {file.title}
                      </div>
                    )}

                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                      {col && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            minWidth: 0,
                            maxWidth: "100%",
                            padding: "4px 8px",
                            borderRadius: 999,
                            background: "#f8fafc",
                            border: `1px solid ${CONTENT_BDR}`,
                            color: MUTED,
                            fontSize: 11,
                            fontWeight: 800,
                          }}
                        >
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              background: colColor ?? TEAL,
                              flexShrink: 0,
                            }}
                          />

                          <span
                            style={{
                              minWidth: 0,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {col.name}
                          </span>
                        </span>
                      )}

                      <span style={{ fontSize: 11, color: DIM, fontWeight: 700 }}>
                        {formatBytes(file.size_bytes)}
                      </span>

                      <span style={{ fontSize: 11, color: DIM, fontWeight: 700 }}>
                        {timeAgo(file.created_at)}
                      </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 4, alignItems: "center" }}>
                      {confirmDeleteId === file.id ? (
                        <>
                          <span style={{ fontSize: 11, color: RED, fontFamily: FONT, fontWeight: 700, marginRight: 4 }}>
                            Delete?
                          </span>
                          <button
                            type="button"
                            onClick={() => void handleDelete(file)}
                            style={iconBtnStyle(RED)}
                            title="Confirm delete"
                          >
                            <IconCheck />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            style={iconBtnStyle(MUTED)}
                            title="Cancel"
                          >
                            <IconX />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); void handleDownload(file) }}
                            style={iconBtnStyle(MUTED)}
                            title="Download"
                          >
                            <IconDownload />
                          </button>
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); startEdit(file) }}
                            style={iconBtnStyle(MUTED)}
                            title="Rename"
                          >
                            <IconEdit />
                          </button>
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation()
                              setConfirmDeleteId(file.id)
                              setEditingId(null)
                            }}
                            style={iconBtnStyle(RED)}
                            title="Delete"
                          >
                            <IconTrash />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      </div>

      {previewFile && isImage(previewFile.mime_type) && previewFile.signedUrl && (
        <div
          onClick={() => setPreviewFile(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(15,23,42,0.78)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            boxSizing: "border-box",
          }}
        >
          <button
            type="button"
            onClick={e => {
              e.stopPropagation()
              setPreviewFile(null)
            }}
            style={{
              position: "fixed",
              top: 18,
              right: 18,
              width: 38,
              height: 38,
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.35)",
              background: "rgba(15,23,42,0.75)",
              color: "#fff",
              fontSize: 22,
              lineHeight: "34px",
              fontWeight: 800,
              cursor: "pointer",
            }}
            aria-label="Close preview"
          >
            ×
          </button>

          <button
            type="button"
            onClick={e => {
              e.stopPropagation()
              void handleDownload(previewFile)
            }}
            style={{
              position: "fixed",
              top: 18,
              right: 66,
              width: 38,
              height: 38,
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.35)",
              background: "rgba(15,23,42,0.75)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
            aria-label="Download"
          >
            <IconDownload />
          </button>

          <img
            src={previewFile.signedUrl}
            alt={previewFile.title}
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: "92vw",
              maxHeight: "88vh",
              objectFit: "contain",
              borderRadius: 14,
              background: "#fff",
              boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
            }}
          />
        </div>
      )}
    </div>
  )
}