import { useEffect, useRef, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "./supabase"
import HolsterNotes from "./HolsterNotes"
import HolsterCollectionView from "./HolsterCollectionView"
import HolsterPasswords from "./HolsterPasswords"
import HolsterKeys from "./HolsterKeys"
import HolsterLinks from "./HolsterLinks"
import HolsterLists from "./HolsterLists"
import HolsterAllView from "./HolsterAllView"

const FONT        = `"Inter", system-ui, -apple-system, sans-serif`
const SHELL       = "#1a2730"
const SB_BORDER   = "#253540"
const SB_HOVER    = "#223040"
const SB_ACTIVE   = "#1e3545"
const CONTENT_BG  = "#f8fafc"
const CONTENT_BDR = "#e2e8f0"
const CARD_BG     = "#ffffff"
const TEAL        = "#5b95a7"
const RED         = "#c14141"
const TEXT        = "#0f172a"
const DIM         = "#94a3b8"
const SB_TEXT     = "#f9fafb"
const SB_MUTED    = "#9ca3af"
const SB_DIM      = "#6b7280"

export type Category =
  | "all"
  | "notes"
  | "files"
  | "passwords"
  | "keys"
  | "snippets"
  | "links"
  | "lists"
  | "trash"

export type HolsterCollection = {
  id: string
  name: string
  color: string | null
}

const LISTS_ICON = "M96 160C96 124.7 124.7 96 160 96L480 96C515.3 96 544 124.7 544 160L544 480C544 515.3 515.3 544 480 544L160 544C124.7 544 96 515.3 96 480L96 160zM160 160L160 224L224 224L224 160L160 160zM480 160L288 160L288 224L480 224L480 160zM160 288L160 352L224 352L224 288L160 288zM480 288L288 288L288 352L480 352L480 288zM160 416L160 480L224 480L224 416L160 416zM480 416L288 416L288 480L480 480L480 416z"

const CATEGORIES: { id: Category; label: string; icon: string }[] = [
  { id: "all",       label: "All",           icon: "M64 144C64 117.5 85.5 96 112 96L528 96C554.5 96 576 117.5 576 144L576 176C576 202.5 554.5 224 528 224L112 224C85.5 224 64 202.5 64 176L64 144zM64 304C64 277.5 85.5 256 112 256L528 256C554.5 256 576 277.5 576 304L576 336C576 362.5 554.5 384 528 384L112 384C85.5 384 64 362.5 64 336L64 304zM576 496C576 522.5 554.5 544 528 544L112 544C85.5 544 64 522.5 64 496L64 464C64 437.5 85.5 416 112 416L528 416C554.5 416 576 437.5 576 464L576 496z" },
  { id: "notes",     label: "Notes",         icon: "M480 576L192 576C139 576 96 533 96 480L96 160C96 107 139 64 192 64L496 64C522.5 64 544 85.5 544 112L544 400C544 420.9 530.6 438.7 512 445.3L512 512C529.7 512 544 526.3 544 544C544 561.7 529.7 576 512 576L480 576zM192 448C174.3 448 160 462.3 160 480C160 497.7 174.3 512 192 512L448 512L448 448L192 448zM224 216C224 229.3 234.7 240 248 240L424 240C437.3 240 448 229.3 448 216C448 202.7 437.3 192 424 192L248 192C234.7 192 224 202.7 224 216zM248 288C234.7 288 224 298.7 224 312C224 325.3 234.7 336 248 336L424 336C437.3 336 448 325.3 448 312C448 298.7 437.3 288 424 288L248 288z" },
  { id: "lists",     label: "Lists & Tasks", icon: LISTS_ICON },
  { id: "files",     label: "Files",         icon: "M192 64C156.7 64 128 92.7 128 128L128 512C128 547.3 156.7 576 192 576L448 576C483.3 576 512 547.3 512 512L512 234.5C512 217.5 505.3 201.2 493.3 189.2L386.7 82.7C374.7 70.7 358.5 64 341.5 64L192 64zM453.5 240L360 240C346.7 240 336 229.3 336 216L336 122.5L453.5 240z" },
  { id: "passwords", label: "Passwords",     icon: "M128 128C128 92.7 156.7 64 192 64L448 64C483.3 64 512 92.7 512 128L512 512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3 128 512L128 128zM224 472C224 485.3 234.7 496 248 496L392 496C405.3 496 416 485.3 416 472C416 458.7 405.3 448 392 448L248 448C234.7 448 224 458.7 224 472zM406.6 272C401.8 298.4 385.1 320.7 362.4 333.2C369.1 316.2 373.6 295.2 375 272L406.6 272zM233.5 272L265.1 272C266.5 295.1 271.1 316.2 277.7 333.2C255 320.7 238.3 298.4 233.5 272zM309.9 327C303.7 313.6 298.8 294.5 297.2 272L343 272C341.4 294.5 336.5 313.6 330.3 327C325.8 336.6 322.1 340.8 320.1 342.5C318.1 340.8 314.4 336.7 309.9 327zM309.9 185C314.4 175.4 318.1 171.2 320.1 169.5C322.1 171.2 325.8 175.3 330.3 185C336.5 198.4 341.4 217.5 343 240L297.2 240C298.8 217.5 303.7 198.4 309.9 185zM406.6 240L375 240C373.6 216.9 369 195.8 362.4 178.8C385.1 191.3 401.8 213.6 406.6 240zM265 240L233.4 240C238.2 213.6 254.9 191.3 277.6 178.8C270.9 195.8 266.4 216.8 265 240zM448 256C448 185.3 390.7 128 320 128C249.3 128 192 185.3 192 256C192 326.7 249.3 384 320 384C390.7 384 448 326.7 448 256z" },
  { id: "keys",      label: "Keys",          icon: "M400 416C497.2 416 576 337.2 576 240C576 142.8 497.2 64 400 64C302.8 64 224 142.8 224 240C224 258.7 226.9 276.8 232.3 293.7L71 455C66.5 459.5 64 465.6 64 472L64 552C64 565.3 74.7 576 88 576L168 576C181.3 576 192 565.3 192 552L192 512L232 512C245.3 512 256 501.3 256 488L256 448L296 448C302.4 448 308.5 445.5 313 441L346.3 407.7C363.2 413.1 381.3 416 400 416zM440 160C462.1 160 480 177.9 480 200C480 222.1 462.1 240 440 240C417.9 240 400 222.1 400 200C400 177.9 417.9 160 440 160z" },
  { id: "snippets",  label: "Snippets",      icon: "M160 544C124.7 544 96 515.3 96 480L96 160C96 124.7 124.7 96 160 96L480 96C515.3 96 544 124.7 544 160L544 373.5C544 390.5 537.3 406.8 525.3 418.8L418.7 525.3C406.7 537.3 390.4 544 373.4 544L160 544zM485.5 368L392 368C378.7 368 368 378.7 368 392L368 485.5L485.5 368z" },
  { id: "links",     label: "Links",         icon: "M451.5 160C434.9 160 418.8 164.5 404.7 172.7C388.9 156.7 370.5 143.3 350.2 133.2C378.4 109.2 414.3 96 451.5 96C537.9 96 608 166 608 252.5C608 294 591.5 333.8 562.2 363.1L491.1 434.2C461.8 463.5 422 480 380.5 480C294.1 480 224 410 224 323.5C224 322 224 320.5 224.1 319C224.6 301.3 239.3 287.4 257 287.9C274.7 288.4 288.6 303.1 288.1 320.8C288.1 321.7 288.1 322.6 288.1 323.4C288.1 374.5 329.5 415.9 380.6 415.9C405.1 415.9 428.6 406.2 446 388.8L517.1 317.7C534.4 300.4 544.2 276.8 544.2 252.3C544.2 201.2 502.8 159.8 451.7 159.8zM307.2 237.3C305.3 236.5 303.4 235.4 301.7 234.2C289.1 227.7 274.7 224 259.6 224C235.1 224 211.6 233.7 194.2 251.1L123.1 322.2C105.8 339.5 96 363.1 96 387.6C96 438.7 137.4 480.1 188.5 480.1C205 480.1 221.1 475.7 235.2 467.5C251 483.5 269.4 496.9 289.8 507C261.6 530.9 225.8 544.2 188.5 544.2C102.1 544.2 32 474.2 32 387.7C32 346.2 48.5 306.4 77.8 277.1L148.9 206C178.2 176.7 218 160.2 259.5 160.2C346.1 160.2 416 230.8 416 317.1C416 318.4 416 319.7 416 321C415.6 338.7 400.9 352.6 383.2 352.2C365.5 351.8 351.6 337.1 352 319.4C352 318.6 352 317.9 352 317.1C352 283.4 334 253.8 307.2 237.5z" },
  { id: "trash",     label: "Trash",         icon: "M232.7 69.9C237.1 56.8 249.3 48 263.1 48L377 48C390.8 48 403 56.8 407.4 69.9L416 96L512 96C529.7 96 544 110.3 544 128C544 145.7 529.7 160 512 160L128 160C110.3 160 96 145.7 96 128C96 110.3 110.3 96 128 96L224 96L232.7 69.9zM128 208L512 208L512 512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3 128 512L128 208zM216 272C202.7 272 192 282.7 192 296L192 488C192 501.3 202.7 512 216 512C229.3 512 240 501.3 240 488L240 296C240 282.7 229.3 272 216 272zM320 272C306.7 272 296 282.7 296 296L296 488C296 501.3 306.7 512 320 512C333.3 512 344 501.3 344 488L344 296C344 282.7 333.3 272 320 272zM424 272C410.7 272 400 282.7 400 296L400 488C400 501.3 410.7 512 424 512C437.3 512 448 501.3 448 488L448 296C448 282.7 437.3 272 424 272z" },
]

const COLLECTIONS_ICON = "M482.4 221.9C517.7 213.6 544 181.9 544 144C544 99.8 508.2 64 464 64C420.6 64 385.3 98.5 384 141.5L200.2 215.1C185.7 200.8 165.9 192 144 192C99.8 192 64 227.8 64 272C64 316.2 99.8 352 144 352C156.2 352 167.8 349.3 178.1 344.4L323.7 471.8C321.3 479.4 320 487.6 320 496C320 540.2 355.8 576 400 576C444.2 576 480 540.2 480 496C480 468.3 466 443.9 444.6 429.6L482.4 221.9zM220.3 296.2C222.5 289.3 223.8 282 224 274.5L407.8 201C411.4 204.5 415.2 207.7 419.4 210.5L381.6 418.1C376.1 419.4 370.8 421.2 365.8 423.6L220.3 296.2z"

function Icon({ path, size = 16 }: { path: string; size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width={size} height={size} fill="currentColor" style={{ flexShrink: 0 }}>
      <path d={path} />
    </svg>
  )
}

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth <= 768)
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth <= 768)
    window.addEventListener("resize", fn)
    return () => window.removeEventListener("resize", fn)
  }, [])
  return mobile
}

