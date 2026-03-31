
import { useEffect, useMemo, useRef, useState } from "react"
import { supabase } from "./supabase"
import type { User } from "@supabase/supabase-js"
import type { HolsterCollection } from "./HolsterPanel"
import { NoteEditor, timeAgo } from "./HolsterNotes"
import type { HolsterNote, NoteType } from "./HolsterNotes"
import { PinPrompt } from "./HolsterPasswords"
import { deriveKey, checkVerifier, decrypt } from "./holsterCrypto"
import { ColorDot } from "./HolsterColorPicker"

const FONT        = `"Inter", system-ui, -apple-system, sans-serif`
const CONTENT_BG  = "#f8fafc"
const CONTENT_BDR = "#e2e8f0"
const CARD_BG     = "#ffffff"
const TEAL        = "#5b95a7"
const RED         = "#c14141"
const TEXT        = "#0f172a"
const MUTED       = "#475569"
const DIM         = "#94a3b8"

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

const TYPE_CONFIG: Record<ItemType, { label: string; color: string; table: string; encrypted?: boolean }> = {
  notes:     { label: "Notes",     color: TEAL,      table: "holster_notes" },
  snippets:  { label: "Snippets",  color: "#7c6fa0", table: "holster_snippets" },
  files:     { label: "Files",     color: "#e07b4a", table: "holster_files" },
  links:     { label: "Links",     color: "#4a9e6b", table: "holster_links" },
  passwords: { label: "Passwords", color: RED,       table: "holster_passwords", encrypted: true },
  keys:      { label: "Keys",      color: "#c49a2a", table: "holster_keys",      encrypted: true },
}

const TYPE_ORDER: ItemType[] = ["notes", "snippets", "links", "files", "passwords", "keys"]

const CARD_STYLE: React.CSSProperties = {
  width: 220,
  flexShrink: 0,
  padding: "14px 16px",
  background: CARD_BG,
  border: `1px solid ${CONTENT_BDR}`,
  display: "flex",
  flexDirection: "column",
  gap: 8,
}

const LIST_ITEM_PADDING = "10px 12px"
const LIST_ITEM_RADIUS = 8
const LIST_DROP_UI_HEIGHT = 40
const LIST_DROP_HITBOX_HEIGHT = 12
const LIST_DROP_UI_MARGIN = 6

function CardTitle({ title, color }: { title: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: TEXT, fontFamily: FONT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {title || "Untitled"}
      </span>
      <span style={{ width: 12, height: 12, borderRadius: "50%", background: color, flexShrink: 0, display: "inline-block" }} />
    </div>
  )
}

