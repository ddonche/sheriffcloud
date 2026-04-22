import { useEffect, useMemo, useRef, useState } from "react"
import { Routes, Route, useNavigate, useParams, Link } from "react-router-dom"
import { supabase } from "./supabase"
import { AuthModal } from "./AuthModal"
import PricingPage from "./PricingPage"
import AboutPage from "./AboutPage"
import ComingSoonPage from "./ComingSoonPage"
import PrivacyPage from "./PrivacyPage"
import TermsPage from "./TermsPage"
import CookiePage from "./CookiePage"
import SpurHeader from "./components/SpurHeader"
import { Icon } from "./Icons"
import { SpurPanel } from "./spur/SpurPanel"
import CreateBlogModal from "./CreateBlogModal"
import { SpurPostEditor } from "./spur/SpurPostEditor"
import SpurFooter from "./components/SpurFooter"

// ── Hooks ─────────────────────────────────────────────────────────────────────

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint)
    window.addEventListener("resize", handler)
    return () => window.removeEventListener("resize", handler)
  }, [breakpoint])
  return isMobile
}

// ── Types ─────────────────────────────────────────────────────────────────────

type ContentMeta = "image" | "video" | "code" | "file" | "link" | "audio"

type DiscoveryCategory =
  | "technology"
  | "business"
  | "culture"
  | "society"
  | "politics"
  | "science"
  | "health"
  | "life"
  | "philosophy"
  | "history"
  | "art"
  | "fiction"
  | "poetry"

type SpurPost = {
  id: string
  slug: string
  title: string
  excerpt: string | null
  thumbnail: string | null
  tags: string[]
  published_at: string
  like_count: number
  comment_count: number
  reading_time_minutes: number
  content_meta: ContentMeta[]
  discovery_category_slug: string | null
  site_subdomain: string
  site_origin: string
  site_display_name: string
  author_display_name: string | null
  author_avatar_url: string | null
}

type Subcategory = {
  id: string
  name: string
  slug: string
}

type SortMode = "recent" | "hot"

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 12
const META_TYPES: ContentMeta[] = ["image", "video", "code", "file", "link", "audio"]

const FONT = `"DM Sans", "Inter", system-ui, sans-serif`
const FONT_MONO = `"DM Mono", "Fira Code", monospace`

const DARK_C = {
  bg: "#080e1a",
  surface: "#0d1525",
  surfaceHover: "#121d30",
  border: "#1e2d47",
  borderLight: "#162038",
  text: "#e4eaf4",
  muted: "#6080a8",
  dim: "#2a3f5e",
  accent: "#f29106",
  accentHover: "#ffaa2e",
  accentDim: "#f2910620",
  green: "#2dd98a",
  greenDim: "#2dd98a20",
  yellow: "#f5c842",
  yellowDim: "#f5c84220",
  blue: "#4a9eff",
  blueDim: "#4a9eff20",
}

const LIGHT_C = {
  bg: "#f5f7fa",
  surface: "#ffffff",
  surfaceHover: "#eef1f6",
  border: "#bfcfe8",
  borderLight: "#d4e0f0",
  text: "#0e1825",
  muted: "#4a6a96",
  dim: "#8aaace",
  accent: "#d97c00",
  accentHover: "#bf6d00",
  accentDim: "rgba(217,124,0,0.08)",
  green: "#16a34a",
  greenDim: "rgba(22,163,74,0.1)",
  yellow: "#ca8a04",
  yellowDim: "rgba(202,138,4,0.1)",
  blue: "#2563eb",
  blueDim: "rgba(37,99,235,0.1)",
}

// C is set dynamically in SpurAppRoutes based on darkMode state
let C = DARK_C

const META_COLORS: Record<ContentMeta, string> = {
  image: "#4a9eff",
  video: "#e040a0",
  code:  "#2dd98a",
  file:  "#f5c842",
  link:  "#c084fc",
  audio: "#fb923c",
}

