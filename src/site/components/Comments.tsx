import { useEffect, useRef, useState } from 'react'
import { getSupabase } from '../../shared/supabase'
import { initials } from '../lib/api'

interface Comment {
  id: string
  user_id: string
  content: string
  created_at: string
  profiles: {
    username: string
    display_name: string | null
    avatar_url: string | null
  }
}

interface Props {
  entityType: string
  entityId: string
  commentCount: number
  onAuthRequired: () => void
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function Comments({ entityType, entityId, commentCount, onAuthRequired }: Props) {
  const [open, setOpen] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [content, setContent] = useState('')
  const [session, setSession] = useState<any>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [count, setCount] = useState(commentCount)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const sb = getSupabase()

  useEffect(() => {
    sb.auth.getSession().then(({ data: { session } }: any) => setSession(session))
    const { data: { subscription } } = sb.auth.onAuthStateChange((_e: any, s: any) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  async function fetchComments() {
    if (loaded) return
    setLoading(true)
    const { data: rows } = await sb
      .from('comments')
      .select('id, user_id, content, created_at')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: true })

    if (!rows || rows.length === 0) {
      setComments([])
      setLoading(false)
      setLoaded(true)
      return
    }

    const userIds = [...new Set(rows.map((r: any) => r.user_id))]
    const { data: profiles } = await sb
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .in('id', userIds)

    const profileMap: Record<string, any> = {}
    for (const p of profiles ?? []) profileMap[p.id] = p

    setComments(rows.map((r: any) => ({
      ...r,
      profiles: profileMap[r.user_id] ?? { username: 'Unknown', display_name: null, avatar_url: null }
    })) as any)
    setLoading(false)
    setLoaded(true)
  }

  const toggle = () => {
    if (!open) fetchComments()
    setOpen(o => !o)
  }

  const openAndFocus = () => {
    if (!open) {
      fetchComments()
      setOpen(true)
    }
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!session) { onAuthRequired(); return }
    if (!content.trim()) return
    setSubmitting(true)

    const { data: inserted, error } = await sb.from('comments').insert({
      entity_type: entityType,
      entity_id: entityId,
      user_id: session.user.id,
      content: content.trim(),
    }).select('id').single()

    if (!error && inserted) {
      const { data: full } = await sb.from('comments').select('id, user_id, content, created_at').eq('id', inserted.id).single()
      if (full) {
        const { data: profile } = await sb.from('profiles').select('id, username, display_name, avatar_url').eq('id', session.user.id).single()
        setComments(prev => [...prev, { ...full, profiles: profile ?? { username: 'Unknown', display_name: null, avatar_url: null } } as any])
        setCount(c => c + 1)
        setContent('')
      }
    }
    setSubmitting(false)
  }

  async function handleEdit(id: string) {
    if (!editContent.trim()) return
    const { error } = await sb.from('comments').update({ content: editContent.trim(), updated_at: new Date().toISOString() }).eq('id', id)
    if (!error) {
      setComments(prev => prev.map(c => c.id === id ? { ...c, content: editContent.trim() } : c))
      setEditingId(null)
    }
  }

  async function handleDelete(id: string) {
    const { error } = await sb.from('comments').delete().eq('id', id)
    if (!error) {
      setComments(prev => prev.filter(c => c.id !== id))
      setCount(c => Math.max(0, c - 1))
    }
  }

  const label = count === 0 ? 'No comments yet' : `${count} comment${count === 1 ? '' : 's'}`

  return (
    <div className="comments">

      {/* ── Collapsed bar ── */}
      <button className="comments__bar" onClick={toggle}>
        <span className="comments__bar-label">{label}</span>
        <div className="comments__bar-right">
          <span className="comments__bar-action" onClick={e => { e.stopPropagation(); openAndFocus() }}>
            Add a comment
          </span>
          <svg
            className={`comments__bar-caret${open ? ' comments__bar-caret--open' : ''}`}
            width="16" height="16" viewBox="0 0 640 640" fill="currentColor"
          >
            <path d="M320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64zM199 305C189.6 295.6 189.6 280.4 199 271.1C208.4 261.8 223.6 261.7 232.9 271.1L319.9 358.1L406.9 271.1C416.3 261.7 431.5 261.7 440.8 271.1C450.1 280.5 450.2 295.7 440.8 305L337 409C327.6 418.4 312.4 418.4 303.1 409L199 305z"/>
          </svg>
        </div>
      </button>

      {/* ── Expanded section ── */}
      {open && (
        <div className="comments__body">

          {/* Sticky input at top */}
          <div className="comments__sticky-form">
            <form onSubmit={handleSubmit}>
              {session ? (
                <>
                  <textarea
                    ref={textareaRef}
                    className="comment__textarea"
                    placeholder="Leave a comment…"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    rows={3}
                    disabled={submitting}
                  />
                  <div className="comment-form__footer">
                    <button type="submit" className="comment__submit-btn" disabled={submitting || !content.trim()}>
                      {submitting ? 'Posting…' : 'Post Comment'}
                    </button>
                  </div>
                </>
              ) : (
                <button type="button" className="comment-form__login-prompt" onClick={onAuthRequired}>
                  Log in to leave a comment
                </button>
              )}
            </form>
          </div>

          {/* Comments list */}
          {loading && <div className="comments__loading">Loading comments…</div>}

          {!loading && comments.length > 0 && (
            <div className="comments__list">
              {comments.map(comment => {
                const name = comment.profiles?.display_name || comment.profiles?.username || 'Unknown'
                const isOwn = session?.user?.id === comment.user_id
                const hovered = hoveredId === comment.id

                return (
                  <div key={comment.id} className="comment"
                    onMouseEnter={() => setHoveredId(comment.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <div className="comment__avatar">
                      {comment.profiles?.avatar_url
                        ? <img src={comment.profiles.avatar_url} alt={name} />
                        : <div className="comment__avatar-placeholder">{initials(name)}</div>
                      }
                    </div>
                    <div className="comment__body">
                      <div className="comment__meta">
                        <span className="comment__name">{name}</span>
                        <span className="comment__date">{timeAgo(comment.created_at)}</span>
                        {isOwn && hovered && editingId !== comment.id && (
                          <div className="comment__actions">
                            <button className="comment__action-btn" onClick={() => { setEditingId(comment.id); setEditContent(comment.content) }}>Edit</button>
                            <button className="comment__action-btn comment__action-btn--delete" onClick={() => handleDelete(comment.id)}>Delete</button>
                          </div>
                        )}
                      </div>
                      {editingId === comment.id ? (
                        <div className="comment__edit">
                          <textarea className="comment__textarea" value={editContent} onChange={e => setEditContent(e.target.value)} rows={3} autoFocus />
                          <div className="comment__edit-actions">
                            <button className="comment__submit-btn" onClick={() => handleEdit(comment.id)}>Save</button>
                            <button className="comment__cancel-btn" onClick={() => setEditingId(null)}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <p className="comment__content">{comment.content}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {!loading && comments.length === 0 && (
            <div className="comments__empty">No comments yet. Be the first.</div>
          )}
        </div>
      )}
    </div>
  )
}
