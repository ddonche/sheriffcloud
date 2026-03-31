import { useEffect, useRef, useState } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { supabase } from "./supabase"
import type { User } from "@supabase/supabase-js"
import type { HolsterCollection } from "./HolsterPanel"
import LinkPicker, { type LinkableItem, type LinkItemType } from "./components/LinkPicker"

const FONT        = `"Inter", system-ui, -apple-system, sans-serif`
const CONTENT_BG  = "#f8fafc"
const CONTENT_BDR = "#e2e8f0"
const CARD_BG     = "#ffffff"
const TEAL        = "#5b95a7"
const RED         = "#c14141"
const TEXT        = "#0f172a"
const MUTED       = "#475569"
const DIM         = "#94a3b8"

export type NoteType = "note" | "snippet"

export type NoteTab = {
  id: string
  label: string
  content: string
}

export type HolsterNote = {
  id: string
  title: string
  content: string
  tabs: NoteTab[] | null
  collection: string | null
  created_at: string
  updated_at: string
}

export const NOTE_TABLE: Record<NoteType, "holster_notes" | "holster_snippets"> = {
  note: "holster_notes",
  snippet: "holster_snippets",
}

const NOTE_LINK_TYPE: Record<NoteType, LinkItemType> = {
  note: "notes",
  snippet: "snippets",
}

type LinkedNoteItem = LinkableItem

type LinkCountMap = Record<string, Partial<Record<LinkItemType, number>>>

const LINK_TYPE_ICON_PATHS: Partial<Record<LinkItemType, string>> = {
  notes: "M480 576L192 576C139 576 96 533 96 480L96 160C96 107 139 64 192 64L496 64C522.5 64 544 85.5 544 112L544 400C544 420.9 530.6 438.7 512 445.3L512 512C529.7 512 544 526.3 544 544C544 561.7 529.7 576 512 576L480 576zM192 448C174.3 448 160 462.3 160 480C160 497.7 174.3 512 192 512L448 512L448 448L192 448zM224 216C224 229.3 234.7 240 248 240L424 240C437.3 240 448 229.3 448 216C448 202.7 437.3 192 424 192L248 192C234.7 192 224 202.7 224 216zM248 288C234.7 288 224 298.7 224 312C224 325.3 234.7 336 248 336L424 336C437.3 336 448 325.3 448 312C448 298.7 437.3 288 424 288L248 288z",
  files: "M192 64C156.7 64 128 92.7 128 128L128 512C128 547.3 156.7 576 192 576L448 576C483.3 576 512 547.3 512 512L512 234.5C512 217.5 505.3 201.2 493.3 189.2L386.7 82.7C374.7 70.7 358.5 64 341.5 64L192 64zM453.5 240L360 240C346.7 240 336 229.3 336 216L336 122.5L453.5 240z",
  passwords: "M128 128C128 92.7 156.7 64 192 64L448 64C483.3 64 512 92.7 512 128L512 512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3 128 512L128 128zM224 472C224 485.3 234.7 496 248 496L392 496C405.3 496 416 485.3 416 472C416 458.7 405.3 448 392 448L248 448C234.7 448 224 458.7 224 472zM406.6 272C401.8 298.4 385.1 320.7 362.4 333.2C369.1 316.2 373.6 295.2 375 272L406.6 272zM233.5 272L265.1 272C266.5 295.1 271.1 316.2 277.7 333.2C255 320.7 238.3 298.4 233.5 272zM309.9 327C303.7 313.6 298.8 294.5 297.2 272L343 272C341.4 294.5 336.5 313.6 330.3 327C325.8 336.6 322.1 340.8 320.1 342.5C318.1 340.8 314.4 336.7 309.9 327zM309.9 185C314.4 175.4 318.1 171.2 320.1 169.5C322.1 171.2 325.8 175.3 330.3 185C336.5 198.4 341.4 217.5 343 240L297.2 240C298.8 217.5 303.7 198.4 309.9 185zM406.6 240L375 240C373.6 216.9 369 195.8 362.4 178.8C385.1 191.3 401.8 213.6 406.6 240zM265 240L233.4 240C238.2 213.6 254.9 191.3 277.6 178.8C270.9 195.8 266.4 216.8 265 240zM448 256C448 185.3 390.7 128 320 128C249.3 128 192 185.3 192 256C192 326.7 249.3 384 320 384C390.7 384 448 326.7 448 256z",
  keys: "M400 416C497.2 416 576 337.2 576 240C576 142.8 497.2 64 400 64C302.8 64 224 142.8 224 240C224 258.7 226.9 276.8 232.3 293.7L71 455C66.5 459.5 64 465.6 64 472L64 552C64 565.3 74.7 576 88 576L168 576C181.3 576 192 565.3 192 552L192 512L232 512C245.3 512 256 501.3 256 488L256 448L296 448C302.4 448 308.5 445.5 313 441L346.3 407.7C363.2 413.1 381.3 416 400 416zM440 160C462.1 160 480 177.9 480 200C480 222.1 462.1 240 440 240C417.9 240 400 222.1 400 200C400 177.9 417.9 160 440 160z",
  snippets: "M160 544C124.7 544 96 515.3 96 480L96 160C96 124.7 124.7 96 160 96L480 96C515.3 96 544 124.7 544 160L544 373.5C544 390.5 537.3 406.8 525.3 418.8L418.7 525.3C406.7 537.3 390.4 544 373.4 544L160 544zM485.5 368L392 368C378.7 368 368 378.7 368 392L368 485.5L485.5 368z",
  links: "M451.5 160C434.9 160 418.8 164.5 404.7 172.7C388.9 156.7 370.5 143.3 350.2 133.2C378.4 109.2 414.3 96 451.5 96C537.9 96 608 166 608 252.5C608 294 591.5 333.8 562.2 363.1L491.1 434.2C461.8 463.5 422 480 380.5 480C294.1 480 224 410 224 323.5C224 322 224 320.5 224.1 319C224.6 301.3 239.3 287.4 257 287.9C274.7 288.4 288.6 303.1 288.1 320.8C288.1 321.7 288.1 322.6 288.1 323.4C288.1 374.5 329.5 415.9 380.6 415.9C405.1 415.9 428.6 406.2 446 388.8L517.1 317.7C534.4 300.4 544.2 276.8 544.2 252.3C544.2 201.2 502.8 159.8 451.7 159.8zM307.2 237.3C305.3 236.5 303.4 235.4 301.7 234.2C289.1 227.7 274.7 224 259.6 224C235.1 224 211.6 233.7 194.2 251.1L123.1 322.2C105.8 339.5 96 363.1 96 387.6C96 438.7 137.4 480.1 188.5 480.1C205 480.1 221.1 475.7 235.2 467.5C251 483.5 269.4 496.9 289.8 507C261.6 530.9 225.8 544.2 188.5 544.2C102.1 544.2 32 474.2 32 387.7C32 346.2 48.5 306.4 77.8 277.1L148.9 206C178.2 176.7 218 160.2 259.5 160.2C346.1 160.2 416 230.8 416 317.1C416 318.4 416 319.7 416 321C415.6 338.7 400.9 352.6 383.2 352.2C365.5 351.8 351.6 337.1 352 319.4C352 318.6 352 317.9 352 317.1C352 283.4 334 253.8 307.2 237.5z",
}

