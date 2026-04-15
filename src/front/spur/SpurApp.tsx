import { useEffect, useMemo, useState } from "react"
import { Routes, Route, useNavigate } from "react-router-dom"
import { supabase } from "./supabase"
import { AuthModal } from "./AuthModal"
import PricingPage from "./PricingPage"
import SpurHeader from "./components/SpurHeader"
import { Icon } from "./Icons"
import { SpurPanel } from "./spur/SpurPanel"
import CreateBlogModal from "./CreateBlogModal"
import { SpurPostEditor } from "./spur/SpurPostEditor"

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
  category: DiscoveryCategory
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
    category: "technology",
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
    category: "business",
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
    category: "technology",
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
    category: "art",
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
    category: "art",
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
    category: "culture",
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
const DISCOVERY_CATEGORIES: Array<{ value: "all" | DiscoveryCategory; label: string }> = [
  { value: "all", label: "All" },
  { value: "technology", label: "Technology" },
  { value: "business", label: "Business" },
  { value: "culture", label: "Culture" },
  { value: "society", label: "Society" },
  { value: "politics", label: "Politics" },
  { value: "science", label: "Science" },
  { value: "health", label: "Health" },
  { value: "life", label: "Life" },
  { value: "philosophy", label: "Philosophy" },
  { value: "history", label: "History" },
  { value: "art", label: "Art" },
  { value: "fiction", label: "Fiction" },
]

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
        flex: "0 0 auto",
        whiteSpace: "nowrap",
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
  onStartWriting,
  onNewPost,
  onNewBlog,
  onDashboard,
  canCreateBlog,
}: {
  posts: SpurPost[]
  onStartWriting: () => void
  onNewPost: () => void
  onNewBlog: () => void
  onDashboard: () => void
  canCreateBlog: boolean
}) {
  const [activeFilters, setActiveFilters] = useState<Set<ContentMeta>>(new Set())
  const [heroCollapsed, setHeroCollapsed] = useState(false)
  const [activeCategory, setActiveCategory] = useState<"all" | DiscoveryCategory>("all")

  const availableTypes = useMemo(
    () => META_TYPES.filter((type) => posts.some((post) => post.contentMeta.includes(type))),
    [posts]
  )

  const categoryFilteredPosts = useMemo(() => {
    if (activeCategory === "all") return posts
    return posts.filter((post) => post.category === activeCategory)
  }, [posts, activeCategory])

  const filteredPosts = useMemo(() => {
    if (activeFilters.size === 0) return categoryFilteredPosts
    return categoryFilteredPosts.filter((post) =>
      [...activeFilters].every((type) => post.contentMeta.includes(type))
    )
  }, [categoryFilteredPosts, activeFilters])

  const featuredPosts = filteredPosts.slice(0, 3)
  const featured = featuredPosts[0] ?? null
  const featureSide = featuredPosts.slice(1)
  const rest = filteredPosts.slice(3)

  const activeCategoryLabel =
    DISCOVERY_CATEGORIES.find((category) => category.value === activeCategory)?.label ?? "All"

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
        onStartWriting={onStartWriting}
        onNewPost={onNewPost}
        onNewBlog={onNewBlog}
        onDashboard={onDashboard}
        canCreateBlog={canCreateBlog}
        colors={C}
        font={FONT}
        fontMono={FONT_MONO}
      />

      <main>
        {heroCollapsed ? (
          <section
            onClick={() => setHeroCollapsed(false)}
            style={{
              maxWidth: 1180,
              margin: "0 auto",
              padding: "24px 24px 12px",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                background: C.surface,
                border: `1px solid ${C.borderLight}`,
                borderRadius: 18,
                padding: "16px 18px",
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) auto",
                gap: 16,
                alignItems: "center",
              }}
            >
              <div
                className="spur-collapsed-hero__content"
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
                  gap: 18,
                  minWidth: 0,
                }}
              >
                <div style={{ minWidth: 0 }}>
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
                    Discovery-first blogging
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      lineHeight: 1.1,
                      letterSpacing: "-0.03em",
                      color: C.text,
                    }}
                  >
                    Write. Get seen. Build your hub.
                  </div>
                </div>

                <div
                  className="spur-collapsed-hero__divider"
                  style={{
                    position: "relative",
                    minWidth: 0,
                    paddingLeft: 18,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 1,
                      background: C.borderLight,
                    }}
                  />
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
                    Why Spur
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      lineHeight: 1.1,
                      letterSpacing: "-0.03em",
                      color: C.text,
                    }}
                  >
                    Better discovery without turning your blog into platform sludge.
                  </div>
                </div>
              </div>

              <div
                className="spur-collapsed-hero__learn-more"
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: C.accent,
                  whiteSpace: "nowrap",
                  alignSelf: "center",
                }}
              >
                Learn more
              </div>
            </div>
          </section>
        ) : (
          <section
            onClick={() => setHeroCollapsed(true)}
            style={{
              maxWidth: 1180,
              margin: "0 auto",
              padding: "64px 24px 28px",
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.15fr) minmax(320px, 0.85fr)",
              gap: 28,
              alignItems: "stretch",
              cursor: "pointer",
              position: "relative",
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
                  onClick={(e) => {
                    e.stopPropagation()
                    onStartWriting()
                  }}
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
                  onClick={(e) => e.stopPropagation()}
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

            <div
              style={{
                position: "absolute",
                right: 24,
                top: 22,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                fontWeight: 700,
                fontFamily: FONT,
                color: C.dim,
                pointerEvents: "none",
              }}
            >
              <span>Click anywhere to collapse</span>
            </div>
          </section>
        )}

        <section
          style={{
            position: "sticky",
            top: 0,
            zIndex: 5,
            background: "rgba(8,14,26,0.92)",
            backdropFilter: "blur(10px)",
            borderTop: `1px solid ${C.borderLight}`,
            borderBottom: `1px solid ${C.borderLight}`,
          }}
        >
          <div
            className="spur-category-rail"
            onWheel={(e) => {
              const el = e.currentTarget
              if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                el.scrollLeft += e.deltaY
                e.preventDefault()
              }
            }}
            style={{
              maxWidth: 1180,
              margin: "0 auto",
              padding: "12px 24px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              overflowX: "auto",
              overflowY: "hidden",
              flexWrap: "nowrap",
              scrollbarWidth: "none",
              WebkitOverflowScrolling: "touch",
              cursor: "grab",
            }}
          >
            {DISCOVERY_CATEGORIES.map((category) => (
              <FilterChip
                key={category.value}
                label={category.label}
                active={activeCategory === category.value}
                onClick={() => setActiveCategory(category.value)}
              />
            ))}
          </div>
        </section>

        <section id="discover" style={{ maxWidth: 1180, margin: "0 auto", padding: "20px 24px 64px" }}>
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
                {activeCategory === "all" ? "Discover on Spur" : `${activeCategoryLabel} on Spur`}
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
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1.35fr) minmax(280px, 0.65fr)",
                  gap: 16,
                  marginBottom: 18,
                }}
              >
                <PostCard post={featured} featured />

                <div style={{ display: "grid", gap: 16 }}>
                  {featureSide.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  flexWrap: "wrap",
                  marginBottom: 14,
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
                  More from {activeCategoryLabel}
                </div>

                <div style={{ fontSize: 12, color: C.dim }}>
                  {filteredPosts.length} post{filteredPosts.length === 1 ? "" : "s"}
                </div>
              </div>

              {rest.length > 0 ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                    gap: 16,
                  }}
                >
                  {rest.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              ) : null}
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
  const [loadingSites, setLoadingSites] = useState(true)
  const [showCreateBlogModal, setShowCreateBlogModal] = useState(false)
  const [entitlements, setEntitlements] = useState<any | null>(null)
  const [loadingEntitlements, setLoadingEntitlements] = useState(true)
  const [continueIntoCreateBlog, setContinueIntoCreateBlog] = useState(false)
  const [showNewPostModal, setShowNewPostModal] = useState(false)

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
      setLoadingEntitlements(false)
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

    navigate("/admin")
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

    setShowNewPostModal(true)
  }

  const primarySite = ownedSites[0] ?? null

  const canCreateBlog =
    !loadingSites &&
    !loadingEntitlements &&
    entitlements !== null &&
    ownedSites.length < entitlements.site_limit

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: ${C.bg}; }
        a { text-decoration: none; color: inherit; }
        button { font: inherit; cursor: pointer; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }

        .spur-category-rail {
          scrollbar-width: none;
        }

        .spur-category-rail::-webkit-scrollbar {
          display: none;
        }

        .spur-category-rail > button {
          flex: 0 0 auto;
        }

        @media (min-width: 1181px) {
          .spur-category-rail {
            display: grid !important;
            grid-template-columns: repeat(13, minmax(0, 1fr)) !important;
            overflow: visible !important;
            cursor: default !important;
          }

          .spur-category-rail > button {
            width: 100%;
            min-width: 0;
            justify-content: center;
          }
        }

        @media (max-width: 1180px) {
          .spur-category-rail {
            display: flex !important;
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
            overflow-y: hidden !important;
            -webkit-overflow-scrolling: touch;
          }

          .spur-category-rail > button {
            flex: 0 0 auto;
          }
        }

        @media (max-width: 900px) {
          section[style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
        }

        @media (max-width: 640px) {
          header > div { padding-left: 16px !important; padding-right: 16px !important; }

          .spur-category-rail {
            padding-left: 16px !important;
            padding-right: 16px !important;
            gap: 8px !important;
          }

          .spur-collapsed-hero__content {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
          }

          .spur-collapsed-hero__divider {
            padding-left: 0 !important;
            padding-top: 14px !important;
          }

          .spur-collapsed-hero__divider > div:first-child {
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: auto !important;
            width: auto !important;
            height: 1px !important;
          }

          .spur-collapsed-hero__learn-more {
            grid-column: 1 / -1;
            justify-self: start;
            padding-top: 2px;
          }
        }
        /* ───────────────── HEADER MOBILE FIX ───────────────── */

        @media (max-width: 900px) {
          header > div {
            height: auto !important;
            flex-direction: column !important;
            align-items: stretch !important;
            padding-top: 10px !important;
            padding-bottom: 10px !important;
            gap: 10px !important;
          }

          .spur-header__nav {
            width: 100%;
            justify-content: flex-start !important;
            flex-wrap: nowrap !important;
            overflow-x: auto;
            overflow-y: hidden;
            -webkit-overflow-scrolling: touch;
            padding-bottom: 4px;
          }

          .spur-header__nav::-webkit-scrollbar {
            display: none;
          }

          .spur-header__item {
            flex: 0 0 auto;
            white-space: nowrap;
          }
        }

        @media (max-width: 640px) {
          .spur-header__nav {
            gap: 6px !important;
          }

          .spur-header__item {
            padding: 8px 10px !important;
            font-size: 13px !important;
          }
        }
      `}</style>

      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              posts={MOCK_POSTS}
              onStartWriting={handleStartWriting}
              onNewPost={handleNewPost}
              onNewBlog={() => setShowCreateBlogModal(true)}
              onDashboard={() => {
                navigate("/admin")
              }}
              canCreateBlog={canCreateBlog}
            />
          }
        />
        <Route
          path="/pricing"
          element={
            <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: FONT }}>
              <SpurHeader
                onStartWriting={handleStartWriting}
                onNewPost={handleNewPost}
                onNewBlog={() => setShowCreateBlogModal(true)}
                onDashboard={() => {
                  navigate("/admin")
                }}
                canCreateBlog={canCreateBlog}
                colors={C}
                font={FONT}
                fontMono={FONT_MONO}
              />
              <PricingPage />
            </div>
          }
        />
        <Route
          path="/admin"
          element={
            <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: FONT }}>
              <SpurHeader
                onStartWriting={handleStartWriting}
                onNewPost={handleNewPost}
                onNewBlog={() => setShowCreateBlogModal(true)}
                onDashboard={() => {
                  navigate("/admin")
                }}
                canCreateBlog={canCreateBlog}
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
                          window.location.href = "/spur"
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

      {session?.user?.id && primarySite && showNewPostModal ? (
        <div
          onClick={() => setShowNewPostModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(0,0,0,0.62)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(920px, 92vw)",
              height: "min(88vh, 860px)",
              borderRadius: 18,
              overflow: "hidden",
              background: C.bg,
              border: `1px solid ${C.border}`,
              boxShadow: "0 30px 100px rgba(0,0,0,0.45)",
            }}
          >
            <SpurPostEditor
              post={null}
              siteId={primarySite.id}
              userId={session.user.id}
              supabase={supabase}
              onSaved={() => setShowNewPostModal(false)}
              onCancel={() => setShowNewPostModal(false)}
              theme={{
                bg: C.bg,
                surface: C.surface,
                surfaceHov: C.surfaceHover,
                border: C.border,
                borderLight: C.borderLight,
                text: C.text,
                muted: C.muted,
                dim: C.dim,
                accent: C.accent,
                accentHov: C.accentHover,
                accentDim: C.accentDim,
                green: C.green,
                greenDim: C.greenDim,
                yellow: C.yellow,
                yellowDim: C.yellowDim,
                red: "#ff5f56",
                redDim: "#ff5f5620",
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
  return <SpurAppRoutes />
}