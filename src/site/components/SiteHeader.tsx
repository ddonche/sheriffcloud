import { useEffect, useRef, useState } from 'react'
import type { Site } from '../lib/types'
import { getSupabase } from '../supabase'
import { initials } from '../lib/api'
import AuthModal from './AuthModal'

interface Props {
  site: Site | null
  currentPath: string
  darkMode: boolean
  onToggleTheme: () => void
  isAuthor?: boolean
  showAuth?: boolean
  onShowAuth?: (v: boolean) => void
}

export default function SiteHeader({
  site,
  currentPath,
  darkMode,
  onToggleTheme,
  isAuthor = false,
  showAuth = false,
  onShowAuth,
}: Props) {
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)

  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const sb = getSupabase()

  const siteName = site?.name ?? ''
  const displayName =
    profile?.display_name ||
    profile?.username ||
    session?.user?.email?.split('@')[0] ||
    '?'
  const words = siteName.trim().split(' ')
  const last = words.pop()
  const rest = words.join(' ')

  const isPostPage = currentPath.startsWith('/blog/') && currentPath.length > 6

  useEffect(() => {
    sb.auth.getSession().then(({ data: { session } }: any) => setSession(session))
    const { data: { subscription } } = sb.auth.onAuthStateChange((_e: any, s: any) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session?.user?.id) {
      setProfile(null)
      return
    }

    sb.from('profiles')
      .select('username, display_name, avatar_url, is_admin')
      .eq('id', session.user.id)
      .single()
      .then(({ data }: any) => setProfile(data))
  }, [session])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const signOut = async () => {
    await sb.auth.signOut()
    setShowDropdown(false)
  }

  return (
    <>
      <header className="site-header">
        <div className="site-header__inner">
          <a href="/" className="site-header__brand">
            {site?.logo_url ? (
              <img
                src={site.logo_url}
                alt={site?.name || 'Site logo'}
                className="site-header__logo"
              />
            ) : (
              <div className="site-header__logo-placeholder">
                {initials(siteName || 'S')}
              </div>
            )}

            <span className="site-header__wordmark">
              {rest && <>{rest} </>}
              {last && <span>{last}</span>}
            </span>
          </a>

          <nav className="site-header__nav">
            <a href="/blog" className={currentPath.startsWith('/blog') ? 'active' : ''}>Blog</a>
            <a href="/docs" className={currentPath.startsWith('/docs') ? 'active' : ''}>Docs</a>
            <a href="/forum" className={currentPath.startsWith('/forum') ? 'active' : ''}>Forum</a>
          </nav>

          <div className="site-header__actions">
            <button className="theme-toggle" onClick={onToggleTheme} aria-label="Toggle theme">
              {darkMode ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            {session ? (
              <div className="site-header__user" ref={dropdownRef}>
                <button className="site-header__avatar-btn" onClick={() => setShowDropdown(d => !d)}>
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={displayName} className="site-header__avatar-img" />
                  ) : (
                    <div className="site-header__avatar-placeholder">{initials(displayName)}</div>
                  )}
                </button>

                {showDropdown && (
                  <div className="site-header__dropdown">
                    <div className="site-header__dropdown-name">{displayName}</div>

                    {isPostPage && isAuthor && (
                      <a
                        href="https://admin.sheriffcloud.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="site-header__dropdown-item"
                      >
                        Edit Post
                      </a>
                    )}

                    {profile?.is_admin && (
                      <a
                        href="https://admin.sheriffcloud.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="site-header__dropdown-item"
                      >
                        Admin Panel
                      </a>
                    )}

                    <button
                      className="site-header__dropdown-item site-header__dropdown-item--signout"
                      onClick={signOut}
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button className="site-header__login-btn" onClick={() => onShowAuth?.(true)}>
                Log in
              </button>
            )}
          </div>
        </div>
      </header>

      {showAuth && (
        <AuthModal
          onClose={() => onShowAuth?.(false)}
          onSuccess={() => onShowAuth?.(false)}
        />
      )}
    </>
  )
}