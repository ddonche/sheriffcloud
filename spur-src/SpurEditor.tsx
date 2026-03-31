import { useEffect, useRef, useState } from "react"
import { Icon } from "./Icons"

// ── Types ──────────────────────────────────────────────────────────────────────

type PublishStatus = "published" | "draft" | "scheduled"
type ContentMeta = "image" | "video" | "code" | "file" | "link" | "audio"

type SpurPost = {
  id: string
  site_id: string
  author_id: string
  title: string
  slug: string
  excerpt: string | null
  content: string | null
  thumbnail_url: string | null
  status: PublishStatus
  tags: string[]
  content_meta: Record<string, boolean>
  published_at: string | null
  created_at: string
  updated_at: string
}

// ── Constants ──────────────────────────────────────────────────────────────────

const FONT = `"DM Sans", "Inter", system-ui, sans-serif`
const FONT_MONO = `"DM Mono", "Fira Code", monospace`

const C = {
  bg:           "#080e1a",
  surface:      "#0d1525",
  surfaceHover: "#121d30",
  border:       "#1e2d47",
  borderLight:  "#162038",
  text:         "#e4eaf4",
  muted:        "#6080a8",
  dim:          "#2a3f5e",
  accent:       "#f29106",
  accentHover:  "#ffaa2e",
  accentDim:    "#f2910620",
  green:        "#2dd98a",
  greenDim:     "#2dd98a20",
  yellow:       "#f5c842",
  yellowDim:    "#f5c84220",
  blue:         "#4a9eff",
  blueDim:      "#4a9eff20",
  red:          "#ef4444",
  redDim:       "#ef444418",
}

const META_COLORS: Record<ContentMeta, string> = {
  image: "#4a9eff",
  video: "#e040a0",
  code:  "#2dd98a",
  file:  "#f5c842",
  link:  "#c084fc",
  audio: "#fb923c",
}

