import { useState, useCallback } from "react"
import { useEditor, EditorContent, Node, mergeAttributes } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import type { CodexEntry, Codex } from "./codexTypes"
import type { CodexTheme } from "./codexTheme"
import { CODEXF, CODEXM, CODEXS } from "./codexTheme"

// ─── Section ID Tiptap node ───────────────────────────────────────────────────

const SectionIdNode = Node.create({
  name: "sectionId",
  group: "inline",
  inline: true,
  atom: true,
  addAttributes() {
    return {
      id:    { default: null },
      label: { default: "" },
    }
  },
  parseHTML() {
    return [{ tag: "span[data-section-id]" }]
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes({ id: HTMLAttributes.id, "data-section-id": true, contenteditable: "false" }, HTMLAttributes), `[${HTMLAttributes.label}]`]
  },
})

const SectionCard = Node.create({
  name: "sectionCard",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      anchorId:  { default: null },
      label:     { default: "" },
      text:      { default: "" },
      citation:  { default: "" },
    }
  },
  parseHTML() {
    return [{ tag: "div[data-section-card]" }]
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes({ "data-section-card": true, class: "codex-section-row" }, HTMLAttributes),
      [
        "span", { class: "codex-section-badge" }, `[${HTMLAttributes.label}]`
      ],
      [
        "div", { class: "codex-section-body" },
        ["div", { class: "codex-section-text" }, HTMLAttributes.text],
        ["div", { class: "codex-section-cite" }, HTMLAttributes.citation],
      ],
      [
        "button", { class: "codex-copy-btn", "data-citation": HTMLAttributes.citation, type: "button" }, "[[embed]]"
      ],
    ]
  },
})

// ─── Toolbar helpers ──────────────────────────────────────────────────────────

function TB({ onClick, active, title, children }: { onClick: () => void; active?: boolean; title: string; children: React.ReactNode }) {
  const [hov, setHov] = useState(false)
  return (
    <button type="button" title={title} onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ padding: "6px 8px", border: "none", background: active ? "rgba(124,106,247,0.18)" : hov ? "rgba(255,255,255,0.07)" : "transparent", color: active ? "#7c6af7" : "#9ca3af", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.1s, color 0.1s", borderRadius: 4 }}>
      {children}
    </button>
  )
}

function TSep() {
  return <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.08)", margin: "0 3px", alignSelf: "center", flexShrink: 0 }} />
}

// ─── Add Section ID modal ─────────────────────────────────────────────────────

function SectionIdModal({ theme, onConfirm, onCancel }: {
  theme: CodexTheme
  onConfirm: (label: string) => void
  onCancel: () => void
}) {
  const [label, setLabel] = useState("")
  return (
    <>
      <div onClick={onCancel} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 201, width: 380, background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 24, boxShadow: "0 16px 48px rgba(0,0,0,0.5)" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, fontFamily: CODEXF, marginBottom: 6 }}>Add Section ID</div>
        <div style={{ fontSize: 12, color: theme.muted, fontFamily: CODEXF, marginBottom: 16, lineHeight: 1.6 }}>
          The highlighted text will be saved as a citable section. Enter any identifier — <span style={{ fontFamily: CODEXM, color: theme.accent }}>16</span>, <span style={{ fontFamily: CODEXM, color: theme.accent }}>1a.1</span>, <span style={{ fontFamily: CODEXM, color: theme.accent }}>LM.2b.3</span>, <span style={{ fontFamily: CODEXM, color: theme.accent }}>655 F. 3d 1013</span>
        </div>
        <input value={label} onChange={e => setLabel(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && label.trim()) onConfirm(label.trim()); if (e.key === "Escape") onCancel() }}
          placeholder="Section identifier…" autoFocus
          style={{ width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${theme.border}`, outline: "none", padding: "8px 0", fontSize: 20, fontWeight: 700, color: theme.accent, fontFamily: CODEXM, letterSpacing: "0.04em", boxSizing: "border-box", marginBottom: 20 }} />
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{ padding: "7px 16px", borderRadius: 6, border: `1px solid ${theme.border}`, background: "transparent", color: theme.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: CODEXF }}>Cancel</button>
          <button onClick={() => label.trim() && onConfirm(label.trim())} disabled={!label.trim()}
            style={{ padding: "7px 18px", borderRadius: 6, border: "none", background: label.trim() ? theme.accent : theme.border, color: label.trim() ? "#fff" : theme.dim, fontSize: 13, fontWeight: 700, cursor: label.trim() ? "pointer" : "default", fontFamily: CODEXF }}>
            Save Section
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Edit/delete badge popover ────────────────────────────────────────────────

function BadgePopover({ nodeId, currentLabel, x, y, theme, onSave, onDelete, onClose }: {
  nodeId: string
  currentLabel: string
  x: number
  y: number
  theme: CodexTheme
  onSave: (nodeId: string, newLabel: string) => void
  onDelete: (nodeId: string) => void
  onClose: () => void
}) {
  const [label, setLabel] = useState(currentLabel)
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200 }} />
      <div style={{ position: "fixed", left: x, top: y + 8, zIndex: 201, background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 8, padding: 14, boxShadow: "0 8px 32px rgba(0,0,0,0.4)", minWidth: 240 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: theme.muted, fontFamily: CODEXM, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Section ID</div>
        <input value={label} onChange={e => setLabel(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && label.trim()) onSave(nodeId, label.trim()); if (e.key === "Escape") onClose() }}
          autoFocus
          style={{ width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${theme.border}`, outline: "none", padding: "4px 0", fontSize: 16, fontWeight: 700, color: theme.accent, fontFamily: CODEXM, letterSpacing: "0.04em", boxSizing: "border-box", marginBottom: 12 }} />
        <div style={{ display: "flex", gap: 6, justifyContent: "space-between" }}>
          <button onClick={() => onDelete(nodeId)}
            style={{ padding: "5px 12px", borderRadius: 5, border: `1px solid ${theme.red}44`, background: theme.redDim, color: theme.red, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: CODEXF }}>
            Delete
          </button>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={onClose} style={{ padding: "5px 12px", borderRadius: 5, border: `1px solid ${theme.border}`, background: "transparent", color: theme.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: CODEXF }}>Cancel</button>
            <button onClick={() => label.trim() && onSave(nodeId, label.trim())} disabled={!label.trim()}
              style={{ padding: "5px 12px", borderRadius: 5, border: "none", background: label.trim() ? theme.accent : theme.border, color: label.trim() ? "#fff" : theme.dim, fontSize: 12, fontWeight: 700, cursor: label.trim() ? "pointer" : "default", fontFamily: CODEXF }}>
              Save
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Section ID button ────────────────────────────────────────────────────────