const DISCOVERY_CATEGORIES: Array<{ value: "all" | DiscoveryCategory; label: string; slug: string }> = [
  { value: "all",        label: "All",        slug: "" },
  { value: "technology", label: "Technology", slug: "technology" },
  { value: "business",   label: "Business",   slug: "business" },
  { value: "culture",    label: "Culture",    slug: "culture" },
  { value: "society",    label: "Society",    slug: "society" },
  { value: "politics",   label: "Politics",   slug: "politics" },
  { value: "science",    label: "Science",    slug: "science" },
  { value: "health",     label: "Health",     slug: "health" },
  { value: "life",       label: "Life",       slug: "life" },
  { value: "philosophy", label: "Philosophy", slug: "philosophy" },
  { value: "history",    label: "History",    slug: "history" },
  { value: "art",        label: "Art",        slug: "art" },
  { value: "fiction",    label: "Fiction",    slug: "fiction" },
  { value: "poetry",     label: "Poetry",     slug: "poetry" },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function postHref(post: SpurPost): string {
  const base = post.site_origin === "sheriffcloud"
    ? `https://${post.site_subdomain}.sheriffcloud.com`
    : `https://${post.site_subdomain}.spur.ink`
  return `${base}/blog/${post.slug}`
}

function hotScore(post: SpurPost): number {
  const ageHours = (Date.now() - new Date(post.published_at).getTime()) / 3_600_000
  const score = post.like_count + post.comment_count * 2
  return score / Math.pow(ageHours + 2, 0.8)
}

function extractContentMetaKeys(meta: any): ContentMeta[] {
  if (!meta || typeof meta !== "object") return []
  const map: Record<string, ContentMeta> = {
    has_images: "image", has_image:  "image",
    has_videos: "video", has_video:  "video",
    has_code:   "code",
    has_files:  "file",  has_file:   "file",
    has_links:  "link",  has_link:   "link",
    has_audios: "audio", has_audio:  "audio",
  }
  const result = new Set<ContentMeta>()
  for (const [key, val] of Object.entries(meta)) {
    if (val && map[key]) result.add(map[key])
  }
  return [...result]
}

// ── Supabase queries ──────────────────────────────────────────────────────────

async function fetchAuthorMap(
  authorIds: string[]
): Promise<Map<string, { display_name: string | null; avatar_url: string | null }>> {
  if (authorIds.length === 0) return new Map()
  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, username, avatar_url")
    .in("id", authorIds)
  const map = new Map<string, { display_name: string | null; avatar_url: string | null }>()
  for (const row of data ?? []) {
    map.set(row.id, {
      display_name: row.display_name ?? row.username ?? null,
      avatar_url:   row.avatar_url ?? null,
    })
  }
  return map
}

async function fetchParentSlugMap(categoryIds: string[]): Promise<Map<string, string>> {
  if (categoryIds.length === 0) return new Map()
  const { data: subcats } = await supabase
    .from("spur_discovery_categories")
    .select("id, slug, parent_id")
    .in("id", categoryIds)
  const rows = subcats ?? []
  const parentIds = [...new Set(rows.map((r: any) => r.parent_id).filter(Boolean))] as string[]
  let parentSlugById: Record<string, string> = {}
  if (parentIds.length > 0) {
    const { data: parents } = await supabase
      .from("spur_discovery_categories")
      .select("id, slug")
      .in("id", parentIds)
    for (const p of parents ?? []) parentSlugById[p.id] = p.slug
  }
  const map = new Map<string, string>()
  for (const row of rows) {
    map.set(row.id, row.parent_id ? (parentSlugById[row.parent_id] ?? row.slug) : row.slug)
  }
  return map
}

async function fetchSubcategories(parentSlug: string): Promise<Subcategory[]> {
  const { data: parent } = await supabase
    .from("spur_discovery_categories")
    .select("id")
    .eq("slug", parentSlug)
    .is("parent_id", null)
    .maybeSingle()

  if (!parent) return []

  const { data } = await supabase
    .from("spur_discovery_categories")
    .select("id, name, slug")
    .eq("parent_id", parent.id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  return data ?? []
}

async function fetchSubcategoryIds(parentSlug: string): Promise<string[]> {
  const { data: parent } = await supabase
    .from("spur_discovery_categories")
    .select("id")
    .eq("slug", parentSlug)
    .is("parent_id", null)
    .maybeSingle()

  if (!parent) return []

  const { data } = await supabase
    .from("spur_discovery_categories")
    .select("id")
    .eq("parent_id", parent.id)
    .eq("is_active", true)

  return (data ?? []).map((r: any) => r.id)
}

function buildPosts(
  rows: any[],
  authorMap: Map<string, { display_name: string | null; avatar_url: string | null }>,
  parentSlugMap: Map<string, string>
): SpurPost[] {
  return rows.map((row: any) => {
    const author = authorMap.get(row.author_id)
    return {
      id:                      row.id,
      slug:                    row.slug,
      title:                   row.title,
      excerpt:                 row.excerpt ?? null,
      thumbnail:               row.thumbnail_url ?? null,
      tags:                    row.tags ?? [],
      published_at:            row.published_at,
      like_count:              row.like_count ?? 0,
      comment_count:           row.comment_count ?? 0,
      reading_time_minutes:    row.reading_time_minutes ?? 1,
      content_meta:            extractContentMetaKeys(row.content_meta),
      discovery_category_slug: row.discovery_category_id
        ? (parentSlugMap.get(row.discovery_category_id) ?? null)
        : null,
      site_subdomain:          row.sites?.subdomain ?? "",
      site_origin:             row.sites?.site_origin ?? "spur",
      site_display_name:       row.sites?.name ?? "",
      author_display_name:     author?.display_name ?? null,
      author_avatar_url:       author?.avatar_url ?? null,
    }
  })
}

async function fetchPosts(opts: {
  category: DiscoveryCategory | "all"
  subcategoryId: string | null
  sort: SortMode
  offset: number
}): Promise<SpurPost[]> {
  let query = supabase
    .from("spur_posts")
    .select(`
      id,
      slug,
      author_id,
      title,
      excerpt,
      thumbnail_url,
      tags,
      published_at,
      like_count,
      comment_count,
      reading_time_minutes,
      content_meta,
      discovery_category_id,
      sites!inner ( subdomain, name, site_origin )
    `)
    .eq("status", "published")
    .eq("is_in_discovery", true)
    .order("published_at", { ascending: false })
    .range(opts.offset, opts.offset + PAGE_SIZE - 1)

  if (opts.subcategoryId) {
    query = query.eq("discovery_category_id", opts.subcategoryId)
  } else if (opts.category !== "all") {
    const subcatIds = await fetchSubcategoryIds(opts.category)
    if (subcatIds.length > 0) {
      query = query.in("discovery_category_id", subcatIds)
    } else {
      return []
    }
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const rows = data ?? []
  const categoryIds = [...new Set(rows.map((r: any) => r.discovery_category_id).filter(Boolean))] as string[]
  const parentSlugMap = await fetchParentSlugMap(categoryIds)
  const authorIds = [...new Set(rows.map((r: any) => r.author_id).filter(Boolean))] as string[]
  const authorMap = await fetchAuthorMap(authorIds)
  return buildPosts(rows, authorMap, parentSlugMap)
}

async function fetchTrending(): Promise<SpurPost[]> {
  const { data, error } = await supabase
    .from("spur_posts")
    .select(`
      id,
      slug,
      author_id,
      title,
      excerpt,
      thumbnail_url,
      tags,
      published_at,
      like_count,
      comment_count,
      reading_time_minutes,
      content_meta,
      discovery_category_id,
      sites!inner ( subdomain, name, site_origin )
    `)
    .eq("status", "published")
    .eq("is_in_discovery", true)
    .order("like_count", { ascending: false })
    .limit(5)

  if (error) return []
  const rows = data ?? []
  const categoryIds = [...new Set(rows.map((r: any) => r.discovery_category_id).filter(Boolean))] as string[]
  const parentSlugMap = await fetchParentSlugMap(categoryIds)
  const authorIds = [...new Set(rows.map((r: any) => r.author_id).filter(Boolean))] as string[]
  const authorMap = await fetchAuthorMap(authorIds)
  return buildPosts(rows, authorMap, parentSlugMap)
}

async function fetchFeaturedSerial(): Promise<{
  id: string
  slug: string
  title: string
  tagline: string | null
  cover_image_url: string | null
  chapter_count: number
  site_subdomain: string
  site_origin: string
  author_display_name: string | null
  author_avatar_url: string | null
} | null> {
  const { data, error } = await supabase
    .from("spur_serials")
    .select(`
      id,
      title,
      tagline,
      slug,
      cover_image_url,
      author_id,
      sites!inner ( subdomain, site_origin )
    `)
    .in("status", ["ongoing", "completed"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null

  const { count } = await supabase
    .from("spur_posts")
    .select("id", { count: "exact", head: true })
    .eq("serial_id", data.id)
    .eq("status", "published")

  const { data: authorProfile } = await supabase
    .from("profiles")
    .select("display_name, username, avatar_url")
    .eq("id", (data as any).author_id)
    .maybeSingle()

  return {
    id:              data.id,
    slug:            data.slug,
    title:           data.title,
    tagline:         data.tagline ?? null,
    cover_image_url: data.cover_image_url ?? null,
    chapter_count:   count ?? 0,
    site_subdomain:  (data.sites as any)?.subdomain ?? "",
    site_origin:     (data.sites as any)?.site_origin ?? "spur",
    author_display_name: authorProfile?.display_name ?? authorProfile?.username ?? null,
    author_avatar_url:   authorProfile?.avatar_url ?? null,
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MetaFilterBtn({
  type,
  active,
  onClick,
}: {
  type: ContentMeta
  active: boolean
  onClick: () => void
}) {
  const color = META_COLORS[type]
  return (
    <button
      type="button"
      onClick={onClick}
      title={type}
      style={{
        width: 34,
        height: 34,
        borderRadius: 8,
        border: `1px solid ${active ? color + "88" : color + "33"}`,
        background: active ? color + "22" : color + "0d",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        flexShrink: 0,
        transition: "all 0.12s",
      }}
    >
      <Icon name={type} size={16} color={active ? color : color + "88"} />
    </button>
  )
}

function AuthorChip({
  displayName,
  avatarUrl,
  size = "sm",
}: {
  displayName: string | null
  avatarUrl: string | null
  size?: "sm" | "xs"
}) {
  const dim = size === "xs" ? 18 : 22
  const fs  = size === "xs" ? 9  : 10
  const initials = (displayName ?? "?")
    .split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: size === "xs" ? 5 : 7,
        fontSize: size === "xs" ? 11 : 12,
        fontWeight: 700,
        color: C.muted,
        fontFamily: FONT,
      }}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt={displayName ?? ""} style={{ width: dim, height: dim, borderRadius: "50%", objectFit: "cover" }} />
      ) : (
        <span
          style={{
            width: dim, height: dim, borderRadius: "50%",
            background: C.border, display: "inline-flex",
            alignItems: "center", justifyContent: "center",
            fontSize: fs, fontWeight: 700, color: C.muted, flexShrink: 0,
          }}
        >
          {initials}
        </span>
      )}
      {displayName ?? "Unknown"}
    </span>
  )
}

function CategoryLabel({ category }: { category: string | null }) {
  if (!category) return null
  const label = DISCOVERY_CATEGORIES.find((c) => c.value === category)?.label ?? category
  return (
    <span style={{ fontSize: 10, fontWeight: 700, fontFamily: FONT_MONO, color: C.accent, letterSpacing: "0.07em", textTransform: "uppercase" }}>
      {label}
    </span>
  )
}

function StatChip({ icon, value, accent }: { icon: "heart" | "comments"; value: number; accent?: boolean }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: accent ? C.accent : C.muted, fontFamily: FONT }}>
      <Icon name={icon} size={13} color={accent ? C.accent : C.muted} />
      {value}
    </span>
  )
}

