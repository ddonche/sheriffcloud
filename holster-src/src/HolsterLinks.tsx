import { useEffect, useState } from "react"
import { supabase } from "./supabase"
import type { User } from "@supabase/supabase-js"
import type { HolsterCollection } from "./HolsterPanel"
import { timeAgo, CollectionPicker } from "./HolsterNotes"

const FONT        = `"Inter", system-ui, -apple-system, sans-serif`
const CONTENT_BG  = "#f8fafc"
const CONTENT_BDR = "#e2e8f0"
const CARD_BG     = "#ffffff"
const TEAL        = "#5b95a7"
const RED         = "#c14141"
const TEXT        = "#0f172a"
const MUTED       = "#475569"
const DIM         = "#94a3b8"

type LinkRow = {
  id: string
  title: string
  url: string
  description: string | null
  collection: string | null
  created_at: string
  updated_at: string
}

function Favicon({ url }: { url: string }) {
  const [ok, setOk] = useState(true)
  let origin = ""
  try { origin = new URL(url).origin } catch { /* invalid url */ }
  if (!ok || !origin) {
    return (
      <svg viewBox="0 0 640 640" width={14} height={14} fill={DIM}>
        <path d="M451.5 160C434.9 160 418.8 164.5 404.7 172.7C388.9 156.7 370.5 143.3 350.2 133.2C378.4 109.2 414.3 96 451.5 96C537.9 96 608 166 608 252.5C608 294 591.5 333.8 562.2 363.1L491.1 434.2C461.8 463.5 422 480 380.5 480C294.1 480 224 410 224 323.5C224 322 224 320.5 224.1 319C224.6 301.3 239.3 287.4 257 287.9C274.7 288.4 288.6 303.1 288.1 320.8C288.1 321.7 288.1 322.6 288.1 323.4C288.1 374.5 329.5 415.9 380.6 415.9C405.1 415.9 428.6 406.2 446 388.8L517.1 317.7C534.4 300.4 544.2 276.8 544.2 252.3C544.2 201.2 502.8 159.8 451.7 159.8zM307.2 237.3C305.3 236.5 303.4 235.4 301.7 234.2C289.1 227.7 274.7 224 259.6 224C235.1 224 211.6 233.7 194.2 251.1L123.1 322.2C105.8 339.5 96 363.1 96 387.6C96 438.7 137.4 480.1 188.5 480.1C205 480.1 221.1 475.7 235.2 467.5C251 483.5 269.4 496.9 289.8 507C261.6 530.9 225.8 544.2 188.5 544.2C102.1 544.2 32 474.2 32 387.7C32 346.2 48.5 306.4 77.8 277.1L148.9 206C178.2 176.7 218 160.2 259.5 160.2C346.1 160.2 416 230.8 416 317.1C416 318.4 416 319.7 416 321C415.6 338.7 400.9 352.6 383.2 352.2C365.5 351.8 351.6 337.1 352 319.4C352 318.6 352 317.9 352 317.1C352 283.4 334 253.8 307.2 237.5z"/>
      </svg>
    )
  }
  return <img src={`${origin}/favicon.ico`} width={14} height={14} style={{ objectFit: "contain", flexShrink: 0 }} onError={() => setOk(false)} />
}

