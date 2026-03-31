import { useEffect, useMemo, useState } from "react"

const FONT = `"Inter", system-ui, -apple-system, sans-serif`
const BG = "#ffffff"
const BORDER = "#e2e8f0"
const SHELL = "rgba(15, 23, 42, 0.55)"
const TEXT = "#0f172a"
const MUTED = "#475569"
const DIM = "#94a3b8"
const TEAL = "#5b95a7"

export type LinkItemType =
  | "notes"
  | "snippets"
  | "files"
  | "passwords"
  | "keys"
  | "links"
  | "tasks"
  | "list_items"

export type LinkableItem = {
  id: string
  type: LinkItemType
  title: string
  preview?: string | null
  collectionId?: string | null
  collectionName?: string | null
}

export type LinkPickerCollection = {
  id: string
  name: string
}

type LinkPickerProps = {
  open: boolean
  onClose: () => void
  sourceId: string
  sourceType: LinkItemType
  collections?: LinkPickerCollection[]
  loadItems: () => Promise<LinkableItem[]>
  createLink: (target: LinkableItem) => Promise<void>
  renderTypeIcon: (type: LinkItemType) => React.ReactNode
  typeLabels?: Partial<Record<LinkItemType, string>>
  title?: string
}

const DEFAULT_TYPE_LABELS: Record<LinkItemType, string> = {
  notes: "Notes",
  snippets: "Snippets",
  files: "Files",
  passwords: "Passwords",
  keys: "Keys",
  links: "Links",
  tasks: "Tasks",
  list_items: "List Items",
}

const DEFAULT_TYPE_ORDER: LinkItemType[] = [
  "notes",
  "snippets",
  "links",
  "files",
  "passwords",
  "keys",
  "tasks",
  "list_items",
]

