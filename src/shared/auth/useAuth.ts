import { useEffect, useState } from "react"
import { getSupabase } from "../supabase"

type AuthState = {
  userEmail: string | null
  isLoading: boolean
  signOut: () => Promise<void>
}

export function useAuth(): AuthState {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const sb = getSupabase()

    if (!sb) {
      setUserEmail(null)
      setIsLoading(false)
      return
    }

    sb.auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user?.email ?? null)
      setIsLoading(false)
    })

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null)
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    const sb = getSupabase()
    if (!sb) return
    await sb.auth.signOut()
    setUserEmail(null)
  }

  return {
    userEmail,
    isLoading,
    signOut,
  }
}