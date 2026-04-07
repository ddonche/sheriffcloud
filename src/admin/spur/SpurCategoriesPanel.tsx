import { useEffect, useState } from "react"
import type { SpurCategory } from "./spurTypes"
import type { SpurTheme } from "./spurTheme"
import { SPURF, SPURM } from "./spurTheme"
import { SPUR_COLORS } from "./spurColors"

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

export function SpurCategoriesPanel({ siteId, supabase, theme }: {
  siteId: string; supabase: any; theme: SpurTheme
}) {
  const [categories, setCategories] = useState<SpurCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [addingName, setAddingName] = useState("")
  const [addingColor, setAddingColor] = useState(SPUR_COLORS[3].color)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => { load() }, [siteId])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from("spur_categories").select("*").eq("site_id", siteId).order("name")
    setCategories(data ?? [])
    setLoading(false)
  }

  async function handleAdd() {
    if (!addingName.trim()) return
    setSaving(true)
    const { data, error } = await supabase.from("spur_categories").insert({
      site_id: siteId, name: addingName.trim(), color: addingColor, slug: slugify(addingName),
    }).select().single()
    if (!error && data) {
      setCategories(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      setAddingName("")
    }
    setSaving(false)
  }

  async function handleSaveEdit(cat: SpurCategory) {
    if (!editName.trim()) return
    const { data, error } = await supabase.from("spur_categories")
      .update({ name: editName.trim(), slug: slugify(editName) })
      .eq("id", cat.id).select().single()
    if (!error && data) {
      setCategories(prev => prev.map(c => c.id === cat.id ? data : c).sort((a, b) => a.name.localeCompare(b.name)))
      setEditingId(null)
    }
  }

  async function handleChangeColor(cat: SpurCategory, color: string) {
    const { data, error } = await supabase.from("spur_categories").update({ color }).eq("id", cat.id).select().single()
    if (!error && data) setCategories(prev => prev.map(c => c.id === cat.id ? data : c))
  }

  async function handleDelete(cat: SpurCategory) {
    if (!confirm(`Delete "${cat.name}"? Posts in this category will become uncategorized.`)) return
    setDeletingId(cat.id)
    await supabase.from("spur_categories").delete().eq("id", cat.id)
    setCategories(prev => prev.filter(c => c.id !== cat.id))
    setDeletingId(null)
  }

  const Swatches = ({ selected, onPick }: { selected: string; onPick: (c: string) => void }) => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
      {SPUR_COLORS.map(({ color, name }) => (
        <button key={color} type="button" onClick={() => onPick(color)} title={name}
          style={{ width: 26, height: 26, borderRadius: "50%", background: color, padding: 0, flexShrink: 0, cursor: "pointer", border: selected === color ? "3px solid rgba(255,255,255,0.85)" : "3px solid transparent", boxShadow: selected === color ? `0 0 0 2px ${color}` : "0 1px 3px rgba(0,0,0,0.35)", transition: "box-shadow 0.1s, border 0.1s" }} />
      ))}
    </div>
  )

  return (
    <div style={{ maxWidth: 760 }}>
      {/* Add form */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: theme.dim, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: SPURM, marginBottom: 20 }}>New Category</div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
          <div style={{ width: 18, height: 18, borderRadius: "50%", background: addingColor, flexShrink: 0, border: `2px solid ${addingColor}55` }} />
          <input value={addingName} onChange={e => setAddingName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAdd()} placeholder="Category name…"
            style={{ flex: 1, background: "transparent", border: "none", borderBottom: `1px solid ${theme.border}`, outline: "none", padding: "8px 0", fontSize: 18, color: theme.text, fontFamily: SPURF }} />
          <button onClick={handleAdd} disabled={!addingName.trim() || saving}
            style={{ padding: "10px 20px", borderRadius: 7, border: "none", background: addingName.trim() ? theme.accent : theme.border, color: addingName.trim() ? "#fff" : theme.dim, fontSize: 14, fontWeight: 700, cursor: addingName.trim() ? "pointer" : "default", fontFamily: SPURF, flexShrink: 0, transition: "background 0.12s" }}>
            {saving ? "Adding…" : "Add"}
          </button>
        </div>
        <Swatches selected={addingColor} onPick={setAddingColor} />
      </div>

      {/* List */}
      <div style={{ fontSize: 13, fontWeight: 700, color: theme.dim, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: SPURM, marginBottom: 20 }}>
        Categories {categories.length > 0 && `(${categories.length})`}
      </div>
      {loading ? (
        <div style={{ fontSize: 15, color: theme.dim, fontFamily: SPURF }}>Loading…</div>
      ) : categories.length === 0 ? (
        <div style={{ fontSize: 15, color: theme.dim, fontFamily: SPURF }}>No categories yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {categories.map(cat => {
            const isEditing = editingId === cat.id
            return (
              <div key={cat.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 0", borderBottom: `1px solid ${theme.borderLight}` }}>
                <div style={{ width: 16, height: 16, borderRadius: "50%", background: cat.color, flexShrink: 0 }} />
                {isEditing ? (
                  <input value={editName} onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleSaveEdit(cat); if (e.key === "Escape") setEditingId(null) }}
                    onBlur={() => handleSaveEdit(cat)} autoFocus
                    style={{ flex: 1, background: "transparent", border: "none", borderBottom: `1px solid ${theme.accent}`, outline: "none", padding: "4px 0", fontSize: 17, color: theme.text, fontFamily: SPURF }} />
                ) : (
                  <span onClick={() => { setEditingId(cat.id); setEditName(cat.name) }} title="Click to rename"
                    style={{ flex: 1, fontSize: 17, fontWeight: 500, color: theme.text, fontFamily: SPURF, cursor: "text" }}>
                    {cat.name}
                  </span>
                )}
                <span style={{ fontSize: 13, color: theme.dim, fontFamily: SPURM, flexShrink: 0 }}>{cat.slug}</span>
                {isEditing && (
                  <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap", maxWidth: 300 }}>
                    {SPUR_COLORS.map(({ color, name }) => (
                      <button key={color} type="button" onClick={() => handleChangeColor(cat, color)} title={name}
                        style={{ width: 20, height: 20, borderRadius: "50%", background: color, padding: 0, cursor: "pointer", border: cat.color === color ? "2px solid rgba(255,255,255,0.85)" : "2px solid transparent", boxShadow: cat.color === color ? `0 0 0 2px ${color}` : "none", transition: "box-shadow 0.1s" }} />
                    ))}
                  </div>
                )}
                <button onClick={() => handleDelete(cat)} disabled={deletingId === cat.id} title="Delete"
                  style={{ background: "none", border: "none", cursor: "pointer", color: theme.dim, padding: "4px 6px", flexShrink: 0, transition: "color 0.1s", opacity: deletingId === cat.id ? 0.4 : 1 }}
                  onMouseEnter={e => e.currentTarget.style.color = theme.red}
                  onMouseLeave={e => e.currentTarget.style.color = theme.dim}>
                  <svg viewBox="0 0 640 640" width={18} height={18} fill="currentColor"><path d="M232.7 69.9L224 96L128 96C110.3 96 96 110.3 96 128C96 145.7 110.3 160 128 160L512 160C529.7 160 544 145.7 544 128C544 110.3 529.7 96 512 96L416 96L407.3 69.9C402.9 56.8 390.7 48 376.9 48L263.1 48C249.3 48 237.1 56.8 232.7 69.9zM512 208L128 208L149.1 531.1C150.7 556.4 171.7 576 197 576L443 576C468.3 576 489.3 556.4 490.9 531.1L512 208z"/></svg>
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