function ThumbPlaceholder({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 640 640" width={size} height={size} fill={C.dim} style={{ opacity: 0.4 }}>
      <path d="M64 128C64 92.7 92.7 64 128 64L512 64C547.3 64 576 92.7 576 128L576 512C576 547.3 547.3 576 512 576L128 576C92.7 576 64 547.3 64 512L64 128zM208 176C190.3 176 176 190.3 176 208C176 225.7 190.3 240 208 240C225.7 240 240 225.7 240 208C240 190.3 225.7 176 208 176zM128 432L186.8 351.8C195.2 340.3 211.7 338.4 222.5 348.2L256 380L346.9 271.3C356.9 259.4 374.8 258.5 385.9 269.5L512 395.5L512 480C512 497.7 497.7 512 480 512L160 512C142.3 512 128 497.7 128 480L128 432z" />
    </svg>
  )
}

// ── TopCard — equal sized card for the top 2x2 grid ──────────────────────────

function TopCard({ post }: { post: SpurPost }) {
  const [hovered, setHovered] = useState(false)
  return (
    <a
      href={postHref(post)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? C.surfaceHover : C.surface,
        border: `1px solid ${hovered ? C.border : C.borderLight}`,
        borderRadius: 12, overflow: "hidden", cursor: "pointer",
        transition: "background 0.12s, border-color 0.12s",
        textDecoration: "none", color: "inherit",
        display: "flex", flexDirection: "column",
      }}
    >
      <div style={{ height: 160, background: C.borderLight, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0, position: "relative" }}>
        {post.thumbnail
          ? <img src={post.thumbnail} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <ThumbPlaceholder size={32} />
        }
        {post.content_meta.length > 0 && (
          <div style={{ position: "absolute", bottom: 8, left: 8, display: "flex", gap: 4 }}>
            {post.content_meta.slice(0, 3).map((m) => (
              <span key={m} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: 6, background: "rgba(8,14,26,0.75)", backdropFilter: "blur(4px)" }}>
                <Icon name={m} size={13} color={META_COLORS[m]} />
              </span>
            ))}
          </div>
        )}
      </div>
      <div style={{ padding: "14px 14px 12px", display: "flex", flexDirection: "column", gap: 7, flex: 1 }}>
        <CategoryLabel category={post.discovery_category_slug} />
        <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.25, color: C.text, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {post.title}
        </div>
        {post.excerpt && (
          <div style={{ fontSize: 13, lineHeight: 1.6, color: C.muted, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", flex: 1 }}>
            {post.excerpt}
          </div>
        )}
        <div style={{ borderTop: `1px solid ${C.borderLight}`, paddingTop: 10, marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          <AuthorChip displayName={post.author_display_name} avatarUrl={post.author_avatar_url} size="xs" />
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, color: C.dim, fontFamily: FONT }}>{post.reading_time_minutes} min</span>
            <span style={{ width: 3, height: 3, borderRadius: "50%", background: C.dim, display: "inline-block" }} />
            <StatChip icon="heart" value={post.like_count} accent />
            <StatChip icon="comments" value={post.comment_count} />
          </div>
        </div>
      </div>
    </a>
  )
}

// ── DiscoveryPostCard — matches PostCard layout from site-src ─────────────────

