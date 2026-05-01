import { useEffect, useRef, useState } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight"
import { createLowlight } from "lowlight"
import type { SpurPost, SpurCategory, SpurSerial } from "./spurTypes"
import type { SpurTheme } from "./spurTheme"
import { STATUS_CFG_DARK, STATUS_CFG_LIGHT, SPURF, SPURM } from "./spurTheme"
import { slugify } from "./spurHelpers"

const lowlight = createLowlight()

type DiscoveryCategory = { id: string; name: string; parent_id: string | null; sort_order: number }

// ── Custom styled select ───────────────────────────────────────────────────────

// Simple string-options variant for unit label / status pickers
function SpurModalSelect({ value, onChange, options, theme }: {
  value: string
  onChange: (v: string) => void
  options: string[]
  theme: any
}) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: "relative" }}>
      <button type="button" onClick={() => setOpen(v => !v)}
        style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${open ? theme.accent : theme.border}`, outline: "none", padding: "6px 0", fontSize: 14, color: theme.text, fontFamily: SPURF, cursor: "pointer", transition: "border-color 0.12s" }}>
        <span style={{ flex: 1, textAlign: "left" }}>{value.charAt(0).toUpperCase() + value.slice(1)}</span>
        <svg viewBox="0 0 640 640" width={10} height={10} fill={theme.dim} style={{ flexShrink: 0 }}>
          <path d="M199 305C189.6 295.6 189.6 280.4 199 271.1C208.4 261.8 223.6 261.7 232.9 271.1L319.9 358.1L406.9 271.1C416.3 261.7 431.5 261.7 440.8 271.1C450.1 280.5 450.2 295.7 440.8 305L337 409C327.6 418.4 312.4 418.4 303.1 409L199 305z"/>
        </svg>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 299 }} />
          <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 300, background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 8, boxShadow: "0 8px 32px rgba(0,0,0,0.45)", minWidth: "100%", scrollbarWidth: "none" }}>
            {options.map(o => (
              <button key={o} type="button" onClick={() => { onChange(o); setOpen(false) }}
                style={{ display: "flex", alignItems: "center", width: "100%", padding: "9px 14px", background: o === value ? theme.accentDim : "none", border: "none", color: o === value ? theme.accent : theme.text, fontSize: 13, fontFamily: SPURF, cursor: "pointer", textAlign: "left" }}
                onMouseEnter={e => { if (o !== value) e.currentTarget.style.background = theme.borderLight }}
                onMouseLeave={e => { if (o !== value) e.currentTarget.style.background = "none" }}>
                {o.charAt(0).toUpperCase() + o.slice(1)}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function SpurSelect({ value, onChange, options, placeholder, disabled, theme }: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string; color?: string }[]
  placeholder: string
  disabled?: boolean
  theme: any
}) {
  const [open, setOpen] = useState(false)
  const selected = options.find(o => o.value === value)
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(v => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 12px",
          background: theme.surface,
          border: `1px solid ${open ? theme.accent : theme.border}`,
          borderRadius: 8,
          color: selected ? theme.text : theme.muted,
          fontSize: 13, fontFamily: SPURF,
          cursor: disabled ? "default" : "pointer",
          opacity: disabled ? 0.4 : 1,
          transition: "border-color 0.12s",
          whiteSpace: "nowrap",
          minWidth: 160,
        }}
      >
        {selected?.color && <span style={{ width: 10, height: 10, borderRadius: "50%", background: selected.color, flexShrink: 0 }} />}
        <span style={{ flex: 1, textAlign: "left" }}>{selected?.label ?? placeholder}</span>
        <svg viewBox="0 0 640 640" width={11} height={11} fill={theme.dim} style={{ flexShrink: 0 }}>
          <path d="M199 305C189.6 295.6 189.6 280.4 199 271.1C208.4 261.8 223.6 261.7 232.9 271.1L319.9 358.1L406.9 271.1C416.3 261.7 431.5 261.7 440.8 271.1C450.1 280.5 450.2 295.7 440.8 305L337 409C327.6 418.4 312.4 418.4 303.1 409L199 305z"/>
        </svg>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 99 }} />
          <div className="spur-select-dropdown" style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 100, background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 8, boxShadow: "0 8px 32px rgba(0,0,0,0.45)", minWidth: "100%", maxHeight: 280, overflowY: "auto", scrollbarWidth: "none" }}>
            <button type="button" onClick={() => { onChange(""); setOpen(false) }}
              style={{ display: "flex", alignItems: "center", width: "100%", padding: "9px 14px", background: "none", border: "none", borderBottom: `1px solid ${theme.borderLight}`, color: theme.muted, fontSize: 13, fontFamily: SPURF, cursor: "pointer", textAlign: "left" }}
              onMouseEnter={e => e.currentTarget.style.background = theme.borderLight}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
            >{placeholder}</button>
            {options.map(opt => (
              <button key={opt.value} type="button" onClick={() => { onChange(opt.value); setOpen(false) }}
                style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 14px", background: opt.value === value ? theme.accentDim : "none", border: "none", color: opt.value === value ? theme.accent : theme.text, fontSize: 13, fontFamily: SPURF, cursor: "pointer", textAlign: "left" }}
                onMouseEnter={e => { if (opt.value !== value) e.currentTarget.style.background = theme.borderLight }}
                onMouseLeave={e => { if (opt.value !== value) e.currentTarget.style.background = "none" }}
              >
                {opt.color && <span style={{ width: 10, height: 10, borderRadius: "50%", background: opt.color, flexShrink: 0 }} />}
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function countWords(html: string): number {
  return html.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length
}

export function SpurPostEditor({
  post,
  siteId,
  userId,
  supabase,
  onSaved,
  onCancel,
  onNavigate,
  serialPosts,
  onReorder,
  theme,
  darkMode,
  canDraft,
  canPublish,
  canSchedule,
}: {
  post: SpurPost | null
  siteId: string
  userId: string
  supabase: any
  onSaved: (post: SpurPost) => void
  onCancel: () => void
  onNavigate?: (post: SpurPost) => void
  serialPosts?: SpurPost[]
  onReorder?: (posts: SpurPost[]) => void
  theme: SpurTheme
  darkMode: boolean
  canDraft: boolean
  canPublish: boolean
  canSchedule: boolean
}) {
  const [title, setTitle] = useState(post?.title ?? "")
  const [slug, setSlug] = useState(post?.slug ?? "")
  const [slugManual, setSlugManual] = useState(!!post)
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "")
  const [status, setStatus] = useState<"draft" | "published" | "scheduled">(post?.status ?? "draft")
  const [tags, setTags] = useState<string[]>(post?.tags ?? [])
  const [tagInput, setTagInput] = useState("")
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(post?.thumbnail_url ?? null)
  const [thumbUploading, setThumbUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const thumbInputRef = useRef<HTMLInputElement>(null)
  const existingPost = (post ?? null) as any
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoSavedPostId = useRef<string | null>(post?.id ?? null)
  const [autoSaving, setAutoSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [discoveryEnabled, setDiscoveryEnabled] = useState<boolean>(!!existingPost?.is_in_discovery)
  const [discoveryChannelId, setDiscoveryChannelId] = useState<string>("")
  const [discoveryCategoryId, setDiscoveryCategoryId] = useState<string>(existingPost?.discovery_category_id ?? "")
  const [discoveryRows, setDiscoveryRows] = useState<DiscoveryCategory[]>([])
  const [categories, setCategories] = useState<SpurCategory[]>([])
  const [categoryId, setCategoryId] = useState<string>(existingPost?.category_id ?? "")
  const [serials, setSerials] = useState<SpurSerial[]>([])
  const [isSerial, setIsSerial] = useState<boolean>(!!existingPost?.is_serial)
  const [serialId, setSerialId] = useState<string>(existingPost?.serial_id ?? "")
  const [wordCount, setWordCount] = useState(0)
  const [orderedChapters, setOrderedChapters] = useState<SpurPost[]>(() =>
    (serialPosts ?? []).slice().sort((a, b) => (a.serial_index ?? 0) - (b.serial_index ?? 0))
  )
  const [reordering, setReordering] = useState(false)
  const [railVisible, setRailVisible] = useState(true)
  const dragIndex = useRef<number | null>(null)
  const dragOverIndex = useRef<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  const [serialModalOpen, setSerialModalOpen] = useState(false)
  const [serialModalTitle, setSerialModalTitle] = useState("")
  const [serialModalDesc, setSerialModalDesc] = useState("")
  const [serialModalUnitLabel, setSerialModalUnitLabel] = useState("Chapter")
  const [serialModalStatus, setSerialModalStatus] = useState("ongoing")
  const [serialModalCover, setSerialModalCover] = useState<string | null>(null)
  const [serialModalCoverUploading, setSerialModalCoverUploading] = useState(false)
  const [serialModalSaving, setSerialModalSaving] = useState(false)
  const [serialModalError, setSerialModalError] = useState<string | null>(null)
  const serialModalCoverRef = useRef<HTMLInputElement>(null)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [categoryModalName, setCategoryModalName] = useState("")
  const [categoryModalSaving, setCategoryModalSaving] = useState(false)
  const [categoryModalError, setCategoryModalError] = useState<string | null>(null)

  useEffect(() => {
    supabase.from("spur_categories").select("*").eq("site_id", siteId).order("name")
      .then(({ data }: any) => { if (data) setCategories(data) })
    supabase.from("spur_discovery_categories").select("id, name, parent_id, sort_order").eq("is_active", true).order("sort_order")
      .then(({ data }: any) => {
        if (!data) return
        setDiscoveryRows(data)
        if (existingPost?.discovery_category_id) {
          const sub = data.find((r: DiscoveryCategory) => r.id === existingPost.discovery_category_id)
          if (sub?.parent_id) setDiscoveryChannelId(sub.parent_id)
        }
      })
    supabase
      .from("spur_serials")
      .select("*")
      .eq("site_id", siteId)
      .then(({ data }: any) => {
        if (data) setSerials(data)
      })
  }, [siteId])

  async function handleSerialChange(v: string) {
    setSerialId(v)
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Tell your story…" }),
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content: post?.content ?? "",
  })

  useEffect(() => {
    setOrderedChapters((serialPosts ?? []).slice().sort((a, b) => (a.serial_index ?? 0) - (b.serial_index ?? 0)))
  }, [serialPosts])

  async function handleAutoSave() {
    if (!title.trim() || !canDraft) return
    setAutoSaving(true)
    try {
      const content = editor?.getHTML() ?? ""
      const nextSlug = slug.trim() || slugify(title)
      const payload = {
        site_id: siteId,
        author_id: userId,
        title: title.trim(),
        slug: nextSlug,
        excerpt: excerpt.trim() || null,
        content,
        status: "draft" as const,
        tags,
        thumbnail_url: thumbnailUrl,
        category_id: categoryId || null,
        is_serial: isSerial,
        serial_id: isSerial ? serialId : null,
        updated_at: new Date().toISOString(),
      }
      if (autoSavedPostId.current) {
        await supabase.from("spur_posts").update(payload).eq("id", autoSavedPostId.current)
      } else {
        const { data, error: e } = await supabase.from("spur_posts").insert(payload).select().single()
        if (!e && data) autoSavedPostId.current = data.id
      }
      setLastSaved(new Date())
    } catch {
      // silent
    } finally {
      setAutoSaving(false)
    }
  }

  function scheduleAutoSave() {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(handleAutoSave, 3000)
  }

  useEffect(() => {
    if (!editor) return
    editor.on("update", scheduleAutoSave)
    return () => { editor.off("update", scheduleAutoSave) }
  }, [editor])

  useEffect(() => {
    if (!editor) return
    const updateCount = () => setWordCount(countWords(editor.getHTML()))
    updateCount()
    editor.on("update", updateCount)
    return () => { editor.off("update", updateCount) }
  }, [editor])

  useEffect(() => {
    scheduleAutoSave()
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current) }
  }, [title, slug, excerpt, tags])

  async function handleDrop() {
    const from = dragIndex.current
    const to = dragOverIndex.current
    dragIndex.current = null
    dragOverIndex.current = null
    setDragOverIdx(null)
    if (from === null || to === null || from === to) return
    const next = orderedChapters.slice()
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    const updated = next.map((p, i) => ({ ...p, serial_index: i }))
    setOrderedChapters(updated)
    setReordering(true)
    try {
      await Promise.all(
        updated.map(p => supabase.from("spur_posts").update({ serial_index: p.serial_index }).eq("id", p.id))
      )
      onReorder?.(updated)
    } catch {
      // silent
    } finally {
      setReordering(false)
    }
  }

  async function handleSerialCoverUpload(file: File) {
    setSerialModalCoverUploading(true)
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase()
      const safeExt = ["jpg", "jpeg", "png", "webp"].includes(ext) ? ext : "jpg"
      const path = `serial-covers/${siteId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`
      const { error: upErr } = await supabase.storage.from("spur-media").upload(path, file, { upsert: false, contentType: `image/${safeExt === "jpg" ? "jpeg" : safeExt}` })
      if (upErr) throw new Error(upErr.message)
      const { data: { publicUrl } } = supabase.storage.from("spur-media").getPublicUrl(path)
      setSerialModalCover(publicUrl)
    } catch (err: any) {
      setSerialModalError(err.message ?? "Cover upload failed.")
    } finally {
      setSerialModalCoverUploading(false)
    }
  }

  async function handleCreateSerial() {
    if (!serialModalTitle.trim()) { setSerialModalError("Title is required."); return }
    setSerialModalSaving(true); setSerialModalError(null)
    try {
      const { data, error } = await supabase.from("spur_serials").insert({
        site_id: siteId,
        author_id: userId,
        title: serialModalTitle.trim(),
        description: serialModalDesc.trim() || null,
        unit_label: serialModalUnitLabel,
        status: serialModalStatus,
        cover_image_url: serialModalCover,
      }).select().single()
      if (error) throw new Error(error.message)
      setSerials(prev => [...prev, data])
      setSerialId(data.id)
      setIsSerial(true)
      setSerialModalOpen(false)
      setSerialModalTitle("")
      setSerialModalDesc("")
      setSerialModalCover(null)
    } catch (err: any) {
      setSerialModalError(err.message ?? "Failed to create serial.")
    } finally {
      setSerialModalSaving(false)
    }
  }

  async function handleCreateCategory() {
    if (!categoryModalName.trim()) { setCategoryModalError("Name is required."); return }
    setCategoryModalSaving(true); setCategoryModalError(null)
    try {
      const slug = categoryModalName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
      const { data, error } = await supabase.from("spur_categories").insert({
        site_id: siteId,
        name: categoryModalName.trim(),
        slug,
        color: "#f29106",
      }).select().single()
      if (error) throw new Error(error.message)
      setCategories(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      setCategoryId(data.id)
      setCategoryModalOpen(false)
      setCategoryModalName("")
    } catch (err: any) {
      setCategoryModalError(err.message ?? "Failed to create category.")
    } finally {
      setCategoryModalSaving(false)
    }
  }

  function handleTitleChange(val: string) {
    setTitle(val)
    if (!slugManual) setSlug(slugify(val))
  }

  function handleTagKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      const tag = tagInput.trim().toLowerCase().replace(/^#/, "")
      if (tag && !tags.includes(tag) && tags.length < 3) setTags(prev => [...prev, tag])
      setTagInput("")
    }
    if (e.key === "Backspace" && !tagInput && tags.length > 0) setTags(prev => prev.slice(0, -1))
  }

  async function handleThumbUpload(file: File) {
    setThumbUploading(true); setError(null)
    try {
      const TARGET_W = 680, TARGET_H = 383
      const resized = await new Promise<Blob>((resolve, reject) => {
        const img = new window.Image()
        img.onload = () => {
          const canvas = document.createElement("canvas")
          canvas.width = TARGET_W; canvas.height = TARGET_H
          const ctx = canvas.getContext("2d")!
          const srcAR = img.width / img.height
          const tgtAR = TARGET_W / TARGET_H
          let sx = 0, sy = 0, sw = img.width, sh = img.height
          if (srcAR > tgtAR) { sw = img.height * tgtAR; sx = (img.width - sw) / 2 }
          else { sh = img.width / tgtAR; sy = (img.height - sh) / 2 }
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, TARGET_W, TARGET_H)
          canvas.toBlob(b => b ? resolve(b) : reject(new Error("Canvas failed")), "image/jpeg", 0.88)
        }
        img.onerror = reject
        img.src = URL.createObjectURL(file)
      })
      const path = `thumbnails/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
      const { error: upErr } = await supabase.storage.from("spur-media").upload(path, resized, { upsert: false, contentType: "image/jpeg" })
      if (upErr) throw new Error(upErr.message)
      const { data: { publicUrl } } = supabase.storage.from("spur-media").getPublicUrl(path)
      setThumbnailUrl(publicUrl)
    } catch (err: any) { setError(err.message ?? "Upload failed.") }
    finally { setThumbUploading(false) }
  }

  function handlePrint() {
    const win = window.open("", "_blank")
    if (!win) return
    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title || "Draft"}</title>
  <style>
    body { line-height: 3; margin: 1in; }
  </style>
