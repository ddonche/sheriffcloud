import { useEffect, useState } from "react"
import { supabase } from "./supabase"
import type { User } from "@supabase/supabase-js"
import type { HolsterCollection } from "./HolsterPanel"
import { timeAgo, CollectionPicker } from "./HolsterNotes"
import { deriveKey, makeVerifier, checkVerifier, encrypt, decrypt } from "./holsterCrypto"

const FONT        = `"Inter", system-ui, -apple-system, sans-serif`
const CONTENT_BG  = "#f8fafc"
const CONTENT_BDR = "#e2e8f0"
const CARD_BG     = "#ffffff"
const TEAL        = "#5b95a7"
const RED         = "#c14141"
const TEXT        = "#0f172a"
const MUTED       = "#475569"
const DIM         = "#94a3b8"

type DecryptedRow = {
  id: string
  title: string
  url: string | null
  username: string | null
  password: string
  notes: string | null
  collection: string | null
  created_at: string
  updated_at: string
}

// ── PIN prompt ────────────────────────────────────────────────────────────────

export function PinPrompt({ mode, onSuccess, onSetPin }: {
  mode: "set" | "enter"
  onSuccess: (pin: string) => Promise<string | null>
  onSetPin: (key: CryptoKey, salt: string, verifier: string) => Promise<string | null>
}) {
  const [pin, setPin]         = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPin, setShowPin] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function handleInput(val: string, setter: (v: string) => void) {
    if (/^\d{0,5}$/.test(val)) setter(val)
  }

  async function handleSubmit() {
    if (pin.length !== 5) { setError("PIN must be exactly 5 digits."); return }
    if (mode === "set" && pin !== confirm) { setError("PINs do not match."); return }
    setLoading(true); setError(null)
    if (mode === "set") {
      const salt     = crypto.getRandomValues(new Uint8Array(16))
      const key      = await deriveKey(pin, salt)
      const verifier = await makeVerifier(key)
      const err      = await onSetPin(key, btoa(String.fromCharCode(...salt)), verifier)
      if (err) setError(err)
    } else {
      const err = await onSuccess(pin)
      if (err) setError(err)
    }
    setLoading(false)
  }

  const inp: React.CSSProperties = {
    width: 160, boxSizing: "border-box",
    padding: "12px 16px", borderRadius: 8,
    border: `1px solid ${CONTENT_BDR}`, background: CARD_BG,
    fontSize: 24, letterSpacing: "0.4em", textAlign: "center",
    fontFamily: "monospace", color: TEXT, outline: "none",
  }

  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: CONTENT_BG }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, width: 320, padding: "0 16px" }}>
        <svg viewBox="0 0 640 640" width={48} height={48} fill={TEAL}>
          <path d="M224 256L224 192C224 138.1 267.1 96 320 96C372.9 96 416 139.1 416 192L416 256L448 256C483.3 256 512 284.7 512 320L512 544C512 579.3 483.3 608 448 608L192 608C156.7 608 128 579.3 128 544L128 320C128 284.7 156.7 256 192 256L224 256zM288 256L352 256L352 192C352 174.3 337.7 160 320 160C302.3 160 288 174.3 288 192L288 256zM320 384C302.3 384 288 398.3 288 416C288 433.7 302.3 448 320 448C337.7 448 352 433.7 352 416C352 398.3 337.7 384 320 384z"/>
        </svg>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: TEXT, fontFamily: FONT }}>
            {mode === "set" ? "Set your PIN" : "Enter your PIN"}
          </div>
          <div style={{ fontSize: 13, color: DIM, fontFamily: FONT, marginTop: 6 }}>
            {mode === "set"
              ? "Choose a 5-digit PIN. If you forget it, your passwords cannot be recovered."
              : "Enter your 5-digit PIN to unlock."}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <input type={showPin ? "text" : "password"} inputMode="numeric" maxLength={5}
            value={pin} onChange={e => handleInput(e.target.value, setPin)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            placeholder="•••••" autoFocus style={inp} />
          {mode === "set" && (
            <input type={showPin ? "text" : "password"} inputMode="numeric" maxLength={5}
              value={confirm} onChange={e => handleInput(e.target.value, setConfirm)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              placeholder="•••••" style={inp} />
          )}
          <button type="button" onClick={() => setShowPin(v => !v)}
            style={{ background: "none", border: "none", cursor: "pointer", color: DIM, fontSize: 12, fontFamily: FONT, display: "flex", alignItems: "center", gap: 4 }}>
            <svg viewBox="0 0 640 640" width={13} height={13} fill="currentColor">
              {showPin
                ? <path d="M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9L601.2 634.9C611.6 643.1 626.7 641.2 634.9 630.8S641.2 605.3 630.8 597.1L544 530.6C683.6 456.5 752 320 752 320S633.6 80 320 80C245.3 80 181.1 100.6 128.6 133.4L38.8 5.1z"/>
                : <path d="M320 80C176 80 57.6 196.8 8 292.2C2.9 301.8 2.9 313.2 8 322.8C57.6 418.2 176 535 320 535C464 535 582.4 418.2 632 322.8C637.1 313.2 637.1 301.8 632 292.2C582.4 196.8 464 80 320 80zM320 267C285.7 267 258 294.7 258 329C258 363.3 285.7 391 320 391C354.3 391 382 363.3 382 329C382 294.7 354.3 267 320 267z"/>
              }
            </svg>
            {showPin ? "Hide PIN" : "Show PIN"}
          </button>
        </div>
        {error && (
          <div style={{ padding: "10px 14px", background: `${RED}10`, border: `1px solid ${RED}44`, borderRadius: 8, fontSize: 13, color: RED, fontFamily: FONT, textAlign: "center", width: 280 }}>
            {error}
          </div>
        )}
        <button onClick={handleSubmit} disabled={loading}
          style={{ width: 160, padding: "12px", borderRadius: 8, border: "none", background: TEAL, color: "#fff", fontSize: 15, fontWeight: 700, fontFamily: FONT, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
          {loading ? "…" : mode === "set" ? "Set PIN" : "Unlock"}
        </button>
      </div>
    </div>
  )
}

// ── Add form ──────────────────────────────────────────────────────────────────

function AddForm({ cryptoKey, user, collections, onAdded, onCancel, onCollectionCreated }: {
  cryptoKey: CryptoKey
  user: User
  collections: HolsterCollection[]
  onAdded: (row: DecryptedRow) => void
  onCancel: () => void
  onCollectionCreated: (col: HolsterCollection) => void
}) {
  const [title, setTitle]           = useState("")
  const [password, setPassword]     = useState("")
  const [collection, setCollection] = useState<string | null>(null)
  const [url, setUrl]               = useState("")
  const [username, setUsername]     = useState("")
  const [notes, setNotes]           = useState("")
  const [showExtra, setShowExtra]   = useState(false)
  const [showPw, setShowPw]         = useState(false)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState<string | null>(null)

  async function handleSave() {
    if (!title.trim())    { setError("Title is required."); return }
    if (!password.trim()) { setError("Password is required."); return }
    setSaving(true); setError(null)
    const encPw = await encrypt(cryptoKey, password)
    const { data, error } = await supabase.from("holster_passwords").insert({
      user_id: user.id, title: title.trim(), password: encPw,
      url: url.trim() || null, username: username.trim() || null,
      notes: notes.trim() || null, collection,
    }).select().single()
    setSaving(false)
    if (error) { setError(error.message); return }
    onAdded({ ...data, password })
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
        <div style={{ position: "relative" }}>
          <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Password *" style={{ ...inp, paddingRight: 40 }}
            onKeyDown={e => e.key === "Enter" && handleSave()} />
          <button type="button" onClick={() => setShowPw(v => !v)}
            style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: DIM, padding: 0, display: "flex" }}>
            <svg viewBox="0 0 640 640" width={15} height={15} fill="currentColor">
              {showPw ? <path d="M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9L601.2 634.9C611.6 643.1 626.7 641.2 634.9 630.8S641.2 605.3 630.8 597.1L544 530.6C683.6 456.5 752 320 752 320S633.6 80 320 80C245.3 80 181.1 100.6 128.6 133.4L38.8 5.1z"/>
                : <path d="M320 80C176 80 57.6 196.8 8 292.2C2.9 301.8 2.9 313.2 8 322.8C57.6 418.2 176 535 320 535C464 535 582.4 418.2 632 322.8C637.1 313.2 637.1 301.8 632 292.2C582.4 196.8 464 80 320 80zM320 451C249.7 451 193 394.3 193 324C193 253.7 249.7 197 320 197C390.3 197 447 253.7 447 324C447 394.3 390.3 451 320 451zM320 267C285.7 267 258 294.7 258 329C258 363.3 285.7 391 320 391C354.3 391 382 363.3 382 329C382 294.7 354.3 267 320 267z"/>}
            </svg>
          </button>
        </div>
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
          {showExtra ? "Less" : "Collection, URL, notes"}
        </button>
      </div>
      {showExtra && (
        <div style={{ display: "grid", gap: 8 }}>
          <CollectionPicker collections={collections} value={collection} onChange={setCollection} onCreateNew={onCollectionCreated} />
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="URL" style={inp} />
          <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username / email" style={inp} autoComplete="off" />
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes" rows={3}
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

// ── Password row ──────────────────────────────────────────────────────────────

function PasswordListRow({ item, cryptoKey, collections, onUpdated, onDeleted, onCollectionCreated }: {
  item: DecryptedRow
  cryptoKey: CryptoKey
  collections: HolsterCollection[]
  onUpdated: (row: DecryptedRow) => void
  onDeleted: (id: string) => void
  onCollectionCreated: (col: HolsterCollection) => void
}) {
  const [showPw, setShowPw]         = useState(false)
  const [expanded, setExpanded]     = useState(false)
  const [editing, setEditing]       = useState(false)
  const [title, setTitle]           = useState(item.title)
  const [password, setPassword]     = useState(item.password)
  const [url, setUrl]               = useState(item.url ?? "")
  const [username, setUsername]     = useState(item.username ?? "")
  const [notes, setNotes]           = useState(item.notes ?? "")
  const [collection, setCollection] = useState<string | null>(item.collection ?? null)
  const [showEditPw, setShowEditPw] = useState(false)
  const [saving, setSaving]         = useState(false)
  const [deleting, setDeleting]     = useState(false)
  const [copied, setCopied]         = useState(false)

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    const encPw = await encrypt(cryptoKey, password)
    const { data, error } = await supabase.from("holster_passwords")
      .update({ title: title.trim(), password: encPw, url: url.trim() || null, username: username.trim() || null, notes: notes.trim() || null, collection })
      .eq("id", item.id).select().single()
    setSaving(false)
    if (error || !data) return
    onUpdated({ ...data, password })
    setEditing(false)
  }

  async function handleDelete() {
    if (!confirm(`Delete "${item.title}"?`)) return
    setDeleting(true)
    await supabase.from("holster_passwords").delete().eq("id", item.id)
    setDeleting(false)
    onDeleted(item.id)
  }

  function handleCopy() {
    navigator.clipboard.writeText(item.password)
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
    color: color ?? DIM, display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  })

  return (
    <div style={{ borderBottom: `1px solid ${CONTENT_BDR}`, background: CARD_BG }}>
      <div className="hol-list-row" style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", minHeight: 48 }}>
        <div className="hol-list-row-title" style={{ width: 160, flexShrink: 0, fontSize: 14, fontWeight: 700, color: TEXT, fontFamily: FONT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {item.title}
        </div>
        <div className="hol-list-row-value" style={{ flex: 1, display: "flex", alignItems: "center", gap: 0, minWidth: 0 }}>
          <span style={{ fontSize: 13, fontFamily: "monospace", color: MUTED, letterSpacing: showPw ? "normal" : "0.12em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginRight: 4 }}>
            {showPw ? item.password : "••••••••••••"}
          </span>
          <button onClick={() => setShowPw(v => !v)} title={showPw ? "Hide" : "Reveal"} style={iconBtn(showPw ? TEAL : DIM)}>
            <svg viewBox="0 0 640 640" width={14} height={14} fill="currentColor">
              {showPw ? <path d="M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9L601.2 634.9C611.6 643.1 626.7 641.2 634.9 630.8S641.2 605.3 630.8 597.1L544 530.6C683.6 456.5 752 320 752 320S633.6 80 320 80C245.3 80 181.1 100.6 128.6 133.4L38.8 5.1z"/>
                : <path d="M320 80C176 80 57.6 196.8 8 292.2C2.9 301.8 2.9 313.2 8 322.8C57.6 418.2 176 535 320 535C464 535 582.4 418.2 632 322.8C637.1 313.2 637.1 301.8 632 292.2C582.4 196.8 464 80 320 80zM320 267C285.7 267 258 294.7 258 329C258 363.3 285.7 391 320 391C354.3 391 382 363.3 382 329C382 294.7 354.3 267 320 267z"/>}
            </svg>
          </button>
          <button onClick={handleCopy} title="Copy" style={iconBtn(copied ? TEAL : DIM)}>
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
              {(item.url || item.username || item.notes) && (
                <div style={{ display: "grid", gap: 4, fontSize: 13, fontFamily: FONT }}>
                  {item.url && <div><span style={{ color: DIM }}>URL: </span><a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: TEAL, textDecoration: "none" }}>{item.url}</a></div>}
                  {item.username && <div><span style={{ color: DIM }}>Username: </span><span style={{ color: MUTED }}>{item.username}</span></div>}
                  {item.notes && <div><span style={{ color: DIM }}>Notes: </span><span style={{ color: MUTED }}>{item.notes}</span></div>}
                </div>
              )}
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
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" style={inp} />
                <div style={{ position: "relative" }}>
                  <input type={showEditPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Password" style={{ ...inp, paddingRight: 36 }} />
                  <button type="button" onClick={() => setShowEditPw(v => !v)}
                    style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: DIM, padding: 0, display: "flex" }}>
                    <svg viewBox="0 0 640 640" width={13} height={13} fill="currentColor">
                      {showEditPw ? <path d="M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9L601.2 634.9C611.6 643.1 626.7 641.2 634.9 630.8S641.2 605.3 630.8 597.1L544 530.6C683.6 456.5 752 320 752 320S633.6 80 320 80C245.3 80 181.1 100.6 128.6 133.4L38.8 5.1z"/>
                        : <path d="M320 80C176 80 57.6 196.8 8 292.2C2.9 301.8 2.9 313.2 8 322.8C57.6 418.2 176 535 320 535C464 535 582.4 418.2 632 322.8C637.1 313.2 637.1 301.8 632 292.2C582.4 196.8 464 80 320 80zM320 267C285.7 267 258 294.7 258 329C258 363.3 285.7 391 320 391C354.3 391 382 363.3 382 329C382 294.7 354.3 267 320 267z"/>}
                    </svg>
                  </button>
                </div>
              </div>
              <input value={url} onChange={e => setUrl(e.target.value)} placeholder="URL" style={inp} />
              <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username / email" style={inp} autoComplete="off" />
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes" rows={2}
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

// ── Main ──────────────────────────────────────────────────────────────────────

export default function HolsterPasswords({ user, collections, onCollectionCreated, cryptoKey: propKey, onCryptoKeySet }: {
  user: User
  collections: HolsterCollection[]
  onCollectionCreated: (col: HolsterCollection) => void
  cryptoKey: CryptoKey | null
  onCryptoKeySet: (key: CryptoKey) => void
}) {
  const [pinState, setPinState] = useState<"loading" | "set" | "enter" | "unlocked">("loading")
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(propKey)
  const [items, setItems]         = useState<DecryptedRow[]>([])
  const [loading, setLoading]     = useState(false)
  const [showAdd, setShowAdd]     = useState(false)
  const [sortAZ, setSortAZ]       = useState(true)
  const [twoCol, setTwoCol]       = useState(false)

  void collections; void onCollectionCreated

  function setKey(key: CryptoKey) {
    setCryptoKey(key)
    onCryptoKeySet(key)
    setPinState("unlocked")
  }

  useEffect(() => {
    if (propKey) { setCryptoKey(propKey); setPinState("unlocked"); return }
    supabase.from("holster_passwords_meta").select("user_id").eq("user_id", user.id).single()
      .then(({ data }) => setPinState(data ? "enter" : "set"))
  }, [])

  useEffect(() => {
    if (pinState !== "unlocked" || !cryptoKey) return
    setLoading(true)
    supabase.from("holster_passwords")
      .select("id, title, url, username, password, notes, collection, created_at, updated_at")
      .eq("user_id", user.id).order("title")
      .then(async ({ data }) => {
        if (!data) { setLoading(false); return }
        const dec = await Promise.all(data.map(async row => ({
          ...row,
          password: await decrypt(cryptoKey!, row.password).catch(() => "⚠ decrypt error"),
        })))
        setItems(dec); setLoading(false)
      })
  }, [pinState])

  async function handleSetPin(key: CryptoKey, salt: string, verifier: string): Promise<string | null> {
    const { error } = await supabase.from("holster_passwords_meta").insert({ user_id: user.id, salt, verifier })
    if (error) return error.message
    setKey(key)
    return null
  }

  async function handleEnterPin(pin: string): Promise<string | null> {
    const { data } = await supabase.from("holster_passwords_meta").select("salt, verifier").eq("user_id", user.id).single()
    if (!data) return "Could not load PIN data."
    const salt = Uint8Array.from(atob(data.salt), c => c.charCodeAt(0))
    const key  = await deriveKey(pin, salt)
    const ok   = await checkVerifier(key, data.verifier)
    if (!ok) return "Incorrect PIN."
    setKey(key)
    return null
  }

  if (pinState === "loading") return <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: CONTENT_BG, color: DIM, fontFamily: FONT }}>Loading…</div>
  if (pinState === "set")   return <PinPrompt mode="set"   onSuccess={async () => null} onSetPin={handleSetPin} />
  if (pinState === "enter") return <PinPrompt mode="enter" onSuccess={handleEnterPin}   onSetPin={async () => null} />

  const sorted = [...items].sort((a, b) => sortAZ ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title))
  const half   = Math.ceil(sorted.length / 2)
  const col1   = sorted.slice(0, half)
  const col2   = sorted.slice(half)

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", background: CONTENT_BG, overflow: "hidden" }}>
      <div className="hol-header-bar" style={{ height: 58, borderBottom: `1px solid ${CONTENT_BDR}`, display: "flex", alignItems: "center", gap: 12, padding: "0 24px", flexShrink: 0, background: CARD_BG }}>
        <button onClick={() => setShowAdd(v => !v)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 7, border: "none", background: TEAL, color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: FONT, cursor: "pointer" }}>
          <svg viewBox="0 0 640 640" width={11} height={11} fill="currentColor"><path d="M320 64C306.7 64 296 74.7 296 88L296 296L88 296C74.7 296 64 306.7 64 320C64 333.3 74.7 344 88 344L296 344L296 552C296 565.3 306.7 576 320 576C333.3 576 344 565.3 344 552L344 344L552 344C565.3 344 576 333.3 576 320C576 306.7 565.3 296 552 296L344 296L344 88C344 74.7 333.3 64 320 64z"/></svg>
          New Password
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
        <span style={{ fontSize: 13, color: DIM, fontFamily: FONT }}>{items.length} passwords</span>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        {showAdd && (
          <div style={{ padding: 20, borderBottom: `1px solid ${CONTENT_BDR}` }}>
            <AddForm cryptoKey={cryptoKey!} user={user} collections={collections}
              onAdded={row => { setItems(prev => [row, ...prev]); setShowAdd(false) }}
              onCancel={() => setShowAdd(false)}
              onCollectionCreated={onCollectionCreated} />
          </div>
        )}
        {loading && <div style={{ padding: 24, color: DIM, fontSize: 14, fontFamily: FONT }}>Decrypting…</div>}
        {!loading && items.length === 0 && !showAdd && <div style={{ padding: 24, color: DIM, fontSize: 14, fontFamily: FONT }}>No passwords yet.</div>}
        {twoCol ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", alignItems: "start" }}>
            <div style={{ borderRight: `1px solid ${CONTENT_BDR}` }}>
              {col1.map(item => (
                <PasswordListRow key={item.id} item={item} cryptoKey={cryptoKey!}
                  collections={collections} onCollectionCreated={onCollectionCreated}
                  onUpdated={u => setItems(prev => prev.map(r => r.id === u.id ? u : r))}
                  onDeleted={id => setItems(prev => prev.filter(r => r.id !== id))} />
              ))}
            </div>
            <div>
              {col2.map(item => (
                <PasswordListRow key={item.id} item={item} cryptoKey={cryptoKey!}
                  collections={collections} onCollectionCreated={onCollectionCreated}
                  onUpdated={u => setItems(prev => prev.map(r => r.id === u.id ? u : r))}
                  onDeleted={id => setItems(prev => prev.filter(r => r.id !== id))} />
              ))}
            </div>
          </div>
        ) : (
          sorted.map(item => (
            <PasswordListRow key={item.id} item={item} cryptoKey={cryptoKey!}
              collections={collections} onCollectionCreated={onCollectionCreated}
              onUpdated={u => setItems(prev => prev.map(r => r.id === u.id ? u : r))}
              onDeleted={id => setItems(prev => prev.filter(r => r.id !== id))} />
          ))
        )}
      </div>
    </div>
  )
}
