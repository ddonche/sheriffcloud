export function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-")
}

export function firstImageFromContent(content: string | null): string | null {
  if (!content) return null
  const match = content.match(/<img[^>]+src=["']([^"']+)["']/i)
  return match ? match[1] : null
}
