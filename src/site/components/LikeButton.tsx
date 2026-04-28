import { useState } from 'react'
import { getSupabase } from '../../shared/supabase'
import { Icon } from '../Icons'

interface Props {
  entityType: string
  entityId: string
  initialCount: number
  initialLiked: boolean
  onAuthRequired: () => void
}

export default function LikeButton({ entityType, entityId, initialCount, initialLiked, onAuthRequired }: Props) {
  const [count, setCount] = useState(initialCount)
  const [liked, setLiked] = useState(initialLiked)
  const [loading, setLoading] = useState(false)

  const toggle = async () => {
    if (loading) return

    const sb = getSupabase()
    const { data: { session } } = await sb.auth.getSession()

    if (!session) {
      onAuthRequired()
      return
    }

    setLoading(true)

    // Optimistic update first
    if (liked) {
      setLiked(false)
      setCount(c => c - 1)
      const { error } = await sb.from('likes')
        .delete()
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('user_id', session.user.id)
      // Roll back on error
      if (error) { setLiked(true); setCount(c => c + 1) }
    } else {
      setLiked(true)
      setCount(c => c + 1)
      const { error } = await sb.from('likes')
        .insert({ entity_type: entityType, entity_id: entityId, user_id: session.user.id })
      // Roll back on error
      if (error) { setLiked(false); setCount(c => c - 1) }
    }

    setLoading(false)
  }

  return (
    <button
      className={`like-btn${liked ? ' like-btn--liked' : ''}`}
      onClick={toggle}
      disabled={loading}
      title={liked ? 'Unlike' : 'Like'}
    >
      <Icon name="heart" size={16} color={liked ? 'var(--color-accent)' : 'var(--color-muted)'} />
      <span className="like-btn__count">{count}</span>
    </button>
  )
}
