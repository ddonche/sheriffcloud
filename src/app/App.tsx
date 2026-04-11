import { Suspense, lazy } from "react"
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom"
import { resolveSurface } from "./HostResolver"

const SheriffFrontApp = lazy(() => import("../front/sheriff/SheriffFrontApp"))
const AdminRoot = lazy(() => import("../admin/AdminRoot"))
const SpurApp = lazy(() => import("../front/spur/SpurApp"))
const SiteApp = lazy(() => import("../site/SiteApp"))

function LoadingScreen() {
  return (
    <div style={{ padding: 40, fontSize: 24 }}>
      Loading…
    </div>
  )
}

function AppRoutes() {
  const location = useLocation()
  const hostname = window.location.hostname
  const pathname = location.pathname
  const surface = resolveSurface(hostname, pathname)

  const isAdminHost =
    hostname === "admin.localhost" ||
    hostname === "admin.sheriffcloud.com"

  if (surface === "admin") {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {isAdminHost ? (
            <Route path="/*" element={<AdminRoot />} />
          ) : (
            <>
              <Route path="/admin" element={<AdminRoot />} />
              <Route path="/admin/*" element={<AdminRoot />} />
            </>
          )}
        </Routes>
      </Suspense>
    )
  }

  if (surface === "site") {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/*" element={<SiteApp />} />
        </Routes>
      </Suspense>
    )
  }

  if (surface === "spur") {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/spur" element={<SpurApp />} />
          <Route path="/spur/*" element={<SpurApp />} />
          <Route path="/*" element={<SpurApp />} />
        </Routes>
      </Suspense>
    )
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/*" element={<SheriffFrontApp />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}