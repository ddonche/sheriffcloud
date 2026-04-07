import { useEffect, useMemo, useState } from "react"
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom"
import { supabase } from "./supabase"
import { AuthModal } from "./AuthModal"
import PricingPage from "./PricingPage"
import SpurHeader from "./SpurHeader"
import { Icon } from "./Icons"
import { SpurPanel } from "./spur/SpurPanel"
import CreateBlogModal from "./CreateBlogModal"

// ── Types ─────────────────────────────────────────────────────────────────────

type ContentMeta = "image" | "video" | "code" | "file" | "link" | "audio"

type SpurPost = {
  id: string
  title: string
  excerpt: string
  thumbnail: string | null
  tags: string[]
  date: string
  comments: number
  likes: number
  contentMeta: ContentMeta[]
}

// ── Mock data ─────────────────────────────────────────────────────────────────
// Replace this with real discovery data when ready.

const MOCK_POSTS: SpurPost[] = [
  {
    id: "1",
    title: "Building a Multi-Model AI Workspace",
    excerpt:
      "How we wired GPT, Gemini, Claude, and Grok into a single conversation panel that actually works.",
    thumbnail: null,
    tags: ["ai", "engineering"],
    date: "2025-03-20",
    comments: 14,
    likes: 87,
    contentMeta: ["code", "image"],
  },
  {
    id: "2",
    title: "The Sheriff Ecosystem: One Platform, Many Tools",
    excerpt:
      "A look at how Spur, Campfire, Holster, and Chatterbox all share a single auth layer and theme system.",
    thumbnail: null,
    tags: ["sheriff", "product"],
    date: "2025-03-15",
    comments: 6,
    likes: 42,
    contentMeta: ["image", "link"],
  },
  {
    id: "3",
    title: "Goblin: A Scripting Language for Builders",
    excerpt:
      "Why I built a custom language instead of reaching for Lua or Python. Spoiler: cognitive overhead.",
    thumbnail: null,
    tags: ["goblin", "engineering"],
    date: "2025-03-10",
    comments: 19,
    likes: 76,
    contentMeta: ["code"],
  },
  {
    id: "4",
    title: "Vekke: Designing a Competitive Abstract Strategy Game",
    excerpt:
      "From hand-carved board to online platform with Elo ratings, cosmetics, and a full tournament system.",
    thumbnail: null,
    tags: ["vekke", "design", "games"],
    date: "2025-03-01",
    comments: 23,
    likes: 130,
    contentMeta: ["image", "video"],
  },
  {
    id: "5",
    title: "Rainwall: Writing Music for a Board Game",
    excerpt:
      "The process behind the Vekke theme song — atmosphere, tension, and what a game actually sounds like.",
    thumbnail: null,
    tags: ["music", "vekke"],
    date: "2025-02-24",
    comments: 9,
    likes: 54,
    contentMeta: ["audio", "image"],
  },
  {
    id: "6",
    title: "Why I Stopped Using Discourse",
    excerpt:
      "Too heavy, too opinionated, too much config. So I built something cleaner.",
    thumbnail: null,
    tags: ["community", "forums"],
    date: "2025-02-20",
    comments: 11,
    likes: 61,
    contentMeta: [],
  },
]

// ── Constants ─────────────────────────────────────────────────────────────────

const FONT = `"DM Sans", "Inter", system-ui, sans-serif`
const FONT_MONO = `"DM Mono", "Fira Code", monospace`

const C = {
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

const META_COLORS: Record<ContentMeta, string> = {
  image: "#4a9eff",
  video: "#e040a0",
  code: "#2dd98a",
  file: "#f5c842",
  link: "#c084fc",
  audio: "#fb923c",
}

const META_TYPES: ContentMeta[] = ["image", "video", "code", "file", "link", "audio"]

// ── Sub-components ────────────────────────────────────────────────────────────

function MetaIcon({ type }: { type: ContentMeta }) {
  const color = META_COLORS[type]
  return (
    <span
      title={type}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 34,
        height: 34,
        borderRadius: 7,
        background: color + "18",
      }}
    >
      <Icon name={type} size={18} color={color} />
    </span>
  )
}

