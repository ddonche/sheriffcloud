import { useState, useEffect, useRef } from 'react'
import type { CodexIndexResponse, CodexSummary, CodexEntry } from '../lib/types'
import type { CodexAnnotation } from '../../admin/codex/codexTypes'
import { CODEXF, CODEXS } from '../../admin/codex/codexTheme'

// ─── Types ────────────────────────────────────────────────────────────────────

type Segment =
  | { kind: 'html'; html: string }
  | { kind: 'card'; anchorId: string; label: string; citation: string; text: string }

// ─── Parse content HTML into segments ────────────────────────────────────────
// Splits the serialized entry HTML into alternating html/card segments so we
// can inject React annotation rows after each card without fighting
// dangerouslySetInnerHTML.

function parseSegments(html: string): Segment[] {
  const doc = new DOMParser().parseFromString(html, 'text/html')

  // Clean stray highlights and old badge spans
  doc.querySelectorAll<HTMLElement>('mark[data-anchor-id]').forEach(mark => {
    const parent = mark.parentNode
    if (!parent) return
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark)
    parent.removeChild(mark)
  })
  doc.querySelectorAll<HTMLElement>('span[data-section-id]').forEach(span => span.remove())

  const body = doc.body
  const segments: Segment[] = []
  let htmlBuf = ''

  body.childNodes.forEach(node => {
    if (
      node.nodeType === Node.ELEMENT_NODE &&
      (node as HTMLElement).hasAttribute('data-section-card')
    ) {
      // Flush accumulated HTML first
      if (htmlBuf.trim()) {
        segments.push({ kind: 'html', html: htmlBuf })
        htmlBuf = ''
      }

      const el = node as HTMLElement
      const anchorId = el.getAttribute('anchorid') ?? el.getAttribute('anchorId') ?? ''
      const label    = el.getAttribute('label')    ?? ''
      const citation = el.getAttribute('citation') ?? ''
      // The text attribute contains the section HTML stored escaped
      const raw      = el.getAttribute('text')     ?? ''
      // Restore: if it looks like escaped HTML, decode via a div; otherwise use as-is
      const div = document.createElement('div')
      div.innerHTML = raw
      const text = div.innerHTML || raw

      segments.push({ kind: 'card', anchorId, label, citation, text })
    } else {
      htmlBuf += (node as HTMLElement).outerHTML ?? node.textContent ?? ''
    }
  })

  if (htmlBuf.trim()) segments.push({ kind: 'html', html: htmlBuf })
  return segments
}

// ─── Tree helpers ─────────────────────────────────────────────────────────────

function getChildren(entries: CodexEntry[], parentId: string | null, codexId: string): CodexEntry[] {
  return entries
    .filter(e => e.codex_id === codexId && e.parent_id === parentId && e.node_type === 'node')
    .sort((a, b) => a.sort_order - b.sort_order)
}