function AddForm({ user, collections, onAdded, onCancel, onCollectionCreated }: {
  user: User
  collections: HolsterCollection[]
  onAdded: (row: LinkRow) => void
  onCancel: () => void
  onCollectionCreated: (col: HolsterCollection) => void
}) {
  const [title, setTitle]           = useState("")
  const [url, setUrl]               = useState("")
  const [description, setDesc]      = useState("")
  const [collection, setCollection] = useState<string | null>(null)
  const [showExtra, setShowExtra]   = useState(false)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState<string | null>(null)

  async function handleSave() {
    if (!title.trim()) { setError("Title is required."); return }
    if (!url.trim())   { setError("URL is required."); return }
    setSaving(true); setError(null)
    const { data, error } = await supabase.from("holster_links").insert({
      user_id: user.id, title: title.trim(), url: url.trim(),
      description: description.trim() || null, collection,
    }).select().single()
    setSaving(false)
    if (error) { setError(error.message); return }
    onAdded(data)
  }

  const inp: React.CSSProperties = {
    height: 38, padding: "0 12px", borderRadius: 7,
    border: `1px solid ${CONTENT_BDR}`, background: CARD_BG,
    fontSize: 14, fontFamily: FONT, color: TEXT, outline: "none",
    boxSizing: "border-box", width: "100%",
  }

  return (
    <div style={{ background: `${TEAL}08`, border: `1px solid ${TEAL}33`, borderRadius: 10, padding: 16, display: "grid", gap: 10 }}>
      <div className="hol-add-form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, alignItems: "center" }}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title *" style={inp} autoFocus
          onKeyDown={e => e.key === "Enter" && handleSave()} />
        <input value={url} onChange={e => setUrl(e.target.value)} placeholder="URL *" style={inp}
          onKeyDown={e => e.key === "Enter" && handleSave()} />
        <button onClick={() => setShowExtra(v => !v)}
          style={{
            height: 38, padding: "0 14px", borderRadius: 7, cursor: "pointer",
            border: `1px solid ${showExtra ? TEAL : CONTENT_BDR}`,
            background: showExtra ? `${TEAL}14` : "transparent",
            color: showExtra ? TEAL : MUTED,
            fontSize: 13, fontWeight: 600, fontFamily: FONT,
            whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6,
          }}>
          <svg viewBox="0 0 640 640" width={11} height={11} fill="currentColor">
            {showExtra ? <path d="M320 192L576 448L512 512L320 320L128 512L64 448Z"/> : <path d="M320 448L64 192L128 128L320 320L512 128L576 192Z"/>}
          </svg>
          {showExtra ? "Less" : "Collection, description"}
        </button>
      </div>
      {showExtra && (
        <div style={{ display: "grid", gap: 8 }}>
          <CollectionPicker collections={collections} value={collection} onChange={setCollection} onCreateNew={onCollectionCreated} />
          <textarea value={description} onChange={e => setDesc(e.target.value)} placeholder="Description" rows={3}
            style={{ ...inp, height: "auto", padding: 10, resize: "vertical", lineHeight: 1.5 }} />
        </div>
      )}
      {error && <div style={{ fontSize: 13, color: RED, fontFamily: FONT }}>{error}</div>}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={handleSave} disabled={saving}
          style={{ padding: "8px 16px", borderRadius: 7, border: "none", background: TEAL, color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: FONT, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
          {saving ? "Saving…" : "Save"}
        </button>
        <button onClick={onCancel}
          style={{ padding: "8px 16px", borderRadius: 7, border: `1px solid ${CONTENT_BDR}`, background: "transparent", color: MUTED, fontSize: 13, fontWeight: 700, fontFamily: FONT, cursor: "pointer" }}>
          Cancel
        </button>
      </div>
    </div>
  )
}

function LinkListRow({ item, collections, onUpdated, onDeleted, onCollectionCreated }: {
  item: LinkRow
  collections: HolsterCollection[]
  onUpdated: (row: LinkRow) => void
  onDeleted: (id: string) => void
  onCollectionCreated: (col: HolsterCollection) => void
}) {
  const [expanded, setExpanded]     = useState(false)
  const [editing, setEditing]       = useState(false)
  const [title, setTitle]           = useState(item.title)
  const [url, setUrl]               = useState(item.url)
  const [description, setDesc]      = useState(item.description ?? "")
  const [collection, setCollection] = useState<string | null>(item.collection ?? null)
  const [saving, setSaving]         = useState(false)
  const [deleting, setDeleting]     = useState(false)
  const [copied, setCopied]         = useState(false)

  async function handleSave() {
    if (!title.trim() || !url.trim()) return
    setSaving(true)
    const { data, error } = await supabase.from("holster_links")
      .update({ title: title.trim(), url: url.trim(), description: description.trim() || null, collection })
      .eq("id", item.id).select().single()
    setSaving(false)
    if (error || !data) return
    onUpdated(data); setEditing(false)
  }

  async function handleDelete() {
    if (!confirm(`Delete "${item.title}"?`)) return
    setDeleting(true)
    await supabase.from("holster_links").delete().eq("id", item.id)
    setDeleting(false); onDeleted(item.id)
  }

  function handleCopy() {
    navigator.clipboard.writeText(item.url)
    setCopied(true); setTimeout(() => setCopied(false), 1500)
  }

  const inp: React.CSSProperties = {
    height: 34, padding: "0 10px", borderRadius: 6,
    border: `1px solid ${CONTENT_BDR}`, background: CARD_BG,
    fontSize: 13, fontFamily: FONT, color: TEXT, outline: "none",
    boxSizing: "border-box", width: "100%",
  }

  const iconBtn = (color?: string): React.CSSProperties => ({
    width: 28, height: 28, borderRadius: 6, border: "none",
    background: "transparent", cursor: "pointer",
    color: color ?? DIM, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  })

  return (
    <div style={{ borderBottom: `1px solid ${CONTENT_BDR}`, background: CARD_BG }}>
      <div className="hol-list-row" style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", minHeight: 48 }}>
        <div className="hol-list-row-title" style={{ width: 200, flexShrink: 0, display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <Favicon url={item.url} />
          <span style={{ fontSize: 14, fontWeight: 700, color: TEXT, fontFamily: FONT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {item.title}
          </span>
        </div>
        <div className="hol-list-row-value" style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <a href={item.url} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 13, color: TEAL, fontFamily: FONT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textDecoration: "none", maxWidth: 280 }}
            onClick={e => e.stopPropagation()}>
            {item.url}
          </a>
          {item.description && (
            <span style={{ fontSize: 12, color: DIM, fontFamily: FONT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              — {item.description}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 0, flexShrink: 0 }}>
          <button onClick={handleCopy} title="Copy URL" style={iconBtn(copied ? TEAL : DIM)}>
            {copied
              ? <svg viewBox="0 0 640 640" width={14} height={14} fill="currentColor"><path d="M256 416L128 288L170.7 245.3L256 330.7L469.3 117.3L512 160L256 416z"/></svg>
              : <svg viewBox="0 0 640 640" width={14} height={14} fill="currentColor"><path d="M224 64C188.7 64 160 92.7 160 128L160 448C160 483.3 188.7 512 224 512L448 512C483.3 512 512 483.3 512 448L512 128C512 92.7 483.3 64 448 64L224 64zM96 160L96 448C96 518.7 153.3 576 224 576L448 576C448 608 422.5 640 384 640L192 640C120 640 64 584 64 512L64 192C64 153.6 96 160 96 160z"/></svg>
            }
          </button>
          <button onClick={() => { setExpanded(v => !v); setEditing(false) }} title="More" style={iconBtn(expanded ? TEAL : DIM)}>
            <svg viewBox="0 0 640 640" width={14} height={14} fill="currentColor">
              {expanded ? <path d="M320 192L576 448L512 512L320 320L128 512L64 448Z"/> : <path d="M320 448L64 192L128 128L320 320L512 128L576 192Z"/>}
            </svg>
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: "0 16px 14px", display: "grid", gap: 10 }}>
          {!editing ? (
            <>
              {item.description && <div style={{ fontSize: 13, color: MUTED, fontFamily: FONT, lineHeight: 1.6 }}>{item.description}</div>}
              {item.collection && <div style={{ fontSize: 12, color: DIM, fontFamily: FONT }}>Collection: <span style={{ color: MUTED }}>{item.collection}</span></div>}
              <div style={{ fontSize: 11, color: DIM, fontFamily: FONT }}>Updated {timeAgo(item.updated_at)}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setEditing(true)}
                  style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${CONTENT_BDR}`, background: "transparent", color: MUTED, fontSize: 12, fontWeight: 700, fontFamily: FONT, cursor: "pointer" }}>
                  Edit
                </button>
                <button onClick={handleDelete} disabled={deleting}
                  style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${RED}`, background: "transparent", color: RED, fontSize: 12, fontWeight: 700, fontFamily: FONT, cursor: "pointer", opacity: deleting ? 0.6 : 1 }}>
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" style={inp} autoFocus />
                <input value={url} onChange={e => setUrl(e.target.value)} placeholder="URL" style={inp} />
              </div>
              <textarea value={description} onChange={e => setDesc(e.target.value)} placeholder="Description" rows={2}
                style={{ ...inp, height: "auto", padding: 10, resize: "vertical", lineHeight: 1.5 }} />
              <CollectionPicker collections={collections} value={collection} onChange={setCollection} onCreateNew={onCollectionCreated} />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handleSave} disabled={saving}
                  style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: TEAL, color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: FONT, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Saving…" : "Save"}
                </button>
                <button onClick={() => setEditing(false)}
                  style={{ padding: "6px 14px", borderRadius: 6, border: `1px solid ${CONTENT_BDR}`, background: "transparent", color: MUTED, fontSize: 12, fontWeight: 700, fontFamily: FONT, cursor: "pointer" }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function HolsterLinks({ user, collections, onCollectionCreated }: {
  user: User
  collections: HolsterCollection[]
  onCollectionCreated: (col: HolsterCollection) => void
}) {
  const [items, setItems]     = useState<LinkRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [sortAZ, setSortAZ]   = useState(true)
  const [twoCol, setTwoCol]   = useState(false)
  const [search, setSearch]   = useState("")

  useEffect(() => {
    setLoading(true)
    supabase.from("holster_links")
      .select("id, title, url, description, collection, created_at, updated_at")
      .eq("user_id", user.id).order("title")
      .then(({ data }) => { if (data) setItems(data); setLoading(false) })
  }, [])

  const filtered = items
    .filter(i => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return i.title.toLowerCase().includes(q) || i.url.toLowerCase().includes(q) || (i.description ?? "").toLowerCase().includes(q)
    })
    .sort((a, b) => sortAZ ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title))

  const half = Math.ceil(filtered.length / 2)
  const col1 = filtered.slice(0, half)
  const col2 = filtered.slice(half)

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", background: CONTENT_BG, overflow: "hidden" }}>
      <div className="hol-header-bar" style={{ height: 58, borderBottom: `1px solid ${CONTENT_BDR}`, display: "flex", alignItems: "center", gap: 10, padding: "0 24px", flexShrink: 0, background: CARD_BG }}>
        <button onClick={() => setShowAdd(v => !v)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 7, border: "none", background: TEAL, color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: FONT, cursor: "pointer" }}>
          <svg viewBox="0 0 640 640" width={11} height={11} fill="currentColor"><path d="M320 64C306.7 64 296 74.7 296 88L296 296L88 296C74.7 296 64 306.7 64 320C64 333.3 74.7 344 88 344L296 344L296 552C296 565.3 306.7 576 320 576C333.3 576 344 565.3 344 552L344 344L552 344C565.3 344 576 333.3 576 320C576 306.7 565.3 296 552 296L344 296L344 88C344 74.7 333.3 64 320 64z"/></svg>
          New Link
        </button>
        <button onClick={() => setTwoCol(v => !v)}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 7, border: `1px solid ${twoCol ? TEAL : CONTENT_BDR}`, background: twoCol ? `${TEAL}14` : "transparent", color: twoCol ? TEAL : MUTED, fontSize: 12, fontWeight: 700, fontFamily: FONT, cursor: "pointer" }}>
          <svg viewBox="0 0 640 640" width={12} height={12} fill="currentColor"><path d="M64 96L288 96L288 544L64 544L64 96zM352 96L576 96L576 544L352 544L352 96z"/></svg>
          2 cols
        </button>
        <button onClick={() => setSortAZ(v => !v)}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 7, border: `1px solid ${CONTENT_BDR}`, background: "transparent", color: MUTED, fontSize: 12, fontWeight: 700, fontFamily: FONT, cursor: "pointer" }}>
          <svg viewBox="0 0 640 640" width={12} height={12} fill="currentColor"><path d="M416 64L480 64L480 448L528 400L576 448L448 576L320 448L368 400L416 448L416 64zM224 576L160 576L160 192L112 240L64 192L192 64L320 192L272 240L224 192L224 576z"/></svg>
          {sortAZ ? "A–Z" : "Z–A"}
        </button>
        <div className="hol-search-box" style={{ position: "relative", flex: 1, maxWidth: 280 }}>
          <svg viewBox="0 0 640 640" width={13} height={13} fill={DIM}
            style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            <path d="M272 48C149.1 48 48 149.1 48 272C48 394.9 149.1 496 272 496C325.5 496 374.4 476.9 412.3 444.9L564.7 597.3C577 609.6 597 609.6 609.3 597.3C621.6 585 621.6 565 609.3 552.7L456.9 400.3C488.9 362.4 508 313.5 508 260C508 149.1 406.9 48 272 48zM272 432C184.4 432 112 359.6 112 272C112 184.4 184.4 112 272 112C359.6 112 432 184.4 432 272C432 359.6 359.6 432 272 432z"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search links…"
            style={{ width: "100%", height: 32, padding: "0 10px 0 30px", borderRadius: 6, border: `1px solid ${CONTENT_BDR}`, background: CONTENT_BG, fontSize: 13, fontFamily: FONT, color: TEXT, outline: "none", boxSizing: "border-box" }} />
        </div>
        <span style={{ fontSize: 13, color: DIM, fontFamily: FONT, marginLeft: "auto", whiteSpace: "nowrap" }}>{items.length} link{items.length !== 1 ? "s" : ""}</span>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        {showAdd && (
          <div style={{ padding: 20, borderBottom: `1px solid ${CONTENT_BDR}` }}>
            <AddForm user={user} collections={collections}
              onAdded={row => { setItems(prev => [row, ...prev]); setShowAdd(false) }}
              onCancel={() => setShowAdd(false)}
              onCollectionCreated={onCollectionCreated} />
          </div>
        )}
        {loading && <div style={{ padding: 24, color: DIM, fontSize: 14, fontFamily: FONT }}>Loading…</div>}
        {!loading && items.length === 0 && !showAdd && <div style={{ padding: 24, color: DIM, fontSize: 14, fontFamily: FONT }}>No links yet.</div>}
        {!loading && items.length > 0 && filtered.length === 0 && <div style={{ padding: 24, color: DIM, fontSize: 14, fontFamily: FONT }}>No links match your search.</div>}
        {twoCol ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", alignItems: "start" }}>
            <div style={{ borderRight: `1px solid ${CONTENT_BDR}` }}>
              {col1.map(item => (
                <LinkListRow key={item.id} item={item} collections={collections}
                  onCollectionCreated={onCollectionCreated}
                  onUpdated={u => setItems(prev => prev.map(r => r.id === u.id ? u : r))}
                  onDeleted={id => setItems(prev => prev.filter(r => r.id !== id))} />
              ))}
            </div>
            <div>
              {col2.map(item => (
                <LinkListRow key={item.id} item={item} collections={collections}
                  onCollectionCreated={onCollectionCreated}
                  onUpdated={u => setItems(prev => prev.map(r => r.id === u.id ? u : r))}
                  onDeleted={id => setItems(prev => prev.filter(r => r.id !== id))} />
              ))}
            </div>
          </div>
        ) : (
          filtered.map(item => (
            <LinkListRow key={item.id} item={item} collections={collections}
              onCollectionCreated={onCollectionCreated}
              onUpdated={u => setItems(prev => prev.map(r => r.id === u.id ? u : r))}
              onDeleted={id => setItems(prev => prev.filter(r => r.id !== id))} />
          ))
        )}
      </div>
    </div>
  )
}
