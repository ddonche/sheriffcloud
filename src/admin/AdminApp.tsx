import { useEffect, useRef, useState } from "react"
import { getSupabase } from "./supabase"
import AuthModal from "./components/AuthModal"
import SiteHeader from "./components/SiteHeader"
import { SpurPanel } from "./spur/SpurPanel"
import AccountPanel from "./components/AccountPanel"
import SiteSettingsPanel from "./components/SiteSettingsPanel"
import { CodexPanel } from "./codex/CodexPanel"

// ─── Types ────────────────────────────────────────────────────────────────────

type Profile = {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  has_ai_access: boolean
  is_admin: boolean
  is_suspended: boolean
  avatar_url: string | null
}

type AccountPlan = {
  user_id: string
  base_plan: "free" | "core" | "creator" | "studio"
  status: string
}

type AccountEntitlements = {
  user_id: string
  site_limit: number
  custom_domain_access: boolean
  sites_storage_limit_mb: number
  holster_storage_limit_mb: number
  media_storage_limit_mb: number
  creator_bundle_access: boolean
  studio_access: boolean
}

type Site = {
  id: string
  name: string
  subdomain: string
  custom_domain: string | null
  owner_id: string
  site_type: "cloud" | "static"
  site_origin: string
  created_at: string
  logo_url: string | null
  bio: string | null
  tagline: string | null
}

type SiteApp = {
  site_id: string
  app: AppKey
  enabled: boolean
}

type SpurAuthorAccess = {
  site_id: string
  user_id: string
  can_publish: boolean
  can_draft: boolean
  can_schedule: boolean
}

type AppKey = "spur" | "docs" | "forum" | "codex"

type NavSelection =
  | { kind: "site"; siteId: string }
  | { kind: "app"; siteId: string; app: AppKey }
  | { kind: "spur" }
  | { kind: "docs" }
  | { kind: "forum" }
  | { kind: "account" }
  | { kind: "domains" }
  | { kind: "usage" }
  | { kind: "chatterbox" }
  | { kind: "holster" }
  | { kind: "codex" }

// ─── Constants ────────────────────────────────────────────────────────────────

const FONT = `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`

const APP_META: Record<AppKey, { label: string; color: string }> = {
  spur:  { label: "Blog",  color: "#b45309" },
  docs:  { label: "Docs",  color: "#0e7490" },
  forum: { label: "Forum", color: "#7c3aed" },
  codex: { label: "Codex", color: "#7c6af7" },
}

