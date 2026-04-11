export type Site = {
  id: string
  name: string
  subdomain: string
  custom_domain: string | null
  owner_id: string
  created_at: string
  updated_at?: string
  site_type?: string
  storage_used_mb?: number
  logo_url: string | null
  bio: string | null
  tagline: string | null
}

export interface Author {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
}

export interface SpurAuthor extends Author {
  role: string
  post_count: number
  last_published_at: string | null
}

export interface Serial {
  id: string
  title: string
  slug: string
  tagline: string | null
  description: string | null
  cover_image_url: string | null
  unit_label: string
  status: 'ongoing' | 'complete' | 'hiatus' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface SerialSummary {
  id: string
  title: string
  slug: string
  unit_label: string
  status: 'ongoing' | 'complete' | 'hiatus' | 'cancelled'
}

export interface SerialChapter {
  id: string
  slug: string
  title: string
  serial_index: number
  published_at: string | null
  excerpt: string | null
  content: string
}

export interface Post {
  id: string
  site_id: string
  author_id: string
  title: string
  slug: string
  excerpt: string | null
  content: string           // HTML from TipTap
  thumbnail_url: string | null
  status: 'published' | 'draft' | 'scheduled'
  tags: string[]
  content_meta: ContentMeta | null
  published_at: string | null
  created_at: string
  updated_at: string
  like_count: number
  user_liked: boolean
  comment_count: number
  // Serial fields
  is_serial: boolean
  serial_id: string | null
  serial_index: number | null
  serial?: SerialSummary | null
}

export interface ContentMeta {
  has_image?: boolean
  has_video?: boolean
  has_code?: boolean
  has_file?: boolean
  has_link?: boolean
  has_audio?: boolean
}

// site_router response shapes
export type RouterResponse =
  | BlogIndexResponse
  | BlogPostResponse
  | SerialPageResponse
  | NotFoundResponse

export interface BlogIndexResponse {
  type: 'blog_index'
  site: Site
  posts: Post[]
  authors: SpurAuthor[]
}

export interface BlogPostResponse {
  type: 'blog_post'
  site: Site
  post: Post
  author: Author
  serial?: Serial | null
  toc?: SerialChapter[]
  prev?: { slug: string } | null
  next?: { slug: string } | null
}

export interface SerialPageResponse {
  type: 'serial_page'
  site: Site
  serial: Serial
  chapters: SerialChapter[]
}

export interface NotFoundResponse {
  type: 'not_found'
}