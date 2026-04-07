export default function SiteFooter() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div>
          <div className="footer-brand">Sheriff Cloud</div>
          <div className="footer-copy">
            Static sites without the usual bullshit.
          </div>
        </div>

        <div className="footer-links">
          <a href="/features">Features</a>
          <a href="/how-it-works">How It Works</a>
          <a href="/use-cases">Use Cases</a>
          <a href="/pricing">Pricing</a>
          <a href="https://docs.sheriffcloud.com">Docs</a>
        </div>
      </div>
    </footer>
  )
}