import { Link } from "react-router-dom"
import { useState } from "react"
import { supabase } from "./supabase"

const FONT = `"DM Sans", "Inter", system-ui, sans-serif`

type Colors = {
  bg: string
  surface: string
  border: string
  borderLight: string
  text: string
  muted: string
  accent: string
  accentDim: string
}

export default function PricingPage({ colors }: { colors: Colors }) {
  const [coreLoading, setCoreLoading] = useState(false)
  const C = colors
  const SURFACE_2 = C.bg

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
      alert(`Unexpected error: ${err?.message ?? String(err)}`)
    } finally {
      setCoreLoading(false)
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: FONT }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "64px 20px 96px" }}>

        <section style={{ textAlign: "center", marginBottom: 52 }}>
          <div style={{ color: C.accent, fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
            Spur Pricing
          </div>
          <h1 style={{ fontSize: "clamp(2.4rem, 6vw, 4.3rem)", lineHeight: 1.02, letterSpacing: "-0.04em", margin: "0 0 16px" }}>
            Simple pricing for launch.
          </h1>
          <p style={{ maxWidth: 760, margin: "0 auto", color: C.muted, fontSize: 19, lineHeight: 1.7 }}>
            Start free. Upgrade to Core when you need more sites and custom domains.
            No bundles. No weird math. Just two tiers that make sense.
          </p>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, marginBottom: 34 }}>
          {/* Free */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: 28, display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 10 }}>Free</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 10 }}>
                <span style={{ fontSize: 40, fontWeight: 900, letterSpacing: "-0.04em" }}>$0</span>
                <span style={{ fontSize: 16, color: C.muted }}>/mo</span>
              </div>
              <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.65, margin: 0 }}>
                For getting started fast and publishing without friction.
              </p>
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10, fontSize: 15, lineHeight: 1.5 }}>
              <li>Up to 3 sites</li>
              <li>Blogs + docs included</li>
              <li>Spur subdomains</li>
              <li>Unlimited authors</li>
              <li>Perfect for trying the platform</li>
            </ul>
            <Link to="/" style={{ marginTop: "auto", padding: "13px 16px", borderRadius: 12, border: `1px solid ${C.border}`, background: "transparent", color: C.text, textDecoration: "none", textAlign: "center", fontWeight: 700 }}>
              Start Free
            </Link>
          </div>

          {/* Core */}
          <div style={{ background: SURFACE_2, border: `2px solid ${C.accent}`, borderRadius: 20, padding: 28, display: "flex", flexDirection: "column", gap: 18, position: "relative", boxShadow: "0 0 0 1px rgba(242,145,6,0.15), 0 20px 60px rgba(0,0,0,0.25)" }}>
            <div style={{ position: "absolute", top: 16, right: 16, background: C.accent, color: "#fff", fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", padding: "7px 10px", borderRadius: 999 }}>
              Launch Plan
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 10 }}>Core</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 10 }}>
                <span style={{ fontSize: 40, fontWeight: 900, letterSpacing: "-0.04em" }}>$9.99</span>
                <span style={{ fontSize: 16, color: C.muted }}>/mo</span>
              </div>
              <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.65, margin: 0 }}>
                For creators and builders who are ready to go live for real.
              </p>
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10, fontSize: 15, lineHeight: 1.5 }}>
              <li>Up to 5 sites</li>
              <li>Custom domains</li>
              <li>Everything in Free</li>
              <li>Best plan for serious use</li>
              <li>More tiers coming later</li>
            </ul>
            <button
              type="button"
              onClick={handleGoCore}
              disabled={coreLoading}
              style={{ marginTop: "auto", padding: "13px 16px", borderRadius: 12, border: "none", background: C.accent, color: "#fff", fontWeight: 800, fontFamily: FONT, opacity: coreLoading ? 0.7 : 1, cursor: coreLoading ? "wait" : "pointer" }}
            >
              {coreLoading ? "Loading…" : "Go Core"}
            </button>
          </div>
        </section>

        <section style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: 28, marginBottom: 34 }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ color: C.accent, fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
              What changes when you upgrade
            </div>
            <h2 style={{ fontSize: 30, lineHeight: 1.1, letterSpacing: "-0.03em", margin: "0 0 10px" }}>That's really it.</h2>
            <p style={{ color: C.muted, fontSize: 16, lineHeight: 1.7, margin: 0, maxWidth: 760 }}>
              Free gets you in the door. Core gives you more room and lets you use
              custom domains. That is the entire launch pitch.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            {[
              { label: "Free", value: "3 sites", text: "Use Spur subdomains and start publishing immediately." },
              { label: "Core", value: "5 sites", text: "Get more room to build and connect your own domains." },
              { label: "Domains", value: "Custom on Core", text: "Free stays on Spur subdomains. Core unlocks real domains." },
            ].map((item) => (
              <div key={item.label} style={{ border: `1px solid ${C.border}`, borderRadius: 16, padding: 18 }}>
                <div style={{ color: C.accent, fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>{item.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.15, marginBottom: 8 }}>{item.value}</div>
                <div style={{ color: C.muted, fontSize: 14, lineHeight: 1.65 }}>{item.text}</div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: 28, marginBottom: 44 }}>
          <div style={{ color: C.accent, fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
            How it works
          </div>
          <h2 style={{ fontSize: 30, lineHeight: 1.1, letterSpacing: "-0.03em", margin: "0 0 10px" }}>Dead simple.</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginTop: 18 }}>
            {[
              { num: "1", title: "Create your site", text: "Start on the free tier and begin writing right away." },
              { num: "2", title: "Use your subdomain", text: "Publish on Spur without messing with billing first." },
              { num: "3", title: "Upgrade to Core", text: "When you need more sites or want custom domains, go Core." },
            ].map((step) => (
              <div key={step.num} style={{ border: `1px solid ${C.border}`, borderRadius: 16, padding: 18 }}>
                <div style={{ width: 30, height: 30, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", background: C.accentDim, color: C.accent, fontWeight: 800, marginBottom: 12 }}>
                  {step.num}
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>{step.title}</div>
                <div style={{ color: C.muted, fontSize: 14, lineHeight: 1.6 }}>{step.text}</div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ textAlign: "center", padding: "10px 12px 0" }}>
          <h2 style={{ fontSize: 28, marginBottom: 12 }}>No bloated pricing table.</h2>
          <p style={{ color: C.muted, fontSize: 17, lineHeight: 1.7, maxWidth: 760, margin: "0 auto" }}>
            Launch with two tiers. Keep it clean. Add more plans later when they actually exist in the product.
          </p>
        </section>

      </div>
    </div>
  )
}
