import { useEffect, useMemo, useRef, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "./supabase"
import type { HolsterCollection } from "./HolsterPanel"
import { NoteEditor, timeAgo } from "./HolsterNotes"
import type { HolsterNote, NoteType } from "./HolsterNotes"
import { PinPrompt } from "./HolsterPasswords"
import { deriveKey, checkVerifier } from "./holsterCrypto"

// ─── constants ────────────────────────────────────────────────────────────────

const FONT        = `"Inter", system-ui, -apple-system, sans-serif`
const CONTENT_BG  = "#f8fafc"
const CONTENT_BDR = "#e2e8f0"
const CARD_BG     = "#ffffff"
const TEAL        = "#5b95a7"
const RED         = "#c14141"
const TEXT        = "#0f172a"
const MUTED       = "#475569"
const DIM         = "#94a3b8"

const PREVIEW_LIMIT = 5

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth <= 768)
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth <= 768)
    window.addEventListener("resize", fn)
    return () => window.removeEventListener("resize", fn)
  }, [])
  return mobile
}

// ─── types ────────────────────────────────────────────────────────────────────

type ItemType = "notes" | "snippets" | "files" | "passwords" | "keys" | "links"

type RawItem = {
  id: string
  title: string
  content?: string
  value?: string
  url?: string
  username?: string
  tag?: string
  notes?: string
  collection: string | null
  created_at: string
  updated_at: string
  _type: ItemType
}

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
  user_id: string
  list_id: string
  title: string
  note: string | null
  is_task: boolean
  is_done: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

type EditorTarget = { item: HolsterNote; type: NoteType } | null

// ─── config ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<ItemType, { label: string; color: string; table: string; encrypted?: boolean }> = {
  notes:     { label: "Notes",     color: TEAL,      table: "holster_notes" },
  snippets:  { label: "Snippets",  color: "#7c6fa0", table: "holster_snippets" },
  files:     { label: "Files",     color: "#e07b4a", table: "holster_files" },
  links:     { label: "Links",     color: "#4a9e6b", table: "holster_links" },
  passwords: { label: "Passwords", color: RED,       table: "holster_passwords", encrypted: true },
  keys:      { label: "Keys",      color: "#c49a2a", table: "holster_keys", encrypted: true },
}

const TYPE_ORDER: ItemType[] = ["notes", "snippets", "links", "files", "passwords", "keys"]

const SELECT: Record<ItemType, string> = {
  notes:     "id, title, content, collection, created_at, updated_at",
  snippets:  "id, title, content, collection, created_at, updated_at",
  files:     "id, title, collection, created_at, updated_at",
  links:     "id, title, url, collection, created_at, updated_at",
  passwords: "id, title, username, password, collection, created_at, updated_at",
  keys:      "id, title, value, tag, collection, created_at, updated_at",
}

// ─── small shared components ──────────────────────────────────────────────────

function CollectionDot({ collection }: { collection: HolsterCollection | null }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 8px", borderRadius: 999,
      background: "#f1f5f9", color: MUTED,
      fontSize: 12, fontWeight: 600, fontFamily: FONT,
      whiteSpace: "nowrap", flexShrink: 0,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: collection?.color ?? DIM, flexShrink: 0, display: "inline-block" }} />
      {collection?.name ?? "Unfiled"}
    </span>
  )
}

function SectionHeader({ id, title, count, color, onAdd }: { id: string; title: string; count: number; color: string; onAdd?: () => void }) {
  return (
    <div id={id} style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 10, borderBottom: `1px solid ${CONTENT_BDR}` }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0, display: "inline-block" }} />
      <span style={{ fontSize: 13, fontWeight: 700, color: MUTED, letterSpacing: "0.07em", textTransform: "uppercase", fontFamily: FONT }}>{title}</span>
      <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 999, background: "#f1f5f9", color: MUTED, fontFamily: FONT }}>{count}</span>
      {onAdd && (
        <button
          onClick={onAdd}
          style={{ marginLeft: "auto", width: 28, height: 28, borderRadius: "50%", border: "none", background: "transparent", cursor: "pointer", color: MUTED, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: 0 }}
          onMouseEnter={e => { e.currentTarget.style.color = color }}
          onMouseLeave={e => { e.currentTarget.style.color = MUTED }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width={22} height={22} fill="currentColor">
            <path d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM296 408L296 344L232 344C218.7 344 208 333.3 208 320C208 306.7 218.7 296 232 296L296 296L296 232C296 218.7 306.7 208 320 208C333.3 208 344 218.7 344 232L344 296L408 296C421.3 296 432 306.7 432 320C432 333.3 421.3 344 408 344L344 344L344 408C344 421.3 333.3 432 320 432C306.7 432 296 421.3 296 408z"/>
          </svg>
        </button>
      )}
    </div>
  )
}