function renderLinkTypeIcon(type: LinkItemType) {
  const path = LINK_TYPE_ICON_PATHS[type]
  if (path) {
    return (
      <svg viewBox="0 0 640 640" width={14} height={14} fill="currentColor" aria-hidden="true">
        <path d={path} />
      </svg>
    )
  }

  return <svg viewBox="0 0 640 640" width={14} height={14} fill="currentColor"><circle cx="320" cy="320" r="160"/></svg>
}

export function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(ts).toLocaleDateString()
}

export function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

// ── Tiptap toolbar ────────────────────────────────────────────────────────────

function ToolbarBtn({ active, onClick, children, title }: { active?: boolean; onClick: () => void; children: React.ReactNode; title: string }) {
  return (
    <button type="button" title={title} onClick={onClick}
      style={{
        width: 40, height: 36, borderRadius: 6, border: "none",
        background: active ? `${TEAL}22` : "transparent",
        color: active ? TEAL : MUTED,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", fontSize: 15, fontWeight: 700, fontFamily: FONT,
        transition: "background 0.1s, color 0.1s",
      }}
      onMouseEnter={e => { e.currentTarget.style.background = `${TEAL}18`; e.currentTarget.style.color = TEAL }}
      onMouseLeave={e => { e.currentTarget.style.background = active ? `${TEAL}22` : "transparent"; e.currentTarget.style.color = active ? TEAL : MUTED }}
    >
      {children}
    </button>
  )
}

export function Toolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 2, padding: "8px 24px",
      borderBottom: `1px solid ${CONTENT_BDR}`, background: CARD_BG,
      flexShrink: 0, flexWrap: "wrap",
    }}>
      <ToolbarBtn title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><strong>B</strong></ToolbarBtn>
      <ToolbarBtn title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><em>I</em></ToolbarBtn>
      <ToolbarBtn title="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><span style={{ textDecoration: "line-through" }}>S</span></ToolbarBtn>
      <ToolbarBtn title="Code" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}>{"<>"}</ToolbarBtn>
      <div style={{ width: 1, height: 20, background: CONTENT_BDR, margin: "0 4px" }} />
      <ToolbarBtn title="Heading 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>H1</ToolbarBtn>
      <ToolbarBtn title="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</ToolbarBtn>
      <ToolbarBtn title="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</ToolbarBtn>
      <div style={{ width: 1, height: 20, background: CONTENT_BDR, margin: "0 4px" }} />
      <ToolbarBtn title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <svg viewBox="0 0 640 640" width={20} height={20} fill="currentColor"><path d="M96 128C96 110.3 110.3 96 128 96C145.7 96 160 110.3 160 128C160 145.7 145.7 160 128 160C110.3 160 96 145.7 96 128zM224 112L576 112C593.7 112 608 126.3 608 144C608 161.7 593.7 176 576 176L224 176C206.3 176 192 161.7 192 144C192 126.3 206.3 112 224 112zM224 304L576 304C593.7 304 608 318.3 608 336C608 353.7 593.7 368 576 368L224 368C206.3 368 192 353.7 192 336C192 318.3 206.3 304 224 304zM224 496L576 496C593.7 496 608 510.3 608 528C608 545.7 593.7 560 576 560L224 560C206.3 560 192 545.7 192 528C192 510.3 206.3 496 224 496zM96 320C96 302.3 110.3 288 128 288C145.7 288 160 302.3 160 320C160 337.7 145.7 352 128 352C110.3 352 96 337.7 96 320zM160 512C160 529.7 145.7 544 128 544C110.3 544 96 529.7 96 512C96 494.3 110.3 480 128 480C145.7 480 160 494.3 160 512z"/></svg>
      </ToolbarBtn>
      <ToolbarBtn title="Ordered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <svg viewBox="0 0 640 640" width={20} height={20} fill="currentColor"><path d="M80 64L112 64L112 176L144 176L144 192L80 192L80 176L96 176L96 80L80 80L80 64zM224 112L576 112C593.7 112 608 126.3 608 144C608 161.7 593.7 176 576 176L224 176C206.3 176 192 161.7 192 144C192 126.3 206.3 112 224 112zM224 304L576 304C593.7 304 608 318.3 608 336C608 353.7 593.7 368 576 368L224 368C206.3 368 192 353.7 192 336C192 318.3 206.3 304 224 304zM224 496L576 496C593.7 496 608 510.3 608 528C608 545.7 593.7 560 576 560L224 560C206.3 560 192 545.7 192 528C192 510.3 206.3 496 224 496zM80 288C80 279.2 87.2 272 96 272L128 272C145.7 272 160 286.3 160 304C160 316.1 153.2 326.5 143.3 332L160 352L80 352L80 336L128 336C131.3 336 134 333.3 134 330L134 320C134 316.7 131.3 314 128 314L96 314L96 298L128 298C131.3 298 134 295.3 134 292C134 288.7 131.3 286 128 286L96 286C87.2 286 80 278.8 80 270L80 288zM80 480L144 416L80 416L80 400L160 400L160 416L96 480L160 480L160 496L80 496L80 480z"/></svg>
      </ToolbarBtn>
      <ToolbarBtn title="Blockquote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <svg viewBox="0 0 640 640" width={20} height={20} fill="currentColor"><path d="M0 224C0 179.8 35.8 144 80 144L96 144C113.7 144 128 158.3 128 176C128 193.7 113.7 208 96 208L80 208C71.2 208 64 215.2 64 224L64 240L96 240C131.3 240 160 268.7 160 304L160 368C160 403.3 131.3 432 96 432L64 432C28.7 432 0 403.3 0 368L0 224zM480 144L496 144C540.2 144 576 179.8 576 224L576 368C576 403.3 547.3 432 512 432L480 432C444.7 432 416 403.3 416 368L416 304C416 268.7 444.7 240 480 240L512 240L512 224C512 215.2 504.8 208 496 208L480 208C462.3 208 448 193.7 448 176C448 158.3 462.3 144 480 144z"/></svg>
      </ToolbarBtn>
      <ToolbarBtn title="Code block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
        <svg viewBox="0 0 640 640" width={20} height={20} fill="currentColor"><path d="M399.1 79.9C406.4 62.8 397.1 43.1 380 35.9C362.9 28.6 343.1 37.9 335.9 55.1L240.9 288.1C233.6 305.2 242.9 324.9 260 332.1C277.1 339.4 296.9 330.1 304.1 312.9L399.1 79.9zM176 154.7C187.9 143.2 187.6 124.4 176 113.1C164.4 101.7 145.6 101.7 134.1 113.1L18.1 224.1C6.8 235.2 6.8 252.8 18.1 263.9L134.1 374.9C145.6 386.3 164.4 386.3 176 374.9C187.6 363.6 187.6 344.8 176 333.4L81.9 244L176 154.7zM506 113.1C494.4 101.7 475.6 101.7 464 113.1C452.4 124.6 452.4 143.4 464 154.9L558.1 244L464 333.3C452.4 344.8 452.4 363.6 464 375.1C475.6 386.6 494.4 386.3 506 374.9L622 263.9C633.3 252.8 633.3 235.2 622 224.1L506 113.1z"/></svg>
      </ToolbarBtn>
      <div style={{ width: 1, height: 20, background: CONTENT_BDR, margin: "0 4px" }} />
      <ToolbarBtn title="Undo" onClick={() => editor.chain().focus().undo().run()}>
        <svg viewBox="0 0 640 640" width={20} height={20} fill="currentColor"><path d="M96 384C96 280.8 179.2 192 288 192L408.6 192C459.4 192 502.6 227.7 512 277.8L512 278.4C514.9 293.5 529.6 303.5 544.7 300.7C559.8 297.8 569.8 283.1 567 268L567 267.4C553.4 194.4 489.4 144 408.6 144L288 144C152.9 144 48 249.2 48 384L48 416L16 416C5.1 416 -3.8 423.4 -5.3 432.2C-6.7 441 -0.1 449.5 8.5 453.7L136.5 519.7C143.5 523.3 152 521.8 157.2 516.5L253.2 420.5C259.1 414.6 259.8 405.2 254.8 398.5C249.9 391.8 240.7 389.7 233.3 393.6L160 432L160 384L96 384z"/></svg>
      </ToolbarBtn>
      <ToolbarBtn title="Redo" onClick={() => editor.chain().focus().redo().run()}>
        <svg viewBox="0 0 640 640" width={20} height={20} fill="currentColor"><path d="M544 384C544 280.8 460.8 192 352 192L231.4 192C180.6 192 137.4 227.7 128 277.8L128 278.4C125.1 293.5 110.4 303.5 95.3 300.7C80.2 297.8 70.2 283.1 73 268L73 267.4C86.6 194.4 150.6 144 231.4 144L352 144C487.1 144 592 249.2 592 384L592 416L624 416C634.9 416 643.8 423.4 645.3 432.2C646.7 441 640.1 449.5 631.5 453.7L503.5 519.7C496.5 523.3 488 521.8 482.8 516.5L386.8 420.5C380.9 414.6 380.2 405.2 385.2 398.5C390.1 391.8 399.3 389.7 406.7 393.6L480 432L480 384L544 384z"/></svg>
      </ToolbarBtn>
    </div>
  )
}