function InlinePinModal({ user, onUnlocked, onCancel }: {
  user: User
  onUnlocked: (key: CryptoKey) => void
  onCancel: () => void
}) {
  async function handleEnterPin(pin: string): Promise<string | null> {
    const { data } = await supabase.from("holster_passwords_meta").select("salt, verifier").eq("user_id", user.id).single()
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

function NoteCard({ item, onClick }: { item: RawItem; onClick: () => void }) {
  const color = TYPE_CONFIG[item._type].color
  return (
    <button onClick={onClick} style={{ ...CARD_STYLE, textAlign: "left", cursor: "pointer" }}>
      <CardTitle title={item.title} color={color} />
      {item.content && (
        <div style={{ fontSize: 12, color: MUTED, fontFamily: FONT, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {item.content.replace(/<[^>]+>/g, " ").trim()}
        </div>
      )}
      <div style={{ fontSize: 11, color: DIM, fontFamily: FONT, marginTop: "auto" }}>{timeAgo(item.updated_at)}</div>
    </button>
  )
}

function SnippetCard({ item, onClick }: { item: RawItem; onClick: () => void }) {
  const color = TYPE_CONFIG.snippets.color

  return (
    <button
      onClick={onClick}
      style={{
        width: 200,
        flexShrink: 0,
        padding: "12px 14px",
        background: CARD_BG,
        border: `1px solid ${CONTENT_BDR}`,
        borderRadius: 10,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        textAlign: "left",
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            flex: 1,
            fontSize: 13,
            fontWeight: 700,
            color: TEXT,
            fontFamily: FONT,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {item.title || "Untitled"}
        </span>

        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: color,
            flexShrink: 0,
          }}
        />
      </div>

      <div
        style={{
          fontSize: 11,
          color: DIM,
          fontFamily: FONT,
        }}
      >
        {timeAgo(item.updated_at)}
      </div>
    </button>
  )
}

function LinkRow({ item }: { item: RawItem }) {
  const color = TYPE_CONFIG.links.color
  let host = ""
  try {
    host = item.url ? new URL(item.url).host.replace(/^www\./, "") : ""
  } catch {
    host = (item.url ?? "").replace(/^https?:\/\//, "").split("/")[0]
  }
  const favicon = host ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64` : ""

  return (
    <a
      href={item.url ?? "#"}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        textDecoration: "none",
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 10px",
        borderRadius: 10,
        border: `1px solid ${CONTENT_BDR}`,
        background: CARD_BG,
        color: TEXT,
        minWidth: 0,
        width: "100%",
        maxWidth: 220,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          background: `${color}10`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        {favicon ? (
          <img
            src={favicon}
            alt=""
            width={16}
            height={16}
            style={{ display: "block", width: 16, height: 16 }}
            loading="lazy"
          />
        ) : (
          <svg viewBox="0 0 640 640" width={12} height={12} fill={color}>
            <path d="M528 320C528 434.9 434.9 528 320 528C205.1 528 112 434.9 112 320C112 205.1 205.1 112 320 112C377.8 112 430.1 135.6 467.8 173.5L389 252.3C370.2 237.3 346.4 228.3 320 228.3C259 228.3 209.3 278 209.3 339C209.3 400 259 449.7 320 449.7C373.6 449.7 418.4 411.5 429.1 361L320 361C297.9 361 280 343.1 280 321C280 298.9 297.9 281 320 281L485.3 281C508.9 281 528 300.1 528 323.7L528 320z"/>
          </svg>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0, display: "grid", gap: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 700, fontFamily: FONT, color: TEXT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {item.title || host || "Untitled link"}
        </div>
        <div style={{ fontSize: 10, color, fontFamily: FONT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {host || item.url?.replace(/^https?:\/\//, "")}
        </div>
      </div>
    </a>
  )
}

function LockedCard({ type, onUnlock }: { type: ItemType; onUnlock: () => void }) {
  const { color, label } = TYPE_CONFIG[type]
  return (
    <button onClick={onUnlock} style={{ ...CARD_STYLE, cursor: "pointer", textAlign: "center", alignItems: "center", justifyContent: "center", gap: 10, minHeight: 100, border: `1px dashed ${color}66`, background: `${color}08` }}>
      <svg viewBox="0 0 640 640" width={20} height={20} fill={color}>
        <path d="M224 256L224 192C224 138.1 267.1 96 320 96C372.9 96 416 139.1 416 192L416 256L448 256C483.3 256 512 284.7 512 320L512 544C512 579.3 483.3 608 448 608L192 608C156.7 608 128 579.3 128 544L128 320C128 284.7 156.7 256 192 256L224 256zM288 256L352 256L352 192C352 174.3 337.7 160 320 160C302.3 160 288 174.3 288 192L288 256zM320 384C302.3 384 288 398.3 288 416C288 433.7 302.3 448 320 448C337.7 448 352 433.7 352 416C352 398.3 337.7 384 320 384z"/>
      </svg>
      <span style={{ fontSize: 12, fontWeight: 600, color, fontFamily: FONT }}>Unlock {label}</span>
    </button>
  )
}

function EncryptedCard({ item, cryptoKey }: { item: RawItem; cryptoKey: CryptoKey }) {
  const [revealed, setRevealed] = useState(false)
  const [decValue, setDecValue] = useState<string | null>(null)
  const [copied, setCopied]     = useState(false)
  const color   = TYPE_CONFIG[item._type].color
  const rawVal  = item._type === "keys" ? item.value : item.content

  async function handleReveal() {
    if (!rawVal) return
    if (!decValue) {
      const v = await decrypt(cryptoKey, rawVal).catch(() => "⚠ error")
      setDecValue(v)
    }
    setRevealed(v => !v)
  }

  async function handleCopy() {
    if (!rawVal) return
    const v = decValue ?? await decrypt(cryptoKey, rawVal).catch(() => "")
    if (!decValue) setDecValue(v)
    navigator.clipboard.writeText(v)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div style={CARD_STYLE}>
      <CardTitle title={item.title} color={color} />
      {item.username && <div style={{ fontSize: 12, color: MUTED, fontFamily: FONT }}>{item.username}</div>}
      {item.tag && <div style={{ fontSize: 11, color, fontFamily: FONT }}>{item.tag}</div>}
      <div style={{ fontSize: 12, fontFamily: "monospace", color: MUTED, letterSpacing: revealed ? "normal" : "0.1em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {revealed && decValue ? decValue : "••••••••••••"}
      </div>
      <div style={{ display: "flex", gap: 4, marginTop: "auto", alignItems: "center" }}>
        <button onClick={handleReveal} style={{ width: 26, height: 26, border: "none", background: "transparent", cursor: "pointer", color: revealed ? color : DIM, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg viewBox="0 0 640 640" width={13} height={13} fill="currentColor">
            {revealed
              ? <path d="M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9L601.2 634.9C611.6 643.1 626.7 641.2 634.9 630.8S641.2 605.3 630.8 597.1L544 530.6C683.6 456.5 752 320 752 320S633.6 80 320 80C245.3 80 181.1 100.6 128.6 133.4L38.8 5.1z"/>
              : <path d="M320 80C176 80 57.6 196.8 8 292.2C2.9 301.8 2.9 313.2 8 322.8C57.6 418.2 176 535 320 535C464 535 582.4 418.2 632 322.8C637.1 313.2 637.1 301.8 632 292.2C582.4 196.8 464 80 320 80zM320 267C285.7 267 258 294.7 258 329C258 363.3 285.7 391 320 391C354.3 391 382 363.3 382 329C382 294.7 354.3 267 320 267z"/>}
          </svg>
        </button>
        <button onClick={handleCopy} style={{ width: 26, height: 26, border: "none", background: "transparent", cursor: "pointer", color: copied ? color : DIM, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {copied
            ? <svg viewBox="0 0 640 640" width={13} height={13} fill="currentColor"><path d="M256 416L128 288L170.7 245.3L256 330.7L469.3 117.3L512 160L256 416z"/></svg>
            : <svg viewBox="0 0 640 640" width={13} height={13} fill="currentColor"><path d="M224 64C188.7 64 160 92.7 160 128L160 448C160 483.3 188.7 512 224 512L448 512C483.3 512 512 483.3 512 448L512 128C512 92.7 483.3 64 448 64L224 64zM96 160L96 448C96 518.7 153.3 576 224 576L448 576C448 608 422.5 640 384 640L192 640C120 640 64 584 64 512L64 192C64 153.6 96 160 96 160z"/></svg>}
        </button>
        <span style={{ fontSize: 11, color: DIM, fontFamily: FONT, marginLeft: "auto" }}>{timeAgo(item.updated_at)}</span>
      </div>
    </div>
  )
}

function CarouselRow({ type, items, cryptoKey, onRequestUnlock, onNoteClick }: {
  type: ItemType
  items: RawItem[]
  cryptoKey: CryptoKey | null
  onRequestUnlock: () => void
  onNoteClick: (item: RawItem) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { label, color, encrypted } = TYPE_CONFIG[type]
  const locked = encrypted && !cryptoKey

  function scroll(dir: number) {
    scrollRef.current?.scrollBy({ left: dir * 240, behavior: "smooth" })
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: DIM, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: FONT }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color, background: `${color}14`, padding: "2px 8px", borderRadius: 999, fontFamily: FONT }}>{items.length}</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
          <button onClick={() => scroll(-1)} style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${CONTENT_BDR}`, background: CARD_BG, cursor: "pointer", color: MUTED, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg viewBox="0 0 640 640" width={10} height={10} fill="currentColor"><path d="M416 64L192 320L416 576L480 512L320 320L480 128Z"/></svg>
          </button>
          <button onClick={() => scroll(1)} style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${CONTENT_BDR}`, background: CARD_BG, cursor: "pointer", color: MUTED, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg viewBox="0 0 640 640" width={10} height={10} fill="currentColor"><path d="M224 64L448 320L224 576L160 512L320 320L160 128Z"/></svg>
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="holster-carousel-row"
        style={type === "links"
          ? {
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 220px))",
              gap: 8,
              overflowX: "auto",
              paddingBottom: 8,
              scrollbarWidth: "none",
              alignItems: "start",
            }
          : {
              display: "flex",
              gap: 12,
              overflowX: "auto",
              paddingBottom: 8,
              scrollbarWidth: "none",
            }}
      >
        {locked ? (
          <LockedCard type={type} onUnlock={onRequestUnlock} />
        ) : items.map(item => {
          if (type === "links") return <LinkRow key={item.id} item={item} />
          if (encrypted && cryptoKey) return <EncryptedCard key={item.id} item={item} cryptoKey={cryptoKey} />
          if (type === "snippets") return <SnippetCard key={item.id} item={item} onClick={() => onNoteClick(item)} />
          return <NoteCard key={item.id} item={item} onClick={() => onNoteClick(item)} />
        })}
        {items.length === 0 && !locked && <div style={{ fontSize: 13, color: DIM, fontFamily: FONT, padding: "12px 0" }}>Nothing here yet.</div>}
      </div>
    </div>
  )
}

function SmallButton({ children, onClick, tone = "default", disabled = false }: {
  children: React.ReactNode
  onClick: () => void
  tone?: "default" | "primary" | "danger"
  disabled?: boolean
}) {
  const styles =
    tone === "primary"
      ? { background: TEAL, color: "#fff", border: "none" }
      : tone === "danger"
      ? { background: "transparent", color: RED, border: `1px solid ${CONTENT_BDR}` }
      : { background: "transparent", color: MUTED, border: `1px solid ${CONTENT_BDR}` }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        height: 30,
        padding: "0 10px",
        borderRadius: 7,
        fontSize: 12,
        fontWeight: 700,
        fontFamily: FONT,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        ...styles,
      }}
    >
      {children}
    </button>
  )
}

function DropZone({
  active,
  onDragOver,
  onDrop,
}: {
  active: boolean
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
}) {
  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      style={{
        position: "relative",
        height: active ? LIST_DROP_UI_HEIGHT + LIST_DROP_UI_MARGIN * 2 : LIST_DROP_HITBOX_HEIGHT,
        transition: "height 0.12s ease",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: active ? LIST_DROP_UI_MARGIN : "50%",
          transform: active ? "none" : "translateY(-50%)",
          minHeight: active ? LIST_DROP_UI_HEIGHT : 0,
          padding: active ? LIST_ITEM_PADDING : 0,
          borderRadius: LIST_ITEM_RADIUS,
          border: active ? `2px dashed ${TEAL}` : "2px dashed transparent",
          background: active ? `${TEAL}10` : "transparent",
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          pointerEvents: "none",
          opacity: active ? 1 : 0,
          transition: "min-height 0.12s ease, padding 0.12s ease, background 0.12s ease, border-color 0.12s ease, opacity 0.12s ease, top 0.12s ease, transform 0.12s ease",
        }}
      />
    </div>
  )
}

function SummaryBar({ counts }: { counts: Partial<Record<ItemType, number>> }) {
  return (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
      {TYPE_ORDER.filter(t => (counts[t] ?? 0) > 0).map(type => {
        const { label, color } = TYPE_CONFIG[type]
        return (
          <div key={type} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color, background: `${color}14`, padding: "4px 10px", borderRadius: 999, fontFamily: FONT }}>
              {counts[type]} {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

type EditorTarget = { item: HolsterNote; type: NoteType } | null
type DropTarget = { listId: string; index: number } | null

export default function HolsterCollectionView({ user, collection, collections, cryptoKey: propKey, onCryptoKeySet, onCollectionCreated }: {
  user: User
  collection: HolsterCollection
  collections: HolsterCollection[]
  cryptoKey: CryptoKey | null
  onCryptoKeySet: (key: CryptoKey) => void
  onCollectionCreated: (col: HolsterCollection) => void
}) {
  const [itemsByType, setItemsByType] = useState<Partial<Record<ItemType, RawItem[]>>>({})
  const [loading, setLoading]         = useState(true)
  const [cryptoKey, setCryptoKey]     = useState<CryptoKey | null>(propKey)
  const [showPinModal, setShowPinModal] = useState(false)
  const [editing, setEditing]         = useState<EditorTarget>(null)
  const [isRenaming, setIsRenaming]   = useState(false)
  const [renameValue, setRenameValue] = useState(collection.name)
  const [savingName, setSavingName]   = useState(false)

  const [lists, setLists] = useState<HolsterList[]>([])
  const [listItems, setListItems] = useState<HolsterListItem[]>([])
  const [openListIds, setOpenListIds] = useState<string[]>([])
  const [expandedItemIds, setExpandedItemIds] = useState<string[]>([])
  const [showListCreate, setShowListCreate] = useState(false)
  const [newListTitle, setNewListTitle] = useState("")
  const [newListDesc, setNewListDesc] = useState("")
  const [addingList, setAddingList] = useState(false)
  const [composerByList, setComposerByList] = useState<Record<string, { title: string; note: string; notesOpen: boolean; isTask: boolean }>>({})
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<DropTarget>(null)

  const SELECT: Record<ItemType, string> = {
    notes:     "id, title, content, collection, created_at, updated_at",
    snippets:  "id, title, content, collection, created_at, updated_at",
    files:     "id, title, collection, created_at, updated_at",
    links:     "id, title, url, collection, created_at, updated_at",
    passwords: "id, title, username, password, collection, created_at, updated_at",
    keys:      "id, title, value, tag, collection, created_at, updated_at",
  }

  async function handleRecolor(color: string) {
    await supabase.from("holster_collections").update({ color }).eq("id", collection.id)
  }

  async function handleRenameSave() {
    const nextName = renameValue.trim()
    if (!nextName || nextName === collection.name) {
      setRenameValue(collection.name)
      setIsRenaming(false)
      return
    }

    setSavingName(true)
    const { error } = await supabase.from("holster_collections").update({ name: nextName }).eq("id", collection.id)
    setSavingName(false)

    if (error) {
      alert(error.message)
      return
    }

    collection.name = nextName
    setRenameValue(nextName)
    setIsRenaming(false)
  }

  async function fetchAll() {
    setLoading(true)
    const results = await Promise.all(
      TYPE_ORDER.map(async type => {
        const { table } = TYPE_CONFIG[type]
        const { data } = await supabase.from(table).select(SELECT[type]).eq("user_id", user.id).eq("collection", collection.id)
        return { type, items: (data ?? []).map(r => ({ ...(r as unknown as Record<string, unknown>) as RawItem, _type: type })) }
      })
    )

    const map: Partial<Record<ItemType, RawItem[]>> = {}
    results.forEach(({ type, items }) => { map[type] = items })

    const { data: listData } = await supabase
      .from("holster_lists")
      .select("id, title, description, collection_id, sort_order, created_at, updated_at")
      .eq("user_id", user.id)
      .eq("collection_id", collection.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })

    const listIds = new Set((listData ?? []).map(list => list.id))

    const { data: listItemData } = await supabase
      .from("holster_list_items")
      .select("id, user_id, list_id, title, note, is_task, is_done, sort_order, created_at, updated_at")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })

    setItemsByType(map)
    setLists(listData ?? [])
    setListItems((listItemData ?? []).filter(item => listIds.has(item.list_id)))
    setLoading(false)
  }

  useEffect(() => {
    void fetchAll()
    setEditing(null)
    setIsRenaming(false)
    setRenameValue(collection.name)
    setOpenListIds([])
    setExpandedItemIds([])
    setDraggingItemId(null)
    setDropTarget(null)
  }, [collection.id, collection.name])

  useEffect(() => {
    if (propKey) setCryptoKey(propKey)
  }, [propKey])

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

  const counts: Partial<Record<ItemType, number>> = {}
  TYPE_ORDER.forEach(t => { counts[t] = itemsByType[t]?.length ?? 0 })
  const totalCount = Object.values(counts).reduce((a, b) => a + (b ?? 0), 0)

  const itemsByList = useMemo(() => {
    const map: Record<string, HolsterListItem[]> = {}
    for (const item of listItems) {
      if (!map[item.list_id]) map[item.list_id] = []
      map[item.list_id].push(item)
    }
    for (const key of Object.keys(map)) {
      map[key] = [...map[key]].sort((a, b) => a.sort_order - b.sort_order || new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    }
    return map
  }, [listItems])

  function toggleListOpen(listId: string) {
    setOpenListIds(prev => prev.includes(listId) ? [] : [listId])
    setExpandedItemIds([])
  }

  function expandAllLists() {
    setOpenListIds(lists.map(l => l.id))
    setExpandedItemIds([])
  }

  function collapseAllLists() {
    setOpenListIds([])
    setExpandedItemIds([])
  }

  function toggleItemExpanded(itemId: string) {
    setExpandedItemIds(prev => prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId])
  }

  function patchItem(id: string, patch: Partial<HolsterListItem>) {
    setListItems(prev => prev.map(item => item.id === id ? { ...item, ...patch } : item))
  }

  async function handleQuickDone(item: HolsterListItem, next: boolean) {
    patchItem(item.id, { is_done: next })
    const { data, error } = await supabase
      .from("holster_list_items")
      .update({ is_done: next })
      .eq("id", item.id)
      .select("id, user_id, list_id, title, note, is_task, is_done, sort_order, created_at, updated_at")
      .single()
    if (!error && data) setListItems(prev => prev.map(row => row.id === item.id ? data : row))
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
      .select("id, user_id, list_id, title, note, is_task, is_done, sort_order, created_at, updated_at")
      .single()
    if (!error && data) {
      setListItems(prev => prev.map(row => row.id === item.id ? data : row))
      setExpandedItemIds(prev => prev.filter(id => id !== item.id))
    }
  }

  async function handleDeleteItem(item: HolsterListItem) {
    if (!window.confirm(`Delete "${item.title}"?`)) return
    const { error } = await supabase.from("holster_list_items").delete().eq("id", item.id)
    if (!error) {
      setListItems(prev => prev.filter(row => row.id !== item.id))
      setExpandedItemIds(prev => prev.filter(id => id !== item.id))
    }
  }

  function getComposer(listId: string) {
    return composerByList[listId] ?? { title: "", note: "", notesOpen: false, isTask: false }
  }

  function setComposer(listId: string, next: { title: string; note: string; notesOpen: boolean; isTask: boolean }) {
    setComposerByList(prev => ({ ...prev, [listId]: next }))
  }

  async function addList() {
    const clean = newListTitle.trim()
    if (!clean) return
    setAddingList(true)
    const nextSort = lists.length
    const { data, error } = await supabase
      .from("holster_lists")
      .insert({
        user_id: user.id,
        collection_id: collection.id,
        title: clean,
        description: newListDesc.trim() || null,
        sort_order: nextSort,
      })
      .select("id, title, description, collection_id, sort_order, created_at, updated_at")
      .single()
    setAddingList(false)
    if (!error && data) {
      setLists(prev => [...prev, data])
      setNewListTitle("")
      setNewListDesc("")
      setShowListCreate(false)
      setOpenListIds(prev => [...prev, data.id])
    }
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
      .select("id, user_id, list_id, title, note, is_task, is_done, sort_order, created_at, updated_at")
      .single()
    if (!error && data) {
      setListItems(prev => [...prev, data])
      setComposer(listId, { title: "", note: "", notesOpen: false, isTask: false })
    }
  }

  async function persistReorder(nextItems: HolsterListItem[]) {
    setListItems(nextItems)
    const updates = nextItems.map(item =>
      supabase.from("holster_list_items").update({ list_id: item.list_id, sort_order: item.sort_order }).eq("id", item.id)
    )
    await Promise.all(updates)
  }

  async function moveItem(itemId: string, targetListId: string, targetIndex: number) {
    const moving = listItems.find(item => item.id === itemId)
    if (!moving) return

    const remaining = listItems.filter(item => item.id !== itemId)

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

    const nextSource = (sourceListId === targetListId ? [] : remaining
      .filter(item => item.list_id === sourceListId)
      .sort((a, b) => a.sort_order - b.sort_order || new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((item, idx) => ({ ...item, sort_order: idx })))

    const untouched = remaining.filter(item => item.list_id !== sourceListId && item.list_id !== targetListId)
    const nextItems = [...untouched, ...nextTarget, ...nextSource]

    await persistReorder(nextItems)
  }

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

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", background: CONTENT_BG, overflow: "hidden" }}>
      <div style={{ borderBottom: `1px solid ${CONTENT_BDR}`, borderTop: collection.color ? `3px solid ${collection.color}` : undefined, padding: "14px 24px", flexShrink: 0, background: CARD_BG, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <ColorDot value={collection.color} onChange={handleRecolor} />

          {isRenaming ? (
            <>
              <input
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") void handleRenameSave()
                  if (e.key === "Escape") {
                    setRenameValue(collection.name)
                    setIsRenaming(false)
                  }
                }}
                autoFocus
                disabled={savingName}
                style={{ minWidth: 220, maxWidth: 420, fontSize: 18, fontWeight: 800, color: TEXT, fontFamily: FONT, padding: "6px 10px", borderRadius: 8, border: `1px solid ${CONTENT_BDR}`, outline: "none", background: "#fff" }}
              />
              <SmallButton onClick={() => void handleRenameSave()} disabled={savingName}>{savingName ? "Saving..." : "Save"}</SmallButton>
              <SmallButton onClick={() => { setRenameValue(collection.name); setIsRenaming(false) }} disabled={savingName}>Cancel</SmallButton>
            </>
          ) : (
            <>
              <span style={{ fontSize: 18, fontWeight: 800, color: TEXT, fontFamily: FONT }}>{collection.name}</span>
              <button
                onClick={() => setIsRenaming(true)}
                style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${CONTENT_BDR}`, background: CARD_BG, color: MUTED, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                aria-label="Rename collection"
                title="Rename collection"
              >
                <svg viewBox="0 0 640 640" width={12} height={12} fill="currentColor">
                  <path d="M535.1 84.9C570.2 120 570.2 176.9 535.1 212L495 252.1L387.9 145L428 104.9C463.1 69.8 520 69.8 555.1 104.9L535.1 84.9zM353.9 179L461 286.1L214.6 532.5C200.9 546.2 184 556.1 165.4 561.2L89.4 582.3C78.2 585.4 66.2 582.3 57.9 574.1C49.7 565.9 46.6 553.8 49.7 542.6L70.8 466.6C75.9 448 85.8 431.1 99.5 417.4L345.9 171z"/>
                </svg>
              </button>
            </>
          )}

          <span style={{ fontSize: 13, color: DIM, fontFamily: FONT }}>· {totalCount} items</span>
        </div>
        {!loading && <SummaryBar counts={counts} />}
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: 32 }}>
        <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: DIM, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: FONT }}>Lists & Tasks</div>
            <span style={{ fontSize: 12, fontWeight: 700, color: TEAL, background: `${TEAL}14`, padding: "2px 8px", borderRadius: 999, fontFamily: FONT }}>{lists.length}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 2, marginLeft: 4 }}>
              <button
                type="button"
                onClick={() => (openListIds.length === lists.length && lists.length > 0 ? collapseAllLists() : expandAllLists())}
                style={{ width: 52, height: 52, borderRadius: 999, border: "none", background: "transparent", color: MUTED, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, flexShrink: 0 }}
                aria-label={openListIds.length === lists.length && lists.length > 0 ? "Collapse lists" : "Expand lists"}
                title={openListIds.length === lists.length && lists.length > 0 ? "Collapse lists" : "Expand lists"}
              >
                {openListIds.length === lists.length && lists.length > 0 ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width={26} height={26} fill="currentColor"><path d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM441 335C450.4 344.4 450.4 359.6 441 368.9C431.6 378.2 416.4 378.3 407.1 368.9L320.1 281.9L233.1 368.9C223.7 378.3 208.5 378.3 199.2 368.9C189.9 359.5 189.8 344.3 199.2 335L303 231C312.4 221.6 327.6 221.6 336.9 231L441 335z"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width={26} height={26} fill="currentColor"><path d="M320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64zM199 305C189.6 295.6 189.6 280.4 199 271.1C208.4 261.8 223.6 261.7 232.9 271.1L319.9 358.1L406.9 271.1C416.3 261.7 431.5 261.7 440.8 271.1C450.1 280.5 450.2 295.7 440.8 305L337 409C327.6 418.4 312.4 418.4 303.1 409L199 305z"/></svg>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowListCreate(v => !v)}
                style={{ width: 52, height: 52, borderRadius: 999, border: "none", background: "transparent", color: showListCreate ? TEAL : MUTED, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, flexShrink: 0 }}
                aria-label={showListCreate ? "Close new list" : "New list"}
                title={showListCreate ? "Close new list" : "New list"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width={26} height={26} fill="currentColor"><path d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM296 408L296 344L232 344C218.7 344 208 333.3 208 320C208 306.7 218.7 296 232 296L296 296L296 232C296 218.7 306.7 208 320 208C333.3 208 344 218.7 344 232L344 296L408 296C421.3 296 432 306.7 432 320C432 333.3 421.3 344 408 344L344 344L344 408C344 421.3 333.3 432 320 432C306.7 432 296 421.3 296 408z"/></svg>
              </button>
            </div>
          </div>

          {showListCreate && (
            <div style={{ background: CARD_BG, border: `1px solid ${CONTENT_BDR}`, borderRadius: 12, padding: 14, display: "grid", gap: 8, maxWidth: 520 }}>
              <input
                value={newListTitle}
                onChange={e => setNewListTitle(e.target.value)}
                placeholder="List title"
                onKeyDown={e => { if (e.key === "Enter") void addList() }}
                style={{ width: "100%", boxSizing: "border-box", height: 38, padding: "0 12px", borderRadius: 7, border: `1px solid ${CONTENT_BDR}`, background: CARD_BG, fontSize: 14, fontFamily: FONT, color: TEXT, outline: "none" }}
              />
              <textarea
                value={newListDesc}
                onChange={e => setNewListDesc(e.target.value)}
                placeholder="Description"
                rows={3}
                style={{ width: "100%", boxSizing: "border-box", minHeight: 82, padding: 10, borderRadius: 7, border: `1px solid ${CONTENT_BDR}`, background: CARD_BG, fontSize: 14, fontFamily: FONT, color: TEXT, outline: "none", resize: "vertical", lineHeight: 1.5 }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <SmallButton tone="primary" onClick={() => void addList()} disabled={addingList}>{addingList ? "Creating..." : "Create"}</SmallButton>
                <SmallButton onClick={() => setShowListCreate(false)}>Cancel</SmallButton>
              </div>
            </div>
          )}

          {lists.length > 0 ? (
            <div className="holster-board-row" style={{ display: "flex", gap: 12, alignItems: "flex-start", overflowX: "auto", overflowY: "hidden", paddingBottom: 8, scrollbarWidth: "none", msOverflowStyle: "none" }}>
              {lists.map(list => {
                const open = openListIds.includes(list.id)
                const listRows = itemsByList[list.id] ?? []
                return (
                  <div key={list.id} style={{ width: 280, minWidth: 280, maxHeight: open ? "70vh" : "none", border: open ? `1px solid ${TEAL}` : `1px solid ${CONTENT_BDR}`, borderRadius: 12, background: open ? "#fcfeff" : CARD_BG, overflow: "hidden", alignSelf: "flex-start", boxShadow: open ? "0 0 0 2px rgba(91,149,167,0.18), 0 12px 24px rgba(15, 23, 42, 0.10)" : "0 1px 2px rgba(15, 23, 42, 0.04)" }}>
                    <button
                      type="button"
                      onClick={() => toggleListOpen(list.id)}
                      style={{ width: "100%", border: "none", background: open ? "#fcfeff" : CARD_BG, textAlign: "left", padding: 14, display: "grid", gap: 6, cursor: "pointer", fontFamily: FONT, position: open ? "sticky" : "relative", top: 0, zIndex: 2, boxShadow: open ? "0 1px 0 rgba(226,232,240,0.95)" : "none" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 800, color: TEXT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{list.title}</div>
                          <div style={{ marginTop: 2, fontSize: 12, color: DIM }}>{listRows.length} {listRows.length === 1 ? "item" : "items"} · Updated {timeAgo(list.updated_at)}</div>
                        </div>
                        <svg viewBox="0 0 640 640" width={12} height={12} fill={DIM}>
                          {open
                            ? <path d="M320 192L576 448L512 512L320 320L128 512L64 448Z" />
                            : <path d="M320 448L64 192L128 128L320 320L512 128L576 192Z" />}
                        </svg>
                      </div>
                      {list.description && <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>{list.description}</div>}
                    </button>

                    {open && (
                      <div style={{ borderTop: `1px solid ${CONTENT_BDR}`, padding: 12, display: "grid", gap: 10, overflowY: "auto", maxHeight: "calc(70vh - 72px)" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "center", paddingTop: 4, position: "sticky", top: 0, zIndex: 1, background: CARD_BG, paddingBottom: 8 }}>
                          <input
                            value={getComposer(list.id).title}
                            onChange={e => setComposer(list.id, { ...getComposer(list.id), title: e.target.value })}
                            placeholder="Add item and press Enter"
                            onKeyDown={e => {
                              if (e.key === "Enter") {
                                e.preventDefault()
                                void addItemToList(list.id)
                              }
                            }}
                            style={{ width: "100%", boxSizing: "border-box", height: 38, padding: "0 12px", borderRadius: 9, border: `1px solid ${CONTENT_BDR}`, background: "#fff", fontSize: 13, fontFamily: FONT, color: TEXT, outline: "none" }}
                          />
                          <button
                            type="button"
                            onClick={() => void addItemToList(list.id)}
                            style={{ width: 38, height: 38, borderRadius: 9, border: `1px solid ${CONTENT_BDR}`, background: CARD_BG, color: TEAL, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                            aria-label="Add item"
                            title="Add item"
                          >
                            <svg viewBox="0 0 640 640" width={16} height={16} fill="currentColor"><path d="M296 408L296 344L232 344C218.7 344 208 333.3 208 320C208 306.7 218.7 296 232 296L296 296L296 232C296 218.7 306.7 208 320 208C333.3 208 344 218.7 344 232L344 296L408 296C421.3 296 432 306.7 432 320C432 333.3 421.3 344 408 344L344 344L344 408C344 421.3 333.3 432 320 432C306.7 432 296 421.3 296 408z"/></svg>
                          </button>
                        </div>

                        <div style={{ display: "grid", gap: 0 }}>
                          {(() => {
                            const rows = itemsByList[list.id] ?? []
                            const activeEnd = draggingItemId !== null && dropTarget?.listId === list.id && dropTarget.index === rows.length
                            return (
                              <>
                                {rows.map((item, index) => {
                                  const activeBefore = draggingItemId !== null && dropTarget?.listId === list.id && dropTarget.index === index
                                  const expanded = expandedItemIds.includes(item.id)
                                  const dragging = draggingItemId === item.id
                                  return (
                                    <div key={item.id} style={{ display: "grid", gap: 6 }}>
                                      <DropZone
                                        active={activeBefore}
                                        onDragOver={e => {
                                          e.preventDefault()
                                          if (draggingItemId && draggingItemId !== item.id && (dropTarget?.listId !== list.id || dropTarget.index !== index)) {
                                            setDropTarget({ listId: list.id, index })
                                          }
                                        }}
                                        onDrop={e => {
                                          e.preventDefault()
                                          const movingId = draggingItemId ?? e.dataTransfer.getData("text/plain")
                                          if (movingId) void moveItem(movingId, list.id, index)
                                          setDraggingItemId(null)
                                          setDropTarget(null)
                                        }}
                                      />
                                      <div
                                        draggable
                                        style={{ cursor: dragging ? "grabbing" : "grab" }}
                                        onDragStart={e => {
                                          setDraggingItemId(item.id)
                                          e.dataTransfer.setData("text/plain", item.id)
                                          e.dataTransfer.effectAllowed = "move"
                                        }}
                                        onDragEnd={() => {
                                          setDraggingItemId(null)
                                          setDropTarget(null)
                                        }}
                                      >
                                        <div style={{ border: `1px solid ${CONTENT_BDR}`, borderRadius: LIST_ITEM_RADIUS, background: CARD_BG, overflow: "hidden", boxShadow: dragging ? "0 12px 28px rgba(15, 23, 42, 0.18)" : "0 1px 2px rgba(15, 23, 42, 0.04)", opacity: dragging ? 0.55 : 1, transform: dragging ? "scale(1.02)" : "scale(1)", transition: "transform 0.12s ease, box-shadow 0.12s ease, opacity 0.12s ease" }}>
                                          <button
                                            type="button"
                                            onClick={() => toggleItemExpanded(item.id)}
                                            style={{ width: "100%", textAlign: "left", border: "none", background: "transparent", padding: LIST_ITEM_PADDING, display: "flex", alignItems: "center", gap: 10, cursor: dragging ? "grabbing" : "pointer", fontFamily: FONT }}
                                          >
                                            {item.is_task ? (
                                              <input
                                                type="checkbox"
                                                checked={item.is_done}
                                                onChange={e => {
                                                  e.stopPropagation()
                                                  void handleQuickDone(item, e.target.checked)
                                                }}
                                                onClick={e => e.stopPropagation()}
                                              />
                                            ) : (
                                              <span style={{ width: 10, height: 10, borderRadius: "50%", background: `${TEAL}55`, flexShrink: 0 }} />
                                            )}

                                            <div style={{ flex: 1, minWidth: 0 }}>
                                              <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.title}</div>
                                              {(item.note || item.is_task) && (
                                                <div style={{ marginTop: 2, fontSize: 12, color: DIM, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                  {item.is_task ? (item.is_done ? "Task · Done" : "Task") : "Notes"}
                                                  {item.note ? " · " + item.note : ""}
                                                </div>
                                              )}
                                            </div>

                                            <svg viewBox="0 0 640 640" width={12} height={12} fill={DIM} style={{ flexShrink: 0 }}>
                                              {expanded
                                                ? <path d="M320 192L576 448L512 512L320 320L128 512L64 448Z" />
                                                : <path d="M320 448L64 192L128 128L320 320L512 128L576 192Z" />}
                                            </svg>
                                          </button>

                                          {expanded && (
                                            <div style={{ borderTop: `1px solid ${CONTENT_BDR}`, padding: 12, display: "grid", gap: 8 }}>
                                              <input
                                                value={item.title}
                                                onChange={e => patchItem(item.id, { title: e.target.value })}
                                                placeholder="Item title"
                                                style={{ width: "100%", boxSizing: "border-box", height: 36, padding: "0 10px", borderRadius: 7, border: `1px solid ${CONTENT_BDR}`, background: CARD_BG, fontSize: 13, fontFamily: FONT, color: TEXT, outline: "none" }}
                                              />
                                              <textarea
                                                value={item.note ?? ""}
                                                onChange={e => patchItem(item.id, { note: e.target.value })}
                                                placeholder="Notes"
                                                rows={3}
                                                style={{ width: "100%", boxSizing: "border-box", minHeight: 78, padding: 10, borderRadius: 7, border: `1px solid ${CONTENT_BDR}`, background: CARD_BG, fontSize: 13, fontFamily: FONT, color: TEXT, outline: "none", resize: "vertical", lineHeight: 1.5 }}
                                              />
                                              <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: MUTED, fontFamily: FONT }}>
                                                <input
                                                  type="checkbox"
                                                  checked={item.is_task}
                                                  onChange={e => patchItem(item.id, { is_task: e.target.checked, is_done: e.target.checked ? item.is_done : false })}
                                                />
                                                Is this a task?
                                              </label>
                                              {item.is_task && (
                                                <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: MUTED, fontFamily: FONT }}>
                                                  <input type="checkbox" checked={item.is_done} onChange={e => patchItem(item.id, { is_done: e.target.checked })} />
                                                  Done
                                                </label>
                                              )}
                                              <div style={{ display: "flex", gap: 8 }}>
                                                <SmallButton tone="primary" onClick={() => void handleSaveItem(item)}>Save</SmallButton>
                                                <SmallButton tone="danger" onClick={() => void handleDeleteItem(item)}>Delete</SmallButton>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                                <DropZone
                                  active={activeEnd}
                                  onDragOver={e => {
                                    e.preventDefault()
                                    if (draggingItemId && (dropTarget?.listId !== list.id || dropTarget.index !== rows.length)) {
                                      setDropTarget({ listId: list.id, index: rows.length })
                                    }
                                  }}
                                  onDrop={e => {
                                    e.preventDefault()
                                    const movingId = draggingItemId ?? e.dataTransfer.getData("text/plain")
                                    if (movingId) void moveItem(movingId, list.id, rows.length)
                                    setDraggingItemId(null)
                                    setDropTarget(null)
                                  }}
                                />
                              </>
                            )
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : !loading ? (
            <div style={{ fontSize: 13, color: DIM, fontFamily: FONT }}>No lists in this collection yet.</div>
          ) : null}
        </section>

        {loading && <div style={{ color: DIM, fontSize: 14, fontFamily: FONT }}>Loading…</div>}

        {!loading && TYPE_ORDER.filter(type => (itemsByType[type]?.length ?? 0) > 0 || TYPE_CONFIG[type].encrypted).map(type => {
          const items = itemsByType[type] ?? []
          if (items.length === 0 && !TYPE_CONFIG[type].encrypted) return null
          if (items.length === 0 && TYPE_CONFIG[type].encrypted) return null
          return (
            <CarouselRow
              key={type}
              type={type}
              items={items}
              cryptoKey={cryptoKey}
              onRequestUnlock={() => setShowPinModal(true)}
              onNoteClick={handleNoteClick}
            />
          )
        })}

        {!loading && totalCount === 0 && lists.length === 0 && (
          <div style={{ color: DIM, fontSize: 14, fontFamily: FONT }}>Nothing in this collection yet.</div>
        )}
      </div>

      {showPinModal && <InlinePinModal user={user} onUnlocked={handleUnlocked} onCancel={() => setShowPinModal(false)} />}
    </div>
  )
}
