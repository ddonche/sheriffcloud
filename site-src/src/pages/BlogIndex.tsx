import { useState } from 'react'
import type { BlogIndexResponse, Post, SpurAuthor } from '../lib/types'
import PostCard from '../components/PostCard'
import PostList from '../components/PostList'
import { Icon } from '../Icons'

interface Props {
  data: BlogIndexResponse
  darkMode: boolean
  onNavigate: (path: string) => void  // React Router navigate
  onPrefetch: (path: string) => void
}

type ViewMode = 'grid' | 'list'

type SpurCategory = {
  id: string
  name: string
  color: string
  slug: string
}

const META_COLORS: Record<string, string> = {
  image: '#4a9eff',
  video: '#e040a0',
  code:  '#2dd98a',
  file:  '#f5c842',
  link:  '#c084fc',
  audio: '#fb923c',
}

const META_TYPES = ['image', 'video', 'code', 'file', 'link', 'audio'] as const
type MetaType = typeof META_TYPES[number]

function hasMetaType(post: Post, type: MetaType): boolean {
  const meta = post.content_meta ?? {}
  const key = `has_${type}s` in meta ? `has_${type}s`
    : `has_${type}` in meta ? `has_${type}`
    : null
  return key ? !!(meta as any)[key] : false
}

function GridIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="6" height="6" rx="1" fill={active ? 'var(--color-accent)' : 'var(--color-muted)'} />
      <rect x="9" y="1" width="6" height="6" rx="1" fill={active ? 'var(--color-accent)' : 'var(--color-muted)'} />
      <rect x="1" y="9" width="6" height="6" rx="1" fill={active ? 'var(--color-accent)' : 'var(--color-muted)'} />
      <rect x="9" y="9" width="6" height="6" rx="1" fill={active ? 'var(--color-accent)' : 'var(--color-muted)'} />
    </svg>
  )
}

function ListIcon({ active }: { active: boolean }) {
  const color = active ? 'var(--color-accent)' : 'var(--color-muted)'
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="2" width="4" height="4" rx="1" fill={color} />
      <rect x="7" y="3" width="8" height="1.5" rx="0.75" fill={color} />
      <rect x="7" y="5" width="5" height="1.5" rx="0.75" fill={color} />
      <rect x="1" y="8" width="4" height="4" rx="1" fill={color} />
      <rect x="7" y="9" width="8" height="1.5" rx="0.75" fill={color} />
      <rect x="7" y="11" width="5" height="1.5" rx="0.75" fill={color} />
    </svg>
  )
}

