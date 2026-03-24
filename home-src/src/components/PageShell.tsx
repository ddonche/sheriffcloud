import type { ReactNode } from "react"
import SiteHeader from "./SiteHeader"
import SiteFooter from "./SiteFooter"

export default function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="home-shell">
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  )
}