const SB = {
  bg:           "#111827",
  border:       "#1f2937",
  hover:        "#1f2937",
  active:       "#374151",
  activeBorder: "#3296ab",
  accent:       "#3296ab",
  textPrimary:  "#f9fafb",
  textMuted:    "#9ca3af",
  textDim:      "#4b5563",
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cleanSubdomain(val: string) {
  return val.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")
}

// ─── New Site Modal ───────────────────────────────────────────────────────────

function NewSiteModal({ onClose, onCreated, supabase, userId, siteLimit, existingSiteCount }: {
  onClose: () => void
  onCreated: (site: Site) => void
  supabase: any
  userId: string
  siteLimit: number
  existingSiteCount: number
}) {
  const [step, setStep] = useState<"identity" | "experience" | "apps">("identity")
  const [name, setName] = useState("")
  const [subdomain, setSubdomain] = useState("")
  const [subdomainManual, setSubdomainManual] = useState(false)
  const [siteType, setSiteType] = useState<"cloud" | "static" | null>(null)
  const [selectedApps, setSelectedApps] = useState<AppKey[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [subdomainStatus, setSubdomainStatus] = useState<"idle" | "checking" | "available" | "taken">("idle")
  const checkTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleNameChange(val: string) {
    setName(val)
    if (!subdomainManual) { const slug = cleanSubdomain(val); setSubdomain(slug); checkSubdomain(slug) }
  }

  function handleSubdomainChange(val: string) {
    setSubdomainManual(true); const slug = cleanSubdomain(val); setSubdomain(slug); checkSubdomain(slug)
  }

  function checkSubdomain(slug: string) {
    if (checkTimeout.current) clearTimeout(checkTimeout.current)
    if (!slug || slug.length < 2) { setSubdomainStatus("idle"); return }
    setSubdomainStatus("checking")
    checkTimeout.current = setTimeout(async () => {
      const { data } = await supabase.rpc("subdomain_available", { p_subdomain: slug })
      setSubdomainStatus(data === true ? "available" : "taken")
    }, 400)
  }

  function handleNext() {
    setError(null)
    if (step === "identity") {
      if (!name.trim() || !subdomain.trim()) { setError("Name and subdomain required."); return }
      if (subdomainStatus === "taken") { setError(`"${subdomain}" is already taken.`); return }
      if (subdomainStatus === "checking") { setError("Still checking subdomain…"); return }
      setStep("experience")
    } else if (step === "experience") {
      if (!siteType) { setError("Pick an experience."); return }
      if (siteType === "cloud") { setStep("apps"); return }
      handleCreate("static")
    } else { handleCreate("cloud") }
  }

  async function handleCreate(type: "cloud" | "static") {
    setSaving(true); setError(null)

    if (existingSiteCount >= siteLimit) {
      setError(`You have reached your site limit (${siteLimit}).`)
      setSaving(false)
      return
    }

    try {
      const { data: site, error: e } = await supabase.from("sites").insert({ name: name.trim(), subdomain, owner_id: userId, site_type: type }).select().single()
      if (e) throw new Error(e.code === "23505" ? `"${subdomain}" is already taken.` : e.message)
      if (type === "cloud" && selectedApps.length > 0) {
        await supabase.from("site_apps").insert(selectedApps.map(app => ({ site_id: site.id, app, enabled: true })))
        if (selectedApps.includes("spur")) await supabase.from("spur_settings").insert({ site_id: site.id, blog_title: name.trim() })
      }
      onCreated(site)
    } catch (err: any) { setError(err.message) } finally { setSaving(false) }
  }

  const canAdvance = step === "identity" ? (!!name.trim() && !!subdomain.trim()) : step === "experience" ? !!siteType : true

  return (
    <div style={M.overlay} onClick={onClose}>
      <div style={M.modal} onClick={e => e.stopPropagation()}>
        <div style={M.header}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {step !== "identity" && <button style={M.backBtn} onClick={() => { setError(null); setStep(step === "apps" ? "experience" : "identity") }}>←</button>}
            <span style={M.title}>{step === "identity" ? "Name your site" : step === "experience" ? "Choose your experience" : "Pick your apps"}</span>
          </div>
          <button style={M.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={M.body}>
          {step === "identity" && (
            <>
              <div style={M.field}><label style={M.label}>Site name</label><input style={M.input} placeholder="My Blog" value={name} onChange={e => handleNameChange(e.target.value)} autoFocus /></div>
              <div style={M.field}>
                <label style={M.label}>Subdomain</label>
                <div style={{ display: "flex" }}>
                  <input style={{ ...M.input, borderRadius: "4px 0 0 4px", flex: 1 }} placeholder="my-blog" value={subdomain} onChange={e => handleSubdomainChange(e.target.value)} />
                  <span style={M.suffix}>.sheriffcloud.com</span>
                </div>
                {subdomain.length >= 2 && <div style={{ fontSize: 12, marginTop: 4, color: subdomainStatus === "available" ? "#16a34a" : subdomainStatus === "taken" ? "#dc2626" : "#71717a" }}>{subdomainStatus === "checking" ? "Checking…" : subdomainStatus === "available" ? "✓ Available" : subdomainStatus === "taken" ? "✗ Already taken" : ""}</div>}
              </div>
            </>
          )}
          {step === "experience" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {([["cloud", "☁️", "Cloud Features", "Blog, docs, forum."], ["static", "📦", "Static Site", "Upload your own HTML."]] as const).map(([type, emoji, label, desc]) => (
                <button key={type} type="button" onClick={() => setSiteType(type)} style={{ ...M.expTile, borderColor: siteType === type ? "#1e293b" : "#d4d4d8", background: siteType === type ? "#f1f5f9" : "#fafafa" }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{emoji}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{label}</div>
                  <div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.5 }}>{desc}</div>
                </button>
              ))}
            </div>
          )}
          {step === "apps" && (
            <>
              <p style={{ margin: "0 0 4px", fontSize: 13, color: "#71717a" }}>Pick any — or none for a blank shell.</p>
              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.8fr 1.4fr", gap: 8 }}>
                {(Object.keys(APP_META) as AppKey[]).map(app => {
                  const meta = APP_META[app]; const active = selectedApps.includes(app)
                  return (
                    <button key={app} type="button" onClick={() => setSelectedApps(prev => prev.includes(app) ? prev.filter(a => a !== app) : [...prev, app])} style={{ ...M.appTile, borderColor: active ? meta.color : "#d4d4d8", background: active ? `${meta.color}12` : "#fafafa" }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: active ? meta.color : "#111827" }}>{meta.label}</span>
                    </button>
                  )
                })}
              </div>
            </>
          )}
          {error && <div style={M.error}>{error}</div>}
        </div>
        <div style={M.footer}>
          <button style={M.btnGhost} onClick={onClose}>Cancel</button>
          <button style={{ ...M.btnPrimary, opacity: (!canAdvance || saving) ? 0.5 : 1 }} onClick={handleNext} disabled={!canAdvance || saving}>
            {saving ? "Creating…" : (step === "apps" || (step === "experience" && siteType === "static")) ? "Create Site" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ ownedSites, sharedSpurSites, profile, plan, selection, onSelect, onNewSite, onSignOut }: {
  ownedSites: Site[]
  sharedSpurSites: Site[]
  profile: Profile
  plan: AccountPlan | null
  selection: NavSelection | null
  onSelect: (sel: NavSelection) => void
  onNewSite: () => void
  onSignOut: () => void
}) {
  const [sidebarWidth, setSidebarWidth] = useState(260)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const isDragging = useRef(false)
  const dragStartX = useRef(0)
  const dragStartWidth = useRef(0)

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!isDragging.current) return
      setSidebarWidth(Math.max(200, Math.min(400, dragStartWidth.current + e.clientX - dragStartX.current)))
    }
    function onMouseUp() {
      if (!isDragging.current) return
      isDragging.current = false
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
    document.addEventListener("mousemove", onMouseMove)
    document.addEventListener("mouseup", onMouseUp)
    return () => { document.removeEventListener("mousemove", onMouseMove); document.removeEventListener("mouseup", onMouseUp) }
  }, [])

  const sidebarNavItem = (kind: NavSelection["kind"], label: string) => {
    const active = selection?.kind === kind
    return (
      <button key={kind} type="button" onClick={() => onSelect({ kind } as NavSelection)}
        style={{ width: "100%", border: "none", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", padding: "8px 16px", background: active ? SB.active : "transparent", borderLeft: `3px solid ${active ? SB.activeBorder : "transparent"}`, transition: "background 0.1s", fontFamily: FONT }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.background = SB.hover }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent" }}
      >
        <span style={{ fontSize: 15, fontWeight: 500, color: active ? SB.textPrimary : SB.textMuted }}>{label}</span>
      </button>
    )
  }

  return (
    <div style={{ display: "flex", flexShrink: 0, height: "100%" }}>
      {sidebarOpen && (
        <div style={{ width: sidebarWidth, background: SB.bg, display: "flex", flexDirection: "column", overflow: "hidden", borderRight: `1px solid ${SB.border}` }}>
          <div style={{ padding: "14px 16px 12px", borderBottom: `1px solid ${SB.border}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <img src="/sheriff-logo.png" alt="Sheriff Cloud" style={{ height: 26, width: "auto" }} onError={e => { (e.target as HTMLImageElement).style.display = "none" }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: SB.textPrimary }}>Sheriff Cloud</span>
            </div>
            <button onClick={onNewSite} title="New site" style={{ width: 26, height: 26, borderRadius: 6, background: SB.active, border: `1px solid ${SB.border}`, color: SB.textMuted, cursor: "pointer", fontSize: 18, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = SB.accent; e.currentTarget.style.color = SB.accent }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = SB.border; e.currentTarget.style.color = SB.textMuted }}
            >+</button>
          </div>

          <div className="sc-sidebar-scroll" style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
            <div style={{ padding: "8px 16px 8px", fontSize: 11, fontWeight: 700, color: SB.textDim, letterSpacing: "0.08em", textTransform: "uppercase" }}>Editors</div>
            {([
              { kind: "spur" as const,  label: "Blog",  color: APP_META.spur.color  },
              { kind: "docs" as const,  label: "Docs",  color: APP_META.docs.color  },
              { kind: "forum" as const, label: "Forum", color: APP_META.forum.color },
            ]).map(({ kind, label, color }) => {
              const active = selection?.kind === kind
              return (
                <button key={kind} type="button" onClick={() => onSelect({ kind })}
                  style={{ width: "100%", border: "none", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", background: active ? SB.active : "transparent", borderLeft: `3px solid ${active ? color : "transparent"}`, transition: "background 0.1s", fontFamily: FONT }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = SB.hover }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent" }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: active ? color : SB.textDim, flexShrink: 0, transition: "background 0.1s" }} />
                  <span style={{ fontSize: 14, fontWeight: active ? 600 : 500, color: active ? SB.textPrimary : SB.textMuted }}>{label}</span>
                </button>
              )
            })}

            <div style={{ padding: "16px 16px 8px", fontSize: 11, fontWeight: 700, color: SB.textDim, letterSpacing: "0.08em", textTransform: "uppercase" }}>Sites</div>
            {ownedSites.length === 0 && <div style={{ padding: "6px 16px 12px", fontSize: 14, color: SB.textDim }}>No sites. Hit + to create one.</div>}
            {ownedSites.map(site => {
              const siteActive = selection?.kind === "site" && selection.siteId === site.id
              return (
                <button key={site.id} type="button" onClick={() => onSelect({ kind: "site", siteId: site.id })}
                  style={{ width: "100%", border: "none", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", background: siteActive ? SB.active : "transparent", borderLeft: `3px solid ${siteActive ? SB.activeBorder : "transparent"}`, transition: "background 0.1s", fontFamily: FONT }}
                  onMouseEnter={e => { if (!siteActive) e.currentTarget.style.background = SB.hover }}
                  onMouseLeave={e => { if (!siteActive) e.currentTarget.style.background = "transparent" }}
                >
                  <span style={{ width: 28, height: 28, borderRadius: 6, background: siteActive ? "#374151" : "#1f2937", color: "#e5e7eb", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {site.name.charAt(0).toUpperCase()}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: siteActive ? 600 : 500, color: siteActive ? SB.textPrimary : "#cbd5e1", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{site.name}</span>
                </button>
              )
            })}

            {sharedSpurSites.length > 0 && (
              <>
                <div style={{ padding: "16px 16px 8px", fontSize: 11, fontWeight: 700, color: SB.textDim, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Shared Blogs
                </div>
                {sharedSpurSites.map(site => {
                  const active = selection?.kind === "app" && selection.siteId === site.id && selection.app === "spur"
                  return (
                    <button
                      key={site.id}
                      type="button"
                      onClick={() => onSelect({ kind: "app", siteId: site.id, app: "spur" })}
                      style={{
                        width: "100%",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 16px",
                        background: active ? SB.active : "transparent",
                        borderLeft: `3px solid ${active ? APP_META.spur.color : "transparent"}`,
                        transition: "background 0.1s",
                        fontFamily: FONT
                      }}
                      onMouseEnter={e => { if (!active) e.currentTarget.style.background = SB.hover }}
                      onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent" }}
                    >
                      <span style={{ width: 28, height: 28, borderRadius: 6, background: active ? "#374151" : "#1f2937", color: "#e5e7eb", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {site.name.charAt(0).toUpperCase()}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: active ? 600 : 500, color: active ? SB.textPrimary : "#cbd5e1", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {site.name}
                      </span>
                    </button>
                  )
                })}
              </>
            )}

            <div style={{ padding: "16px 16px 8px", fontSize: 11, fontWeight: 700, color: SB.textDim, letterSpacing: "0.08em", textTransform: "uppercase" }}>Settings</div>
            {sidebarNavItem("account", "Account")}
            {sidebarNavItem("domains", "Domains")}
            {sidebarNavItem("usage", "Usage")}

            <div style={{ padding: "16px 16px 8px", fontSize: 11, fontWeight: 700, color: SB.textDim, letterSpacing: "0.08em", textTransform: "uppercase" }}>Tools</div>
            {sidebarNavItem("chatterbox", "Chatterbox")}
            {sidebarNavItem("holster", "Holster")}
            {sidebarNavItem("codex", "Codex")}
          </div>

          <div style={{ borderTop: `1px solid ${SB.border}`, padding: "10px 16px", flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: SB.active, border: `1px solid ${SB.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name || profile.username}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span style={{ fontSize: 12, fontWeight: 700, color: "#e5e7eb" }}>
                  {(profile.display_name || profile.username || "?").charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: SB.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile.display_name || profile.username}</div>
              <div style={{ fontSize: 10, color: SB.textDim, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {plan?.base_plan ?? "free"}
              </div>
            </div>
            <button onClick={onSignOut} title="Sign out" style={{ background: "none", border: "none", cursor: "pointer", color: SB.textDim, fontSize: 16, padding: "2px 4px", transition: "color 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
              onMouseLeave={e => e.currentTarget.style.color = SB.textDim}
            >↩</button>
          </div>
        </div>
      )}

      <div style={{ width: 16, flexShrink: 0, display: "flex", alignItems: "stretch", position: "relative", zIndex: 5 }}>
        {sidebarOpen && (
          <div onMouseDown={e => { isDragging.current = true; dragStartX.current = e.clientX; dragStartWidth.current = sidebarWidth; document.body.style.cursor = "col-resize"; document.body.style.userSelect = "none" }}
            style={{ flex: 1, cursor: "col-resize", background: SB.border, transition: "background 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.background = SB.accent}
            onMouseLeave={e => { if (!isDragging.current) e.currentTarget.style.background = SB.border }}
          />
        )}
        <button onClick={() => setSidebarOpen(v => !v)} title={sidebarOpen ? "Collapse" : "Expand"}
          style={{ position: "absolute", top: "50%", right: -12, transform: "translateY(-50%)", width: 24, height: 40, borderRadius: 6, background: SB.bg, border: `1px solid ${SB.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: SB.textMuted, zIndex: 10, transition: "color 0.15s, border-color 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.color = SB.accent; e.currentTarget.style.borderColor = SB.accent }}
          onMouseLeave={e => { e.currentTarget.style.color = SB.textMuted; e.currentTarget.style.borderColor = SB.border }}
        >
          <svg viewBox="0 0 640 640" width={12} height={12} fill="currentColor">
            {sidebarOpen ? <path d="M416 64L192 320L416 576L480 512L320 320L480 128Z" /> : <path d="M224 64L448 320L224 576L160 512L320 320L160 128Z" />}
          </svg>
        </button>
      </div>

      <style>{`
        .sc-sidebar-scroll { scrollbar-width: thin; scrollbar-color: #374151 transparent; }
        .sc-sidebar-scroll::-webkit-scrollbar { width: 6px; }
        .sc-sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .sc-sidebar-scroll::-webkit-scrollbar-thumb { background: #374151; border-radius: 3px; }
      `}</style>
    </div>
  )
}

// ─── Site Overview ────────────────────────────────────────────────────────────

function StubView({ title }: { title: string }) {
  return (
    <div style={{ padding: "32px", fontFamily: FONT }}>
      <h1 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800, color: "#111827" }}>{title}</h1>
      <p style={{ color: "#6b7280", fontSize: 14 }}>Coming soon.</p>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const supabase = getSupabase()
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [plan, setPlan] = useState<AccountPlan | null>(null)
  const [entitlements, setEntitlements] = useState<AccountEntitlements | null>(null)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [ownedSites, setOwnedSites] = useState<Site[]>([])
  const [sharedSpurSites, setSharedSpurSites] = useState<Site[]>([])
  const [siteApps, setSiteApps] = useState<Record<string, SiteApp[]>>({})
  const [showNewSite, setShowNewSite] = useState(false)
  const [selection, setSelection] = useState<NavSelection | null>(null)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data: { session } }: any) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_: any, s: any) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session?.user?.id || !supabase) {
      setProfileLoaded(false)
      return
    }

    ;(async () => {
      const userId = session.user.id

      const [
        { data: profileData, error: profileErr },
        { data: planData },
        { data: entitlementData },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, username, display_name, bio, has_ai_access, is_admin, is_suspended, avatar_url")
          .eq("id", userId)
          .single(),

        supabase
          .from("account_plans")
          .select("*")
          .eq("user_id", userId)
          .single(),

        supabase
          .from("account_entitlements")
          .select("*")
          .eq("user_id", userId)
          .single(),
      ])

      if (profileErr) {
        setProfileError(profileErr.message)
        setProfileLoaded(true)
        return
      }

      setProfile(profileData)

      setPlan(
        planData ?? {
          user_id: userId,
          base_plan: "free",
          status: "active",
        }
      )

      setEntitlements(
        entitlementData ?? {
          user_id: userId,
          site_limit: 3,
          custom_domain_access: false,
          sites_storage_limit_mb: 500,
          holster_storage_limit_mb: 0,
          media_storage_limit_mb: 0,
          creator_bundle_access: false,
          studio_access: false,
        }
      )

      setProfileLoaded(true)
    })()
  }, [session, supabase])

  useEffect(() => {
    if (profile && session?.user?.id) loadSites()
  }, [profile, session])

  async function loadSites() {
    if (!supabase || !session?.user?.id) return

    const userId = session.user.id

    const [{ data: owned }, { data: authorRows }] = await Promise.all([
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

    const ownedSitesData: Site[] = owned ?? []
    setOwnedSites(ownedSitesData)

    if (ownedSitesData.length) {
      const { data: appsData } = await supabase
        .from("site_apps")
        .select("*")
        .in("site_id", ownedSitesData.map((s: Site) => s.id))

      const grouped: Record<string, SiteApp[]> = {}
      for (const row of appsData ?? []) {
        if (!grouped[row.site_id]) grouped[row.site_id] = []
        grouped[row.site_id].push(row)
      }
      setSiteApps(grouped)
    } else {
      setSiteApps({})
    }

    const authorSiteIds = [...new Set((authorRows ?? []).map((row: SpurAuthorAccess) => row.site_id).filter(Boolean))]
    let sharedSitesData: Site[] = []

    if (authorSiteIds.length > 0) {
      const { data } = await supabase
        .from("sites")
        .select("*")
        .in("id", authorSiteIds)
        .order("created_at", { ascending: false })

      sharedSitesData = (data ?? []).filter((s: Site) => s.owner_id !== userId)
    }

    setSharedSpurSites(sharedSitesData)

    setSelection((prev: NavSelection | null) => prev ?? { kind: "spur" })
  }

  async function signOut() {
    await supabase!.auth.signOut()
    setSession(null)
    setProfile(null)
    setPlan(null)
    setEntitlements(null)
    setProfileLoaded(false)
    setOwnedSites([])
    setSharedSpurSites([])
    setSiteApps({})
    setSelection(null)
  }

  if (!supabase) return <div style={{ padding: 40, fontFamily: FONT }}>Supabase configuration missing.</div>
  if (!session) return <AuthModal />
  if (!profileLoaded) return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0b1020", color: "#e8ecf8", fontFamily: FONT }}>Loading…</div>
  if (!profile) return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0b1020", color: "#e8ecf8", fontFamily: FONT, padding: 24 }}>
      <div style={{ background: "#11182b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: 24, maxWidth: 500 }}>
        <h2 style={{ margin: "0 0 8px" }}>Profile missing</h2>
        <p style={{ margin: 0, color: "#94a3b8", fontSize: 13 }}>{profileError ?? "No profile row found."}</p>
      </div>
    </div>
  )
  if (profile.is_suspended) return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: FONT }}>This account is suspended.</div>

  const allAccessibleSites = [...ownedSites, ...sharedSpurSites]

  const selectedSite = (selection?.kind === "site" || selection?.kind === "app")
    ? allAccessibleSites.find(s => s.id === (selection as any).siteId) ?? null
    : null

  function renderMain() {
    if (!selection) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#9ca3af", fontFamily: FONT }}>Select a site or section from the sidebar.</div>

    if (selection.kind === "spur") {
      const defaultSpurSite = ownedSites[0] ?? sharedSpurSites[0] ?? null
      return defaultSpurSite ? <SpurPanel site={defaultSpurSite} userId={session.user.id} supabase={supabase} /> : <StubView title="Blog" />
    }
    if (selection.kind === "docs") return <StubView title="Docs" />
    if (selection.kind === "forum") return <StubView title="Forum" />

    if (selection.kind === "site" && selectedSite) {
      return (
        <SiteSettingsPanel
          site={selectedSite}
          apps={siteApps[selectedSite.id] ?? []}
          supabase={supabase}
          onSelect={setSelection}
          onSaved={(updatedSite: any) => {
            const normalizedSite: Site = {
              ...updatedSite,
              logo_url: updatedSite.logo_url ?? null,
              bio: updatedSite.bio ?? null,
              tagline: updatedSite.tagline ?? null,
            }

            setOwnedSites(prev => prev.map(s => s.id === normalizedSite.id ? normalizedSite : s))
            setSharedSpurSites(prev => prev.map(s => s.id === normalizedSite.id ? normalizedSite : s))
          }}
          onDeleted={() => {
            setOwnedSites(prev => prev.filter(s => s.id !== selectedSite.id))
            setSiteApps(prev => {
              const next = { ...prev }
              delete next[selectedSite.id]
              return next
            })
            setSelection(null)
          }}
        />
      )
    }

    if (selection.kind === "app" && selectedSite) {
      if (selection.app === "spur") return <SpurPanel site={selectedSite} userId={session.user.id} supabase={supabase} />
      return <StubView title={`${APP_META[selection.app as AppKey].label} — ${selectedSite.name}`} />
    }

    if (selection.kind === "account") {
      return profile ? (
        <AccountPanel
          profile={profile}
          supabase={supabase}
          onSaved={setProfile}
        />
      ) : null
    }
    if (selection.kind === "domains") return <StubView title="Domains" />
    if (selection.kind === "usage") return <StubView title="Usage" />
    if (selection.kind === "chatterbox") return <StubView title="Chatterbox" />
    if (selection.kind === "holster") return <StubView title="Holster" />
    if (selection.kind === "codex") {
      const defaultSite = ownedSites[0] ?? null
      return defaultSite ? <CodexPanel userId={session.user.id} siteId={defaultSite.id} supabase={supabase} /> : <StubView title="Codex" />
    }

    return null
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", fontFamily: FONT, background: "#f9fafb" }}>
      <SiteHeader userEmail={session.user.email} onSignOut={signOut} />
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Sidebar
          ownedSites={ownedSites}
          sharedSpurSites={sharedSpurSites}
          profile={profile}
          plan={plan}
          selection={selection}
          onSelect={setSelection}
          onNewSite={() => setShowNewSite(true)}
          onSignOut={signOut}
        />
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {renderMain()}
        </div>
      </div>
      {showNewSite && entitlements && (
        <NewSiteModal
          supabase={supabase}
          userId={session.user.id}
          siteLimit={entitlements.site_limit}
          existingSiteCount={ownedSites.length}
          onClose={() => setShowNewSite(false)}
          onCreated={site => {
            setOwnedSites(prev => [site, ...prev])
            setShowNewSite(false)
            setSelection({ kind: "site", siteId: site.id })
            loadSites()
          }}
        />
      )}
    </div>
  )
}

// ─── Modal styles ─────────────────────────────────────────────────────────────

const M: Record<string, React.CSSProperties> = {
  overlay:    { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24 },
  modal:      { background: "#fff", border: "1px solid #d4d4d8", borderRadius: 10, width: "100%", maxWidth: 480, boxShadow: "0 8px 32px rgba(0,0,0,0.18)", display: "flex", flexDirection: "column" },
  header:     { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 12px", borderBottom: "1px solid #e5e7eb" },
  title:      { fontSize: 15, fontWeight: 700, color: "#111827" },
  closeBtn:   { background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#71717a", padding: "2px 6px", lineHeight: 1, borderRadius: 4 },
  backBtn:    { background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#71717a", padding: "0 4px", lineHeight: 1, fontFamily: FONT },
  body:       { padding: 20, display: "flex", flexDirection: "column", gap: 16 },
  footer:     { display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 20px 16px", borderTop: "1px solid #e5e7eb" },
  field:      { display: "flex", flexDirection: "column", gap: 6 },
  label:      { fontSize: 13, fontWeight: 600, color: "#374151" },
  input:      { border: "1px solid #d4d4d8", borderRadius: 4, padding: "10px 12px", fontSize: 14, color: "#111827", background: "#fff", outline: "none", fontFamily: FONT },
  suffix:     { background: "#f4f4f5", border: "1px solid #d4d4d8", borderLeft: "none", borderRadius: "0 4px 4px 0", padding: "10px 12px", fontSize: 13, color: "#71717a", whiteSpace: "nowrap" },
  error:      { background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 4, padding: "10px 12px", fontSize: 13, color: "#dc2626" },
  expTile:    { border: "2px solid", borderRadius: 10, padding: "18px 14px", cursor: "pointer", textAlign: "left", display: "flex", flexDirection: "column", gap: 6, transition: "all 0.12s", fontFamily: FONT },
  appTile:    { border: "1px solid", borderRadius: 8, padding: "14px 10px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, textAlign: "center", transition: "all 0.12s", fontFamily: FONT },
  btnPrimary: { background: "#1e293b", color: "#fff", border: "none", borderRadius: 6, padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: FONT, whiteSpace: "nowrap" },
  btnGhost:   { background: "none", border: "1px solid #d4d4d8", borderRadius: 6, padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer", color: "#374151", fontFamily: FONT },
}
