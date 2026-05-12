import { useEffect, useMemo, useState, type CSSProperties } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "./supabase"
import type { HolsterCollection } from "./HolsterPanel"

const FONT        = `"Inter", system-ui, -apple-system, sans-serif`
const CONTENT_BG  = "#f8fafc"
const CONTENT_BDR = "#e2e8f0"
const CARD_BG     = "#ffffff"
const TEAL        = "#5b95a7"
const RED         = "#c14141"
const TEXT        = "#0f172a"
const MUTED       = "#475569"
const DIM         = "#94a3b8"

type DashboardKey =
  | "collections"
  | "notes"
  | "lists"
  | "files"
  | "passwords"
  | "keys"
  | "snippets"
  | "links"

type CountState = Record<DashboardKey, number>

type CountableCategory =
  | "notes"
  | "lists"
  | "files"
  | "passwords"
  | "keys"
  | "snippets"
  | "links"

type DashboardCategory = CountableCategory | "collections"

type HolsterAllViewProps = {
  user: User
  collections: HolsterCollection[]
  cryptoKey: CryptoKey | null
  onCryptoKeySet: (key: CryptoKey) => void
  onCollectionCreated: (col: HolsterCollection) => void
  onNavigateToList: (listId: string) => void
  onNavigateToCategory: (category: string) => void
}

const INITIAL_COUNTS: CountState = {
  collections: 0,
  notes: 0,
  lists: 0,
  files: 0,
  passwords: 0,
  keys: 0,
  snippets: 0,
  links: 0,
}

const TABLES: Record<CountableCategory, string> = {
  notes: "holster_notes",
  lists: "holster_lists",
  files: "holster_files",
  passwords: "holster_passwords",
  keys: "holster_keys",
  snippets: "holster_snippets",
  links: "holster_links",
}