export default function LinkPicker({
  open,
  onClose,
  sourceId,
  sourceType,
  collections = [],
  loadItems,
  createLink,
  renderTypeIcon,
  typeLabels,
  title = "Link to item",
}: LinkPickerProps) {
  const labels = { ...DEFAULT_TYPE_LABELS, ...(typeLabels ?? {}) }
  const [items, setItems] = useState<LinkableItem[]>([])
  const [loading, setLoading] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [collectionFilter, setCollectionFilter] = useState<string>("all")
  const [expanded, setExpanded] = useState<Record<LinkItemType, boolean>>({
    notes: true,
    snippets: true,
    links: true,
    files: true,
    passwords: true,
    keys: true,
    tasks: true,
    list_items: true,
  })

  useEffect(() => {
    if (!open) return

    let cancelled = false

    async function run() {
      setLoading(true)
      try {
        const loaded = await loadItems()
        if (!cancelled) {
          setItems(
            (loaded ?? []).filter(
              item => !(item.id === sourceId && item.type === sourceType)
            )
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [open, loadItems, sourceId, sourceType])

  useEffect(() => {
    if (!open) return
    setQuery("")
    setCollectionFilter("all")
  }, [open])

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase()

    return items.filter(item => {
      if (collectionFilter === "none" && item.collectionId) return false
      if (collectionFilter !== "all" && collectionFilter !== "none" && item.collectionId !== collectionFilter) return false

      if (!q) return true

      const haystack = [
        item.title,
        item.preview ?? "",
        item.collectionName ?? "",
        labels[item.type] ?? item.type,
      ]
        .join(" ")
        .toLowerCase()

      return haystack.includes(q)
    })
  }, [items, query, collectionFilter, labels])

  const grouped = useMemo(() => {
    const map: Record<LinkItemType, LinkableItem[]> = {
      notes: [],
      snippets: [],
      files: [],
      passwords: [],
      keys: [],
      links: [],
      tasks: [],
      list_items: [],
    }

    for (const item of filteredItems) {
      map[item.type].push(item)
    }

    return map
  }, [filteredItems])

  async function handleLink(item: LinkableItem) {
    if (savingId) return
    setSavingId(item.id)
    try {
      await createLink(item)
      onClose()
    } finally {
      setSavingId(null)
    }
  }

  function toggleSection(type: LinkItemType) {
    setExpanded(prev => ({ ...prev, [type]: !prev[type] }))
  }

  if (!open) return null

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <div>
            <div style={styles.title}>{title}</div>
            <div style={styles.subtitle}>Search, browse by type, or narrow by collection.</div>
          </div>
          <button onClick={onClose} style={styles.closeButton} aria-label="Close link picker">
            <svg viewBox="0 0 640 640" width={14} height={14} fill="currentColor">
              <path d="M183 138.4C170.5 125.9 150.2 125.9 137.7 138.4C125.2 150.9 125.2 171.2 137.7 183.7L274.1 320L137.7 456.3C125.2 468.8 125.2 489.1 137.7 501.6C150.2 514.1 170.5 514.1 183 501.6L319.3 365.3L455.7 501.6C468.2 514.1 488.5 514.1 501 501.6C513.5 489.1 513.5 468.8 501 456.3L364.5 320L500.8 183.7C513.3 171.2 513.3 150.9 500.8 138.4C488.3 125.9 468 125.9 455.5 138.4L319.3 274.7L183 138.4Z" />
            </svg>
          </button>
        </div>

        <div style={styles.controls}>
          <div style={styles.searchWrap}>
            <svg viewBox="0 0 640 640" width={14} height={14} fill="currentColor" style={{ color: DIM, flexShrink: 0 }}>
              <path d="M288 96C181.9 96 96 181.9 96 288C96 394.1 181.9 480 288 480C331.8 480 372.1 465.3 404.2 440.6L507.7 544.1C520.2 556.6 540.5 556.6 553 544.1C565.5 531.6 565.5 511.3 553 498.8L449.5 395.3C474.2 363.2 488.9 322.9 488.9 279.1C488.9 173 403 87.1 296.9 87.1L288 96zM160 288C160 217.3 217.3 160 288 160C358.7 160 416 217.3 416 288C416 358.7 358.7 416 288 416C217.3 416 160 358.7 160 288z" />
            </svg>
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search items..."
              style={styles.searchInput}
            />
          </div>

          <select
            value={collectionFilter}
            onChange={e => setCollectionFilter(e.target.value)}
            style={styles.select}
          >
            <option value="all">All collections</option>
            <option value="none">No collection</option>
            {collections.map(col => (
              <option key={col.id} value={col.id}>
                {col.name}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.body}>
          {loading && <div style={styles.empty}>Loading items…</div>}

          {!loading && filteredItems.length === 0 && (
            <div style={styles.empty}>No matching items.</div>
          )}

          {!loading && filteredItems.length > 0 && (
            <div style={styles.sections}>
              {DEFAULT_TYPE_ORDER.map(type => {
                const sectionItems = grouped[type]
                if (!sectionItems.length) return null

                return (
                  <div key={type} style={styles.section}>
                    <button type="button" onClick={() => toggleSection(type)} style={styles.sectionHeader}>
                      <div style={styles.sectionHeaderLeft}>
                        <span style={styles.typeIcon}>{renderTypeIcon(type)}</span>
                        <span style={styles.sectionLabel}>{labels[type]}</span>
                        <span style={styles.sectionCount}>{sectionItems.length}</span>
                      </div>
                      <span style={{ ...styles.chevron, transform: expanded[type] ? "rotate(90deg)" : "rotate(0deg)" }}>
                        <svg viewBox="0 0 640 640" width={10} height={10} fill="currentColor">
                          <path d="M224 128L416 320L224 512L160 448L288 320L160 192Z" />
                        </svg>
                      </span>
                    </button>

                    {expanded[type] && (
                      <div style={styles.rows}>
                        {sectionItems.map(item => (
                          <button
                            key={`${item.type}:${item.id}`}
                            type="button"
                            style={styles.row}
                            disabled={savingId === item.id}
                            onClick={() => handleLink(item)}
                          >
                            <div style={styles.rowMain}>
                              <span style={styles.rowIcon}>{renderTypeIcon(item.type)}</span>
                              <div style={styles.rowTextWrap}>
                                <div style={styles.rowTitle}>{item.title || "Untitled"}</div>
                                {!!item.preview && <div style={styles.rowPreview}>{item.preview}</div>}
                                {!!item.collectionName && (
                                  <div style={styles.rowMeta}>Collection: {item.collectionName}</div>
                                )}
                                {!item.collectionName && <div style={styles.rowMeta}>No collection</div>}
                              </div>
                            </div>
                            <div style={styles.rowAction}>{savingId === item.id ? "Linking…" : "Link"}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: SHELL,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    zIndex: 1000,
  },
  modal: {
    width: "min(920px, 100%)",
    maxHeight: "min(760px, calc(100vh - 40px))",
    background: BG,
    border: `1px solid ${BORDER}`,
    borderRadius: 18,
    boxShadow: "0 28px 80px rgba(15, 23, 42, 0.24)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    padding: "20px 22px 14px",
    borderBottom: `1px solid ${BORDER}`,
  },
  title: {
    fontFamily: FONT,
    fontSize: 20,
    fontWeight: 800,
    color: TEXT,
    letterSpacing: "-0.02em",
  },
  subtitle: {
    marginTop: 4,
    fontFamily: FONT,
    fontSize: 13,
    color: MUTED,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    border: `1px solid ${BORDER}`,
    background: BG,
    color: MUTED,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  controls: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 220px",
    gap: 12,
    padding: "14px 22px 16px",
    borderBottom: `1px solid ${BORDER}`,
  },
  searchWrap: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    border: `1px solid ${BORDER}`,
    borderRadius: 10,
    padding: "0 12px",
    background: BG,
    minHeight: 44,
  },
  searchInput: {
    width: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    color: TEXT,
    fontSize: 14,
    fontFamily: FONT,
  },
  select: {
    border: `1px solid ${BORDER}`,
    borderRadius: 10,
    background: BG,
    color: TEXT,
    fontSize: 14,
    fontFamily: FONT,
    padding: "0 12px",
    minHeight: 44,
    outline: "none",
  },
  body: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    padding: 18,
    background: "#fbfdff",
  },
  empty: {
    fontFamily: FONT,
    fontSize: 14,
    color: MUTED,
    padding: 24,
  },
  sections: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  section: {
    border: `1px solid ${BORDER}`,
    borderRadius: 14,
    background: BG,
    overflow: "hidden",
  },
  sectionHeader: {
    width: "100%",
    border: "none",
    background: BG,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "12px 14px",
    cursor: "pointer",
    textAlign: "left",
  },
  sectionHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    minWidth: 0,
  },
  typeIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 18,
    height: 18,
    color: TEAL,
    flexShrink: 0,
  },
  sectionLabel: {
    fontFamily: FONT,
    fontSize: 14,
    fontWeight: 700,
    color: TEXT,
  },
  sectionCount: {
    fontFamily: FONT,
    fontSize: 12,
    fontWeight: 700,
    color: MUTED,
    background: `${TEAL}14`,
    borderRadius: 999,
    padding: "2px 8px",
  },
  chevron: {
    color: DIM,
    transition: "transform 0.15s ease",
    display: "inline-flex",
  },
  rows: {
    display: "flex",
    flexDirection: "column",
    borderTop: `1px solid ${BORDER}`,
  },
  row: {
    width: "100%",
    border: "none",
    borderBottom: `1px solid ${BORDER}`,
    background: BG,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    padding: "12px 14px",
    textAlign: "left",
    cursor: "pointer",
  },
  rowMain: {
    minWidth: 0,
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    flex: 1,
  },
  rowIcon: {
    width: 18,
    height: 18,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: TEAL,
    flexShrink: 0,
    marginTop: 2,
  },
  rowTextWrap: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  rowTitle: {
    fontFamily: FONT,
    fontSize: 14,
    fontWeight: 700,
    color: TEXT,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  rowPreview: {
    fontFamily: FONT,
    fontSize: 12,
    color: MUTED,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: "100%",
  },
  rowMeta: {
    fontFamily: FONT,
    fontSize: 11,
    color: DIM,
  },
  rowAction: {
    fontFamily: FONT,
    fontSize: 12,
    fontWeight: 800,
    color: TEAL,
    flexShrink: 0,
  },
}
