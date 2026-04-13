import { useState } from 'react'
import type { CodexIndexResponse, CodexSummary, CodexEntry } from '../lib/types'

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
          style={{ opacity: hasChildren ? 1 : 0, display: 'inline-block', transition: 'transform 0.15s', transform: expanded && hasChildren ? 'rotate(90deg)' : 'rotate(0deg)' }}
          onClick={e => { e.stopPropagation(); setExpanded(v => !v) }}
        >›</span>
        <span className="codex-tree-item__title">{entry.title ?? <em>Untitled</em>}</span>
        {entry.display_label && <span className="codex-tree-item__code">{entry.display_label}</span>}
      </button>
      {expanded && hasChildren && children.map(child => (
        <TreeItem key={child.id} entry={child} entries={entries} codexId={codexId} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </div>
  )
}

export default function CodexIndex({ data }: {
  data: CodexIndexResponse
  onNavigate: (path: string) => void
}) {
  const { codices, entries } = data
  const [selectedEntry, setSelectedEntry] = useState<CodexEntry | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const anchors = selectedEntry
    ? entries.filter(e => e.parent_id === selectedEntry.id && e.node_type === 'anchor')
    : []

  const selectedCodex = selectedEntry
    ? codices.find(c => c.id === selectedEntry.codex_id) ?? null
    : null

  function buildCitation(anchor: CodexEntry): string {
    if (!selectedEntry || !selectedCodex) return anchor.reference_code ?? ''
    const path: string[] = []
    let current: CodexEntry | undefined = selectedEntry
    while (current) {
      if (current.display_label) path.unshift(current.display_label)
      current = entries.find(e => e.id === current!.parent_id)
    }
    path.unshift(selectedCodex.short_code)
    return [...path, anchor.reference_code].filter(Boolean).join('.')
  }

  function handleCopy(anchor: CodexEntry) {
    const citation = buildCitation(anchor)
    navigator.clipboard.writeText(`[[${citation}]]`)
    setCopied(anchor.id)
    setTimeout(() => setCopied(null), 1800)
  }

  return (
    <div className="codex-page">
      <style>{`
        .codex-page { display: flex; align-items: flex-start; }
        .codex-page__tree { width: 260px; flex-shrink: 0; border-right: 1px solid var(--color-border); min-height: calc(100vh - 140px); padding: 16px 0; }
        .codex-page__reader { flex: 1; min-width: 0; padding: 48px 48px 80px; max-width: 760px; }
        .codex-tree-section { margin-bottom: 8px; }
        .codex-tree-section__header { padding: 10px 12px 6px; display: flex; align-items: center; gap: 8px; }
        .codex-tree-section__name { font-size: 13px; font-weight: 700; color: var(--color-text); }
        .codex-tree-section__code { font-size: 10px; font-family: var(--font-mono); color: var(--color-accent); background: var(--color-accent-dim); padding: 1px 5px; border-radius: 3px; }
        .codex-tree-item { display: flex; align-items: center; gap: 6px; width: 100%; padding-top: 0; padding-bottom: 0; padding-right: 12px; height: 38px; background: none; border: none; border-left: 2px solid transparent; cursor: pointer; text-align: left; color: var(--color-text); font-size: 14px; transition: background 0.1s; }
        .codex-tree-item:hover { background: var(--color-surface-hover); }
        .codex-tree-item--active { border-left-color: var(--color-accent); background: var(--color-accent-dim); color: var(--color-accent); font-weight: 600; }
        .codex-tree-item__chevron { font-size: 14px; flex-shrink: 0; color: var(--color-muted); line-height: 1; width: 14px; text-align: center; }
        .codex-tree-item__title { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .codex-tree-item__code { font-size: 10px; font-family: var(--font-mono); color: var(--color-accent); background: var(--color-accent-dim); padding: 1px 5px; border-radius: 3px; flex-shrink: 0; }
        .codex-reader__title { font-size: 32px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.2; margin: 0 0 8px; color: var(--color-text); }
        .codex-reader__code { font-size: 11px; font-family: var(--font-mono); color: var(--color-accent); background: var(--color-accent-dim); padding: 2px 8px; border-radius: 4px; display: inline-block; margin-bottom: 28px; }
        .codex-content { font-size: 17px; line-height: 1.85; color: var(--color-text); }
        .codex-content p { margin: 0 0 1.2em; }
        .codex-content h1, .codex-content h2, .codex-content h3 { margin: 1.4em 0 0.5em; line-height: 1.3; font-weight: 700; }
        .codex-content blockquote { border-left: 3px solid var(--color-accent); padding-left: 18px; margin: 20px 0; color: var(--color-muted); font-style: italic; }
        .codex-content code { background: var(--color-surface); border-radius: 4px; padding: 2px 6px; font-family: var(--font-mono); font-size: 14px; }
        .codex-content a { color: var(--color-accent); }
        .codex-content ul, .codex-content ol { padding-left: 24px; margin: 0 0 1.2em; }
        .codex-content span[data-section-id] { display: inline-flex; align-items: center; background: var(--color-accent-dim); color: var(--color-accent); font-family: var(--font-mono); font-size: 11px; font-weight: 700; padding: 1px 6px; border-radius: 4px; user-select: none; margin: 0 1px 0 3px; vertical-align: middle; }
        .codex-sections { margin-top: 48px; padding-top: 28px; border-top: 1px solid var(--color-border); }
        .codex-sections__label { font-size: 11px; font-weight: 700; font-family: var(--font-mono); letter-spacing: 0.08em; text-transform: uppercase; color: var(--color-muted); margin-bottom: 14px; }
        .codex-section-row { display: flex; align-items: flex-start; gap: 12px; padding: 12px 14px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 8px; margin-bottom: 8px; }
        .codex-section-badge { font-size: 11px; font-family: var(--font-mono); color: var(--color-accent); background: var(--color-accent-dim); padding: 2px 7px; border-radius: 4px; flex-shrink: 0; margin-top: 2px; white-space: nowrap; }
        .codex-section-text { flex: 1; font-size: 14px; color: var(--color-text); line-height: 1.6; }
        .codex-section-cite { font-size: 11px; color: var(--color-muted); font-family: var(--font-mono); margin-top: 4px; }
        .codex-copy-btn { padding: 4px 10px; border-radius: 5px; border: 1px solid var(--color-border); background: transparent; color: var(--color-muted); font-size: 11px; font-weight: 600; cursor: pointer; font-family: var(--font-mono); flex-shrink: 0; white-space: nowrap; transition: all 0.15s; }
        .codex-copy-btn.copied { border-color: var(--color-accent); background: var(--color-accent-dim); color: var(--color-accent); }
        .codex-empty { padding: 80px 48px; text-align: center; color: var(--color-muted); font-size: 14px; }
        @media (max-width: 768px) {
          .codex-page { flex-direction: column; }
          .codex-page__tree { width: 100%; min-height: auto; border-right: none; border-bottom: 1px solid var(--color-border); }
          .codex-page__reader { padding: 24px 20px 48px; }
        }
      `}</style>

      {/* Left — tree */}
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
                <TreeItem key={entry.id} entry={entry} entries={entries} codexId={cx.id} depth={0} selectedId={selectedEntry?.id ?? null} onSelect={setSelectedEntry} />
              ))}
            </div>
          )
        })}
      </div>

      {/* Right — reader */}
      <div className="codex-page__reader">
        {selectedEntry && selectedEntry.content ? (
          <>
            <h1 className="codex-reader__title">{selectedEntry.title ?? 'Untitled'}</h1>
            {selectedEntry.display_label && (
              <div className="codex-reader__code">{selectedEntry.display_label}</div>
            )}
            <div className="codex-content" dangerouslySetInnerHTML={{ __html: selectedEntry.content }} />
            {anchors.length > 0 && (
              <div className="codex-sections">
                <div className="codex-sections__label">Section IDs</div>
                {anchors.map(anchor => {
                  const citation = buildCitation(anchor)
                  const isCopied = copied === anchor.id
                  return (
                    <div key={anchor.id} className="codex-section-row">
                      <span className="codex-section-badge">[{anchor.reference_code}]</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="codex-section-text">{anchor.content}</div>
                        <div className="codex-section-cite">{citation}</div>
                      </div>
                      <button className={`codex-copy-btn${isCopied ? ' copied' : ''}`} onClick={() => handleCopy(anchor)}>
                        {isCopied ? 'Copied!' : '[[embed]]'}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          <div className="codex-empty">Select an entry from the tree.</div>
        )}
      </div>
    </div>
  )
}
