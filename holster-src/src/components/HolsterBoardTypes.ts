export type HolsterBoard = {
  id: string
  user_id: string
  collection_id: string | null
  title: string
  description: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export type HolsterList = {
  id: string
  user_id: string
  board_id: string | null
  title: string
  description: string | null
  collection_id: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export type HolsterListItem = {
  id: string
  user_id: string
  list_id: string
  title: string
  note: string | null
  is_task: boolean
  is_done: boolean
  colors: string[]
  sort_order: number
  created_at: string
  updated_at: string
}

export const LIST_ITEM_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#64748b",
]