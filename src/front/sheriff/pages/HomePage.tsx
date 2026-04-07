import PageShell from "../layout/PageShell"

export default function HomePage() {
  return (
    <PageShell>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">Docs. Blogs. Wikis. Simple sites.</div>

            <h1>
              Make the site.
              <br />
              Publish the site.
              <br />
              Move on with your life.
            </h1>

            <p className="hero-lead">
              Sheriff Cloud gives you fast, hosted static sites with a clean browser
              editor, instant builds, and simple subdomains. No WordPress maze. No
              theme hell. No server babysitting.
            </p>

            <div className="hero-actions">
              <a className="button button-primary button-lg" href="/admin">
                Create Your Site
              </a>
              <a
                className="button button-ghost button-lg"
                href="https://docs.sheriffcloud.com"
              >
                Read the Docs
              </a>
            </div>

            <div className="hero-inline-demo">
              <span className="inline-label">Try a site name</span>
              <div className="inline-demo-box">
                <span className="inline-demo-name">my-site</span>
                <span className="inline-demo-arrow">→</span>
                <span className="inline-demo-url">
                  my-site.sheriffcloud.com
                </span>
              </div>
            </div>

            <div className="hero-points">
              <span>Instant subdomains</span>
              <span>Markdown-friendly editing</span>
              <span>One-click builds</span>
            </div>
          </div>

          <div className="hero-panel">
            <div className="app-preview">
              <div className="app-preview-topbar">
                <div className="app-preview-site">
                  <div className="preview-dot" />
                  <span>my-site</span>
                </div>
                <div className="app-preview-actions">
                  <button type="button">Open Site</button>
                  <button type="button" className="preview-primary">
                    Build Site
                  </button>
                </div>
              </div>

              <div className="app-preview-body">
                <aside className="preview-sidebar">
                  <div className="preview-sidebar-label">Files</div>
                  <div className="preview-file active">index.md</div>
                  <div className="preview-file">about.md</div>
                  <div className="preview-file">pricing.md</div>
                  <div className="preview-file">faq.md</div>

                  <div className="preview-sidebar-label preview-spaced">
                    Build Log
                  </div>
                  <div className="preview-log">
                    <div>BUILD SUCCESS — my-site</div>
                    <div>Exit Code: 0</div>
                    <div>Generated: 18 pages</div>
                    <div>Published successfully</div>
                  </div>
                </aside>

                <div className="preview-editor">
                  <div className="preview-editor-bar">
                    <span>content/index.md</span>
                    <span>Ready</span>
                  </div>

                  <div className="preview-frontmatter">
                    <div>
                      <strong>title:</strong> Welcome to My Site
                    </div>
                    <div>
                      <strong>layout:</strong> docs
                    </div>
                    <div>
                      <strong>meta_kind:</strong> docs
                    </div>
                  </div>

                  <div className="preview-content">
                    <div className="preview-line preview-line-lg" />
                    <div className="preview-line" />
                    <div className="preview-line preview-line-md" />
                    <div className="preview-line" />
                    <div className="preview-line preview-line-sm" />
                    <div className="preview-line preview-line-lg" />
                    <div className="preview-line preview-line-md" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading">
            <div className="eyebrow">What Sheriff Cloud actually does</div>
            <h2>Hosted static sites with a sane workflow</h2>
            <p>
              Sheriff Cloud is for people who want to publish content fast without
              dragging a CMS, plugin stack, or server mess behind them.
            </p>
          </div>

          <div className="feature-grid">
            <article className="card">
              <h3>Fast setup</h3>
              <p>Create a site, get a subdomain, and start editing immediately.</p>
            </article>

            <article className="card">
              <h3>Browser editing</h3>
              <p>
                Manage your files in a clean editor with a real file tree and build
                output.
              </p>
            </article>

            <article className="card">
              <h3>Built for content</h3>
              <p>
                Docs, blogs, wikis, landing pages, and simple business sites without
                CMS bloat.
              </p>
            </article>

            <article className="card">
              <h3>One-click builds</h3>
              <p>Edit → Build → Publish. Done.</p>
            </article>

            <article className="card">
              <h3>Clean hosting</h3>
              <p>No DevOps cosplay required just to publish a page.</p>
            </article>

            <article className="card">
              <h3>Room to grow</h3>
              <p>Add domains and features later without rebuilding everything.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section cta-section">
        <div className="container">
          <div className="cta-card">
            <div>
              <div className="eyebrow">Ready to go?</div>
              <h2>Create your site and start publishing.</h2>
              <p>
                Sheriff Cloud is for getting the damn thing online without fighting
                the platform first.
              </p>
            </div>

            <div className="cta-actions">
              <a className="button button-primary button-lg" href="/admin">
                Create Site
              </a>
              <a
                className="button button-ghost button-lg"
                href="https://docs.sheriffcloud.com"
              >
                Read Docs
              </a>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  )
}