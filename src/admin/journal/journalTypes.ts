// ─── Journal Types ────────────────────────────────────────────────────────────

export type JournalDomain = {
  id: string
  user_id: string
  label: string
  color: string
  sort_order: number
  created_at: string
}

export type JournalEntry = {
  id: string
  user_id: string
  entry_date: string        // ISO date string YYYY-MM-DD
  notes: string | null
  created_at: string
  updated_at: string
}

export type JournalEntryDomain = {
  id: string
  entry_id: string
  domain_id: string
}

export type JournalMarker = {
  id: string
  user_id: string
  entry_date: string
  domain_id: string
  label: string
  created_at: string
}

// Hydrated entry used in UI
export type HydratedEntry = JournalEntry & {
  domain_ids: string[]
  markers: JournalMarker[]
}
