import { useState } from "react"
import { supabase } from "./supabase"
import type { HolsterCollection } from "./HolsterPanel"
import { ColorPicker, PRESET_COLORS, DEFAULT_COLOR } from "./HolsterColorPicker"
import { getHolsterEntitlements } from "./getHolsterEntitlements"

const FONT        = `"Inter", system-ui, -apple-system, sans-serif`
const CONTENT_BDR = "#e2e8f0"
const CARD_BG     = "#ffffff"
const TEAL        = "#5b95a7"
const RED         = "#c14141"
const TEXT        = "#0f172a"
const MUTED       = "#475569"

export function CollectionPicker({ collections, value, onChange, onCreateNew }: {
  collections: HolsterCollection[]
  value: string | null
  onChange: (id: string | null) => void
  onCreateNew: (col: HolsterCollection) => void
}) {
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState("")
  const [newColor, setNewColor] = useState<string>(DEFAULT_COLOR)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    const name = newName.trim()
    if (!name) return

    setSaving(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setSaving(false)
      setError("You must be signed in to create collections.")
      return
    }

    const entitlements = await getHolsterEntitlements(user.id)

    if (
      entitlements?.holster_collection_limit !== null &&
      entitlements?.holster_collection_limit !== undefined &&
      collections.length >= entitlements.holster_collection_limit
    ) {
      setSaving(false)

      setError(
        `You’ve hit the Free limit of 20 collections. Upgrade to Holster Pro for unlimited collections, 5 GB storage, and larger uploads.`
      )

      return
    }

    const { data, error } = await supabase
      .from("holster_collections")
      .insert({ name, color: newColor, user_id: user.id })
      .select()
      .single()

    setSaving(false)

    if (error || !data) {
      setError(error?.message ?? "Could not create collection.")
      return
    }

    onCreateNew(data)
    onChange(data.id)
    setCreating(false)
    setNewName("")
    setNewColor(PRESET_COLORS[0].color)
  }

  const selectedCol = collections.find(c => c.id === value)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <div style={{ position: "relative" }}>
          <select
            value={value ?? ""}
            onChange={e => onChange(e.target.value || null)}
            style={{
              height: 34,
              padding: "0 10px 0 28px",
              borderRadius: 7,
              border: `1px solid ${CONTENT_BDR}`,
              background: CARD_BG,
              fontSize: 13,
              fontFamily: FONT,
              color: TEXT,
              outline: "none",
              appearance: "auto",
            }}
          >
            <option value="">No collection</option>
            {collections.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {selectedCol?.color && (
            <span
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: selectedCol.color,
                pointerEvents: "none",
              }}
            />
          )}
        </div>

        {!creating && (
          <button
            type="button"
            onClick={() => {
              setError(null)
              setCreating(true)
            }}
            style={{
              height: 34,
              padding: "0 10px",
              borderRadius: 7,
              border: `1px solid ${CONTENT_BDR}`,
              background: "transparent",
              fontSize: 13,
              fontFamily: FONT,
              color: MUTED,
              cursor: "pointer",
            }}
          >
            + New
          </button>
        )}
      </div>

      {creating && (
        <div
          style={{
            display: "grid",
            gap: 10,
            padding: "12px 14px",
            background: `${TEAL}08`,
            border: `1px solid ${TEAL}33`,
            borderRadius: 8,
          }}
        >
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") void handleCreate()
              if (e.key === "Escape") setCreating(false)
            }}
            placeholder="Collection name"
            style={{
              height: 34,
              padding: "0 10px",
              borderRadius: 7,
              border: `1px solid ${CONTENT_BDR}`,
              background: CARD_BG,
              color: TEXT,
              fontSize: 13,
              fontFamily: FONT,
              outline: "none",
            }}
          />

          <ColorPicker value={newColor} onChange={setNewColor} />

          {error && (
            <div
              style={{
                display: "grid",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 8,
                background: "rgba(193,65,65,0.08)",
                border: "1px solid rgba(193,65,65,0.18)",
              }}
            >
              <div style={{ fontSize: 12, color: RED, fontFamily: FONT }}>
                {error}
              </div>

              <button
                type="button"
                onClick={() => window.location.href = "/pricing"}
                style={{
                  height: 32,
                  padding: "0 12px",
                  borderRadius: 7,
                  border: "none",
                  background: TEAL,
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: FONT,
                  cursor: "pointer",
                  justifySelf: "start",
                }}
              >
                Upgrade to Pro
              </button>
            </div>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={saving}
              style={{
                height: 32,
                padding: "0 12px",
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
              onClick={() => {
                setCreating(false)
                setError(null)
              }}
              style={{
                height: 32,
                padding: "0 12px",
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
      )}
    </div>
  )
}