export function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-")
}

export function generateReferenceCode(shortCode: string, path: number[]): string {
  return [shortCode.toUpperCase(), ...path].join(".")
}

export function buildEntryTree(entries: import("./codexTypes").CodexEntry[]): import("./codexTypes").CodexEntry[] {
  return entries.filter(e => e.parent_id === null).sort((a, b) => a.sort_order - b.sort_order)
}

export function getChildren(entries: import("./codexTypes").CodexEntry[], parentId: string): import("./codexTypes").CodexEntry[] {
  return entries.filter(e => e.parent_id === parentId).sort((a, b) => a.sort_order - b.sort_order)
}
