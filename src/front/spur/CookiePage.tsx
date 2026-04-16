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

export default function CookiePage({ colors }: { colors: Colors }) {
  return (
    <LegalLayout colors={colors} title="Cookie Policy" updated="April 15, 2026">
      <Section title="What Are Cookies">
        <p>Cookies are small text files stored on your device when you visit a website. They allow the site to remember information about your visit, such as your login status and preferences.</p>
      </Section>

      <Section title="How Spur Uses Cookies">
        <p style={{ marginBottom: 12 }}>Spur uses only essential cookies required to operate the platform. We do not use advertising cookies, tracking pixels, or third-party analytics cookies.</p>
        <p>The cookies we use include:</p>
        <ul style={{ paddingLeft: 20, marginTop: 12 }}>
          <li style={{ marginBottom: 12 }}>
            <strong style={{ color: "inherit", fontWeight: 700 }}>Authentication cookies</strong> — Used to keep you logged in during your session. Set when you sign in, cleared when you sign out or the session expires.
          </li>
          <li style={{ marginBottom: 12 }}>
            <strong style={{ color: "inherit", fontWeight: 700 }}>Preference cookies</strong> — Used to remember your theme preference (dark or light mode).
          </li>
          <li>
            <strong style={{ color: "inherit", fontWeight: 700 }}>Security cookies</strong> — Used to protect against cross-site request forgery and other security threats.
          </li>
        </ul>
      </Section>

      <Section title="Third-Party Cookies">
        <p>Spur uses Supabase for authentication and database services, and Stripe for payment processing. These services may set their own cookies as part of their operation. We do not control these cookies and recommend reviewing Supabase's and Stripe's respective privacy policies for details.</p>
      </Section>

      <Section title="Managing Cookies">
        <p>You can control and delete cookies through your browser settings. Disabling essential cookies will prevent you from logging in and using core platform features. Preference cookies can be cleared without affecting your ability to use Spur.</p>
      </Section>

      <Section title="No Advertising Cookies">
        <p>Spur does not use advertising networks, retargeting pixels, or any form of behavioral tracking cookies. We do not share cookie data with advertisers. This is a deliberate choice and will not change without explicit notice and your consent.</p>
      </Section>

      <Section title="Changes to This Policy">
        <p>If we change how we use cookies in a meaningful way, we will update this policy and notify you through the platform. Continued use of Spur after changes constitutes acceptance.</p>
      </Section>

      <Section title="Contact">
        <p>Questions? Email us at privacy@spur.ink.</p>
      </Section>
    </LegalLayout>
  )
}
