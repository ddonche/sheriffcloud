import PageShell from "../components/PageShell"
import { Link } from "react-router-dom"

export default function HowItWorksPage() {
  return (
    <PageShell>
      <section className="subpage-hero">
        <div className="container">
          <div className="eyebrow">How It Works</div>
          <h1>A publishing workflow that stays simple on purpose.</h1>
          <p className="subpage-lead">
            Sheriff Cloud is built around a straightforward loop: create the site,
            edit the content, build it, and publish it. No detours into platform
            maintenance unless you actually want them.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading">
            <div className="eyebrow">The basic flow</div>
            <h2>Four steps. No circus.</h2>
            <p>
              The point of Sheriff Cloud is not to impress you with a bloated
              dashboard. The point is to get your site online with as little friction
              as possible.
            </p>
          </div>

          <div className="steps steps-4">
            <article className="step">
              <div className="step-number">01</div>
              <h3>Create your site</h3>
              <p>
                Pick a site name and spin up a hosted Sheriff Cloud subdomain so you
                can start working immediately.
              </p>
            </article>

            <article className="step">
              <div className="step-number">02</div>
              <h3>Organize your files</h3>
              <p>
                Create pages, manage folders, and keep the structure clean without
                burying simple content under layers of CMS nonsense.
              </p>
            </article>

            <article className="step">
              <div className="step-number">03</div>
              <h3>Edit your content</h3>
              <p>
                Write and revise in the browser, update pages directly, and keep your
                site moving without fighting the tool every five minutes.
              </p>
            </article>

            <article className="step">
              <div className="step-number">04</div>
              <h3>Build and publish</h3>
              <p>
                Run the build, check the output, and publish your changes with a
                workflow that actually shows you what happened.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="section-heading">
            <div className="eyebrow">Why it feels different</div>
            <h2>Less time configuring. More time publishing.</h2>
            <p>
              Sheriff Cloud is opinionated in a useful way. It cuts down the amount
              of platform overhead between “I need a site” and “the site is live.”
            </p>
          </div>

          <div className="feature-grid">
            <article className="card">
              <h3>Fast start</h3>
              <p>
                You do not have to navigate a maze of themes, plugins, and setup
                steps just to get a basic site online.
              </p>
            </article>

            <article className="card">
              <h3>Clear workflow</h3>
              <p>
                The path from editing to publishing is visible and direct, which
                makes it easier to understand what the site is doing.
              </p>
            </article>

            <article className="card">
              <h3>Predictable output</h3>
              <p>
                Build logs and structured content make the system easier to trust,
                easier to debug, and easier to manage over time.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cta-card">
            <div>
              <div className="eyebrow">Get started</div>
              <h2>Make the site first. Polish it later.</h2>
              <p>
                Sheriff Cloud keeps the first step easy so you can get something real
                online before drowning in optional complexity.
              </p>
            </div>

            <div className="cta-actions">
              <a className="button button-primary button-lg" href="/admin">
                Create Site
              </a>
              <Link className="button button-ghost button-lg" to="/features">
                See Features
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  )
}