function ShowMoreToggle({ sectionKey, hiddenCount, expanded, onToggle }: {
  sectionKey: string
  hiddenCount: number
  expanded: boolean
  onToggle: () => void
}) {
  if (hiddenCount <= 0) return null
  return (
    <button
      onClick={onToggle}
      style={{
        background: "none", border: "none", cursor: "pointer",
        fontSize: 11, color: DIM, fontFamily: FONT,
        padding: "5px 10px", textAlign: "left",
        display: "inline-flex", alignItems: "center", gap: 5,
        borderRadius: 6,
      }}
      onMouseEnter={e => (e.currentTarget.style.color = MUTED)}
      onMouseLeave={e => (e.currentTarget.style.color = DIM)}
    >
      <svg viewBox="0 0 16 16" width={10} height={10} fill="currentColor" style={{ transition: "transform 0.15s", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}>
        <path d="M8 10.5L2 4.5h12z" />
      </svg>
      {expanded ? "Show less" : `+ ${hiddenCount} more ${sectionKey}`}
    </button>
  )
}

// ─── expandable row list ──────────────────────────────────────────────────────

function ExpandableRowList({ children, sectionKey, limit = PREVIEW_LIMIT }: { children: React.ReactNode[]; sectionKey: string; limit?: number }) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? children : children.slice(0, limit)
  const hiddenCount = children.length - limit

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {visible}
      <ShowMoreToggle
        sectionKey={sectionKey}
        hiddenCount={hiddenCount}
        expanded={expanded}
        onToggle={() => setExpanded(v => !v)}
      />
    </div>
  )
}

// ─── compact row ──────────────────────────────────────────────────────────────

function CompactRow({ item, collection, onClick }: {
  item: RawItem
  collection: HolsterCollection | null
  onClick?: () => void
}) {
  const color = TYPE_CONFIG[item._type].color
  const El = onClick ? "button" : "div"

  return (
    <El
      onClick={onClick}
      style={{
        width: "100%", boxSizing: "border-box",
        display: "flex", alignItems: "center", gap: 8,
        padding: "10px 12px", borderRadius: 8,
        background: CARD_BG, border: `1px solid ${CONTENT_BDR}`,
        cursor: onClick ? "pointer" : "default",
        textAlign: "left", fontFamily: FONT,
        transition: "border-color 0.1s",
      }}
      onMouseEnter={e => { if (onClick) (e.currentTarget as HTMLElement).style.borderColor = "#cbd5e1" }}
      onMouseLeave={e => { if (onClick) (e.currentTarget as HTMLElement).style.borderColor = CONTENT_BDR }}
    >
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 14, fontWeight: 600, color: TEXT, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {item.title || "Untitled"}
      </span>
      <CollectionDot collection={collection} />
      <span style={{ fontSize: 12, color: DIM, fontFamily: FONT, flexShrink: 0 }}>{timeAgo(item.updated_at)}</span>
    </El>
  )
}

// ─── link row ─────────────────────────────────────────────────────────────────