export default function BlogIndex({ data, darkMode, onNavigate, onPrefetch }: Props) {
  const { site, posts, authors } = data
  const categories = ((data as BlogIndexResponse & { categories?: SpurCategory[] }).categories ?? []) as SpurCategory[]
  const [view, setView] = useState<ViewMode>(() => {
    return (localStorage.getItem('spur-view') as ViewMode) ?? 'grid'
  })
  const [activeFilters, setActiveFilters] = useState<Set<MetaType>>(new Set())
  const [activeAuthor, setActiveAuthor] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  // Build a map for PostCard/PostList lookup
  const authorsMap = new Map<string, SpurAuthor>(authors.map(a => [a.id, a]))

  const setViewMode = (mode: ViewMode) => {
    setView(mode)
    localStorage.setItem('spur-view', mode)
  }

  const toggleFilter = (type: MetaType) => {
    setActiveFilters(prev => {
      const next = new Set(prev)
      next.has(type) ? next.delete(type) : next.add(type)
      return next
    })
  }

  // Only show filter icons that appear in at least one post
  const availableTypes = META_TYPES.filter(type =>
    posts.some(p => hasMetaType(p, type))
  )

  // Filter posts — category first, then author, then content type AND logic
  const filteredPosts = posts
    .filter(p => !activeCategory || (p as Post & { category_id?: string | null }).category_id === activeCategory)
    .filter(p => !activeAuthor || p.author_id === activeAuthor)
    .filter(p => activeFilters.size === 0 || [...activeFilters].every(type => hasMetaType(p, type)))

  return (
    <div className="page-container">
      <style>{`
        @media (max-width: 768px) {
          .blog-controls__label {
            display: none;
          }

          .blog-controls {
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
            grid-template-areas:
              "view content"
              "category author";
            column-gap: 16px;
            row-gap: 12px;
            align-items: start;
          }

          .blog-controls__group[data-mobile-slot="view"] {
            grid-area: view;
            align-items: flex-start !important;
            justify-self: start;
            min-width: 0;
          }

          .blog-controls__group[data-mobile-slot="content"] {
            grid-area: content;
            align-items: flex-end !important;
            justify-self: end;
            min-width: 0;
          }

          .blog-controls__group[data-mobile-slot="category"] {
            grid-area: category;
            align-items: flex-start !important;
            justify-self: start;
            min-width: 0;
          }

          .blog-controls__group[data-mobile-slot="author"] {
            grid-area: author;
            align-items: flex-end !important;
            justify-self: end;
            min-width: 0;
          }

          .blog-controls__group[data-mobile-slot="view"] .blog-view-toggle,
          .blog-controls__group[data-mobile-slot="category"] .blog-type-filters {
            justify-content: flex-start;
          }

          .blog-controls__group[data-mobile-slot="content"] .blog-type-filters,
          .blog-controls__group[data-mobile-slot="author"] .blog-author-filters {
            justify-content: flex-end;
          }
        }
      `}</style>
      <div className="blog-hero fade-up">
        <div className="blog-hero__label-row">
          <span className="blog-hero__label">Blog</span>

          {site.bio && (
            <span className="blog-hero__tagline">{site.bio}</span>
          )}
        </div>

        {/* Controls row — view style left, authors center, content type right */}
        <div className="blog-controls">
          <div className="blog-controls__group" data-mobile-slot="view">
            <span className="blog-controls__label">View style</span>
            <div className="blog-view-toggle">
              <button
                className={`blog-view-toggle__btn${view === 'list' ? ' blog-view-toggle__btn--active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List view"
              >
                <ListIcon active={view === 'list'} />
              </button>
              <button
                className={`blog-view-toggle__btn${view === 'grid' ? ' blog-view-toggle__btn--active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid view"
              >
                <GridIcon active={view === 'grid'} />
              </button>
            </div>
          </div>

          {categories.length > 0 && (
            <div className="blog-controls__group" data-mobile-slot="category" style={{ alignItems: 'center' }}>
              <span className="blog-controls__label">Filter by category</span>
              <div className="blog-type-filters">
                {categories.map(category => {
                  const active = activeCategory === category.id
                  return (
                    <button
                      key={category.id}
                      className="blog-type-filter"
                      style={{
                        background: active ? category.color + '22' : category.color + '0d',
                        borderColor: active ? category.color + '88' : category.color + '33',
                      }}
                      onClick={() => setActiveCategory(active ? null : category.id)}
                      title={category.name}
                      aria-label={category.name}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          display: 'block',
                          width: 12,
                          height: 12,
                          borderRadius: '999px',
                          background: category.color,
                          boxShadow: active ? `0 0 0 2px ${category.color}44` : 'none',
                        }}
                      />
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {availableTypes.length > 0 && (
            <div className="blog-controls__group" data-mobile-slot="content" style={{ alignItems: 'center' }}>
              <span className="blog-controls__label">Filter by content type</span>
              <div className="blog-type-filters">
                {availableTypes.map(type => {
                  const active = activeFilters.has(type)
                  return (
                    <button
                      key={type}
                      className="blog-type-filter"
                      style={{
                        background: active ? META_COLORS[type] + '22' : META_COLORS[type] + '0d',
                        borderColor: active ? META_COLORS[type] + '88' : META_COLORS[type] + '33',
                      }}
                      onClick={() => toggleFilter(type)}
                      title={type}
                    >
                      <Icon name={type as any} size={18} color={active ? META_COLORS[type] : META_COLORS[type] + '66'} />
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Author avatars — right */}
          {authors.length > 0 && (
            <div className="blog-controls__group" data-mobile-slot="author" style={{ alignItems: 'flex-end' }}>
              <span className="blog-controls__label">Filter by author</span>
              <div className="blog-author-filters">
                {authors.map(a => {
                  const active = activeAuthor === a.id
                  const name = a.display_name || a.username
                  const initials = name.split(/[\s._-]+/).map((p: string) => p[0]).join('').slice(0, 2).toUpperCase()

                  return (
                    <button
                      key={a.id}
                      className={`blog-author-filter${active ? ' blog-author-filter--active' : ''}`}
                      onClick={() => setActiveAuthor(activeAuthor === a.id ? null : a.id)}
                      title={name}
                    >
                      {a.avatar_url
                        ? <img src={a.avatar_url} alt={name} className="blog-author-filter__avatar" />
                        : <div className="blog-author-filter__placeholder">{initials}</div>
                      }
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {filteredPosts.length === 0 ? (
        <div className="blog-empty">
          <div className="blog-empty__icon">✦</div>
          <p className="blog-empty__text">No posts match these filters.</p>
        </div>
      ) : view === 'grid' ? (
        <>
          <div className="post-grid">
            {filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                author={authorsMap.get(post.author_id) ?? authors[0]}
                darkMode={darkMode}
                onClick={() => onNavigate(`/blog/${post.slug}`)}
                onHover={() => onPrefetch(`/blog/${post.slug}`)}
                onDiscoveryClick={(slug) => onNavigate(`/discover/${slug}`)}
                onSerialClick={(slug) => onNavigate(`/blog/serial/${slug}`)}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="post-list">
          {filteredPosts.map(post => (
            <PostList
              key={post.id}
              post={post}
              author={authorsMap.get(post.author_id) ?? authors[0]}
              darkMode={darkMode}
              onClick={() => onNavigate(`/blog/${post.slug}`)}
              onHover={() => onPrefetch(`/blog/${post.slug}`)}
              onSerialClick={(slug) => onNavigate(`/blog/serial/${slug}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