function DiscoveryPostCard({ post }: { post: SpurPost }) {
  const [hovered, setHovered] = useState(false)
  return (
    <a
      href={postHref(post)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", flexDirection: "column",
        background: hovered ? C.surfaceHover : C.surface,
        border: `1px solid ${hovered ? C.border : C.borderLight}`,
        borderRadius: 12, overflow: "hidden", cursor: "pointer",
        transition: "background 0.12s, border-color 0.12s",
        textDecoration: "none", color: "inherit",
      }}
    >
      {/* Thumbnail */}
      <div style={{ aspectRatio: "16/9", background: C.borderLight, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0, position: "relative" }}>
        {post.thumbnail
          ? <img src={post.thumbnail} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
          : <ThumbPlaceholder size={32} />
        }
        {post.content_meta.length > 0 && (
          <div style={{ position: "absolute", bottom: 8, left: 8, display: "flex", gap: 4 }}>
            {post.content_meta.slice(0, 3).map((m) => (
              <span key={m} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: 6, background: "rgba(8,14,26,0.75)", backdropFilter: "blur(4px)" }}>
                <Icon name={m} size={13} color={META_COLORS[m]} />
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "12px 14px 14px", display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
        {/* Tags + meta icons row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, minHeight: 20 }}>
          {post.tags.length > 0 && (
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {post.tags.slice(0, 3).map((t) => (
                <span key={t} style={{ fontSize: 11, fontWeight: 700, color: C.muted, background: C.borderLight, borderRadius: 5, padding: "2px 6px", fontFamily: FONT_MONO }}>
                  #{t}
                </span>
              ))}
            </div>
          )}
          {post.content_meta.length > 0 && (
            <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
              {post.content_meta.slice(0, 3).map((m) => (
                <span key={m} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: 5, background: META_COLORS[m] + "18" }}>
                  <Icon name={m} size={12} color={META_COLORS[m]} />
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Title */}
        <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.25, color: C.text, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {post.title}
        </div>

        {/* Excerpt */}
        {post.excerpt && (
          <div style={{ fontSize: 13, lineHeight: 1.6, color: C.muted, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", flex: 1 }}>
            {post.excerpt}
          </div>
        )}

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${C.borderLight}`, paddingTop: 10, marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <AuthorChip displayName={post.author_display_name} avatarUrl={post.author_avatar_url} size="xs" />
            <span style={{ width: 3, height: 3, borderRadius: "50%", background: C.dim, display: "inline-block" }} />
            <span style={{ fontSize: 11, color: C.dim, fontFamily: FONT }}>
              {new Date(post.published_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </span>
            <span style={{ width: 3, height: 3, borderRadius: "50%", background: C.dim, display: "inline-block" }} />
            <span style={{ fontSize: 11, color: C.dim, fontFamily: FONT }}>{post.reading_time_minutes} min read</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <StatChip icon="heart" value={post.like_count} accent />
            <StatChip icon="comments" value={post.comment_count} />
          </div>
        </div>
      </div>
    </a>
  )
}

// ── ListRowCard — thumb left, title/excerpt right, full-width footer ──────────

function ListRowCard({ post }: { post: SpurPost }) {
  const [hovered, setHovered] = useState(false)
  return (
    <a
      href={postHref(post)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", flexDirection: "column",
        background: hovered ? C.surface : "transparent",
        border: `1px solid ${hovered ? C.borderLight : "transparent"}`,
        borderRadius: 10, cursor: "pointer",
        transition: "background 0.12s, border-color 0.12s",
        textDecoration: "none", color: "inherit",
        padding: "10px 10px 12px",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "stretch" }}>
        <div style={{ width: 140, flexShrink: 0, borderRadius: 8, overflow: "hidden", alignSelf: "stretch" }}>
          {post.thumbnail
            ? <img src={post.thumbnail} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            : <div style={{ width: "100%", height: "100%", minHeight: 90, background: C.borderLight, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8 }}><ThumbPlaceholder size={24} /></div>
          }
        </div>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 5 }}>
          <CategoryLabel category={post.discovery_category_slug} />
          <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.25, color: C.text, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {post.title}
          </div>
          {post.excerpt && (
            <div style={{ fontSize: 12, lineHeight: 1.55, color: C.muted, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {post.excerpt}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, borderTop: `1px solid ${C.borderLight}`, paddingTop: 8, flexWrap: "wrap" }}>
        <AuthorChip displayName={post.author_display_name} avatarUrl={post.author_avatar_url} size="xs" />
        <span style={{ width: 3, height: 3, borderRadius: "50%", background: C.dim, display: "inline-block" }} />
        <span style={{ fontSize: 11, color: C.dim, fontFamily: FONT }}>
          {new Date(post.published_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </span>
        <span style={{ width: 3, height: 3, borderRadius: "50%", background: C.dim, display: "inline-block" }} />
        <span style={{ fontSize: 11, color: C.dim, fontFamily: FONT }}>{post.reading_time_minutes} min</span>
        {post.content_meta.slice(0, 2).map((m) => (
          <span key={m} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: 5, background: META_COLORS[m] + "18" }}>
            <Icon name={m} size={12} color={META_COLORS[m]} />
          </span>
        ))}
        <span style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <StatChip icon="heart" value={post.like_count} accent />
          <StatChip icon="comments" value={post.comment_count} />
        </span>
      </div>
    </a>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function Sidebar({
  trending,
  serial,
  onStartWriting,
}: {
  trending: SpurPost[]
  serial: Awaited<ReturnType<typeof fetchFeaturedSerial>>
  onStartWriting: () => void
}) {
  return (
    <div style={{ padding: "20px 0 20px 24px", display: "flex", flexDirection: "column", gap: 28 }}>

      {trending.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, fontFamily: FONT_MONO, color: C.dim, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
            Trending Today
          </div>
          {trending.map((post, i) => (
            <a
              key={post.id}
              href={postHref(post)}
              style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", borderBottom: i < trending.length - 1 ? `1px solid ${C.borderLight}` : "none", textDecoration: "none", color: "inherit" }}
            >
              <span style={{ fontSize: 18, fontWeight: 900, color: C.borderLight, letterSpacing: "-0.04em", width: 22, flexShrink: 0, lineHeight: 1, paddingTop: 1 }}>
                {i + 1}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, lineHeight: 1.3, letterSpacing: "-0.02em", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {post.title}
                </div>
                <div style={{ fontSize: 11, color: C.dim, marginTop: 3, fontFamily: FONT_MONO }}>
                  {post.discovery_category_slug ?? "—"} · ♥ {post.like_count}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      {serial && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, fontFamily: FONT_MONO, color: C.dim, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
            Serial Spotlight
          </div>
          <a
            href={
              serial.site_origin === "sheriffcloud"
                ? `https://${serial.site_subdomain}.sheriffcloud.com/blog/serial/${serial.slug}`
                : `https://${serial.site_subdomain}.spur.ink/blog/serial/${serial.slug}`
            }
            style={{ display: "block", background: C.surface, border: `1px solid ${C.borderLight}`, borderRadius: 12, overflow: "hidden", textDecoration: "none", color: "inherit" }}
          >
            {serial.cover_image_url ? (
              <div style={{ display: "flex", gap: 14, padding: 14 }}>
                <img
                  src={serial.cover_image_url}
                  alt={serial.title}
                  style={{ width: 80, flexShrink: 0, borderRadius: 6, border: `1px solid ${C.border}`, display: "block", objectFit: "cover", aspectRatio: "2/3" }}
                />
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6, paddingTop: 2 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, fontFamily: FONT_MONO, color: C.accent, background: "rgba(242,145,6,0.12)", border: `1px solid rgba(242,145,6,0.25)`, padding: "2px 7px", borderRadius: 5, letterSpacing: "0.06em", textTransform: "uppercase", alignSelf: "flex-start" }}>
                    Serial
                  </span>
                  <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: "-0.03em", color: C.text, lineHeight: 1.2 }}>
                    {serial.title}
                  </div>
                  {serial.tagline && (
                    <div style={{ fontSize: 12, lineHeight: 1.5, color: C.muted, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {serial.tagline}
                    </div>
                  )}
                  {serial.author_display_name && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: "auto" }}>
                      {serial.author_avatar_url ? (
                        <img src={serial.author_avatar_url} alt={serial.author_display_name} style={{ width: 18, height: 18, borderRadius: "50%", objectFit: "cover" }} />
                      ) : (
                        <span style={{ width: 18, height: 18, borderRadius: "50%", background: C.border, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: C.muted, flexShrink: 0 }}>
                          {serial.author_display_name[0].toUpperCase()}
                        </span>
                      )}
                      <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, fontFamily: FONT }}>{serial.author_display_name}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, height: 3, background: C.borderLight, borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ height: "100%", background: C.accent, width: "45%", borderRadius: 99 }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, fontFamily: FONT_MONO, color: C.dim, whiteSpace: "nowrap" }}>
                      {serial.chapter_count} ch.
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div style={{ height: 56, background: `linear-gradient(135deg, ${C.accentDim} 0%, rgba(242,145,6,0.04) 100%)`, borderBottom: `1px solid ${C.borderLight}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, fontFamily: FONT_MONO, color: C.accent, background: "rgba(242,145,6,0.12)", border: `1px solid rgba(242,145,6,0.25)`, padding: "3px 9px", borderRadius: 5, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    Serial
                  </span>
                </div>
                <div style={{ padding: "12px 14px" }}>
                  <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: "-0.03em", color: C.text, marginBottom: 5 }}>{serial.title}</div>
                  {serial.tagline && (
                    <div style={{ fontSize: 12, lineHeight: 1.6, color: C.muted, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", marginBottom: 8 }}>
                      {serial.tagline}
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, height: 3, background: C.borderLight, borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ height: "100%", background: C.accent, width: "45%", borderRadius: 99 }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, fontFamily: FONT_MONO, color: C.dim, whiteSpace: "nowrap" }}>
                      {serial.chapter_count} chapter{serial.chapter_count !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </>
            )}
          </a>
        </div>
      )}

      <div style={{ background: `linear-gradient(135deg, rgba(242,145,6,0.08) 0%, rgba(242,145,6,0.02) 100%)`, border: `1px solid rgba(242,145,6,0.15)`, borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontSize: 15, fontWeight: 900, letterSpacing: "-0.03em", color: C.text, lineHeight: 1.2 }}>Make your blog. Get seen.</div>
        <div style={{ fontSize: 12, lineHeight: 1.6, color: C.muted }}>Free subdomain. Zero paywalls in discovery. Your site stays yours.</div>
        <button
          type="button"
          onClick={onStartWriting}
          style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 8, padding: "9px 14px", fontSize: 13, fontWeight: 800, cursor: "pointer", width: "100%", fontFamily: FONT }}
        >
          Start Writing Free →
        </button>
      </div>
    </div>
  )
}

// ── CategoryRail ──────────────────────────────────────────────────────────────

function CategoryRail({ activeCategory, darkMode }: { activeCategory: "all" | DiscoveryCategory; darkMode: boolean }) {
  const isMobile = useIsMobile()
  const bg = darkMode ? "rgba(8,14,26,0.95)" : "rgba(245,247,250,0.95)"
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 10, background: bg, backdropFilter: "blur(10px)", borderBottom: `1px solid ${C.borderLight}` }}>
      <div
        onWheel={(e) => {
          const el = e.currentTarget
          if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { el.scrollLeft += e.deltaY; e.preventDefault() }
        }}
        style={{ maxWidth: 1180, margin: "0 auto", padding: "10px 24px", display: "flex", alignItems: "center", gap: 6, overflowX: "auto", overflowY: "hidden", flexWrap: "nowrap", scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
      >
        {DISCOVERY_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.value
          const to = cat.slug ? `/c/${cat.slug}` : "/"
          return (
            <Link
              key={cat.value}
              to={to}
              style={{
                flex: isMobile ? "0 0 auto" : "1 1 0", display: "inline-flex", alignItems: "center", justifyContent: "center",
                padding: "6px 8px", borderRadius: 8,
                border: `1px solid ${isActive ? C.accent + "55" : C.borderLight}`,
                background: isActive ? C.accentDim : C.surface,
                color: isActive ? C.accent : C.muted,
                fontSize: 13, fontWeight: 700, fontFamily: FONT,
                whiteSpace: "nowrap", textDecoration: "none", transition: "all 0.15s",
                textAlign: "center",
              }}
            >
              {cat.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

// ── SubcategoryRail ───────────────────────────────────────────────────────────

function SubcategoryRail({
  subcategories,
  activeSubcategorySlug,
  categorySlug,
  darkMode,
}: {
  subcategories: Subcategory[]
  activeSubcategorySlug: string | null
  categorySlug: string
  darkMode: boolean
}) {
  const isMobile = useIsMobile()
  const bg = darkMode ? "rgba(8,14,26,0.95)" : "rgba(245,247,250,0.95)"
  if (subcategories.length === 0) return null
  return (
    <div style={{ borderBottom: `1px solid ${C.borderLight}`, background: bg }}>
      <div
        onWheel={(e) => {
          const el = e.currentTarget
          if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { el.scrollLeft += e.deltaY; e.preventDefault() }
        }}
        style={{ maxWidth: 1180, margin: "0 auto", padding: "10px 24px", display: "flex", alignItems: "center", gap: 6, overflowX: "auto", overflowY: "hidden", flexWrap: "nowrap", scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
      >
        <Link
          to={`/c/${categorySlug}`}
          style={{
            flex: isMobile ? "0 0 auto" : "1 1 0", display: "inline-flex", alignItems: "center", justifyContent: "center",
            padding: "6px 8px", borderRadius: 8,
            border: `1px solid ${!activeSubcategorySlug ? C.accent + "55" : C.borderLight}`,
            background: !activeSubcategorySlug ? C.accentDim : C.surface,
            color: !activeSubcategorySlug ? C.accent : C.muted,
            fontSize: 13, fontWeight: 700, fontFamily: FONT,
            whiteSpace: "nowrap", textDecoration: "none", transition: "all 0.15s",
            textAlign: "center",
          }}
        >
          All
        </Link>
        {subcategories.map((sub) => {
          const isActive = activeSubcategorySlug === sub.slug
          return (
            <Link
              key={sub.id}
              to={`/c/${categorySlug}/${sub.slug}`}
              style={{
                flex: isMobile ? "0 0 auto" : "1 1 0", display: "inline-flex", alignItems: "center", justifyContent: "center",
                padding: "6px 8px", borderRadius: 8,
                border: `1px solid ${isActive ? C.accent + "55" : C.borderLight}`,
                background: isActive ? C.accentDim : C.surface,
                color: isActive ? C.accent : C.muted,
                fontSize: 13, fontWeight: 700, fontFamily: FONT,
                whiteSpace: "nowrap", textDecoration: "none", transition: "all 0.15s",
                textAlign: "center",
              }}
            >
              {sub.name}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

// ── FeedPanel — shared feed logic used by both DiscoveryPage and CategoryPage ──

function FeedPanel({
  category,
  subcategoryId,
  sort,
  setSort,
  catLabel,
  onStartWriting,
  trending,
  serial,
}: {
  category: DiscoveryCategory | "all"
  subcategoryId: string | null
  sort: SortMode
  setSort: (s: SortMode) => void
  catLabel: string
  onStartWriting: () => void
  trending: SpurPost[]
  serial: Awaited<ReturnType<typeof fetchFeaturedSerial>>
}) {
  const [activeMetaFilters, setActiveMetaFilters] = useState<Set<ContentMeta>>(new Set())
  const [posts, setPosts] = useState<SpurPost[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const isMobile = useIsMobile()
  const offsetRef = useRef(0)

  useEffect(() => {
    let cancelled = false
    offsetRef.current = 0
    setLoading(true)
    setFetchError(null)
    setPosts([])
    setHasMore(true)
    setActiveMetaFilters(new Set())

    fetchPosts({ category, subcategoryId, sort, offset: 0 }).then((data) => {
      if (cancelled) return
      const sorted = sort === "hot" ? [...data].sort((a, b) => hotScore(b) - hotScore(a)) : data
      setPosts(sorted)
      setHasMore(data.length === PAGE_SIZE)
      offsetRef.current = PAGE_SIZE
      setLoading(false)
    }).catch((err: unknown) => {
      if (cancelled) return
      setFetchError(String(err))
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [category, subcategoryId, sort])

  async function loadMore() {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const data = await fetchPosts({ category, subcategoryId, sort, offset: offsetRef.current })
      const sorted = sort === "hot" ? [...data].sort((a, b) => hotScore(b) - hotScore(a)) : data
      setPosts((prev) => [...prev, ...sorted])
      setHasMore(data.length === PAGE_SIZE)
      offsetRef.current += PAGE_SIZE
    } catch (_) {}
    setLoadingMore(false)
  }

  function toggleMetaFilter(type: ContentMeta) {
    setActiveMetaFilters((prev) => {
      const next = new Set(prev)
      next.has(type) ? next.delete(type) : next.add(type)
      return next
    })
  }

  const availableMetaTypes = META_TYPES.filter((type) => posts.some((p) => p.content_meta.includes(type)))
  const filteredPosts = activeMetaFilters.size === 0
    ? posts
    : posts.filter((p) => [...activeMetaFilters].every((t) => p.content_meta.includes(t)))

  const topPosts = filteredPosts.slice(0, 6)
  const morePosts = filteredPosts.slice(6)

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 280px", gap: 0 }}>
      <div style={{ padding: isMobile ? "20px 0 48px" : "20px 24px 48px 0", borderRight: isMobile ? "none" : `1px solid ${C.borderLight}` }}>
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, fontFamily: FONT_MONO, color: C.accent, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
                {category === "all" ? "Discover on Spur" : `${catLabel} on Spur`}
              </div>
              <h2 style={{ fontSize: "clamp(22px, 3vw, 32px)", lineHeight: 1.05, letterSpacing: "-0.05em", fontWeight: 900, color: C.text }}>
                Writing worth clicking
              </h2>
            </div>
            <div style={{ display: "flex", gap: 4, background: C.surface, border: `1px solid ${C.borderLight}`, borderRadius: 10, padding: 4 }}>
              {(["recent", "hot"] as SortMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSort(mode)}
                  style={{ padding: "7px 14px", borderRadius: 7, border: "none", background: sort === mode ? C.accent : "transparent", color: sort === mode ? "#fff" : C.muted, fontSize: 13, fontWeight: 700, fontFamily: FONT, cursor: "pointer", transition: "all 0.15s" }}
                >
                  {mode === "recent" ? "Recent" : "🔥 Hot"}
                </button>
              ))}
            </div>
          </div>

          {availableMetaTypes.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, fontWeight: 700, fontFamily: FONT_MONO, color: C.dim, letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                Filter by type
              </span>
              {availableMetaTypes.map((type) => (
                <MetaFilterBtn
                  key={type}
                  type={type}
                  active={activeMetaFilters.has(type)}
                  onClick={() => toggleMetaFilter(type)}
                />
              ))}
              {activeMetaFilters.size > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveMetaFilters(new Set())}
                  style={{ fontSize: 12, fontWeight: 700, color: C.muted, background: "transparent", border: "none", cursor: "pointer", fontFamily: FONT, padding: "0 4px" }}
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 280, color: C.muted, fontSize: 14 }}>
            Loading posts…
          </div>
        ) : fetchError ? (
          <div style={{ padding: 24, borderRadius: 12, border: `1px solid #ff5f5640`, background: "#ff5f5610", color: "#ff5f56", fontSize: 12, fontFamily: FONT_MONO, wordBreak: "break-all", lineHeight: 1.6 }}>
            {fetchError}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div style={{ minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 12, border: `1px solid ${C.borderLight}`, background: C.surface, color: C.muted, fontSize: 15 }}>
            No posts match those filters.
          </div>
        ) : (
          <>
            {topPosts.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, marginBottom: 8 }}>
                {topPosts.map((p) => <TopCard key={p.id} post={p} />)}
              </div>
            )}
            {morePosts.length > 0 && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 0 12px" }}>
                  <div style={{ flex: 1, height: 1, background: C.borderLight }} />
                  <span style={{ fontSize: 11, fontWeight: 700, fontFamily: FONT_MONO, color: C.dim, letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                    More Posts
                  </span>
                  <div style={{ flex: 1, height: 1, background: C.borderLight }} />
                </div>
                {isMobile ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
                    {morePosts.map((p) => <DiscoveryPostCard key={p.id} post={p} />)}
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                    {morePosts.map((p) => <ListRowCard key={p.id} post={p} />)}
                  </div>
                )}
              </>
            )}
            {hasMore && (
              <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 22px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: loadingMore ? C.dim : C.text, fontSize: 14, fontWeight: 700, fontFamily: FONT, cursor: loadingMore ? "default" : "pointer", transition: "all 0.15s" }}
                >
                  {loadingMore ? "Loading…" : "Load more"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
      {!isMobile && <Sidebar trending={trending} serial={serial} onStartWriting={onStartWriting} />}
    </div>
  )
}

