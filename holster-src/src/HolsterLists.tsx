import { useEffect, useMemo, useState, type CSSProperties } from "react"
import { supabase } from "./supabase"
import type { User } from "@supabase/supabase-js"
import type { HolsterCollection } from "./HolsterPanel"
import { CollectionPicker } from "./HolsterCollectionPicker"
import type {
  HolsterList,
  HolsterListItem,
} from "./components/HolsterBoardTypes"
import HolsterBoardView, {
  type ComposerState,
  type DropTarget,
} from "./components/HolsterBoardView"

const FONT        = `"Inter", system-ui, -apple-system, sans-serif`
const CONTENT_BG  = "#f8fafc"
const CONTENT_BDR = "#e2e8f0"
const CARD_BG     = "#ffffff"
const TEAL        = "#5b95a7"
const RED         = "#c14141"
const TEXT        = "#0f172a"
const MUTED       = "#475569"
const DIM         = "#94a3b8"

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
      .select(`
        id,
        user_id,
        board_id,
        title,
        description,
        collection_id,
        sort_order,
        created_at,
        updated_at
      `)
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
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState("")
  const [collectionFilter, setCollectionFilter] = useState<CollectionFilter>("all")
  const [sortMode, setSortMode] = useState<"recent" | "az">("recent")
  const [openListIds, setOpenListIds] = useState<string[]>(
    initialOpenListId ? [initialOpenListId] : []
  )
  const [expandedItemIds, setExpandedItemIds] = useState<string[]>([])
  const [composerByList, setComposerByList] = useState<Record<string, ComposerState>>({})
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<DropTarget>(null)

  useEffect(() => {
    setLoading(true)

    Promise.all([

      supabase
        .from("holster_lists")
        .select(`
          id,
          user_id,
          board_id,
          title,
          description,
          collection_id,
          sort_order,
          created_at,
          updated_at
        `)
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false }),

      supabase
        .from("holster_list_items")
        .select(`
          id,
          user_id,
          list_id,
          title,
          note,
          is_task,
          is_done,
          colors,
          sort_order,
          created_at,
          updated_at
        `)
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
    setOpenListIds(prev => [...prev, row.id])
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

  function toggleListOpen(listId: string) {
    setOpenListIds(prev =>
      prev.includes(listId)
        ? prev.filter(id => id !== listId)
        : [...prev, listId]
    )
  }

  function toggleItemExpanded(itemId: string) {
    setExpandedItemIds(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  function getComposer(listId: string): ComposerState {
    return composerByList[listId] ?? {
      title: "",
      note: "",
      notesOpen: false,
      isTask: false,
    }
  }

  function setComposer(listId: string, next: ComposerState) {
    setComposerByList(prev => ({ ...prev, [listId]: next }))
  }

  function patchItem(id: string, patch: Partial<HolsterListItem>) {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...patch } : item))
  }

  async function handleQuickDone(item: HolsterListItem, next: boolean) {
    patchItem(item.id, { is_done: next })

    const { data, error } = await supabase
      .from("holster_list_items")
      .update({ is_done: next })
      .eq("id", item.id)
      .select(`
        id,
        user_id,
        list_id,
        title,
        note,
        is_task,
        is_done,
        colors,
        sort_order,
        created_at,
        updated_at
      `)
      .single()

    if (!error && data) handleItemUpdated(data)
  }

  async function handleSaveItem(item: HolsterListItem) {
    const clean = item.title.trim()
    if (!clean) return

    const { data, error } = await supabase
      .from("holster_list_items")
      .update({
        title: clean,
        note: (item.note ?? "").trim() || null,
        is_task: item.is_task,
        is_done: item.is_task ? item.is_done : false,
      })
      .eq("id", item.id)
      .select(`
        id,
        user_id,
        list_id,
        title,
        note,
        is_task,
        is_done,
        colors,
        sort_order,
        created_at,
        updated_at
      `)
      .single()

    if (!error && data) {
      handleItemUpdated(data)
      setExpandedItemIds(prev => prev.filter(id => id !== item.id))
    }
  }

  async function handleDeleteItem(item: HolsterListItem) {
    if (!confirm(`Delete "${item.title}"?`)) return

    const { error } = await supabase
      .from("holster_list_items")
      .delete()
      .eq("id", item.id)

    if (!error) handleItemDeleted(item.id)
  }

  async function addItemToList(listId: string) {
    const composer = getComposer(listId)
    const clean = composer.title.trim()
    if (!clean) return

    const nextSort = (itemsByList[listId] ?? []).length

    const { data, error } = await supabase
      .from("holster_list_items")
      .insert({
        user_id: user.id,
        list_id: listId,
        title: clean,
        note: composer.note.trim() || null,
        is_task: composer.isTask,
        is_done: false,
        sort_order: nextSort,
      })
      .select(`
        id,
        user_id,
        list_id,
        title,
        note,
        is_task,
        is_done,
        colors,
        sort_order,
        created_at,
        updated_at
      `)
      .single()

    if (!error && data) {
      handleItemAdded(data)
      setComposer(listId, { title: "", note: "", notesOpen: false, isTask: false })
    }
  }

  async function persistReorder(nextItems: HolsterListItem[]) {
    setItems(nextItems)

    await Promise.all(
      nextItems.map(item =>
        supabase
          .from("holster_list_items")
          .update({
            list_id: item.list_id,
            sort_order: item.sort_order,
          })
          .eq("id", item.id)
      )
    )
  }

  async function moveItem(itemId: string, targetListId: string, targetIndex: number) {
    const moving = items.find(item => item.id === itemId)
    if (!moving) return

    const remaining = items.filter(item => item.id !== itemId)
    const sourceListId = moving.list_id

    const targetListItems = remaining
      .filter(item => item.list_id === targetListId)
      .sort((a, b) => a.sort_order - b.sort_order || new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    const clampedIndex = Math.max(0, Math.min(targetIndex, targetListItems.length))
    const moved: HolsterListItem = { ...moving, list_id: targetListId }

    const nextTarget = [
      ...targetListItems.slice(0, clampedIndex),
      moved,
      ...targetListItems.slice(clampedIndex),
    ].map((item, idx) => ({ ...item, sort_order: idx }))

    const nextSource = sourceListId === targetListId
      ? []
      : remaining
          .filter(item => item.list_id === sourceListId)
          .sort((a, b) => a.sort_order - b.sort_order || new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          .map((item, idx) => ({ ...item, sort_order: idx }))

    const untouched = remaining.filter(
      item => item.list_id !== sourceListId && item.list_id !== targetListId
    )

    await persistReorder([...untouched, ...nextTarget, ...nextSource])
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
          <HolsterBoardView
            lists={filteredLists}
            itemsByList={itemsByList}
            openListIds={openListIds}
            expandedItemIds={expandedItemIds}
            draggingItemId={draggingItemId}
            dropTarget={dropTarget}
            getComposer={getComposer}
            setComposer={setComposer}
            toggleListOpen={toggleListOpen}
            toggleItemExpanded={toggleItemExpanded}
            addItemToList={addItemToList}
            moveItem={moveItem}
            setDraggingItemId={setDraggingItemId}
            setDropTarget={setDropTarget}
            patchItem={patchItem}
            handleQuickDone={handleQuickDone}
            handleSaveItem={handleSaveItem}
            handleDeleteItem={handleDeleteItem}
          />
        )}
      </div>
    </div>
  )
}