function StatIcon({
  icon,
  value,
  color,
}: {
  icon: "heart" | "comments"
  value: number
  color?: string
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 14,
        color: color ?? C.muted,
        fontFamily: FONT,
      }}
    >
      <Icon name={icon} size={16} color={color ?? C.muted} />
      {value}
    </span>
  )
}

function TagPill({ tag }: { tag: string }) {
  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 600,
        fontFamily: FONT_MONO,
        color: C.accent,
        background: C.accentDim,
        padding: "4px 9px",
        borderRadius: 5,
        letterSpacing: "0.02em",
      }}
    >
      #{tag}
    </span>
  )
}

function FilterChip({
  label,
  active,
  onClick,
  icon,
}: {
  label: string
  active: boolean
  onClick: () => void
  icon?: ContentMeta
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 13px",
        borderRadius: 10,
        border: `1px solid ${active ? C.accent + "55" : C.borderLight}`,
        background: active ? C.accentDim : C.surface,
        color: active ? C.accent : C.muted,
        fontSize: 13,
        fontWeight: 700,
        fontFamily: FONT,
        transition: "all 0.15s ease",
      }}
    >
      {icon ? <Icon name={icon} size={15} color={active ? C.accent : META_COLORS[icon]} /> : null}
      {label}
    </button>
  )
}

