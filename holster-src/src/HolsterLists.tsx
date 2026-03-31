import { useEffect, useMemo, useState, type CSSProperties } from "react"
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

type HolsterList = {
  id: string
  title: string
  description: string | null
  collection_id: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

type HolsterListItem = {
  id: string
  list_id: string
  title: string
  note: string | null
  is_task: boolean
  is_done: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

type CollectionFilter = "all" | "none" | string

const inputStyle: CSSProperties = {
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

const textareaStyle: CSSProperties = {
  ...inputStyle,
  height: "auto",
  minHeight: 82,
  padding: 10,
  resize: "vertical",
  lineHeight: 1.5,
}

function ChipButton({
  active,
  children,
  onClick,
}: {
  active?: boolean
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        height: 34,
        padding: "0 12px",
        borderRadius: 7,
        border: `1px solid ${active ? TEAL : CONTENT_BDR}`,
        background: active ? `${TEAL}14` : "transparent",
        color: active ? TEAL : MUTED,
        fontSize: 13,
        fontWeight: 700,
        fontFamily: FONT,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  )
}

function AddListCard({
  user,
  collections,
  onCreate,
  onCancel,
  onCollectionCreated,
}: {
  user: User
  collections: HolsterCollection[]
  onCreate: (row: HolsterList) => void
  onCancel: () => void
  onCollectionCreated: (col: HolsterCollection) => void
}) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [collectionId, setCollectionId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    const clean = title.trim()
    if (!clean) {
      setError("List title is required.")
      return
    }

    setSaving(true)
    setError(null)

    const { data, error } = await supabase
      .from("holster_lists")
      .insert({
        user_id: user.id,
        title: clean,
        description: description.trim() || null,
        collection_id: collectionId,
      })
      .select("id, title, description, collection_id, sort_order, created_at, updated_at")
      .single()

    setSaving(false)

    if (error || !data) {
      setError(error?.message ?? "Could not create list.")
      return
    }

    onCreate(data)
  }

  return (
    <div
      style={{
        background: CARD_BG,
        border: `1px solid ${CONTENT_BDR}`,
        borderRadius: 12,
        padding: 14,
        display: "grid",
        gap: 10,
        alignSelf: "start",
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 800, color: TEXT, fontFamily: FONT }}>
        New list
      </div>

      <input
        autoFocus
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter") void handleCreate()
          if (e.key === "Escape") onCancel()
        }}
        placeholder="List title"
        style={inputStyle}
      />

      <CollectionPicker
        collections={collections}
        value={collectionId}
        onChange={setCollectionId}
        onCreateNew={onCollectionCreated}
      />

      <textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="Description"
        rows={3}
        style={textareaStyle}
      />

      {error && <div style={{ fontSize: 13, color: RED, fontFamily: FONT }}>{error}</div>}

      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={() => void handleCreate()}
          disabled={saving}
          style={{
            padding: "8px 14px",
            borderRadius: 7,
            border: "none",
            background: TEAL,
            color: "#fff",
            fontSize: 12,
            fontWeight: 700,
            fontFamily: FONT,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Creating…" : "Create"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: "8px 14px",
            borderRadius: 7,
            border: `1px solid ${CONTENT_BDR}`,
            background: "transparent",
            color: MUTED,
            fontSize: 12,
            fontWeight: 700,
            fontFamily: FONT,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

function ItemComposer({
  onAdd,
}: {
  onAdd: (payload: { title: string; note: string | null; is_task: boolean }) => Promise<void>
}) {
  const [title, setTitle] = useState("")
  const [showNotes, setShowNotes] = useState(false)
  const [note, setNote] = useState("")
  const [isTask, setIsTask] = useState(false)
  const [saving, setSaving] = useState(false)

  async function submit() {
    const clean = title.trim()
    if (!clean || saving) return
    setSaving(true)
    await onAdd({
      title: clean,
      note: note.trim() || null,
      is_task: isTask,
    })
    setSaving(false)
    setTitle("")
    setNote("")
    setIsTask(false)
    setShowNotes(false)
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "center" }}>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Add new"
          style={inputStyle}
          onKeyDown={e => {
            if (e.key === "Enter") {
              e.preventDefault()
              void submit()
            }
          }}
        />

        <ChipButton active={showNotes} onClick={() => setShowNotes(v => !v)}>
          Notes
        </ChipButton>
      </div>

      {showNotes && (
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Notes"
          rows={3}
          style={textareaStyle}
        />
      )}

      <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: MUTED, fontFamily: FONT }}>
        <input
          type="checkbox"
          checked={isTask}
          onChange={e => setIsTask(e.target.checked)}
        />
        Is this a task?
      </label>
    </div>
  )
}

