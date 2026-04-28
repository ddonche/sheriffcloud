import { useEffect, useState } from 'react'
import type { SerialPageResponse, SerialChapter } from '../lib/types'
import { formatDate } from '../lib/api'
import { getSupabase } from '../../shared/supabase'

interface Props {
  data: SerialPageResponse
  darkMode: boolean
  onNavigate: (path: string) => void
}

const STATUS_COLORS: Record<string, { color: string; bg: string; dot: string }> = {
  ongoing:   { color: '#4ade80', bg: 'rgba(74,222,128,0.10)', dot: '#4ade80' },
  complete:  { color: '#f29106', bg: 'rgba(242,145,6,0.10)',  dot: '#f29106' },
  hiatus:    { color: '#facc15', bg: 'rgba(250,204,21,0.10)', dot: '#facc15' },
  cancelled: { color: '#ef4444', bg: 'rgba(239,68,68,0.10)',  dot: '#ef4444' },
}

function statusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function readingTime(html: string): number {
  const text = html.replace(/<[^>]+>/g, '')
  const words = text.trim().split(/\s+/).length
  return Math.max(1, Math.round(words / 200))
}

function AuthorFollowRow({ author, profileId }: { author: { display_name: string | null; username: string | null; avatar_url: string | null } | null; profileId: string }) {
  const sb = getSupabase()
  const [following, setFollowing] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const displayName = author?.display_name || author?.username || 'Unknown'
  const initials = displayName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()

  useEffect(() => {
    sb.auth.getSession().then(({ data }: any) => {
      setCurrentUserId(data.session?.user?.id ?? null)
    })
    const { data: { subscription } } = sb.auth.onAuthStateChange((_e: any, s: any) => {
      setCurrentUserId(s?.user?.id ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { count } = await sb.from('spur_follows').select('id', { count: 'exact', head: true }).eq('following_id', profileId)
      if (!cancelled) setFollowerCount(count ?? 0)
      if (currentUserId) {
        const { data } = await sb.from('spur_follows').select('id').eq('follower_id', currentUserId).eq('following_id', profileId).maybeSingle()
        if (!cancelled) setFollowing(!!data)
      }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [profileId, currentUserId])

  async function toggle() {
    if (!currentUserId || busy) return
    setBusy(true)
    if (following) {
      await sb.from('spur_follows').delete().eq('follower_id', currentUserId).eq('following_id', profileId)
      setFollowing(false)
      setFollowerCount(c => Math.max(0, c - 1))
    } else {
      await sb.from('spur_follows').insert({ follower_id: currentUserId, following_id: profileId })
      setFollowing(true)
      setFollowerCount(c => c + 1)
    }
    setBusy(false)
  }

  if (loading) return null

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
      {author?.avatar_url ? (
        <img src={author.avatar_url} alt={displayName} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
      ) : (
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-surface)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', flexShrink: 0 }}>
          {initials}
        </div>
      )}
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', fontFamily: 'var(--font-sans)' }}>{displayName}</span>
      <span style={{ fontSize: 12, color: 'var(--color-dim)' }}>·</span>
      <span style={{ fontSize: 12, color: 'var(--color-muted)', fontFamily: 'var(--font-sans)' }}>
        {followerCount.toLocaleString()} {followerCount === 1 ? 'follower' : 'followers'}
      </span>
      <button
        type="button"
        onClick={toggle}
        disabled={busy || !currentUserId}
        style={{
          padding: '5px 14px',
          borderRadius: 8,
          border: following ? '1px solid var(--color-border)' : 'none',
          background: following ? 'transparent' : 'var(--color-accent)',
          color: following ? 'var(--color-muted)' : '#fff',
          fontSize: 12,
          fontWeight: 700,
          fontFamily: 'var(--font-sans)',
          cursor: busy || !currentUserId ? 'default' : 'pointer',
          opacity: busy ? 0.6 : 1,
          transition: 'all 0.12s',
        }}
      >
        {following ? 'Following' : 'Follow'}
      </button>
    </div>
  )
}

function SeriesCarousel({ serials, onNavigate, darkMode }: {
  serials: any[]
  onNavigate: (path: string) => void
  darkMode: boolean
}) {
  const [offset, setOffset] = useState(0)
  const VISIBLE = 5

  const canPrev = offset > 0
  const canNext = offset + VISIBLE < serials.length

  return (
    <div>
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
        color: 'var(--color-dim)', fontFamily: 'var(--font-mono)', marginBottom: 10,
      }}>
        Other books in this series
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          type="button"
          onClick={() => setOffset(o => Math.max(0, o - VISIBLE))}
          disabled={!canPrev}
          style={{
            width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
            border: `1px solid var(--color-border-light)`,
            background: 'transparent', cursor: canPrev ? 'pointer' : 'default',
            color: canPrev ? 'var(--color-muted)' : 'var(--color-dim)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, lineHeight: 1, opacity: canPrev ? 1 : 0.3,
            transition: 'opacity 0.12s',
          }}
        >‹</button>

        <div style={{ display: 'flex', gap: 8, overflow: 'hidden' }}>
          {serials.slice(offset, offset + VISIBLE).map((s: any) => {
            const bookNum = s.collection_sort_order ?? (serials.indexOf(s) + 1)
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onNavigate(`/blog/serial/${s.slug}`)}
                title={s.title}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                  background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
                  flexShrink: 0,
                }}
              >
                <div style={{
                  width: 44, aspectRatio: '2/3', borderRadius: 5, overflow: 'hidden',
                  border: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                  background: 'var(--color-surface)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {s.cover_image_url
                    ? <img src={s.cover_image_url} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    : <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-dim)', fontFamily: 'var(--font-mono)' }}>{bookNum}</span>
                  }
                </div>
                <span style={{ fontSize: 10, color: 'var(--color-dim)', fontFamily: 'var(--font-mono)' }}>
                  {bookNum}
                </span>
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => setOffset(o => Math.min(serials.length - VISIBLE, o + VISIBLE))}
          disabled={!canNext}
          style={{
            width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
            border: `1px solid var(--color-border-light)`,
            background: 'transparent', cursor: canNext ? 'pointer' : 'default',
            color: canNext ? 'var(--color-muted)' : 'var(--color-dim)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, lineHeight: 1, opacity: canNext ? 1 : 0.3,
            transition: 'opacity 0.12s',
          }}
        >›</button>
      </div>
    </div>
  )
}

