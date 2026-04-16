import { useEffect, useMemo, useState } from "react"

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

type DocsPanelProps = {
  sites: Site[]
  initialSiteId: string | null
  userId: string
  supabase: any
}

type DocsTab = "files" | "build" | "settings"

const FONT = `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
const MONO = `"Geist Mono", "Fira Code", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`

const C = {
  bg: "#f9fafb",
  panel: "#ffffff",
  panelAlt: "#f3f4f6",
  border: "#e5e7eb",
  borderStrong: "#d1d5db",
  text: "#111827",
  muted: "#6b7280",
  dim: "#9ca3af",
  accent: "#0e7490",
  accentSoft: "#ecfeff",
  accentBorder: "#67e8f9",
  success: "#166534",
  successBg: "#dcfce7",
  warn: "#92400e",
  warnBg: "#fef3c7",
  dark: "#0f172a",
  dark2: "#1e293b",
  darkText: "#e2e8f0",
}

function siteUrl(site: Site) {
  if (site.custom_domain) return `https://${site.custom_domain}`
  return `https://${site.subdomain}.sheriffcloud.com`
}

function siteInitial(name: string) {
  return (name || "?").trim().charAt(0).toUpperCase()
}

function niceDate(value: string) {
  try {
    return new Date(value).toLocaleDateString()
  } catch {
    return value
  }
}

function EmptyState() {
  return (
    <div
      style={{
        flex: 1,
        display: "grid",
        placeItems: "center",
        padding: 32,
        background: C.bg,
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 620,
          background: C.panel,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          padding: 28,
          boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 800,
            color: C.accent,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          Docs
        </div>

        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: C.text,
            lineHeight: 1.15,
            marginBottom: 10,
          }}
        >
          No docs-enabled sites yet.
        </div>

        <div
          style={{
            fontSize: 15,
            color: C.muted,
            lineHeight: 1.7,
            marginBottom: 18,
          }}
        >
          Create a new site with Docs enabled, or enable Docs on one of your existing sites in the admin panel.
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 14px",
            borderRadius: 10,
            background: C.warnBg,
            color: C.warn,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Docs lives in Admin. Spur is the streamlined writing surface.
        </div>
      </div>
    </div>
  )
}