</head>
<body>
  <h1>${title || "Untitled"}</h1>
  ${editor?.getHTML() ?? ""}
</body>
</html>`)
    win.document.close()
    win.focus()
    win.onafterprint = () => win.close()
    win.print()
  }

  async function handleSave() {
    if (!title.trim()) { setError("Title is required."); return }
    if (!canDraft) {
      setError("You do not have permission to create or edit drafts.")
      return
    }

    if (status === "published" && !canPublish) {
      setError("You do not have permission to publish.")
      return
    }

    if (status === "scheduled" && !canSchedule) {
      setError("You do not have permission to schedule posts.")
      return
    }
    if (status === "published" && !thumbnailUrl) { setError("A thumbnail is required before publishing."); return }
    if (discoveryEnabled && !discoveryChannelId) { setError("Choose a discovery channel."); return }
    if (discoveryEnabled && !discoveryCategoryId) { setError("Choose a channel category."); return }

    setSaving(true); setError(null)
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    try {
      const content = editor?.getHTML() ?? ""
      const nextSlug = slug.trim() || slugify(title)

      let nextSerialIndex: number | null = null
      if (isSerial && serialId) {
        if (post?.serial_id === serialId && post?.serial_index != null) {
          nextSerialIndex = post.serial_index
        } else {
          const { data: idxData } = await supabase
            .from("spur_posts")
            .select("serial_index")
            .eq("serial_id", serialId)
            .order("serial_index", { ascending: false })
            .limit(1)
          const max = (idxData as any)?.[0]?.serial_index ?? -1
          nextSerialIndex = max + 1
        }
      }

      const payload = {
        site_id: siteId,
        author_id: userId,
        title: title.trim(),
        slug: nextSlug,
        excerpt: excerpt.trim() || null,
        content,
        thumbnail_url: thumbnailUrl,
        status,
        tags,
        category_id: categoryId || null,
        is_in_discovery: discoveryEnabled,
        discovery_category_id: discoveryEnabled ? discoveryCategoryId : null,
        content_meta: {
          has_images: /<img/.test(content),
          has_code: /<code/.test(content),
          has_links: /<a\s/.test(content),
        },
        published_at: status === "published" ? (post?.published_at ?? new Date().toISOString()) : null,
        updated_at: new Date().toISOString(),
        is_serial: isSerial,
        serial_id: isSerial ? serialId : null,
        serial_index: nextSerialIndex,
      }

      let saved: SpurPost

      if (post) {
        const { data, error: e } = await supabase
          .from("spur_posts")
          .update(payload)
          .eq("id", post.id)
          .select()
          .single()

        if (e) throw new Error(e.message)
        saved = data
      } else {
        const { data, error: e } = await supabase
          .from("spur_posts")
          .insert(payload)
          .select()
          .single()

        if (e) throw new Error(e.code === "23505" ? `Slug "${nextSlug}" already used.` : e.message)
        saved = data
      }

      onSaved(saved)
      autoSavedPostId.current = saved.id
      setLastSaved(new Date())
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const stCfg = darkMode ? STATUS_CFG_DARK : STATUS_CFG_LIGHT
  const canvasBg = darkMode ? "#060c16" : "#f8f8f8"
  const canvasBorder = darkMode ? theme.border : "#c8d8ee"

  const TB = ({ onClick, active, title: ttl, children }: { onClick?: () => void; active?: boolean; title: string; children: React.ReactNode }) => {
    const [hov, setHov] = useState(false)
    return (
      <button type="button" onClick={onClick} title={ttl}
        onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{ flex: 1, height: 40, display: "flex", alignItems: "center", justifyContent: "center", border: "none", borderRadius: 0, cursor: "pointer", background: active ? theme.accentDim : hov ? (darkMode ? "#ffffff08" : "#00000006") : "transparent", color: active ? theme.accent : hov ? theme.text : theme.muted, transition: "background 0.1s, color 0.1s" }}>
        {children}
      </button>
    )
  }

  const TSep = () => <div style={{ width: 1, height: 18, background: canvasBorder, flexShrink: 0, alignSelf: "center", margin: "0 1px" }} />

  const showChapterRail = !!(isSerial && serialId && serialPosts && serialPosts.length > 0 && onNavigate)
  const serialTotalWords = serialPosts ? serialPosts.reduce((acc, p) => acc + countWords(p.content ?? ""), 0) : 0

  return (
    <div style={{ display: "flex", height: "100%", background: theme.bg, fontFamily: SPURF }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Geist+Mono:wght@400;500&display=swap');
        .spur-editor .ProseMirror { outline: none; min-height: 520px; font-family: "Lora", Georgia, serif; font-size: 19px; line-height: 1.9; color: ${theme.text}; caret-color: ${theme.accent}; }
        .spur-editor .ProseMirror > * + * { margin-top: 0.9em; }
        .spur-editor .ProseMirror p { margin: 0; }
        .spur-editor .ProseMirror h1 { font-family: "Geist", system-ui, sans-serif; font-size: 1.9em; font-weight: 800; line-height: 1.15; color: ${theme.text}; letter-spacing: -0.025em; margin-bottom: 0.2em; }
        .spur-editor .ProseMirror h2 { font-family: "Geist", system-ui, sans-serif; font-size: 1.4em; font-weight: 700; line-height: 1.25; color: ${theme.text}; letter-spacing: -0.02em; margin-bottom: 0.2em; }
        .spur-editor .ProseMirror h3 { font-family: "Geist", system-ui, sans-serif; font-size: 1.1em; font-weight: 700; line-height: 1.35; color: ${theme.text}; letter-spacing: -0.01em; margin-bottom: 0.2em; }
        .spur-editor .ProseMirror blockquote { border-left: 3px solid ${theme.accent}; padding: 4px 0 4px 22px; color: ${theme.muted}; font-style: italic; font-size: 1.05em; margin: 1.2em 0; }
        .spur-editor .ProseMirror ul { list-style: disc outside; padding-left: 26px; margin: 0.75em 0; }
        .spur-editor .ProseMirror ol { list-style: decimal outside; padding-left: 26px; margin: 0.75em 0; }
        .spur-editor .ProseMirror li { display: list-item; }
        .spur-editor .ProseMirror li + li { margin-top: 0.3em; }
        .spur-editor .ProseMirror code { background: ${theme.border}55; padding: 2px 6px; border-radius: 4px; font-size: 0.85em; font-family: "Geist Mono", monospace; color: ${theme.accent}; }
        .spur-editor .ProseMirror pre { background: ${darkMode ? "#040810" : "#f5f2ec"}; padding: 20px 24px; border-radius: 8px; overflow-x: auto; border: 1px solid ${canvasBorder}; margin: 1em 0; }
        .spur-editor .ProseMirror pre code { background: none; color: ${theme.text}; padding: 0; font-size: 14px; }
        .spur-editor .ProseMirror img { max-width: 100%; border-radius: 8px; }
        .spur-editor .ProseMirror a { color: ${theme.accent}; text-decoration: underline; text-underline-offset: 3px; }
        .spur-editor .ProseMirror hr { border: none; border-top: 1px solid ${canvasBorder}; margin: 2em 0; }
        .spur-editor .ProseMirror strong { font-weight: 600; }
        .spur-editor .ProseMirror em { font-style: italic; }
        .spur-editor .ProseMirror p.is-editor-empty:first-child::before { content: attr(data-placeholder); color: ${theme.dim}; pointer-events: none; float: left; height: 0; font-style: italic; font-family: "Lora", Georgia, serif; }
        .spur-select-dropdown::-webkit-scrollbar { display: none; }
        .spur-chapter-rail::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Chapter rail */}
      {showChapterRail && railVisible && (
        <div className="spur-chapter-rail" style={{ width: 320, flexShrink: 0, borderRight: `1px solid ${theme.border}`, background: theme.surface, display: "flex", flexDirection: "column", overflowY: "auto", scrollbarWidth: "none" }}>
          <div style={{ padding: "20px 20px 12px", borderBottom: `1px solid ${theme.borderLight}` }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: theme.text, fontFamily: SPURF, marginBottom: 4 }}>
              {serials.find(s => s.id === serialId)?.title ?? "Serial"}
            </div>
            <div style={{ fontSize: 14, color: theme.muted, fontFamily: SPURF }}>
              {reordering ? "Saving order…" : `${serialTotalWords.toLocaleString()} words total`}
            </div>
          </div>
          <div style={{ flex: 1, padding: "6px 0" }}>
            {orderedChapters.map((p, i) => {
              const isActive = p.id === post?.id
              const wc = countWords(p.content ?? "")
              const isDragOver = dragOverIdx === i
              return (
                <div
                  key={p.id}
                  draggable
                  onDragStart={() => { dragIndex.current = i }}
                  onDragOver={e => { e.preventDefault(); dragOverIndex.current = i; setDragOverIdx(i) }}
                  onDragEnd={() => { dragIndex.current = null; dragOverIndex.current = null; setDragOverIdx(null) }}
                  onDrop={handleDrop}
                  style={{ borderTop: isDragOver ? `2px solid ${theme.accent}` : "2px solid transparent", transition: "border-color 0.1s" }}
                >
                  <button
                    type="button"
                    onClick={() => !isActive && onNavigate!(p)}
                    style={{
                      display: "block", width: "100%", textAlign: "left", padding: "12px 20px",
                      background: isActive ? theme.accentDim : "transparent",
                      border: "none", borderLeft: `3px solid ${isActive ? theme.accent : "transparent"}`,
                      cursor: isActive ? "default" : "grab",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = theme.borderLight }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent" }}
                  >
                    <div style={{ fontSize: 15, fontWeight: isActive ? 600 : 400, color: isActive ? theme.accent : theme.text, fontFamily: SPURF, lineHeight: 1.4, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "flex", alignItems: "baseline" }}>
                      <span style={{ color: theme.muted, marginRight: 10, flexShrink: 0 }}>{i + 1}</span>{p.title || "Untitled"}
                    </div>
                    <div style={{ fontSize: 13, color: theme.muted, fontFamily: SPURF }}>
                      {wc.toLocaleString()} words
                    </div>
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Main editor column */}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>

      {/* Top chrome */}
      {/* Top chrome */}
      <div
        style={{
          flexShrink: 0,
          height: 52,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 20px 0 28px",
          background: theme.surface,
          borderBottom: `1px solid ${theme.border}`,
        }}
      >
        {showChapterRail && (
          <button type="button" onClick={() => setRailVisible(v => !v)} title={railVisible ? "Hide chapters" : "Show chapters"}
            style={{ background: "none", border: "none", cursor: "pointer", color: theme.dim, padding: "4px 6px", display: "flex", alignItems: "center", gap: 6, flexShrink: 0, fontSize: 11, fontFamily: SPURM, transition: "color 0.1s" }}
            onMouseEnter={e => e.currentTarget.style.color = theme.text}
            onMouseLeave={e => e.currentTarget.style.color = theme.dim}>
            <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              {railVisible ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
            </svg>
            {railVisible ? "Hide" : "Chapters"}
          </button>
        )}
        <div style={{ flex: 1 }} />

        <div style={{ fontSize: 11, color: theme.dim, fontFamily: SPURF, minWidth: 80, textAlign: "right", flexShrink: 0 }}>
          {autoSaving ? "Saving…" : lastSaved ? `Saved ${lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : null}
        </div>

        <button type="button" onClick={handlePrint} title="Print draft"
          style={{ background: "none", border: `1px solid ${theme.border}`, borderRadius: 7, cursor: "pointer", color: theme.muted, padding: "5px 8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "color 0.1s, border-color 0.1s" }}
          onMouseEnter={e => { e.currentTarget.style.color = theme.text; e.currentTarget.style.borderColor = theme.muted }}
          onMouseLeave={e => { e.currentTarget.style.color = theme.muted; e.currentTarget.style.borderColor = theme.border }}>
          <svg viewBox="0 0 640 640" width={15} height={15} fill="currentColor"><path d="M128 0L128 128L64 128C28.7 128 0 156.7 0 192L0 448C0 483.3 28.7 512 64 512L128 512L128 576C128 611.3 156.7 640 192 640L448 640C483.3 640 512 611.3 512 576L512 512L576 512C611.3 512 640 483.3 640 448L640 192C640 156.7 611.3 128 576 128L512 128L512 0L128 0zM176 48L464 48L464 128L176 128L176 48zM176 512L464 512L464 592L176 592L176 512zM112 224C129.7 224 144 238.3 144 256C144 273.7 129.7 288 112 288C94.3 288 80 273.7 80 256C80 238.3 94.3 224 112 224z"/></svg>
        </button>

        {(["draft", "published", "scheduled"] as const).map(s => {
          const cfg = stCfg[s]
          const active = status === s

          const disabled =
            (s === "draft" && !canDraft) ||
            (s === "published" && !canPublish) ||
            (s === "scheduled" && !canSchedule)

          return (
            <button
              key={s}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && setStatus(s)}
              style={{
                padding: "5px 12px",
                borderRadius: 6,
                border: `1px solid ${active ? cfg.border : theme.border}`,
                background: active ? cfg.bg : "transparent",
                color: active ? cfg.color : theme.muted,
                fontSize: 12,
                fontWeight: active ? 600 : 400,
                cursor: disabled ? "default" : "pointer",
                opacity: disabled ? 0.4 : 1,
                fontFamily: SPURF,
                transition: "all 0.1s"
              }}
            >
              {cfg.label}
            </button>
          )
        })}

        <button
          type="button"
          onClick={onCancel}
          aria-label="Close editor"
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            border: `1px solid ${theme.border}`,
            background: "transparent",
            color: theme.muted,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            lineHeight: 1,
            padding: 0,
            flexShrink: 0,
          }}
        >
          ×
        </button>

        <button
          onClick={handleSave}
          disabled={saving || !canDraft}
          style={{
            padding: "7px 20px",
            borderRadius: 7,
            border: "none",
            background: theme.accent,
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            cursor: saving ? "default" : "pointer",
            opacity: saving ? 0.6 : 1,
            fontFamily: SPURF,
            transition: "background 0.15s"
          }}
          onMouseEnter={e => { if (!saving) e.currentTarget.style.background = theme.accentHov }}
          onMouseLeave={e => { e.currentTarget.style.background = theme.accent }}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {/* Scrollable area */}
      <div style={{ flex: 1, overflowY: "auto", background: theme.bg, position: "relative" }}>
        <div style={{ maxWidth: 780, margin: "0 auto", padding: "44px 32px 100px" }}>
          {error && <div style={{ marginBottom: 24, padding: "12px 16px", background: theme.redDim, border: `1px solid ${theme.red}40`, borderRadius: 8, fontSize: 14, color: theme.red, fontFamily: SPURF }}>{error}</div>}

          <textarea value={title} onChange={e => handleTitleChange(e.target.value)} placeholder="Post title" rows={2}
            style={{ width: "100%", border: "none", outline: "none", fontSize: 38, fontWeight: 800, color: theme.text, fontFamily: SPURF, lineHeight: 1.15, background: "transparent", letterSpacing: "-0.03em", marginBottom: 16, resize: "none", overflow: "hidden", display: "block" }}
            onInput={e => { const t = e.currentTarget; t.style.height = "auto"; t.style.height = t.scrollHeight + "px" }} />

          <input ref={thumbInputRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleThumbUpload(f); e.target.value = "" }} />

          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.8fr 1.4fr", gap: 24, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: theme.dim, fontFamily: SPURM, fontWeight: 500, marginBottom: 5 }}>Slug</div>
              <input value={slug} onChange={e => { setSlugManual(true); setSlug(slugify(e.target.value)) }}
                style={{ width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${theme.border}`, outline: "none", padding: "4px 0", fontSize: 12, color: theme.accent, fontFamily: SPURM }} />
            </div>
            <div>
              <div style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: theme.dim, fontFamily: SPURM, fontWeight: 500, marginBottom: 5 }}>Publish date</div>
              <input type="date" defaultValue={post?.published_at ? post.published_at.slice(0, 10) : ""}
                style={{ width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${theme.border}`, outline: "none", padding: "4px 0", fontSize: 12, color: theme.muted, fontFamily: SPURF, colorScheme: darkMode ? "dark" : "light" }} />
            </div>
            <div>
              <div style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: theme.dim, fontFamily: SPURM, fontWeight: 500, marginBottom: 5 }}>
                Thumbnail <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 400, color: theme.dim }}>— 680×383 (16:9)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, borderBottom: `1px solid ${theme.border}`, padding: "4px 0" }}>
                <button onClick={() => thumbInputRef.current?.click()} disabled={thumbUploading}
                  style={{ flexShrink: 0, padding: "2px 10px", borderRadius: 4, border: `1px solid ${theme.border}`, background: "transparent", color: theme.muted, fontFamily: SPURF, fontSize: 11, cursor: thumbUploading ? "default" : "pointer", whiteSpace: "nowrap" }}>
                  {thumbUploading ? "Uploading…" : thumbnailUrl ? "Replace" : "Upload"}
                </button>
                {!thumbnailUrl && <span style={{ fontSize: 10, color: theme.red, fontWeight: 700, whiteSpace: "nowrap" }}>Required</span>}
                {thumbnailUrl && (
                  <>
                    <span style={{ fontSize: 11, color: theme.muted, fontFamily: SPURM, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{thumbnailUrl.split("/").pop()}</span>
                    <button onClick={() => setThumbnailUrl(null)} style={{ flexShrink: 0, background: "none", border: "none", cursor: "pointer", color: theme.dim, fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: theme.dim, fontFamily: SPURM, fontWeight: 500, marginBottom: 5 }}>Excerpt</div>
            <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="A short excerpt shown in post listings…" rows={2}
              style={{ width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${theme.border}`, outline: "none", padding: "5px 0", fontSize: 14, color: theme.muted, fontFamily: SPURF, lineHeight: 1.65, resize: "none" }} />
          </div>

          {/* Category + tags */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 12, borderBottom: `1px solid ${theme.border}`, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <SpurSelect theme={theme}
                  value={categoryId}
                  onChange={setCategoryId}
                  placeholder="Category…"
                  options={categories.map(c => ({ value: c.id, label: c.name, color: c.color }))}
                />
                <button type="button" onClick={() => { setCategoryModalOpen(true); setCategoryModalName(""); setCategoryModalError(null) }}
                  title="New category"
                  style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${theme.border}`, background: "transparent", color: theme.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "color 0.1s, border-color 0.1s" }}
                  onMouseEnter={e => { e.currentTarget.style.color = theme.text; e.currentTarget.style.borderColor = theme.accent }}
                  onMouseLeave={e => { e.currentTarget.style.color = theme.muted; e.currentTarget.style.borderColor = theme.border }}>
                  <svg viewBox="0 0 640 640" width={9} height={9} fill="currentColor"><path d="M320 64C306.7 64 296 74.7 296 88L296 296L88 296C74.7 296 64 306.7 64 320C64 333.3 74.7 344 88 344L296 344L296 552C296 565.3 306.7 576 320 576C333.3 576 344 565.3 344 552L344 344L552 344C565.3 344 576 333.3 576 320C576 306.7 565.3 296 552 296L344 296L344 88C344 74.7 333.3 64 320 64z"/></svg>
                </button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center", flex: 1, minWidth: 0 }}>
                {tags.map(tag => (
                  <span key={tag} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 400, color: theme.accent, background: theme.accentDim, padding: "3px 8px", borderRadius: 4, fontFamily: SPURM, letterSpacing: "0.02em", border: `1px solid ${theme.accent}22` }}>
                    #{tag}
                    <button onClick={() => setTags(p => p.filter(t => t !== tag))} style={{ background: "none", border: "none", cursor: "pointer", color: theme.muted, padding: 0, fontSize: 13, lineHeight: 1 }}>×</button>
                  </span>
                ))}
                {tags.length < 3 && (
                  <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown}
                    placeholder={tags.length === 0 ? "Tags — max 3…" : ""}
                    style={{ background: "transparent", border: "none", outline: "none", fontSize: 13, color: theme.text, fontFamily: SPURM, minWidth: 100, flex: 1 }} />
                )}
              </div>
            </div>
          </div>

          {/* Discovery + Serial row */}
          <div style={{ display: "flex", alignItems: "center", gap: 20, paddingBottom: 16, marginBottom: 20, borderBottom: `1px solid ${theme.border}`, flexWrap: "wrap" }}>

            {/* Discovery toggle */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <button type="button"
                onClick={() => setDiscoveryEnabled(prev => { const next = !prev; if (!next) { setDiscoveryChannelId(""); setDiscoveryCategoryId("") } return next })}
                aria-pressed={discoveryEnabled}
                style={{ width: 34, height: 18, borderRadius: 999, border: `1px solid ${discoveryEnabled ? theme.accent : theme.border}`, background: discoveryEnabled ? theme.accent : "transparent", position: "relative", transition: "all 0.12s", cursor: "pointer", padding: 0, flexShrink: 0 }}>
                <span style={{ position: "absolute", top: 1, left: discoveryEnabled ? 17 : 1, width: 14, height: 14, borderRadius: 999, background: discoveryEnabled ? "#fff" : theme.dim, transition: "left 0.12s, background 0.12s" }} />
              </button>
              <span style={{ fontSize: 12, color: discoveryEnabled ? theme.text : theme.muted, fontFamily: SPURM, whiteSpace: "nowrap", transition: "color 0.12s" }}>Discovery</span>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}
                onMouseEnter={e => (e.currentTarget.querySelector(".disc-tip") as HTMLElement | null)?.style && ((e.currentTarget.querySelector(".disc-tip") as HTMLElement).style.opacity = "1")}
                onMouseLeave={e => (e.currentTarget.querySelector(".disc-tip") as HTMLElement | null)?.style && ((e.currentTarget.querySelector(".disc-tip") as HTMLElement).style.opacity = "0")}>
                <svg viewBox="0 0 640 640" width={13} height={13} fill={theme.dim} style={{ display: "block", cursor: "help", opacity: 0.6 }}>
                  <path d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM288 224C288 206.3 302.3 192 320 192C337.7 192 352 206.3 352 224C352 241.7 337.7 256 320 256C302.3 256 288 241.7 288 224zM280 288L328 288C341.3 288 352 298.7 352 312L352 400L360 400C373.3 400 384 410.7 384 424C384 437.3 373.3 448 360 448L280 448C266.7 448 256 437.3 256 424C256 410.7 266.7 400 280 400L304 400L304 336L280 336C266.7 336 256 325.3 256 312C256 298.7 266.7 288 280 288z"/>
                </svg>
                <div className="disc-tip" style={{ position: "absolute", bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)", zIndex: 20, width: 260, padding: "10px 12px", borderRadius: 8, background: theme.surface, border: `1px solid ${theme.border}`, boxShadow: "0 8px 32px rgba(0,0,0,0.45)", color: theme.muted, fontFamily: SPURF, fontSize: 12, lineHeight: 1.6, pointerEvents: "none", opacity: 0, transition: "opacity 0.12s", whiteSpace: "normal" }}>
                  Include this post in Spur's public discovery feed so readers outside your site can find it.
                </div>
              </div>
            </div>

            {discoveryEnabled && (
              <>
                <SpurSelect theme={theme}
                  value={discoveryChannelId}
                  onChange={v => { setDiscoveryChannelId(v); setDiscoveryCategoryId("") }}
                  placeholder="Channel…"
                  options={discoveryRows.filter(r => !r.parent_id).map(r => ({ value: r.id, label: r.name }))}
                />
                <SpurSelect theme={theme}
                  value={discoveryCategoryId}
                  onChange={setDiscoveryCategoryId}
                  placeholder="Category…"
                  disabled={!discoveryChannelId}
                  options={discoveryRows.filter(r => r.parent_id === discoveryChannelId).map(r => ({ value: r.id, label: r.name }))}
                />
              </>
            )}

            <div style={{ width: 1, height: 16, background: theme.border, flexShrink: 0 }} />

            {/* Serial toggle */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <button type="button"
                onClick={() => {
                  setIsSerial(prev => {
                    const next = !prev
                    if (!next) {
                      setSerialId("")
                    }
                    return next
                  })
                }}
                aria-pressed={isSerial}
                style={{ width: 34, height: 18, borderRadius: 999, border: `1px solid ${isSerial ? theme.accent : theme.border}`, background: isSerial ? theme.accent : "transparent", position: "relative", transition: "all 0.12s", cursor: "pointer", padding: 0, flexShrink: 0 }}>
                <span style={{ position: "absolute", top: 1, left: isSerial ? 17 : 1, width: 14, height: 14, borderRadius: 999, background: isSerial ? "#fff" : theme.dim, transition: "left 0.12s, background 0.12s" }} />
              </button>
              <span style={{ fontSize: 12, color: isSerial ? theme.text : theme.muted, fontFamily: SPURM, whiteSpace: "nowrap", transition: "color 0.12s" }}>Serial</span>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}
                onMouseEnter={e => (e.currentTarget.querySelector(".serial-tip") as HTMLElement | null)?.style && ((e.currentTarget.querySelector(".serial-tip") as HTMLElement).style.opacity = "1")}
                onMouseLeave={e => (e.currentTarget.querySelector(".serial-tip") as HTMLElement | null)?.style && ((e.currentTarget.querySelector(".serial-tip") as HTMLElement).style.opacity = "0")}>
                <svg viewBox="0 0 640 640" width={13} height={13} fill={theme.dim} style={{ display: "block", cursor: "help", opacity: 0.6 }}>
                  <path d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM288 224C288 206.3 302.3 192 320 192C337.7 192 352 206.3 352 224C352 241.7 337.7 256 320 256C302.3 256 288 241.7 288 224zM280 288L328 288C341.3 288 352 298.7 352 312L352 400L360 400C373.3 400 384 410.7 384 424C384 437.3 373.3 448 360 448L280 448C266.7 448 256 437.3 256 424C256 410.7 266.7 400 280 400L304 400L304 336L280 336C266.7 336 256 325.3 256 312C256 298.7 266.7 288 280 288z"/>
                </svg>
                <div className="serial-tip" style={{ position: "absolute", bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)", zIndex: 20, width: 260, padding: "10px 12px", borderRadius: 8, background: theme.surface, border: `1px solid ${theme.border}`, boxShadow: "0 8px 32px rgba(0,0,0,0.45)", color: theme.muted, fontFamily: SPURF, fontSize: 12, lineHeight: 1.6, pointerEvents: "none", opacity: 0, transition: "opacity 0.12s", whiteSpace: "normal" }}>
                  Is this post part of an ongoing series, like a book, podcast, or recurring column?
                </div>
              </div>
            </div>

            {isSerial && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <SpurSelect theme={theme}
                  value={serialId}
                  onChange={handleSerialChange}
                  placeholder="Pick a serial…"
                  options={serials.map(s => ({ value: s.id, label: s.title }))}
                />
                <button type="button" onClick={() => { setSerialModalOpen(true); setSerialModalTitle(""); setSerialModalError(null) }}
                  title="New serial"
                  style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${theme.border}`, background: "transparent", color: theme.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "color 0.1s, border-color 0.1s" }}
                  onMouseEnter={e => { e.currentTarget.style.color = theme.text; e.currentTarget.style.borderColor = theme.accent }}
                  onMouseLeave={e => { e.currentTarget.style.color = theme.muted; e.currentTarget.style.borderColor = theme.border }}>
                  <svg viewBox="0 0 640 640" width={9} height={9} fill="currentColor"><path d="M320 64C306.7 64 296 74.7 296 88L296 296L88 296C74.7 296 64 306.7 64 320C64 333.3 74.7 344 88 344L296 344L296 552C296 565.3 306.7 576 320 576C333.3 576 344 565.3 344 552L344 344L552 344C565.3 344 576 333.3 576 320C576 306.7 565.3 296 552 296L344 296L344 88C344 74.7 333.3 64 320 64z"/></svg>
                </button>
              </div>
            )}
          </div>

          {/* Serial create modal */}
          {serialModalOpen && (
            <>
              <div onClick={() => setSerialModalOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)" }} />
              <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 201, width: 520, maxHeight: "90vh", overflowY: "auto", scrollbarWidth: "none", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 28, boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: theme.dim, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: SPURM, marginBottom: 20 }}>New Serial</div>

                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  {/* Title */}
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: theme.dim, fontFamily: SPURM, fontWeight: 500, marginBottom: 5 }}>Title</div>
                    <input value={serialModalTitle} onChange={e => setSerialModalTitle(e.target.value)}
                      placeholder="Serial title…" autoFocus
                      style={{ width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${theme.border}`, outline: "none", padding: "6px 0", fontSize: 16, fontWeight: 600, color: theme.text, fontFamily: SPURF }} />
                  </div>

                  {/* Description */}
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: theme.dim, fontFamily: SPURM, fontWeight: 500, marginBottom: 5 }}>Description</div>
                    <textarea value={serialModalDesc} onChange={e => setSerialModalDesc(e.target.value)}
                      placeholder="What's this serial about?" rows={2}
                      style={{ width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${theme.border}`, outline: "none", padding: "6px 0", fontSize: 14, color: theme.text, fontFamily: SPURF, resize: "none", lineHeight: 1.6 }} />
                  </div>

                  {/* Unit Label + Status */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: theme.dim, fontFamily: SPURM, fontWeight: 500, marginBottom: 5 }}>Unit Label</div>
                      <SpurModalSelect value={serialModalUnitLabel} onChange={setSerialModalUnitLabel}
                        options={["Chapter","Part","Episode","Issue","Volume","Entry","Installment"]} theme={theme} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: theme.dim, fontFamily: SPURM, fontWeight: 500, marginBottom: 5 }}>Status</div>
                      <SpurModalSelect value={serialModalStatus} onChange={setSerialModalStatus}
                        options={["ongoing","completed","hiatus","cancelled"]} theme={theme} />
                    </div>
                  </div>

                  {/* Cover image */}
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: theme.dim, fontFamily: SPURM, fontWeight: 500, marginBottom: 5 }}>Cover Image</div>
                    <input ref={serialModalCoverRef} type="file" accept="image/*" style={{ display: "none" }}
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleSerialCoverUpload(f); e.target.value = "" }} />
                    {serialModalCover ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <img src={serialModalCover} alt="Cover" style={{ width: 52, height: "auto", borderRadius: 5, border: `1px solid ${theme.border}`, display: "block" }} />
                        <div style={{ display: "flex", gap: 8 }}>
                          <button type="button" onClick={() => serialModalCoverRef.current?.click()} disabled={serialModalCoverUploading}
                            style={{ padding: "5px 12px", borderRadius: 5, border: `1px solid ${theme.border}`, background: "transparent", color: theme.muted, fontSize: 12, fontFamily: SPURF, cursor: "pointer" }}>
                            {serialModalCoverUploading ? "Uploading…" : "Replace"}
                          </button>
                          <button type="button" onClick={() => setSerialModalCover(null)}
                            style={{ padding: "5px 12px", borderRadius: 5, border: `1px solid ${theme.red}44`, background: theme.redDim, color: theme.red, fontSize: 12, fontFamily: SPURF, cursor: "pointer" }}>
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button type="button" onClick={() => serialModalCoverRef.current?.click()} disabled={serialModalCoverUploading}
                        style={{ padding: "7px 14px", borderRadius: 6, border: `1px solid ${theme.border}`, background: "transparent", color: theme.muted, fontSize: 13, fontFamily: SPURF, cursor: "pointer" }}>
                        {serialModalCoverUploading ? "Uploading…" : "Upload Cover"}
                      </button>
                    )}
                  </div>
                </div>

                {serialModalError && (
                  <div style={{ marginTop: 16, padding: "10px 14px", background: theme.redDim, border: `1px solid ${theme.red}40`, borderRadius: 7, fontSize: 13, color: theme.red, fontFamily: SPURF }}>
                    {serialModalError}
                  </div>
                )}

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
                  <button type="button" onClick={() => setSerialModalOpen(false)}
                    style={{ padding: "9px 18px", borderRadius: 7, border: `1px solid ${theme.border}`, background: "transparent", color: theme.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: SPURF }}>
                    Cancel
                  </button>
                  <button type="button" onClick={handleCreateSerial} disabled={serialModalSaving || !serialModalTitle.trim()}
                    style={{ padding: "9px 20px", borderRadius: 7, border: "none", background: serialModalTitle.trim() ? theme.accent : theme.border, color: serialModalTitle.trim() ? "#fff" : theme.dim, fontSize: 13, fontWeight: 700, cursor: serialModalTitle.trim() ? "pointer" : "default", fontFamily: SPURF, transition: "background 0.12s" }}>
                    {serialModalSaving ? "Creating…" : "Create Serial"}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Category create modal */}
          {categoryModalOpen && (
            <>
              <div onClick={() => setCategoryModalOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)" }} />
              <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 201, width: 400, background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 28, boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: theme.dim, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: SPURM, marginBottom: 20 }}>New Category</div>

                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: theme.dim, fontFamily: SPURM, fontWeight: 500, marginBottom: 5 }}>Name</div>
                  <input value={categoryModalName} onChange={e => setCategoryModalName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleCreateCategory()}
                    placeholder="Category name…" autoFocus
                    style={{ width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${theme.border}`, outline: "none", padding: "6px 0", fontSize: 16, fontWeight: 600, color: theme.text, fontFamily: SPURF }} />
                </div>

                {categoryModalError && (
                  <div style={{ marginBottom: 16, padding: "10px 14px", background: theme.redDim, border: `1px solid ${theme.red}40`, borderRadius: 7, fontSize: 13, color: theme.red, fontFamily: SPURF }}>
                    {categoryModalError}
                  </div>
                )}

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button type="button" onClick={() => setCategoryModalOpen(false)}
                    style={{ padding: "9px 18px", borderRadius: 7, border: `1px solid ${theme.border}`, background: "transparent", color: theme.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: SPURF }}>
                    Cancel
                  </button>
                  <button type="button" onClick={handleCreateCategory} disabled={categoryModalSaving || !categoryModalName.trim()}
                    style={{ padding: "9px 20px", borderRadius: 7, border: "none", background: categoryModalName.trim() ? theme.accent : theme.border, color: categoryModalName.trim() ? "#fff" : theme.dim, fontSize: 13, fontWeight: 700, cursor: categoryModalName.trim() ? "pointer" : "default", fontFamily: SPURF, transition: "background 0.12s" }}>
                    {categoryModalSaving ? "Creating…" : "Create Category"}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Editor canvas */}
          <div style={{ background: canvasBg, border: `1px solid ${canvasBorder}`, borderTop: "none", borderRadius: "0 0 10px 10px" }}>
            <div style={{ position: "sticky", top: 0, zIndex: 10, background: canvasBg, borderBottom: `1px solid ${canvasBorder}`, display: "flex", alignItems: "stretch" }}>
              <TB onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive("bold")} title="Bold"><svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h8a4 4 0 010 8H6z"/><path d="M6 12h9a4 4 0 010 8H6z"/></svg></TB>
              <TB onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive("italic")} title="Italic"><svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg></TB>
              <TB onClick={() => editor?.chain().focus().toggleUnderline().run()} active={editor?.isActive("underline")} title="Underline"><svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v7a6 6 0 0012 0V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg></TB>
              <TB onClick={() => editor?.chain().focus().toggleStrike().run()} active={editor?.isActive("strike")} title="Strikethrough"><svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="12" x2="20" y2="12"/><path d="M17.5 6.5C17.5 5 16 4 14 4H10C7.8 4 6 5.8 6 8c0 2 1.5 3 3.5 3.5"/><path d="M6.5 17.5C6.5 19 8 20 10 20h4c2.2 0 4-1.8 4-4 0-1.8-1.2-2.8-3-3.3"/></svg></TB>
              <TSep />
              <TB onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} active={editor?.isActive("heading", { level: 1 })} title="H1"><span style={{ fontSize: 11, fontWeight: 800, fontFamily: SPURF, letterSpacing: "-0.03em", lineHeight: 1 }}>H1</span></TB>
              <TB onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} active={editor?.isActive("heading", { level: 2 })} title="H2"><span style={{ fontSize: 11, fontWeight: 800, fontFamily: SPURF, letterSpacing: "-0.03em", lineHeight: 1 }}>H2</span></TB>
              <TB onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} active={editor?.isActive("heading", { level: 3 })} title="H3"><span style={{ fontSize: 11, fontWeight: 800, fontFamily: SPURF, letterSpacing: "-0.03em", lineHeight: 1 }}>H3</span></TB>
              <TSep />
              <TB onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive("bulletList")} title="Bullet list"><svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.2" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1.2" fill="currentColor" stroke="none"/></svg></TB>
              <TB onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive("orderedList")} title="Numbered list"><svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4M4 10h2" strokeWidth={1.8}/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" strokeWidth={1.8}/></svg></TB>
              <TB onClick={() => editor?.chain().focus().toggleBlockquote().run()} active={editor?.isActive("blockquote")} title="Blockquote"><svg viewBox="0 0 24 24" width={15} height={15} fill="currentColor"><path d="M3 3h7v7H6a3 3 0 003 3v2a5 5 0 01-5-5V3zm11 0h7v7h-4a3 3 0 003 3v2a5 5 0 01-5-5V3z" opacity={0.9}/></svg></TB>
              <TB onClick={() => editor?.chain().focus().toggleCodeBlock().run()} active={editor?.isActive("codeBlock")} title="Code block"><svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg></TB>
              <TSep />
              <TB onClick={() => { if (editor?.isActive("link")) { editor?.chain().focus().unsetLink().run() } else { const url = window.prompt("URL"); if (url) editor?.chain().focus().setLink({ href: url }).run() } }} active={editor?.isActive("link")} title="Link"><svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg></TB>
              <TB onClick={() => { const url = window.prompt("Image URL"); if (url) editor?.chain().focus().setImage({ src: url }).run() }} title="Image"><svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></TB>
              <TB onClick={() => editor?.chain().focus().setHorizontalRule().run()} title="Divider"><svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12"/></svg></TB>
              <TSep />
              <TB onClick={() => editor?.chain().focus().undo().run()} title="Undo"><svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 00-4-4H4"/></svg></TB>
              <TB onClick={() => editor?.chain().focus().redo().run()} title="Redo"><svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 014-4h12"/></svg></TB>
            </div>
            <div className="spur-editor" style={{ padding: "36px 52px 72px" }}>
              <EditorContent editor={editor} />
            </div>
            <div style={{ padding: "10px 52px 14px", borderTop: `1px solid ${canvasBorder}`, display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ fontSize: 11, color: theme.dim, fontFamily: SPURM }}>
                {wordCount.toLocaleString()} words
              </span>
              {showChapterRail && (
                <span style={{ fontSize: 11, color: theme.dim, fontFamily: SPURM }}>
                  · {serialTotalWords.toLocaleString()} total in serial
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
