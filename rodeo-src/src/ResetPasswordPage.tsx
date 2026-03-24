import { useEffect, useState } from "react"
import { supabase } from "./supabase"

export function ResetPasswordPage() {
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { setError(error.message); return }
    setMessage("Password updated! You can close this tab.")
  }

  if (!ready) return <div>Verifying reset link…</div>

  return (
    <form onSubmit={handleSubmit}>
      {error && <div>{error}</div>}
      {message && <div>{message}</div>}
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="New password"
        required
        minLength={8}
      />
      <button type="submit" disabled={loading}>
        {loading ? "Saving…" : "Set New Password"}
      </button>
    </form>
  )
}