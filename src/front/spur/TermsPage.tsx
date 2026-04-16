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

export default function TermsPage({ colors }: { colors: Colors }) {
  return (
    <LegalLayout colors={colors} title="Terms of Service" updated="April 15, 2026">
      <Section title="Acceptance of Terms">
        <p>By creating an account or using Spur, you agree to these Terms of Service. If you do not agree, do not use the platform. These terms apply to all users of Spur, including visitors, free accounts, and paid subscribers.</p>
      </Section>

      <Section title="Your Account">
        <p style={{ marginBottom: 12 }}>You are responsible for maintaining the security of your account and password. You must provide accurate information when creating your account. You may not use Spur to impersonate others or create accounts on behalf of others without their consent.</p>
        <p>You must be at least 13 years old to use Spur. If you are under 18, you represent that you have your parent or guardian's permission.</p>
      </Section>

      <Section title="Your Content">
        <p style={{ marginBottom: 12 }}>You retain ownership of content you publish on Spur. By publishing, you grant Spur a non-exclusive, worldwide license to display your content in the discovery feed and on your blog pages. This license ends when you delete the content or your account.</p>
        <p>You are solely responsible for your content. You must not publish content that is illegal, defamatory, harassing, or that infringes on third-party intellectual property rights.</p>
      </Section>

      <Section title="Prohibited Uses">
        <p style={{ marginBottom: 12 }}>You may not use Spur to:</p>
        <ul style={{ paddingLeft: 20 }}>
          <li style={{ marginBottom: 8 }}>Publish spam, misinformation, or malicious content</li>
          <li style={{ marginBottom: 8 }}>Harass, threaten, or harm other users</li>
          <li style={{ marginBottom: 8 }}>Attempt to gain unauthorized access to any part of the platform</li>
          <li style={{ marginBottom: 8 }}>Scrape or collect user data without permission</li>
          <li>Violate any applicable laws or regulations</li>
        </ul>
      </Section>

      <Section title="Subscriptions and Billing">
        <p style={{ marginBottom: 12 }}>Paid subscriptions are billed monthly or annually depending on your selected plan. Payments are processed through Stripe. You can cancel at any time from your account settings; your access continues until the end of the billing period.</p>
        <p>We reserve the right to change pricing with 30 days notice. Continued use after a price change constitutes acceptance of the new price.</p>
      </Section>

      <Section title="Service Availability">
        <p>We aim to keep Spur available at all times but do not guarantee uninterrupted service. We may suspend or discontinue the service at any time, with reasonable notice where possible. We are not liable for any losses resulting from downtime or service interruption.</p>
      </Section>

      <Section title="Termination">
        <p>We reserve the right to suspend or terminate accounts that violate these terms, with or without notice depending on severity. You may delete your account at any time from your account settings.</p>
      </Section>

      <Section title="Limitation of Liability">
        <p>Spur is provided "as is" without warranties of any kind. To the fullest extent permitted by law, we are not liable for any indirect, incidental, or consequential damages arising from your use of the platform.</p>
      </Section>

      <Section title="Governing Law">
        <p>These terms are governed by the laws of the United States. Any disputes shall be resolved in the courts of competent jurisdiction in the United States.</p>
      </Section>

      <Section title="Changes to These Terms">
        <p>We may update these terms from time to time. We will notify you of material changes by email or through the platform. Continued use after changes constitutes acceptance.</p>
      </Section>

      <Section title="Contact">
        <p>Questions about these terms? Email us at legal@spur.ink.</p>
      </Section>
    </LegalLayout>
  )
}
