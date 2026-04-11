import { useEffect, useState } from 'react'
import type { SerialPageResponse, SerialChapter } from '../lib/types'
import { formatDate } from '../lib/api'

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

export default function SerialPage({ data, darkMode, onNavigate }: Props) {
  const { serial, chapters, site } = data

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

            {serial.tagline && (
              <p className="serial-hero__tagline">{serial.tagline}</p>
            )}

            <h1 className="serial-hero__title">{serial.title}</h1>

            {serial.description && (
              <p className="serial-hero__description">{serial.description}</p>
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

      </div>
    </div>
  )
}