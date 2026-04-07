import { useState } from "react"

type Props = {
  open: boolean
  site: any
  userId: string
  supabase: any
  onClose: () => void
}

export default function NewPostModal({
  open,
  site,
  userId,
  supabase,
  onClose,
}: Props) {
  const [title, setTitle] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [body, setBody] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  async function handleSave() {
    if (!title.trim()) {
      setError("Title is required")
      return
    }

    setSaving(true)
    setError(null)

    try {
      const { error } = await supabase.from("spur_posts").insert({
        site_id: site.id,
        author_id: userId,
        title,
        excerpt,
        content: body,
        status: "draft",
      })

      if (error) throw error

      onClose()
    } catch (err: any) {
      setError(err.message || "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 800,
          background: "#0b1220",
          borderRadius: 12,
          padding: 20,
          border: "1px solid #1f2937",
        }}
      >
        <h2 style={{ marginBottom: 16 }}>New Post</h2>

        {error && (
          <div style={{ color: "#ef4444", marginBottom: 12 }}>
            {error}
          </div>
        )}

        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            width: "100%",
            padding: 10,
            marginBottom: 12,
            background: "#111827",
            border: "1px solid #374151",
            color: "#fff",
            borderRadius: 6,
          }}
        />

        <input
          placeholder="Excerpt"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          style={{
            width: "100%",
            padding: 10,
            marginBottom: 12,
            background: "#111827",
            border: "1px solid #374151",
            color: "#fff",
            borderRadius: 6,
          }}
        />

        <textarea
          placeholder="Write something..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          style={{
            width: "100%",
            height: 200,
            padding: 10,
            marginBottom: 16,
            background: "#111827",
            border: "1px solid #374151",
            color: "#fff",
            borderRadius: 6,
          }}
        />

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose}>Cancel</button>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: "#2563eb",
              color: "#fff",
              padding: "8px 14px",
              borderRadius: 6,
              border: "none",
            }}
          >
            {saving ? "Saving..." : "Save Draft"}
          </button>
        </div>
      </div>
    </div>
  )
}