function PlaceholderView({ title }: { title: string }) {
  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{
        width: "min(560px, 100%)",
        background: CARD_BG,
        border: `1px solid ${CONTENT_BDR}`,
        borderRadius: 16,
        padding: 24,
        boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
      }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: TEXT, fontFamily: FONT, marginBottom: 10 }}>{title}</div>
        <div style={{ fontSize: 14, lineHeight: 1.6, color: DIM, fontFamily: FONT }}>
          This section is not wired in this file yet.
        </div>
      </div>
    </div>
  )
}

export default function HolsterPanel({ user, cryptoKey, onCryptoKeySet }: { user: User; cryptoKey: CryptoKey | null; onCryptoKeySet: (key: CryptoKey) => void }) {
  const isMobile = useIsMobile()

  const [sidebarOpen, setSidebarOpen]   = useState(!isMobile)
  const [sidebarWidth, setSidebarWidth] = useState(240)
  const [category, setCategory]         = useState<Category>("all")
  const [resetKey, setResetKey]         = useState(0)
  const [collections, setCollections]   = useState<HolsterCollection[]>([])
  const [activeCollection, setActiveCollection] = useState<string | null>(null)
  const [collectionsOpen, setCollectionsOpen]     = useState(true)
  const [categoriesOpen, setCategoriesOpen]       = useState(true)
  const [initialOpenListId, setInitialOpenListId] = useState<string | undefined>(undefined)

  const isDragging     = useRef(false)
  const dragStartX     = useRef(0)
  const dragStartWidth = useRef(0)

  const cat = CATEGORIES.find(c => c.id === category)!

  useEffect(() => {
    if (isMobile) setSidebarOpen(false)
  }, [isMobile])

  useEffect(() => {
    setActiveCollection(null)
    if (category === "trash") return
    supabase
      .from("holster_collections")
      .select("id, name, color")
      .eq("user_id", user.id)
      .order("name")
      .then(({ data }) => { if (data) setCollections(data) })
  }, [category, user.id])

  function handleCollectionCreated(col: HolsterCollection) {
    setCollections(prev => [...prev, col].sort((a, b) => a.name.localeCompare(b.name)))
  }

  function handleCategorySelect(id: Category) {
    if (id === category) {
      setResetKey(k => k + 1)
    } else {
      setCategory(id)
    }
    setActiveCollection(null)
    if (isMobile) setSidebarOpen(false)
  }

  function handleCollectionSelect(id: string) {
    setActiveCollection(id)
    if (isMobile) setSidebarOpen(false)
  }

  const showCollections = sidebarOpen && category !== "trash"

  const SidebarContent = (
    <aside style={{
      width: isMobile ? "100%" : sidebarWidth,
      background: SHELL,
      borderRight: isMobile ? "none" : `1px solid ${SB_BORDER}`,
      display: "flex", flexDirection: "column",
      flexShrink: 0, overflow: "hidden",
      ...(isMobile ? {
        position: "fixed" as const, top: 0, left: 0, bottom: 0, zIndex: 200,
        width: "80%", maxWidth: 300,
        boxShadow: "4px 0 32px rgba(0,0,0,0.4)",
      } : {}),
    }}>
      <div style={{
        height: 58, borderBottom: `1px solid ${SB_BORDER}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px", flexShrink: 0,
      }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: SB_DIM, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: FONT }}>
          Holster
        </span>
        {isMobile && (
          <button onClick={() => setSidebarOpen(false)}
            style={{ background: "none", border: "none", cursor: "pointer", color: SB_MUTED, display: "flex", alignItems: "center", justifyContent: "center", padding: 4 }}>
            <svg viewBox="0 0 640 640" width={18} height={18} fill="currentColor">
              <path d="M512 128L320 320L512 512L448 576L256 384L64 576L0 512L192 320L0 128L64 64L256 256L448 64Z"/>
            </svg>
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "8px 8px 16px", scrollbarWidth: "none" }}>
        <button
          onClick={() => setCategoriesOpen(v => !v)}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 12px", height: 32, border: "none", background: "transparent", cursor: "pointer", marginBottom: 4,
          }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: SB_DIM, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: FONT }}>
            Categories
          </span>
          <svg viewBox="0 0 640 640" width={10} height={10} fill={SB_DIM} style={{ transition: "transform 0.15s", transform: categoriesOpen ? "rotate(0deg)" : "rotate(-90deg)" }}>
            <path d="M320 448L64 192L128 128L320 320L512 128L576 192Z" />
          </svg>
        </button>

        {categoriesOpen && (
          <nav style={{ display: "grid", gap: 2 }}>
            {CATEGORIES.map(entry => {
              const active = category === entry.id && !activeCollection
              return (
                <button key={entry.id}
                  onClick={() => handleCategorySelect(entry.id)}
                  style={{
                    height: 46, borderRadius: 6,
                    border: `1px solid ${active ? TEAL + "44" : "transparent"}`,
                    background: active ? SB_ACTIVE : "transparent",
                    color: active ? SB_TEXT : SB_MUTED,
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "0 12px", cursor: "pointer",
                    fontSize: 15, fontWeight: active ? 700 : 500,
                    fontFamily: FONT, textAlign: "left",
                    transition: "background 0.15s, color 0.15s",
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = SB_HOVER; e.currentTarget.style.color = SB_TEXT } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = SB_MUTED } }}
                >
                  <span style={{ color: active ? RED : SB_MUTED, flexShrink: 0 }}>
                    <Icon path={entry.icon} size={18} />
                  </span>
                  {entry.label}
                </button>
              )
            })}
          </nav>
        )}

        {showCollections && (
          <div style={{ marginTop: 12 }}>
            <button
              onClick={() => setCollectionsOpen(v => !v)}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "0 12px", height: 36, border: "none",
                background: `${TEAL}12`, borderRadius: 8,
                cursor: "pointer", marginBottom: 2,
              }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: SB_DIM }}><Icon path={COLLECTIONS_ICON} size={13} /></span>
                <span style={{ fontSize: 11, fontWeight: 800, color: SB_DIM, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: FONT }}>
                  Collections
                </span>
              </div>
              <svg viewBox="0 0 640 640" width={10} height={10} fill={SB_DIM} style={{ transition: "transform 0.15s", transform: collectionsOpen ? "rotate(0deg)" : "rotate(-90deg)" }}>
                <path d="M320 448L64 192L128 128L320 320L512 128L576 192Z" />
              </svg>
            </button>

            {collectionsOpen && (
              <div style={{ display: "grid", gap: 1, marginTop: 2 }}>
                {collections.map(col => {
                  const active = activeCollection === col.id
                  const dot = col.color ?? TEAL
                  return (
                    <button key={col.id}
                      onClick={() => handleCollectionSelect(col.id)}
                      style={{
                        height: 38, borderRadius: 6,
                        border: `1px solid ${active ? dot + "66" : "transparent"}`,
                        background: active ? `${dot}18` : "transparent",
                        color: active ? SB_TEXT : SB_MUTED,
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "0 12px 0 20px",
                        cursor: "pointer", fontSize: 14, fontWeight: active ? 700 : 400,
                        fontFamily: FONT, textAlign: "left",
                        transition: "background 0.15s, color 0.15s",
                      }}
                      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = SB_HOVER; e.currentTarget.style.color = SB_TEXT } }}
                      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = SB_MUTED } }}
                    >
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: dot, flexShrink: 0, display: "inline-block" }} />
                      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{col.name}</span>
                    </button>
                  )
                })}
                {collections.length === 0 && (
                  <div style={{ padding: "6px 12px 6px 32px", fontSize: 13, color: SB_DIM, fontFamily: FONT }}>
                    No collections yet
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  )

  const activeCollectionObj = activeCollection ? collections.find(c => c.id === activeCollection) ?? null : null

  return (
    <div
      style={{ flex: 1, minHeight: 0, display: "flex", overflow: "hidden", position: "relative" }}
      onMouseMove={e => {
        if (!isDragging.current || isMobile) return
        const delta = e.clientX - dragStartX.current
        const next = Math.max(180, Math.min(360, dragStartWidth.current + delta))
        setSidebarWidth(next)
      }}
      onMouseUp={() => {
        if (!isDragging.current) return
        isDragging.current = false
        document.body.style.cursor = ""
        document.body.style.userSelect = ""
      }}
    >
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 199 }} />
      )}

      {sidebarOpen && SidebarContent}

      {!isMobile && (
        <div style={{ width: 16, flexShrink: 0, display: "flex", alignItems: "stretch", position: "relative", zIndex: 5 }}>
          {sidebarOpen && (
            <div
              onMouseDown={e => {
                isDragging.current = true
                dragStartX.current = e.clientX
                dragStartWidth.current = sidebarWidth
                document.body.style.cursor = "col-resize"
                document.body.style.userSelect = "none"
              }}
              style={{ flex: 1, cursor: "col-resize", background: SB_BORDER, transition: "background 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.background = TEAL)}
              onMouseLeave={e => { if (!isDragging.current) e.currentTarget.style.background = SB_BORDER }}
            />
          )}
          <button
            onClick={() => setSidebarOpen(v => !v)}
            title={sidebarOpen ? "Collapse" : "Expand"}
            style={{
              position: "absolute", top: "50%", right: -12, transform: "translateY(-50%)",
              width: 24, height: 40, borderRadius: 6,
              background: SHELL, border: `1px solid ${SB_BORDER}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: SB_MUTED, zIndex: 10,
              transition: "color 0.15s, border-color 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = TEAL; e.currentTarget.style.borderColor = TEAL }}
            onMouseLeave={e => { e.currentTarget.style.color = SB_MUTED; e.currentTarget.style.borderColor = SB_BORDER }}
          >
            <svg viewBox="0 0 640 640" width={12} height={12} fill="currentColor">
              {sidebarOpen ? <path d="M416 64L192 320L416 576L480 512L320 320L480 128Z"/> : <path d="M224 64L448 320L224 576L160 512L320 320L160 128Z"/>}
            </svg>
          </button>
        </div>
      )}

      {!isMobile && !sidebarOpen && (
        <div style={{
          width: 56, background: SHELL, borderRight: `1px solid ${SB_BORDER}`,
          display: "flex", flexDirection: "column", alignItems: "center",
          paddingTop: 12, gap: 4, flexShrink: 0,
        }}>
          {CATEGORIES.map(entry => {
            const active = category === entry.id
            return (
              <button key={entry.id} onClick={() => handleCategorySelect(entry.id)}
                title={entry.label}
                style={{
                  width: 44, height: 44, borderRadius: 8,
                  border: `1px solid ${active ? TEAL + "55" : "transparent"}`,
                  background: active ? SB_ACTIVE : "transparent",
                  color: active ? RED : SB_MUTED,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", transition: "background 0.15s, color 0.15s",
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = SB_HOVER; e.currentTarget.style.color = SB_TEXT } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = SB_MUTED } }}
              >
                <Icon path={entry.icon} size={20} />
              </button>
            )
          })}
        </div>
      )}

      <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", background: CONTENT_BG, overflow: "hidden" }}>
        {isMobile && (
          <div style={{
            height: 50, borderBottom: `1px solid ${CONTENT_BDR}`,
            display: "flex", alignItems: "center", gap: 10,
            padding: "0 14px", flexShrink: 0, background: CARD_BG,
          }}>
            <button onClick={() => setSidebarOpen(true)}
              style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${CONTENT_BDR}`, background: "transparent", cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg viewBox="0 0 640 640" width={18} height={18} fill="currentColor">
                <path d="M64 144C64 117.5 85.5 96 112 96L528 96C554.5 96 576 117.5 576 144L576 176C576 202.5 554.5 224 528 224L112 224C85.5 224 64 202.5 64 176L64 144zM64 304C64 277.5 85.5 256 112 256L528 256C554.5 256 576 277.5 576 304L576 336C576 362.5 554.5 384 528 384L112 384C85.5 384 64 362.5 64 336L64 304zM576 496C576 522.5 554.5 544 528 544L112 544C85.5 544 64 522.5 64 496L64 464C64 437.5 85.5 416 112 416L528 416C554.5 416 576 437.5 576 464L576 496z"/>
              </svg>
            </button>
            <span style={{ fontSize: 15, fontWeight: 700, color: TEXT, fontFamily: FONT }}>
              {activeCollectionObj ? activeCollectionObj.name : cat.label}
            </span>
          </div>
        )}

        {activeCollectionObj ? (
          <HolsterCollectionView
            user={user}
            collection={activeCollectionObj}
            collections={collections}
            cryptoKey={cryptoKey}
            onCryptoKeySet={onCryptoKeySet}
            onCollectionCreated={handleCollectionCreated}
          />
        ) : category === "all" ? (
          <HolsterAllView
            user={user}
            collections={collections}
            cryptoKey={cryptoKey}
            onCryptoKeySet={onCryptoKeySet}
            onCollectionCreated={handleCollectionCreated}
            onNavigateToList={listId => {
              setInitialOpenListId(listId)
              setCategory("lists")
              setActiveCollection(null)
              if (isMobile) setSidebarOpen(false)
            }}
            onNavigateToCategory={cat => {
              setCategory(cat as Category)
              setActiveCollection(null)
              if (isMobile) setSidebarOpen(false)
            }}
          />
        ) : category === "notes" || category === "snippets" ? (
          <HolsterNotes
            key={resetKey}
            user={user}
            type={category === "notes" ? "note" : "snippet"}
            collections={collections}
            onCollectionCreated={handleCollectionCreated}
          />
        ) : category === "lists" ? (
          <HolsterLists
            key={initialOpenListId ?? "lists"}
            user={user}
            collections={collections}
            onCollectionCreated={handleCollectionCreated}
            initialOpenListId={initialOpenListId}
          />
        ) : category === "passwords" ? (
          <HolsterPasswords
            user={user}
            collections={collections}
            onCollectionCreated={handleCollectionCreated}
            cryptoKey={cryptoKey}
            onCryptoKeySet={onCryptoKeySet}
          />
        ) : category === "keys" ? (
          <HolsterKeys
            user={user}
            collections={collections}
            onCollectionCreated={handleCollectionCreated}
            cryptoKey={cryptoKey}
            onCryptoKeySet={onCryptoKeySet}
          />
        ) : category === "links" ? (
          <HolsterLinks
            user={user}
            collections={collections}
            onCollectionCreated={handleCollectionCreated}
          />
        ) : (
          <PlaceholderView title={cat.label} />
        )}
      </main>
    </div>
  )
}
