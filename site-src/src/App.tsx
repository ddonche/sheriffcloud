import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import type { RouterResponse, Site } from './lib/types'
import { fetchRoute, prefetchRoute, bustRoute } from './lib/api'
import SiteHeader from './components/SiteHeader'
import SiteFooter from './components/SiteFooter'
import BlogIndex from './pages/BlogIndex'
import BlogPost from './pages/BlogPost'
import SerialPage from './pages/SerialPage'
import NotFound from './pages/NotFound'
import { getSupabase } from './supabase'

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const path = location.pathname

  const [data, setData] = useState<RouterResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAuth, setShowAuth] = useState(false)
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return (localStorage.getItem('sc-theme') ?? 'dark') !== 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
    localStorage.setItem('sc-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  const site: Site | null =
    data && data.type !== 'not_found' ? data.site : null

  // RSS autodiscovery
  useEffect(() => {
    if (!site) return
    const id = 'spur-rss-link'
    let el = document.getElementById(id) as HTMLLinkElement | null
    if (!el) {
      el = document.createElement('link')
      el.id = id
      el.rel = 'alternate'
      el.type = 'application/rss+xml'
      document.head.appendChild(el)
    }
    el.title = site.name
    el.href = `${window.location.origin}/rss`
  }, [site?.name])

  // Bust cache on sign-in/sign-out without triggering spinner
  useEffect(() => {
    const sb = getSupabase()
    let prevUserId: string | null = null
    const { data: { subscription } } = sb.auth.onAuthStateChange((_event: any, session: any) => {
      const userId = session?.user?.id ?? null
      if (userId !== prevUserId) {
        prevUserId = userId
        // Restore the page the user was on before OAuth redirect
        const returnTo = sessionStorage.getItem('oauth_return_to')
        if (returnTo && _event === 'SIGNED_IN') {
          sessionStorage.removeItem('oauth_return_to')
          window.location.replace(returnTo)
          return
        }
        bustRoute(path)
        // Re-fetch silently — stale-while-revalidate, no spinner
        fetchRoute(path, fresh => setData(fresh)).catch(() => {})
      }
    })
    return () => subscription.unsubscribe()
  }, [path])

  // Fetch on path change
  useEffect(() => {
    let cancelled = false
    setError(null)

    fetchRoute(path, fresh => {
      if (!cancelled) {
        setData(fresh)
        requestAnimationFrame(() => window.scrollTo(0, 0))
      }
    }).then(res => {
      if (!cancelled) {
        setData(res)
        setLoading(false)
        requestAnimationFrame(() => window.scrollTo(0, 0))
      }
    }).catch(err => {
      if (!cancelled) {
        setError(err.message)
        setLoading(false)
      }
    })

    return () => { cancelled = true }
  }, [path])

  const devNavigate = (path: string) => {
    const sub = new URLSearchParams(window.location.search).get('sub')
    navigate(sub ? `${path}?sub=${sub}` : path)
  }

  const renderPage = () => {
    if (loading) return (
      <div className="state-loading">
        <div className="state-loading__spinner" />
        <span>Loading…</span>
      </div>
    )
    if (error) return (
      <div className="state-error">
        <p>Failed to load page.</p>
        <span className="state-error__code">{error}</span>
      </div>
    )
    if (!data) return null
    switch (data.type) {
      case 'blog_index': return <BlogIndex data={data} onNavigate={devNavigate} darkMode={darkMode} onPrefetch={prefetchRoute} />
      case 'blog_post':  return <BlogPost data={data} onNavigate={devNavigate} darkMode={darkMode} onAuthRequired={() => setShowAuth(true)} />
      case 'serial_page': return <SerialPage data={data} onNavigate={devNavigate} darkMode={darkMode} />
      case 'not_found':
      default:           return <NotFound />
    }
  }

  return (
    <>
      <SiteHeader site={site} currentPath={path} darkMode={darkMode} onToggleTheme={() => setDarkMode(d => !d)} showAuth={showAuth} onShowAuth={setShowAuth} />
      <main>{renderPage()}</main>
      <SiteFooter tier={site?.site_type === 'cloud' ? 'free' : 'free'} />
    </>
  )
}

export default App
