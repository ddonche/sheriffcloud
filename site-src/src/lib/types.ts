export interface Site {
  id: string
  name: string
  subdomain: string
  custom_domain: string | null
  site_type: string
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
}

export interface NotFoundResponse {
  type: 'not_found'
}