function ListItemRow({
  item,
  onUpdated,
  onDeleted,
}: {
  item: HolsterListItem
  onUpdated: (row: HolsterListItem) => void
  onDeleted: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(item.title)
  const [note, setNote] = useState(item.note ?? "")
  const [isTask, setIsTask] = useState(item.is_task)
  const [isDone, setIsDone] = useState(item.is_done)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setTitle(item.title)
    setNote(item.note ?? "")
    setIsTask(item.is_task)
    setIsDone(item.is_done)
  }, [item.id, item.title, item.note, item.is_task, item.is_done])

  async function quickDone(next: boolean) {
    const { data, error } = await supabase
      .from("holster_list_items")
      .update({ is_done: next })
      .eq("id", item.id)
      .select("id, list_id, title, note, is_task, is_done, sort_order, created_at, updated_at")
      .single()

    if (!error && data) onUpdated(data)
  }

  async function handleSave() {
    const clean = title.trim()
    if (!clean) return
    setSaving(true)

    const { data, error } = await supabase
      .from("holster_list_items")
      .update({
        title: clean,
        note: note.trim() || null,
        is_task: isTask,
        is_done: isTask ? isDone : false,
      })
      .eq("id", item.id)
      .select("id, list_id, title, note, is_task, is_done, sort_order, created_at, updated_at")
      .single()

    setSaving(false)

    if (!error && data) {
      onUpdated(data)
      setOpen(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${item.title}"?`)) return
    setDeleting(true)
    const { error } = await supabase.from("holster_list_items").delete().eq("id", item.id)
    setDeleting(false)
    if (!error) onDeleted(item.id)
  }

  return (
    <div style={{ border: `1px solid ${CONTENT_BDR}`, borderRadius: 8, background: CARD_BG, overflow: "hidden" }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          width: "100%",
          textAlign: "left",
          border: "none",
          background: "transparent",
          padding: "10px 12px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          cursor: "pointer",
          fontFamily: FONT,
        }}
      >
        {item.is_task ? (
          <input
            type="checkbox"
            checked={item.is_done}
            onChange={e => {
              e.stopPropagation()
              void quickDone(e.target.checked)
            }}
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: `${TEAL}55`, flexShrink: 0 }} />
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {item.title}
          </div>

          {(item.note || item.is_task) && (
            <div style={{ marginTop: 2, fontSize: 12, color: DIM, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {item.is_task ? (item.is_done ? "Task · Done" : "Task") : "Notes"}
              {item.note ? ` · ${item.note}` : ""}
            </div>
          )}
        </div>

        <svg viewBox="0 0 640 640" width={12} height={12} fill={DIM} style={{ flexShrink: 0 }}>
          {open
            ? <path d="M320 192L576 448L512 512L320 320L128 512L64 448Z" />
            : <path d="M320 448L64 192L128 128L320 320L512 128L576 192Z" />}
        </svg>
      </button>

      {open && (
        <div style={{ borderTop: `1px solid ${CONTENT_BDR}`, padding: 12, display: "grid", gap: 8 }}>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Title"
            style={inputStyle}
          />

          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Notes"
            rows={3}
            style={textareaStyle}
          />

          <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: MUTED, fontFamily: FONT }}>
            <input
              type="checkbox"
              checked={isTask}
              onChange={e => {
                setIsTask(e.target.checked)
                if (!e.target.checked) setIsDone(false)
              }}
            />
            Is this a task?
          </label>

          {isTask && (
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: MUTED, fontFamily: FONT }}>
              <input
                type="checkbox"
                checked={isDone}
                onChange={e => setIsDone(e.target.checked)}
              />
              Done
            </label>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              style={{
                padding: "7px 14px",
                borderRadius: 6,
                border: "none",
                background: TEAL,
                color: "#fff",
                fontSize: 12,
                fontWeight: 700,
                fontFamily: FONT,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Saving…" : "Save"}
            </button>

            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={deleting}
              style={{
                padding: "7px 14px",
                borderRadius: 6,
                border: `1px solid ${CONTENT_BDR}`,
                background: "transparent",
                color: RED,
                fontSize: 12,
                fontWeight: 700,
                fontFamily: FONT,
                cursor: deleting ? "not-allowed" : "pointer",
                opacity: deleting ? 0.7 : 1,
              }}
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ListCard({
  user,
  row,
  collections,
  collectionName,
  items,
  open,
  onToggle,
  onCollectionCreated,
  onListUpdated,
  onListDeleted,
  onItemAdded,
  onItemUpdated,
  onItemDeleted,
}: {
  user: User
  row: HolsterList
  collections: HolsterCollection[]
  collectionName: string | null
  items: HolsterListItem[]
  open: boolean
  onToggle: () => void
  onCollectionCreated: (col: HolsterCollection) => void
  onListUpdated: (row: HolsterList) => void
  onListDeleted: (id: string) => void
  onItemAdded: (row: HolsterListItem) => void
  onItemUpdated: (row: HolsterListItem) => void
  onItemDeleted: (id: string) => void
}) {
  const [title, setTitle] = useState(row.title)
  const [description, setDescription] = useState(row.description ?? "")
  const [collectionId, setCollectionId] = useState<string | null>(row.collection_id)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setTitle(row.title)
    setDescription(row.description ?? "")
    setCollectionId(row.collection_id)
  }, [row.id, row.title, row.description, row.collection_id])

  async function handleSaveList() {
    const clean = title.trim()
    if (!clean) return

    setSaving(true)

    const { data, error } = await supabase
      .from("holster_lists")
      .update({
        title: clean,
        description: description.trim() || null,
        collection_id: collectionId,
      })
      .eq("id", row.id)
      .select("id, title, description, collection_id, sort_order, created_at, updated_at")
      .single()

    setSaving(false)

    if (!error && data) onListUpdated(data)
  }

  async function handleDeleteList() {
    if (!confirm(`Delete "${row.title}" and all its items?`)) return
    setDeleting(true)
    const { error } = await supabase.from("holster_lists").delete().eq("id", row.id)
    setDeleting(false)
    if (!error) onListDeleted(row.id)
  }

  async function handleAddItem(payload: { title: string; note: string | null; is_task: boolean }) {
    const nextSort = items.length
    const { data, error } = await supabase
      .from("holster_list_items")
      .insert({
        user_id: user.id,
        list_id: row.id,
        title: payload.title,
        note: payload.note,
        is_task: payload.is_task,
        is_done: false,
        sort_order: nextSort,
      })
      .select("id, list_id, title, note, is_task, is_done, sort_order, created_at, updated_at")
      .single()

    if (!error && data) onItemAdded(data)
  }

  return (
    <div
      style={{
        border: `1px solid ${CONTENT_BDR}`,
        borderRadius: 12,
        background: CARD_BG,
        overflow: "hidden",
        boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
        alignSelf: "start",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: "100%",
          border: "none",
          background: "transparent",
          textAlign: "left",
          padding: 14,
          display: "grid",
          gap: 8,
          cursor: "pointer",
          fontFamily: FONT,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: TEXT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {row.title}
            </div>
            <div style={{ marginTop: 3, fontSize: 12, color: DIM }}>
              {items.length} {items.length === 1 ? "item" : "items"}
              {collectionName ? ` · ${collectionName}` : " · No collection"}
            </div>
          </div>

          <svg viewBox="0 0 640 640" width={12} height={12} fill={DIM} style={{ flexShrink: 0 }}>
            {open
              ? <path d="M320 192L576 448L512 512L320 320L128 512L64 448Z" />
              : <path d="M320 448L64 192L128 128L320 320L512 128L576 192Z" />}
          </svg>
        </div>

        {row.description && (
          <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>
            {row.description}
          </div>
        )}

        <div style={{ fontSize: 12, color: DIM }}>
          Updated {timeAgo(row.updated_at)}
        </div>
      </button>

      {open && (
        <div style={{ borderTop: `1px solid ${CONTENT_BDR}`, padding: 14, display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gap: 8 }}>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="List title"
              style={inputStyle}
            />

            <CollectionPicker
              collections={collections}
              value={collectionId}
              onChange={setCollectionId}
              onCreateNew={onCollectionCreated}
            />

            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Description"
              rows={3}
              style={textareaStyle}
            />

            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => void handleSaveList()}
                disabled={saving}
                style={{
                  padding: "8px 14px",
                  borderRadius: 7,
                  border: "none",
                  background: TEAL,
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: FONT,
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? "Saving…" : "Save list"}
              </button>

              <button
                type="button"
                onClick={() => void handleDeleteList()}
                disabled={deleting}
                style={{
                  padding: "8px 14px",
                  borderRadius: 7,
                  border: `1px solid ${CONTENT_BDR}`,
                  background: "transparent",
                  color: RED,
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: FONT,
                  cursor: deleting ? "not-allowed" : "pointer",
                  opacity: deleting ? 0.7 : 1,
                }}
              >
                {deleting ? "Deleting…" : "Delete list"}
              </button>
            </div>
          </div>

          <ItemComposer onAdd={handleAddItem} />

          <div style={{ display: "grid", gap: 8 }}>
            {items.length === 0 ? (
              <div style={{ padding: "10px 2px 2px", fontSize: 13, color: DIM, fontFamily: FONT }}>
                No items yet.
              </div>
            ) : (
              items.map(item => (
                <ListItemRow
                  key={item.id}
                  item={item}
                  onUpdated={onItemUpdated}
                  onDeleted={onItemDeleted}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function HolsterLists({
  user,
  collections,
  onCollectionCreated,
  initialOpenListId,
}: {
  user: User
  collections: HolsterCollection[]
  onCollectionCreated: (col: HolsterCollection) => void
  initialOpenListId?: string
}) {
  const [lists, setLists] = useState<HolsterList[]>([])
  const [items, setItems] = useState<HolsterListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState<string | null>(initialOpenListId ?? null)
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState("")
  const [collectionFilter, setCollectionFilter] = useState<CollectionFilter>("all")
  const [sortMode, setSortMode] = useState<"recent" | "az">("recent")

  useEffect(() => {
    setLoading(true)

    Promise.all([
      supabase
        .from("holster_lists")
        .select("id, title, description, collection_id, sort_order, created_at, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false }),
      supabase
        .from("holster_list_items")
        .select("id, list_id, title, note, is_task, is_done, sort_order, created_at, updated_at")
        .eq("user_id", user.id)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
    ]).then(([listsRes, itemsRes]) => {
      if (listsRes.data) setLists(listsRes.data)
      if (itemsRes.data) setItems(itemsRes.data)
      setLoading(false)
    })
  }, [user.id])

  const itemsByList = useMemo(() => {
    const map: Record<string, HolsterListItem[]> = {}
    for (const item of items) {
      if (!map[item.list_id]) map[item.list_id] = []
      map[item.list_id].push(item)
    }
    return map
  }, [items])

  const filteredLists = useMemo(() => {
    const q = search.trim().toLowerCase()

    const out = lists.filter(row => {
      const collectionMatch =
        collectionFilter === "all"
          ? true
          : collectionFilter === "none"
            ? !row.collection_id
            : row.collection_id === collectionFilter

      if (!collectionMatch) return false
      if (!q) return true

      const collectionName = collections.find(col => col.id === row.collection_id)?.name ?? ""
      return (
        row.title.toLowerCase().includes(q) ||
        (row.description ?? "").toLowerCase().includes(q) ||
        collectionName.toLowerCase().includes(q)
      )
    })

    out.sort((a, b) => {
      if (sortMode === "az") return a.title.localeCompare(b.title)
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    })

    return out
  }, [lists, search, collectionFilter, sortMode, collections])

  function handleListCreated(row: HolsterList) {
    setLists(prev => [row, ...prev])
    setShowAdd(false)
    setOpenId(row.id)
  }

  function handleListUpdated(row: HolsterList) {
    setLists(prev => prev.map(item => (item.id === row.id ? row : item)))
  }

  function handleListDeleted(id: string) {
    setLists(prev => prev.filter(item => item.id !== id))
    setItems(prev => prev.filter(item => item.list_id !== id))
    if (openId === id) setOpenId(null)
  }

  function handleItemAdded(row: HolsterListItem) {
    setItems(prev => [...prev, row])
  }

  function handleItemUpdated(row: HolsterListItem) {
    setItems(prev => prev.map(item => (item.id === row.id ? row : item)))
  }

  function handleItemDeleted(id: string) {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", background: CONTENT_BG, overflow: "hidden" }}>
      <div
        className="hol-header-bar"
        style={{
          height: 60,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 16px",
          borderBottom: `1px solid ${CONTENT_BDR}`,
          background: CARD_BG,
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 800, color: TEXT, fontFamily: FONT }}>
          Lists & Tasks
        </div>

        <div className="hol-search-box" style={{ maxWidth: 260, width: "100%", marginLeft: 6 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search lists"
            style={{ ...inputStyle, height: 34 }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginLeft: "auto" }}>
          <select
            value={collectionFilter}
            onChange={e => setCollectionFilter(e.target.value as CollectionFilter)}
            style={{
              height: 34,
              padding: "0 10px",
              borderRadius: 7,
              border: `1px solid ${CONTENT_BDR}`,
              background: CARD_BG,
              fontSize: 13,
              fontFamily: FONT,
              color: TEXT,
              outline: "none",
            }}
          >
            <option value="all">All collections</option>
            <option value="none">Unassigned</option>
            {collections.map(col => (
              <option key={col.id} value={col.id}>{col.name}</option>
            ))}
          </select>

          <ChipButton active={sortMode === "az"} onClick={() => setSortMode(prev => prev === "az" ? "recent" : "az")}>
            {sortMode === "az" ? "A–Z" : "Recent"}
          </ChipButton>

          <button
            type="button"
            onClick={() => setShowAdd(v => !v)}
            style={{
              height: 34,
              padding: "0 12px",
              borderRadius: 7,
              border: "none",
              background: TEAL,
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              fontFamily: FONT,
              cursor: "pointer",
            }}
          >
            {showAdd ? "Close" : "+ New List"}
          </button>
        </div>
      </div>

      <div className="hol-carousels" style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 16 }}>
        {showAdd && (
          <div style={{ marginBottom: 16 }}>
            <AddListCard
              user={user}
              collections={collections}
              onCreate={handleListCreated}
              onCancel={() => setShowAdd(false)}
              onCollectionCreated={onCollectionCreated}
            />
          </div>
        )}

        {loading ? (
          <div style={{ padding: 18, color: DIM, fontFamily: FONT }}>Loading…</div>
        ) : filteredLists.length === 0 ? (
          <div
            style={{
              padding: 18,
              border: `1px dashed ${CONTENT_BDR}`,
              borderRadius: 12,
              color: DIM,
              fontFamily: FONT,
              background: CARD_BG,
            }}
          >
            No lists yet.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 16,
              alignItems: "start",
            }}
          >
            {filteredLists.map(row => (
              <ListCard
                key={row.id}
                user={user}
                row={row}
                collections={collections}
                collectionName={collections.find(col => col.id === row.collection_id)?.name ?? null}
                items={itemsByList[row.id] ?? []}
                open={openId === row.id}
                onToggle={() => setOpenId(prev => prev === row.id ? null : row.id)}
                onCollectionCreated={onCollectionCreated}
                onListUpdated={handleListUpdated}
                onListDeleted={handleListDeleted}
                onItemAdded={handleItemAdded}
                onItemUpdated={handleItemUpdated}
                onItemDeleted={handleItemDeleted}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
