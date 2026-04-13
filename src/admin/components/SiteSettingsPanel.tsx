import { useMemo, useRef, useState } from "react"
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
  logo_url?: string | null
  bio?: string | null
  tagline?: string | null
}

type SiteApp = {
  site_id: string
  app: "spur" | "docs" | "forum" | "codex"
  enabled: boolean
}

type NavSelection =
  | { kind: "site"; siteId: string }
  | { kind: "app"; siteId: string; app: "spur" | "docs" | "forum" | "codex" }

const FONT = `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`

const APP_META: Record<"spur" | "docs" | "forum" | "codex", { label: string; color: string }> = {
  spur:  { label: "Spur",  color: "#b45309" },
  docs:  { label: "Docs",  color: "#0e7490" },
  forum: { label: "Forum", color: "#7c3aed" },
  codex: { label: "Codex", color: "#7c6af7" },
}

export default function SiteSettingsPanel({
  site,
  apps,
  supabase,
  onDeleted,
  onSelect,
  onSaved,
}: {
  site: Site
  apps: SiteApp[]
  supabase: any
  onDeleted: () => void
  onSelect: (sel: NavSelection) => void
  onSaved: (site: Site) => void
}) {
  const [showDelete, setShowDelete] = useState(false)
  const [confirm, setConfirm] = useState("")
  const [deleting, setDeleting] = useState(false)

  const [siteName, setSiteName] = useState(site.name ?? "")
  const [tagline, setTagline] = useState(site.tagline ?? "")
  const [bio, setBio] = useState(site.bio ?? "")
  const [logoUrl, setLogoUrl] = useState<string | null>(site.logo_url ?? null)

  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const dirty = useMemo(() => {
    return (
      siteName !== (site.name ?? "") ||
      tagline !== (site.tagline ?? "") ||
      bio !== (site.bio ?? "")
    )
  }, [siteName, tagline, bio, site.name, site.tagline, site.bio])

  async function handleSave() {
    if (!dirty) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const payload = {
        name: siteName.trim(),
        tagline: tagline.trim() || null,
        bio: bio.trim() || null,
        updated_at: new Date().toISOString(),
      }

      const { data: updated, error: updateError } = await supabase
        .from("sites")
        .update(payload)
        .eq("id", site.id)
        .select("*")
        .single()

      if (updateError) throw new Error(updateError.message)

      onSaved(updated)
      setSuccess("Site settings saved.")
    } catch (err: any) {
      setError(err.message ?? "Save failed.")
    } finally {
      setSaving(false)
    }
  }

  async function handleLogoUpload(file: File) {
    setUploading(true)
    setError(null)
    setSuccess(null)

    try {
      const ext = (file.name.split(".").pop() || "png").toLowerCase()
      const safeExt = ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext) ? ext : "png"
      const path = `${site.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`

      const { error: uploadError } = await supabase.storage
        .from("site-logos")
        .upload(path, file, { upsert: false })

      if (uploadError) throw new Error(uploadError.message)

      const { data: urlData } = supabase.storage.from("site-logos").getPublicUrl(path)
      const publicUrl = urlData.publicUrl

      const { data: updated, error: updateError } = await supabase
        .from("sites")
        .update({
          logo_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", site.id)
        .select("*")
        .single()

      if (updateError) throw new Error(updateError.message)

      setLogoUrl(publicUrl)
      onSaved(updated)
      setSuccess("Site logo updated.")
    } catch (err: any) {
      setError(err.message ?? "Logo upload failed.")
    } finally {
      setUploading(false)
    }
  }

  async function handleRemoveLogo() {
    setError(null)
    setSuccess(null)

    const { data: updated, error: updateError } = await supabase
      .from("sites")
      .update({
        logo_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", site.id)
      .select("*")
      .single()

    if (updateError) {
      setError(updateError.message)
      return
    }

    setLogoUrl(null)
    onSaved(updated)
    setSuccess("Site logo removed.")
  }

  async function handleDelete() {
    if (confirm !== site.name) return
    setDeleting(true)
    await supabase.from("sites").delete().eq("id", site.id)
    onDeleted()
  }

  return (
    <div style={{ padding: "32px", fontFamily: FONT, overflowY: "auto", height: "100%" }}>
      <div style={{ maxWidth: 860 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#111827" }}>{siteName || site.name}</h1>
            <a
              href={getSiteUrl(site)}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 13, color: "#6b7280", textDecoration: "none", marginTop: 4, display: "block" }}
            >
              {getSiteUrl(site).replace("https://", "")} ↗
            </a>
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 24, marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 20 }}>
            Site Profile
          </div>

          <div style={{ display: "flex", gap: 20, alignItems: "flex-start", marginBottom: 24 }}>
            <div style={{ width: 96, flexShrink: 0 }}>
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Site logo"
                  style={{ width: 96, height: 96, borderRadius: 16, objectFit: "contain", border: "1px solid #e5e7eb", display: "block", background: "#fff" }}
                />
              ) : (
                <div
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: 16,
                    background: "#e5e7eb",
                    color: "#374151",
                    fontSize: 30,
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid #d4d4d8",
                  }}
                >
                  {(siteName || site.name || "?").charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) handleLogoUpload(file)
                  e.currentTarget.value = ""
                }}
              />

              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  style={{
                    padding: "9px 14px",
                    borderRadius: 6,
                    border: "1px solid #d4d4d8",
                    background: "#fff",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#111827",
                    cursor: uploading ? "default" : "pointer",
                    fontFamily: FONT,
                  }}
                >
                  {uploading ? "Uploading…" : logoUrl ? "Replace Logo" : "Upload Logo"}
                </button>

                {logoUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    style={{
                      padding: "9px 14px",
                      borderRadius: 6,
                      border: "1px solid #fecaca",
                      background: "#fff",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#dc2626",
                      cursor: "pointer",
                      fontFamily: FONT,
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>

              <div style={{ fontSize: 12, color: "#6b7280" }}>
                This logo represents the site itself, separate from user avatars.
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                Site Name
              </label>
              <input
                value={siteName}
                onChange={e => setSiteName(e.target.value)}
                placeholder="My Site"
                style={{
                  width: "100%",
                  border: "1px solid #d4d4d8",
                  borderRadius: 6,
                  padding: "10px 12px",
                  fontSize: 14,
                  color: "#111827",
                  outline: "none",
                  fontFamily: FONT,
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                Tagline
              </label>
              <input
                value={tagline}
                onChange={e => setTagline(e.target.value)}
                placeholder="A short one-line description"
                style={{
                  width: "100%",
                  border: "1px solid #d4d4d8",
                  borderRadius: 6,
                  padding: "10px 12px",
                  fontSize: 14,
                  color: "#111827",
                  outline: "none",
                  fontFamily: FONT,
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
              Site Bio
            </label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Tell people what this site is about."
              rows={5}
              style={{
                width: "100%",
                border: "1px solid #d4d4d8",
                borderRadius: 6,
                padding: "10px 12px",
                fontSize: 14,
                color: "#111827",
                outline: "none",
                fontFamily: FONT,
                resize: "vertical",
              }}
            />
          </div>

          {error && (
            <div style={{ marginBottom: 14, padding: "10px 12px", borderRadius: 6, background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: 13 }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ marginBottom: 14, padding: "10px 12px", borderRadius: 6, background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", fontSize: 13 }}>
              {success}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !dirty}
              style={{
                padding: "10px 18px",
                borderRadius: 6,
                border: "none",
                background: dirty ? "#1e293b" : "#e5e7eb",
                color: dirty ? "#fff" : "#9ca3af",
                fontSize: 14,
                fontWeight: 600,
                cursor: dirty && !saving ? "pointer" : "default",
                opacity: saving ? 0.7 : 1,
                fontFamily: FONT,
              }}
            >
              {saving ? "Saving…" : "Save Site"}
            </button>
          </div>
        </div>

        <div style={{ fontSize: 13, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>
          Apps
        </div>

        {apps.filter(a => a.enabled).length === 0 ? (
          <div style={{ fontSize: 14, color: "#9ca3af" }}>No apps enabled.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 32, maxWidth: 560 }}>
            {apps.filter(a => a.enabled).map(a => {
              const meta = APP_META[a.app]
              const label = a.app === "spur" ? "Blog" : meta.label
              return (
                <button
                  key={a.app}
                  type="button"
                  onClick={() => onSelect({ kind: "app", siteId: site.id, app: a.app })}
                  style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: 16, cursor: "pointer", textAlign: "left", transition: "border-color 0.1s", fontFamily: FONT }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = meta.color
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${meta.color}18`
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = "#e5e7eb"
                    e.currentTarget.style.boxShadow = "none"
                  }}
                >
                  <div style={{ fontSize: 15, fontWeight: 700, color: meta.color, marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>Open editor →</div>
                </button>
              )
            })}
          </div>
        )}

        <div style={{ background: "#fff", border: "1px solid #fecaca", borderRadius: 10, padding: 24, maxWidth: 560 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>
            Danger Zone
          </div>

          {!showDelete ? (
            <button
              onClick={() => setShowDelete(true)}
              style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #fca5a5", background: "none", fontSize: 13, fontWeight: 600, color: "#dc2626", cursor: "pointer", fontFamily: FONT }}
            >
              Delete Site
            </button>
          ) : (
            <>
              <p style={{ margin: "0 0 12px", fontSize: 13, color: "#374151" }}>
                Type <strong>{site.name}</strong> to confirm deletion. This cannot be undone.
              </p>

              <input
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder={site.name}
                style={{ display: "block", width: "100%", border: "1px solid #fca5a5", borderRadius: 4, padding: "8px 10px", fontSize: 13, marginBottom: 10, fontFamily: FONT, outline: "none" }}
              />

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => {
                    setShowDelete(false)
                    setConfirm("")
                  }}
                  style={{ padding: "7px 14px", borderRadius: 5, border: "1px solid #d4d4d8", background: "#fff", fontSize: 13, cursor: "pointer", fontFamily: FONT }}
                >
                  Cancel
                </button>

                <button
                  onClick={handleDelete}
                  disabled={confirm !== site.name || deleting}
                  style={{ padding: "7px 14px", borderRadius: 5, border: "none", background: "#dc2626", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: confirm !== site.name || deleting ? 0.4 : 1, fontFamily: FONT }}
                >
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}