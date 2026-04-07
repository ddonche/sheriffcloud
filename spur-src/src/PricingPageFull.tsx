import { Link } from "react-router-dom"

const FONT = `"Geist", system-ui, sans-serif`
const BG = "#080e1a"
const SURFACE = "#0d1525"
const SURFACE_2 = "#101b2f"
const BORDER = "#1e2d47"
const TEXT = "#e8e8f0"
const MUTED = "#86a2c7"
const ACCENT = "#f29106"
const ACCENT_SOFT = "#f2910618"

const ADDONS = [
  { name: "Saloon", label: "Forums / community" },
  { name: "Courses", label: "Courses and learning products" },
  { name: "Podcasting", label: "Podcast publishing" },
  { name: "Posse", label: "Team collaboration" },
]

export default function PricingPage() {
  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT, fontFamily: FONT }}>
      <div style={{ maxWidth: 1220, margin: "0 auto", padding: "64px 20px 96px" }}>
        <section style={{ textAlign: "center", marginBottom: 52 }}>
          <div style={eyebrow}>SheriffCloud Pricing</div>
          <h1 style={heroTitle}>Build anything. Run everything.</h1>
          <p style={heroText}>
            Create blogs, docs, forums, courses, and podcasts — or upload your own static site.
            Start free, go live for $9.99, and add only what you need.
          </p>
        </section>

        <section style={modeSection}>
          <div style={modeCard}>
            <div style={modeIcon}>✍️</div>
            <div>
              <h2 style={modeTitle}>Creator Sites</h2>
              <p style={modeText}>
                Use built-in tools like blogs and docs, then unlock forums, courses, podcasting,
                and more when you want them.
              </p>
            </div>
          </div>
          <div style={modeCard}>
            <div style={modeIcon}>⬆️</div>
            <div>
              <h2 style={modeTitle}>Hosted Sites</h2>
              <p style={modeText}>
                Upload your own static website and host it on SheriffCloud with your custom domain.
                Great for React sites, client sites, landing pages, and portfolios.
              </p>
            </div>
          </div>
        </section>

        <section style={pricingGrid}>
          <div style={cardStyle}>
            <div>
              <div style={tierLabel}>Free</div>
              <div style={priceRow}>
                <span style={priceMain}>$0</span>
                <span style={priceSub}>/mo</span>
              </div>
              <p style={cardText}>Try the platform and start building.</p>
            </div>

            <ul style={featureList}>
              <li>Up to 3 sites</li>
              <li>Creator sites</li>
              <li>Blog + Docs</li>
              <li>Subdomains</li>
              <li>Unlimited authors</li>
            </ul>

            <Link to="/" style={buttonSecondary}>
              Start Free
            </Link>
          </div>

          <div style={{ ...cardStyle, ...featuredCardStyle }}>
            <div style={featuredPill}>Most Popular</div>
            <div>
              <div style={tierLabel}>Core</div>
              <div style={priceRow}>
                <span style={priceMain}>$9.99</span>
                <span style={priceSub}>/mo</span>
              </div>
              <p style={cardText}>Go live with real sites and real domains.</p>
            </div>

            <ul style={featureList}>
              <li>Up to 5 sites</li>
              <li>Custom domains</li>
              <li>Creator sites</li>
              <li>Hosted sites (static uploads)</li>
              <li>Everything in Free</li>
            </ul>

            <button style={buttonPrimary}>Go Live</button>
          </div>
        </section>

        <section style={addonSection}>
          <div style={{ marginBottom: 18 }}>
            <div style={eyebrow}>Add-ons</div>
            <h2 style={sectionTitle}>Add what you need — $9.99 each</h2>
            <p style={sectionText}>
              Every major capability costs the same. No per-site pricing. No weird math. Add a
              tool once and use it across your account.
            </p>
          </div>

          <div style={addonGrid}>
            {ADDONS.map((addon) => (
              <div key={addon.name} style={addonCard}>
                <div style={addonName}>{addon.name}</div>
                <div style={addonDesc}>{addon.label}</div>
                <div style={addonPrice}>+$9.99/mo</div>
              </div>
            ))}
          </div>
        </section>

        <section style={bundleGrid}>
          <div style={cardStyle}>
            <div>
              <div style={tierLabel}>Creator</div>
              <div style={priceRow}>
                <span style={priceMain}>$49.99</span>
                <span style={priceSub}>/mo</span>
              </div>
              <p style={cardText}>The full creator stack for serious builders.</p>
            </div>

            <ul style={featureList}>
              <li>Core included</li>
              <li>All current add-ons unlocked</li>
              <li>Use everything across your sites</li>
              <li>Best value vs stacking tools</li>
            </ul>

            <button style={buttonPrimary}>Get Everything</button>
          </div>

          <div style={cardStyle}>
            <div>
              <div style={tierLabel}>Studio</div>
              <div style={priceRow}>
                <span style={priceMain}>$99</span>
                <span style={priceSub}>/mo</span>
              </div>
              <p style={cardText}>Built for agencies, networks, and heavy usage.</p>
            </div>

            <ul style={featureList}>
              <li>Unlimited sites</li>
              <li>All current add-ons unlocked</li>
              <li>Higher usage limits</li>
              <li>For serious multi-site operations</li>
            </ul>

            <button style={buttonPrimary}>Scale Up</button>
          </div>
        </section>

        <section style={howSection}>
          <div style={eyebrow}>How it works</div>
          <h2 style={sectionTitle}>Simple all the way through</h2>
          <div style={stepsRow}>
            <div style={stepCard}>
              <div style={stepNum}>1</div>
              <div style={stepTitle}>Start free</div>
              <div style={stepText}>Try creator sites with blogs and docs on subdomains.</div>
            </div>
            <div style={stepCard}>
              <div style={stepNum}>2</div>
              <div style={stepTitle}>Upgrade to Core</div>
              <div style={stepText}>Go live with custom domains and hosted static sites.</div>
            </div>
            <div style={stepCard}>
              <div style={stepNum}>3</div>
              <div style={stepTitle}>Add tools</div>
              <div style={stepText}>Forums, courses, podcasting, and more — always $9.99 each.</div>
            </div>
            <div style={stepCard}>
              <div style={stepNum}>4</div>
              <div style={stepTitle}>Bundle or scale</div>
              <div style={stepText}>Grab the full stack or move up when you’re running serious volume.</div>
            </div>
          </div>
        </section>

        <section style={bottomNote}>
          <h2 style={{ fontSize: 28, marginBottom: 12 }}>No plugins. No Frankenstein stack.</h2>
          <p style={{ color: MUTED, fontSize: 17, lineHeight: 1.7, maxWidth: 820, margin: "0 auto" }}>
            Build with SheriffCloud’s tools or bring your own site. Either way, everything lives in
            one system that actually makes sense.
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
  maxWidth: 820,
  margin: "0 auto",
  color: MUTED,
  fontSize: 19,
  lineHeight: 1.7,
}

