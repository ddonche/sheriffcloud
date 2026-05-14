const FONT   = `"Inter", system-ui, -apple-system, sans-serif`
const SHELL  = "#1a2730"
const CARD   = "#1e3040"
const BORDER = "#253540"
const TEAL   = "#5b95a7"
const TEXT   = "#f9fafb"
const MUTED  = "#c8d8e0"
const DIM    = "#8fa2ad"

type PublicPage = "home" | "pricing"

type Props = {
  page: PublicPage
  onHome: () => void
  onPricing: () => void
  onSignIn: () => void
  onGetStarted: () => void
}

function NavButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{
      border: "none", background: "transparent", color: MUTED,
      fontSize: 14, fontWeight: 700, fontFamily: FONT,
      cursor: "pointer", padding: "8px 10px",
    }}>
      {children}
    </button>
  )
}

function PrimaryButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{
      border: "none", borderRadius: 10, background: TEAL, color: "#fff",
      fontSize: 15, fontWeight: 800, fontFamily: FONT,
      cursor: "pointer", padding: "12px 18px",
      boxShadow: "0 12px 30px rgba(91,149,167,0.22)",
    }}>
      {children}
    </button>
  )
}

function SecondaryButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{
      border: `1px solid ${BORDER}`, borderRadius: 10,
      background: "transparent", color: MUTED,
      fontSize: 15, fontWeight: 800, fontFamily: FONT,
      cursor: "pointer", padding: "12px 18px",
    }}>
      {children}
    </button>
  )
}

function FeatureCard({ title, text }: { title: string; text: string }) {
  return (
    <div style={{
      background: CARD, border: `1px solid ${BORDER}`,
      borderRadius: 16, padding: 20, display: "grid", gap: 8,
    }}>
      <div style={{ color: TEXT, fontSize: 16, fontWeight: 850, fontFamily: FONT }}>{title}</div>
      <div style={{ color: DIM, fontSize: 14, lineHeight: 1.6, fontFamily: FONT }}>{text}</div>
    </div>
  )
}