// ── Collection picker ─────────────────────────────────────────────────────────

import { ColorPicker, PRESET_COLORS, DEFAULT_COLOR } from "./HolsterColorPicker"

export function CollectionPicker({ collections, value, onChange, onCreateNew }: {
  collections: HolsterCollection[]
  value: string | null
  onChange: (id: string | null) => void
  onCreateNew: (col: HolsterCollection) => void
}) {
  const [creating, setCreating]   = useState(false)
  const [newName, setNewName]     = useState("")
  const [newColor, setNewColor]   = useState<string>(DEFAULT_COLOR)
  const [saving, setSaving]       = useState(false)

  async function handleCreate() {
    const name = newName.trim()
    if (!name) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from("holster_collections")
      .insert({ name, color: newColor, user_id: user?.id })
      .select().single()
    setSaving(false)
    if (error || !data) return
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
        {/* Custom select-like button showing color dot */}
        <div style={{ position: "relative" }}>
          <select value={value ?? ""} onChange={e => onChange(e.target.value || null)}
            style={{ height: 34, padding: "0 10px 0 28px", borderRadius: 7, border: `1px solid ${CONTENT_BDR}`, background: CARD_BG, fontSize: 13, fontFamily: FONT, color: TEXT, outline: "none", appearance: "auto" }}>
            <option value="">No collection</option>
            {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {selectedCol?.color && (
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 8, height: 8, borderRadius: "50%", background: selectedCol.color, pointerEvents: "none" }} />
          )}
        </div>
        {!creating && (
          <button onClick={() => setCreating(true)}
            style={{ height: 34, padding: "0 10px", borderRadius: 7, border: `1px solid ${CONTENT_BDR}`, background: "transparent", fontSize: 13, fontFamily: FONT, color: MUTED, cursor: "pointer" }}>
            + New
          </button>
        )}
      </div>

      {creating && (
        <div style={{ display: "grid", gap: 10, padding: "12px 14px", background: `${TEAL}08`, border: `1px solid ${TEAL}33`, borderRadius: 8 }}>
          <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") setCreating(false) }}
            placeholder="Collection name"
            style={{ height: 34, padding: "0 10px", borderRadius: 7, border: `1px solid ${CONTENT_BDR}`, background: CARD_BG, fontSize: 13, fontFamily: FONT, color: TEXT, outline: "none" }} />
          <ColorPicker value={newColor} onChange={setNewColor} />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleCreate} disabled={saving}
              style={{ height: 30, padding: "0 12px", borderRadius: 7, border: "none", background: TEAL, fontSize: 13, fontFamily: FONT, color: "#fff", cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? "…" : "Create"}
            </button>
            <button onClick={() => setCreating(false)}
              style={{ height: 30, padding: "0 10px", borderRadius: 7, border: `1px solid ${CONTENT_BDR}`, background: "transparent", fontSize: 13, fontFamily: FONT, color: MUTED, cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Shared editor (used by notes + snippets) ──────────────────────────────────

export function NoteEditor({ item, isNew, type, user, collections, onSave, onDelete, onBack, onCollectionCreated, onOpenLinkedItem }: {
  item: HolsterNote | null
  isNew: boolean
  type: NoteType
  user: User
  collections: HolsterCollection[]
  onSave: (saved: HolsterNote) => void
  onDelete: (id: string) => void
  onBack: () => void
  onCollectionCreated: (col: HolsterCollection) => void
  onOpenLinkedItem?: (item: LinkedNoteItem) => void
}) {
  const label = type === "note" ? "Note" : "Snippet"

  function initTabs(note: HolsterNote | null): NoteTab[] {
    if (note?.tabs && note.tabs.length > 0) return note.tabs
    return [{ id: crypto.randomUUID(), label: "Tab 1", content: note?.content ?? "" }]
  }

  const [tabs, setTabs]               = useState<NoteTab[]>(() => initTabs(item))
  const [activeTabId, setActiveTabId] = useState<string>(() => initTabs(item)[0].id)
  const [renamingId, setRenamingId]   = useState<string | null>(null)
  const [renameVal, setRenameVal]     = useState("")
  const renameInputRef                = useRef<HTMLInputElement>(null)

  const activeTab = tabs.find(t => t.id === activeTabId) ?? tabs[0]

  // Keep tab content in sync when switching — flush current editor HTML into tabs before switching
  const tabsRef = useRef(tabs)
  tabsRef.current = tabs

  const [title, setTitle]           = useState(item?.title ?? "")
  const [collection, setCollection] = useState<string | null>(item?.collection ?? null)
  const [saving, setSaving]         = useState(false)
  const [dirty, setDirty]           = useState(false)
  const [deleting, setDeleting]     = useState(false)
  const [error, setError]           = useState<string | null>(null)

  const savedItemIdRef  = useRef<string | null>(item?.id ?? null)
  const autosaveTimer   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const titleRef        = useRef(title)
  const collectionRef   = useRef(collection)
  const activeTabIdRef  = useRef(activeTabId)

  useEffect(() => { titleRef.current = title }, [title])
  useEffect(() => { collectionRef.current = collection }, [collection])
  useEffect(() => { activeTabIdRef.current = activeTabId }, [activeTabId])
  const [linkOpen, setLinkOpen]     = useState(false)
  const [linkedItems, setLinkedItems] = useState<LinkedNoteItem[]>([])
  const [linksLoading, setLinksLoading] = useState(false)
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null)
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<any>(null)
  const speechSupported = typeof window !== "undefined" && !!(((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition))

  const editor = useEditor({
    extensions: [StarterKit],
    content: activeTab?.content ?? "",
    onUpdate: () => scheduleAutosave(),
    editorProps: {
      attributes: {
        style: [
          "outline: none",
          "min-height: calc(100vh - 340px)",
          `font-family: ${FONT}`,
          "font-size: 15px",
          "line-height: 1.8",
          `color: ${TEXT}`,
        ].join("; "),
      },
    },
  }, [item?.id, activeTabId])

  async function loadLinkedItems(itemId: string, itemType: NoteType) {
    setLinksLoading(true)

    const sourceType = NOTE_LINK_TYPE[itemType]
    const { data: linkRows, error: linkError } = await supabase
      .from("holster_item_links")
      .select("target_type, target_id")
      .eq("source_type", sourceType)
      .eq("source_id", itemId)
      .eq("user_id", user.id)

    if (linkError) {
      setError(linkError.message)
      setLinkedItems([])
      setLinksLoading(false)
      return
    }

    const rows = linkRows ?? []
    const noteIds = rows.filter(row => row.target_type === "notes").map(row => row.target_id)
    const snippetIds = rows.filter(row => row.target_type === "snippets").map(row => row.target_id)

    const linked: LinkedNoteItem[] = []

    if (noteIds.length) {
      const { data, error: notesError } = await supabase
        .from("holster_notes")
        .select("id, title, content, collection")
        .eq("user_id", user.id)
        .in("id", noteIds)
      if (notesError) {
        setError(notesError.message)
      } else {
        linked.push(...(data ?? []).map(row => ({
          id: row.id,
          type: "notes" as const,
          title: row.title || "Untitled",
          preview: row.content ? String(row.content).replace(/<[^>]+>/g, " ").trim() : "",
          collectionId: row.collection,
        })))
      }
    }

    if (snippetIds.length) {
      const { data, error: snippetsError } = await supabase
        .from("holster_snippets")
        .select("id, title, content, collection")
        .eq("user_id", user.id)
        .in("id", snippetIds)
      if (snippetsError) {
        setError(snippetsError.message)
      } else {
        linked.push(...(data ?? []).map(row => ({
          id: row.id,
          type: "snippets" as const,
          title: row.title || "Untitled",
          preview: row.content ? String(row.content).replace(/<[^>]+>/g, " ").trim() : "",
          collectionId: row.collection,
        })))
      }
    }

    const order = new Map(rows.map((row, index) => [`${row.target_type}:${row.target_id}`, index]))
    linked.sort((a, b) => (order.get(`${a.type}:${a.id}`) ?? 0) - (order.get(`${b.type}:${b.id}`) ?? 0))

    setLinkedItems(linked)
    setLinksLoading(false)
  }

  useEffect(() => {
    const t = initTabs(item)
    setTabs(t)
    setActiveTabId(t[0].id)
    setRenamingId(null)
  }, [item?.id])

  useEffect(() => {
    if (!item?.id) {
      setLinkedItems([])
      return
    }
    loadLinkedItems(item.id, type)
  }, [item?.id, type, user.id])

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop?.()
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    }
  }, [])

  useEffect(() => {
    recognitionRef.current?.stop?.()
    setListening(false)
  }, [item?.id, type])

  async function loadLinkableItems(): Promise<LinkableItem[]> {
    const [notesRes, snippetsRes] = await Promise.all([
      supabase.from("holster_notes").select("id, title, content, collection").eq("user_id", user.id).order("updated_at", { ascending: false }),
      supabase.from("holster_snippets").select("id, title, content, collection").eq("user_id", user.id).order("updated_at", { ascending: false }),
    ])

    if (notesRes.error) throw new Error(notesRes.error.message)
    if (snippetsRes.error) throw new Error(snippetsRes.error.message)

    const noteItems: LinkableItem[] = (notesRes.data ?? []).map(row => ({
      id: row.id,
      type: "notes",
      title: row.title || "Untitled",
      preview: row.content ? String(row.content).replace(/<[^>]+>/g, " ").trim() : "",
      collectionId: row.collection,
      collectionName: collections.find(col => col.id === row.collection)?.name ?? null,
    }))

    const snippetItems: LinkableItem[] = (snippetsRes.data ?? []).map(row => ({
      id: row.id,
      type: "snippets",
      title: row.title || "Untitled",
      preview: row.content ? String(row.content).replace(/<[^>]+>/g, " ").trim() : "",
      collectionId: row.collection,
      collectionName: collections.find(col => col.id === row.collection)?.name ?? null,
    }))

    return [...noteItems, ...snippetItems]
  }

  async function handleCreateLink(target: LinkableItem) {
    if (!item?.id) return

    const sourceType = NOTE_LINK_TYPE[type]
    const { error: insertError } = await supabase
      .from("holster_item_links")
      .insert({
        user_id: user.id,
        source_type: sourceType,
        source_id: item.id,
        target_type: target.type,
        target_id: target.id,
      })

    if (insertError) {
      setError(insertError.message)
      return
    }

    await loadLinkedItems(item.id, type)
  }

  async function handleUnlink(target: LinkedNoteItem) {
    if (!item?.id) return

    setUnlinkingId(`${target.type}:${target.id}`)
    const sourceType = NOTE_LINK_TYPE[type]
    const { error: deleteError } = await supabase
      .from("holster_item_links")
      .delete()
      .eq("user_id", user.id)
      .eq("source_type", sourceType)
      .eq("source_id", item.id)
      .eq("target_type", target.type)
      .eq("target_id", target.id)

    setUnlinkingId(null)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    setLinkedItems(prev => prev.filter(link => !(link.id === target.id && link.type === target.type)))
  }


  function insertTranscript(text: string) {
    if (!editor) return
    const cleaned = text.replace(/\s+/g, " ").trim()
    if (!cleaned) return
    const prefix = editor.isEmpty ? "" : " "
    editor.chain().focus().insertContent(prefix + cleaned).run()
  }

  function toggleListening() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      setError("Speech recognition not supported in this browser.")
      return
    }
    if (!editor) return
    if (listening) {
      recognitionRef.current?.stop?.()
      setListening(false)
      return
    }

    setError(null)

    const rec = new SR()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = "en-US"
    rec.onresult = (e: any) => {
      let finalText = ""
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i]
        if (result?.isFinal) finalText += result[0]?.transcript ?? ""
      }
      if (finalText.trim()) insertTranscript(finalText)
    }
    rec.onerror = () => setListening(false)
    rec.onend = () => setListening(false)
    rec.start()
    recognitionRef.current = rec
    setListening(true)
  }

  function handleOpenLinkedItem(link: LinkedNoteItem) {
    onOpenLinkedItem?.(link)
  }

  function flushActiveTab(currentTabs: NoteTab[]): NoteTab[] {
    if (!editor) return currentTabs
    const html = editor.getHTML()
    return currentTabs.map(t => t.id === activeTabId ? { ...t, content: html } : t)
  }

  function switchTab(id: string) {
    if (id === activeTabId) return
    setTabs(prev => {
      const flushed = flushActiveTab(prev)
      // Save immediately when navigating away from a tab
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
      void doSave(flushed)
      return flushed
    })
    setActiveTabId(id)
  }

  function addTab() {
    const flushed = flushActiveTab(tabsRef.current)
    const newTab: NoteTab = { id: crypto.randomUUID(), label: "", content: "" }
    const next = [...flushed, newTab]
    setTabs(next)
    setActiveTabId(newTab.id)
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    void doSave(next)
    // Drop straight into rename with empty value — saves as "Tab N" if left blank
    setRenamingId(newTab.id)
    setRenameVal("")
    setTimeout(() => renameInputRef.current?.focus(), 0)
  }

  function removeTab(id: string) {
    if (tabs.length === 1) return
    const flushed = flushActiveTab(tabsRef.current)
    const next = flushed.filter(t => t.id !== id)
    setTabs(next)
    if (activeTabId === id) setActiveTabId(next[next.length - 1].id)
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    void doSave(next)
  }

  function startRename(tab: NoteTab) {
    setRenamingId(tab.id)
    setRenameVal(tab.label)
    setTimeout(() => renameInputRef.current?.select(), 0)
  }

  function commitRename() {
    if (renamingId) {
      const val = renameVal.trim()
      const fallback = `Tab ${tabs.findIndex(t => t.id === renamingId) + 1}`
      const next = tabs.map(t => t.id === renamingId ? { ...t, label: val || fallback } : t)
      setTabs(next)
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
      void doSave(flushActiveTab(next))
    }
    setRenamingId(null)
  }

  async function doSave(flushedTabs: NoteTab[]) {
    setSaving(true); setError(null)
    const content  = flushedTabs[0]?.content ?? ""
    const table    = NOTE_TABLE[type]
    const useTitle = titleRef.current.trim() || "Untitled"

    if (!savedItemIdRef.current) {
      // First save — create the note
      const { data, error } = await supabase
        .from(table)
        .insert({ user_id: user.id, title: useTitle, content, tabs: flushedTabs, collection: collectionRef.current })
        .select().single()
      setSaving(false)
      if (error) { setError(error.message); return }
      savedItemIdRef.current = data.id
      setDirty(false)
      onSave(data)
    } else {
      const { data, error } = await supabase
        .from(table)
        .update({ title: useTitle, content, tabs: flushedTabs, collection: collectionRef.current })
        .eq("id", savedItemIdRef.current)
        .select().single()
      setSaving(false)
      if (error) { setError(error.message); return }
      setDirty(false)
      onSave(data)
    }
  }

  function scheduleAutosave() {
    setDirty(true)
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    autosaveTimer.current = setTimeout(() => {
      const flushed = flushActiveTab(tabsRef.current)
      setTabs(flushed)
      void doSave(flushed)
    }, 1500)
  }

  async function handleSave() {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    const flushed = flushActiveTab(tabsRef.current)
    setTabs(flushed)
    await doSave(flushed)
  }

  async function handleDelete() {
    if (!item) return
    if (!confirm(`Delete "${item.title}"?`)) return
    setDeleting(true)
    const { error } = await supabase.from(NOTE_TABLE[type]).delete().eq("id", item.id)
    setDeleting(false)
    if (error) { setError(error.message); return }
    onDelete(item.id)
  }

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", background: CONTENT_BG, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ borderBottom: `1px solid ${CONTENT_BDR}`, padding: "14px 24px", flexShrink: 0, background: CARD_BG, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={onBack}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: MUTED, fontSize: 13, fontWeight: 600, fontFamily: FONT, padding: 0 }}>
            <svg viewBox="0 0 640 640" width={14} height={14} fill="currentColor"><path d="M416 64L192 320L416 576L480 512L320 320L480 128Z"/></svg>
            {label}s
          </button>
          <span style={{ color: CONTENT_BDR, fontSize: 16 }}>/</span>
          {!isNew && item && (
            <button onClick={() => setLinkOpen(true)}
              style={{ padding: "7px 14px", borderRadius: 7, border: `1px solid ${CONTENT_BDR}`, background: "transparent", color: TEXT, fontSize: 13, fontWeight: 700, fontFamily: FONT, cursor: "pointer" }}>
              Link Item
            </button>
          )}
          {!isNew && item && (
            <button onClick={handleDelete} disabled={deleting}
              style={{ padding: "7px 14px", borderRadius: 7, border: `1px solid ${RED}`, background: "transparent", color: RED, fontSize: 13, fontWeight: 700, fontFamily: FONT, cursor: "pointer", opacity: deleting ? 0.6 : 1 }}>
              {deleting ? "Deleting…" : "Delete"}
            </button>
          )}
          {speechSupported && (
            <button onClick={toggleListening} title={listening ? "Stop" : "Voice input"}
              style={{
                flexShrink: 0,
                width: 40,
                height: 36,
                borderRadius: 10,
                background: listening ? "#fef2f2" : "transparent",
                border: `1.5px solid ${listening ? "#ef4444" : CONTENT_BDR}`,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: listening ? "#ef4444" : MUTED,
                animation: listening ? "ai-mic-pulse 1.2s ease-in-out infinite" : "none",
              }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width={22} height={22} fill="currentColor">
                <path d="M320 64C267 64 224 107 224 160L224 288C224 341 267 384 320 384C373 384 416 341 416 288L416 160C416 107 373 64 320 64zM176 248C176 234.7 165.3 224 152 224C138.7 224 128 234.7 128 248L128 288C128 385.9 201.3 466.7 296 478.5L296 528L248 528C234.7 528 224 538.7 224 552C224 565.3 234.7 576 248 576L392 576C405.3 576 416 565.3 416 552C416 538.7 405.3 528 392 528L344 528L344 478.5C438.7 466.7 512 385.9 512 288L512 248C512 234.7 501.3 224 488 224C474.7 224 464 234.7 464 248L464 288C464 367.5 399.5 432 320 432C240.5 432 176 367.5 176 288L176 248z"/>
              </svg>
            </button>
          )}
          <button onClick={() => void handleSave()} disabled={saving}
            style={{
              padding: "7px 14px", borderRadius: 7, border: "none",
              background: saving ? TEAL : dirty ? "#e67e00" : TEAL,
              color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: FONT,
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
              animation: dirty && !saving ? "save-pulse 1.2s ease-in-out infinite" : "none",
              transition: "background 0.2s",
            }}>
            {saving ? "Saving…" : dirty ? "Unsaved" : "Saved"}
          </button>
          {error && <span style={{ fontSize: 13, color: RED, fontFamily: FONT }}>{error}</span>}
        </div>
        <input value={title} onChange={e => { setTitle(e.target.value); scheduleAutosave() }} placeholder={`${label} title…`}
          onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); void handleSave() } }}
          style={{ width: "100%", boxSizing: "border-box", padding: "8px 0", border: "none", borderBottom: `2px solid ${CONTENT_BDR}`, background: "transparent", fontSize: 22, fontWeight: 800, color: TEXT, fontFamily: FONT, outline: "none" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <CollectionPicker collections={collections} value={collection} onChange={v => { setCollection(v); scheduleAutosave() }} onCreateNew={onCollectionCreated} />
          {!isNew && item && (
            <div style={{ display: "flex", gap: 16, fontSize: 12, color: DIM, fontFamily: FONT }}>
              <span>Created {formatDate(item.created_at)}</span>
              <span>Updated {timeAgo(item.updated_at)}</span>
            </div>
          )}
        </div>
      </div>

      {!isNew && item && (
        <div style={{ padding: "0 24px 14px", borderBottom: `1px solid ${CONTENT_BDR}`, background: CARD_BG, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: MUTED, fontFamily: FONT, letterSpacing: 0.2, textTransform: "uppercase" }}>
            Linked Items
          </div>

          {linksLoading && <div style={{ fontSize: 13, color: DIM, fontFamily: FONT }}>Loading links…</div>}
          {!linksLoading && linkedItems.length === 0 && <div style={{ fontSize: 13, color: DIM, fontFamily: FONT }}>No links yet.</div>}

          {!linksLoading && linkedItems.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {linkedItems.map(link => {
                const unlinkKey = `${link.type}:${link.id}`
                return (
                  <div key={unlinkKey} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 999, border: `1px solid ${CONTENT_BDR}`, background: "#fff", maxWidth: "100%" }}>
                    <button
                      type="button"
                      onClick={() => handleOpenLinkedItem(link)}
                      title={`Open ${link.title || "Untitled"}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        minWidth: 0,
                        maxWidth: 220,
                        border: "none",
                        background: "transparent",
                        padding: 0,
                        color: TEXT,
                        cursor: "pointer",
                        fontFamily: FONT,
                      }}>
                      <div style={{ color: TEAL, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {renderLinkTypeIcon(link.type)}
                      </div>
                      <div style={{ minWidth: 0, maxWidth: 220, fontSize: 13, fontWeight: 700, color: TEXT, fontFamily: FONT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {link.title || "Untitled"}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleUnlink(link) }}
                      disabled={unlinkingId === unlinkKey}
                      title="Unlink item"
                      style={{
                        width: 22,
                        height: 22,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 999,
                        border: "none",
                        background: "transparent",
                        color: RED,
                        cursor: unlinkingId === unlinkKey ? "not-allowed" : "pointer",
                        opacity: unlinkingId === unlinkKey ? 0.6 : 1,
                        flexShrink: 0,
                        padding: 0,
                      }}>
                      {unlinkingId === unlinkKey ? "…" : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width={14} height={14} fill="currentColor">
                          <path d="M73 39.1C63.6 29.7 48.4 29.7 39.1 39.1C29.8 48.5 29.7 63.7 39 73.1L567 601.1C576.4 610.5 591.6 610.5 600.9 601.1C610.2 591.7 610.3 576.5 600.9 567.2L478.9 445.2C483.1 441.8 487.2 438.1 491 434.3L562.1 363.2C591.4 333.9 607.9 294.1 607.9 252.6C607.9 166.2 537.9 96.1 451.4 96.1C414.1 96.1 378.3 109.4 350.1 133.3C370.4 143.4 388.8 156.8 404.6 172.8C418.7 164.5 434.8 160.1 451.4 160.1C502.5 160.1 543.9 201.5 543.9 252.6C543.9 277.1 534.2 300.6 516.8 318L445.7 389.1C441.8 393 437.6 396.5 433.1 399.6L385.6 352.1C402.1 351.2 415.3 337.7 415.8 321C415.8 319.7 415.8 318.4 415.8 317.1C415.8 230.8 345.9 160.2 259.3 160.2C240.1 160.2 221.4 163.7 203.8 170.4L73 39.1zM257.9 224C258.5 224 259 224 259.6 224C274.7 224 289.1 227.7 301.7 234.2C303.5 235.4 305.3 236.5 307.2 237.3C334 253.6 352 283.2 352 316.9C352 317.3 352 317.7 352 318.1L257.9 224zM378.2 480L224 325.8C225.2 410.4 293.6 478.7 378.1 479.9zM171.7 273.5L126.4 228.2L77.8 276.8C48.5 306.1 32 345.9 32 387.4C32 473.8 102 543.9 188.5 543.9C225.7 543.9 261.6 530.6 289.8 506.7C269.5 496.6 251 483.2 235.2 467.2C221.2 475.4 205.1 479.8 188.5 479.8C137.4 479.8 96 438.4 96 387.3C96 362.8 105.7 339.3 123.1 321.9L171.7 273.3z"/>
                        </svg>
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab bar */}
      <div style={{
        display: "flex", alignItems: "stretch", gap: 4,
        borderBottom: `1px solid ${CONTENT_BDR}`, background: CONTENT_BG,
        flexShrink: 0, overflowX: "auto", overflowY: "hidden", padding: "0 24px",
      }}>
        {tabs.map(tab => {
          const isActive = tab.id === activeTabId
          const isRenaming = renamingId === tab.id
          return (
            <div key={tab.id}
              onClick={() => isActive ? startRename(tab) : switchTab(tab.id)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "0 16px", height: 44, cursor: "pointer",
                background: isActive ? CARD_BG : "#dde3ea",
                border: `1px solid ${CONTENT_BDR}`,
                borderBottom: isActive ? `1px solid ${CARD_BG}` : `1px solid ${CONTENT_BDR}`,
                borderRadius: "8px 8px 0 0",
                marginBottom: -1,
                color: isActive ? TEAL : MUTED,
                fontFamily: FONT, fontSize: 14, fontWeight: isActive ? 700 : 500,
                flexShrink: 0, userSelect: "none",
                transition: "color 0.1s, background 0.1s",
              }}
            >
              {isRenaming ? (
                <input
                  ref={renameInputRef}
                  autoFocus
                  value={renameVal}
                  onChange={e => setRenameVal(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={e => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setRenamingId(null) }}
                  onClick={e => e.stopPropagation()}
                  style={{
                    width: Math.max(80, renameVal.length * 9),
                    border: "none", borderBottom: `2px solid ${TEAL}`,
                    background: "transparent", outline: "none",
                    fontFamily: FONT, fontSize: 14, fontWeight: 700, color: TEAL,
                    padding: "2px 2px",
                  }}
                />
              ) : (
                <span title={isActive ? "Click to rename" : undefined}>{tab.label}</span>
              )}
              {tabs.length > 1 && !isRenaming && (
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); removeTab(tab.id) }}
                  title="Remove tab"
                  style={{
                    width: 20, height: 20, borderRadius: "50%", border: "none",
                    background: isActive ? `${TEAL}18` : "transparent",
                    cursor: "pointer", padding: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: isActive ? TEAL : DIM,
                    fontSize: 16, lineHeight: 1,
                    flexShrink: 0,
                  }}
                >×</button>
              )}
            </div>
          )
        })}
        <button
          type="button"
          onClick={addTab}
          title="New tab"
          style={{
            flexShrink: 0, width: 40, height: 40, border: "none",
            background: "transparent", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: MUTED, padding: 0, marginBottom: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.color = TEAL }}
          onMouseLeave={e => { e.currentTarget.style.color = MUTED }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width={24} height={24} fill="currentColor">
            <path d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM296 408L296 344L232 344C218.7 344 208 333.3 208 320C208 306.7 218.7 296 232 296L296 296L296 232C296 218.7 306.7 208 320 208C333.3 208 344 218.7 344 232L344 296L408 296C421.3 296 432 306.7 432 320C432 333.3 421.3 344 408 344L344 344L344 408C344 421.3 333.3 432 320 432C306.7 432 296 421.3 296 408z"/>
          </svg>
        </button>
      </div>

      {/* Toolbar directly above content */}
      <Toolbar editor={editor} />

      {/* Content */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "24px 32px" }}
        onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); handleSave() } }}>
        <style>{`
          @keyframes save-pulse {
            0%   { box-shadow: 0 0 0 0 rgba(230, 126, 0, 0.55); }
            70%  { box-shadow: 0 0 0 7px rgba(230, 126, 0, 0); }
            100% { box-shadow: 0 0 0 0 rgba(230, 126, 0, 0); }
          }
          @keyframes ai-mic-pulse {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.28); }
            70% { transform: scale(1.04); box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
          }
          .tiptap h1 { font-size: 1.8em; font-weight: 800; margin: 0 0 16px; color: ${TEXT}; }
          .tiptap h2 { font-size: 1.4em; font-weight: 700; margin: 24px 0 12px; color: ${TEXT}; }
          .tiptap h3 { font-size: 1.1em; font-weight: 700; margin: 20px 0 10px; color: ${TEXT}; }
          .tiptap p  { margin: 0 0 12px; }
          .tiptap ul, .tiptap ol { padding-left: 24px; margin: 0 0 12px; }
          .tiptap li { margin-bottom: 4px; }
          .tiptap blockquote { border-left: 3px solid ${TEAL}; padding-left: 16px; color: ${MUTED}; margin: 0 0 12px; }
          .tiptap code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; font-family: monospace; }
          .tiptap pre  { background: #1e293b; color: #e2e8f0; padding: 16px; border-radius: 8px; overflow-x: auto; margin: 0 0 12px; }
          .tiptap pre code { background: none; padding: 0; color: inherit; }
        `}</style>
        <EditorContent editor={editor} className="tiptap" />
      </div>

      {!isNew && item && (
        <LinkPicker
          open={linkOpen}
          onClose={() => setLinkOpen(false)}
          sourceId={item.id}
          sourceType={NOTE_LINK_TYPE[type]}
          collections={collections.map(col => ({ id: col.id, name: col.name }))}
          loadItems={loadLinkableItems}
          createLink={handleCreateLink}
          renderTypeIcon={renderLinkTypeIcon}
          typeLabels={{ notes: "Notes", snippets: "Snippets" }}
        />
      )}
    </div>
  )
}

// ── Main HolsterNotes ─────────────────────────────────────────────────────────

type View = { mode: "grid" } | { mode: "editor"; id: string | null }

export default function HolsterNotes({ user, type, collections, onCollectionCreated, onOpenLinkedItem }: {
  user: User
  type: NoteType
  collections: HolsterCollection[]
  onCollectionCreated: (col: HolsterCollection) => void
  onOpenLinkedItem?: (item: LinkedNoteItem) => void
}) {
  const [items, setItems]     = useState<HolsterNote[]>([])
  const [view, setView]       = useState<View>({ mode: "grid" })
  const [loading, setLoading] = useState(true)
  const [linkCounts, setLinkCounts] = useState<LinkCountMap>({})
  const [collectionFilter, setCollectionFilter] = useState<string | "all">("all")

  const filteredItems =
    collectionFilter === "all"
      ? items
      : items.filter(i => i.collection === collectionFilter)

  const table = NOTE_TABLE[type]
  const label = type === "note" ? "Note" : "Snippet"

  const editingItem = view.mode === "editor" && view.id ? items.find(i => i.id === view.id) ?? null : null
  const isNew       = view.mode === "editor" && view.id === null

  async function loadLinkCounts(itemIds: string[]) {
    if (!itemIds.length) {
      setLinkCounts({})
      return
    }

    const { data, error } = await supabase
      .from("holster_item_links")
      .select("source_id, target_type")
      .eq("user_id", user.id)
      .in("source_id", itemIds)

    if (error) {
      console.error(error)
      return
    }

    const counts: LinkCountMap = {}
    for (const row of data ?? []) {
      const sourceId = row.source_id as string
      const targetType = row.target_type as LinkItemType
      if (!counts[sourceId]) counts[sourceId] = {}
      counts[sourceId][targetType] = (counts[sourceId][targetType] ?? 0) + 1
    }

    setLinkCounts(counts)
  }

  useEffect(() => {
    setLoading(true); setView({ mode: "grid" })
    supabase.from(table).select("id, title, content, tabs, collection, created_at, updated_at")
      .eq("user_id", user.id).order("updated_at", { ascending: false })
      .then(({ data }) => { if (data) setItems(data); setLoading(false) })
  }, [type])

  useEffect(() => {
    void loadLinkCounts(items.map(item => item.id))
  }, [items, user.id])

  function handleSave(saved: HolsterNote) {
    setItems(prev => prev.find(i => i.id === saved.id) ? prev.map(i => i.id === saved.id ? saved : i) : [saved, ...prev])
    setView({ mode: "editor", id: saved.id })
  }

  function handleDelete(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
    setView({ mode: "grid" })
  }

  function handleOpenLinkedItem(linked: LinkedNoteItem) {
    if (onOpenLinkedItem) {
      onOpenLinkedItem(linked)
      return
    }

    if (linked.type === "notes" || linked.type === "snippets") {
      setView({ mode: "editor", id: linked.id })
    }
  }

  if (view.mode === "editor") {
    return (
      <NoteEditor item={editingItem} isNew={isNew} type={type} user={user} collections={collections}
        onSave={handleSave} onDelete={handleDelete}
        onBack={() => setView({ mode: "grid" })}
        onCollectionCreated={onCollectionCreated}
        onOpenLinkedItem={handleOpenLinkedItem} />
    )
  }

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", background: CONTENT_BG, overflow: "hidden" }}>
      <div style={{ height: 58, borderBottom: `1px solid ${CONTENT_BDR}`, display: "flex", alignItems: "center", gap: 12, padding: "0 24px", flexShrink: 0, background: CARD_BG }}>
        <button onClick={() => setView({ mode: "editor", id: null })}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 7, border: "none", background: TEAL, color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: FONT, cursor: "pointer" }}>
          <svg viewBox="0 0 640 640" width={11} height={11} fill="currentColor">
            <path d="M320 64C306.7 64 296 74.7 296 88L296 296L88 296C74.7 296 64 306.7 64 320C64 333.3 74.7 344 88 344L296 344L296 552C296 565.3 306.7 576 320 576C333.3 576 344 565.3 344 552L344 344L552 344C565.3 344 576 333.3 576 320C576 306.7 565.3 296 552 296L344 296L344 88C344 74.7 333.3 64 320 64z"/>
          </svg>
          New {label}
        </button>

        {/* COLLECTION FILTER */}
        <select
          value={collectionFilter}
          onChange={e => setCollectionFilter(e.target.value || "all")}
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
          <option value="all">All Collections</option>
          <option value="">No Collection</option>
          {collections.map(c => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <span style={{ fontSize: 13, color: DIM, fontFamily: FONT }}>
          {filteredItems.length} {label}{filteredItems.length === 1 ? "" : "s"}
        </span>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 24 }}>
        {loading && <div style={{ color: DIM, fontSize: 14, fontFamily: FONT }}>Loading…</div>}
        {!loading && items.length === 0 && <div style={{ color: DIM, fontSize: 14, fontFamily: FONT }}>No {label.toLowerCase()}s yet.</div>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
          {filteredItems.map(item => {
            const col      = item.collection ? collections.find(c => c.id === item.collection) : null
            const colColor = col?.color ?? TEAL
            return (
              <button key={item.id} onClick={() => setView({ mode: "editor", id: item.id })}
                style={{ padding: "18px 20px", border: `1px solid ${CONTENT_BDR}`, background: CARD_BG, textAlign: "left", cursor: "pointer", display: "flex", flexDirection: "column", gap: 8 }}
              >
                {/* Title row + color dot */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1, fontSize: 14, fontWeight: 700, color: TEXT, fontFamily: FONT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.title || "Untitled"}
                  </div>
                  {col && <div style={{ width: 14, height: 14, borderRadius: "50%", background: colColor, flexShrink: 0 }} />}
                </div>
                <div style={{ fontSize: 13, color: MUTED, fontFamily: FONT, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {item.content.replace(/<[^>]+>/g, " ").trim() || "No content"}
                </div>
                {(() => {
                  const counts = linkCounts[item.id] || {}
                  const activeTypes = (Object.keys(counts) as LinkItemType[]).filter(type => (counts[type] ?? 0) > 0)
                  if (!activeTypes.length) return null

                  return (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 2, color: MUTED }}>
                      {activeTypes.map(linkType => (
                        <span key={linkType} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, fontFamily: FONT }}>
                          {renderLinkTypeIcon(linkType)}
                          <span>{counts[linkType]}</span>
                        </span>
                      ))}
                    </div>
                  )
                })()}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontSize: 11, color: DIM, fontFamily: FONT }}>Updated {timeAgo(item.updated_at)}</span>
                    <span style={{ fontSize: 11, color: DIM, fontFamily: FONT }}>Created {formatDate(item.created_at)}</span>
                  </div>
                  {col && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: colColor, background: `${colColor}18`, padding: "3px 8px", borderRadius: 999, fontFamily: FONT }}>
                      {col.name}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