const STATUS_CONFIG: Record<PublishStatus, { label: string; color: string; bg: string; icon: "published" | "draft" | "scheduled" }> = {
  published: { label: "Published", color: C.green,  bg: C.greenDim,  icon: "published" },
  draft:     { label: "Draft",     color: C.muted,  bg: C.border,    icon: "draft"     },
  scheduled: { label: "Scheduled", color: C.yellow, bg: C.yellowDim, icon: "scheduled" },
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

function detectContentMeta(content: string): Record<string, boolean> {
  if (!content) return {}
  return {
    has_images: /<img|!\[/.test(content),
    has_video:  /youtube|vimeo|<video/.test(content),
    has_code:   /```|<code|<pre/.test(content),
    has_links:  /\[.*\]\(http|<a\s+href/.test(content),
  }
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function MetaIcon({ type }: { type: ContentMeta }) {
  const color = META_COLORS[type]
  return (
    <span title={type} style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: 32, height: 32, borderRadius: 6,
      background: color + "18",
    }}>
      <Icon name={type} size={17} color={color} />
    </span>
  )
}

function TagPill({ tag }: { tag: string }) {
  return (
    <span style={{
      fontSize: 12, fontWeight: 600, fontFamily: FONT_MONO,
      color: C.accent, background: C.accentDim,
      padding: "3px 9px", borderRadius: 5,
      letterSpacing: "0.02em",
    }}>
      #{tag}
    </span>
  )
}

// ── Post Card ──────────────────────────────────────────────────────────────────

function PostCard({
  post,
  onEdit,
  onDelete,
}: {
  post: SpurPost
  onEdit: (post: SpurPost) => void
  onDelete: (post: SpurPost) => void
}) {
  const [hovered, setHovered] = useState(false)
  const status = STATUS_CONFIG[post.status]
  const metaTypes = Object.entries(post.content_meta ?? {})
    .filter(([, v]) => v)
    .map(([k]) => k.replace("has_", "") as ContentMeta)
    .filter(k => k in META_COLORS)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onEdit(post)}
      style={{
        background: hovered ? C.surfaceHover : C.surface,
        border: `1px solid ${hovered ? C.border : C.borderLight}`,
        borderRadius: 12,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "background 0.15s, border-color 0.15s, transform 0.15s, box-shadow 0.15s",
        transform: hovered ? "translateY(-2px)" : "none",
        boxShadow: hovered ? "0 8px 32px rgba(0,0,0,0.4)" : "none",
        cursor: "pointer",
      }}
    >
      {/* Thumbnail */}
      <div style={{
        height: 148, background: C.borderLight,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, position: "relative", overflow: "hidden",
      }}>
        {post.thumbnail_url ? (
          <img src={post.thumbnail_url} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{
            width: "100%", height: "100%",
            background: `linear-gradient(135deg, ${C.border} 0%, ${C.borderLight} 100%)`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg viewBox="0 0 640 640" width={32} height={32} fill={C.dim}>
              <path d="M64 128C64 92.7 92.7 64 128 64L512 64C547.3 64 576 92.7 576 128L576 512C576 547.3 547.3 576 512 576L128 576C92.7 576 64 547.3 64 512L64 128zM208 176C190.3 176 176 190.3 176 208C176 225.7 190.3 240 208 240C225.7 240 240 225.7 240 208C240 190.3 225.7 176 208 176zM128 432L186.8 351.8C195.2 340.3 211.7 338.4 222.5 348.2L256 380L346.9 271.3C356.9 259.4 374.8 258.5 385.9 269.5L512 395.5L512 480C512 497.7 497.7 512 480 512L160 512C142.3 512 128 497.7 128 480L128 432z"/>
            </svg>
          </div>
        )}
        <span style={{
          position: "absolute", top: 10, right: 10,
          fontSize: 11, fontWeight: 700, fontFamily: FONT,
          color: status.color, background: status.bg,
          padding: "4px 10px", borderRadius: 6,
          border: `1px solid ${status.color}33`,
          display: "inline-flex", alignItems: "center", gap: 5,
        }}>
          <Icon name={status.icon} size={13} color={status.color} />
          {status.label}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: "14px 16px 12px", display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        <div style={{
          fontSize: 14, fontWeight: 700, color: C.text,
          fontFamily: FONT, lineHeight: 1.4,
          display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {post.title}
        </div>

        {post.excerpt && (
          <div style={{
            fontSize: 12, color: C.muted, fontFamily: FONT, lineHeight: 1.6,
            display: "-webkit-box", WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical", overflow: "hidden", flex: 1,
          }}>
            {post.excerpt}
          </div>
        )}

        {post.tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {post.tags.slice(0, 4).map(t => <TagPill key={t} tag={t} />)}
          </div>
        )}

        {metaTypes.length > 0 && (
          <div style={{ display: "flex", gap: 4 }}>
            {metaTypes.map(type => <MetaIcon key={type} type={type} />)}
          </div>
        )}

        {/* Footer */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          paddingTop: 8, borderTop: `1px solid ${C.borderLight}`, marginTop: "auto",
        }}>
          <span style={{ fontSize: 11, color: C.dim, fontFamily: FONT }}>
            {new Date(post.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
          </span>
          <button
            onClick={e => { e.stopPropagation(); onDelete(post) }}
            style={{
              width: 30, height: 30, borderRadius: 6, border: "none",
              background: C.redDim, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
            title="Delete post"
          >
            <Icon name="delete" size={14} color={C.red} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Filter Bar ─────────────────────────────────────────────────────────────────

function FilterBar({
  filter,
  setFilter,
  count,
}: {
  filter: PublishStatus | "all"
  setFilter: (f: PublishStatus | "all") => void
  count: Record<string, number>
}) {
  const tabs: { id: PublishStatus | "all"; label: string }[] = [
    { id: "all",       label: "All" },
    { id: "published", label: "Published" },
    { id: "draft",     label: "Drafts" },
    { id: "scheduled", label: "Scheduled" },
  ]
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "16px 32px 0", flexShrink: 0 }}>
      {tabs.map(t => {
        const active = filter === t.id
        return (
          <button key={t.id} onClick={() => setFilter(t.id)} style={{
            padding: "7px 14px", borderRadius: 7, border: "none",
            background: active ? C.accentDim : "transparent",
            color: active ? C.accent : C.muted,
            fontSize: 13, fontWeight: active ? 700 : 500,
            fontFamily: FONT, cursor: "pointer", transition: "all 0.1s",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            {t.label}
            <span style={{
              fontSize: 11, fontWeight: 700,
              background: active ? C.accent + "33" : C.border,
              color: active ? C.accent : C.dim,
              padding: "1px 6px", borderRadius: 4,
            }}>
              {count[t.id] ?? 0}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ── Post Editor ────────────────────────────────────────────────────────────────

function PostEditor({
  post,
  siteId,
  userId,
  supabase,
  onSaved,
  onClose,
}: {
  post: SpurPost | null  // null = new post
  siteId: string
  userId: string
  supabase: any
  onSaved: (post: SpurPost) => void
  onClose: () => void
}) {
  const [title, setTitle] = useState(post?.title ?? "")
  const [slug, setSlug] = useState(post?.slug ?? "")
  const [slugManual, setSlugManual] = useState(!!post)
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "")
  const [content, setContent] = useState(post?.content ?? "")
  const [status, setStatus] = useState<PublishStatus>(post?.status ?? "draft")
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags] = useState<string[]>(post?.tags ?? [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => { titleRef.current?.focus() }, [])

  function handleTitleChange(val: string) {
    setTitle(val)
    if (!slugManual) setSlug(slugify(val))
  }

  function handleTagKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      const tag = tagInput.trim().toLowerCase().replace(/^#/, "")
      if (tag && !tags.includes(tag)) setTags(prev => [...prev, tag])
      setTagInput("")
    }
    if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      setTags(prev => prev.slice(0, -1))
    }
  }

  async function handleSave() {
    if (!title.trim()) { setError("Title is required."); return }
    if (!slug.trim()) { setError("Slug is required."); return }
    setSaving(true)
    setError(null)

    try {
      const payload = {
        site_id: siteId,
        author_id: userId,
        title: title.trim(),
        slug: slug.trim(),
        excerpt: excerpt.trim() || null,
        content: content || null,
        status,
        tags,
        content_meta: detectContentMeta(content),
        published_at: status === "published" ? (post?.published_at ?? new Date().toISOString()) : null,
        updated_at: new Date().toISOString(),
      }

      let saved: SpurPost
      if (post) {
        const { data, error: err } = await supabase
          .from("spur_posts").update(payload).eq("id", post.id).select().single()
        if (err) throw new Error(err.code === "23505" ? `Slug "${slug}" is already used in this site.` : err.message)
        saved = data
      } else {
        const { data, error: err } = await supabase
          .from("spur_posts").insert(payload).select().single()
        if (err) throw new Error(err.code === "23505" ? `Slug "${slug}" is already used in this site.` : err.message)
        saved = data
      }

      onSaved(saved)
    } catch (err: any) {
      setError(err.message ?? "Something went wrong.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: C.bg,
      display: "flex", flexDirection: "column",
      fontFamily: FONT, zIndex: 100,
    }}>
      {/* Editor header */}
      <div style={{
        height: 56, background: C.surface,
        borderBottom: `1px solid ${C.borderLight}`,
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px", flexShrink: 0, gap: 12,
      }}>
        <button onClick={onClose} style={{
          background: "none", border: "none", cursor: "pointer",
          color: C.muted, fontSize: 13, fontFamily: FONT,
          display: "flex", alignItems: "center", gap: 6,
          padding: "6px 10px", borderRadius: 6,
        }}>
          ← Back
        </button>
        <span style={{ fontSize: 14, fontWeight: 600, color: C.muted, flex: 1 }}>
          {post ? "Edit Post" : "New Post"}
        </span>

        {/* Status picker */}
        <div style={{ display: "flex", gap: 4 }}>
          {(["draft", "published", "scheduled"] as PublishStatus[]).map(s => {
            const cfg = STATUS_CONFIG[s]
            const active = status === s
            return (
              <button key={s} onClick={() => setStatus(s)} style={{
                padding: "6px 12px", borderRadius: 6, border: `1px solid ${active ? cfg.color + "60" : C.border}`,
                background: active ? cfg.bg : "transparent",
                color: active ? cfg.color : C.muted,
                fontSize: 12, fontWeight: 600, fontFamily: FONT,
                cursor: "pointer", transition: "all 0.1s",
                display: "flex", alignItems: "center", gap: 5,
              }}>
                <Icon name={cfg.icon} size={12} color={active ? cfg.color : C.muted} />
                {cfg.label}
              </button>
            )
          })}
        </div>

        <button onClick={handleSave} disabled={saving} style={{
          padding: "8px 20px", borderRadius: 7, border: "none",
          background: saving ? C.dim : C.accent,
          color: "#fff", fontSize: 13, fontWeight: 700,
          fontFamily: FONT, cursor: saving ? "default" : "pointer",
          transition: "background 0.15s",
        }}>
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {/* Editor body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "32px", maxWidth: 860, margin: "0 auto", width: "100%" }}>

        {error && (
          <div style={{
            background: "#ef444418", border: "1px solid #ef444440",
            borderRadius: 8, padding: "10px 14px", marginBottom: 20,
            fontSize: 13, color: C.red, fontFamily: FONT,
          }}>
            {error}
          </div>
        )}

        {/* Title */}
        <input
          ref={titleRef}
          value={title}
          onChange={e => handleTitleChange(e.target.value)}
          placeholder="Post title…"
          style={{
            width: "100%", background: "transparent", border: "none", outline: "none",
            fontSize: 36, fontWeight: 800, color: C.text, fontFamily: FONT,
            lineHeight: 1.2, marginBottom: 12,
          }}
        />

        {/* Slug */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
          <span style={{ fontSize: 12, color: C.muted, fontFamily: FONT_MONO }}>slug:</span>
          <input
            value={slug}
            onChange={e => { setSlugManual(true); setSlug(slugify(e.target.value)) }}
            placeholder="post-slug"
            style={{
              flex: 1, background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 5, padding: "5px 10px",
              fontSize: 12, color: C.accent, fontFamily: FONT_MONO,
              outline: "none",
            }}
          />
        </div>

        {/* Excerpt */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12, color: C.muted, fontFamily: FONT, display: "block", marginBottom: 6, fontWeight: 600 }}>
            Excerpt
          </label>
          <textarea
            value={excerpt}
            onChange={e => setExcerpt(e.target.value)}
            placeholder="A short description shown on post cards…"
            rows={2}
            style={{
              width: "100%", background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 8, padding: "10px 12px",
              fontSize: 13, color: C.text, fontFamily: FONT,
              lineHeight: 1.6, resize: "vertical", outline: "none",
            }}
          />
        </div>

        {/* Tags */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12, color: C.muted, fontFamily: FONT, display: "block", marginBottom: 6, fontWeight: 600 }}>
            Tags <span style={{ fontWeight: 400 }}>(press Enter or comma to add)</span>
          </label>
          <div style={{
            display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center",
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 8, padding: "8px 10px", minHeight: 42,
          }}>
            {tags.map(tag => (
              <span key={tag} style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                fontSize: 12, fontWeight: 600, fontFamily: FONT_MONO,
                color: C.accent, background: C.accentDim,
                padding: "3px 8px", borderRadius: 5,
              }}>
                #{tag}
                <button
                  onClick={() => setTags(prev => prev.filter(t => t !== tag))}
                  style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, padding: 0, lineHeight: 1, fontSize: 14 }}
                >
                  ×
                </button>
              </span>
            ))}
            <input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder={tags.length === 0 ? "add tags…" : ""}
              style={{
                background: "transparent", border: "none", outline: "none",
                fontSize: 12, color: C.text, fontFamily: FONT_MONO,
                minWidth: 80, flex: 1,
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div>
          <label style={{ fontSize: 12, color: C.muted, fontFamily: FONT, display: "block", marginBottom: 6, fontWeight: 600 }}>
            Content <span style={{ fontWeight: 400 }}>(Markdown)</span>
          </label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Write your post in Markdown…"
            style={{
              width: "100%", background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 8, padding: "14px 16px",
              fontSize: 14, color: C.text, fontFamily: FONT_MONO,
              lineHeight: 1.7, resize: "vertical", outline: "none",
              minHeight: 400,
            }}
          />
        </div>
      </div>
    </div>
  )
}

// ── Delete Confirm Modal ───────────────────────────────────────────────────────

function DeletePostModal({
  post,
  supabase,
  onClose,
  onDeleted,
}: {
  post: SpurPost
  supabase: any
  onClose: () => void
  onDeleted: () => void
}) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    await supabase.from("spur_posts").delete().eq("id", post.id)
    onDeleted()
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 200, padding: 24,
    }} onClick={onClose}>
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 12, padding: 24, maxWidth: 400, width: "100%",
        fontFamily: FONT,
      }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 10 }}>Delete post?</div>
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 20 }}>
          <strong style={{ color: C.text }}>{post.title}</strong> will be permanently deleted. This cannot be undone.
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={onClose} style={{
            padding: "8px 16px", borderRadius: 7, border: `1px solid ${C.border}`,
            background: "transparent", color: C.muted, fontSize: 13,
            fontFamily: FONT, cursor: "pointer", fontWeight: 600,
          }}>
            Cancel
          </button>
          <button onClick={handleDelete} disabled={deleting} style={{
            padding: "8px 16px", borderRadius: 7, border: "none",
            background: C.red, color: "#fff", fontSize: 13,
            fontFamily: FONT, cursor: "pointer", fontWeight: 600,
          }}>
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main SpurEditor ────────────────────────────────────────────────────────────

export default function SpurEditor({
  siteId,
  siteName,
  userId,
  supabase,
  onBack,
}: {
  siteId: string
  siteName: string
  userId: string
  supabase: any
  onBack: () => void
}) {
  const [posts, setPosts] = useState<SpurPost[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<PublishStatus | "all">("all")
  const [editingPost, setEditingPost] = useState<SpurPost | null | "new">(null)
  const [deletingPost, setDeletingPost] = useState<SpurPost | null>(null)

  useEffect(() => { loadPosts() }, [siteId])

  async function loadPosts() {
    setLoading(true)
    const { data } = await supabase
      .from("spur_posts")
      .select("*")
      .eq("site_id", siteId)
      .order("created_at", { ascending: false })
    setPosts(data ?? [])
    setLoading(false)
  }

  function handleSaved(saved: SpurPost) {
    setPosts(prev => {
      const exists = prev.find(p => p.id === saved.id)
      return exists
        ? prev.map(p => p.id === saved.id ? saved : p)
        : [saved, ...prev]
    })
    setEditingPost(null)
  }

  function handleDeleted(post: SpurPost) {
    setPosts(prev => prev.filter(p => p.id !== post.id))
    setDeletingPost(null)
  }

  const filtered = filter === "all" ? posts : posts.filter(p => p.status === filter)
  const count = {
    all:       posts.length,
    published: posts.filter(p => p.status === "published").length,
    draft:     posts.filter(p => p.status === "draft").length,
    scheduled: posts.filter(p => p.status === "scheduled").length,
  }

  // Show editor fullscreen
  if (editingPost !== null) {
    return (
      <PostEditor
        post={editingPost === "new" ? null : editingPost}
        siteId={siteId}
        userId={userId}
        supabase={supabase}
        onSaved={handleSaved}
        onClose={() => setEditingPost(null)}
      />
    )
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');
      `}</style>

      <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: C.bg, fontFamily: FONT }}>

        {/* Header */}
        <div style={{
          height: 56, background: C.surface,
          borderBottom: `1px solid ${C.borderLight}`,
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={onBack} style={{
              background: "none", border: "none", cursor: "pointer",
              color: C.muted, fontSize: 13, fontFamily: FONT,
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 10px", borderRadius: 6,
            }}>
              ← {siteName}
            </button>
            <span style={{ color: C.border }}>·</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Spur</span>
            <span style={{ fontSize: 11, color: C.muted, fontFamily: FONT_MONO, background: C.border, padding: "2px 7px", borderRadius: 4 }}>
              blog
            </span>
          </div>
          <button
            onClick={() => setEditingPost("new")}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "8px 16px", borderRadius: 7, border: "none",
              background: C.accent, color: "#fff",
              fontSize: 13, fontWeight: 700, fontFamily: FONT,
              cursor: "pointer",
            }}
          >
            + New Post
          </button>
        </div>

        <FilterBar filter={filter} setFilter={setFilter} count={count} />

        {/* Grid */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px 32px" }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
              <div style={{ width: 24, height: 24, border: `3px solid ${C.border}`, borderTopColor: C.accent, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 260, gap: 12 }}>
              <div style={{ fontSize: 40, opacity: 0.15 }}>✍</div>
              <div style={{ fontSize: 15, color: C.muted }}>
                {filter === "all" ? "No posts yet. Write your first one." : `No ${filter} posts.`}
              </div>
              {filter === "all" && (
                <button onClick={() => setEditingPost("new")} style={{
                  padding: "9px 20px", borderRadius: 7, border: "none",
                  background: C.accent, color: "#fff",
                  fontSize: 13, fontWeight: 700, fontFamily: FONT, cursor: "pointer",
                }}>
                  New Post
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
              {filtered.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  onEdit={setEditingPost}
                  onDelete={setDeletingPost}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {deletingPost && (
        <DeletePostModal
          post={deletingPost}
          supabase={supabase}
          onClose={() => setDeletingPost(null)}
          onDeleted={() => handleDeleted(deletingPost)}
        />
      )}
    </>
  )
}