function LinkRow({ item, collection }: { item: RawItem; collection: HolsterCollection | null }) {
  const color = TYPE_CONFIG.links.color
  let host = ""
  try { host = item.url ? new URL(item.url).host.replace(/^www\./, "") : "" }
  catch { host = (item.url ?? "").replace(/^https?:\/\//, "").split("/")[0] }
  const favicon = host ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64` : ""

  return (
    <a
      href={item.url ?? "#"}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 12px", borderRadius: 8,
        background: CARD_BG, border: `1px solid ${CONTENT_BDR}`,
        textDecoration: "none", color: TEXT, fontFamily: FONT,
        transition: "border-color 0.1s",
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = "#cbd5e1")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = CONTENT_BDR)}
    >
      <div style={{ width: 22, height: 22, borderRadius: 5, background: `${color}14`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
        {favicon
          ? <img src={favicon} alt="" width={16} height={16} style={{ display: "block" }} loading="lazy" />
          : <svg viewBox="0 0 640 640" width={12} height={12} fill={color}><path d="M528 320C528 434.9 434.9 528 320 528C205.1 528 112 434.9 112 320C112 205.1 205.1 112 320 112C377.8 112 430.1 135.6 467.8 173.5L389 252.3C370.2 237.3 346.4 228.3 320 228.3C259 228.3 209.3 278 209.3 339C209.3 400 259 449.7 320 449.7C373.6 449.7 418.4 411.5 429.1 361L320 361C297.9 361 280 343.1 280 321C280 298.9 297.9 281 320 281L485.3 281C508.9 281 528 300.1 528 323.7L528 320z" /></svg>
        }
      </div>
      <span style={{ fontSize: 14, fontWeight: 600, color: TEXT, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {item.title || host || "Untitled link"}
      </span>
      {host && <span style={{ fontSize: 12, color: DIM, flexShrink: 0 }}>{host}</span>}
      <CollectionDot collection={collection} />
      <span style={{ fontSize: 12, color: DIM, flexShrink: 0 }}>{timeAgo(item.updated_at)}</span>
    </a>
  )
}

// ─── encrypted row ────────────────────────────────────────────────────────────

function EncryptedRow({ item, collection, onNavigate }: {
  item: RawItem
  collection: HolsterCollection | null
  onNavigate: () => void
}) {
  const color = TYPE_CONFIG[item._type].color

  return (
    <div
      onClick={onNavigate}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 12px", borderRadius: 8,
        background: CARD_BG, border: `1px solid ${CONTENT_BDR}`,
        fontFamily: FONT, cursor: "pointer", transition: "border-color 0.1s",
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = "#cbd5e1")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = CONTENT_BDR)}
    >
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 14, fontWeight: 600, color: TEXT, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {item.title || "Untitled"}
      </span>
      {item.username && (
        <span style={{ fontSize: 12, color: MUTED, flexShrink: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "20%" }}>
          {item.username}
        </span>
      )}
      {item.tag && (
        <span style={{ fontSize: 12, color, flexShrink: 0 }}>{item.tag}</span>
      )}
      <span style={{ fontSize: 12, fontFamily: "monospace", color: DIM, letterSpacing: "0.1em", flexShrink: 0 }}>
        ••••••••••••
      </span>
      <CollectionDot collection={collection} />
      <span style={{ fontSize: 12, color: DIM, flexShrink: 0 }}>{timeAgo(item.updated_at)}</span>
    </div>
  )
}

// ─── locked strip ─────────────────────────────────────────────────────────────

function LockedStrip({ type, onUnlock }: { type: ItemType; onUnlock: () => void }) {
  const { color, label } = TYPE_CONFIG[type]
  return (
    <div
      onClick={onUnlock}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 14px", borderRadius: 8,
        background: `${color}08`, border: `1px dashed ${color}55`,
        cursor: "pointer",
      }}
    >
      <svg viewBox="0 0 640 640" width={14} height={14} fill={color} style={{ flexShrink: 0 }}>
        <path d="M224 256L224 192C224 138.1 267.1 96 320 96C372.9 96 416 139.1 416 192L416 256L448 256C483.3 256 512 284.7 512 320L512 544C512 579.3 483.3 608 448 608L192 608C156.7 608 128 579.3 128 544L128 320C128 284.7 156.7 256 192 256L224 256zM288 256L352 256L352 192C352 174.3 337.7 160 320 160C302.3 160 288 174.3 288 192L288 256zM320 384C302.3 384 288 398.3 288 416C288 433.7 302.3 448 320 448C337.7 448 352 433.7 352 416C352 398.3 337.7 384 320 384z" />
      </svg>
      <span style={{ fontSize: 12, color, fontFamily: FONT, flex: 1 }}>{label} are locked</span>
      <button
        onClick={e => { e.stopPropagation(); onUnlock() }}
        style={{
          fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6,
          border: `1px solid ${color}55`, background: CARD_BG,
          color, cursor: "pointer", fontFamily: FONT,
        }}
      >
        Unlock
      </button>
    </div>
  )
}

// ─── list progress card ───────────────────────────────────────────────────────

function ListProgressCard({ list, items, onClick }: { list: HolsterList; items: HolsterListItem[]; onClick: () => void }) {
  const tasks = items.filter(i => i.is_task)
  const done  = tasks.filter(i => i.is_done).length
  const total = tasks.length || items.length
  const pct   = tasks.length > 0 ? Math.round(done / tasks.length * 100) : 0

  return (
    <div
      onClick={onClick}
      style={{
        background: CARD_BG, border: `1px solid ${CONTENT_BDR}`, borderRadius: 10,
        padding: "10px 12px", display: "flex", flexDirection: "column", gap: 7,
        cursor: "pointer", transition: "border-color 0.1s",
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = "#cbd5e1")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = CONTENT_BDR)}
    >
      <span style={{ fontSize: 13, fontWeight: 600, color: TEXT, fontFamily: FONT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {list.title}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 11, color: DIM, fontFamily: FONT, flexShrink: 0 }}>
          {tasks.length > 0 ? `${done} / ${tasks.length}` : `${total} item${total !== 1 ? "s" : ""}`}
        </span>
        <div style={{ flex: 1, height: 3, borderRadius: 999, background: CONTENT_BDR, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: TEAL, borderRadius: 999, transition: "width 0.2s" }} />
        </div>
        <span style={{ fontSize: 10, color: DIM, fontFamily: FONT, flexShrink: 0 }}>{timeAgo(list.updated_at)}</span>
      </div>
    </div>
  )
}

// ─── pin modal ────────────────────────────────────────────────────────────────

function InlinePinModal({ user, onUnlocked, onCancel }: {
  user: User
  onUnlocked: (key: CryptoKey) => void
  onCancel: () => void
}) {
  async function handleEnterPin(pin: string): Promise<string | null> {
    const { data } = await supabase
      .from("holster_passwords_meta")
      .select("salt, verifier")
      .eq("user_id", user.id)
      .single()

    if (!data) return "Could not load PIN data."

    const salt = Uint8Array.from(atob(data.salt), c => c.charCodeAt(0))
    const key  = await deriveKey(pin, salt)
    const ok   = await checkVerifier(key, data.verifier)

    if (!ok) return "Incorrect PIN."
    onUnlocked(key)
    return null
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,20,0.6)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: CARD_BG, borderRadius: 16, overflow: "hidden", width: 420, boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${CONTENT_BDR}` }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: TEXT, fontFamily: FONT }}>Enter PIN to unlock</span>
          <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", color: DIM, fontSize: 20, lineHeight: 1 }}>×</button>
        </div>
        <PinPrompt mode="enter" onSuccess={handleEnterPin} onSetPin={async () => null} />
      </div>
    </div>
  )
}

