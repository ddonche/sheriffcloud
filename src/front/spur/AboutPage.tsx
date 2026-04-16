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
  accentDim: string
}

export default function AboutPage({ colors }: { colors: Colors }) {
  const C = colors
  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: FONT }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "72px 24px 96px" }}>

        {/* Hero */}
        <div style={{ marginBottom: 64 }}>
          <div style={{ fontSize: 11, fontWeight: 700, fontFamily: FONT_MONO, color: C.accent, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>
            About Spur
          </div>
          <h1 style={{ fontSize: "clamp(2.4rem, 6vw, 4rem)", lineHeight: 0.97, letterSpacing: "-0.05em", fontWeight: 900, marginBottom: 24 }}>
            Discovery-first blogging.<br />Your site stays yours.
          </h1>
          <p style={{ fontSize: 19, lineHeight: 1.75, color: C.muted, maxWidth: 680 }}>
            Spur is a blogging platform built on a simple idea: your writing should be discoverable without surrendering your site to a platform. You publish on your own domain, and when you choose, Spur surfaces individual posts to readers looking for exactly what you write about. Discovery is opt-in per post — you decide what goes in the feed.
          </p>
        </div>

        {/* The problem */}
        <div style={{ marginBottom: 52 }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 14 }}>The problem with blogging platforms</h2>
          <p style={{ fontSize: 16, lineHeight: 1.8, color: C.muted, marginBottom: 16 }}>
            Most blogging platforms give you discoverability in exchange for your content living on their domain, following their rules, and building their brand instead of yours. Your readers come to Medium or Substack — not to you.
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.8, color: C.muted }}>
            The alternative — hosting your own blog — means building traffic from zero. No discovery, no readers unless you already have an audience. You're on your own.
          </p>
        </div>

        {/* How Spur works */}
        <div style={{ background: C.surface, border: `1px solid ${C.borderLight}`, borderRadius: 18, padding: "32px 28px", marginBottom: 52 }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 20 }}>How Spur works</h2>
          <div style={{ display: "grid", gap: 20 }}>
            {[
              {
                title: "Your blog, your domain",
                body: "When you create a blog on Spur, it lives at your own subdomain — or your own custom domain if you're on Core. Your posts are yours. Your readers come to your site.",
              },
              {
                title: "Discovery on your terms",
                body: "Spur has a built-in discovery feed where readers can browse posts by category and find writers they'd never have found otherwise. Discovery is opt-in — you choose which posts appear in the feed. Posts you don't submit stay private to your blog.",
              },
              {
                title: "Content-aware previews",
                body: "Spur knows what's inside a post before someone clicks. If a post has code, audio, video, or images, that shows in the feed. Readers know what they're getting. Clicks are more intentional.",
              },
              {
                title: "Build your hub",
                body: "Your blog is the front door to everything you make. Spur is designed to grow with you — serials, docs, codex, community. The platform is the scaffold; your site is the destination.",
              },
            ].map((item) => (
              <div key={item.title} style={{ paddingBottom: 20, borderBottom: `1px solid ${C.borderLight}` }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 6, letterSpacing: "-0.02em" }}>{item.title}</div>
                <div style={{ fontSize: 15, lineHeight: 1.75, color: C.muted }}>{item.body}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Built on Sheriff Cloud */}
        <div style={{ marginBottom: 52 }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 14 }}>Built on Sheriff Cloud</h2>
          <p style={{ fontSize: 16, lineHeight: 1.8, color: C.muted, marginBottom: 16 }}>
            Spur is part of Sheriff Cloud — a multi-app platform built for independent creators and developers. Sheriff Cloud is the infrastructure; Spur is the first major app on top of it.
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.8, color: C.muted }}>
            The stack is lean by design. React, Supabase, and a custom site generator called Goblin. No unnecessary dependencies. No bloat. Fast to ship, easy to maintain.
          </p>
        </div>

        {/* Values */}
        <div style={{ marginBottom: 52 }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 20 }}>What we believe</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            {[
              { title: "Ownership matters", body: "Your content lives on your site, under your domain. You decide what goes in the discovery feed and what stays private to your blog." },
              { title: "Discovery should be your choice", body: "No promoted posts, no algorithmic pressure. You opt individual posts into discovery when you want reach. Nothing goes into the feed without your say." },
              { title: "Simple is a feature", body: "Two pricing tiers. A clean interface. One job: help you write and get read. We're not trying to be everything." },
              { title: "Writers are builders", body: "The best blogs become more than blogs. We want to give writers the tools to build something real around their work." },
            ].map((item) => (
              <div key={item.title} style={{ border: `1px solid ${C.borderLight}`, borderRadius: 14, padding: "20px 18px" }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 8, letterSpacing: "-0.02em" }}>{item.title}</div>
                <div style={{ fontSize: 14, lineHeight: 1.7, color: C.muted }}>{item.body}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center", padding: "32px 0 0" }}>
          <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.04em", marginBottom: 12 }}>Ready to start?</h2>
          <p style={{ fontSize: 16, color: C.muted, marginBottom: 24 }}>It's free. No credit card. Your blog is live in minutes.</p>
          <a
            href="/"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.accent, color: "#fff", borderRadius: 10, padding: "13px 22px", fontSize: 15, fontWeight: 800, textDecoration: "none", fontFamily: FONT }}
          >
            Start Writing Free →
          </a>
        </div>

      </div>
    </div>
  )
}