function SectionIdButton({ onClick, hasSelection, theme }: {
  onClick: () => void
  hasSelection: boolean
  theme: CodexTheme
}) {
  const [hov, setHov] = useState(false)
  return (
    <button type="button" onClick={onClick} disabled={!hasSelection}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      title={hasSelection ? "Save highlighted text as a citable section" : "Highlight text first to add a Section ID"}
      style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 6, border: `1px solid ${hasSelection ? theme.accent : theme.border}`, background: hasSelection ? (hov ? theme.accentHov : theme.accent) : "transparent", color: hasSelection ? "#fff" : theme.muted, fontSize: 12, fontWeight: 700, cursor: hasSelection ? "pointer" : "not-allowed", fontFamily: CODEXF, opacity: hasSelection ? 1 : 0.5, transition: "all 0.12s", flexShrink: 0 }}>
      <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 9h16M4 15h16M10 3L8 21M16 3l-2 18"/>
      </svg>
      Section ID
    </button>
  )
}

// ─── Main editor ──────────────────────────────────────────────────────────────

export function CodexEditor({ entry, parentEntry, codex, supabase, onSaved, onAnchorCreated, theme, darkMode }: {
  entry: CodexEntry
  parentEntry: CodexEntry | null
  codex: Codex
  supabase: any
  onSaved: (saved: CodexEntry) => void
  onAnchorCreated: (anchor: CodexEntry) => void
  theme: CodexTheme
  darkMode: boolean
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [pendingSelection, setPendingSelection] = useState<{ from: number; to: number; text: string } | null>(null)
  const [hasSelection, setHasSelection] = useState(false)
  const [popover, setPopover] = useState<{ nodeId: string; label: string; x: number; y: number } | null>(null)
  const [cardPopover, setCardPopover] = useState<{ anchorId: string; text: string; pos: number; x: number; y: number } | null>(null)

  const canvasBg = darkMode ? "#0f0f1a" : "#fff"
  const canvasBorder = darkMode ? "#1e1e35" : "#ccc9bc"

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Write the content of this section…" }),
      SectionIdNode,
      SectionCard,
    ],
    content: entry.content ?? "",
    onSelectionUpdate({ editor }) {
      const { from, to } = editor.state.selection
      setHasSelection(from !== to)
    },
  }, [entry.id])

  // Handle clicks on badge spans and section cards in the rendered editor HTML
  function handleEditorClick(e: React.MouseEvent) {
    const target = e.target as HTMLElement

    // Click on section card
    const card = target.closest("div[data-section-card]") as HTMLElement | null
    if (card) {
      e.preventDefault()
      e.stopPropagation()
      const anchorId = card.getAttribute("anchorid") ?? ""
      const text = card.getAttribute("text") ?? ""
      const rect = card.getBoundingClientRect()
      // Find pos of this node in the editor
      let cardPos = -1
      editor?.state.doc.descendants((node, pos) => {
        if (node.type.name === "sectionCard" && node.attrs.anchorId === anchorId) {
          cardPos = pos
          return false
        }
      })
      if (cardPos >= 0) setCardPopover({ anchorId, text, pos: cardPos, x: rect.left, y: rect.top })
      return
    }

    const badge = target.closest("span[data-section-id]") as HTMLElement | null
    if (!badge) return
    e.preventDefault()
    e.stopPropagation()
    const nodeId = badge.getAttribute("id") ?? ""
    const label = badge.textContent?.replace(/^\[|\]$/g, "") ?? ""
    const rect = badge.getBoundingClientRect()
    setPopover({ nodeId, label, x: rect.left, y: rect.bottom })
  }

  function handleSectionIdClick() {
    if (!editor) return
    const { from, to } = editor.state.selection
    if (from === to) return
    const text = editor.state.doc.textBetween(from, to, " ")
    setPendingSelection({ from, to, text })
    setModalOpen(true)
  }

  const handleModalConfirm = useCallback(async (label: string) => {
    if (!editor || !pendingSelection) return
    setModalOpen(false)

    const { from, to } = pendingSelection
    // Get HTML of the selected range preserving inline formatting
    const slice = editor.state.doc.slice(from, to)
    const { DOMSerializer } = await import("prosemirror-model")
    const serializer = DOMSerializer.fromSchema(editor.schema)
    const container = document.createElement("div")
    container.appendChild(serializer.serializeFragment(slice.content))
    const text = container.innerHTML

    const siblings = await supabase
      .from("codex_entries")
      .select("sort_order")
      .eq("parent_id", entry.id)
      .order("sort_order", { ascending: false })
      .limit(1)

    const sort_order = (siblings.data?.[0]?.sort_order ?? -1) + 1

    const { data, error: e } = await supabase
      .from("codex_entries")
      .insert({
        codex_id: codex.id,
        parent_id: entry.id,
        node_type: "anchor",
        reference_code: label,
        title: label,
        content: text,
        sort_order,
      })
      .select()
      .single()

    if (e) { setError(e.message); return }

    const citation = [codex.short_code, parentEntry?.display_label, entry.display_label, label].filter(Boolean).join('.')

    editor.chain()
      .focus()
      .deleteRange({ from, to })
      .insertContentAt(from, {
        type: "sectionCard",
        attrs: { anchorId: data.id, label, text, citation },
      })
      .run()

    onAnchorCreated(data)
    setPendingSelection(null)
  }, [editor, pendingSelection, codex, entry, supabase, onAnchorCreated])

  async function handleBadgeSave(nodeId: string, newLabel: string) {
    setPopover(null)

    // Update the DB row
    await supabase
      .from("codex_entries")
      .update({ reference_code: newLabel, title: newLabel, updated_at: new Date().toISOString() })
      .eq("id", nodeId)

    // Update the badge label in the document
    if (!editor) return
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "sectionId" && node.attrs.id === nodeId) {
        const tr = editor.state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, label: newLabel })
        editor.view.dispatch(tr)
        return false
      }
    })
  }

  async function handleBadgeDelete(nodeId: string) {
    setPopover(null)

    // Delete the DB row
    await supabase.from("codex_entries").delete().eq("id", nodeId)

    // Remove the badge from the document
    if (!editor) return
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "sectionId" && node.attrs.id === nodeId) {
        const tr = editor.state.tr.delete(pos, pos + node.nodeSize)
        editor.view.dispatch(tr)
        return false
      }
    })
  }

  async function handleCardRemove(anchorId: string, text: string, _pos: number) {
    setCardPopover(null)
    // Delete from DB
    await supabase.from("codex_entries").delete().eq("id", anchorId)
    // Replace card node with plain paragraph containing the text
    if (!editor) return
    editor.state.doc.descendants((node, nodePos) => {
      if (node.type.name === "sectionCard" && node.attrs.anchorId === anchorId) {
        editor.chain()
          .focus()
          .deleteRange({ from: nodePos, to: nodePos + node.nodeSize })
          .insertContentAt(nodePos, text || "<p></p>")
          .run()
        return false
      }
    })
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    const content = editor?.getHTML() ?? ""
    const { data, error: e } = await supabase
      .from("codex_entries")
      .update({ content, updated_at: new Date().toISOString() })
      .eq("id", entry.id)
      .select()
      .single()
    if (e) { setError(e.message); setSaving(false); return }
    onSaved(data)
    setSaving(false)
  }

  const breadcrumb = parentEntry?.title ?? null

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: theme.bg, fontFamily: CODEXF, overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Geist+Mono:wght@400;500&display=swap');
        .codex-editor .ProseMirror { outline: none; min-height: 400px; font-family: ${CODEXS}; font-size: 17px; line-height: 1.85; color: ${theme.text}; }
        .codex-editor .ProseMirror p.is-editor-empty:first-child::before { content: attr(data-placeholder); color: ${theme.muted}; pointer-events: none; float: left; height: 0; font-style: italic; }
        .codex-editor .ProseMirror h1, .codex-editor .ProseMirror h2, .codex-editor .ProseMirror h3 { font-family: ${CODEXF}; color: ${theme.text}; margin: 1.4em 0 0.4em; line-height: 1.3; }
        .codex-editor .ProseMirror blockquote { border-left: 3px solid ${theme.accent}; padding-left: 18px; margin: 20px 0; color: ${theme.muted}; font-style: italic; }
        .codex-editor .ProseMirror code { background: ${theme.borderLight}; border-radius: 4px; padding: 2px 6px; font-family: ${CODEXM}; font-size: 14px; }
        .codex-editor .ProseMirror a { color: ${theme.accent}; text-decoration: underline; }
        .codex-editor .ProseMirror ul, .codex-editor .ProseMirror ol { padding-left: 24px; }
        .codex-editor .ProseMirror li { margin-bottom: 4px; }
        .codex-editor span[data-section-id] { display: inline-flex; align-items: center; background: ${theme.accentDim}; color: ${theme.accent}; font-family: ${CODEXM}; font-size: 11px; font-weight: 700; padding: 1px 6px; border-radius: 4px; border: 1px solid ${theme.accent}44; cursor: pointer; user-select: none; margin: 0 1px 0 3px; letter-spacing: 0.03em; vertical-align: middle; transition: background 0.1s; }
        .codex-editor span[data-section-id]:hover { background: ${theme.accent}33; border-color: ${theme.accent}88; }
        .codex-editor div[data-section-card] { display: flex; align-items: flex-start; gap: 12px; padding: 12px 14px; background: ${theme.surface}; border: 1px solid ${theme.border}; border-radius: 8px; margin: 8px 0; cursor: default; }
        .codex-editor .codex-section-badge { font-size: 11px; font-family: ${CODEXM}; color: ${theme.accent}; background: ${theme.accentDim}; padding: 2px 7px; border-radius: 4px; flex-shrink: 0; margin-top: 2px; white-space: nowrap; }
        .codex-editor .codex-section-body { flex: 1; min-width: 0; }
        .codex-editor .codex-section-text { font-size: 14px; color: ${theme.text}; line-height: 1.6; }
        .codex-editor .codex-section-cite { font-size: 11px; color: ${theme.muted}; font-family: ${CODEXM}; margin-top: 4px; }
        .codex-editor .codex-copy-btn { padding: 4px 10px; border-radius: 5px; border: 1px solid ${theme.border}; background: transparent; color: ${theme.muted}; font-size: 11px; font-weight: 600; cursor: pointer; font-family: ${CODEXM}; flex-shrink: 0; white-space: nowrap; align-self: flex-start; }
      `}</style>

      {/* Top bar */}
      <div style={{ flexShrink: 0, background: theme.surface, borderBottom: `1px solid ${theme.border}`, display: "flex", alignItems: "center", padding: "0 16px", height: 48, gap: 10 }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, overflow: "hidden", minWidth: 0 }}>
          {breadcrumb && <span style={{ fontSize: 12, color: theme.muted, fontFamily: CODEXF, flexShrink: 0 }}>{breadcrumb} ›</span>}
          <span style={{ fontSize: 13, fontWeight: 600, color: theme.text, fontFamily: CODEXF, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.title ?? "Untitled"}</span>
          {entry.display_label && <span style={{ fontSize: 10, fontFamily: CODEXM, color: theme.accent, background: theme.accentDim, padding: "2px 6px", borderRadius: 4, flexShrink: 0 }}>{entry.display_label}</span>}
        </div>
        <SectionIdButton onClick={handleSectionIdClick} hasSelection={hasSelection} theme={theme} />
        {error && <div style={{ fontSize: 12, color: theme.red, fontFamily: CODEXF, flexShrink: 0 }}>{error}</div>}
        <button onClick={handleSave} disabled={saving}
          style={{ padding: "6px 18px", borderRadius: 6, border: "none", background: theme.accent, color: "#fff", fontSize: 13, fontWeight: 700, cursor: saving ? "default" : "pointer", fontFamily: CODEXF, opacity: saving ? 0.6 : 1, flexShrink: 0 }}>
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {/* Editor */}
      <div style={{ flex: 1, overflowY: "auto", padding: "32px 48px 64px", boxSizing: "border-box" }}>
        <div style={{ background: canvasBg, border: `1px solid ${canvasBorder}`, borderRadius: 8 }}>
          <div style={{ position: "sticky", top: 0, zIndex: 10, background: canvasBg, borderBottom: `1px solid ${canvasBorder}`, display: "flex", alignItems: "stretch", flexWrap: "wrap", padding: "3px 5px" }}>
            <TB onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive("bold")} title="Bold"><svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h8a4 4 0 010 8H6z"/><path d="M6 12h9a4 4 0 010 8H6z"/></svg></TB>
            <TB onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive("italic")} title="Italic"><svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg></TB>
            <TB onClick={() => editor?.chain().focus().toggleUnderline().run()} active={editor?.isActive("underline")} title="Underline"><svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v7a6 6 0 0012 0V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg></TB>
            <TSep />
            <TB onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} active={editor?.isActive("heading", { level: 1 })} title="H1"><span style={{ fontSize: 10, fontWeight: 800, fontFamily: CODEXF, letterSpacing: "-0.03em" }}>H1</span></TB>
            <TB onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} active={editor?.isActive("heading", { level: 2 })} title="H2"><span style={{ fontSize: 10, fontWeight: 800, fontFamily: CODEXF, letterSpacing: "-0.03em" }}>H2</span></TB>
            <TB onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} active={editor?.isActive("heading", { level: 3 })} title="H3"><span style={{ fontSize: 10, fontWeight: 800, fontFamily: CODEXF, letterSpacing: "-0.03em" }}>H3</span></TB>
            <TSep />
            <TB onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive("bulletList")} title="Bullet list"><svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.2" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1.2" fill="currentColor" stroke="none"/></svg></TB>
            <TB onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive("orderedList")} title="Numbered list"><svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4M4 10h2" strokeWidth={1.8}/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" strokeWidth={1.8}/></svg></TB>
            <TB onClick={() => editor?.chain().focus().toggleBlockquote().run()} active={editor?.isActive("blockquote")} title="Blockquote"><svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor"><path d="M3 3h7v7H6a3 3 0 003 3v2a5 5 0 01-5-5V3zm11 0h7v7h-4a3 3 0 003 3v2a5 5 0 01-5-5V3z" opacity={0.9}/></svg></TB>
            <TSep />
            <TB onClick={() => { const url = window.prompt("URL"); if (url) editor?.chain().focus().setLink({ href: url }).run() }} active={editor?.isActive("link")} title="Link"><svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg></TB>
            <TSep />
            <TB onClick={() => editor?.chain().focus().undo().run()} title="Undo"><svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 00-4-4H4"/></svg></TB>
            <TB onClick={() => editor?.chain().focus().redo().run()} title="Redo"><svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 014-4h12"/></svg></TB>
          </div>
          <div className="codex-editor" style={{ padding: "28px 40px 56px" }} onClick={handleEditorClick}>
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      {modalOpen && (
        <SectionIdModal
          theme={theme}
          onConfirm={handleModalConfirm}
          onCancel={() => { setModalOpen(false); setPendingSelection(null) }}
        />
      )}

      {cardPopover && (
        <>
          <div onClick={() => setCardPopover(null)} style={{ position: "fixed", inset: 0, zIndex: 200 }} />
          <div style={{ position: "fixed", left: cardPopover.x, top: cardPopover.y - 48, zIndex: 201, background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 8, padding: "8px 12px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)", display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: theme.muted, fontFamily: CODEXF }}>Section</span>
            <button onClick={() => handleCardRemove(cardPopover.anchorId, cardPopover.text, cardPopover.pos)}
              style={{ padding: "4px 10px", borderRadius: 5, border: `1px solid ${theme.red}44`, background: theme.redDim, color: theme.red, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: CODEXF }}>
              Remove
            </button>
          </div>
        </>
      )}

      {popover && (
        <BadgePopover
          nodeId={popover.nodeId}
          currentLabel={popover.label}
          x={popover.x}
          y={popover.y}
          theme={theme}
          onSave={handleBadgeSave}
          onDelete={handleBadgeDelete}
          onClose={() => setPopover(null)}
        />
      )}
    </div>
  )
}