function TreeItem({ entry, entries, codexId, depth, selectedId, onSelect }: {
  entry: CodexEntry
  entries: CodexEntry[]
  codexId: string
  depth: number
  selectedId: string | null
  onSelect: (e: CodexEntry) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const children = getChildren(entries, entry.id, codexId)
  const hasChildren = children.length > 0
  const isSelected = selectedId === entry.id

  return (
    <div>
      <button
        type="button"
        className={`codex-tree-item${isSelected ? ' codex-tree-item--active' : ''}`}
        style={{ paddingLeft: 12 + depth * 16 }}
        onClick={() => onSelect(entry)}
      >
        <span
          className="codex-tree-item__chevron"
          style={{
            opacity: hasChildren ? 1 : 0,
            display: 'inline-block',
            transition: 'transform 0.15s',
            transform: expanded && hasChildren ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
          onClick={e => { e.stopPropagation(); setExpanded(v => !v) }}
        >›</span>
        <span className="codex-tree-item__title">{entry.title ?? <em>Untitled</em>}</span>
        {entry.display_label && <span className="codex-tree-item__code">{entry.display_label}</span>}
      </button>
      {expanded && hasChildren && children.map(child => (
        <TreeItem
          key={child.id}
          entry={child}
          entries={entries}
          codexId={codexId}
          depth={depth + 1}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}

// ─── Add annotation form ──────────────────────────────────────────────────────

function AddAnnotationForm({ citation, onSubmit, onCancel }: {
  citation: string
  onSubmit: (text: string) => Promise<void>
  onCancel: () => void
}) {
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { taRef.current?.focus() }, [])

  async function handleSubmit() {
    if (!text.trim()) return
    setSaving(true)
    setError(null)
    try {
      await onSubmit(text.trim())
      setText('')
    } catch (e: any) {
      setError(e.message ?? 'Failed to save annotation.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="codex-annotation-form">
      <textarea
        ref={taRef}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
          if (e.key === 'Escape') onCancel()
        }}
        placeholder={`Annotating ${citation}x…`}
        className="codex-annotation-form__ta"
        rows={3}
      />
      {error && <div className="codex-annotation-form__error">{error}</div>}
      <div className="codex-annotation-form__actions">
        <span className="codex-annotation-form__hint">⌘↵ to save · Esc to cancel</span>
        <button type="button" onClick={onCancel} className="codex-annotation-form__cancel">Cancel</button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving || !text.trim()}
          className="codex-annotation-form__save"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}

// ─── Single annotation row ────────────────────────────────────────────────────

function AnnotationRow({ annotation, citation, currentUserId, onDelete }: {
  annotation: CodexAnnotation & { author_username?: string }
  citation: string
  currentUserId: string | null
  onDelete: (id: string) => void
}) {
  const [confirming, setConfirming] = useState(false)
  const isOwn = currentUserId === annotation.author_id

  return (
    <div className="codex-annotation-row">
      <div className="codex-annotation-row__body">
        <div className="codex-annotation-row__text">{annotation.content}</div>
        <div className="codex-annotation-row__meta">
          <span className="codex-annotation-row__cite">{citation}x</span>
          {annotation.author_username && (
            <span className="codex-annotation-row__author">{annotation.author_username}</span>
          )}
          <span className="codex-annotation-row__date">
            {new Date(annotation.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          {isOwn && !confirming && (
            <button type="button" className="codex-annotation-row__delete" onClick={() => setConfirming(true)}>
              delete
            </button>
          )}
          {isOwn && confirming && (
            <>
              <button type="button" className="codex-annotation-row__delete codex-annotation-row__delete--confirm" onClick={() => onDelete(annotation.id)}>
                confirm delete
              </button>
              <button type="button" className="codex-annotation-row__cancel-delete" onClick={() => setConfirming(false)}>
                cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCardBlock({
  segment,
  annotations,
  currentUserId,
  isLoggedIn,
  onCopyEmbed,
  onAddAnnotation,
  onDeleteAnnotation,
}: {
  segment: Extract<Segment, { kind: 'card' }>
  annotations: (CodexAnnotation & { author_username?: string })[]
  currentUserId: string | null
  isLoggedIn: boolean
  onCopyEmbed: (citation: string, btn: HTMLButtonElement) => void
  onAddAnnotation: (anchorId: string, text: string) => Promise<void>
  onDeleteAnnotation: (id: string) => void
}) {
  const [addingAnnotation, setAddingAnnotation] = useState(false)

  return (
    <div className="codex-card-group">
      {/* The card itself */}
      <div className="codex-section-row">
        <span className="codex-section-badge">[{segment.label}]</span>
        <div className="codex-section-body">
          <div
            className="codex-section-text"
            dangerouslySetInnerHTML={{ __html: segment.text }}
          />
          <div className="codex-section-footer">
            <span className="codex-section-cite">{segment.citation}</span>
            <div className="codex-section-actions">
              <button
                type="button"
                className="codex-copy-btn"
                onClick={e => onCopyEmbed(segment.citation, e.currentTarget)}
              >
                [[embed]]
              </button>
              {isLoggedIn && !addingAnnotation && (
                <button
                  type="button"
                  className="codex-annotate-btn"
                  onClick={() => setAddingAnnotation(true)}
                >
                  + annotate
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Annotation rows */}
      {annotations.map(ann => (
        <AnnotationRow
          key={ann.id}
          annotation={ann}
          citation={segment.citation}
          currentUserId={currentUserId}
          onDelete={id => {
            onDeleteAnnotation(id)
          }}
        />
      ))}

      {/* Add annotation form */}
      {addingAnnotation && (
        <AddAnnotationForm
          citation={segment.citation}
          onSubmit={async text => {
            await onAddAnnotation(segment.anchorId, text)
            setAddingAnnotation(false)
          }}
          onCancel={() => setAddingAnnotation(false)}
        />
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CodexIndex({ data, supabase }: {
  data: CodexIndexResponse
  onNavigate: (path: string) => void
  supabase: any
}) {
  const { codices, entries } = data

  const [selectedEntry, setSelectedEntry] = useState<CodexEntry | null>(null)
  const [annotations, setAnnotations] = useState<Record<string, (CodexAnnotation & { author_email?: string })[]>>({})
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Resolve current user once
  useEffect(() => {
    supabase.auth.getUser().then(({ data }: any) => {
      const uid = data?.user?.id ?? null
      setCurrentUserId(uid)
      setIsLoggedIn(!!uid)
    })
  }, [supabase])

  // Fetch annotations whenever selected entry changes
  useEffect(() => {
    if (!selectedEntry) return

    // Collect all anchor IDs that belong to this entry
    const anchorIds = entries
      .filter(e => e.parent_id === selectedEntry.id && e.node_type === 'anchor')
      .map(e => e.id)

    if (anchorIds.length === 0) return

    supabase
      .from('codex_annotations')
      .select('*')
      .in('node_id', anchorIds)
      .order('created_at', { ascending: true })
      .then(async ({ data: rows, error }: any) => {
        if (error || !rows) return

        const authorIds: string[] = [...new Set<string>(rows.map((r: any) => r.author_id as string))]
        let usernameMap: Record<string, string> = {}

        try {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username')
            .in('id', authorIds)
          if (profiles) {
            profiles.forEach((p: any) => { usernameMap[p.id] = p.username })
          }
        } catch {
          // silent
        }

        const enriched = rows.map((r: any) => ({
          ...r,
          author_username: usernameMap[r.author_id] ?? undefined,
        }))

        // Key by node_id
        const grouped: Record<string, typeof enriched> = {}
        enriched.forEach((r: any) => {
          if (!grouped[r.node_id]) grouped[r.node_id] = []
          grouped[r.node_id].push(r)
        })
        setAnnotations(grouped)
      })
  }, [selectedEntry, entries, supabase])

  // Parse segments once per selected entry
  const segments: Segment[] = selectedEntry?.content
    ? parseSegments(selectedEntry.content)
    : []

  // ── Handlers ──

  function handleCopyEmbed(citation: string, btn: HTMLButtonElement) {
    navigator.clipboard.writeText(`[[${citation}]]`)
    btn.textContent = 'Copied!'
    btn.classList.add('copied')
    setTimeout(() => {
      btn.textContent = '[[embed]]'
      btn.classList.remove('copied')
    }, 1800)
  }

  async function handleAddAnnotation(anchorId: string, text: string) {
    const { data: row, error } = await supabase
      .from('codex_annotations')
      .insert({
        node_id: anchorId,
        author_id: currentUserId,
        content: text,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)

    setAnnotations(prev => {
      const existing = prev[anchorId] ?? []
      return {
        ...prev,
        [anchorId]: [...existing, { ...row, author_email: undefined }],
      }
    })
  }

  function handleDeleteAnnotation(id: string) {
    supabase.from('codex_annotations').delete().eq('id', id).then(({ error }: any) => {
      if (error) return
      setAnnotations(prev => {
        const next = { ...prev }
        for (const nodeId in next) {
          next[nodeId] = next[nodeId].filter(a => a.id !== id)
        }
        return next
      })
    })
  }

  return (
    <div className="codex-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Geist+Mono:wght@400;500&display=swap');

        .codex-page { display: flex; align-items: flex-start; }
        .codex-page__tree { width: 260px; flex-shrink: 0; border-right: 1px solid var(--color-border); min-height: calc(100vh - 140px); padding: 16px 0; }
        .codex-page__reader { flex: 1; min-width: 0; padding: 48px 48px 80px; max-width: 760px; }

        .codex-tree-section { margin-bottom: 8px; }
        .codex-tree-section__header { padding: 10px 12px 6px; display: flex; align-items: center; gap: 8px; }
        .codex-tree-section__name { font-size: 13px; font-weight: 700; color: var(--color-text); }
        .codex-tree-section__code { font-size: 10px; font-family: var(--font-mono); color: var(--color-accent); background: var(--color-accent-dim); padding: 1px 5px; border-radius: 3px; }
        .codex-tree-item { display: flex; align-items: center; gap: 6px; width: 100%; padding-top: 0; padding-bottom: 0; padding-right: 12px; height: 38px; background: none; border: none; border-left: 2px solid transparent; cursor: pointer; text-align: left; color: var(--color-text); font-size: 14px; transition: background 0.1s; font-family: ${CODEXF}; }
        .codex-tree-item:hover { background: var(--color-surface-hover); }
        .codex-tree-item--active { border-left-color: var(--color-accent); background: var(--color-accent-dim); color: var(--color-accent); font-weight: 600; }
        .codex-tree-item__chevron { font-size: 14px; flex-shrink: 0; color: var(--color-muted); line-height: 1; width: 14px; text-align: center; }
        .codex-tree-item__title { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .codex-tree-item__code { font-size: 10px; font-family: var(--font-mono); color: var(--color-accent); background: var(--color-accent-dim); padding: 1px 5px; border-radius: 3px; flex-shrink: 0; }

        .codex-reader__title { font-size: 32px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.2; margin: 0 0 8px; color: var(--color-text); font-family: ${CODEXF}; }
        .codex-reader__code { font-size: 11px; font-family: var(--font-mono); color: var(--color-accent); background: var(--color-accent-dim); padding: 2px 8px; border-radius: 4px; display: inline-block; margin-bottom: 28px; }

        .codex-content { font-size: 17px; line-height: 1.85; color: var(--color-text); font-family: ${CODEXS}; }
        .codex-content p { margin: 0 0 1.2em; }
        .codex-content h1, .codex-content h2, .codex-content h3 { margin: 1.4em 0 0.5em; line-height: 1.3; font-weight: 700; font-family: ${CODEXF}; }
        .codex-content blockquote { border-left: 3px solid var(--color-accent); padding-left: 18px; margin: 20px 0; color: var(--color-muted); font-style: italic; }
        .codex-content code { background: var(--color-surface); border-radius: 4px; padding: 2px 6px; font-family: var(--font-mono); font-size: 14px; }
        .codex-content a { color: var(--color-accent); }
        .codex-content ul, .codex-content ol { padding-left: 24px; margin: 0 0 1.2em; }

        /* ── Card group (card + its annotations) ── */
        .codex-card-group { margin: 8px 0 16px; display: flex; flex-direction: column; gap: 0; }

        /* ── Section card ── */
        .codex-section-row { display: flex; align-items: flex-start; gap: 12px; padding: 12px 14px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 8px; }
        .codex-card-group:has(.codex-annotation-row) .codex-section-row,
        .codex-card-group:has(.codex-annotation-form) .codex-section-row { border-radius: 8px 8px 0 0; }
        .codex-section-badge { font-size: 11px; font-family: var(--font-mono); color: var(--color-accent); background: var(--color-accent-dim); padding: 2px 7px; border-radius: 4px; flex-shrink: 0; margin-top: 2px; white-space: nowrap; }
        .codex-section-body { flex: 1; min-width: 0; }
        .codex-section-text { font-size: 14px; color: var(--color-text); line-height: 1.6; font-family: ${CODEXS}; }
        .codex-section-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 6px; flex-wrap: wrap; gap: 6px; }
        .codex-section-cite { font-size: 11px; color: var(--color-muted); font-family: var(--font-mono); }
        .codex-section-actions { display: flex; align-items: center; gap: 6px; }
        .codex-copy-btn { padding: 4px 10px; border-radius: 5px; border: 1px solid var(--color-border); background: transparent; color: var(--color-muted); font-size: 11px; font-weight: 600; cursor: pointer; font-family: var(--font-mono); white-space: nowrap; transition: all 0.15s; }
        .codex-copy-btn.copied { border-color: var(--color-accent); background: var(--color-accent-dim); color: var(--color-accent); }
        .codex-annotate-btn { padding: 4px 10px; border-radius: 5px; border: 1px solid var(--color-border); background: transparent; color: var(--color-muted); font-size: 11px; font-weight: 600; cursor: pointer; font-family: ${CODEXF}; white-space: nowrap; transition: all 0.15s; }
        .codex-annotate-btn:hover { border-color: var(--color-accent); color: var(--color-accent); background: var(--color-accent-dim); }

        /* ── Annotation rows ── */
        .codex-annotation-row { display: flex; align-items: flex-start; gap: 12px; padding: 12px 14px; background: var(--color-border-light); border: 1px solid var(--color-border); border-top: none; }
        .codex-annotation-row:last-child { border-radius: 0 0 8px 8px; }
        .codex-annotation-row__body { flex: 1; min-width: 0; }
        .codex-annotation-row__text { font-size: 14px; color: var(--color-text); line-height: 1.6; font-family: ${CODEXS}; font-style: italic; }
        .codex-annotation-row__meta { display: flex; align-items: center; gap: 8px; margin-top: 5px; flex-wrap: wrap; }
        .codex-annotation-row__cite { font-size: 11px; color: var(--color-muted); font-family: var(--font-mono); }
        .codex-annotation-row__author { font-size: 11px; color: var(--color-accent); font-family: ${CODEXF}; font-weight: 600; }
        .codex-annotation-row__date { font-size: 11px; color: var(--color-muted); font-family: ${CODEXF}; }
        .codex-annotation-row__delete { font-size: 11px; color: var(--color-muted); font-family: ${CODEXF}; background: none; border: none; cursor: pointer; padding: 0; text-decoration: underline; }
        .codex-annotation-row__delete:hover, .codex-annotation-row__delete--confirm { color: var(--color-red, #ef4444); }
        .codex-annotation-row__cancel-delete { font-size: 11px; color: var(--color-muted); font-family: ${CODEXF}; background: none; border: none; cursor: pointer; padding: 0; }

        /* ── Add annotation form ── */
        .codex-annotation-form { border: 1px solid var(--color-border); border-top: none; border-radius: 0 0 8px 8px; padding: 12px 14px; background: var(--color-surface); }
        .codex-annotation-form__ta { width: 100%; box-sizing: border-box; background: transparent; border: none; border-bottom: 1px solid var(--color-border); outline: none; resize: none; font-size: 14px; line-height: 1.6; color: var(--color-text); font-family: ${CODEXS}; font-style: italic; padding: 4px 0 6px; }
        .codex-annotation-form__error { font-size: 12px; color: var(--color-red, #ef4444); font-family: ${CODEXF}; margin-top: 6px; }
        .codex-annotation-form__actions { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
        .codex-annotation-form__hint { font-size: 11px; color: var(--color-muted); font-family: ${CODEXF}; flex: 1; }
        .codex-annotation-form__cancel { padding: 4px 10px; border-radius: 5px; border: 1px solid var(--color-border); background: transparent; color: var(--color-muted); font-size: 11px; font-weight: 600; cursor: pointer; font-family: ${CODEXF}; }
        .codex-annotation-form__save { padding: 4px 12px; border-radius: 5px; border: none; background: var(--color-accent); color: #fff; font-size: 11px; font-weight: 700; cursor: pointer; font-family: ${CODEXF}; }
        .codex-annotation-form__save:disabled { opacity: 0.4; cursor: default; }

        .codex-empty { padding: 80px 48px; text-align: center; color: var(--color-muted); font-size: 14px; font-family: ${CODEXF}; }

        @media (max-width: 768px) {
          .codex-page { flex-direction: column; }
          .codex-page__tree { width: 100%; min-height: auto; border-right: none; border-bottom: 1px solid var(--color-border); }
          .codex-page__reader { padding: 24px 20px 48px; }
        }
      `}</style>

      {/* ── Tree ── */}
      <div className="codex-page__tree">
        {codices.map((cx: CodexSummary) => {
          const roots = getChildren(entries, null, cx.id)
          return (
            <div key={cx.id} className="codex-tree-section">
              {codices.length > 1 && (
                <div className="codex-tree-section__header">
                  <span className="codex-tree-section__code">{cx.short_code}</span>
                  <span className="codex-tree-section__name">{cx.name}</span>
                </div>
              )}
              {roots.map(entry => (
                <TreeItem
                  key={entry.id}
                  entry={entry}
                  entries={entries}
                  codexId={cx.id}
                  depth={0}
                  selectedId={selectedEntry?.id ?? null}
                  onSelect={setSelectedEntry}
                />
              ))}
            </div>
          )
        })}
      </div>

      {/* ── Reader ── */}
      <div className="codex-page__reader">
        {selectedEntry && selectedEntry.content ? (
          <>
            <h1 className="codex-reader__title">{selectedEntry.title ?? 'Untitled'}</h1>
            {selectedEntry.display_label && (
              <div className="codex-reader__code">{selectedEntry.display_label}</div>
            )}
            <div className="codex-content">
              {segments.map((seg, i) => {
                if (seg.kind === 'html') {
                  return (
                    <div
                      key={i}
                      dangerouslySetInnerHTML={{ __html: seg.html }}
                    />
                  )
                }
                return (
                  <SectionCardBlock
                    key={seg.anchorId || i}
                    segment={seg}
                    annotations={annotations[seg.anchorId] ?? []}
                    currentUserId={currentUserId}
                    isLoggedIn={isLoggedIn}
                    onCopyEmbed={handleCopyEmbed}
                    onAddAnnotation={handleAddAnnotation}
                    onDeleteAnnotation={handleDeleteAnnotation}
                  />
                )
              })}
            </div>
          </>
        ) : (
          <div className="codex-empty">Select an entry from the tree.</div>
        )}
      </div>
    </div>
  )
}
