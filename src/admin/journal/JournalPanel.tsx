import { useEffect, useState } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import type {
  JournalDomain,
  JournalEntry,
  JournalEntryDomain,
  JournalMarker,
  HydratedEntry,
} from "./journalTypes"

// ─── Constants ────────────────────────────────────────────────────────────────

const FONT = `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
]

const DAY_NAMES = ["Su","Mo","Tu","We","Th","Fr","Sa"]

const DEFAULT_COLORS = [
  "#1D9E75","#185FA5","#7F77DD","#BA7517",
  "#D85A30","#D4537E","#888780","#0e7490",
  "#7c3aed","#b45309","#dc2626","#16a34a",
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function today() {
  return toDateKey(new Date())
}

// ─── Domain Manager Modal ─────────────────────────────────────────────────────

function DomainModal({
  domains,
  onClose,
  onSave,
}: {
  domains: JournalDomain[]
  onClose: () => void
  onSave: (domains: JournalDomain[]) => void
}) {
  const [list, setList] = useState<JournalDomain[]>([...domains])
  const [newLabel, setNewLabel] = useState("")
  const [newColor, setNewColor] = useState(DEFAULT_COLORS[list.length % DEFAULT_COLORS.length])
  const [error, setError] = useState<string | null>(null)

  function addDomain() {
    if (!newLabel.trim()) { setError("Label required."); return }
    if (list.length >= 20) { setError("Max 20 domains."); return }
    setError(null)
    const pseudo: JournalDomain = {
      id: `new-${Date.now()}`,
      user_id: "",
      label: newLabel.trim(),
      color: newColor,
      sort_order: list.length,
      created_at: new Date().toISOString(),
    }
    const next = [...list, pseudo]
    setList(next)
    setNewLabel("")
    setNewColor(DEFAULT_COLORS[next.length % DEFAULT_COLORS.length])
  }

  function removeDomain(id: string) {
    setList(prev => prev.filter(d => d.id !== id))
  }

  return (
    <div style={MO.overlay} onClick={onClose}>
      <div style={MO.modal} onClick={e => e.stopPropagation()}>
        <div style={MO.header}>
          <span style={MO.title}>Manage Domains</span>
          <button style={MO.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={MO.body}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {list.map(d => (
              <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #f0f0f0" }}>
                <span style={{ width: 12, height: 12, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 14, color: "#111827" }}>{d.label}</span>
                <button onClick={() => removeDomain(d.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 16, lineHeight: 1, padding: "0 2px" }}>×</button>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
            <input
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addDomain()}
              placeholder="New domain label"
              style={{ flex: 1, border: "1px solid #d4d4d8", borderRadius: 4, padding: "8px 10px", fontSize: 13, fontFamily: FONT, outline: "none" }}
            />
            <input
              type="color"
              value={newColor}
              onChange={e => setNewColor(e.target.value)}
              style={{ width: 36, height: 36, border: "1px solid #d4d4d8", borderRadius: 4, cursor: "pointer", padding: 2 }}
            />
            <button onClick={addDomain} style={{ background: "#1e293b", color: "#fff", border: "none", borderRadius: 4, padding: "8px 14px", fontSize: 13, cursor: "pointer", fontFamily: FONT }}>Add</button>
          </div>
          {error && <div style={{ fontSize: 12, color: "#dc2626", marginTop: 4 }}>{error}</div>}
        </div>
        <div style={MO.footer}>
          <button style={MO.btnGhost} onClick={onClose}>Cancel</button>
          <button style={MO.btnPrimary} onClick={() => onSave(list)}>Save</button>
        </div>
      </div>
    </div>
  )
}

// ─── Entry Editor Modal ───────────────────────────────────────────────────────

function EntryModal({
  date,
  entry,
  domains,
  markers,
  onClose,
  onSave,
  onAddMarker,
  onDeleteMarker,
}: {
  date: string
  entry: HydratedEntry | null
  domains: JournalDomain[]
  markers: JournalMarker[]
  onClose: () => void
  onSave: (domainIds: string[], notes: string) => void
  onAddMarker: (domainId: string, label: string) => void
  onDeleteMarker: (markerId: string) => void
}) {
  const [selectedDomains, setSelectedDomains] = useState<string[]>(entry?.domain_ids ?? [])
  const [notes, setNotes] = useState(entry?.notes ?? "")
  const [markerDomain, setMarkerDomain] = useState(domains[0]?.id ?? "")
  const [markerLabel, setMarkerLabel] = useState("")
  const [showMarkerForm, setShowMarkerForm] = useState(false)

  function toggleDomain(id: string) {
    setSelectedDomains(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id])
  }

  const displayDate = new Date(date + "T12:00:00")
  const dateLabel = displayDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })

  return (
    <div style={MO.overlay} onClick={onClose}>
      <div style={{ ...MO.modal, maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div style={MO.header}>
          <span style={MO.title}>{dateLabel}</span>
          <button style={MO.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={MO.body}>
          {/* Domain checkboxes */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>What did you work on?</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {domains.map(d => {
                const active = selectedDomains.includes(d.id)
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDomain(d.id)}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "6px 12px", borderRadius: 20,
                      border: `1.5px solid ${active ? d.color : "#d4d4d8"}`,
                      background: active ? `${d.color}18` : "#fafafa",
                      cursor: "pointer", fontSize: 13, fontFamily: FONT,
                      color: active ? d.color : "#374151",
                      fontWeight: active ? 600 : 400,
                      transition: "all 0.12s",
                    }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: active ? d.color : "#d1d5db", flexShrink: 0 }} />
                    {d.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Notes <span style={{ fontWeight: 400, textTransform: "none" }}>(optional)</span></div>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="What did you do, decide, or discover today?"
              style={{ width: "100%", minHeight: 100, border: "1px solid #d4d4d8", borderRadius: 6, padding: "10px 12px", fontSize: 14, fontFamily: FONT, resize: "vertical", outline: "none", color: "#111827", boxSizing: "border-box" }}
            />
          </div>

          {/* Markers */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>Markers</div>
              <button onClick={() => setShowMarkerForm(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#6b7280", fontFamily: FONT }}>
                {showMarkerForm ? "Cancel" : "+ Add marker"}
              </button>
            </div>
            {markers.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
                {markers.map(m => {
                  const dom = domains.find(d => d.id === m.domain_id)
                  return (
                    <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "#f8f8f8", borderRadius: 6, border: "1px solid #e5e7eb" }}>
                      {dom && <span style={{ width: 8, height: 8, borderRadius: "50%", background: dom.color, flexShrink: 0 }} />}
                      <span style={{ flex: 1, fontSize: 13, color: "#111827" }}>{m.label}</span>
                      {dom && <span style={{ fontSize: 11, color: dom.color }}>{dom.label}</span>}
                      <button onClick={() => onDeleteMarker(m.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 14, lineHeight: 1 }}>×</button>
                    </div>
                  )
                })}
              </div>
            )}
            {showMarkerForm && (
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <select
                  value={markerDomain}
                  onChange={e => setMarkerDomain(e.target.value)}
                  style={{ border: "1px solid #d4d4d8", borderRadius: 4, padding: "6px 8px", fontSize: 13, fontFamily: FONT, outline: "none" }}
                >
                  {domains.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                </select>
                <input
                  value={markerLabel}
                  onChange={e => setMarkerLabel(e.target.value)}
                  placeholder="Marker label (e.g. v1.0)"
                  style={{ flex: 1, border: "1px solid #d4d4d8", borderRadius: 4, padding: "6px 10px", fontSize: 13, fontFamily: FONT, outline: "none" }}
                />
                <button
                  onClick={() => {
                    if (!markerLabel.trim() || !markerDomain) return
                    onAddMarker(markerDomain, markerLabel.trim())
                    setMarkerLabel("")
                    setShowMarkerForm(false)
                  }}
                  style={{ background: "#1e293b", color: "#fff", border: "none", borderRadius: 4, padding: "6px 12px", fontSize: 13, cursor: "pointer", fontFamily: FONT, whiteSpace: "nowrap" }}
                >
                  Place
                </button>
              </div>
            )}
          </div>
        </div>
        <div style={MO.footer}>
          <button style={MO.btnGhost} onClick={onClose}>Cancel</button>
          <button style={MO.btnPrimary} onClick={() => onSave(selectedDomains, notes)}>Save entry</button>
        </div>
      </div>
    </div>
  )
}

// ─── Dot Grid ─────────────────────────────────────────────────────────────────

function DotGrid({
  year,
  month,
  entries,
  domains,
  markers,
  todayStr,
  onClickDay,
}: {
  year: number
  month: number
  entries: HydratedEntry[]
  domains: JournalDomain[]
  markers: JournalMarker[]
  todayStr: string
  onClickDay: (dateStr: string) => void
}) {
  const numDays = daysInMonth(year, month)
  const entryMap: Record<string, HydratedEntry> = {}
  entries.forEach(e => { entryMap[e.entry_date] = e })
  const markerMap: Record<string, JournalMarker[]> = {}
  markers.forEach(m => {
    if (!markerMap[m.entry_date]) markerMap[m.entry_date] = []
    markerMap[m.entry_date].push(m)
  })

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th style={{ width: 130, minWidth: 130 }} />
            {Array.from({ length: numDays }, (_, i) => {
              const d = i + 1
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
              const dow = new Date(year, month, d).getDay()
              const isToday = dateStr === todayStr
              const isFuture = dateStr > todayStr
              return (
                <th
                  key={d}
                  style={{
                    fontSize: 10, fontWeight: isToday ? 700 : 400,
                    color: isToday ? "#111827" : "#9ca3af",
                    textAlign: "center", paddingBottom: 6,
                    opacity: isFuture ? 0.3 : 1,
                    minWidth: 20,
                  }}
                >
                  {DAY_NAMES[dow]}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {domains.map(domain => (
            <tr key={domain.id}>
              <td style={{ paddingRight: 12, height: 28, verticalAlign: "middle", whiteSpace: "nowrap" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: domain.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "#374151" }}>{domain.label}</span>
                </span>
              </td>
              {Array.from({ length: numDays }, (_, i) => {
                const d = i + 1
                const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
                const isFuture = dateStr > todayStr
                const isToday = dateStr === todayStr
                const entry = entryMap[dateStr]
                const active = !isFuture && entry?.domain_ids.includes(domain.id)
                const dayMarkers = markerMap[dateStr] ?? []
                const hasMarker = dayMarkers.some(m => m.domain_id === domain.id)

                return (
                  <td
                    key={d}
                    onClick={() => !isFuture && onClickDay(dateStr)}
                    style={{
                      textAlign: "center", verticalAlign: "middle",
                      height: 28, padding: "0 2px",
                      background: isToday ? "#f3f4f6" : "transparent",
                      cursor: isFuture ? "default" : "pointer",
                      opacity: isFuture ? 0.25 : 1,
                      borderBottom: hasMarker ? `2px solid ${domain.color}` : "2px solid transparent",
                    }}
                  >
                    <span style={{
                      width: 10, height: 10, borderRadius: "50%",
                      display: "inline-block",
                      background: active ? domain.color : "#e5e7eb",
                    }} />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export default function JournalPanel({
  userId,
  supabase,
}: {
  userId: string
  supabase: SupabaseClient
}) {
  const todayStr = today()
  const todayDate = new Date()
  const [viewYear, setViewYear] = useState(todayDate.getFullYear())
  const [viewMonth, setViewMonth] = useState(todayDate.getMonth())

  const [domains, setDomains] = useState<JournalDomain[]>([])
  const [entries, setEntries] = useState<HydratedEntry[]>([])
  const [markers, setMarkers] = useState<JournalMarker[]>([])

  const [loading, setLoading] = useState(true)
  const [showDomainModal, setShowDomainModal] = useState(false)
  const [editingDate, setEditingDate] = useState<string | null>(null)

  // ── Load domains once
  useEffect(() => {
    loadDomains()
  }, [userId])

  // ── Load entries + markers when month changes
  useEffect(() => {
    if (domains.length >= 0) loadMonth()
  }, [viewYear, viewMonth, domains])

  async function loadDomains() {
    const { data } = await supabase
      .from("journal_domains")
      .select("*")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true })
    setDomains(data ?? [])
  }

  async function loadMonth() {
    setLoading(true)
    const startDate = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-01`
    const endDate = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(daysInMonth(viewYear, viewMonth)).padStart(2, "0")}`

    const [{ data: entryRows }, { data: entryDomainRows }, { data: markerRows }] = await Promise.all([
      supabase.from("journal_entries").select("*").eq("user_id", userId).gte("entry_date", startDate).lte("entry_date", endDate),
      supabase.from("journal_entry_domains").select("*, journal_entries!inner(user_id, entry_date)").eq("journal_entries.user_id", userId).gte("journal_entries.entry_date", startDate).lte("journal_entries.entry_date", endDate),
      supabase.from("journal_markers").select("*").eq("user_id", userId).gte("entry_date", startDate).lte("entry_date", endDate),
    ])

    // Group domain assignments by entry_id
    const domainsByEntry: Record<string, string[]> = {}
    for (const row of (entryDomainRows ?? []) as (JournalEntryDomain & { journal_entries: { entry_date: string } })[]) {
      if (!domainsByEntry[row.entry_id]) domainsByEntry[row.entry_id] = []
      domainsByEntry[row.entry_id].push(row.domain_id)
    }

    const hydrated: HydratedEntry[] = (entryRows ?? []).map((e: JournalEntry) => ({
      ...e,
      domain_ids: domainsByEntry[e.id] ?? [],
      markers: (markerRows ?? []).filter((m: JournalMarker) => m.entry_date === e.entry_date),
    }))

    setEntries(hydrated)
    setMarkers(markerRows ?? [])
    setLoading(false)
  }

  // ── Save domains
  async function saveDomains(updated: JournalDomain[]) {
    const existing = domains.map(d => d.id)
    const updatedIds = updated.filter(d => !d.id.startsWith("new-")).map(d => d.id)

    // Delete removed
    const toDelete = existing.filter(id => !updatedIds.includes(id))
    if (toDelete.length) {
      await supabase.from("journal_domains").delete().in("id", toDelete)
    }

    // Insert new
    const toInsert = updated.filter(d => d.id.startsWith("new-")).map((d, i) => ({
      user_id: userId,
      label: d.label,
      color: d.color,
      sort_order: updatedIds.length + i,
    }))
    if (toInsert.length) {
      await supabase.from("journal_domains").insert(toInsert)
    }

    setShowDomainModal(false)
    await loadDomains()
  }

  // ── Save entry
  async function saveEntry(dateStr: string, domainIds: string[], notes: string) {
    // Upsert entry
    const { data: entry } = await supabase
      .from("journal_entries")
      .upsert({ user_id: userId, entry_date: dateStr, notes: notes || null, updated_at: new Date().toISOString() }, { onConflict: "user_id,entry_date" })
      .select()
      .single()

    if (!entry) return

    // Replace domain links
    await supabase.from("journal_entry_domains").delete().eq("entry_id", entry.id)
    if (domainIds.length) {
      await supabase.from("journal_entry_domains").insert(domainIds.map(did => ({ entry_id: entry.id, domain_id: did })))
    }

    setEditingDate(null)
    await loadMonth()
  }

  // ── Markers
  async function addMarker(dateStr: string, domainId: string, label: string) {
    await supabase.from("journal_markers").insert({ user_id: userId, entry_date: dateStr, domain_id: domainId, label })
    await loadMonth()
  }

  async function deleteMarker(markerId: string) {
    await supabase.from("journal_markers").delete().eq("id", markerId)
    await loadMonth()
  }

  // ── Navigation
  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }

  function nextMonth() {
    const isCurrentMonth = viewYear === todayDate.getFullYear() && viewMonth === todayDate.getMonth()
    if (isCurrentMonth) return
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const isCurrentMonth = viewYear === todayDate.getFullYear() && viewMonth === todayDate.getMonth()

  // ── Stats
  const validEntries = entries.filter(e => e.entry_date <= todayStr)
  const allTags = validEntries.flatMap(e => e.domain_ids)
  const domainCounts: Record<string, number> = {}
  domains.forEach(d => { domainCounts[d.id] = 0 })
  allTags.forEach(id => { if (domainCounts[id] !== undefined) domainCounts[id]++ })
  const topDomainId = Object.entries(domainCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
  const topDomain = domains.find(d => d.id === topDomainId)

  // ── Current editing entry
  const editingEntry = editingDate ? (entries.find(e => e.entry_date === editingDate) ?? null) : null
  const editingMarkers = editingDate ? markers.filter(m => m.entry_date === editingDate) : []

  // ── Recent entries (most recent first, up to today)
  const recentEntries = [...validEntries]
    .filter(e => e.domain_ids.length > 0 || e.notes)
    .sort((a, b) => b.entry_date.localeCompare(a.entry_date))
    .slice(0, 8)

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px", fontFamily: FONT, background: "#f9fafb" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#111827" }}>Journal</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setEditingDate(todayStr)}
            style={{ background: "#1e293b", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 13, cursor: "pointer", fontFamily: FONT, fontWeight: 600 }}
          >
            + Today's entry
          </button>
          <button
            onClick={() => setShowDomainModal(true)}
            style={{ background: "none", border: "1px solid #d4d4d8", borderRadius: 6, padding: "8px 14px", fontSize: 13, cursor: "pointer", fontFamily: FONT, color: "#374151" }}
          >
            Manage domains
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Entries this month", value: validEntries.filter(e => e.domain_ids.length > 0 || e.notes).length },
          { label: "Days active", value: validEntries.filter(e => e.domain_ids.length > 0).length },
          { label: "Most active", value: topDomain?.label.split(" ")[0] ?? "—" },
          { label: "Markers", value: markers.length },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px 16px" }}>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: typeof value === "number" ? 22 : 16, fontWeight: 600, color: "#111827" }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Activity card */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "20px 24px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={prevMonth} style={{ background: "none", border: "1px solid #d4d4d8", borderRadius: 4, padding: "4px 10px", cursor: "pointer", fontSize: 14, color: "#374151" }}>‹</button>
            <button onClick={nextMonth} disabled={isCurrentMonth} style={{ background: "none", border: "1px solid #d4d4d8", borderRadius: 4, padding: "4px 10px", cursor: isCurrentMonth ? "default" : "pointer", fontSize: 14, color: "#374151", opacity: isCurrentMonth ? 0.35 : 1 }}>›</button>
          </div>
        </div>

        {domains.length === 0 ? (
          <div style={{ padding: "32px 0", textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
            No domains yet. <button onClick={() => setShowDomainModal(true)} style={{ background: "none", border: "none", color: "#3296ab", cursor: "pointer", fontSize: 14, fontFamily: FONT, textDecoration: "underline" }}>Add some to get started.</button>
          </div>
        ) : loading ? (
          <div style={{ padding: "32px 0", textAlign: "center", color: "#9ca3af", fontSize: 14 }}>Loading…</div>
        ) : (
          <DotGrid
            year={viewYear}
            month={viewMonth}
            entries={entries}
            domains={domains}
            markers={markers}
            todayStr={todayStr}
            onClickDay={setEditingDate}
          />
        )}
      </div>

      {/* Recent entries */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "20px 24px" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>Recent entries</div>
        {recentEntries.length === 0 ? (
          <div style={{ fontSize: 14, color: "#9ca3af" }}>No entries yet this month.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recentEntries.map(entry => {
              const entryDomains = domains.filter(d => entry.domain_ids.includes(d.id))
              const entryMarkers = markers.filter(m => m.entry_date === entry.entry_date)
              const d = new Date(entry.entry_date + "T12:00:00")
              const dateLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
              return (
                <div
                  key={entry.id}
                  onClick={() => setEditingDate(entry.entry_date)}
                  style={{ display: "flex", gap: 12, padding: "10px 12px", border: "1px solid #f0f0f0", borderRadius: 8, cursor: "pointer", transition: "background 0.1s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{ fontSize: 11, color: "#9ca3af", minWidth: 48, paddingTop: 2 }}>{dateLabel}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: entry.notes ? 5 : 0 }}>
                      {entryDomains.map(d => (
                        <span key={d.id} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: `${d.color}18`, color: d.color, fontWeight: 600 }}>{d.label}</span>
                      ))}
                    </div>
                    {entry.notes && <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>{entry.notes}</div>}
                    {entryMarkers.map(m => {
                      const dom = domains.find(d => d.id === m.domain_id)
                      return (
                        <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4, fontSize: 11, color: "#9ca3af" }}>
                          <span style={{ width: 6, height: 6, borderRadius: 1, background: dom?.color ?? "#9ca3af", display: "inline-block" }} />
                          {m.label}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {showDomainModal && (
        <DomainModal
          domains={domains}
          onClose={() => setShowDomainModal(false)}
          onSave={saveDomains}
        />
      )}

      {editingDate && (
        <EntryModal
          date={editingDate}
          entry={editingEntry}
          domains={domains}
          markers={editingMarkers}
          onClose={() => setEditingDate(null)}
          onSave={(domainIds, notes) => saveEntry(editingDate, domainIds, notes)}
          onAddMarker={(domainId, label) => addMarker(editingDate, domainId, label)}
          onDeleteMarker={deleteMarker}
        />
      )}
    </div>
  )
}

// ─── Modal styles ─────────────────────────────────────────────────────────────

const MO: Record<string, React.CSSProperties> = {
  overlay:    { position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24 },
  modal:      { background: "#fff", border: "1px solid #d4d4d8", borderRadius: 10, width: "100%", maxWidth: 460, boxShadow: "0 8px 32px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column" },
  header:     { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 12px", borderBottom: "1px solid #e5e7eb" },
  title:      { fontSize: 15, fontWeight: 700, color: "#111827" },
  closeBtn:   { background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#71717a", padding: "2px 6px", lineHeight: 1, borderRadius: 4 },
  body:       { padding: 20, display: "flex", flexDirection: "column", gap: 16 },
  footer:     { display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 20px 16px", borderTop: "1px solid #e5e7eb" },
  btnPrimary: { background: "#1e293b", color: "#fff", border: "none", borderRadius: 6, padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: FONT },
  btnGhost:   { background: "none", border: "1px solid #d4d4d8", borderRadius: 6, padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer", color: "#374151", fontFamily: FONT },
}
