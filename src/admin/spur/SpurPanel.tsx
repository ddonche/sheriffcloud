import { useEffect, useState } from "react"
import type { SpurPost, SpurFeature, SpurSerial } from "./spurTypes"
import { SPUR_DARK, SPUR_LIGHT, SPURF, SPURM } from "./spurTheme"
import { SpurPostCard } from "./SpurPostCard"
import { SpurPostEditor } from "./SpurPostEditor"
import { SpurCategoriesPanel } from "./SpurCategoriesPanel"
import { SpurSerialsPanel } from "./SpurSerialsPanel"
import { getSiteUrl } from "../../shared/site/getSiteUrl"

type Site = {
  id: string
  name: string
  subdomain: string
  custom_domain: string | null
  owner_id: string
  site_type: "cloud" | "static"
  site_origin: string
  created_at: string
}

type SpurAuthorPerms = {
  site_id: string
  user_id: string
  can_publish: boolean
  can_draft: boolean
  can_schedule: boolean
}

const NAV_FEATURES = [
  { key: "posts", label: "Posts" },
  { key: "serials", label: "Serials" },
  { key: "categories", label: "Categories" },
  { key: "writers", label: "Writers" },
  { key: "settings", label: "Settings" },
]

export function SpurPanel({ site, userId, supabase }: { site: Site; userId: string; supabase: any }) {
  const [allSites, setAllSites] = useState<Site[]>([site])
  const [authorPerms, setAuthorPerms] = useState<Record<string, SpurAuthorPerms>>({})
  const [activeSiteId, setActiveSiteId] = useState(site.id)
  const [feature, setFeature] = useState<SpurFeature>("posts")
  const [posts, setPosts] = useState<SpurPost[]>([])
  const [serials, setSerials] = useState<SpurSerial[]>([])
  const [serialsLoading, setSerialsLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "published" | "draft" | "scheduled">("all")
  const [editingPost, setEditingPost] = useState<SpurPost | null | "new">(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [darkMode, setDarkMode] = useState(false)
  const theme = darkMode ? SPUR_DARK : SPUR_LIGHT
  const activeSite = allSites.find(s => s.id === activeSiteId) ?? allSites[0]
  const activePerms = authorPerms[activeSiteId] ?? null
  const isOwner = !!activeSite && activeSite.owner_id === userId

  const canDraft = isOwner || !!activePerms?.can_draft
  const canPublish = isOwner || !!activePerms?.can_publish
  const canSchedule = isOwner || !!activePerms?.can_schedule

  const visibleFeatures = NAV_FEATURES.filter(({ key }) => {
    if (key === "posts") return true
    return isOwner
  })

  useEffect(() => {
    ;(async () => {
      const [{ data: ownedSites }, { data: authorRows }] = await Promise.all([
        supabase
          .from("sites")
          .select("*")
          .eq("owner_id", userId)
          .order("created_at", { ascending: false }),

        supabase
          .from("spur_authors")
          .select("site_id, user_id, can_publish, can_draft, can_schedule")
          .eq("user_id", userId),
      ])

      const permsBySite: Record<string, SpurAuthorPerms> = {}
      for (const row of authorRows ?? []) {
        permsBySite[row.site_id] = row
      }
      setAuthorPerms(permsBySite)

      const authorSiteIds = [...new Set((authorRows ?? []).map((row: any) => row.site_id).filter(Boolean))]
      let authorSites: Site[] = []

      if (authorSiteIds.length > 0) {
        const { data } = await supabase
          .from("sites")
          .select("*")
          .in("id", authorSiteIds)
          .order("created_at", { ascending: false })

        authorSites = data ?? []
      }

      const merged = [...(ownedSites ?? [])]
      for (const s of authorSites) {
        if (!merged.find(existing => existing.id === s.id)) merged.push(s)
      }

      setAllSites(merged)

      if (!merged.find(s => s.id === activeSiteId) && merged.length > 0) {
        setActiveSiteId(merged[0].id)
      }
    })()
  }, [supabase, userId])

  useEffect(() => {
    loadPosts()
    loadSerials()
  }, [activeSiteId])

  useEffect(() => {
    if (!isOwner && feature !== "posts") {
      setFeature("posts")
    }
  }, [isOwner, feature])

  useEffect(() => {
    if (editingPost === "new" && !canDraft) {
      setEditingPost(null)
    }
  }, [editingPost, canDraft])

  async function loadPosts() {
    setLoading(true)

    let query = supabase
      .from("spur_posts")
      .select("*")
      .eq("site_id", activeSiteId)
      .order("created_at", { ascending: false })

    if (!isOwner) {
      query = query.eq("author_id", userId)
    }

    const { data } = await query
    setPosts(data ?? [])
    setLoading(false)
  }

  async function loadSerials() {
    setSerialsLoading(true)

    let query = supabase
      .from("spur_serials")
      .select("*")
      .eq("site_id", activeSiteId)
      .order("updated_at", { ascending: false })

    if (!isOwner) {
      query = query.eq("author_id", userId)
    }

    const { data } = await query
    setSerials(data ?? [])
    setSerialsLoading(false)
  }

  function handleSaved(saved: SpurPost) {
    setPosts(prev => {
      const exists = prev.find(p => p.id === saved.id)
      return exists ? prev.map(p => p.id === saved.id ? saved : p) : [saved, ...prev]
    })
    setEditingPost(null)
  }

  async function handleDelete(post: SpurPost, e: React.MouseEvent) {
    e.stopPropagation()
    if (!isOwner && post.author_id !== userId) return
    if (!confirm(`Delete "${post.title}"?`)) return
    setDeletingId(post.id)
    await supabase.from("spur_posts").delete().eq("id", post.id)
    setPosts(prev => prev.filter(p => p.id !== post.id))
    setDeletingId(null)
  }

  const filtered = filter === "all" ? posts : posts.filter(p => p.status === filter)
  const count = {
    all:       posts.length,
    published: posts.filter(p => p.status === "published").length,
    draft:     posts.filter(p => p.status === "draft").length,
    scheduled: posts.filter(p => p.status === "scheduled").length,
  }

  const header = (
    <div style={{ flexShrink: 0, background: theme.bg, borderBottom: `1px solid ${theme.borderLight}`, position: "sticky", top: 0, zIndex: 20, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
      <div style={{ display: "flex", alignItems: "center", padding: "0 24px", height: 76, gap: 20 }}>
        <a href={activeSite ? getSiteUrl(activeSite) : "#"} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", flexShrink: 0 }}>
          <img src="/spur-logo.png" alt="Spur" style={{ height: 52, width: "auto", display: "block" }} />
        </a>
        {canDraft && (
          <button
            onClick={() => { setFeature("posts"); setEditingPost(null); setTimeout(() => setEditingPost("new"), 0) }}
            style={{ padding: "10px 16px", borderRadius: 9, border: "none", background: theme.accent, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: SPURF, display: "flex", alignItems: "center", gap: 6, flexShrink: 0, transition: "background 0.15s ease" }}
            onMouseEnter={e => e.currentTarget.style.background = theme.accentHov}
            onMouseLeave={e => e.currentTarget.style.background = theme.accent}
          >
            <svg viewBox="0 0 640 640" width={10} height={10} fill="currentColor"><path d="M320 64C306.7 64 296 74.7 296 88L296 296L88 296C74.7 296 64 306.7 64 320C64 333.3 74.7 344 88 344L296 344L296 552C296 565.3 306.7 576 320 576C333.3 576 344 565.3 344 552L344 344L552 344C565.3 344 576 333.3 576 320C576 306.7 565.3 296 552 296L344 296L344 88C344 74.7 333.3 64 320 64z"/></svg>
            New Post
          </button>
        )}
        <nav style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}>
          {visibleFeatures.map(({ key, label }) => {
            const active = feature === key
            return (
              <button key={key} onClick={() => { setFeature(key as SpurFeature); setEditingPost(null) }}
                style={{ padding: "9px 14px", border: `1px solid ${active ? theme.border : "transparent"}`, borderRadius: 4, background: active ? theme.borderLight : "transparent", color: active ? theme.text : theme.muted, fontSize: 13, fontWeight: active ? 600 : 500, cursor: "pointer", fontFamily: SPURF, transition: "all 0.12s ease", whiteSpace: "nowrap" }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.color = theme.text; e.currentTarget.style.background = theme.borderLight } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.color = theme.muted; e.currentTarget.style.background = "transparent" } }}>
                {label}
              </button>
            )
          })}
        </nav>
        <button onClick={() => setDarkMode(d => !d)}
          style={{ width: 32, height: 32, borderRadius: 4, border: "none", background: "transparent", color: theme.muted, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "color 0.12s, background 0.12s" }}
          onMouseEnter={e => { e.currentTarget.style.color = theme.text; e.currentTarget.style.background = theme.borderLight }}
          onMouseLeave={e => { e.currentTarget.style.color = theme.muted; e.currentTarget.style.background = "transparent" }}>
          {darkMode ? "☀" : "☾"}
        </button>
      </div>

      {!editingPost && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 24px", height: 52, borderTop: `1px solid ${theme.borderLight}` }}>
          {allSites.map(s => {
            const active = s.id === activeSiteId
            return (
              <button key={s.id} onClick={() => { setActiveSiteId(s.id); setEditingPost(null) }}
                style={{ padding: "7px 16px", borderRadius: 6, border: `1px solid ${active ? theme.accent + "66" : "transparent"}`, background: active ? theme.accentDim : "transparent", color: active ? theme.accent : theme.muted, fontSize: 14, fontWeight: active ? 700 : 500, cursor: "pointer", fontFamily: SPURF, transition: "all 0.12s ease", whiteSpace: "nowrap" }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.color = theme.text; e.currentTarget.style.background = theme.borderLight } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.color = theme.muted; e.currentTarget.style.background = "transparent" } }}>
                {s.name}
              </button>
            )
          })}
          {activeSite && (
            <a href={getSiteUrl(activeSite)} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 12, color: theme.dim, textDecoration: "none", fontFamily: SPURM, marginLeft: 2, marginRight: 8, opacity: 0.7, transition: "opacity 0.12s", whiteSpace: "nowrap", flexShrink: 0 }}
              onMouseEnter={e => e.currentTarget.style.opacity = "1"}
              onMouseLeave={e => e.currentTarget.style.opacity = "0.7"}>
              ↗ {getSiteUrl(activeSite).replace("https://", "")}
            </a>
          )}
          <div style={{ width: 1, height: 16, background: theme.border, flexShrink: 0, margin: "0 4px" }} />
          {feature === "posts" && (["all", "published", "draft", "scheduled"] as const).map(f => {
            const active = filter === f
            return (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding: "7px 14px", borderRadius: 6, border: "none", background: active ? theme.accentDim : "transparent", color: active ? theme.accent : theme.muted, fontSize: 14, fontWeight: active ? 700 : 500, fontFamily: SPURF, cursor: "pointer", transition: "all 0.12s ease", display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.color = theme.text; e.currentTarget.style.background = theme.borderLight } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.color = theme.muted; e.currentTarget.style.background = "transparent" } }}>
                {f === "all" ? "All" : f === "draft" ? "Drafts" : f.charAt(0).toUpperCase() + f.slice(1)}
                <span style={{ fontSize: 12, fontWeight: 700, background: active ? theme.accent + "33" : theme.border, color: active ? theme.accent : theme.dim, padding: "1px 6px", borderRadius: 4 }}>
                  {f === "all" ? count.all : count[f]}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )

  if (editingPost !== null) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", background: theme.bg }}>
        {header}
        <div style={{ flex: 1, overflow: "hidden" }}>
          <SpurPostEditor
            post={editingPost === "new" ? null : editingPost}
            siteId={activeSiteId}
            userId={userId}
            supabase={supabase}
            onSaved={handleSaved}
            onCancel={() => setEditingPost(null)}
            theme={theme}
            darkMode={darkMode}
            canDraft={canDraft}
            canPublish={canPublish}
            canSchedule={canSchedule}
          />
        </div>
      </div>
    )
  }

  function renderFeature() {
    if (feature === "posts") {
      return loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
          <div style={{ width: 28, height: 28, border: `3px solid ${theme.border}`, borderTopColor: theme.accent, borderRadius: "50%", animation: "spur-spin 0.7s linear infinite" }} />
          <style>{`@keyframes spur-spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 300, gap: 12 }}>
          <div style={{ fontSize: 40, opacity: 0.1 }}>✍</div>
          <div style={{ fontSize: 15, color: theme.muted, fontFamily: SPURF }}>No posts here yet.</div>
          {filter === "all" && canDraft && (
            <button onClick={() => setEditingPost("new")} style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: theme.accent, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: SPURF }}>
              New Post
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {filtered.map(post => (
            <SpurPostCard key={post.id} post={post} theme={theme} darkMode={darkMode}
              onEdit={() => setEditingPost(post)}
              onDelete={e => handleDelete(post, e)}
              onPreview={e => { e.stopPropagation(); window.open(`${getSiteUrl(activeSite)}/blog/${post.slug}`, "_blank") }}
              deleting={deletingId === post.id}
            />
          ))}
        </div>
      )
    }
    if (feature === "categories") {
      return <SpurCategoriesPanel siteId={activeSiteId} supabase={supabase} theme={theme} />
    }
    if (feature === "serials") {
      return (
        <SpurSerialsPanel
          siteId={activeSiteId}
          userId={userId}
          supabase={supabase}
          theme={theme}
          serials={serials}
          loading={serialsLoading}
          onChanged={loadSerials}
        />
      )
    }
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 300, gap: 8 }}>
        <div style={{ fontSize: 32, opacity: 0.15 }}>⚙</div>
        <div style={{ fontSize: 15, color: theme.muted, fontFamily: SPURF }}>{feature.charAt(0).toUpperCase() + feature.slice(1)} — coming soon.</div>
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: theme.bg, fontFamily: SPURF }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Geist+Mono:wght@400;500&display=swap');`}</style>
      {header}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px 32px" }}>
        {renderFeature()}
      </div>
    </div>
  )
}
