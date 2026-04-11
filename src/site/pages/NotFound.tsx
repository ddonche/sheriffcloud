export default function NotFound() {
  return (
    <div className="state-error">
      <div style={{ fontSize: 48, opacity: 0.2 }}>404</div>
      <p>This page doesn't exist.</p>
      <a href="/" style={{ color: 'var(--color-accent)', fontSize: 13, marginTop: 4 }}>
        Go home
      </a>
    </div>
  )
}
