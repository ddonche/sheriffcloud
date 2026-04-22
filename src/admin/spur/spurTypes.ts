export type SpurPost = {
  id: string
  site_id: string
  author_id: string
  title: string
  slug: string
  excerpt: string | null
  content: string | null
  thumbnail_url: string | null
  status: "draft" | "published" | "scheduled"
  tags: string[]
  content_meta: Record<string, boolean>
  published_at: string | null
  created_at: string
  updated_at: string
  serial_id: string | null
  serial_index: number | null
  is_serial: boolean
}

export type SpurCategory = {
  id: string
  site_id: string
  name: string
  color: string
  slug: string
  created_at: string
}

export type SpurFeature =
  | "posts"
  | "serials"
  | "collections"
  | "categories"
  | "writers"
  | "settings"

export type SpurAuthor = {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  role: string
  post_count: number
  last_published_at: string | null
}

export type SpurSerial = {
  id: string
  site_id: string
  author_id: string
  title: string
  tagline: string | null
  description: string | null
  cover_image_url: string | null
  unit_label: string
  status: string
  created_at: string
  updated_at: string
  last_published_at: string | null
}