// ── DiscoveryPage ─────────────────────────────────────────────────────────────

function DiscoveryPage({
  category,
  onStartWriting,
  onNewPost,
  onNewBlog,
  onDashboard,
  canCreateBlog,
  darkMode,
  onToggleTheme,
}: {
  category: "all" | DiscoveryCategory
  onStartWriting: () => void
  onNewPost: () => void
  onNewBlog: () => void
  onDashboard: () => void
  canCreateBlog: boolean
  darkMode: boolean
  onToggleTheme: () => void
}) {
  const [sort, setSort] = useState<SortMode>("recent")
  const [trending, setTrending] = useState<SpurPost[]>([])
  const [serial, setSerial] = useState<Awaited<ReturnType<typeof fetchFeaturedSerial>>>(null)
  const [heroCollapsed, setHeroCollapsed] = useState(true)
  const isMobile = useIsMobile()

  useEffect(() => {
    fetchTrending().then(setTrending)
    fetchFeaturedSerial().then(setSerial)
  }, [])

  const catLabel = DISCOVERY_CATEGORIES.find((c) => c.value === category)?.label ?? "All"

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: FONT }}>
      <SpurHeader
        onStartWriting={onStartWriting}
        onNewPost={onNewPost}
        onNewBlog={onNewBlog}
        onDashboard={onDashboard}
        canCreateBlog={canCreateBlog}
        colors={C}
        font={FONT}
        fontMono={FONT_MONO}
        darkMode={darkMode}
        onToggleTheme={onToggleTheme}
      />
      <main>
        {heroCollapsed ? (
          <div style={{ borderBottom: `1px solid ${C.borderLight}`, background: C.surface }}>
            <div style={{ maxWidth: 1180, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.04em", color: C.text, lineHeight: 1 }}>
                  Spur<span style={{ color: C.accent }}>.</span>
                </div>
                <div style={{ fontSize: 13, color: C.muted, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  Discovery-first blogging. Write, get seen, build your hub.
                </div>
              </div>
              {!isMobile && (
                <div style={{ display: "flex", gap: 20 }}>
                  {[
                    { icon: "🔍", label: "Built-in discovery" },
                    { icon: "🔒", label: "Your blog stays yours" },
                    { icon: "⚡", label: "Zero paywalls" },
                  ].map((item) => (
                    <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: C.muted }}>
                      <span style={{ fontSize: 14 }}>{item.icon}</span>
                      {item.label}
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => setHeroCollapsed(false)}
                  style={{ fontSize: 12, fontWeight: 700, color: C.dim, background: "transparent", border: "none", cursor: "pointer", fontFamily: FONT, whiteSpace: "nowrap", padding: "9px 4px" }}
                >
                  Learn more ↓
                </button>
              </div>
            </div>
          </div>
        ) : (
          <section
            onClick={() => setHeroCollapsed(true)}
            style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 24px 28px", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.15fr) minmax(320px, 0.85fr)", gap: 28, alignItems: "stretch", position: "relative", cursor: "pointer" }}
          >
            <div style={{ background: `linear-gradient(180deg, rgba(242,145,6,0.06) 0%, rgba(242,145,6,0.02) 100%)`, border: `1px solid ${C.borderLight}`, borderRadius: 18, padding: "30px 28px", position: "relative" }}>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setHeroCollapsed(true) }}
                title="Collapse"
                style={{ position: "absolute", top: 14, right: 14, width: 28, height: 28, borderRadius: 7, border: `1px solid ${C.borderLight}`, background: C.surface, color: C.dim, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16, lineHeight: 1, fontWeight: 400, zIndex: 2 }}
              >
                ×
              </button>
              <div style={{ fontSize: 12, fontWeight: 700, fontFamily: FONT_MONO, color: C.accent, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>
                Discovery-first blogging
              </div>
              <h1 style={{ fontSize: "clamp(40px, 7vw, 70px)", lineHeight: 0.95, letterSpacing: "-0.06em", fontWeight: 900, color: C.text, marginBottom: 18 }}>
                Write.<br />Get seen.<br />Build your hub.
              </h1>
              <p style={{ fontSize: 18, lineHeight: 1.75, color: C.muted, maxWidth: 650, marginBottom: 22 }}>
                Spur is a clean blogging platform with built-in discovery. Publish posts people
                actually want to click, then bring them back to your site, your docs, your
                forum, and your world.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 22 }}>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onStartWriting() }}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.accent, color: "#fff", borderRadius: 10, padding: "13px 18px", fontSize: 14, fontWeight: 800, border: "none", fontFamily: FONT, cursor: "pointer" }}
                >
                  Start Writing
                </button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {["Content-aware previews", "Zero paywalls in discovery", "Your blog stays yours"].map((item) => (
                  <span key={item} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 11px", borderRadius: 999, background: C.surface, border: `1px solid ${C.borderLight}`, fontSize: 13, fontWeight: 700, color: C.muted }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.accent, display: "inline-block" }} />
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.borderLight}`, borderRadius: 18, padding: "22px 20px", display: "flex", flexDirection: "column", gap: 18, position: "relative" }}>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setHeroCollapsed(true) }}
                title="Collapse"
                style={{ position: "absolute", top: 14, right: 14, width: 28, height: 28, borderRadius: 7, border: `1px solid ${C.borderLight}`, background: C.bg, color: C.dim, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16, lineHeight: 1, fontWeight: 400, zIndex: 2 }}
              >
                ×
              </button>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, fontFamily: FONT_MONO, color: C.accent, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Why Spur</div>
                <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.04em", marginBottom: 10 }}>Better discovery without turning your blog into platform sludge.</div>
                <div style={{ fontSize: 15, lineHeight: 1.7, color: C.muted }}>Posts stay on your site. Discovery lives on Spur. Readers click through, find your world, and can go deeper.</div>
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {[
                  { title: "See what's inside", text: "Posts show code, audio, image, video, and more before the click." },
                  { title: "Filter instantly",  text: "Readers can narrow the feed by the content types they actually want." },
                  { title: "Bring people home", text: "Your blog is the doorway into your docs, forum, and community." },
                ].map((item) => (
                  <div key={item.title} style={{ padding: "14px 14px 12px", borderRadius: 12, border: `1px solid ${C.borderLight}`, background: "rgba(255,255,255,0.01)" }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 4, letterSpacing: "-0.02em" }}>{item.title}</div>
                    <div style={{ fontSize: 14, lineHeight: 1.65, color: C.muted }}>{item.text}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <CategoryRail activeCategory={category} darkMode={darkMode} />

        <FeedPanel
          category={category}
          subcategoryId={null}
          sort={sort}
          setSort={setSort}
          catLabel={catLabel}
          onStartWriting={onStartWriting}
          trending={trending}
          serial={serial}
        />
      </main>
      <SpurFooter colors={C} />
    </div>
  )
}

// ── CategoryPage ──────────────────────────────────────────────────────────────

function CategoryPage({
  categorySlug,
  subcategorySlug,
  onStartWriting,
  onNewPost,
  onNewBlog,
  onDashboard,
  canCreateBlog,
  darkMode,
  onToggleTheme,
}: {
  categorySlug: string
  subcategorySlug: string | null
  onStartWriting: () => void
  onNewPost: () => void
  onNewBlog: () => void
  onDashboard: () => void
  canCreateBlog: boolean
  darkMode: boolean
  onToggleTheme: () => void
}) {
  const [sort, setSort] = useState<SortMode>("recent")
  const [trending, setTrending] = useState<SpurPost[]>([])
  const [serial, setSerial] = useState<Awaited<ReturnType<typeof fetchFeaturedSerial>>>(null)
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [subcategoryId, setSubcategoryId] = useState<string | null>(null)

  const cat = DISCOVERY_CATEGORIES.find((c) => c.slug === categorySlug)
  const category = (cat?.value ?? "all") as DiscoveryCategory | "all"
  const catLabel = cat?.label ?? categorySlug

  useEffect(() => {
    fetchTrending().then(setTrending)
    fetchFeaturedSerial().then(setSerial)
    fetchSubcategories(categorySlug).then(setSubcategories)
  }, [categorySlug])

  useEffect(() => {
    if (!subcategorySlug || subcategories.length === 0) {
      setSubcategoryId(null)
      return
    }
    const found = subcategories.find((s) => s.slug === subcategorySlug)
    setSubcategoryId(found?.id ?? null)
  }, [subcategorySlug, subcategories])

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: FONT }}>
      <SpurHeader
        onStartWriting={onStartWriting}
        onNewPost={onNewPost}
        onNewBlog={onNewBlog}
        onDashboard={onDashboard}
        canCreateBlog={canCreateBlog}
        colors={C}
        font={FONT}
        fontMono={FONT_MONO}
        darkMode={darkMode}
        onToggleTheme={onToggleTheme}
      />
      <main>
        <CategoryRail activeCategory={category} darkMode={darkMode} />
        <SubcategoryRail
          subcategories={subcategories}
          activeSubcategorySlug={subcategorySlug}
          categorySlug={categorySlug}
          darkMode={darkMode}
        />
        <FeedPanel
          category={category}
          subcategoryId={subcategoryId}
          sort={sort}
          setSort={setSort}
          catLabel={catLabel}
          onStartWriting={onStartWriting}
          trending={trending}
          serial={serial}
        />
      </main>
      <SpurFooter colors={C} />
    </div>
  )
}

// ── CategoryPageWrapper ───────────────────────────────────────────────────────

function CategoryPageWrapper(props: { onStartWriting: () => void; onNewPost: () => void; onNewBlog: () => void; onDashboard: () => void; canCreateBlog: boolean; darkMode: boolean; onToggleTheme: () => void }) {
  const { categorySlug, subcategorySlug } = useParams<{ categorySlug: string; subcategorySlug?: string }>()
  return (
    <CategoryPage
      {...props}
      categorySlug={categorySlug ?? ""}
      subcategorySlug={subcategorySlug ?? null}
    />
  )
}

// ── SpurAppRoutes ─────────────────────────────────────────────────────────────

function SpurAppRoutes() {
  const navigate = useNavigate()
  const [session, setSession] = useState<any>(null)
  const [showAuth, setShowAuth] = useState(false)
  const [ownedSites, setOwnedSites] = useState<any[]>([])
  const [loadingSites, setLoadingSites] = useState(true)
  const [showCreateBlogModal, setShowCreateBlogModal] = useState(false)
  const [entitlements, setEntitlements] = useState<any | null>(null)
  const [loadingEntitlements, setLoadingEntitlements] = useState(true)
  const [continueIntoCreateBlog, setContinueIntoCreateBlog] = useState(false)
  const [showNewPostModal, setShowNewPostModal] = useState(false)
  const [darkMode, setDarkMode] = useState(true)

  C = darkMode ? DARK_C : LIGHT_C

  useEffect(() => {
    document.body.style.background = darkMode ? "#080e1a" : "#f5f7fa"
  }, [darkMode])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, nextSession: any) => {
      setSession(nextSession ?? null)
      if (_event === "SIGNED_IN") {
        const returnTo = sessionStorage.getItem("oauth_return_to")
        if (returnTo) {
          sessionStorage.removeItem("oauth_return_to")
          window.location.replace(returnTo)
        }
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session?.user?.id) {
      setOwnedSites([])
      setShowCreateBlogModal(false)
      setLoadingSites(false)
      return
    }
    let cancelled = false
    ;(async () => {
      setLoadingSites(true)
      const { data, error } = await supabase
        .from("sites")
        .select("*")
        .eq("owner_id", session.user.id)
        .order("created_at", { ascending: false })
      if (cancelled) return
      if (error) { setOwnedSites([]); setLoadingSites(false); return }
      setOwnedSites(data ?? [])
      setLoadingSites(false)
    })()
    return () => { cancelled = true }
  }, [session, entitlements])

  useEffect(() => {
    if (!session?.user?.id) {
      setEntitlements(null)
      setLoadingEntitlements(false)
      return
    }
    let cancelled = false
    ;(async () => {
      setLoadingEntitlements(true)
      const { data } = await supabase
        .from("entitlements")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle()
      if (cancelled) return
      setEntitlements(data ?? null)
      setLoadingEntitlements(false)
    })()
    return () => { cancelled = true }
  }, [session])

  useEffect(() => {
    if (!loadingSites && !loadingEntitlements && continueIntoCreateBlog && session?.user?.id) {
      setContinueIntoCreateBlog(false)
      if (ownedSites.length === 0) setShowCreateBlogModal(true)
    }
  }, [loadingSites, loadingEntitlements, continueIntoCreateBlog, session, ownedSites])

  const primarySite = ownedSites[0] ?? null

  const canCreateBlog = useMemo(() => {
    if (!session) return false
    if (ownedSites.length === 0) return true
    const maxBlogs = entitlements?.max_blogs ?? 1
    return ownedSites.length < maxBlogs
  }, [session, ownedSites, entitlements])

  function handleStartWriting() {
    if (!session) { setShowAuth(true); return }
    if (ownedSites.length === 0) { setShowCreateBlogModal(true); return }
    setShowNewPostModal(true)
  }

  function handleNewPost() {
    if (!session) { setShowAuth(true); return }
    if (ownedSites.length === 0) { setShowCreateBlogModal(true); return }
    setShowNewPostModal(true)
  }

  const sharedProps = {
    onStartWriting: handleStartWriting,
    onNewPost: handleNewPost,
    onNewBlog: () => setShowCreateBlogModal(true),
    onDashboard: () => navigate("/admin"),
    canCreateBlog,
    darkMode,
    onToggleTheme: () => setDarkMode((v) => !v),
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<DiscoveryPage {...sharedProps} category="all" />} />
        <Route path="/c/:categorySlug" element={<CategoryPageWrapper {...sharedProps} />} />
        <Route path="/c/:categorySlug/:subcategorySlug" element={<CategoryPageWrapper {...sharedProps} />} />
        <Route
          path="/pricing"
          element={
            <div style={{ background: C.bg, color: C.text, fontFamily: FONT }}>
              <SpurHeader {...sharedProps} colors={C} font={FONT} fontMono={FONT_MONO} />
              <PricingPage colors={C} />
              <SpurFooter colors={C} />
            </div>
          }
        />
        <Route
          path="/about"
          element={
            <div style={{ background: C.bg, color: C.text, fontFamily: FONT }}>
              <SpurHeader {...sharedProps} colors={C} font={FONT} fontMono={FONT_MONO} />
              <AboutPage colors={C} />
              <SpurFooter colors={C} />
            </div>
          }
        />
        <Route
          path="/contact"
          element={
            <div style={{ background: C.bg, color: C.text, fontFamily: FONT }}>
              <SpurHeader {...sharedProps} colors={C} font={FONT} fontMono={FONT_MONO} />
              <ComingSoonPage colors={C} title="Contact" description="We're working on a contact form. In the meantime, reach us at hello@spur.ink." />
              <SpurFooter colors={C} />
            </div>
          }
        />
        <Route
          path="/careers"
          element={
            <div style={{ background: C.bg, color: C.text, fontFamily: FONT }}>
              <SpurHeader {...sharedProps} colors={C} font={FONT} fontMono={FONT_MONO} />
              <ComingSoonPage colors={C} title="Careers" description="We're a small team building something we believe in. When we're ready to grow, we'll post here." />
              <SpurFooter colors={C} />
            </div>
          }
        />
        <Route
          path="/docs"
          element={
            <div style={{ background: C.bg, color: C.text, fontFamily: FONT }}>
              <SpurHeader {...sharedProps} colors={C} font={FONT} fontMono={FONT_MONO} />
              <ComingSoonPage colors={C} title="Documentation" description="Full documentation for Spur is coming soon. It'll cover everything from getting started to advanced platform features." />
              <SpurFooter colors={C} />
            </div>
          }
        />
        <Route
          path="/forums"
          element={
            <div style={{ background: C.bg, color: C.text, fontFamily: FONT }}>
              <SpurHeader {...sharedProps} colors={C} font={FONT} fontMono={FONT_MONO} />
              <ComingSoonPage colors={C} title="Forums" description="Community forums for Spur writers and readers are on the roadmap. Stay tuned." />
              <SpurFooter colors={C} />
            </div>
          }
        />
        <Route
          path="/privacy"
          element={
            <div style={{ background: C.bg, color: C.text, fontFamily: FONT }}>
              <SpurHeader {...sharedProps} colors={C} font={FONT} fontMono={FONT_MONO} />
              <PrivacyPage colors={C} />
              <SpurFooter colors={C} />
            </div>
          }
        />
        <Route
          path="/terms"
          element={
            <div style={{ background: C.bg, color: C.text, fontFamily: FONT }}>
              <SpurHeader {...sharedProps} colors={C} font={FONT} fontMono={FONT_MONO} />
              <TermsPage colors={C} />
              <SpurFooter colors={C} />
            </div>
          }
        />
        <Route
          path="/cookies"
          element={
            <div style={{ background: C.bg, color: C.text, fontFamily: FONT }}>
              <SpurHeader {...sharedProps} colors={C} font={FONT} fontMono={FONT_MONO} />
              <CookiePage colors={C} />
              <SpurFooter colors={C} />
            </div>
          }
        />
        <Route
          path="/admin"
          element={
            <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: FONT }}>
              <SpurHeader {...sharedProps} colors={C} font={FONT} fontMono={FONT_MONO} />
              {session?.user?.id && primarySite ? (
                <div style={{ height: "calc(100vh - 76px)" }}>
                  <SpurPanel site={primarySite} userId={session.user.id} supabase={supabase} />
                </div>
              ) : (
                <div style={{ minHeight: "calc(100vh - 76px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
                  <div style={{ width: "100%", maxWidth: 680, borderRadius: 18, border: `1px solid ${C.borderLight}`, background: C.surface, padding: "32px 28px", display: "flex", flexDirection: "column", gap: 14, textAlign: "center" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, fontFamily: FONT_MONO, color: C.accent, letterSpacing: "0.08em", textTransform: "uppercase" }}>Dashboard</div>
                    <h1 style={{ fontSize: 34, lineHeight: 1.05, letterSpacing: "-0.04em", fontWeight: 900, color: C.text }}>
                      {session ? "You don't have a blog yet." : "Please log in to open your dashboard."}
                    </h1>
                    <p style={{ fontSize: 15, lineHeight: 1.75, color: C.muted, maxWidth: 560, margin: "0 auto" }}>
                      {session
                        ? "Create your first blog to start publishing posts, organizing categories, and managing everything from your panel."
                        : "Once you're logged in, you'll be able to create a blog and manage your writing from here."}
                    </p>
                    <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap", marginTop: 6 }}>
                      {session ? (
                        <button type="button" onClick={() => setShowCreateBlogModal(true)} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.accent, color: "#fff", borderRadius: 10, padding: "13px 18px", fontSize: 14, fontWeight: 800, border: "none", fontFamily: FONT, cursor: "pointer" }}>
                          Create Your Blog
                        </button>
                      ) : (
                        <button type="button" onClick={() => setShowAuth(true)} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.accent, color: "#fff", borderRadius: 10, padding: "13px 18px", fontSize: 14, fontWeight: 800, border: "none", fontFamily: FONT, cursor: "pointer" }}>
                          Log In
                        </button>
                      )}
                      <button type="button" onClick={() => navigate("/")} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.surface, color: C.text, border: `1px solid ${C.border}`, borderRadius: 10, padding: "13px 18px", fontSize: 14, fontWeight: 700, fontFamily: FONT, cursor: "pointer" }}>
                        Back Home
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          }
        />
      </Routes>

      {session?.user?.id && primarySite && showNewPostModal ? (
        <div onClick={() => setShowNewPostModal(false)} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.62)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "min(920px, 92vw)", height: "min(88vh, 860px)", borderRadius: 18, overflow: "hidden", background: C.bg, border: `1px solid ${C.border}`, boxShadow: "0 30px 100px rgba(0,0,0,0.45)" }}>
            <SpurPostEditor
              post={null}
              siteId={primarySite.id}
              userId={session.user.id}
              supabase={supabase}
              onSaved={() => setShowNewPostModal(false)}
              onCancel={() => setShowNewPostModal(false)}
              theme={{
                bg: C.bg, surface: C.surface, surfaceHov: C.surfaceHover,
                border: C.border, borderLight: C.borderLight,
                text: C.text, muted: C.muted, dim: C.dim,
                accent: C.accent, accentHov: C.accentHover, accentDim: C.accentDim,
                green: C.green, greenDim: C.greenDim,
                yellow: C.yellow, yellowDim: C.yellowDim,
                red: "#ff5f56", redDim: "#ff5f5620",
              }}
              darkMode={true}
              canDraft={true}
              canPublish={true}
              canSchedule={true}
            />
          </div>
        </div>
      ) : null}

      {session?.user?.id ? (
        <CreateBlogModal
          open={showCreateBlogModal}
          userId={session.user.id}
          onClose={() => setShowCreateBlogModal(false)}
          onCreated={(site) => {
            setOwnedSites((prev: any[]) => [site, ...prev])
            setShowCreateBlogModal(false)
          }}
        />
      ) : null}

      {showAuth ? <AuthModal onClose={() => setShowAuth(false)} /> : null}
    </>
  )
}


export default function SpurApp() {
  useEffect(() => {
    document.body.style.margin = "0"
    document.body.style.padding = "0"
    return () => {
      document.body.style.margin = ""
      document.body.style.padding = ""
    }
  }, [])
  return <SpurAppRoutes />
}
