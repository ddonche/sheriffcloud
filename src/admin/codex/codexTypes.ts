export type Codex = {
  id: string
  owner_id: string
  name: string
  slug: string
  short_code: string
  description: string | null
  created_at: string
  updated_at: string
}

// Every node in the tree is a CodexEntry.
// node_type "node" = container or document (arbitrary)
// node_type "anchor" = inline anchor stamped inside a document
// display_label = the short code for this node (e.g. "LM", "WSM", "1a")
export type CodexEntry = {
  id: string
  codex_id: string
  parent_id: string | null
  node_type: "node" | "anchor"
  display_label: string | null  // short code, e.g. "LM"
  title: string | null
  content: string | null
  sort_order: number
  reference_code: string | null // anchor label, e.g. "LM.1a.1"
  created_at: string
  updated_at: string
}

export type CodexAnnotation = {
  id: string
  node_id: string
  author_id: string
  content: string
  created_at: string
  updated_at: string
}