const CARD_META: {
  key: DashboardKey
  label: string
  description: string
  color: string
  category?: DashboardCategory
  iconPath: string
}[] = [
  {
    key: "collections",
    label: "Collections",
    description: "Project bundles and grouped ammo",
    color: "#2f6f7f",
    category: "collections",
    iconPath: "M96 160C96 124.7 124.7 96 160 96L280 96L320 144L480 144C515.3 144 544 172.7 544 208L544 480C544 515.3 515.3 544 480 544L160 544C124.7 544 96 515.3 96 480L96 160z",
  },
  {
    key: "notes",
    label: "Notes",
    description: "Full documents and long-form memory",
    color: TEAL,
    category: "notes",
    iconPath: "M480 576L192 576C139 576 96 533 96 480L96 160C96 107 139 64 192 64L496 64C522.5 64 544 85.5 544 112L544 400C544 420.9 530.6 438.7 512 445.3L512 512C529.7 512 544 526.3 544 544C544 561.7 529.7 576 512 576L480 576zM192 448C174.3 448 160 462.3 160 480C160 497.7 174.3 512 192 512L448 512L448 448L192 448zM224 216C224 229.3 234.7 240 248 240L424 240C437.3 240 448 229.3 448 216C448 202.7 437.3 192 424 192L248 192C234.7 192 224 202.7 224 216zM248 288C234.7 288 224 298.7 224 312C224 325.3 234.7 336 248 336L424 336C437.3 336 448 325.3 448 312C448 298.7 437.3 288 424 288L248 288z",
  },
  {
    key: "lists",
    label: "Lists",
    description: "Checklists, task stacks, and repeatables",
    color: "#3f7d63",
    category: "lists",
    iconPath: "M96 160C96 124.7 124.7 96 160 96L480 96C515.3 96 544 124.7 544 160L544 480C544 515.3 515.3 544 480 544L160 544C124.7 544 96 515.3 96 480L96 160zM160 160L160 224L224 224L224 160L160 160zM480 160L288 160L288 224L480 224L480 160zM160 288L160 352L224 352L224 288L160 288zM480 288L288 288L288 352L480 352L480 288zM160 416L160 480L224 480L224 416L160 416zM480 416L288 416L288 480L480 480L480 416z",
  },
  {
    key: "files",
    label: "Files",
    description: "Uploads, documents, and attachments",
    color: "#e07b4a",
    category: "files",
    iconPath: "M192 64C156.7 64 128 92.7 128 128L128 512C128 547.3 156.7 576 192 576L448 576C483.3 576 512 547.3 512 512L512 234.5C512 217.5 505.3 201.2 493.3 189.2L386.7 82.7C374.7 70.7 358.5 64 341.5 64L192 64zM453.5 240L360 240C346.7 240 336 229.3 336 216L336 122.5L453.5 240z",
  },
  {
    key: "passwords",
    label: "Passwords",
    description: "Encrypted account credentials",
    color: RED,
    category: "passwords",
    iconPath: "M224 256L224 192C224 138.1 267.1 96 320 96C372.9 96 416 139.1 416 192L416 256L448 256C483.3 256 512 284.7 512 320L512 544C512 579.3 483.3 608 448 608L192 608C156.7 608 128 579.3 128 544L128 320C128 284.7 156.7 256 192 256L224 256zM288 256L352 256L352 192C352 174.3 337.7 160 320 160C302.3 160 288 174.3 288 192L288 256zM320 384C302.3 384 288 398.3 288 416C288 433.7 302.3 448 320 448C337.7 448 352 433.7 352 416C352 398.3 337.7 384 320 384z",
  },
  {
    key: "keys",
    label: "Keys",
    description: "API keys, tokens, and environment ammo",
    color: "#c49a2a",
    category: "keys",
    iconPath: "M400 416C497.2 416 576 337.2 576 240C576 142.8 497.2 64 400 64C302.8 64 224 142.8 224 240C224 258.7 226.9 276.8 232.3 293.7L71 455C66.5 459.5 64 465.6 64 472L64 552C64 565.3 74.7 576 88 576L168 576C181.3 576 192 565.3 192 552L192 512L232 512C245.3 512 256 501.3 256 488L256 448L296 448C302.4 448 308.5 445.5 313 441L346.3 407.7C363.2 413.1 381.3 416 400 416zM440 160C462.1 160 480 177.9 480 200C480 222.1 462.1 240 440 240C417.9 240 400 222.1 400 200C400 177.9 417.9 160 440 160z",
  },
  {
    key: "snippets",
    label: "Snippets",
    description: "Reusable fragments and quick references",
    color: "#7c6fa0",
    category: "snippets",
    iconPath: "M160 544C124.7 544 96 515.3 96 480L96 160C96 124.7 124.7 96 160 96L480 96C515.3 96 544 124.7 544 160L544 373.5C544 390.5 537.3 406.8 525.3 418.8L418.7 525.3C406.7 537.3 390.4 544 373.4 544L160 544zM485.5 368L392 368C378.7 368 368 378.7 368 392L368 485.5L485.5 368z",
  },
  {
    key: "links",
    label: "Links",
    description: "URLs, references, and web bookmarks",
    color: "#4a9e6b",
    category: "links",
    iconPath: "M451.5 160C434.9 160 418.8 164.5 404.7 172.7C388.9 156.7 370.5 143.3 350.2 133.2C378.4 109.2 414.3 96 451.5 96C537.9 96 608 166 608 252.5C608 294 591.5 333.8 562.2 363.1L491.1 434.2C461.8 463.5 422 480 380.5 480C294.1 480 224 410 224 323.5C224 322 224 320.5 224.1 319C224.6 301.3 239.3 287.4 257 287.9C274.7 288.4 288.6 303.1 288.1 320.8C288.1 321.7 288.1 322.6 288.1 323.4C288.1 374.5 329.5 415.9 380.6 415.9C405.1 415.9 428.6 406.2 446 388.8L517.1 317.7C534.4 300.4 544.2 276.8 544.2 252.3C544.2 201.2 502.8 159.8 451.7 159.8zM307.2 237.3C305.3 236.5 303.4 235.4 301.7 234.2C289.1 227.7 274.7 224 259.6 224C235.1 224 211.6 233.7 194.2 251.1L123.1 322.2C105.8 339.5 96 363.1 96 387.6C96 438.7 137.4 480.1 188.5 480.1C205 480.1 221.1 475.7 235.2 467.5C251 483.5 269.4 496.9 289.8 507C261.6 530.9 225.8 544.2 188.5 544.2C102.1 544.2 32 474.2 32 387.7C32 346.2 48.5 306.4 77.8 277.1L148.9 206C178.2 176.7 218 160.2 259.5 160.2C346.1 160.2 416 230.8 416 317.1C416 318.4 416 319.7 416 321C415.6 338.7 400.9 352.6 383.2 352.2C365.5 351.8 351.6 337.1 352 319.4C352 318.6 352 317.9 352 317.1C352 283.4 334 253.8 307.2 237.5z",
  },
]

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth <= 768)

  useEffect(() => {
    const update = () => setMobile(window.innerWidth <= 768)
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  return mobile
}

async function countRows(table: string, userId: string): Promise<number> {
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)

  if (error) throw error
  return count ?? 0
}

