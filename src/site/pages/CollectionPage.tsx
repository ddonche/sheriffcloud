import { useState } from 'react'
import type { CollectionPageResponse, CollectionSerial } from '../lib/types'

interface Props {
  data: CollectionPageResponse
  darkMode: boolean
  onNavigate: (path: string) => void
}

const STATUS_COLORS: Record<string, { color: string; bg: string; dot: string }> = {
  ongoing:   { color: '#4ade80', bg: 'rgba(74,222,128,0.10)', dot: '#4ade80' },
  completed: { color: '#f29106', bg: 'rgba(242,145,6,0.10)',  dot: '#f29106' },
  hiatus:    { color: '#facc15', bg: 'rgba(250,204,21,0.10)', dot: '#facc15' },
  cancelled: { color: '#ef4444', bg: 'rgba(239,68,68,0.10)',  dot: '#ef4444' },
}

function BookCard({ serial, index, onNavigate, darkMode }: {
  serial: CollectionSerial
  index: number
  onNavigate: (path: string) => void
  darkMode: boolean
}) {
  const [hovered, setHovered] = useState(false)
  const statusStyle = STATUS_COLORS[serial.status] ?? STATUS_COLORS.ongoing
  const bookNum = serial.collection_sort_order ?? index + 1

  return (
    <button
      type="button"
      onClick={() => onNavigate(`/blog/serial/${serial.slug}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: 'flex', flexDirection: 'column', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
    >
      <div style={{
        width: '100%', aspectRatio: '2/3', borderRadius: 10, overflow: 'hidden',
        border: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
        marginBottom: 12, position: 'relative', background: 'var(--color-surface)',
      }}>
        {serial.cover_image_url ? (
          <img src={serial.cover_image_url} alt={serial.title} style={{
            width: '100%', height: '100%', objectFit: 'cover', display: 'block',
            transform: hovered ? 'scale(1.04)' : 'scale(1)', transition: 'transform 0.2s ease',
          }} />
        ) : (
          <div style={{
            width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, fontWeight: 900, color: 'var(--color-dim)', fontFamily: 'var(--font-mono)',
          }}>{bookNum}</div>
        )}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%)',
          opacity: hovered ? 1 : 0, transition: 'opacity 0.2s',
          display: 'flex', alignItems: 'flex-end', padding: '14px 16px',
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: '0.02em' }}>Read →</span>
        </div>
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-dim)', marginBottom: 5 }}>
        Book {bookNum}
      </div>
      <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-text)', lineHeight: 1.2, marginBottom: 6 }}>
        {serial.title}
      </div>
      {serial.tagline && (
        <div style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--color-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 10, flex: 1 }}>
          {serial.tagline}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'auto' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)', color: statusStyle.color, background: statusStyle.bg, padding: '2px 8px', borderRadius: 4 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusStyle.dot, flexShrink: 0 }} />
          {serial.status.charAt(0).toUpperCase() + serial.status.slice(1)}
        </span>
        <span style={{ fontSize: 11, color: 'var(--color-dim)', fontFamily: 'var(--font-mono)' }}>
          {serial.chapter_count} {serial.unit_label}{serial.chapter_count !== 1 ? 's' : ''}
        </span>
      </div>
      {serial.author_display_name && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
          {serial.author_avatar_url ? (
            <img src={serial.author_avatar_url} alt={serial.author_display_name} style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          ) : (
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--color-surface)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'var(--color-muted)', flexShrink: 0 }}>
              {serial.author_display_name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
            </div>
          )}
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-muted)', fontFamily: 'var(--font-sans)' }}>{serial.author_display_name}</span>
        </div>
      )}
    </button>
  )
}

export default function CollectionPage({ data, darkMode, onNavigate }: Props) {
  const { collection, serials } = data

  return (
    <div className="page-container">
      <div className="collection-page fade-up" style={{ maxWidth: 900, margin: '0 auto' }}>
        <style>{`
          .collection-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px 24px; }
          @media (max-width: 640px) { .collection-grid { grid-template-columns: repeat(2, 1fr); gap: 28px 16px; } }
        `}</style>

        <header style={{ paddingBottom: 32, borderBottom: '1px solid var(--color-border-light)', marginBottom: 40 }}>
          <div style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-accent)', marginBottom: 10 }}>
            Series
          </div>
          <h1 style={{ fontSize: 'clamp(36px, 6vw, 56px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.0, color: 'var(--color-text)', margin: '0 0 12px' }}>
            {collection.title}
          </h1>
          {collection.description && (
            <p style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--color-muted)', maxWidth: 580, margin: '0 0 14px' }}>
              {collection.description}
            </p>
          )}
          <div style={{ fontSize: 13, color: 'var(--color-dim)', fontFamily: 'var(--font-mono)' }}>
            {serials.length} book{serials.length !== 1 ? 's' : ''}
          </div>
        </header>

        {serials.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--color-muted)', fontSize: 15 }}>
            No books in this series yet.
          </div>
        ) : (
          <div className="collection-grid">
            {serials.map((serial, i) => (
              <BookCard key={serial.id} serial={serial} index={i} onNavigate={onNavigate} darkMode={darkMode} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
