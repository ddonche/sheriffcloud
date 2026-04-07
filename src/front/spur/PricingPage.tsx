import { Link } from "react-router-dom"
import { useState } from "react"
import { supabase } from "./supabase"

const FONT = `"Geist", system-ui, sans-serif`
const BG = "#080e1a"
const SURFACE = "#0d1525"
const SURFACE_2 = "#101b2f"
const BORDER = "#1e2d47"
const TEXT = "#e8e8f0"
const MUTED = "#86a2c7"
const ACCENT = "#f29106"
const ACCENT_SOFT = "#f2910618"

export default function PricingPage() {
  const [coreLoading, setCoreLoading] = useState(false)

  async function handleGoCore() {
    try {
      setCoreLoading(true)

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        alert(`Session error: ${sessionError.message}`)
        return
      }

      if (!session) {
        window.dispatchEvent(new CustomEvent("spur:open-auth", { detail: { mode: "signup" } }))
        alert("You need to log in first.")
        return
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

      const res = await fetch(`${supabaseUrl}/functions/v1/create_checkout_session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({}),
      })

      const text = await res.text()
      let payload: any = null

      try {
        payload = text ? JSON.parse(text) : null
      } catch {
        payload = text
      }

      console.log("checkout status", res.status)
      console.log("checkout payload", payload)

      if (!res.ok) {
        alert(`Checkout failed (${res.status}): ${typeof payload === "string" ? payload : JSON.stringify(payload)}`)
        return
      }

      if (!payload?.url) {
        alert(`No checkout URL returned: ${JSON.stringify(payload)}`)
        return
      }

      window.location.href = payload.url
    } catch (err: any) {
      console.error(err)
      alert(`Unexpected error: ${err?.message ?? String(err)}`)
    } finally {
      setCoreLoading(false)
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT, fontFamily: FONT }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "64px 20px 96px" }}>
        <section style={{ textAlign: "center", marginBottom: 52 }}>
          <div style={eyebrow}>SheriffCloud Pricing</div>
          <h1 style={heroTitle}>Simple pricing for launch.</h1>
          <p style={heroText}>
            Start free. Upgrade to Core when you need more sites and custom domains.
            No bundles. No weird math. Just two tiers that make sense.
          </p>
        </section>

        <section style={pricingGrid}>
          <div style={cardStyle}>
            <div>
              <div style={tierLabel}>Free</div>
              <div style={priceRow}>
                <span style={priceMain}>$0</span>
                <span style={priceSub}>/mo</span>
              </div>
              <p style={cardText}>
                For getting started fast and publishing without friction.
              </p>
            </div>

            <ul style={featureList}>
              <li>Up to 3 sites</li>
              <li>Blogs + docs included</li>
              <li>SheriffCloud subdomains</li>
              <li>Unlimited authors</li>
              <li>Perfect for trying the platform</li>
            </ul>

            <Link to="/" style={buttonSecondary}>
              Start Free
            </Link>
          </div>

          <div style={{ ...cardStyle, ...featuredCardStyle }}>
            <div style={featuredPill}>Launch Plan</div>
            <div>
              <div style={tierLabel}>Core</div>
              <div style={priceRow}>
                <span style={priceMain}>$9.99</span>
                <span style={priceSub}>/mo</span>
              </div>
              <p style={cardText}>
                For creators and builders who are ready to go live for real.
              </p>
            </div>

            <ul style={featureList}>
              <li>Up to 5 sites</li>
              <li>Custom domains</li>
              <li>Everything in Free</li>
              <li>Best plan for serious use</li>
              <li>More tiers can come later</li>
            </ul>

            <button
              type="button"
              onClick={handleGoCore}
              disabled={coreLoading}
              style={{
                ...buttonPrimary,
                opacity: coreLoading ? 0.7 : 1,
                cursor: coreLoading ? "wait" : "pointer",
              }}
            >
              {coreLoading ? "Loading…" : "Go Core"}
            </button>
          </div>
        </section>

        <section style={comparisonSection}>
          <div style={{ marginBottom: 18 }}>
            <div style={eyebrow}>What changes when you upgrade</div>
            <h2 style={sectionTitle}>That’s really it.</h2>
            <p style={sectionText}>
              Free gets you in the door. Core gives you more room and lets you use
              custom domains. That is the entire launch pitch.
            </p>
          </div>

          <div style={comparisonGrid}>
            <div style={comparisonCard}>
              <div style={comparisonLabel}>Free</div>
              <div style={comparisonValue}>3 sites</div>
              <div style={comparisonText}>Use SheriffCloud subdomains and start publishing immediately.</div>
            </div>

            <div style={comparisonCard}>
              <div style={comparisonLabel}>Core</div>
              <div style={comparisonValue}>5 sites</div>
              <div style={comparisonText}>Get more room to build and connect your own domains.</div>
            </div>

            <div style={comparisonCard}>
              <div style={comparisonLabel}>Domains</div>
              <div style={comparisonValue}>Custom on Core</div>
              <div style={comparisonText}>Free stays on SheriffCloud subdomains. Core unlocks real domains.</div>
            </div>
          </div>
        </section>

        <section style={howSection}>
          <div style={eyebrow}>How it works</div>
          <h2 style={sectionTitle}>Dead simple.</h2>

          <div style={stepsRow}>
            <div style={stepCard}>
              <div style={stepNum}>1</div>
              <div style={stepTitle}>Create your site</div>
              <div style={stepText}>Start on the free tier and begin writing right away.</div>
            </div>

            <div style={stepCard}>
              <div style={stepNum}>2</div>
              <div style={stepTitle}>Use your subdomain</div>
              <div style={stepText}>Publish on SheriffCloud without messing with billing first.</div>
            </div>

            <div style={stepCard}>
              <div style={stepNum}>3</div>
              <div style={stepTitle}>Upgrade to Core</div>
              <div style={stepText}>When you need more sites or want custom domains, go Core.</div>
            </div>
          </div>
        </section>

        <section style={bottomNote}>
          <h2 style={{ fontSize: 28, marginBottom: 12 }}>No bloated pricing table.</h2>
          <p
            style={{
              color: MUTED,
              fontSize: 17,
              lineHeight: 1.7,
              maxWidth: 760,
              margin: "0 auto",
            }}
          >
            Launch with two tiers. Keep it clean. Add more plans later when they actually
            exist in the product.
          </p>
        </section>
      </div>
    </div>
  )
}

const eyebrow: React.CSSProperties = {
  color: ACCENT,
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  marginBottom: 10,
}

const heroTitle: React.CSSProperties = {
  fontSize: "clamp(2.4rem, 6vw, 4.3rem)",
  lineHeight: 1.02,
  letterSpacing: "-0.04em",
  margin: "0 0 16px",
}

const heroText: React.CSSProperties = {
  maxWidth: 760,
  margin: "0 auto",
  color: MUTED,
  fontSize: 19,
  lineHeight: 1.7,
}

const pricingGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 24,
  marginBottom: 34,
}

const cardStyle: React.CSSProperties = {
  background: SURFACE,
  border: `1px solid ${BORDER}`,
  borderRadius: 20,
  padding: 28,
  display: "flex",
  flexDirection: "column",
  gap: 18,
  minHeight: 100,
}

const featuredCardStyle: React.CSSProperties = {
  border: `2px solid ${ACCENT}`,
  background: SURFACE_2,
  boxShadow: "0 0 0 1px rgba(242,145,6,0.15), 0 20px 60px rgba(0,0,0,0.25)",
  position: "relative",
}

const featuredPill: React.CSSProperties = {
  position: "absolute",
  top: 16,
  right: 16,
  background: ACCENT,
  color: "#fff",
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  padding: "7px 10px",
  borderRadius: 999,
}

const tierLabel: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 800,
  marginBottom: 10,
}

const priceRow: React.CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: 6,
  marginBottom: 10,
}

const priceMain: React.CSSProperties = {
  fontSize: 40,
  fontWeight: 900,
  letterSpacing: "-0.04em",
}

const priceSub: React.CSSProperties = {
  fontSize: 16,
  color: MUTED,
}

const cardText: React.CSSProperties = {
  color: MUTED,
  fontSize: 15,
  lineHeight: 1.65,
  margin: 0,
}

const featureList: React.CSSProperties = {
  listStyle: "none",
  padding: 0,
  margin: 0,
  display: "grid",
  gap: 10,
  color: "#d7deea",
  fontSize: 15,
  lineHeight: 1.5,
}

const buttonPrimary: React.CSSProperties = {
  marginTop: "auto",
  padding: "13px 16px",
  borderRadius: 12,
  border: "none",
  background: ACCENT,
  color: "#fff",
  fontWeight: 800,
  fontFamily: FONT,
}

const buttonSecondary: React.CSSProperties = {
  marginTop: "auto",
  padding: "13px 16px",
  borderRadius: 12,
  border: `1px solid ${BORDER}`,
  background: "transparent",
  color: TEXT,
  textDecoration: "none",
  textAlign: "center",
  fontWeight: 700,
}

const comparisonSection: React.CSSProperties = {
  background: SURFACE,
  border: `1px solid ${BORDER}`,
  borderRadius: 20,
  padding: 28,
  marginBottom: 34,
}

const sectionTitle: React.CSSProperties = {
  fontSize: 30,
  lineHeight: 1.1,
  letterSpacing: "-0.03em",
  margin: "0 0 10px",
}

const sectionText: React.CSSProperties = {
  color: MUTED,
  fontSize: 16,
  lineHeight: 1.7,
  margin: 0,
  maxWidth: 760,
}

const comparisonGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 16,
}

const comparisonCard: React.CSSProperties = {
  border: `1px solid ${BORDER}`,
  borderRadius: 16,
  padding: 18,
  background: "rgba(255,255,255,0.02)",
}

const comparisonLabel: React.CSSProperties = {
  color: ACCENT,
  fontSize: 12,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: 10,
}

const comparisonValue: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 800,
  lineHeight: 1.15,
  marginBottom: 8,
}

const comparisonText: React.CSSProperties = {
  color: MUTED,
  fontSize: 14,
  lineHeight: 1.65,
}

const howSection: React.CSSProperties = {
  background: SURFACE,
  border: `1px solid ${BORDER}`,
  borderRadius: 20,
  padding: 28,
  marginBottom: 44,
}

const stepsRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 16,
}

const stepCard: React.CSSProperties = {
  border: `1px solid ${BORDER}`,
  borderRadius: 16,
  padding: 18,
  background: "rgba(255,255,255,0.02)",
}

const stepNum: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: ACCENT_SOFT,
  color: ACCENT,
  fontWeight: 800,
  marginBottom: 12,
}

const stepTitle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
  marginBottom: 6,
}

const stepText: React.CSSProperties = {
  color: MUTED,
  fontSize: 14,
  lineHeight: 1.6,
}

const bottomNote: React.CSSProperties = {
  textAlign: "center",
  padding: "10px 12px 0",
}