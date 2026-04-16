const FONT = `"DM Sans", "Inter", system-ui, sans-serif`
const FONT_MONO = `"DM Mono", "Fira Code", monospace`

type Colors = {
  bg: string
  surface: string
  border: string
  borderLight: string
  text: string
  muted: string
  dim: string
  accent: string
}

function LegalLayout({ colors, title, updated, children }: { colors: Colors; title: string; updated: string; children: React.ReactNode }) {
  const C = colors
  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: FONT }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "64px 24px 96px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, fontFamily: FONT_MONO, color: C.accent, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>
          Legal
        </div>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", lineHeight: 1.05, letterSpacing: "-0.04em", fontWeight: 900, marginBottom: 10 }}>
          {title}
        </h1>
        <div style={{ fontSize: 13, color: C.dim, fontFamily: FONT_MONO, marginBottom: 48 }}>
          Last updated: {updated}
        </div>
        <div style={{ fontSize: 16, lineHeight: 1.85, color: C.muted }}>
          {children}
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em", color: "inherit", marginBottom: 10 }}>{title}</h2>
      {children}
    </div>
  )
}

export default function PrivacyPage({ colors }: { colors: Colors }) {
  return (
    <LegalLayout colors={colors} title="Privacy Policy" updated="April 15, 2026">
      <Section title="Overview">
        <p>Spur ("we," "our," or "us") operates as part of Sheriff Cloud. This Privacy Policy explains what information we collect, how we use it, and what rights you have regarding your data. By using Spur, you agree to the practices described here.</p>
      </Section>

      <Section title="Information We Collect">
        <p style={{ marginBottom: 12 }}>We collect information you provide directly, including:</p>
        <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
          <li style={{ marginBottom: 8 }}>Account information (email address, display name, avatar) when you register</li>
          <li style={{ marginBottom: 8 }}>Content you create (blog posts, comments, profile information)</li>
          <li style={{ marginBottom: 8 }}>Payment information processed through Stripe (we do not store card details)</li>
          <li>Communications you send us</li>
        </ul>
        <p>We also collect limited technical data automatically, such as your IP address, browser type, and pages visited, to operate and improve the service.</p>
      </Section>

      <Section title="How We Use Your Information">
        <p style={{ marginBottom: 12 }}>We use collected information to:</p>
        <ul style={{ paddingLeft: 20 }}>
          <li style={{ marginBottom: 8 }}>Provide and maintain the Spur platform</li>
          <li style={{ marginBottom: 8 }}>Process payments and manage your subscription</li>
          <li style={{ marginBottom: 8 }}>Send you service-related communications</li>
          <li style={{ marginBottom: 8 }}>Improve and develop new features</li>
          <li>Comply with legal obligations</li>
        </ul>
      </Section>

      <Section title="Your Content">
        <p>Content you publish on Spur (blog posts, serials, etc.) is yours. We do not claim ownership of your content. Posts you mark as published may be surfaced in Spur's discovery feed. You can unpublish or delete content at any time from your dashboard.</p>
      </Section>

      <Section title="Data Sharing">
        <p>We do not sell your personal data. We share data only with service providers necessary to operate Spur (such as Supabase for database hosting and Stripe for payment processing), and only to the extent required to provide those services.</p>
      </Section>

      <Section title="Data Retention">
        <p>We retain your account data for as long as your account is active. If you delete your account, we will remove your personal data within 30 days, except where retention is required by law or necessary to resolve disputes.</p>
      </Section>

      <Section title="Your Rights">
        <p>You have the right to access, correct, or delete your personal data. You can manage most of this through your account settings. For other requests, contact us at privacy@spur.ink.</p>
      </Section>

      <Section title="Cookies">
        <p>Spur uses essential cookies to keep you logged in and maintain session state. We do not use tracking or advertising cookies. See our Cookie Policy for more detail.</p>
      </Section>

      <Section title="Changes to This Policy">
        <p>We may update this policy from time to time. We will notify you of significant changes by email or through the platform. Continued use of Spur after changes constitutes acceptance of the updated policy.</p>
      </Section>

      <Section title="Contact">
        <p>Questions about this policy? Email us at privacy@spur.ink.</p>
      </Section>
    </LegalLayout>
  )
}