function SiteSwitcher({
  sites,
  activeSiteId,
  onChange,
}: {
  sites: Site[]
  activeSiteId: string | null
  onChange: (siteId: string) => void
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          color: C.dim,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        Docs Sites
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sites.map((site) => {
          const active = site.id === activeSiteId
          return (
            <button
              key={site.id}
              type="button"
              onClick={() => onChange(site.id)}
              style={{
                width: "100%",
                border: `1px solid ${active ? C.accentBorder : C.border}`,
                background: active ? C.accentSoft : C.panel,
                borderRadius: 12,
                padding: 12,
                textAlign: "left",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 12,
                transition: "all 0.12s ease",
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: active ? C.accent : C.dark2,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {siteInitial(site.name)}
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: C.text,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {site.name}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: C.muted,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    marginTop: 2,
                  }}
                >
                  {site.subdomain}.sheriffcloud.com
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function DocsTabs({
  tab,
  onChange,
}: {
  tab: DocsTab
  onChange: (tab: DocsTab) => void
}) {
  const tabs: DocsTab[] = ["files", "build", "settings"]

  return (
    <div
      style={{
        display: "inline-flex",
        gap: 6,
        padding: 4,
        borderRadius: 12,
        background: C.panelAlt,
        border: `1px solid ${C.border}`,
      }}
    >
      {tabs.map((item) => {
        const active = item === tab
        return (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            style={{
              border: "none",
              background: active ? C.panel : "transparent",
              color: active ? C.text : C.muted,
              padding: "8px 12px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              textTransform: "capitalize",
              cursor: "pointer",
              boxShadow: active ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
            }}
          >
            {item}
          </button>
        )
      })}
    </div>
  )
}

function FilesView({ activeSite }: { activeSite: Site }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "320px minmax(0, 1fr)",
        gap: 16,
        minHeight: 0,
        flex: 1,
      }}
    >
      <div
        style={{
          background: C.panel,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "14px 16px",
            borderBottom: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: C.dim,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              File Tree
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
              {activeSite.name}
            </div>
          </div>

          <button
            type="button"
            style={{
              border: "1px solid #cbd5e1",
              background: C.panel,
              color: C.text,
              borderRadius: 8,
              padding: "8px 10px",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
        </div>

        <div style={{ padding: 12, overflowY: "auto", flex: 1 }}>
          {[
            "content/",
            "content/index.md",
            "content/getting-started.md",
            "content/guides/",
            "content/guides/intro.md",
            "public/",
            "public/favicon.ico",
          ].map((item, idx) => {
            const active = idx === 1
            const isFolder = item.endsWith("/")
            return (
              <button
                key={item}
                type="button"
                style={{
                  width: "100%",
                  border: "none",
                  background: active ? C.accentSoft : "transparent",
                  color: active ? C.accent : C.text,
                  textAlign: "left",
                  padding: "10px 12px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ width: 16, textAlign: "center" }}>
                  {isFolder ? "▸" : "•"}
                </span>
                <span>{item}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div
        style={{
          background: C.panel,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "14px 16px",
            borderBottom: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: C.dim,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              Editor
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: C.text,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              content/index.md
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              style={{
                border: "1px solid #cbd5e1",
                background: C.panel,
                color: C.text,
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Preview
            </button>
            <button
              type="button"
              style={{
                border: "none",
                background: C.accent,
                color: "#fff",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Save
            </button>
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0, padding: 16 }}>
          <textarea
            defaultValue={`^^^^
title: Home
author: Dan
layout: docs
meta_kind: docs
meta_type: landing
summary: Sheriff docs home
gloss: Start here
^^^^

# Welcome to ${activeSite.name}

This is the new docs admin workspace shell.

Next step:
- hook this to your real file list
- hook save/build to your admin api
- read/write source by site UUID
`}
            spellCheck={false}
            style={{
              width: "100%",
              height: "100%",
              resize: "none",
              border: `1px solid ${C.borderStrong}`,
              borderRadius: 12,
              background: "#fff",
              color: C.text,
              padding: 14,
              boxSizing: "border-box",
              fontSize: 13,
              lineHeight: 1.65,
              fontFamily: MONO,
              outline: "none",
            }}
          />
        </div>
      </div>
    </div>
  )
}

function BuildView({ activeSite }: { activeSite: Site }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "340px minmax(0, 1fr)",
        gap: 16,
        minHeight: 0,
        flex: 1,
      }}
    >
      <div
        style={{
          background: C.panel,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: 18,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          alignSelf: "start",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: C.dim,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            Build Controls
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>
            {activeSite.name}
          </div>
        </div>

        <div
          style={{
            fontSize: 13,
            color: C.muted,
            lineHeight: 1.6,
          }}
        >
          Build this site’s docs from source and push the output to dist.
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          <button
            type="button"
            style={{
              border: "none",
              background: C.accent,
              color: "#fff",
              borderRadius: 10,
              padding: "12px 14px",
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Build Site
          </button>

          <button
            type="button"
            style={{
              border: "1px solid #cbd5e1",
              background: C.panel,
              color: C.text,
              borderRadius: 10,
              padding: "12px 14px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Build Current File
          </button>
        </div>

        <div
          style={{
            marginTop: 8,
            padding: "10px 12px",
            borderRadius: 10,
            background: C.successBg,
            color: C.success,
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          Last build status area goes here.
        </div>
      </div>

      <div
        style={{
          background: C.dark,
          border: `1px solid ${C.dark2}`,
          borderRadius: 14,
          padding: 16,
          minHeight: 420,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: "#94a3b8",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          Build Output
        </div>

        <pre
          style={{
            margin: 0,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            color: C.darkText,
            fontSize: 12,
            lineHeight: 1.6,
            fontFamily: MONO,
          }}
        >{`BUILD SUCCESS — ${activeSite.name}
===============================
Site: ${activeSite.name}
URL: ${siteUrl(activeSite)}
Mode: full

STDOUT
------
Ready for real build logs.

STDERR
------
(none)`}</pre>
      </div>
    </div>
  )
}

function SettingsView({ activeSite }: { activeSite: Site }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) 320px",
        gap: 16,
        minHeight: 0,
        flex: 1,
      }}
    >
      <div
        style={{
          background: C.panel,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: 18,
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: C.dim,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            Docs Settings
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>
            {activeSite.name}
          </div>
        </div>

        <div style={{ display: "grid", gap: 16, maxWidth: 720 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 6 }}>
              Public URL
            </div>
            <input
              value={siteUrl(activeSite)}
              readOnly
              style={{
                width: "100%",
                border: `1px solid ${C.borderStrong}`,
                borderRadius: 10,
                padding: "11px 12px",
                fontSize: 13,
                color: C.text,
                background: "#fff",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 6 }}>
              Created
            </div>
            <input
              value={niceDate(activeSite.created_at)}
              readOnly
              style={{
                width: "100%",
                border: `1px solid ${C.borderStrong}`,
                borderRadius: 10,
                padding: "11px 12px",
                fontSize: 13,
                color: C.text,
                background: "#fff",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 6 }}>
              Site Origin
            </div>
            <input
              value={activeSite.site_origin}
              readOnly
              style={{
                width: "100%",
                border: `1px solid ${C.borderStrong}`,
                borderRadius: 10,
                padding: "11px 12px",
                fontSize: 13,
                color: C.text,
                background: "#fff",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>
      </div>

      <div
        style={{
          background: C.panel,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: 18,
          alignSelf: "start",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: C.dim,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Status
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 10px",
            borderRadius: 10,
            background: C.successBg,
            color: C.success,
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          Docs enabled
        </div>
      </div>
    </div>
  )
}

export function DocsPanel({
  sites,
  initialSiteId,
  userId,
  supabase,
}: DocsPanelProps) {
  const [allSites, setAllSites] = useState<Site[]>(sites)
  const [activeSiteId, setActiveSiteId] = useState<string | null>(
    initialSiteId ?? sites[0]?.id ?? null
  )
  const [tab, setTab] = useState<DocsTab>("files")

  useEffect(() => {
    setAllSites(sites)
  }, [sites])

  useEffect(() => {
    if (!allSites.length) {
      setActiveSiteId(null)
      return
    }

    if (!activeSiteId || !allSites.find((site) => site.id === activeSiteId)) {
      setActiveSiteId(initialSiteId ?? allSites[0].id)
    }
  }, [allSites, activeSiteId, initialSiteId])

  const activeSite = useMemo(
    () => allSites.find((site) => site.id === activeSiteId) ?? null,
    [allSites, activeSiteId]
  )

  void userId
  void supabase

  if (!allSites.length) return <EmptyState />
  if (!activeSite) return <EmptyState />

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: "grid",
        gridTemplateColumns: "320px minmax(0, 1fr)",
        background: C.bg,
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          borderRight: `1px solid ${C.border}`,
          background: "#f8fafc",
          padding: 16,
          overflowY: "auto",
          minHeight: 0,
        }}
      >
        <SiteSwitcher
          sites={allSites}
          activeSiteId={activeSiteId}
          onChange={setActiveSiteId}
        />
      </div>

      <div
        style={{
          minWidth: 0,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "18px 20px",
            borderBottom: `1px solid ${C.border}`,
            background: C.panel,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: C.dim,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              Docs Workspace
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: C.text,
                lineHeight: 1.1,
              }}
            >
              {activeSite.name}
            </div>
            <div
              style={{
                fontSize: 13,
                color: C.muted,
                marginTop: 6,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {siteUrl(activeSite)}
            </div>
          </div>

          <DocsTabs tab={tab} onChange={setTab} />
        </div>

        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflow: "auto",
            padding: 16,
          }}
        >
          {tab === "files" && <FilesView activeSite={activeSite} />}
          {tab === "build" && <BuildView activeSite={activeSite} />}
          {tab === "settings" && <SettingsView activeSite={activeSite} />}
        </div>
      </div>
    </div>
  )
}