const modeSection: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 20,
  marginBottom: 34,
}

const modeCard: React.CSSProperties = {
  display: "flex",
  gap: 16,
  background: SURFACE,
  border: `1px solid ${BORDER}`,
  borderRadius: 18,
  padding: 22,
}

const modeIcon: React.CSSProperties = {
  width: 46,
  height: 46,
  borderRadius: 12,
  background: ACCENT_SOFT,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 22,
  flexShrink: 0,
}

const modeTitle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 800,
  margin: "0 0 6px",
}

const modeText: React.CSSProperties = {
  color: MUTED,
  fontSize: 15,
  lineHeight: 1.65,
  margin: 0,
}

const pricingGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 24,
  marginBottom: 34,
}

const bundleGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 24,
  marginBottom: 42,
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
  cursor: "pointer",
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

const addonSection: React.CSSProperties = {
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
  maxWidth: 820,
}

const addonGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 16,
}

const addonCard: React.CSSProperties = {
  border: `1px solid ${BORDER}`,
  borderRadius: 16,
  padding: 18,
  background: "rgba(255,255,255,0.02)",
}

const addonName: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
  marginBottom: 6,
}

const addonDesc: React.CSSProperties = {
  color: MUTED,
  fontSize: 14,
  lineHeight: 1.55,
  marginBottom: 12,
}

const addonPrice: React.CSSProperties = {
  color: ACCENT,
  fontSize: 14,
  fontWeight: 800,
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
