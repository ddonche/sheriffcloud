import type { ReactNode } from "react"
import SiteHeader from "../components/SiteHeader"
import SiteFooter from "../components/SiteFooter"

type PageShellProps = {
  children: ReactNode
}

export default function PageShell({ children }: PageShellProps) {
  return (
    <div className="home-shell">
      <SiteHeader isPaid={false} />
      <main>{children}</main>
      <SiteFooter />
    </div>
  )
}