// ─── anchor pills ─────────────────────────────────────────────────────────────

function AnchorPills({ counts, contentRef }: {
  counts: Record<string, number>
  contentRef: React.RefObject<HTMLDivElement | null>
}) {
  function scrollTo(anchor: string) {
    const el = contentRef.current?.querySelector(`#${anchor}`)
    el?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  function pill(anchor: string, label: string, color: string, count: number) {
    if (count === 0) return null
    return (
      <button
        key={anchor}
        onClick={() => scrollTo(anchor)}
        style={{
          fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999,
          background: `${color}14`, color, border: `1px solid ${color}40`,
          cursor: "pointer", fontFamily: FONT, flexShrink: 0,
        }}
      >
        {count} {label}
      </button>
    )
  }

  const secCount = (counts.passwords ?? 0) + (counts.keys ?? 0)
  const secLabel = [
    counts.passwords > 0 && `${counts.passwords} Passwords`,
    counts.keys      > 0 && `${counts.keys} Keys`,
  ].filter(Boolean).join(" · ")

  return (
    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
      {pill("anchor-lists",    "Lists",    TEAL,      counts.lists     ?? 0)}
      {pill("anchor-notes",    "Notes",    TEAL,      counts.notes     ?? 0)}
      {pill("anchor-snippets", "Snippets", "#7c6fa0", counts.snippets  ?? 0)}
      {pill("anchor-links",    "Links",    "#4a9e6b", counts.links     ?? 0)}
      {pill("anchor-files",    "Files",    "#e07b4a", counts.files     ?? 0)}
      {secCount > 0 && (
        <button
          onClick={() => scrollTo("anchor-security")}
          style={{
            fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999,
            background: `${RED}14`, color: RED, border: `1px solid ${RED}40`,
            cursor: "pointer", fontFamily: FONT, flexShrink: 0,
          }}
        >
          {secLabel}
        </button>
      )}
    </div>
  )
}

// ─── main export ──────────────────────────────────────────────────────────────

export default function HolsterAllView({ user, collections, cryptoKey: propKey, onCryptoKeySet, onCollectionCreated, onNavigateToList, onNavigateToCategory }: {
  user: User
  collections: HolsterCollection[]
  cryptoKey: CryptoKey | null
  onCryptoKeySet: (key: CryptoKey) => void
  onCollectionCreated: (col: HolsterCollection) => void
  onNavigateToList: (listId: string) => void
  onNavigateToCategory: (category: string) => void
}) {
  const [itemsByType, setItemsByType]   = useState<Partial<Record<ItemType, RawItem[]>>>({})
  const [lists, setLists]               = useState<HolsterList[]>([])
  const [listItems, setListItems]       = useState<HolsterListItem[]>([])
  const [loading, setLoading]           = useState(true)
  const [cryptoKey, setCryptoKey]       = useState<CryptoKey | null>(propKey)
  const [showPinModal, setShowPinModal] = useState(false)
  const [editing, setEditing]           = useState<EditorTarget>(null)
  const [collectionFilter, setCollectionFilter] = useState<string>("all")

  const contentRef = useRef<HTMLDivElement>(null)
  const isMobile   = useIsMobile()
  const [expanded, setExpanded] = useState<Partial<Record<ItemType, boolean>>>({})

  useEffect(() => {
    if (propKey) setCryptoKey(propKey)
  }, [propKey])

  // ── fetch ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    async function fetchAll() {
      setLoading(true)

      const results = await Promise.all(
        TYPE_ORDER.map(async type => {
          const { table } = TYPE_CONFIG[type]
          const { data } = await supabase
            .from(table)
            .select(SELECT[type])
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false })

          return {
            type,
            items: (data ?? []).map(r => ({ ...(r as unknown as RawItem), _type: type })),
          }
        })
      )

      const nextItems: Partial<Record<ItemType, RawItem[]>> = {}
      for (const result of results) nextItems[result.type] = result.items

      const { data: listData } = await supabase
        .from("holster_lists")
        .select("id, title, description, collection_id, sort_order, created_at, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })

      const { data: listItemData } = await supabase
        .from("holster_list_items")
        .select("id, user_id, list_id, title, note, is_task, is_done, sort_order, created_at, updated_at")
        .eq("user_id", user.id)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true })

      setItemsByType(nextItems)
      setLists(listData ?? [])
      setListItems(listItemData ?? [])
      setLoading(false)
    }

    void fetchAll()
  }, [user.id])

  // ── derived ────────────────────────────────────────────────────────────────

  const collectionById = useMemo(() => {
    const map: Record<string, HolsterCollection> = {}
    for (const col of collections) map[col.id] = col
    return map
  }, [collections])

  const filteredItemsByType = useMemo(() => {
    const map: Partial<Record<ItemType, RawItem[]>> = {}
    for (const type of TYPE_ORDER) {
      const items = itemsByType[type] ?? []
      map[type] = collectionFilter === "all" ? items : items.filter(i => i.collection === collectionFilter)
    }
    return map
  }, [itemsByType, collectionFilter])

  const filteredLists = useMemo(
    () => collectionFilter === "all" ? lists : lists.filter(l => l.collection_id === collectionFilter),
    [lists, collectionFilter]
  )

  const listItemsByListId = useMemo(() => {
    const visibleIds = new Set(filteredLists.map(l => l.id))
    const map: Record<string, HolsterListItem[]> = {}
    for (const item of listItems) {
      if (!visibleIds.has(item.list_id)) continue
      if (!map[item.list_id]) map[item.list_id] = []
      map[item.list_id].push(item)
    }
    for (const key of Object.keys(map)) {
      map[key] = [...map[key]].sort((a, b) => a.sort_order - b.sort_order || new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    }
    return map
  }, [filteredLists, listItems])

  const counts = useMemo(() => ({
    notes:     filteredItemsByType.notes?.length     ?? 0,
    snippets:  filteredItemsByType.snippets?.length  ?? 0,
    links:     filteredItemsByType.links?.length     ?? 0,
    files:     filteredItemsByType.files?.length     ?? 0,
    passwords: filteredItemsByType.passwords?.length ?? 0,
    keys:      filteredItemsByType.keys?.length      ?? 0,
    lists:     filteredLists.length,
  }), [filteredItemsByType, filteredLists.length])

  // ── handlers ───────────────────────────────────────────────────────────────

  function handleUnlocked(key: CryptoKey) {
    setCryptoKey(key)
    onCryptoKeySet(key)
    setShowPinModal(false)
  }

  function handleNoteClick(item: RawItem) {
    if (item._type === "notes" || item._type === "snippets") {
      setEditing({ item: item as unknown as HolsterNote, type: item._type === "notes" ? "note" : "snippet" })
    }
  }

  // ── editor passthrough ─────────────────────────────────────────────────────

  if (editing) {
    return (
      <NoteEditor
        item={editing.item}
        isNew={false}
        type={editing.type}
        user={user}
        collections={collections}
        onSave={saved => {
          setItemsByType(prev => {
            const type: ItemType = editing.type === "note" ? "notes" : "snippets"
            return { ...prev, [type]: (prev[type] ?? []).map(i => i.id === saved.id ? { ...saved, _type: type } : i) }
          })
          setEditing(null)
        }}
        onDelete={id => {
          setItemsByType(prev => {
            const type: ItemType = editing.type === "note" ? "notes" : "snippets"
            return { ...prev, [type]: (prev[type] ?? []).filter(i => i.id !== id) }
          })
          setEditing(null)
        }}
        onBack={() => setEditing(null)}
        onCollectionCreated={onCollectionCreated}
      />
    )
  }

  // ── section renderers ──────────────────────────────────────────────────────

  function renderListsSection() {
    if (filteredLists.length === 0) return null
    const listCols = isMobile ? "1fr" : "repeat(auto-fill, minmax(200px, 1fr))"
    return (
      <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <SectionHeader id="anchor-lists" title="Lists" count={filteredLists.length} color={TEAL} onAdd={() => onNavigateToCategory("lists")} />
        <div style={{ display: "grid", gridTemplateColumns: listCols, gap: 8 }}>
          {filteredLists.map(list => (
            <ListProgressCard
              key={list.id}
              list={list}
              items={listItemsByListId[list.id] ?? []}
              onClick={() => onNavigateToList(list.id)}
            />
          ))}
        </div>
      </section>
    )
  }

  function renderColumn(type: ItemType, limit: number) {
    const items = filteredItemsByType[type] ?? []
    const { label, color } = TYPE_CONFIG[type]
    const cols = isMobile ? "1fr" : "1fr 1fr"

    const isFiles = type === "files"
    const displayItems = isFiles && items.length === 0
      ? [] : items

    const rows = displayItems.map(item => {
      const collection = item.collection ? (collectionById[item.collection] ?? null) : null
      if (type === "links") return <LinkRow key={item.id} item={item} collection={collection} />
      return (
        <CompactRow
          key={item.id}
          item={item}
          collection={collection}
          onClick={(type === "notes" || type === "snippets") ? () => handleNoteClick(item) : undefined}
        />
      )
    })

    const filePlaceholders = isFiles && items.length === 0 ? [
      <div key="ph" style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 8, background: CARD_BG, border: `1px dashed ${CONTENT_BDR}`, color: DIM, fontSize: 13, fontFamily: FONT }}>
        No files yet
      </div>
    ] : []

    const allRows = [...rows, ...filePlaceholders]
    if (allRows.length === 0 && !isFiles) return null

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
        <SectionHeader id={`anchor-${type}`} title={label} count={items.length} color={color} onAdd={() => onNavigateToCategory(type)} />
        <div style={{ display: "grid", gridTemplateColumns: cols, gap: 6 }}>
          {allRows.slice(0, expanded[type] ? undefined : limit).map((row, i) => <div key={i}>{row}</div>)}
        </div>
        {rows.length > limit && (
          <ShowMoreToggle
            sectionKey={label.toLowerCase()}
            hiddenCount={rows.length - limit}
            expanded={!!expanded[type]}
            onToggle={() => setExpanded(prev => ({ ...prev, [type]: !prev[type] }))}
          />
        )}
      </div>
    )
  }

  function renderSecuritySection() {
    const passwords = filteredItemsByType.passwords ?? []
    const keys      = filteredItemsByType.keys      ?? []
    if (passwords.length === 0 && keys.length === 0) return null

    const secCols = isMobile ? "1fr" : "1fr 1fr"

    return (
      <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <SectionHeader id="anchor-security" title="Security" count={passwords.length + keys.length} color={RED} />
        <div style={{ display: "grid", gridTemplateColumns: secCols, gap: 16, alignItems: "start" }}>
          {passwords.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: FONT }}>
                Passwords <span style={{ fontWeight: 400, color: DIM }}>{passwords.length}</span>
              </span>
              {!cryptoKey
                ? <LockedStrip type="passwords" onUnlock={() => setShowPinModal(true)} />
                : <ExpandableRowList sectionKey="passwords" limit={PREVIEW_LIMIT}>
                    {passwords.map(item => {
                      const collection = item.collection ? (collectionById[item.collection] ?? null) : null
                      return <EncryptedRow key={item.id} item={item} collection={collection} onNavigate={() => onNavigateToCategory("passwords")} />
                    })}
                  </ExpandableRowList>
              }
            </div>
          )}
          {keys.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: FONT }}>
                Keys <span style={{ fontWeight: 400, color: DIM }}>{keys.length}</span>
              </span>
              {!cryptoKey
                ? <LockedStrip type="keys" onUnlock={() => setShowPinModal(true)} />
                : <ExpandableRowList sectionKey="keys" limit={PREVIEW_LIMIT}>
                    {keys.map(item => {
                      const collection = item.collection ? (collectionById[item.collection] ?? null) : null
                      return <EncryptedRow key={item.id} item={item} collection={collection} onNavigate={() => onNavigateToCategory("keys")} />
                    })}
                  </ExpandableRowList>
              }
            </div>
          )}
        </div>
      </section>
    )
  }

  const isEmpty = ["notes","snippets","links","passwords","keys"].every(t => (filteredItemsByType[t as ItemType]?.length ?? 0) === 0) && filteredLists.length === 0

  const pairedCols = isMobile ? "1fr" : "1fr 1fr"

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", background: CONTENT_BG, overflow: "hidden" }}>

      {/* header */}
      <div style={{ borderBottom: `1px solid ${CONTENT_BDR}`, padding: "14px 24px", flexShrink: 0, background: CARD_BG, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: TEXT, fontFamily: FONT }}>All</span>
          <span style={{ fontSize: 12, color: DIM, fontFamily: FONT }}>Everything in your holster</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <select
            value={collectionFilter}
            onChange={e => setCollectionFilter(e.target.value)}
            style={{
              height: 30, padding: "0 10px",
              borderRadius: 999, border: `1px solid ${CONTENT_BDR}`,
              background: "#fff", color: TEXT,
              fontFamily: FONT, fontSize: 13, fontWeight: 600, outline: "none",
              flexShrink: 0,
            }}
          >
            <option value="all">All collections</option>
            {collections.map(col => (
              <option key={col.id} value={col.id}>{col.name}</option>
            ))}
          </select>
          <AnchorPills counts={counts} contentRef={contentRef} />
        </div>
      </div>

      {/* content */}
      <div ref={contentRef} style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 26 }}>
        {loading ? (
          <div style={{ fontSize: 14, color: DIM, fontFamily: FONT }}>Loading…</div>
        ) : isEmpty ? (
          <div style={{ background: CARD_BG, border: `1px solid ${CONTENT_BDR}`, borderRadius: 16, padding: 24, fontSize: 14, color: DIM, fontFamily: FONT }}>
            Nothing here yet.
          </div>
        ) : (
          <>
            {renderListsSection()}
            <div style={{ display: "grid", gridTemplateColumns: pairedCols, gap: 24, alignItems: "start" }}>
              {renderColumn("notes", 6)}
              {renderColumn("snippets", 6)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: pairedCols, gap: 24, alignItems: "start" }}>
              {renderColumn("links", 6)}
              {renderColumn("files", 6)}
            </div>
            {renderSecuritySection()}
          </>
        )}
      </div>

      {showPinModal && <InlinePinModal user={user} onUnlocked={handleUnlocked} onCancel={() => setShowPinModal(false)} />}
    </div>
  )
}
