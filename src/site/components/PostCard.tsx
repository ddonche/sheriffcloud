import { useEffect, useState } from 'react'
import type { Post, Author } from '../lib/types'
import { firstImageFromContent, formatDate, authorName, initials } from '../lib/api'
import { Icon } from '../Icons'
import { getSupabase } from '../supabase'

interface Props {
  post: Post
  author: Author
  darkMode: boolean
  onClick: () => void
  onHover?: () => void
  onDiscoveryClick?: (slug: string) => void
  onSerialClick?: (slug: string) => void
}

const META_COLORS: Record<string, string> = {
  image: '#4a9eff',
  video: '#e040a0',
  code: '#2dd98a',
  file: '#f5c842',
  link: '#c084fc',
  audio: '#fb923c',
}

function readingTime(html: string): number {
  const text = html.replace(/<[^>]+>/g, '')
  const words = text.trim().split(/\s+/).length
  return Math.max(1, Math.round(words / 200))
}

export default function PostCard({
  post,
  author,
  darkMode,
  onClick,
  onHover,
  onDiscoveryClick,
  onSerialClick,
}: Props) {
  const [hovered, setHovered] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const thumb = post.thumbnail_url ?? firstImageFromContent(post.content)
  const name = authorName(author)
  const date = formatDate(post.published_at ?? post.created_at)
  const mins = readingTime(post.content)
  const isAuthor = userId === post.author_id

  const meta = post.content_meta ?? {}
  const metaKeys = Object.entries(meta)
    .filter(([, v]) => v)
    .map(([k]) =>
      k.replace('has_', '').replace('images', 'image').replace('links', 'link')
    )
    .filter(k => META_COLORS[k])

  const serial = post.serial ?? null

  useEffect(() => {
    getSupabase().auth.getSession().then(({ data: { session } }: any) => {
      setUserId(session?.user?.id ?? null)
    })
  }, [])

  return (
    <article
      className={`post-card${hovered ? ' post-card--hovered' : ''}`}
      onClick={onClick}
      onMouseEnter={() => { setHovered(true); onHover?.() }}
      onMouseLeave={() => setHovered(false)}
    >
      {serial && post.serial_index !== null && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            if (onSerialClick && serial.slug) onSerialClick(serial.slug)
          }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid var(--color-border-light)',
            color: 'var(--color-accent)',
            fontSize: 12,
            cursor: 'pointer',
          }}
          title={`View series: ${serial.title}`}
        >
          {/* LEFT SIDE */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontWeight: 600 }}>{serial.title}</span>
            <span style={{ opacity: 0.6 }}>·</span>
            <span>{serial.unit_label} {post.serial_index + 1}</span>
            <span style={{ opacity: 0.6 }}>·</span>
            <span style={{ opacity: 0.7 }}>
              {serial.status.charAt(0).toUpperCase() + serial.status.slice(1)}
            </span>
          </div>

          {/* RIGHT SIDE */}
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--color-dim)',
              whiteSpace: 'nowrap',
            }}
          >
            part of a series
          </span>
        </button>
      )}

      <div className="post-card__thumb">
        {!!(post as any).discovery_category_id && (
          <button
            type="button"
            title={(post as any).discovery?.name ?? 'In Discovery'}
            aria-label={(post as any).discovery?.name ?? 'In Discovery'}
            onClick={(e) => {
              e.stopPropagation()
              const slug = (post as any).discovery?.slug
              if (slug) onDiscoveryClick?.(slug)
            }}
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              width: 32,
              height: 32,
              borderRadius: 6,
              background: 'rgba(0,0,0,0.65)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2,
              border: '1px solid rgba(255,255,255,0.08)',
              padding: 0,
              cursor: 'pointer',
            }}
          >
            <img
              src="/spur-discovery-icon.png"
              alt=""
              style={{ width: 24, height: 24, objectFit: 'contain', display: 'block' }}
            />
          </button>
        )}

        {thumb
          ? <img className="post-card__thumbnail" src={thumb} alt={post.title} loading="lazy" />
          : <Icon name="image" size={32} color={darkMode ? 'var(--color-dim)' : '#8aaace'} />
        }
      </div>

      <div className="post-card__content">
        <div className="post-card__top">
          {post.tags && post.tags.length > 0 && (
            <div className="post-card__tags">
              {post.tags.slice(0, 3).map(t => (
                <span key={t} className="tag">#{t}</span>
              ))}
            </div>
          )}

          {metaKeys.length > 0 && (
            <div className="post-card__meta-icons">
              {metaKeys.map(k => (
                <span
                  key={k}
                  className="post-card__meta-icon"
                  style={{ background: META_COLORS[k] + '18' }}
                  title={k}
                >
                  <Icon name={k as any} size={13} color={META_COLORS[k]} />
                </span>
              ))}
            </div>
          )}
        </div>

        <h2 className="post-card__title">{post.title}</h2>

        {post.excerpt && (
          <p className="post-card__excerpt">{post.excerpt}</p>
        )}

        <div className="post-card__footer">
          <div className="post-card__footer-left">
            <div className="author-chip">
              {author.avatar_url
                ? <img className="author-chip__avatar" src={author.avatar_url} alt={name} />
                : <div className="author-chip__avatar--placeholder">{initials(name)}</div>
              }
              <span className="author-chip__name">{name}</span>
            </div>

            <span className="post-card__meta">{date}</span>
            <span className="post-card__sep">·</span>
            <span className="post-card__meta">{mins} min read</span>
          </div>

          <div className="post-card__footer-right">
            <span
              className="post-card__stat"
              style={{ color: post.user_liked ? 'var(--color-accent)' : 'var(--color-muted)' }}
            >
              <Icon
                name="heart"
                size={13}
                color={post.user_liked ? 'var(--color-accent)' : 'var(--color-muted)'}
              />
              {post.like_count ?? 0}
            </span>

            <span className="post-card__stat" style={{ color: 'var(--color-muted)' }}>
              <Icon name="comments" size={13} color="var(--color-muted)" />
              {post.comment_count ?? 0}
            </span>

            {isAuthor && (
              <button
                className="post-card__author-action"
                onClick={(e) => {
                  e.stopPropagation()
                  window.open('https://admin.sheriffcloud.com', '_blank')
                }}
                title="Edit post"
              >
                <Icon name="edit" size={13} />
              </button>
            )}
          </div>
        </div>

      </div>
    </article>
  )
}
