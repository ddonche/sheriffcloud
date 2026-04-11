import { useState } from "react"
import type { ReactNode } from "react"

import SiteHeader from "../components/SiteHeader"
import SiteFooter from "../components/SiteFooter"
import { AuthModal } from "../../spur/AuthModal"

type PageShellProps = {
  children: ReactNode
}

export default function PageShell({ children }: PageShellProps) {
  const [showAuth, setShowAuth] = useState(false)

  function handleOpenAuth() {
    setShowAuth(true)
  }

  return (
    <div className="home-shell">
      <SiteHeader
        isPaid={false}
        onOpenAuth={handleOpenAuth}
      />

      <main>{children}</main>

      <SiteFooter />

      {showAuth ? <AuthModal onClose={() => setShowAuth(false)} /> : null}
    </div>
  )
}