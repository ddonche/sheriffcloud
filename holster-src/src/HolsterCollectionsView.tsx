import { useEffect, useMemo, useState } from "react"
import { supabase } from "./supabase"
import type { User } from "@supabase/supabase-js"
import type { HolsterCollection } from "./HolsterPanel"

const FONT        = `"Inter", system-ui, -apple-system, sans-serif`
const CONTENT_BG  = "#f8fafc"
const CONTENT_BDR = "#e2e8f0"
const CARD_BG     = "#ffffff"
const TEAL        = "#5b95a7"
const TEXT        = "#0f172a"
const MUTED       = "#475569"
const DIM         = "#94a3b8"

type CountMap = Record<string, number>

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth <= 768)

  useEffect(() => {
    const update = () => setMobile(window.innerWidth <= 768)
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  return mobile
}

async function countCollectionRows(table: string, userId: string, column = "collection"): Promise<CountMap> {
  const { data, error } = await supabase
    .from(table)
    .select(column)
    .eq("user_id", userId)

  if (error) throw error

  const counts: CountMap = {}
  for (const row of data ?? []) {
    const id = String(((row as unknown) as Record<string, unknown>)[column] ?? "")
    if (!id) continue
    counts[id] = (counts[id] ?? 0) + 1
  }

  return counts
}

function mergeCounts(...maps: CountMap[]) {
  const merged: CountMap = {}
  for (const map of maps) {
    for (const [id, count] of Object.entries(map)) {
      merged[id] = (merged[id] ?? 0) + count
    }
  }
  return merged
}

export default function HolsterCollectionsView({
  user,
  collections,
  onOpenCollection,
}: {
  user: User
  collections: HolsterCollection[]
  onOpenCollection: (collectionId: string) => void
}) {
  const isMobile = useIsMobile()
  const [counts, setCounts] = useState<CountMap>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadCounts() {
      setLoading(true)
      setError(null)

      try {
        const results = await Promise.all([
          countCollectionRows("holster_notes", user.id),
          countCollectionRows("holster_snippets", user.id),
          countCollectionRows("holster_files", user.id),
          countCollectionRows("holster_links", user.id),
          countCollectionRows("holster_passwords", user.id),
          countCollectionRows("holster_keys", user.id),
          countCollectionRows("holster_lists", user.id, "collection_id"),
        ])

        if (!cancelled) setCounts(mergeCounts(...results))
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Could not load collection counts.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadCounts()

    return () => { cancelled = true }
  }, [user.id])

  const sortedCollections = useMemo(
    () => [...collections].sort((a, b) => a.name.localeCompare(b.name)),
    [collections]
  )

  const gridColumns = isMobile
    ? "1fr 1fr"
    : "repeat(auto-fill, minmax(210px, 1fr))"

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", background: CONTENT_BG, overflow: "hidden" }}>
      <div style={{ borderBottom: `1px solid ${CONTENT_BDR}`, padding: "18px 24px", flexShrink: 0, background: CARD_BG, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: TEXT, fontFamily: FONT }}>
            Collections
          </div>
          <div style={{ fontSize: 13, color: DIM, fontFamily: FONT }}>
            Project bundles and grouped ammo.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", borderRadius: 999, background: "#f1f5f9", color: MUTED, fontSize: 13, fontWeight: 800, fontFamily: FONT }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: loading ? DIM : TEAL, display: "inline-block" }} />
          {loading ? "Counting…" : `${collections.length.toLocaleString()} total`}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: isMobile ? 14 : 24 }}>
        {error && (
          <div style={{ marginBottom: 14, padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(193,65,65,0.2)", background: "rgba(193,65,65,0.08)", color: "#c14141", fontSize: 13, fontFamily: FONT }}>
            {error}
          </div>
        )}

        {sortedCollections.length === 0 ? (
          <div style={{ background: CARD_BG, border: `1px solid ${CONTENT_BDR}`, borderRadius: 16, padding: 24, fontSize: 14, color: DIM, fontFamily: FONT }}>
            No collections yet.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: gridColumns, gap: 14 }}>
            {sortedCollections.map(collection => {
              const color = collection.color ?? TEAL
              const count = counts[collection.id] ?? 0

              return (
                <button
                  key={collection.id}
                  type="button"
                  onClick={() => onOpenCollection(collection.id)}
                  style={{
                    minHeight: 110,
                    padding: 16,
                    borderRadius: 16,
                    border: `1px solid ${CONTENT_BDR}`,
                    background: CARD_BG,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    textAlign: "left",
                    fontFamily: FONT,
                    cursor: "pointer",
                    boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <span style={{ width: 14, height: 14, borderRadius: "50%", background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: 28, lineHeight: 1, fontWeight: 900, color: TEXT, fontFamily: FONT }}>
                      {count.toLocaleString()}
                    </span>
                  </div>

                  <div style={{ display: "grid", gap: 4 }}>
                    <div style={{ fontSize: 15, fontWeight: 850, color: TEXT, fontFamily: FONT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {collection.name}
                    </div>
                    <div style={{ fontSize: 12, lineHeight: 1.35, color: MUTED, fontFamily: FONT }}>
                      {count === 1 ? "1 item" : `${count.toLocaleString()} items`}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
