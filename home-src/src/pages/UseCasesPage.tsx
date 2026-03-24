import PageShell from "../components/PageShell"
import { Link } from "react-router-dom"

export default function UseCasesPage() {
  return (
    <PageShell>
      <section className="subpage-hero">
        <div className="container">
          <div className="eyebrow">Use Cases</div>
          <h1>For people who need a site, not a platform to babysit.</h1>
          <p className="subpage-lead">
            Sheriff Cloud works best when the goal is structured publishing with a
            clean workflow and fast turnaround.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading">
            <div className="eyebrow">Where it fits best</div>
            <h2>Content-first sites that should be easy to maintain.</h2>
            <p>
              If your goal is to publish content, organize information, and keep
              things clean over time, Sheriff Cloud is built for that.
            </p>
          </div>

          <div className="use-case-grid">
            <article className="card">
              <h3>Documentation</h3>
              <p>
                Product docs, technical guides, knowledge bases, and changelogs that
                need to stay organized and easy to update.
              </p>
            </article>

            <article className="card">
              <h3>Blogs & writing</h3>
              <p>
                Posts, essays, announcements, and editorial content without dragging
                a full CMS behind every update.
              </p>
            </article>

            <article className="card">
              <h3>Wikis & resource hubs</h3>
              <p>
                Internal or public wikis with structured pages, clean linking, and a
                predictable content model.
              </p>
            </article>

            <article className="card">
              <h3>Landing pages</h3>
              <p>
                Product pages, service pages, and simple marketing sites that should
                be fast to publish and easy to change.
              </p>
            </article>

            <article className="card">
              <h3>Small business sites</h3>
              <p>
                Straightforward business websites without the theme/plugin chaos that
                usually comes with traditional builders.
              </p>
            </article>

            <article className="card">
              <h3>Project portals</h3>
              <p>
                Internal tools, documentation hubs, and multi-site setups that need a
                consistent structure across multiple sites.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="section-heading">
            <div className="eyebrow">When it makes sense</div>
            <h2>Use Sheriff Cloud when the content matters more than the system.</h2>
            <p>
              If your biggest problem is getting content online cleanly and keeping it
              organized, this is the right tool. If you need a full application
              backend, this probably isn’t it.
            </p>
          </div>

          <div className="feature-grid">
            <article className="card">
              <h3>You want speed</h3>
              <p>
                You want to go from idea to live site quickly without configuring a
                dozen things first.
              </p>
            </article>

            <article className="card">
              <h3>You want clarity</h3>
              <p>
                You want to understand how your site works without digging through
                layers of abstraction.
              </p>
            </article>

            <article className="card">
              <h3>You want control without chaos</h3>
              <p>
                You want flexibility, but not at the cost of turning your site into a
                fragile pile of plugins and hacks.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cta-card">
            <div>
              <div className="eyebrow">Try it</div>
              <h2>Build something real instead of configuring forever.</h2>
              <p>
                Sheriff Cloud keeps the workflow tight so you can focus on the site,
                not the platform.
              </p>
            </div>

            <div className="cta-actions">
              <a className="button button-primary button-lg" href="/admin">
                Create Site
              </a>
              <Link className="button button-ghost button-lg" to="/how-it-works">
                See How It Works
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  )
}