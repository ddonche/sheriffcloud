import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "../../shared/supabase"
import { Icon } from "../spur/Icons"
import SpurHeader from "../spur/components/SpurHeader"
import SpurFooter from "../spur/components/SpurFooter"
import { AuthModal } from "../spur/AuthModal"

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint)
    window.addEventListener("resize", handler)
    return () => window.removeEventListener("resize", handler)
  }, [breakpoint])
  return isMobile
}

// ── Types (copied from SpurApp) ───────────────────────────────────────────────

type ContentMeta = "image" | "video" | "code" | "file" | "link" | "audio"

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

type Profile = {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  tagline: string | null
  social_links: Record<string, string> | null
  created_at: string
}

type Serial = {
  id: string
  slug: string
  title: string
  tagline: string | null
  cover_image_url: string | null
  status: "draft" | "ongoing" | "completed" | "abandoned"
  site_subdomain: string
  site_origin: string
  chapter_count: number
}

// ── Constants (copied from SpurApp) ──────────────────────────────────────────

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

// C is set dynamically based on darkMode state, exactly like SpurApp
let C = DARK_C

const META_COLORS: Record<ContentMeta, string> = {
  image: "#4a9eff",
  video: "#e040a0",
  code:  "#2dd98a",
  file:  "#f5c842",
  link:  "#c084fc",
  audio: "#fb923c",
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function postHref(post: SpurPost): string {
  const base = post.site_origin === "sheriffcloud"
    ? `https://${post.site_subdomain}.sheriffcloud.com`
    : `https://${post.site_subdomain}.spur.ink`
  return `${base}/blog/${post.slug}`
}

function serialHref(s: Serial): string {
  const base = s.site_origin === "sheriffcloud"
    ? `https://${s.site_subdomain}.sheriffcloud.com`
    : `https://${s.site_subdomain}.spur.ink`
  return `${base}/serial/${s.slug}`
}

function memberSince(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", year: "numeric" })
}

function profileInitials(name: string | null): string {
  return (name ?? "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
}

function statusColor(status: Serial["status"]): string {
  if (status === "ongoing")   return C.green
  if (status === "completed") return C.accent
  return C.muted
}

function statusLabel(status: Serial["status"]): string {
  if (status === "ongoing")   return "Ongoing"
  if (status === "completed") return "Complete"
  if (status === "abandoned") return "Abandoned"
  return "Draft"
}

// ── Sub-components (copied exactly from SpurApp) ──────────────────────────────

function ThumbPlaceholder({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 640 640" width={size} height={size} fill={C.dim} style={{ opacity: 0.4 }}>
      <path d="M64 128C64 92.7 92.7 64 128 64L512 64C547.3 64 576 92.7 576 128L576 512C576 547.3 547.3 576 512 576L128 576C92.7 576 64 547.3 64 512L64 128zM208 176C190.3 176 176 190.3 176 208C176 225.7 190.3 240 208 240C225.7 240 240 225.7 240 208C240 190.3 225.7 176 208 176zM128 432L186.8 351.8C195.2 340.3 211.7 338.4 222.5 348.2L256 380L346.9 271.3C356.9 259.4 374.8 258.5 385.9 269.5L512 395.5L512 480C512 497.7 497.7 512 480 512L160 512C142.3 512 128 497.7 128 480L128 432z" />
    </svg>
  )
}

function AuthorChip({ displayName, avatarUrl, size = "sm" }: { displayName: string | null; avatarUrl: string | null; size?: "sm" | "xs" }) {
  const dim = size === "xs" ? 18 : 22
  const fs  = size === "xs" ? 9  : 10
  const initials = (displayName ?? "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: size === "xs" ? 5 : 7, fontSize: size === "xs" ? 11 : 12, fontWeight: 700, color: C.muted, fontFamily: FONT }}>
      {avatarUrl ? (
        <img src={avatarUrl} alt={displayName ?? ""} style={{ width: dim, height: dim, borderRadius: "50%", objectFit: "cover" }} />
      ) : (
        <span style={{ width: dim, height: dim, borderRadius: "50%", background: C.border, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: fs, fontWeight: 700, color: C.muted, flexShrink: 0 }}>
          {initials}
        </span>
      )}
      {displayName ?? "Unknown"}
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

// Exact copy of TopCard from SpurApp
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
        <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.25, color: C.text, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {post.title}
        </div>
        {post.excerpt && (
          <div style={{ fontSize: 13, lineHeight: 1.6, color: C.muted, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", flex: 1 }}>
            {post.excerpt}
          </div>
        )}
        <div style={{ borderTop: `1px solid ${C.borderLight}`, paddingTop: 10, marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
            <AuthorChip displayName={post.author_display_name} avatarUrl={post.author_avatar_url} size="xs" />
            {post.site_display_name && (
              <>
                <span style={{ width: 3, height: 3, borderRadius: "50%", background: C.dim, display: "inline-block", flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: C.accent, fontFamily: FONT_MONO, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.site_display_name}</span>
              </>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
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

// Exact copy of ListRowCard from SpurApp
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
        {post.site_display_name && (
          <>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.accent, fontFamily: FONT_MONO }}>{post.site_display_name}</span>
            <span style={{ width: 3, height: 3, borderRadius: "50%", background: C.dim, display: "inline-block" }} />
          </>
        )}
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

// Serial card using sidebar serial spotlight style from SpurApp
function SerialCard({ serial }: { serial: Serial }) {
  const [hovered, setHovered] = useState(false)
  return (
    <a
      href={serialHref(serial)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "block",
        background: hovered ? C.surfaceHover : C.surface,
        border: `1px solid ${hovered ? C.border : C.borderLight}`,
        borderRadius: 12, overflow: "hidden",
        textDecoration: "none", color: "inherit",
        transition: "background 0.12s, border-color 0.12s",
      }}
    >
      {serial.cover_image_url ? (
        <div style={{ display: "flex", gap: 14, padding: 14 }}>
          <img src={serial.cover_image_url} alt={serial.title} style={{ width: 80, flexShrink: 0, borderRadius: 6, border: `1px solid ${C.border}`, display: "block", objectFit: "cover", aspectRatio: "2/3" }} />
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6, paddingTop: 2 }}>
            <span style={{ fontSize: 10, fontWeight: 700, fontFamily: FONT_MONO, color: statusColor(serial.status), background: statusColor(serial.status) + "18", border: `1px solid ${statusColor(serial.status)}33`, padding: "2px 7px", borderRadius: 5, letterSpacing: "0.06em", textTransform: "uppercase", alignSelf: "flex-start" }}>
              {statusLabel(serial.status)}
            </span>
            <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: "-0.03em", color: C.text, lineHeight: 1.2 }}>{serial.title}</div>
            {serial.tagline && (
              <div style={{ fontSize: 12, lineHeight: 1.5, color: C.muted, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{serial.tagline}</div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: "auto" }}>
              <div style={{ flex: 1, height: 3, background: C.borderLight, borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", background: C.accent, width: serial.status === "completed" ? "100%" : "45%", borderRadius: 99 }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, fontFamily: FONT_MONO, color: C.dim, whiteSpace: "nowrap" }}>{serial.chapter_count} ch.</span>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div style={{ height: 56, background: `linear-gradient(135deg, ${C.accentDim} 0%, rgba(242,145,6,0.04) 100%)`, borderBottom: `1px solid ${C.borderLight}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 10, fontWeight: 700, fontFamily: FONT_MONO, color: C.accent, background: "rgba(242,145,6,0.12)", border: `1px solid rgba(242,145,6,0.25)`, padding: "3px 9px", borderRadius: 5, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {statusLabel(serial.status)}
            </span>
          </div>
          <div style={{ padding: "12px 14px" }}>
            <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: "-0.03em", color: C.text, marginBottom: 5 }}>{serial.title}</div>
            {serial.tagline && (
              <div style={{ fontSize: 12, lineHeight: 1.6, color: C.muted, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", marginBottom: 8 }}>{serial.tagline}</div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, height: 3, background: C.borderLight, borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", background: C.accent, width: serial.status === "completed" ? "100%" : "45%", borderRadius: 99 }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, fontFamily: FONT_MONO, color: C.dim, whiteSpace: "nowrap" }}>{serial.chapter_count} {serial.chapter_count !== 1 ? "chapters" : "chapter"}</span>
            </div>
          </div>
        </>
      )}
    </a>
  )
}

// ── Follow button ─────────────────────────────────────────────────────────────

function FollowButton({ profileId, currentUserId, onLoginRequired }: { profileId: string; currentUserId: string | null; onLoginRequired: () => void }) {
  const [following, setFollowing] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { count } = await supabase.from("spur_follows").select("id", { count: "exact", head: true }).eq("following_id", profileId)
      if (!cancelled) setFollowerCount(count ?? 0)
      if (currentUserId) {
        const { data } = await supabase.from("spur_follows").select("id").eq("follower_id", currentUserId).eq("following_id", profileId).maybeSingle()
        if (!cancelled) setFollowing(!!data)
      }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [profileId, currentUserId])

  async function toggle() {
    if (!currentUserId) { onLoginRequired(); return }
    if (busy) return
    setBusy(true)
    if (following) {
      await supabase.from("spur_follows").delete().eq("follower_id", currentUserId).eq("following_id", profileId)
      setFollowing(false)
      setFollowerCount(c => Math.max(0, c - 1))
    } else {
      await supabase.from("spur_follows").insert({ follower_id: currentUserId, following_id: profileId })
      setFollowing(true)
      setFollowerCount(c => c + 1)
    }
    setBusy(false)
  }

  if (loading) return null

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <button type="button" onClick={toggle} disabled={busy} style={{ padding: "9px 20px", borderRadius: 10, border: following ? `1px solid ${C.border}` : "none", background: following ? "transparent" : C.accent, color: following ? C.muted : "#fff", fontSize: 13, fontWeight: 700, fontFamily: FONT, cursor: busy ? "default" : "pointer", opacity: busy ? 0.6 : 1, transition: "all 0.12s" }}>
        {following ? "Following" : "Follow"}
      </button>
      <span style={{ fontSize: 13, color: C.muted, fontFamily: FONT }}>
        {followerCount.toLocaleString()} {followerCount === 1 ? "follower" : "followers"}
      </span>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function UserProfilePage() {
  const { username } = useParams<{ username: string }>()
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [serials, setSerials] = useState<Serial[]>([])
  const [posts, setPosts] = useState<SpurPost[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [session, setSession] = useState<any>(null)
  const [showAuth, setShowAuth] = useState(false)
  const [darkMode, setDarkMode] = useState<boolean>(() => (localStorage.getItem("sc-theme") ?? "dark") !== "light")
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeTab, setActiveTab] = useState<"posts" | "serials">("posts")

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light")
    localStorage.setItem("sc-theme", darkMode ? "dark" : "light")
  }, [darkMode])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setCurrentUserId(data.session?.user?.id ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      setCurrentUserId(s?.user?.id ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!username) return
    let cancelled = false

    async function load() {
      setLoading(true)

      const { data: prof } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, bio, tagline, social_links, created_at")
        .ilike("username", username!)
        .maybeSingle()

      if (!prof) {
        if (!cancelled) { setNotFound(true); setLoading(false) }
        return
      }
      if (!cancelled) setProfile(prof as Profile)

      const { data: serialRows } = await supabase
        .from("spur_serials")
        .select(`id, slug, title, tagline, cover_image_url, status, sites!inner ( subdomain, site_origin )`)
        .eq("author_id", prof.id)
        .in("status", ["ongoing", "completed"])
        .order("created_at", { ascending: false })

      if (!cancelled && serialRows) {
        const withCounts = await Promise.all(
          serialRows.map(async (s: any) => {
            const { count } = await supabase.from("spur_posts").select("id", { count: "exact", head: true }).eq("serial_id", s.id).eq("status", "published")
            return {
              id: s.id, slug: s.slug, title: s.title,
              tagline: s.tagline ?? null,
              cover_image_url: s.cover_image_url ?? null,
              status: s.status,
              site_subdomain: s.sites?.subdomain ?? "",
              site_origin: s.sites?.site_origin ?? "spur",
              chapter_count: count ?? 0,
            }
          })
        )
        if (!cancelled) setSerials(withCounts)
      }

      const { data: postRows } = await supabase
        .from("spur_posts")
        .select(`id, slug, title, excerpt, thumbnail_url, tags, published_at, like_count, comment_count, reading_time_minutes, content_meta, sites!inner ( subdomain, name, site_origin )`)
        .eq("author_id", prof.id)
        .eq("status", "published")
        .is("serial_id", null)
        .order("published_at", { ascending: false })
        .limit(50)

      if (!cancelled && postRows) {
        setPosts(postRows.map((p: any) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          excerpt: p.excerpt ?? null,
          thumbnail: p.thumbnail_url ?? null,
          tags: p.tags ?? [],
          published_at: p.published_at,
          like_count: p.like_count ?? 0,
          comment_count: p.comment_count ?? 0,
          reading_time_minutes: p.reading_time_minutes ?? 1,
          content_meta: [],
          discovery_category_slug: null,
          site_subdomain: p.sites?.subdomain ?? "",
          site_origin: p.sites?.site_origin ?? "spur",
          site_display_name: p.sites?.name ?? "",
          author_display_name: prof.display_name ?? prof.username ?? null,
          author_avatar_url: prof.avatar_url ?? null,
        })))
      }

      if (!cancelled) setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [username])

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: C.muted, fontFamily: FONT, fontSize: 15 }}>Loading…</div>
      </div>
    )
  }

  if (notFound || !profile) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, fontFamily: FONT }}>
        <div style={{ fontSize: 48 }}>🤠</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>No one by that name</div>
        <div style={{ fontSize: 14, color: C.muted }}>The user <strong style={{ color: C.text }}>@{username}</strong> doesn't exist.</div>
        <button type="button" onClick={() => navigate("/")} style={{ marginTop: 8, padding: "10px 22px", borderRadius: 10, background: C.accent, color: "#fff", border: "none", fontSize: 13, fontWeight: 700, fontFamily: FONT, cursor: "pointer" }}>
          Go Home
        </button>
      </div>
    )
  }

  const socialEntries = Object.entries(profile.social_links ?? {}).filter(([, v]) => v)

  const sharedHeaderProps = {
    onStartWriting: () => setShowAuth(true),
    onNewPost: () => navigate("/admin"),
    onNewBlog: () => navigate("/admin"),
    onDashboard: () => navigate("/admin"),
    canCreateBlog: false,
    colors: C,
    font: FONT,
    fontMono: FONT_MONO,
    darkMode,
    onToggleTheme: () => setDarkMode(d => !d),
    session,
  }

  // Update module-level C before render, exactly like SpurApp
  C = darkMode ? DARK_C : LIGHT_C
  document.body.style.background = C.bg
  document.body.style.margin = "0"
  document.body.style.padding = "0"

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: FONT }}>
      <SpurHeader {...sharedHeaderProps} />

      <div style={{ maxWidth: 720, margin: "0 auto", padding: isMobile ? "24px 16px 60px" : "40px 24px 80px" }}>

        <div style={{ display: "flex", gap: 20, alignItems: isMobile ? "center" : "flex-start", flexDirection: isMobile ? "column" : "row", marginBottom: 28 }}>
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.display_name ?? ""} style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: `2px solid ${C.border}`, flexShrink: 0 }} />
          ) : (
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: C.accentDim, border: `2px solid ${C.accent}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 800, color: C.accent, fontFamily: FONT, flexShrink: 0 }}>
              {profileInitials(profile.display_name ?? profile.username)}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: C.text, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              {profile.display_name ?? profile.username}
            </div>
            {profile.username && (
              <div style={{ fontSize: 13, color: C.muted, marginTop: 3, fontFamily: FONT_MONO }}>@{profile.username}</div>
            )}
            {profile.tagline && (
              <div style={{ fontSize: 14, color: C.muted, marginTop: 8, lineHeight: 1.5 }}>{profile.tagline}</div>
            )}
            <div style={{ marginTop: 14 }}>
              {profile.id !== currentUserId && (
                <FollowButton profileId={profile.id} currentUserId={currentUserId} onLoginRequired={() => setShowAuth(true)} />
              )}
            </div>
          </div>
        </div>

        {profile.bio && (
          <div style={{ fontSize: 15, color: C.muted, lineHeight: 1.7, marginBottom: 24, padding: "16px 20px", borderRadius: 10, background: C.surface, border: `1px solid ${C.border}` }}>
            {profile.bio}
          </div>
        )}

        {socialEntries.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 32 }}>
            {socialEntries.map(([key, url]) => (
              <a key={key} href={url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, fontSize: 12, fontWeight: 600, color: C.muted, textDecoration: "none" }}>
                {key}
              </a>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 20, marginBottom: 36, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: C.dim, fontFamily: FONT_MONO }}>Member since {memberSince(profile.created_at)}</span>
          {serials.length > 0 && <span style={{ fontSize: 12, color: C.dim, fontFamily: FONT_MONO }}>{serials.length} {serials.length === 1 ? "serial" : "serials"}</span>}
          {posts.length > 0 && <span style={{ fontSize: 12, color: C.dim, fontFamily: FONT_MONO }}>{posts.length} {posts.length === 1 ? "post" : "posts"}</span>}
        </div>

        {serials.length > 0 && posts.length > 0 && (
          <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: `1px solid ${C.border}` }}>
            {(["posts", "serials"] as const).map(tab => (
              <button key={tab} type="button" onClick={() => setActiveTab(tab)} style={{ padding: "10px 18px", background: "none", border: "none", borderBottom: activeTab === tab ? `2px solid ${C.accent}` : "2px solid transparent", color: activeTab === tab ? C.text : C.muted, fontSize: 14, fontWeight: 700, fontFamily: FONT, cursor: "pointer", textTransform: "capitalize", marginBottom: -1 }}>
                {tab}
              </button>
            ))}
          </div>
        )}

        {(activeTab === "serials" || posts.length === 0) && serials.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 40 }}>
            {serials.map(s => <SerialCard key={s.id} serial={s} />)}
          </div>
        )}

        {(activeTab === "posts" || serials.length === 0) && posts.length > 0 && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 14, marginBottom: 8 }}>
              {posts.slice(0, 6).map(p => <TopCard key={p.id} post={p} />)}
            </div>
            {posts.length > 6 && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 0 12px" }}>
                  <div style={{ flex: 1, height: 1, background: C.borderLight }} />
                  <span style={{ fontSize: 11, fontWeight: 700, fontFamily: FONT_MONO, color: C.dim, letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>More Posts</span>
                  <div style={{ flex: 1, height: 1, background: C.borderLight }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 10 }}>
                  {posts.slice(6).map(p => <ListRowCard key={p.id} post={p} />)}
                </div>
              </>
            )}
          </>
        )}

        {serials.length === 0 && posts.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: C.muted, fontSize: 15 }}>Nothing published yet.</div>
        )}
      </div>

      <SpurFooter colors={C} />

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  )
}
