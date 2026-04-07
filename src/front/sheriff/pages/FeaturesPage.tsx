import PageShell from "../layout/PageShell"
import { Link } from "react-router-dom"

export default function FeaturesPage() {
  return (
    <PageShell>
      <section className="subpage-hero">
        <div className="container">
          <div className="eyebrow">Features</div>
          <h1>Everything you need to publish a clean site without platform bloat.</h1>
          <p className="subpage-lead">
            Sheriff Cloud is built for people who want to make the site, manage the
            content, and publish it fast. No plugin circus. No CMS sludge. No server
            babysitting.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading">
            <div className="eyebrow">Core platform</div>
            <h2>The essentials are built in.</h2>
            <p>
              Sheriff Cloud focuses on the parts that matter: site creation, content
              editing, builds, publishing, and a workflow that doesn’t make you fight
              the tool.
            </p>
          </div>

          <div className="feature-grid">
            <article className="card">
              <h3>Instant hosted sites</h3>
              <p>
                Create a site and get a live Sheriff Cloud subdomain immediately, so
                you can start building instead of messing with setup for half the day.
              </p>
            </article>

            <article className="card">
              <h3>Browser-based file editing</h3>
              <p>
                Manage content directly in the browser with a real file tree, page
                editing, and build output that shows you what actually happened.
              </p>
            </article>

            <article className="card">
              <h3>One-click builds</h3>
              <p>
                Edit your files, run the build, and publish changes without dragging
                in a bunch of deployment complexity you didn’t ask for.
              </p>
            </article>

            <article className="card">
              <h3>Content-first structure</h3>
              <p>
                Great for docs, blogs, wikis, landing pages, and simple sites where
                the content matters more than a giant backend.
              </p>
            </article>

            <article className="card">
              <h3>Simple site management</h3>
              <p>
                Create pages, organize folders, edit content, and manage your site in
                one place without turning basic publishing into a side quest.
              </p>
            </article>

            <article className="card">
              <h3>Room to grow</h3>
              <p>
                Start with the basics now, then grow into premium features, custom
                domains, and a broader product ecosystem later.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="section-heading">
            <div className="eyebrow">Built for this kind of work</div>
            <h2>Docs, blogs, wikis, portals, and simple business sites.</h2>
            <p>
              Sheriff Cloud is strongest when the goal is structured publishing with a
              clean workflow and fast turnaround.
            </p>
          </div>

          <div className="feature-grid">
            <article className="card">
              <h3>Documentation sites</h3>
              <p>
                Product documentation, guides, knowledge bases, changelogs, and help
                centers that need to stay organized and easy to update.
              </p>
            </article>

            <article className="card">
              <h3>Blogs and writing</h3>
              <p>
                Posts, essays, announcements, and editorial content without the
                overhead of a bloated publishing stack.
              </p>
            </article>

            <article className="card">
              <h3>Wikis and portals</h3>
              <p>
                Resource hubs, internal knowledge sites, and project portals that
                benefit from simple structure and predictable builds.
              </p>
            </article>

            <article className="card">
              <h3>Landing pages</h3>
              <p>
                Product pages, service pages, and clean public-facing sites that
                should be easy to maintain and fast to publish.
              </p>
            </article>

            <article className="card">
              <h3>Small business sites</h3>
              <p>
                A straightforward way to get a business online without inheriting a
                pile of weird theme behavior and plugin debt.
              </p>
            </article>

            <article className="card">
              <h3>Growing ecosystems</h3>
              <p>
                Good for product families that need a main site, docs hubs, support
                pages, and future satellite sites that still feel connected.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cta-card">
            <div>
              <div className="eyebrow">Ready to build?</div>
              <h2>Start with a site. Add complexity only when you actually need it.</h2>
              <p>
                Sheriff Cloud keeps the entry point simple so you can publish first
                and elaborate later.
              </p>
            </div>

            <div className="cta-actions">
              <a className="button button-primary button-lg" href="/admin">
                Create Site
              </a>
              <Link className="button button-ghost button-lg" to="/pricing">
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  )
}