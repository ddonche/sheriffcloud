import { useEffect, useRef, useState } from "react"
import { supabase } from "../../shared/supabase"

const FONT = `"DM Sans", "Inter", system-ui, sans-serif`
const SITE_ORIGIN = "spur"
const SITE_DOMAIN = "spur.ink"

const C = {
  overlay: "rgba(8,14,26,0.82)",
  modalBg: "#0d1525",
  border: "#1e2d47",
  borderLight: "#162038",
  text: "#e4eaf4",
  muted: "#6080a8",
  dim: "#2a3f5e",
  accent: "#f29106",
  accentHover: "#ffaa2e",
  accentDim: "rgba(242,145,6,0.1)",
  inputBg: "#080e1a",
  danger: "#ef4444",
  success: "#22c55e",
}

function cleanSubdomain(val: string) {
  return val
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

export default function CreateBlogModal({
  userId,
  open,
  onClose,
  onCreated,
}: {
  userId: string
  open: boolean
  onClose?: () => void
  onCreated: (site: any) => void
}) {
  const [name, setName] = useState("")
  const [subdomain, setSubdomain] = useState("")
  const [subdomainManual, setSubdomainManual] = useState(false)
  const [subdomainStatus, setSubdomainStatus] = useState<"idle" | "checking" | "available" | "taken">("idle")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const checkTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (checkTimeout.current) clearTimeout(checkTimeout.current)
    }
  }, [])

  if (!open) return null

  function handleNameChange(val: string) {
    setName(val)
    if (!subdomainManual) {
      const slug = cleanSubdomain(val)
      setSubdomain(slug)
      checkSubdomain(slug)
    }
  }

  function handleSubdomainChange(val: string) {
    setSubdomainManual(true)
    const slug = cleanSubdomain(val)
    setSubdomain(slug)
    checkSubdomain(slug)
  }

  function checkSubdomain(slug: string) {
    if (checkTimeout.current) clearTimeout(checkTimeout.current)

    if (!slug || slug.length < 2) {
      setSubdomainStatus("idle")
      return
    }

    setSubdomainStatus("checking")

    checkTimeout.current = setTimeout(async () => {
      const { data, error } = await supabase.rpc("subdomain_available", { p_subdomain: slug })
      if (error) {
        setSubdomainStatus("idle")
        return
      }
      setSubdomainStatus(data === true ? "available" : "taken")
    }, 350)
  }

  async function handleCreate() {
    setError(null)

    if (!name.trim() || !subdomain.trim()) {
      setError("Name and subdomain required.")
      return
    }

    if (subdomainStatus === "taken") {
      setError(`"${subdomain}" is already taken.`)
      return
    }

    if (subdomainStatus === "checking") {
      setError("Still checking subdomain…")
      return
    }

    setSaving(true)

    try {
      const { data: site, error: siteError } = await supabase
        .from("sites")
        .insert({
          name: name.trim(),
          subdomain,
          owner_id: userId,
          site_type: "cloud",
          site_origin: SITE_ORIGIN,
        })
        .select()
        .single()

      if (siteError) {
        throw new Error(siteError.code === "23505" ? `"${subdomain}" is already taken.` : siteError.message)
      }

      const { error: appsError } = await supabase
        .from("site_apps")
        .insert({
          site_id: site.id,
          app: "spur",
          enabled: true,
        })

      if (appsError) throw new Error(appsError.message)

      const { error: spurSettingsError } = await supabase
        .from("spur_settings")
        .insert({
          site_id: site.id,
          blog_title: name.trim(),
        })

      if (spurSettingsError) throw new Error(spurSettingsError.message)

      onCreated(site)
    } catch (err: any) {
      setError(err?.message ?? "Failed to create blog.")
    } finally {
      setSaving(false)
    }
  }

  const canSubmit =
    !!name.trim() &&
    !!subdomain.trim() &&
    subdomainStatus !== "taken" &&
    subdomainStatus !== "checking" &&
    !saving

  return (
    <div
      style={styles.overlay}
      onClick={() => {
        if (!saving && onClose) onClose()
      }}
    >
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div>
            <div style={styles.kicker}>Start writing</div>
            <h2 style={styles.title}>Create your blog</h2>
            <p style={styles.subtitle}>
              Pick a name and subdomain. You can add a description, logo, and more in the admin dashboard later.
            </p>
          </div>

          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              style={styles.closeBtn}
              disabled={saving}
              aria-label="Close"
            >
              ✕
            </button>
          ) : null}
        </div>

        <div style={styles.body}>
          <div style={styles.field}>
            <label style={styles.label}>Blog name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="My Blog"
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Subdomain</label>
            <div style={styles.subdomainRow}>
              <input
                value={subdomain}
                onChange={(e) => handleSubdomainChange(e.target.value)}
                placeholder="myblog"
                style={{ ...styles.input, borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
              />
              <div style={styles.suffix}>.{SITE_DOMAIN}</div>
            </div>

            {subdomain.length >= 2 ? (
              <div
                style={{
                  ...styles.subdomainStatus,
                  color:
                    subdomainStatus === "available"
                      ? C.success
                      : subdomainStatus === "taken"
                        ? C.danger
                        : C.muted,
                }}
              >
                {subdomainStatus === "checking" && "Checking…"}
                {subdomainStatus === "available" && "✓ Available"}
                {subdomainStatus === "taken" && "✗ Already taken"}
              </div>
            ) : null}
          </div>

          {error ? <div style={styles.error}>{error}</div> : null}
        </div>

        <div style={styles.footer}>
          {onClose ? (
            <button type="button" onClick={onClose} style={styles.secondaryBtn} disabled={saving}>
              Cancel
            </button>
          ) : null}

          <button
            type="button"
            onClick={handleCreate}
            disabled={!canSubmit}
            style={{
              ...styles.primaryBtn,
              opacity: canSubmit ? 1 : 0.5,
              cursor: canSubmit ? "pointer" : "not-allowed",
            }}
          >
            {saving ? "Creating…" : "Create Blog"}
          </button>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: C.overlay,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    zIndex: 10000,
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    fontFamily: FONT,
  },
  modal: {
    width: "100%",
    maxWidth: 560,
    background: C.modalBg,
    border: `1px solid ${C.border}`,
    borderRadius: 18,
    boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
    overflow: "hidden",
  },
  header: {
    padding: "24px 24px 16px",
    borderBottom: `1px solid ${C.borderLight}`,
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
  },
  kicker: {
    fontSize: 12,
    fontWeight: 700,
    color: C.accent,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    lineHeight: 1.05,
    letterSpacing: "-0.04em",
    fontWeight: 900,
    color: C.text,
    margin: 0,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 1.7,
    color: C.muted,
    margin: "10px 0 0",
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    border: `1px solid ${C.border}`,
    background: "transparent",
    color: C.muted,
    fontSize: 14,
    flexShrink: 0,
  },
  body: {
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: 700,
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  input: {
    width: "100%",
    border: `1px solid ${C.border}`,
    background: C.inputBg,
    color: C.text,
    borderRadius: 10,
    padding: "12px 14px",
    fontSize: 14,
    outline: "none",
    fontFamily: FONT,
  },
  subdomainRow: {
    display: "flex",
    alignItems: "stretch",
  },
  suffix: {
    display: "flex",
    alignItems: "center",
    padding: "0 14px",
    border: `1px solid ${C.border}`,
    borderLeft: "none",
    background: C.borderLight,
    color: C.muted,
    fontSize: 13,
    whiteSpace: "nowrap",
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  subdomainStatus: {
    fontSize: 12,
    fontWeight: 600,
    minHeight: 18,
  },
  error: {
    padding: "11px 12px",
    borderRadius: 10,
    border: `1px solid rgba(239,68,68,0.25)`,
    background: "rgba(239,68,68,0.08)",
    color: "#fca5a5",
    fontSize: 13,
  },
  footer: {
    padding: "18px 24px 24px",
    borderTop: `1px solid ${C.borderLight}`,
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
  },
  secondaryBtn: {
    padding: "11px 16px",
    borderRadius: 10,
    border: `1px solid ${C.border}`,
    background: "transparent",
    color: C.text,
    fontSize: 14,
    fontWeight: 700,
    fontFamily: FONT,
  },
  primaryBtn: {
    padding: "11px 16px",
    borderRadius: 10,
    border: "none",
    background: C.accent,
    color: "#fff",
    fontSize: 14,
    fontWeight: 800,
    fontFamily: FONT,
  },
}