import { useEffect, useState } from 'react'
import type { BlogPostResponse, Post } from '../lib/types'
import { firstImageFromContent, formatDate, authorName, initials, fetchRoute, prefetchRoute } from '../lib/api'
import { Icon } from '../Icons'
import FloatingBar from '../components/FloatingBar'
import LikeButton from '../components/LikeButton'
import Comments from '../components/Comments'
import PostList from '../components/PostList'

interface Props {
  data: BlogPostResponse
  darkMode: boolean
  onNavigate: (path: string) => void  // React Router navigate
  onAuthRequired: () => void
}

type RelatedPostItem = {
  post: Post
  author: BlogPostResponse['author']
}

function readingTime(html: string): number {
  const text = html.replace(/<[^>]+>/g, '')
  const words = text.trim().split(/\s+/).length
  return Math.max(1, Math.round(words / 200))
}

const META_COLORS: Record<string, string> = {
  image: '#4a9eff',
  video: '#e040a0',
  code:  '#2dd98a',
  file:  '#f5c842',
  link:  '#c084fc',
  audio: '#fb923c',
}

function setMeta(property: string, content: string) {
  let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement
    || document.querySelector(`meta[name="${property}"]`) as HTMLMetaElement
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(property.startsWith('og:') || property.startsWith('twitter:') ? 'property' : 'name', property)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export default function BlogPost({ data, darkMode, onNavigate, onAuthRequired }: Props) {
  const { post, author, site } = data
  const name = authorName(author)
  const date = formatDate(post.published_at ?? post.created_at)
  const thumb = post.thumbnail_url ?? firstImageFromContent(post.content)
  const mins = readingTime(post.content)
  const [morePosts, setMorePosts] = useState<RelatedPostItem[]>([])

  const discovery = (post as any).discovery ?? null
  const inDiscovery = !!(post as any).discovery_category_id

  const discoveryChannel = discovery?.parent?.name ?? null
  const discoveryCategory = discovery?.name ?? null

  const meta = post.content_meta ?? {}
  const metaKeys = Object.entries(meta)
    .filter(([, v]) => v)
    .map(([k]) => k.replace('has_', '').replace('images', 'image').replace('links', 'link'))
    .filter(k => META_COLORS[k])

  // OG tags
  useEffect(() => {
    const prevTitle = document.title
    document.title = `${post.title} — ${site.name}`
    setMeta('og:title', post.title)
    setMeta('og:description', post.excerpt ?? '')
    setMeta('og:url', window.location.href)
    setMeta('og:type', 'article')
    setMeta('og:site_name', site.name)
    if (thumb) setMeta('og:image', thumb)
    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', post.title)
    setMeta('twitter:description', post.excerpt ?? '')
    if (thumb) setMeta('twitter:image', thumb)

    return () => {
      document.title = prevTitle
    }
  }, [post.id, post.title, post.excerpt, site.name, thumb])

  // Prefetch blog index so back navigation is instant
  useEffect(() => {
    prefetchRoute('/blog')
  }, [])

  // More posts
  useEffect(() => {
    fetchRoute('/blog').then((res: any) => {
      if (res.type === 'blog_index') {
        const authorMap = new Map(
          ((res.authors ?? []) as BlogPostResponse['author'][]).map(a => [a.id, a])
        )

        const related = (res.posts ?? [])
          .filter((p: Post) => p.id !== post.id)
          .slice(0, 3)
          .map((p: Post) => ({
            post: p,
            author: authorMap.get(p.author_id) ?? {
              id: p.author_id,
              username: 'unknown',
              display_name: null,
              avatar_url: null,
              bio: null,
            },
          }))

        setMorePosts(related)
      }
    }).catch(() => {})
  }, [post.id])

  return (
    <div className="page-container">

      <div className="blog-post-layout fade-up">

        <header className="blog-post-header">
          {((post.tags && post.tags.length > 0) || inDiscovery) && (
            <div
              className="blog-post-header__tags tag-list"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              {inDiscovery && discoveryChannel && (
                <button
                  type="button"
                  onClick={() => {
                    if (discovery?.slug) onNavigate(`/discover/${discovery.slug}`)
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    height: 32,
                    padding: '0 12px',
                    borderRadius: 999,
                    border: darkMode ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(0,0,0,0.10)',
                    background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                    color: 'var(--color-text)',
                    font: 'inherit',
                    fontSize: 13,
                    lineHeight: 1,
                    cursor: discovery?.slug ? 'pointer' : 'default',
                    whiteSpace: 'nowrap',
                  }}
                  title={discoveryChannel}
                  aria-label={discoveryChannel}
                >
                  <img
                    src="/spur-discovery-icon.png"
                    alt=""
                    style={{
                      width: 16,
                      height: 16,
                      objectFit: 'contain',
                      display: 'block',
                      flexShrink: 0,
                    }}
                  />
                  <span>{discoveryChannel}</span>
                </button>
              )}

              {inDiscovery && discoveryCategory && (
                <button
                  type="button"
                  onClick={() => {
                    if (discovery?.slug) onNavigate(`/discover/${discovery.slug}`)
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    height: 32,
                    padding: '0 12px',
                    borderRadius: 999,
                    border: darkMode ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(0,0,0,0.10)',
                    background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                    color: 'var(--color-text)',
                    font: 'inherit',
                    fontSize: 13,
                    lineHeight: 1,
                    cursor: discovery?.slug ? 'pointer' : 'default',
                    whiteSpace: 'nowrap',
                  }}
                  title={discoveryCategory}
                  aria-label={discoveryCategory}
                >
                  <img
                    src="/spur-discovery-icon.png"
                    alt=""
                    style={{
                      width: 16,
                      height: 16,
                      objectFit: 'contain',
                      display: 'block',
                      flexShrink: 0,
                    }}
                  />
                  <span>{discoveryCategory}</span>
                </button>
              )}

              {post.tags?.map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          )}
          <h1 className="blog-post-header__title">{post.title}</h1>

          {post.excerpt && (
            <p className="blog-post-header__excerpt">{post.excerpt}</p>
          )}

          <div className="blog-post-header__meta">
            <div className="blog-post-header__meta-left">
              <div className="author-chip">
                {author.avatar_url
                  ? <img className="author-chip__avatar" src={author.avatar_url} alt={name} />
                  : <div className="author-chip__avatar--placeholder">{initials(name)}</div>
                }
                <span className="author-chip__name">{name}</span>
              </div>
              <span className="blog-post-header__date">{date}</span>
              <span className="blog-post-header__readtime">{mins} min read</span>
            </div>

            <div className="blog-post-header__meta-right">
              <LikeButton
                entityType="spur_post"
                entityId={post.id}
                initialCount={post.like_count}
                initialLiked={post.user_liked}
                onAuthRequired={onAuthRequired}
              />
              <span className="blog-post-header__stat blog-post-header__stat--muted">
                <Icon name="comments" size={14} color="var(--color-muted)" />
                {(post as any).comment_count ?? 0}
              </span>
              {metaKeys.length > 0 && (
                <div className="blog-post-header__meta-icons">
                  {metaKeys.map(k => (
                    <span key={k} className="blog-post-header__meta-icon" style={{ background: META_COLORS[k] + '18' }} title={k}>
                      <Icon name={k as any} size={15} color={META_COLORS[k]} />
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <hr className="blog-post-header__divider" />
        </header>

        {thumb && (
          <div style={{ position: 'relative' }}>
            <img className="blog-post-hero-img" src={thumb} alt={post.title} />

            {inDiscovery && (
              <button
                type="button"
                title={
                  discovery?.parent?.name && discovery?.name
                    ? `${discovery.parent.name} - ${discovery.name}`
                    : discovery?.name ?? 'In Discovery'
                }
                aria-label={
                  discovery?.parent?.name && discovery?.name
                    ? `${discovery.parent.name} - ${discovery.name}`
                    : discovery?.name ?? 'In Discovery'
                }
                onClick={() => {
                  if (discovery?.slug) {
                    onNavigate(`/discover/${discovery.slug}`)
                  }
                }}
                style={{
                  position: 'absolute',
                  top: 12,
                  left: 12,
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: 'rgba(0, 0, 0, 0.65)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(255,255,255,0.08)',
                  padding: 0,
                  cursor: 'pointer',
                }}
              >
                <img
                  src="/spur-discovery-icon.png"
                  alt=""
                  style={{
                    width: 30,
                    height: 30,
                    objectFit: 'contain',
                    display: 'block',
                  }}
                />
              </button>
            )}
          </div>
        )}

        <div className="article-body" dangerouslySetInnerHTML={{ __html: post.content }} />

        {((post.tags && post.tags.length > 0) || inDiscovery) && (
          <div
            className="blog-post-footer__meta-row"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
              marginTop: 24,
              marginBottom: 8,
            }}
          >
            {inDiscovery && discoveryChannel && (
              <button
                type="button"
                onClick={() => {
                  if (discovery?.slug) onNavigate(`/discover/${discovery.slug}`)
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  height: 32,
                  padding: '0 12px',
                  borderRadius: 999,
                  border: darkMode ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(0,0,0,0.10)',
                  background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                  color: 'var(--color-text)',
                  font: 'inherit',
                  fontSize: 13,
                  lineHeight: 1,
                  cursor: discovery?.slug ? 'pointer' : 'default',
                  whiteSpace: 'nowrap',
                }}
                title={discoveryChannel}
                aria-label={discoveryChannel}
              >
                <img
                  src="/spur-discovery-icon.png"
                  alt=""
                  style={{
                    width: 16,
                    height: 16,
                    objectFit: 'contain',
                    display: 'block',
                    flexShrink: 0,
                  }}
                />
                <span>{discoveryChannel}</span>
              </button>
            )}

            {inDiscovery && discoveryCategory && (
              <button
                type="button"
                onClick={() => {
                  if (discovery?.slug) onNavigate(`/discover/${discovery.slug}`)
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  height: 32,
                  padding: '0 12px',
                  borderRadius: 999,
                  border: darkMode ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(0,0,0,0.10)',
                  background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                  color: 'var(--color-text)',
                  font: 'inherit',
                  fontSize: 13,
                  lineHeight: 1,
                  cursor: discovery?.slug ? 'pointer' : 'default',
                  whiteSpace: 'nowrap',
                }}
                title={discoveryCategory}
                aria-label={discoveryCategory}
              >
                <img
                  src="/spur-discovery-icon.png"
                  alt=""
                  style={{
                    width: 16,
                    height: 16,
                    objectFit: 'contain',
                    display: 'block',
                    flexShrink: 0,
                  }}
                />
                <span>{discoveryCategory}</span>
              </button>
            )}

            {post.tags?.map(tag => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}

            <div
              style={{
                marginLeft: 'auto',
                display: 'inline-flex',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <LikeButton
                entityType="spur_post"
                entityId={post.id}
                initialCount={post.like_count}
                initialLiked={post.user_liked}
                onAuthRequired={onAuthRequired}
              />
            </div>
          </div>
        )}

        <div className="author-block">
          {author.avatar_url
            ? <img className="author-block__avatar" src={author.avatar_url} alt={name} />
            : <div className="author-block__avatar--placeholder">{initials(name)}</div>
          }
          <div className="author-block__info">
            <span className="author-block__label">Written by</span>
            <span className="author-block__name">{name}</span>
            {author.bio && <span className="author-block__bio">{author.bio}</span>}
          </div>
        </div>

        {morePosts.length > 0 && (
          <div className="more-posts">
            <div className="more-posts__heading">More from {site.name}</div>
            <div className="more-posts__list">
              {morePosts.map(({ post: p, author: relatedAuthor }) => (
                <PostList
                  key={p.id}
                  post={p}
                  author={relatedAuthor}
                  darkMode={darkMode}
                  onClick={() => onNavigate(`/blog/${p.slug}`)}
                  onHover={() => prefetchRoute(`/blog/${p.slug}`)}
                  onDiscoveryClick={(slug) => onNavigate(`/discover/${slug}`)}
                />
              ))}
            </div>
          </div>
        )}

        <div className="comments-section">
          <Comments
            entityType="spur_post"
            entityId={post.id}
            commentCount={post.comment_count}
            onAuthRequired={onAuthRequired}
          />
        </div>

        <FloatingBar totalMins={mins} />
      </div>
    </div>
  )
}