import PageShell from "../components/PageShell"
import { Link } from "react-router-dom"

export default function PricingPage() {
  return (
    <PageShell>
      <section className="subpage-hero">
        <div className="container">
          <div className="eyebrow">Pricing</div>
          <h1>Simple hosting. No bullshit metering.</h1>
          <p className="subpage-lead">
            Sheriff Cloud pricing is built around straightforward hosting, not
            nickel-and-dime nonsense. No fake seat limits. No build-minute games.
            No hostage situation with your content.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading">
            <div className="eyebrow">Hosting plans</div>
            <h2>Pick the storage level you need and go.</h2>
            <p>
              Every plan is meant to be usable out of the box. You can add as many
              users as you want, publish without worrying about arbitrary build
              quotas, and leave whenever you want with your content in hand.
            </p>
          </div>

          <div className="pricing-grid">
            <article className="pricing-card">
              <div className="pricing-tier">Basic Hosting</div>
              <div className="pricing-price">$4.99/mo</div>
              <p className="pricing-copy">
                For simple sites, docs, blogs, and smaller projects that just need
                clean hosting and a sane workflow.
              </p>

              <ul className="pricing-list">
                <li>5 GB storage</li>
                <li>Free Sheriff Cloud subdomain</li>
                <li>Hosted publishing</li>
                <li>Unlimited users</li>
                <li>No build-minute bullshit</li>
                <li>Cancel anytime</li>
              </ul>

              <a className="button button-ghost" href="/admin">
                Start with Basic
              </a>
            </article>

            <article className="pricing-card pricing-card-featured">
              <div className="pricing-tier">Pro Hosting</div>
              <div className="pricing-price">$9.99/mo</div>
              <p className="pricing-copy">
                For serious sites that need more room, a custom domain, and a more
                polished public presence.
              </p>

              <ul className="pricing-list">
                <li>25 GB storage</li>
                <li>Custom domain support</li>
                <li>Hosted publishing</li>
                <li>Unlimited users</li>
                <li>No build-minute bullshit</li>
                <li>Cancel anytime</li>
              </ul>

              <a className="button button-primary" href="/admin">
                Start with Pro
              </a>
            </article>

            <article className="pricing-card">
              <div className="pricing-tier">Premium Hosting</div>
              <div className="pricing-price">$19.99/mo</div>
              <p className="pricing-copy">
                For larger sites and growing ecosystems that need more headroom and
                premium treatment without weird restrictions.
              </p>

              <ul className="pricing-list">
                <li>Higher storage limits</li>
                <li>Custom domain support</li>
                <li>Hosted publishing</li>
                <li>Unlimited users</li>
                <li>No build-minute bullshit</li>
                <li>Priority / premium features as they roll out</li>
              </ul>

              <a className="button button-ghost" href="/admin">
                Start with Premium
              </a>
            </article>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="section-heading">
            <div className="eyebrow">What we will not do</div>
            <h2>No seats. No traps. No hostage pricing.</h2>
            <p>
              Sheriff Cloud is not built around squeezing users with artificial limits
              and pricing gimmicks. The point is to host your site, not annoy you
              into paying extra for normal behavior.
            </p>
          </div>

          <div className="feature-grid">
            <article className="card">
              <h3>Unlimited users</h3>
              <p>
                Add the people you need. We are not doing the whole “pay more for
                three extra seats” routine.
              </p>
            </article>

            <article className="card">
              <h3>No build-minute games</h3>
              <p>
                You should be able to publish your site without watching a stupid
                meter tick upward every time you make a change.
              </p>
            </article>

            <article className="card">
              <h3>Your content is yours</h3>
              <p>
                Always. Take your content files. Take your built output too if you
                want. Cancel whenever and leave with your stuff.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cta-card">
            <div>
              <div className="eyebrow">Own your work</div>
              <h2>Host here because you want to. Not because you’re trapped.</h2>
              <p>
                Sheriff Cloud should earn the right to keep your site hosted. That
                means clean pricing, easy publishing, and no bullshit when you want
                to leave.
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