function ProductPreview() {
  const cards = [
    ["Collections", "8"],
    ["Notes", "42"],
    ["Lists", "11"],
    ["Files", "19"],
    ["Passwords", "27"],
    ["Keys", "13"],
  ]

  return (
    <div style={{
      background: "#f8fafc", borderRadius: 22,
      border: "1px solid rgba(255,255,255,0.08)",
      padding: 18, boxShadow: "0 30px 80px rgba(0,0,0,0.28)",
    }}>
      <div style={{
        height: 42, display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid #e2e8f0", margin: "-18px -18px 16px", padding: "0 18px",
        color: "#0f172a", fontFamily: FONT, fontWeight: 900,
      }}>
        <span>All</span>
        <span style={{ fontSize: 12, color: "#64748b" }}>120 total</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {cards.map(([label, count]) => (
          <div key={label} style={{
            minHeight: 92, background: "#fff", border: "1px solid #e2e8f0",
            borderRadius: 14, padding: 14, display: "grid", alignContent: "center", gap: 8,
          }}>
            <div style={{ color: "#64748b", fontSize: 12, fontWeight: 800, fontFamily: FONT }}>{label}</div>
            <div style={{ color: "#0f172a", fontSize: 30, fontWeight: 950, lineHeight: 1, fontFamily: FONT }}>{count}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Landing({ onPricing, onGetStarted }: Pick<Props, "onPricing" | "onGetStarted">) {
  return (
    <>
      <section className="hol-public-hero" style={{
        maxWidth: 1180, margin: "0 auto", padding: "76px 24px 56px",
        display: "grid", gridTemplateColumns: "minmax(0, 1.05fr) minmax(320px, 0.95fr)",
        gap: 42, alignItems: "center",
      }}>
        <div style={{ display: "grid", gap: 22 }}>
          <div style={{
            display: "inline-flex", width: "fit-content", padding: "7px 12px",
            borderRadius: 999, border: `1px solid ${TEAL}55`,
            background: `${TEAL}18`, color: MUTED,
            fontSize: 13, fontWeight: 800, fontFamily: FONT,
          }}>
            Notes, files, lists, passwords, keys, snippets, and links.
          </div>

          <h1 style={{
            margin: 0, color: TEXT, fontSize: "clamp(42px, 7vw, 76px)",
            lineHeight: 0.96, letterSpacing: "-0.065em", fontWeight: 950, fontFamily: FONT,
          }}>
            Your operational memory.
          </h1>

          <p style={{
            margin: 0, color: MUTED, fontSize: 19, lineHeight: 1.65,
            maxWidth: 670, fontFamily: FONT,
          }}>
            Holster keeps the stuff you constantly need within reach: project notes, reusable commands,
            API keys, passwords, files, lists, links, and the random fragments your brain refuses to retain.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <PrimaryButton onClick={onGetStarted}>Get started</PrimaryButton>
            <SecondaryButton onClick={onPricing}>View pricing</SecondaryButton>
          </div>
        </div>

        <ProductPreview />
      </section>

      <section className="hol-public-grid" style={{
        maxWidth: 1180, margin: "0 auto", padding: "16px 24px 64px",
        display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16,
      }}>
        <FeatureCard title="One vault for the scattered stuff" text="Notes, lists, keys, passwords, files, snippets, and links live together instead of being scattered across five apps." />
        <FeatureCard title="No device-limit nonsense" text="Holster is web-first. Sign in from your laptop, desktop, tablet, or phone and keep your operational memory within reach." />
        <FeatureCard title="Built for projects and daily use" text="Use collections to group research, writing, code projects, business ops, credentials, checklists, and reference material." />
      </section>
    </>
  )
}

function PlanCard({
  name,
  description,
  price,
  priceSuffix,
  features,
  highlighted,
  button,
  onGetStarted,
}: {
  name: string
  description: string
  price: string
  priceSuffix?: string
  features: string[]
  highlighted?: boolean
  button: string
  onGetStarted: () => void
}) {
  return (
    <div style={{
      background: CARD,
      border: highlighted ? `1px solid ${TEAL}66` : `1px solid ${BORDER}`,
      borderRadius: 18,
      padding: 24,
      display: "grid",
      gap: 18,
      boxShadow: highlighted ? "0 20px 55px rgba(91,149,167,0.12)" : "none",
    }}>
      <div>
        <div style={{ color: TEXT, fontSize: 24, fontWeight: 900, fontFamily: FONT }}>{name}</div>
        <div style={{ color: DIM, marginTop: 6, fontSize: 14, lineHeight: 1.5, fontFamily: FONT }}>{description}</div>
      </div>

      <div style={{ color: TEXT, fontSize: 42, fontWeight: 950, fontFamily: FONT }}>
        {price}
        {priceSuffix && <span style={{ fontSize: 15, color: DIM, fontWeight: 700 }}> {priceSuffix}</span>}
      </div>

      <ul style={{ margin: 0, paddingLeft: 20, color: MUTED, lineHeight: 1.9, fontSize: 14, fontFamily: FONT }}>
        {features.map(feature => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>

      {highlighted ? (
        <PrimaryButton onClick={onGetStarted}>{button}</PrimaryButton>
      ) : (
        <SecondaryButton onClick={onGetStarted}>{button}</SecondaryButton>
      )}
    </div>
  )
}

export function Pricing({ onGetStarted }: Pick<Props, "onGetStarted">) {
  return (
    <section style={{ maxWidth: 1180, margin: "0 auto", padding: "70px 24px 76px", display: "grid", gap: 28 }}>
      <div style={{ display: "grid", gap: 10, textAlign: "center" }}>
        <h1 style={{ margin: 0, color: TEXT, fontSize: 48, letterSpacing: "-0.045em", fontWeight: 950, fontFamily: FONT }}>
          Simple pricing.
        </h1>
        <p style={{ margin: "0 auto", color: MUTED, fontSize: 17, lineHeight: 1.6, maxWidth: 680, fontFamily: FONT }}>
          Start free. Upgrade when Holster becomes part of your daily kit. Go Ultra when files, media, and video become part of the workflow.
        </p>
      </div>

      <div className="hol-public-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 18 }}>
        <PlanCard
          name="Free"
          description="For trying Holster and keeping a personal vault."
          price="$0"
          features={[
            "Unlimited notes, lists, snippets, links, passwords, and API keys",
            "20 collections",
            "250 MB storage",
            "10 MB max file uploads",
            "Unlimited devices",
          ]}
          button="Start free"
          onGetStarted={onGetStarted}
        />

        <PlanCard
          name="Pro"
          description="For people who use Holster as their daily operational memory."
          price="TBD"
          priceSuffix="/ month"
          highlighted
          features={[
            "Unlimited collections",
            "5 GB storage",
            "100 MB max file uploads",
            "Unlimited devices",
            "Keep existing data if you downgrade",
          ]}
          button="Get Pro"
          onGetStarted={onGetStarted}
        />

        <PlanCard
          name="Ultra"
          description="For heavier file storage, production assets, audio, and video."
          price="TBD"
          priceSuffix="/ month"
          features={[
            "Unlimited collections",
            "50 GB storage",
            "5 GB max file uploads",
            "Built for larger media files",
            "Keep existing data if you downgrade",
          ]}
          button="Go Ultra"
          onGetStarted={onGetStarted}
        />
      </div>
    </section>
  )
}

export default function HolsterLandingPage({ page, onHome, onPricing, onSignIn, onGetStarted }: Props) {
  return (
    <div style={{ minHeight: "100vh", background: SHELL, color: TEXT, display: "flex", flexDirection: "column" }}>
      <style>{`
        @media (max-width: 980px) {
          .hol-public-grid-3 { grid-template-columns: 1fr !important; }
        }

        @media (max-width: 860px) {
          .hol-public-hero { grid-template-columns: 1fr !important; padding-top: 46px !important; }
          .hol-public-grid { grid-template-columns: 1fr !important; }
          .hol-public-grid-2 { grid-template-columns: 1fr !important; }
          .hol-public-nav-links { display: none !important; }
        }
      `}</style>

      <header style={{
        height: 72, borderBottom: `1px solid ${BORDER}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", flexShrink: 0,
      }}>
        <button type="button" onClick={onHome} style={{ display: "flex", alignItems: "center", gap: 12, background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
          <img src="/logo.png" alt="Holster" style={{ height: 48, width: "auto", display: "block" }} />
          <span style={{ color: TEXT, fontSize: 26, fontWeight: 900, fontFamily: FONT, letterSpacing: "-0.025em" }}>Holster</span>
        </button>

        <nav className="hol-public-nav-links" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <NavButton onClick={onHome}>Home</NavButton>
          <NavButton onClick={onPricing}>Pricing</NavButton>
          <a href="/docs" style={{ color: MUTED, textDecoration: "none", fontSize: 14, fontWeight: 700, fontFamily: FONT, padding: "8px 10px" }}>Docs</a>
          <span style={{ color: DIM, fontSize: 14, fontWeight: 700, fontFamily: FONT, padding: "8px 10px" }}>Forum soon</span>
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <SecondaryButton onClick={onSignIn}>Sign in</SecondaryButton>
          <PrimaryButton onClick={onGetStarted}>Get started</PrimaryButton>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        {page === "pricing" ? <Pricing onGetStarted={onGetStarted} /> : <Landing onPricing={onPricing} onGetStarted={onGetStarted} />}
      </main>

      <footer style={{
        borderTop: `1px solid ${BORDER}`, padding: "24px",
        display: "flex", justifyContent: "space-between", gap: 18, flexWrap: "wrap",
        color: DIM, fontSize: 13, fontFamily: FONT,
      }}>
        <span>© {new Date().getFullYear()} Holster</span>
        <span>Part of the Sheriff Cloud ecosystem.</span>
      </footer>
    </div>
  )
}