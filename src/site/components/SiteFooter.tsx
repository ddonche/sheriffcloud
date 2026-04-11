import { Icon } from '../Icons'

interface Props {
  tier?: string
}

export default function SiteFooter({ tier = 'free' }: Props) {
  return (
    <footer className="site-footer">
      <a
        href={`${window.location.origin}/rss`}
        className="site-footer__rss"
        title="RSS Feed"
      >
        <Icon name="rss" size={16} color="var(--color-muted)" />
        <span className="site-footer__rss-label">RSS</span>
      </a>

      {tier === 'free' && (
        <a
          href="https://spur.sheriffcloud.com"
          target="_blank"
          rel="noopener noreferrer"
          className="site-footer__badge"
        >
          <span className="site-footer__powered">Powered by</span>
          <img src="/logo.png" alt="Spur" className="site-footer__logo" />
        </a>
      )}
    </footer>
  )
}