function DashboardCard({
  label,
  description,
  count,
  color,
  iconPath,
  onClick,
}: {
  label: string
  description: string
  count: number
  color: string
  iconPath: string
  onClick?: () => void
}) {
  const clickable = Boolean(onClick)
  const style: CSSProperties = {
    minHeight: 110,
    padding: 18,
    borderRadius: 16,
    border: `1px solid ${CONTENT_BDR}`,
    background: CARD_BG,
    display: "flex",
    flexDirection: "column",
    gap: 14,
    textAlign: "left",
    fontFamily: FONT,
    cursor: clickable ? "pointer" : "default",
    boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
    transition: "transform 0.12s ease, border-color 0.12s ease, box-shadow 0.12s ease",
  }

  return (
    <button
      type="button"
      disabled={!clickable}
      onClick={onClick}
      style={style}
      onMouseEnter={e => {
        if (!clickable) return
        e.currentTarget.style.transform = "translateY(-2px)"
        e.currentTarget.style.borderColor = `${color}66`
        e.currentTarget.style.boxShadow = "0 10px 26px rgba(15, 23, 42, 0.08)"
      }}
      onMouseLeave={e => {
        if (!clickable) return
        e.currentTarget.style.transform = "translateY(0)"
        e.currentTarget.style.borderColor = CONTENT_BDR
        e.currentTarget.style.boxShadow = "0 1px 2px rgba(15, 23, 42, 0.04)"
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: `${color}16`,
            color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg viewBox="0 0 640 640" width={24} height={24} fill="currentColor" aria-hidden="true">
            <path d={iconPath} />
          </svg>
        </div>

        <div style={{ fontSize: 34, lineHeight: 1, fontWeight: 900, color: TEXT, fontFamily: FONT }}>
          {count.toLocaleString()}
        </div>
      </div>

      <div style={{ display: "grid", gap: 5 }}>
        <div style={{ fontSize: 16, fontWeight: 850, color: TEXT, fontFamily: FONT }}>
          {label}
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.45, color: MUTED, fontFamily: FONT }}>
          {description}
        </div>
      </div>

    </button>
  )
}

export default function HolsterAllView(props: HolsterAllViewProps) {
  const { user, collections, onNavigateToCategory } = props

  const isMobile = useIsMobile()
  const [counts, setCounts] = useState<CountState>({ ...INITIAL_COUNTS, collections: collections.length })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setCounts(prev => ({ ...prev, collections: collections.length }))
  }, [collections.length])

  useEffect(() => {
    let cancelled = false

    async function loadCounts() {
      setLoading(true)
      setError(null)

      try {
        const entries = await Promise.all(
          (Object.keys(TABLES) as CountableCategory[]).map(async key => [key, await countRows(TABLES[key], user.id)] as const)
        )

        if (cancelled) return

        const next: CountState = {
          ...INITIAL_COUNTS,
          collections: collections.length,
        }

        for (const [key, value] of entries) next[key] = value

        setCounts(next)
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Could not load Holster counts.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadCounts()

    return () => { cancelled = true }
  }, [user.id, collections.length])

  const total = useMemo(
    () => Object.values(counts).reduce((sum, count) => sum + count, 0),
    [counts]
  )

  const gridColumns = isMobile
    ? "1fr 1fr"
    : "repeat(auto-fill, minmax(210px, 1fr))"

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", background: CONTENT_BG, overflow: "hidden" }}>
      <div style={{ borderBottom: `1px solid ${CONTENT_BDR}`, padding: "18px 24px", flexShrink: 0, background: CARD_BG, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: TEXT, fontFamily: FONT }}>
            All
          </div>
          <div style={{ fontSize: 13, color: DIM, fontFamily: FONT }}>
            Your holster at a glance.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", borderRadius: 999, background: "#f1f5f9", color: MUTED, fontSize: 13, fontWeight: 800, fontFamily: FONT }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: loading ? DIM : TEAL, display: "inline-block" }} />
          {loading ? "Counting…" : `${total.toLocaleString()} total`}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: isMobile ? 14 : 24 }}>
        {error && (
          <div style={{ marginBottom: 14, padding: "12px 14px", borderRadius: 12, border: `1px solid ${RED}33`, background: `${RED}10`, color: RED, fontSize: 13, fontFamily: FONT }}>
            {error}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: gridColumns, gap: 14 }}>
          {CARD_META.map(card => (
            <DashboardCard
              key={card.key}
              label={card.label}
              description={card.description}
              count={counts[card.key]}
              color={card.color}
              iconPath={card.iconPath}
              onClick={card.category ? () => onNavigateToCategory(card.category!) : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