function PostCard({ post, featured = false }: { post: SpurPost; featured?: boolean }) {
  const [hovered, setHovered] = useState(false)

  return (
    <a
      href={`https://example.sheriffcloud.com/blog/${post.id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? C.surfaceHover : C.surface,
        border: `1px solid ${hovered ? C.border : C.borderLight}`,
        borderRadius: 14,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "background 0.15s, border-color 0.15s, transform 0.15s, box-shadow 0.15s",
        transform: hovered ? "translateY(-2px)" : "none",
        boxShadow: hovered ? "0 8px 32px rgba(0,0,0,0.4)" : "none",
        cursor: "pointer",
        minHeight: featured ? 460 : 0,
      }}
    >
      <div
        style={{
          height: featured ? 220 : 180,
          background: C.borderLight,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {post.thumbnail ? (
          <img src={post.thumbnail} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: `linear-gradient(135deg, ${C.border} 0%, ${C.borderLight} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg viewBox="0 0 640 640" width={featured ? 44 : 36} height={featured ? 44 : 36} fill={C.dim}>
              <path d="M64 128C64 92.7 92.7 64 128 64L512 64C547.3 64 576 92.7 576 128L576 512C576 547.3 547.3 576 512 576L128 576C92.7 576 64 547.3 64 512L64 128zM208 176C190.3 176 176 190.3 176 208C176 225.7 190.3 240 208 240C225.7 240 240 225.7 240 208C240 190.3 225.7 176 208 176zM128 432L186.8 351.8C195.2 340.3 211.7 338.4 222.5 348.2L256 380L346.9 271.3C356.9 259.4 374.8 258.5 385.9 269.5L512 395.5L512 480C512 497.7 497.7 512 480 512L160 512C142.3 512 128 497.7 128 480L128 432z" />
            </svg>
          </div>
        )}
      </div>

      <div style={{ padding: "18px 18px 16px", display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
        <div
          style={{
            fontSize: featured ? 22 : 18,
            fontWeight: 800,
            color: C.text,
            fontFamily: FONT,
            lineHeight: 1.25,
            letterSpacing: "-0.03em",
            display: "-webkit-box",
            WebkitLineClamp: featured ? 3 : 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {post.title}
        </div>

        <div
          style={{
            fontSize: featured ? 15 : 14,
            color: C.muted,
            fontFamily: FONT,
            lineHeight: 1.7,
            display: "-webkit-box",
            WebkitLineClamp: featured ? 4 : 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            flex: 1,
          }}
        >
          {post.excerpt}
        </div>

        {post.tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {post.tags.map((t) => (
              <TagPill key={t} tag={t} />
            ))}
          </div>
        )}

        {post.contentMeta.length > 0 && (
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            {post.contentMeta.map((type) => (
              <MetaIcon key={type} type={type} />
            ))}
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 12,
            borderTop: `1px solid ${C.borderLight}`,
            marginTop: "auto",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: C.dim, fontFamily: FONT }}>
              {new Date(post.date).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <StatIcon icon="heart" value={post.likes} color={C.accent} />
            <StatIcon icon="comments" value={post.comments} />
          </div>

          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              fontSize: 13,
              fontWeight: 700,
              color: hovered ? C.text : C.muted,
              fontFamily: FONT,
            }}
          >
            Read
            <Icon name="link" size={14} color={hovered ? C.accent : C.muted} />
          </span>
        </div>
      </div>
    </a>
  )
}

function HomePage({
  posts,
  session,
  onStartWriting,
  onNewPost,
  onNewBlog,
  onDashboard,
  canCreateBlog,
}: {
  posts: SpurPost[]
  session: any
  onStartWriting: () => void
  onNewPost: () => void
  onNewBlog: () => void
  onDashboard: () => void
  canCreateBlog: boolean
}) {
  const [activeFilters, setActiveFilters] = useState<Set<ContentMeta>>(new Set())

  const availableTypes = useMemo(
    () => META_TYPES.filter((type) => posts.some((post) => post.contentMeta.includes(type))),
    [posts]
  )

  const filteredPosts = useMemo(() => {
    if (activeFilters.size === 0) return posts
    return posts.filter((post) => [...activeFilters].every((type) => post.contentMeta.includes(type)))
  }, [posts, activeFilters])

  const featured = filteredPosts[0] ?? null
  const rest = filteredPosts.slice(1)

  function toggleFilter(type: ContentMeta) {
    setActiveFilters((prev) => {
      const next = new Set(prev)
      next.has(type) ? next.delete(type) : next.add(type)
      return next
    })
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: FONT }}>
      <SpurHeader
        session={session}
        onStartWriting={onStartWriting}
        onNewPost={onNewPost}
        onNewBlog={onNewBlog}
        onDashboard={onDashboard}
        onSignOut={async () => {
          await supabase.auth.signOut()
        }}
        canCreateBlog={canCreateBlog}
        colors={C}
        font={FONT}
        fontMono={FONT_MONO}
      />

      <main>
        <section
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            padding: "64px 24px 28px",
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.15fr) minmax(320px, 0.85fr)",
            gap: 28,
            alignItems: "stretch",
          }}
        >
          <div
            style={{
              background: `linear-gradient(180deg, rgba(242,145,6,0.06) 0%, rgba(242,145,6,0.02) 100%)`,
              border: `1px solid ${C.borderLight}`,
              borderRadius: 18,
              padding: "30px 28px",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                fontWeight: 700,
                fontFamily: FONT_MONO,
                color: C.accent,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 14,
              }}
            >
              <span>Discovery-first blogging</span>
            </div>

            <h1
              style={{
                fontSize: "clamp(40px, 7vw, 70px)",
                lineHeight: 0.95,
                letterSpacing: "-0.06em",
                fontWeight: 900,
                color: C.text,
                marginBottom: 18,
              }}
            >
              Write.
              <br />
              Get seen.
              <br />
              Build your hub.
            </h1>

            <p
              style={{
                fontSize: 18,
                lineHeight: 1.75,
                color: C.muted,
                maxWidth: 650,
                marginBottom: 22,
              }}
            >
              Spur is a clean blogging platform with built-in discovery. Publish posts people
              actually want to click, then bring them back to your site, your docs, your
              forum, and your world.
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 22 }}>
              <button
                type="button"
                onClick={onStartWriting}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: C.accent,
                  color: "#fff",
                  borderRadius: 10,
                  padding: "13px 18px",
                  fontSize: 14,
                  fontWeight: 800,
                  border: "none",
                }}
              >
                Start Writing
              </button>
              <a
                href="#discover"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: C.surface,
                  color: C.text,
                  border: `1px solid ${C.border}`,
                  borderRadius: 10,
                  padding: "13px 18px",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                Explore Discover
              </a>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {[
                "Content-aware previews",
                "Zero paywalls in discovery",
                "Your blog stays yours",
              ].map((item) => (
                <span
                  key={item}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "9px 11px",
                    borderRadius: 999,
                    background: C.surface,
                    border: `1px solid ${C.borderLight}`,
                    fontSize: 13,
                    fontWeight: 700,
                    color: C.muted,
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: C.accent,
                      display: "inline-block",
                    }}
                  />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.borderLight}`,
              borderRadius: 18,
              padding: "22px 20px",
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: FONT_MONO,
                  color: C.accent,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                Why Spur
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  lineHeight: 1.15,
                  letterSpacing: "-0.04em",
                  marginBottom: 10,
                }}
              >
                Better discovery without turning your blog into platform sludge.
              </div>
              <div style={{ fontSize: 15, lineHeight: 1.7, color: C.muted }}>
                Posts stay on your site. Discovery lives on Spur. Readers click through, find
                your world, and can go deeper into everything else you build.
              </div>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              {[
                {
                  title: "See what’s inside",
                  text: "Posts show code, audio, image, video, and more before the click.",
                },
                {
                  title: "Filter instantly",
                  text: "Readers can narrow the feed by the content types they actually want.",
                },
                {
                  title: "Bring people home",
                  text: "Your blog is the doorway into your docs, forum, and community.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  style={{
                    padding: "14px 14px 12px",
                    borderRadius: 12,
                    border: `1px solid ${C.borderLight}`,
                    background: "rgba(255,255,255,0.01)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      color: C.text,
                      marginBottom: 4,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {item.title}
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.65, color: C.muted }}>
                    {item.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="discover" style={{ maxWidth: 1180, margin: "0 auto", padding: "8px 24px 64px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
              marginBottom: 18,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: FONT_MONO,
                  color: C.accent,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                Discover on Spur
              </div>
              <h2
                style={{
                  fontSize: "clamp(28px, 4vw, 40px)",
                  lineHeight: 1.05,
                  letterSpacing: "-0.05em",
                  fontWeight: 900,
                  color: C.text,
                }}
              >
                Writing worth clicking
              </h2>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <FilterChip
                label="All"
                active={activeFilters.size === 0}
                onClick={() => setActiveFilters(new Set())}
              />
              {availableTypes.map((type) => (
                <FilterChip
                  key={type}
                  label={type[0].toUpperCase() + type.slice(1)}
                  icon={type}
                  active={activeFilters.has(type)}
                  onClick={() => toggleFilter(type)}
                />
              ))}
            </div>
          </div>

          {featured ? (
            <>
              <div style={{ marginBottom: 18 }}>
                <PostCard post={featured} featured />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: 16,
                }}
              >
                {rest.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </>
          ) : (
            <div
              style={{
                minHeight: 220,
                borderRadius: 14,
                border: `1px solid ${C.borderLight}`,
                background: C.surface,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: C.muted,
                fontSize: 15,
              }}
            >
              No posts match those filters.
            </div>
          )}
        </section>

        <section style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px 84px" }}>
          <div
            style={{
              borderRadius: 18,
              background: C.surface,
              border: `1px solid ${C.borderLight}`,
              padding: "28px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 18,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: FONT_MONO,
                  color: C.accent,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                Start your blog
              </div>
              <div
                style={{
                  fontSize: 28,
                  lineHeight: 1.08,
                  letterSpacing: "-0.04em",
                  fontWeight: 900,
                  color: C.text,
                  marginBottom: 8,
                }}
              >
                Make your site. Publish your writing. Move on with your life.
              </div>
              <div style={{ fontSize: 15, lineHeight: 1.7, color: C.muted, maxWidth: 700 }}>
                Create your blog, get a free subdomain on Sheriff Cloud, and expand into docs,
                forums, and a full creator hub when you’re ready.
              </div>
            </div>

            <button
              type="button"
              onClick={onStartWriting}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: C.accent,
                color: "#fff",
                borderRadius: 10,
                padding: "13px 18px",
                fontSize: 14,
                fontWeight: 800,
                whiteSpace: "nowrap",
                border: "none",
              }}
            >
              Create Your Blog
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}

function SpurAppRoutes() {
  const navigate = useNavigate()
  const [session, setSession] = useState<any>(null)
  const [showAuth, setShowAuth] = useState(false)
  const [ownedSites, setOwnedSites] = useState<any[]>([])
  const [loadingSites, setLoadingSites] = useState(false)
  const [showCreateBlogModal, setShowCreateBlogModal] = useState(false)
  const [entitlements, setEntitlements] = useState<any | null>(null)
  const [loadingEntitlements, setLoadingEntitlements] = useState(false)
  const [continueIntoCreateBlog, setContinueIntoCreateBlog] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null))
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, nextSession: any) => {
      setSession(nextSession ?? null)
      if (_event === 'SIGNED_IN') {
        const returnTo = sessionStorage.getItem('oauth_return_to')
        if (returnTo) {
          sessionStorage.removeItem('oauth_return_to')
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

      if (error) {
        console.error(error)
        setOwnedSites([])
        setShowCreateBlogModal(false)
        setLoadingSites(false)
        return
      }

      const sites = data ?? []
      setOwnedSites(sites)
      setLoadingSites(false)
    })()

    return () => {
      cancelled = true
    }
  }, [session, entitlements])

  useEffect(() => {
    if (!session?.user?.id) {
      setEntitlements(null)
      return
    }

    let cancelled = false

    ;(async () => {
      setLoadingEntitlements(true)

      const { data, error } = await supabase
        .from("account_entitlements")
        .select("*")
        .eq("user_id", session.user.id)
        .single()

      if (cancelled) return

      if (error) {
        console.error(error)
        setEntitlements(null)
        setLoadingEntitlements(false)
        return
      }

      setEntitlements(data)
      setLoadingEntitlements(false)
    })()

    return () => {
      cancelled = true
    }
  }, [session])

  useEffect(() => {
    if (!continueIntoCreateBlog) return
    if (!session?.user?.id) return
    if (loadingSites || loadingEntitlements) return

    const siteLimit = entitlements?.site_limit ?? 3
    const canCreate = ownedSites.length < siteLimit

    if (ownedSites.length === 0 && canCreate) {
      setShowCreateBlogModal(true)
    }

    setContinueIntoCreateBlog(false)
  }, [
    continueIntoCreateBlog,
    session,
    ownedSites,
    entitlements,
    loadingSites,
    loadingEntitlements,
  ])

  useEffect(() => {
    function handleOpenAuth() {
      setShowAuth(true)
    }

    window.addEventListener("spur:open-auth", handleOpenAuth)
    return () => window.removeEventListener("spur:open-auth", handleOpenAuth)
  }, [])

  function handleStartWriting() {
    if (!session) {
      setContinueIntoCreateBlog(true)
      setShowAuth(true)
      return
    }

    if (loadingSites || loadingEntitlements) return

    const siteLimit = entitlements?.site_limit ?? 3
    const canCreate = ownedSites.length < siteLimit

    if (!canCreate) {
      alert(`You’ve reached your limit of ${siteLimit} sites.`)
      return
    }

    if (ownedSites.length === 0) {
      setShowCreateBlogModal(true)
      return
    }

    navigate("/dashboard")
  }

  function handleNewPost() {
    if (!session) {
      setContinueIntoCreateBlog(true)
      setShowAuth(true)
      return
    }

    if (loadingSites || loadingEntitlements) return

    const siteLimit = entitlements?.site_limit ?? 3
    const canCreate = ownedSites.length < siteLimit

    if (ownedSites.length === 0) {
      if (!canCreate) {
        alert(`You’ve reached your limit of ${siteLimit} sites.`)
        return
      }

      setShowCreateBlogModal(true)
      return
    }

    navigate("/dashboard")
  }

  const primarySite = ownedSites[0] ?? null

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: ${C.bg}; }
        a { text-decoration: none; color: inherit; }
        button { font: inherit; cursor: pointer; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
        @media (max-width: 900px) {
          section[style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          header > div { padding-left: 16px !important; padding-right: 16px !important; }
        }
      `}</style>

      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              posts={MOCK_POSTS}
              session={session}
              onStartWriting={handleStartWriting}
              onNewPost={handleNewPost}
              onNewBlog={() => setShowCreateBlogModal(true)}
              onDashboard={() => {
                navigate("/dashboard")
              }}
              canCreateBlog={ownedSites.length < (entitlements?.site_limit ?? 3)}
            />
          }
        />
        <Route
          path="/pricing"
          element={
            <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: FONT }}>
              <SpurHeader
                session={session}
                onStartWriting={handleStartWriting}
                onNewPost={handleNewPost}
                onNewBlog={() => setShowCreateBlogModal(true)}
                onDashboard={() => {
                  navigate("/dashboard")
                }}
                onSignOut={async () => {
                  await supabase.auth.signOut()
                }}
                canCreateBlog={ownedSites.length < (entitlements?.site_limit ?? 3)}
                colors={C}
                font={FONT}
                fontMono={FONT_MONO}
              />
              <PricingPage />
            </div>
          }
        />
        <Route
          path="/dashboard"
          element={
            <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: FONT }}>
              <SpurHeader
                session={session}
                onStartWriting={handleStartWriting}
                onNewPost={handleNewPost}
                onNewBlog={() => setShowCreateBlogModal(true)}
                onDashboard={() => {
                  navigate("/dashboard")
                }}
                onSignOut={async () => {
                  await supabase.auth.signOut()
                }}
                canCreateBlog={ownedSites.length < (entitlements?.site_limit ?? 3)}
                colors={C}
                font={FONT}
                fontMono={FONT_MONO}
              />

              {session?.user?.id && primarySite ? (
                <div style={{ height: "calc(100vh - 76px)" }}>
                  <SpurPanel site={primarySite} userId={session.user.id} supabase={supabase} />
                </div>
              ) : (
                <div
                  style={{
                    minHeight: "calc(100vh - 76px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 24,
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      maxWidth: 680,
                      borderRadius: 18,
                      border: `1px solid ${C.borderLight}`,
                      background: C.surface,
                      padding: "32px 28px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 14,
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        fontFamily: FONT_MONO,
                        color: C.accent,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      }}
                    >
                      Dashboard
                    </div>

                    <h1
                      style={{
                        fontSize: 34,
                        lineHeight: 1.05,
                        letterSpacing: "-0.04em",
                        fontWeight: 900,
                        color: C.text,
                      }}
                    >
                      {session ? "You don’t have a blog yet." : "Please log in to open your dashboard."}
                    </h1>

                    <p
                      style={{
                        fontSize: 15,
                        lineHeight: 1.75,
                        color: C.muted,
                        maxWidth: 560,
                        margin: "0 auto",
                      }}
                    >
                      {session
                        ? "Create your first blog to start publishing posts, organizing categories, and managing everything from your panel."
                        : "Once you’re logged in, you’ll be able to create a blog and manage your writing from here."}
                    </p>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: 12,
                        flexWrap: "wrap",
                        marginTop: 6,
                      }}
                    >
                      {session ? (
                        <button
                          type="button"
                          onClick={() => setShowCreateBlogModal(true)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            background: C.accent,
                            color: "#fff",
                            borderRadius: 10,
                            padding: "13px 18px",
                            fontSize: 14,
                            fontWeight: 800,
                            border: "none",
                          }}
                        >
                          Create Your Blog
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowAuth(true)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            background: C.accent,
                            color: "#fff",
                            borderRadius: 10,
                            padding: "13px 18px",
                            fontSize: 14,
                            fontWeight: 800,
                            border: "none",
                          }}
                        >
                          Log In
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          window.location.href = "/"
                        }}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          background: C.surface,
                          color: C.text,
                          border: `1px solid ${C.border}`,
                          borderRadius: 10,
                          padding: "13px 18px",
                          fontSize: 14,
                          fontWeight: 700,
                        }}
                      >
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
      
      {session?.user?.id ? (
        <CreateBlogModal
          open={showCreateBlogModal}
          userId={session.user.id}
          onClose={() => setShowCreateBlogModal(false)}
          onCreated={(site) => {
            setOwnedSites((prev: any[]) => [site, ...prev])
            setShowCreateBlogModal(false)
            navigate("/dashboard")
          }}
        />
      ) : null}
      {showAuth ? <AuthModal onClose={() => setShowAuth(false)} /> : null}
    </>
  )
}

export default function SpurApp() {
  return (
    <BrowserRouter>
      <SpurAppRoutes />
    </BrowserRouter>
  )
}
