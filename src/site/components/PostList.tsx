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

export default function PostList({
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
  const [isMobile, setIsMobile] = useState(false)

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

  const serialRow = post.serial && post.serial_index !== null && (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        if (onSerialClick && post.serial?.slug) onSerialClick(post.serial.slug)
      }}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 0,
        background: 'transparent',
        border: 'none',
        color: 'var(--color-accent)',
        fontSize: 12,
        cursor: 'pointer',
        textAlign: 'left',
        margin: '2px 0 2px',
      }}
      title={`View series: ${post.serial.title}`}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            fontWeight: 600,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {post.serial.title}
        </span>
        <span style={{ opacity: 0.6, flexShrink: 0 }}>·</span>
        <span style={{ flexShrink: 0 }}>
          {post.serial.unit_label} {post.serial_index + 1}
        </span>
        <span style={{ opacity: 0.6, flexShrink: 0 }}>·</span>
        <span style={{ opacity: 0.7, flexShrink: 0 }}>
          {post.serial.status.charAt(0).toUpperCase() + post.serial.status.slice(1)}
        </span>
      </div>

      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--color-dim)',
          whiteSpace: 'nowrap',
          marginLeft: 12,
          flexShrink: 0,
        }}
      >
        part of a series
      </span>
    </button>
  )

  useEffect(() => {
    getSupabase().auth.getSession().then(({ data: { session } }: any) => {
      setUserId(session?.user?.id ?? null)
    })
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return

    const media = window.matchMedia('(max-width: 768px)')
    const apply = () => setIsMobile(media.matches)

    apply()

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', apply)
      return () => media.removeEventListener('change', apply)
    }

    media.addListener(apply)
    return () => media.removeListener(apply)
  }, [])

  const discoveryButton = !!(post as any).discovery_category_id && (
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
        top: 8,
        left: 8,
        width: 28,
        height: 28,
        borderRadius: 6,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid rgba(255,255,255,0.08)',
        padding: 0,
        cursor: 'pointer',
        zIndex: 2,
      }}
    >
      <img
        src="/spur-discovery-icon.png"
        alt=""
        style={{
          width: 22,
          height: 22,
          objectFit: 'contain',
          display: 'block',
        }}
      />
    </button>
  )

  if (isMobile) {
    return (
      <article
        className={`post-list-item${hovered ? ' post-list-item--hovered' : ''}`}
        onClick={onClick}
        onMouseEnter={() => { setHovered(true); onHover?.() }}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {serialRow}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            alignItems: 'start',
            width: '100%',
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              minWidth: 0,
              aspectRatio: '16 / 9',
              overflow: 'hidden',
              borderRadius: 12,
              background: darkMode ? 'rgba(255,255,255,0.04)' : '#eef3f8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {discoveryButton}

            {thumb ? (
              <img
                src={thumb}
                alt={post.title}
                loading="lazy"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            ) : (
              <Icon
                name="image"
                size={24}
                color={darkMode ? 'var(--color-dim)' : '#8aaace'}
              />
            )}
          </div>

          <div
            style={{
              minWidth: 0,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              gap: 8,
            }}
          >
            <h2
              className="post-list-item__title"
              style={{
                margin: 0,
              }}
            >
              {post.title}
            </h2>

            {post.excerpt && (
              <p
                className="post-list-item__excerpt"
                style={{
                  margin: 0,
                }}
              >
                {post.excerpt}
              </p>
            )}
          </div>
        </div>

        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            minWidth: 0,
          }}
        >
          <div
            style={{
              minWidth: 0,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
              alignItems: 'center',
            }}
          >
            {post.tags && post.tags.length > 0 && (
              <>
                {post.tags.slice(0, 3).map(t => (
                  <span key={t} className="tag">#{t}</span>
                ))}
              </>
            )}
          </div>

          {metaKeys.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                flexShrink: 0,
              }}
            >
              {metaKeys.map(k => (
                <span
                  key={k}
                  className="post-list-item__meta-icon"
                  style={{ background: META_COLORS[k] + '18' }}
                  title={k}
                >
                  <Icon name={k as any} size={13} color={META_COLORS[k]} />
                </span>
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            minWidth: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              minWidth: 0,
              flexWrap: 'wrap',
            }}
          >
            <div className="author-chip" style={{ minWidth: 0 }}>
              {author.avatar_url
                ? <img className="author-chip__avatar" src={author.avatar_url} alt={name} />
                : <div className="author-chip__avatar--placeholder">{initials(name)}</div>
              }
              <span className="author-chip__name">{name}</span>
            </div>

            <span className="post-list-item__meta">{date}</span>
            <span className="post-card__sep">·</span>
            <span className="post-list-item__meta">{mins} min read</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexShrink: 0,
            }}
          >
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
                className="post-list-item__author-action"
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
      </article>
    )
  }

  return (
    <article
      className={`post-list-item${hovered ? ' post-list-item--hovered' : ''}`}
      onClick={onClick}
      onMouseEnter={() => { setHovered(true); onHover?.() }}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="post-list-item__thumb"
        style={{
          position: 'relative',
          alignSelf: 'center',
        }}
      >
        {discoveryButton}

        {thumb
          ? <img src={thumb} alt={post.title} loading="lazy" />
          : <Icon
              name="image"
              size={24}
              color={darkMode ? 'var(--color-dim)' : '#8aaace'}
            />
        }
      </div>

      <div className="post-list-item__mobile-meta">
        <div className="post-list-item__top">
          {post.tags && post.tags.length > 0 && (
            <div className="post-list-item__tags">
              {post.tags.slice(0, 3).map(t => (
                <span key={t} className="tag">#{t}</span>
              ))}
            </div>
          )}

          {metaKeys.length > 0 && (
            <div className="post-list-item__meta-icons">
              {metaKeys.map(k => (
                <span
                  key={k}
                  className="post-list-item__meta-icon"
                  style={{ background: META_COLORS[k] + '18' }}
                  title={k}
                >
                  <Icon name={k as any} size={13} color={META_COLORS[k]} />
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="post-list-item__footer">
          <div className="post-list-item__footer-left">
            <span className="post-list-item__meta">{date}</span>
            <span className="post-card__sep">·</span>
            <span className="post-list-item__meta">{mins} min read</span>
          </div>

          <div className="post-list-item__footer-right">
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
                className="post-list-item__author-action"
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

      <div className="post-list-item__content">
        {serialRow}

        <h2 className="post-list-item__title">{post.title}</h2>

        {post.excerpt && (
          <p className="post-list-item__excerpt">{post.excerpt}</p>
        )}

        <div className="post-list-item__top post-list-item__top--desktop">
          {post.tags && post.tags.length > 0 && (
            <div className="post-list-item__tags">
              {post.tags.slice(0, 3).map(t => (
                <span key={t} className="tag">#{t}</span>
              ))}
            </div>
          )}

          {metaKeys.length > 0 && (
            <div className="post-list-item__meta-icons">
              {metaKeys.map(k => (
                <span
                  key={k}
                  className="post-list-item__meta-icon"
                  style={{ background: META_COLORS[k] + '18' }}
                  title={k}
                >
                  <Icon name={k as any} size={13} color={META_COLORS[k]} />
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="post-list-item__footer post-list-item__footer--desktop">
          <div className="post-list-item__footer-left">
            <div className="author-chip">
              {author.avatar_url
                ? <img className="author-chip__avatar" src={author.avatar_url} alt={name} />
                : <div className="author-chip__avatar--placeholder">{initials(name)}</div>
              }
              <span className="author-chip__name">{name}</span>
            </div>
            <span className="post-list-item__meta">{date}</span>
            <span className="post-card__sep">·</span>
            <span className="post-list-item__meta">{mins} min read</span>
          </div>

          <div className="post-list-item__footer-right">
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
                className="post-list-item__author-action"
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