export default function SerialPage({ data, darkMode, onNavigate }: Props) {
  const { serial, chapters, site } = data
  const collection = (data as any).collection ?? null
  const collectionSerials: any[] = (data as any).collectionSerials ?? []
  const currentIndex = collectionSerials.findIndex((s: any) => s.id === serial.id)

  const [progress, setProgress] = useState<number | null>(null)
  const [open, setOpen] = useState(false)

  const statusStyle = STATUS_COLORS[serial.status] ?? STATUS_COLORS.ongoing
  const totalChapters = chapters.length
  const lastUpdated = chapters.length > 0
    ? formatDate(chapters[chapters.length - 1].published_at ?? serial.updated_at)
    : formatDate(serial.updated_at)

  useEffect(() => {
    const stored = localStorage.getItem(`serial-progress-${serial.id}`)
    if (stored !== null) setProgress(parseInt(stored, 10))
  }, [serial.id])

  useEffect(() => {
    const prevTitle = document.title
    document.title = `${serial.title} — ${site.name}`
    return () => { document.title = prevTitle }
  }, [serial.title, site.name])

  const progressChapter = progress !== null
    ? chapters.find(c => c.serial_index === progress) ?? null
    : null

  const progressIndex = progressChapter
    ? chapters.findIndex(c => c.serial_index === progressChapter.serial_index)
    : -1

  const progressPct = totalChapters > 0 && progress !== null
    ? Math.round(((progressIndex + 1) / totalChapters) * 100)
    : 0

  const isComplete = progress !== null && progressIndex === totalChapters - 1

  function getCtaChapter(): SerialChapter | null {
    if (chapters.length === 0) return null
    if (progress === null) return chapters[0]
    const next = chapters[progressIndex + 1]
    return next ?? chapters[progressIndex] ?? chapters[0]
  }

  const ctaChapter = getCtaChapter()
  const ctaLabel = progress === null
    ? 'Start Reading'
    : isComplete
    ? 'Read Again'
    : 'Continue Reading'

  return (
    <div className="page-container">
      <div className="serial-page fade-up">

        {/* ── Collection banner ── */}
        {collection && (
          <button
            type="button"
            onClick={() => onNavigate(`/blog/collection/${collection.slug}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid var(--color-border-light)',
              padding: '10px 0 12px',
              marginBottom: 24,
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}>
              Part of
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
              {collection.title}
            </span>
            {collectionSerials.length > 1 && (
              <>
                <span style={{ color: 'var(--color-dim)', fontSize: 12 }}>·</span>
                <span style={{ fontSize: 12, color: 'var(--color-dim)' }}>
                  {collectionSerials.length} books
                </span>
              </>
            )}
            {currentIndex >= 0 && (
              <>
                <span style={{ color: 'var(--color-dim)', fontSize: 12 }}>·</span>
                <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                  Book {currentIndex + 1}
                </span>
              </>
            )}
            <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--color-dim)' }}>View series →</span>
          </button>
        )}

        {/* ── Hero: two-column ── */}
        <div className="serial-hero">
          {serial.cover_image_url && (
            <div
              className="serial-hero__cover"
              style={{ border: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` }}
            >
              <img src={serial.cover_image_url} alt={serial.title} />
            </div>
          )}

          <div className="serial-hero__info">
            <div className="serial-hero__status-row">
              <span
                className="serial-hero__status"
                style={{ color: statusStyle.color, background: statusStyle.bg }}
              >
                <span
                  className="serial-hero__status-dot"
                  style={{ background: statusStyle.dot }}
                />
                {statusLabel(serial.status)}
              </span>

              <span className="serial-hero__meta">
                {totalChapters} {serial.unit_label}{totalChapters !== 1 ? 's' : ''}
              </span>

              <span className="serial-hero__meta">
                Updated {lastUpdated}
              </span>
            </div>

            {/* ── Sibling books carousel ── */}
            {collection && collectionSerials.filter((s: any) => s.id !== serial.id).length > 0 && (
              <SeriesCarousel
                serials={collectionSerials.filter((s: any) => s.id !== serial.id)}
                onNavigate={onNavigate}
                darkMode={darkMode}
              />
            )}

            {serial.tagline && (
              <p className="serial-hero__tagline">{serial.tagline}</p>
            )}

            <h1 className="serial-hero__title">{serial.title}</h1>

            {serial.description && (
              <p className="serial-hero__description">{serial.description}</p>
            )}

            {serial.author_id && (
              <AuthorFollowRow author={data.author} profileId={serial.author_id} />
            )}

            {ctaChapter && (
              <button
                className="serial-hero__cta"
                onClick={() => onNavigate(`/blog/${ctaChapter.slug}`)}
              >
                {ctaLabel}
                {progress !== null && !isComplete && progressChapter && (
                  <span className="serial-hero__cta-sub">
                    {serial.unit_label} {progressChapter.serial_index + 1}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* ── Progress bar ── */}
        {progress !== null && (
          <div className="serial-progress">
            <div className="serial-progress__header">
              <span className="serial-progress__label">
                {isComplete
                  ? `Completed · All ${totalChapters} ${serial.unit_label}s`
                  : `${serial.unit_label} ${progressIndex + 1} of ${totalChapters}`}
              </span>
              <span className="serial-progress__pct">{progressPct}%</span>
            </div>
            <div className="serial-progress__track">
              <div
                className="serial-progress__fill"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* ── Chapter list ── */}
        <div className="serial-chapters">
          <div className="serial-chapters__header">
            <span className="serial-chapters__heading">
              {totalChapters} {serial.unit_label}{totalChapters !== 1 ? 's' : ''}
            </span>

            <button
              className="serial-chapters__toggle"
              onClick={() => setOpen(o => !o)}
              aria-expanded={open}
            >
              {open ? 'Collapse' : 'Expand all'}
            </button>
          </div>

          <div className="serial-chapters__list">
            {chapters.map((chapter, i) => {
              const isRead = progress !== null && i <= progressIndex
              const isCurrent = progress !== null && i === progressIndex

              return (
                <button
                  key={chapter.id}
                  className={[
                    'serial-chapter-row',
                    isRead ? 'serial-chapter-row--read' : '',
                    isCurrent ? 'serial-chapter-row--current' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => onNavigate(`/blog/${chapter.slug}`)}
                >
                  <span className="serial-chapter-row__index">
                    {isRead && !isCurrent
                      ? <span className="serial-chapter-row__check">✓</span>
                      : <span>{chapter.serial_index + 1}</span>
                    }
                  </span>

                  <span className="serial-chapter-row__info">
                    <span className="serial-chapter-row__title">
                      {chapter.title}
                    </span>
                    {(open || isCurrent) && chapter.excerpt && (
                      <span className="serial-chapter-row__excerpt">
                        {chapter.excerpt}
                      </span>
                    )}
                  </span>

                  <span className="serial-chapter-row__meta">
                    <span className="serial-chapter-row__readtime">
                      {readingTime(chapter.content)} min read
                    </span>
                  </span>

                  <span className="serial-chapter-row__right">
                    {chapter.published_at && (
                      <span className="serial-chapter-row__date">
                        {formatDate(chapter.published_at)}
                      </span>
                    )}
                    {isCurrent && (
                      <span className="serial-chapter-row__badge">Current</span>
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

      </div>    </div>
  )
}
