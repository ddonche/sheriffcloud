import { useState } from 'react'
import { getSupabase } from '../supabase'

interface Props {
  onClose: () => void
  onSuccess: () => void
}

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width={16} height={16} fill="currentColor">
    <path d="M320 80C176 80 57.6 196.8 8 292.2C2.9 301.8 2.9 313.2 8 322.8C57.6 418.2 176 535 320 535C464 535 582.4 418.2 632 322.8C637.1 313.2 637.1 301.8 632 292.2C582.4 196.8 464 80 320 80zM320 451C249.7 451 193 394.3 193 324C193 253.7 249.7 197 320 197C390.3 197 447 253.7 447 324C447 394.3 390.3 451 320 451zM320 267C285.7 267 258 294.7 258 329C258 363.3 285.7 391 320 391C354.3 391 382 363.3 382 329C382 294.7 354.3 267 320 267z"/>
  </svg>
)

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width={16} height={16} fill="currentColor">
    <path d="M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9L601.2 634.9C611.6 643.1 626.7 641.2 634.9 630.8S641.2 605.3 630.8 597.1L544 530.6C683.6 456.5 752 320 752 320S633.6 80 320 80C245.3 80 181.1 100.6 128.6 133.4L38.8 5.1zM223.2 190.9L281.7 235.9C295.4 224.8 313 218 332.2 218C374.5 218 409 251.3 409 292C409 306.3 405 319.7 398.1 331L463.3 380.2C478.4 353.9 487 323.1 487 292C487 208.9 420.3 144 332.2 144C289.2 144 250.3 159.8 223.2 190.9zM320 512C207.7 512 116.4 444.1 64 384C92.8 349.8 132.3 313.6 181.5 289.1L234.9 330.3C232.3 337.3 231 344.9 231 352.8C231 393.5 265.5 426.8 307.8 426.8C320.7 426.8 332.9 423.4 343.4 417.5L390.9 453.3C370.9 464.3 348 470.8 323.8 470.8C281.5 470.8 247 437.5 247 396.8"/>
  </svg>
)

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width={18} height={18}>
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    <path fill="none" d="M0 0h48v48H0z"/>
  </svg>
)

function slugifyUsername(val: string) {
  return val.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30)
}

export default function AuthModal({ onClose, onSuccess }: Props) {
  const [tab, setTab] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const sb = getSupabase()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null); setLoading(true)
    const { error } = await sb.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setError(error.message); return }
    onSuccess(); onClose()
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null); setLoading(true)
    if (!username.trim()) { setError('Username is required'); setLoading(false); return }
    const { data, error } = await sb.auth.signUp({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    if (data.user) {
      await sb.from('profiles').upsert({ id: data.user.id, username: slugifyUsername(username), updated_at: new Date().toISOString() })
    }
    setLoading(false)
    setMessage('Check your email for the confirmation link!')
  }

  const handleForgotPassword = async () => {
    if (!email) { setError('Enter your email first'); return }
    setError(null); setLoading(true)
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/` })
    setLoading(false)
    if (error) { setError(error.message); return }
    setMessage('Password reset email sent!')
  }

  const handleGoogleAuth = async () => {
    setError(null)
    sessionStorage.setItem('oauth_return_to', window.location.href)
    await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={e => e.stopPropagation()}>
        <div className="auth-modal__brand">
          <img src="/sheriff-logo.png" alt="Sheriff Cloud" className="auth-modal__logo" />
          <span className="auth-modal__wordmark">Sheriff Cloud</span>
        </div>
        <div className="auth-modal__tabs">
          {(['login', 'signup'] as const).map(t => (
            <button key={t} className={`auth-modal__tab${tab === t ? ` auth-modal__tab--active auth-modal__tab--active-${t}` : ''}`}
              onClick={() => { setTab(t); setError(null); setMessage(null) }}>
              {t === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          ))}
        </div>
        <div className="auth-modal__body">
          {error && <div className="auth-modal__error">{error}</div>}
          {message && <div className="auth-modal__success">{message}</div>}

          <button
            type="button"
            className="auth-modal__oauth-btn"
            onClick={handleGoogleAuth}
            disabled={loading}
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="auth-modal__divider">
            <span>or</span>
          </div>

          <form onSubmit={tab === 'login' ? handleLogin : handleSignup}>
            <div className="auth-modal__field">
              <label className="auth-modal__label">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required disabled={loading} className="auth-modal__input" />
            </div>
            {tab === 'signup' && (
              <div className="auth-modal__field">
                <label className="auth-modal__label">Username</label>
                <input type="text" value={username} onChange={e => setUsername(slugifyUsername(e.target.value))}
                  placeholder="yourname" required disabled={loading} className="auth-modal__input" maxLength={30} />
              </div>
            )}
            <div className="auth-modal__field">
              <label className="auth-modal__label">Password</label>
              <div className="auth-modal__input-wrap">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required disabled={loading} className="auth-modal__input auth-modal__input--password" />
                <button type="button" className="auth-modal__eye" onClick={() => setShowPassword(v => !v)}>
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
            {tab === 'login' && (
              <div className="auth-modal__forgot">
                <button type="button" onClick={handleForgotPassword} disabled={loading} className="auth-modal__forgot-btn">
                  Forgot password?
                </button>
              </div>
            )}
            <button type="submit" disabled={loading} className={`auth-modal__submit${tab === 'signup' ? ' auth-modal__submit--signup' : ''}`}>
              {loading ? 'Loading…' : tab === 'login' ? 'Log In' : 'Create Account'}
            </button>
          </form>
        </div>
        <button className="auth-modal__close" onClick={onClose} aria-label="Close">✕</button>
      </div>
    </div>
  )
}
